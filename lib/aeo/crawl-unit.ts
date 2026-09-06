// lib/aeo/crawl-unit.ts
// 지자체 웹사이트 크롤링 유틸리티
// 불변식: INV-5 (robots.txt 준수, SCANNER_UA 고정, 헤드리스 브라우저 사용 금지)

import { SCANNER_UA } from '../constants/measurement';
import { createHash } from 'crypto';

export interface CrawlResult {
  url: string;
  title: string;
  contentSummary: string; // first 200 chars of text
  contentHash: string;
  ogTags: Record<string, string>;
  jsonLd: object | null;
}

export interface CrawlOptions {
  unitId: string;
  baseUrl: string;        // e.g., 'https://www.suwon.go.kr'
  maxPages?: number;      // default 30
  onProgress?: (crawled: number) => void;
}

/**
 * robots.txt를 확인하여 SCANNER_UA에 대한 접근 허용 여부를 검사
 * INV-5 준수: 차단된 경우 크롤링 진행 금지
 */
async function checkRobotsTxt(origin: string): Promise<boolean> {
  const robotsUrl = `${origin}/robots.txt`;
  try {
    const res = await fetch(robotsUrl, {
      headers: {
        'User-Agent': SCANNER_UA,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (res.status === 404 || res.status === 410) {
      // robots.txt가 없는 경우 크롤링 허용
      return true;
    }

    if (!res.ok) {
      // 403 Forbidden 등으로 robots.txt 접근이 거부된 경우 보수적으로 차단 간주
      console.warn(`[crawlUnit] robots.txt 응답 상태코드 비정상 (${res.status}): ${robotsUrl}`);
      return false;
    }

    const text = await res.text();
    return parseRobotsTxtAllows(text, SCANNER_UA);
  } catch (err: any) {
    console.warn(`[crawlUnit] robots.txt 조회 실패 (${err.message}): ${robotsUrl}`);
    // 조회 실패 시 차단 방지 원칙에 따라 중단
    return false;
  }
}

/**
 * robots.txt 파싱 로직
 * KPlaceLabBot 전용 규칙 우선, 없을 시 wildcard(*) 규칙 적용
 */
function parseRobotsTxtAllows(robotsText: string, ua: string): boolean {
  const lines = robotsText.split(/\r?\n/);
  const botName = 'kplacelabbot';

  let currentAgents: string[] = [];
  const rulesByAgent: Record<string, { disallow: string[]; allow: string[] }> = {};

  for (let rawLine of lines) {
    // 주석 제거
    const commentIdx = rawLine.indexOf('#');
    if (commentIdx !== -1) {
      rawLine = rawLine.slice(0, commentIdx);
    }
    const line = rawLine.trim();
    if (!line) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const directive = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (directive === 'user-agent') {
      const agent = value.toLowerCase();
      currentAgents = [agent];
      if (!rulesByAgent[agent]) {
        rulesByAgent[agent] = { disallow: [], allow: [] };
      }
    } else if (directive === 'disallow' && currentAgents.length > 0) {
      for (const ag of currentAgents) {
        if (!rulesByAgent[ag]) rulesByAgent[ag] = { disallow: [], allow: [] };
        rulesByAgent[ag].disallow.push(value);
      }
    } else if (directive === 'allow' && currentAgents.length > 0) {
      for (const ag of currentAgents) {
        if (!rulesByAgent[ag]) rulesByAgent[ag] = { disallow: [], allow: [] };
        rulesByAgent[ag].allow.push(value);
      }
    }
  }

  // 1. KPlaceLabBot 전용 규칙 확인
  let agentRules = rulesByAgent[botName];
  if (!agentRules) {
    // 부분 일치 탐색
    for (const [key, val] of Object.entries(rulesByAgent)) {
      if (key !== '*' && (botName.includes(key) || key.includes('kplace'))) {
        agentRules = val;
        break;
      }
    }
  }

  // 2. 전용 규칙 없으면 wildcard 확인
  if (!agentRules) {
    agentRules = rulesByAgent['*'];
  }

  if (!agentRules) {
    return true; // 명시적 규칙 없음 -> 허용
  }

  // 사이트 루트(/) 또는 전체 차단 규칙 검사
  const isRootBlocked = agentRules.disallow.some((path) => path === '/' || path === '/*');
  const isRootAllowed = agentRules.allow.some((path) => path === '/' || path === '/*');

  if (isRootBlocked && !isRootAllowed) {
    return false; // 차단됨
  }

  return true;
}

/**
 * HTML 문자열에서 텍스트 정제 및 요약 생성
 */
function extractVisibleText(html: string): string {
  // 스크립트, 스타일, 네비게이션 등 비본문 요소 제거
  let clean = html.replace(/<(script|style|svg|noscript|header|footer|nav)[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  // HTML 태그 제거
  clean = clean.replace(/<[^>]+>/g, ' ');
  // HTML 엔티티 치환
  clean = clean
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  // 공백 압축
  return clean.replace(/\s+/g, ' ').trim();
}

/**
 * HTML에서 제목 추출
 */
function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return '';
  return match[1]
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

/**
 * OpenGraph 태그 추출
 */
function extractOgTags(html: string): Record<string, string> {
  const ogTags: Record<string, string> = {};
  const metaRegex = /<meta\s+[^>]*?(?:property|name)=["']og:([a-zA-Z0-9_:.-]+)["'][^>]*?content=["']([^"']*)["'][^>]*?>|<meta\s+[^>]*?content=["']([^"']*)["'][^>]*?(?:property|name)=["']og:([a-zA-Z0-9_:.-]+)["'][^>]*?>/gi;

  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    const key = match[1] || match[4];
    const val = match[2] || match[3];
    if (key && val) {
      ogTags[key] = val.trim();
    }
  }

  // description 태그도 보조로 포함
  const descMatch = html.match(/<meta\s+[^>]*?name=["']description["'][^>]*?content=["']([^"']*)["']/i);
  if (descMatch && descMatch[1] && !ogTags['description']) {
    ogTags['description'] = descMatch[1].trim();
  }

  return ogTags;
}

/**
 * JSON-LD 스크립트 추출
 */
function extractJsonLd(html: string): object | null {
  const jsonLdRegex = /<script\s+[^>]*?type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch {
      // 유효하지 않은 JSON-LD는 무시하고 다음 스크립트 탐색
    }
  }
  return null;
}

/**
 * 비HTML 확장자 제외 필터
 */
const NON_HTML_EXTENSIONS = /\.(pdf|zip|tar|gz|7z|hwp|hwpx|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif|bmp|webp|svg|ico|mp3|mp4|avi|mov|wmv|css|js|woff|woff2|ttf|eot)$/i;

/**
 * 페이지 내 링크 추출
 */
function extractLinks(html: string, currentUrl: string, baseOrigin: string, baseHost: string): string[] {
  const links: string[] = [];
  const hrefRegex = /<a\s+[^>]*?href=["']([^"'#\s]+)["']/gi;
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    const rawHref = match[1].trim();
    if (!rawHref || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
      continue;
    }

    try {
      const parsedUrl = new URL(rawHref, currentUrl);
      // 동일 호스트 검사 (동일 도메인만 추적)
      if (parsedUrl.hostname !== baseHost) {
        continue;
      }
      // HTTP/HTTPS 프로토콜만 허용
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        continue;
      }
      // 정적 파일 확장자 배제
      if (NON_HTML_EXTENSIONS.test(parsedUrl.pathname)) {
        continue;
      }

      // 앵커 및 쿼리 정규화
      parsedUrl.hash = '';
      const normalized = parsedUrl.toString();
      links.push(normalized);
    } catch {
      // 잘못된 URL 무시
    }
  }

  return links;
}

/**
 * crawlUnit: 지자체 웹사이트 크롤링 유틸리티
 * INV-5: SCANNER_UA 고정, robots.txt 준수, 요청 간 1초 지연
 */
export async function crawlUnit(options: CrawlOptions): Promise<CrawlResult[]> {
  const maxPages = options.maxPages ?? 30;
  let parsedBase: URL;

  try {
    parsedBase = new URL(options.baseUrl);
  } catch (err: any) {
    console.error(`[crawlUnit] 유효하지 않은 baseUrl: ${options.baseUrl}`, err);
    return [];
  }

  const baseOrigin = parsedBase.origin;
  const baseHost = parsedBase.hostname;

  // 1. robots.txt 확인 (INV-5 차단 우회 금지)
  const isAllowed = await checkRobotsTxt(baseOrigin);
  if (!isAllowed) {
    console.warn(`[crawlUnit] 경고: ${baseOrigin}/robots.txt 에 의해 크롤링이 차단되었습니다. 빈 결과를 반환합니다.`);
    return [];
  }

  const results: CrawlResult[] = [];
  const visited = new Set<string>();
  const queue: string[] = [parsedBase.toString()];

  while (queue.length > 0 && results.length < maxPages) {
    const currentUrl = queue.shift()!;
    if (visited.has(currentUrl)) {
      continue;
    }
    visited.add(currentUrl);

    try {
      const res = await fetch(currentUrl, {
        headers: {
          'User-Agent': SCANNER_UA,
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        continue;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        continue;
      }

      const html = await res.text();
      const visibleText = extractVisibleText(html);
      const title = extractTitle(html) || parsedBase.hostname;
      const ogTags = extractOgTags(html);
      const jsonLd = extractJsonLd(html);
      const contentSummary = visibleText.slice(0, 200);
      const contentHash = createHash('sha256').update(visibleText).digest('hex');

      results.push({
        url: currentUrl,
        title,
        contentSummary,
        contentHash,
        ogTags,
        jsonLd,
      });

      options.onProgress?.(results.length);

      // 추가 링크 수집
      if (results.length < maxPages) {
        const foundLinks = extractLinks(html, currentUrl, baseOrigin, baseHost);
        for (const link of foundLinks) {
          if (!visited.has(link) && !queue.includes(link)) {
            queue.push(link);
          }
        }
      }
    } catch (err: any) {
      console.warn(`[crawlUnit] 페이지 수집 실패 (${currentUrl}): ${err.message}`);
    }

    // INV-5: 요청 간 1초 지연 (SCAN_MIN_INTERVAL_MS 존중)
    if (queue.length > 0 && results.length < maxPages) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
