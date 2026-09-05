// supabase/functions/_shared/robots-parser.ts
// K03 측정 명세 및 SDD 1.3, 3.2 기반 robots.txt 파서

export type RobotsVerdict =
  | 'open'
  | 'blocked_all'
  | 'blocked_selective'
  | 'no_file'
  | 'undetermined';

export type UndeterminedReason =
  | 'timeout'
  | 'malformed'
  | 'parse_fail'
  | 'shared_domain'
  | 'dns_fail'
  | 'other';

export interface ParseResult {
  verdict: RobotsVerdict;
  reason?: UndeterminedReason;
  aiAgents: Record<string, string>;
  sitemapDeclared?: boolean;
  sitemapUrl?: string;
}

const TARGET_AGENTS = [
  'KPlaceLabBot',
  'GPTBot',
  'ClaudeBot',
  'PerplexityBot',
  'Applebot-Extended',
  'Google-Extended',
  'CCBot',
  'cohere-ai',
];

export function parseRobotsTxt(content: string, httpStatus: number): ParseResult {
  // 404 또는 미발견
  if (httpStatus === 404) {
    return {
      verdict: 'no_file',
      aiAgents: {},
      sitemapDeclared: false,
    };
  }

  // 5xx 또는 기타 에러
  if (httpStatus >= 500) {
    return {
      verdict: 'undetermined',
      reason: 'timeout',
      aiAgents: {},
    };
  }

  if (httpStatus !== 200) {
    return {
      verdict: 'undetermined',
      reason: 'other',
      aiAgents: {},
    };
  }

  // K03 명세: 첫 1KB 내 HTML 태그 검출 시 malformed (홈페이지 반환 등)
  const firstKb = content.slice(0, 1024).toLowerCase();
  if (
    firstKb.includes('<!doctype html') ||
    firstKb.includes('<html') ||
    firstKb.includes('<head') ||
    firstKb.includes('<body')
  ) {
    return {
      verdict: 'undetermined',
      reason: 'malformed',
      aiAgents: {},
    };
  }

  const lines = content.split(/\r?\n/);
  const agentRules: Record<string, { allow: string[]; disallow: string[] }> = {};
  let currentAgents: string[] = [];
  let sitemapUrl: string | undefined = undefined;

  for (let line of lines) {
    line = line.trim();
    // 주석 제거
    const commentIdx = line.indexOf('#');
    if (commentIdx >= 0) {
      line = line.slice(0, commentIdx).trim();
    }
    if (!line) continue;

    const parts = line.split(':');
    if (parts.length < 2) continue;

    const directive = parts[0].trim().toLowerCase();
    const value = parts.slice(1).join(':').trim();

    if (directive === 'sitemap') {
      sitemapUrl = value;
      continue;
    }

    if (directive === 'user-agent') {
      const ua = value.toLowerCase();
      currentAgents = [ua];
      if (!agentRules[ua]) {
        agentRules[ua] = { allow: [], disallow: [] };
      }
    } else if (directive === 'disallow') {
      for (const ua of currentAgents) {
        if (agentRules[ua]) {
          agentRules[ua].disallow.push(value);
        }
      }
    } else if (directive === 'allow') {
      for (const ua of currentAgents) {
        if (agentRules[ua]) {
          agentRules[ua].allow.push(value);
        }
      }
    }
  }

  // AI 에이전트별 허용/차단 평가
  const aiAgentsVerdict: Record<string, string> = {};
  const wildcardRule = agentRules['*'];

  for (const agent of TARGET_AGENTS) {
    const specificRule = agentRules[agent.toLowerCase()];
    const rule = specificRule || wildcardRule;

    if (!rule) {
      aiAgentsVerdict[agent] = 'allow';
      continue;
    }

    const hasRootDisallow = rule.disallow.some((p) => p === '/' || p === '/*');
    const hasRootAllow = rule.allow.some((p) => p === '/' || p === '/*');

    if (hasRootDisallow && !hasRootAllow) {
      aiAgentsVerdict[agent] = 'disallow_all';
    } else if (rule.disallow.length > 0) {
      aiAgentsVerdict[agent] = 'disallow_partial';
    } else {
      aiAgentsVerdict[agent] = 'allow';
    }
  }

  // 종합 판정 결정
  // 1. KPlaceLabBot 또는 * 가 전체 차단인 경우 -> blocked_all
  const kplacelabRule = aiAgentsVerdict['KPlaceLabBot'];
  const allDisallowed = Object.values(aiAgentsVerdict).every(
    (v) => v === 'disallow_all'
  );
  const someDisallowed = Object.values(aiAgentsVerdict).some(
    (v) => v === 'disallow_all' || v === 'disallow_partial'
  );

  let finalVerdict: RobotsVerdict = 'open';
  if (allDisallowed || kplacelabRule === 'disallow_all') {
    finalVerdict = 'blocked_all';
  } else if (someDisallowed) {
    finalVerdict = 'blocked_selective';
  }

  return {
    verdict: finalVerdict,
    aiAgents: aiAgentsVerdict,
    sitemapDeclared: !!sitemapUrl,
    sitemapUrl,
  };
}
