// lib/jeongdap/cited-page-fetcher.ts
// 출처:
// - docs/IMPLEMENTATION-PLAN-jeongdap-note.md §11.1 (인용 페이지 확인 수집기)
// - AGENTS.md v2.0 INV-5 (차단 우회 금지, SCANNER_UA, 최소 간격 1.5초), INV-6 (본문 해시만 공개 기록)

import crypto from 'crypto';
import {
  CITED_PAGE_MIN_INTERVAL_MS,
  SCANNER_UA,
  SCAN_TIMEOUT_MS,
} from '../constants/scanner';

export interface CitedPageCheckResult {
  url: string;
  host: string;
  checkedAt: string;
  robotsAllowed: boolean;
  httpStatus: number | null;
  contentHashSha256: string | null;
  contentType: string | null;
  error: string | null;
}

const hostLastRequestAt = new Map<string, number>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 동일 호스트에 대해 최소 CITED_PAGE_MIN_INTERVAL_MS(1.5초) 간격을 보장한다 (INV-5).
 */
export async function enforceHostRateLimit(
  host: string,
  minIntervalMs: number = CITED_PAGE_MIN_INTERVAL_MS
): Promise<number> {
  const now = Date.now();
  const prev = hostLastRequestAt.get(host) ?? 0;
  const elapsed = now - prev;
  let waitedMs = 0;
  if (prev > 0 && elapsed < minIntervalMs) {
    waitedMs = minIntervalMs - elapsed;
    await sleep(waitedMs);
  }
  hostLastRequestAt.set(host, Date.now());
  return waitedMs;
}

/**
 * 간단한 robots.txt 파서: User-agent: * 또는 User-agent: JeongdapNoteBot 에 대해
 * Disallow: / 가 설정되어 있으면 false(수집 거부)를 반환한다 (INV-5).
 */
export function isAllowedByRobotsTxt(robotsTxt: string, userAgentToken: string = 'JeongdapNoteBot'): boolean {
  if (!robotsTxt || !robotsTxt.trim()) return true;

  const lines = robotsTxt
    .split(/\r?\n/)
    .map((l) => l.split('#')[0].trim())
    .filter(Boolean);

  let currentAgents: string[] = [];
  let seenDirectiveInBlock = false;
  const rulesByAgent = new Map<string, { allow: string[]; disallow: string[] }>();

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const val = line.slice(colonIdx + 1).trim();

    if (key === 'user-agent') {
      if (seenDirectiveInBlock) {
        currentAgents = [];
        seenDirectiveInBlock = false;
      }
      currentAgents.push(val.toLowerCase());
      if (!rulesByAgent.has(val.toLowerCase())) {
        rulesByAgent.set(val.toLowerCase(), { allow: [], disallow: [] });
      }
    } else if (key === 'disallow' || key === 'allow') {
      seenDirectiveInBlock = true;
      for (const ag of currentAgents) {
        const entry = rulesByAgent.get(ag) ?? { allow: [], disallow: [] };
        if (key === 'disallow' && val) entry.disallow.push(val);
        if (key === 'allow' && val) entry.allow.push(val);
        rulesByAgent.set(ag, entry);
      }
    }
  }

  const targetKey = userAgentToken.toLowerCase();
  const specific = rulesByAgent.get(targetKey);
  const wildcard = rulesByAgent.get('*');
  const applicable = specific ?? wildcard;
  if (!applicable) return true;

  if (applicable.disallow.includes('/') && !applicable.allow.includes('/')) {
    return false;
  }
  return true;
}

/**
 * 인용 URL 단건 확인:
 * 1) robots.txt 확인 후 거부 시 즉시 중단하고 robotsAllowed=false 만 기록 (INV-5)
 * 2) 호스트별 1.5초 간격 준수 및 SCANNER_UA 헤더 고정
 * 3) 본문 전체를 공개 테이블에 남기지 않고 SHA-256 해시만 산출 (INV-6)
 */
export async function verifyCitedPageUrl(
  targetUrl: string,
  fetchImpl: typeof fetch = fetch
): Promise<CitedPageCheckResult> {
  const checkedAt = new Date().toISOString();
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return {
      url: targetUrl,
      host: '',
      checkedAt,
      robotsAllowed: false,
      httpStatus: null,
      contentHashSha256: null,
      contentType: null,
      error: 'invalid_url',
    };
  }

  const host = parsed.hostname.toLowerCase();

  try {
    await enforceHostRateLimit(host);
    const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

    let robotsTxt = '';
    try {
      const rResp = await fetchImpl(robotsUrl, {
        method: 'GET',
        headers: { 'User-Agent': SCANNER_UA },
        signal: controller.signal,
      });
      if (rResp.ok) {
        robotsTxt = await rResp.text();
      }
    } catch {
      // robots.txt 네트워크 실패 시 보수적으로 본문 요청 진행 여부 판단
    } finally {
      clearTimeout(timer);
    }

    if (!isAllowedByRobotsTxt(robotsTxt)) {
      return {
        url: targetUrl,
        host,
        checkedAt,
        robotsAllowed: false,
        httpStatus: null,
        contentHashSha256: null,
        contentType: null,
        error: 'robots_disallowed',
      };
    }

    await enforceHostRateLimit(host);
    const pageCtrl = new AbortController();
    const pageTimer = setTimeout(() => pageCtrl.abort(), SCAN_TIMEOUT_MS);
    try {
      const resp = await fetchImpl(targetUrl, {
        method: 'GET',
        headers: { 'User-Agent': SCANNER_UA },
        signal: pageCtrl.signal,
      });
      const bodyText = await resp.text();
      const hash = crypto.createHash('sha256').update(bodyText, 'utf8').digest('hex');
      return {
        url: targetUrl,
        host,
        checkedAt,
        robotsAllowed: true,
        httpStatus: resp.status,
        contentHashSha256: hash,
        contentType: resp.headers.get('content-type'),
        error: null,
      };
    } finally {
      clearTimeout(pageTimer);
    }
  } catch (err) {
    return {
      url: targetUrl,
      host,
      checkedAt,
      robotsAllowed: true,
      httpStatus: null,
      contentHashSha256: null,
      contentType: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
