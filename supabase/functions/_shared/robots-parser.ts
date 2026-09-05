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
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'Google-Extended',
  'Gemini',
  'PerplexityBot',
  'Bytespider',
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

  let totalNonEmptyLines = 0;
  let validDirectiveCount = 0;
  let previousDirective = '';

  for (let line of lines) {
    line = line.trim();
    // 주석 제거
    const commentIdx = line.indexOf('#');
    if (commentIdx >= 0) {
      line = line.slice(0, commentIdx).trim();
    }
    if (!line) continue;

    totalNonEmptyLines++;

    const parts = line.split(':');
    if (parts.length < 2) continue;

    const directive = parts[0].trim().toLowerCase();
    const value = parts.slice(1).join(':').trim();

    if (['user-agent', 'allow', 'disallow', 'sitemap', 'crawl-delay'].includes(directive)) {
      validDirectiveCount++;
    }

    if (directive === 'sitemap') {
      sitemapUrl = value;
      previousDirective = directive;
      continue;
    }

    if (directive === 'user-agent') {
      if (previousDirective !== 'user-agent') {
        currentAgents = [];
      }
      const ua = value.toLowerCase();
      currentAgents.push(ua);
      if (!agentRules[ua]) {
        agentRules[ua] = { allow: [], disallow: [] };
      }
      previousDirective = 'user-agent';
    } else if (directive === 'disallow') {
      for (const ua of currentAgents) {
        if (agentRules[ua] && value !== '') {
          agentRules[ua].disallow.push(value);
        }
      }
      previousDirective = 'disallow';
    } else if (directive === 'allow') {
      for (const ua of currentAgents) {
        if (agentRules[ua]) {
          agentRules[ua].allow.push(value);
        }
      }
      previousDirective = 'allow';
    } else {
      previousDirective = directive;
    }
  }

  // C-05: parse_fail 판정
  // 유효한 지시어의 비율이 절반 미만이면 파싱 실패로 간주 (가비지 데이터)
  if (totalNonEmptyLines > 0 && validDirectiveCount / totalNonEmptyLines < 0.5) {
    return {
      verdict: 'undetermined',
      reason: 'parse_fail',
      aiAgents: {},
    };
  }

  // AI 에이전트별 허용/차단 평가
  const aiAgentsVerdict: Record<string, string> = {};
  const wildcardRule = agentRules['*'];

  for (const agent of [...TARGET_AGENTS, 'KPlaceLabBot']) {
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
  
  // H-10: 결과 객체에는 KPlaceLabBot을 제외 (AI 에이전트 목록이 아니므로)
  delete aiAgentsVerdict['KPlaceLabBot'];

  const allDisallowed = Object.values(aiAgentsVerdict).every(
    (v) => v === 'disallow_all'
  );
  // C-04: disallow_partial은 차단으로 세지 않음
  const someDisallowed = Object.values(aiAgentsVerdict).some(
    (v) => v === 'disallow_all'
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
