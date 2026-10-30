// lib/kbrandlab/local/shop-matcher.ts
// 로컬레이다 (LocalRadar) 코호트 공유 탐색 스캔 가게 실명 추출기 및 4주 12회 창 상태 산출기
// 근거: ADR-0025, PRD FR-94, FR-95, INV-3 (가나다순·코드순 무순위 정렬)

import { LOCAL_SHOPS } from './constants';
import { evaluateShopAllFacts } from './fact-scanner';
import type {
  LocalCohortId,
  LocalLanguage,
  LocalShop,
  LocalWindowState,
  NamedShopCohortRow,
  ShopDiscoveryMatch,
} from './types';

const ALLOWED_SHOP_SORT_KEYS = new Set(['name', 'code']);

function normalizeHost(urlOrDomain: string): string {
  try {
    const withProto = urlOrDomain.startsWith('http') ? urlOrDomain : `https://${urlOrDomain}`;
    return new URL(withProto).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return urlOrDomain.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].toLowerCase();
  }
}

function urlMatchesShop(url: string, shop: LocalShop): boolean {
  const lowerUrl = url.toLowerCase();
  const canonicalHost = normalizeHost(shop.canonicalDomain);
  if (canonicalHost && normalizeHost(url) === canonicalHost) {
    return true;
  }
  if (shop.placeUrl && lowerUrl.includes(shop.placeUrl.toLowerCase())) {
    return true;
  }
  if (shop.bookingUrl && lowerUrl.includes(shop.bookingUrl.toLowerCase())) {
    return true;
  }
  return false;
}

/**
 * 4주 12회 탐색 스캔 이력(boolean[12])에서 창 상태를 결정론적으로 산출한다 (ADR-0024, FR-95)
 */
export function computeLocalWindowState(appearances: readonly boolean[]): LocalWindowState {
  if (appearances.length !== 12) {
    throw new Error(`4주 창 상태 산출은 정확히 12회 이력이 필요합니다 (입력: ${appearances.length}회)`);
  }
  const firstHalf = appearances.slice(0, 6).filter(Boolean).length;
  const secondHalf = appearances.slice(6, 12).filter(Boolean).length;
  const total = firstHalf + secondHalf;

  if (total === 0) return '미등장';
  if (firstHalf === 0 && secondHalf >= 3) return '신규';
  if (firstHalf >= 3 && secondHalf === 0) return '소멸';
  if (total >= 9) return '안정';
  if (total >= 4) return '가끔';
  return '드묾';
}

/**
 * 코호트 공유 소비자 탐색 스캔 응답에서 등장한 가게 실명과 S1~S3 출처 단계를 추출한다.
 * - 최장 별칭 우선 매칭 + 동명이인 방지용 ±20자 지역 문맥 확인
 */
export function extractNamedShopsFromDiscoveryResponse(params: {
  cohortId: LocalCohortId;
  responseText: string;
  searchUrls: readonly string[];
  citedUrls: readonly string[];
  shops?: readonly LocalShop[];
}): ShopDiscoveryMatch[] {
  const { cohortId, responseText, searchUrls, citedUrls } = params;
  const cohortShops = (params.shops ?? LOCAL_SHOPS).filter((s) => s.cohortId === cohortId);

  const matches: ShopDiscoveryMatch[] = [];

  for (const shop of cohortShops) {
    // 가게 정식 명칭 + 별칭을 길이 역순(최장 일치 우선)으로 정렬
    const candidateTerms = [shop.shopName, ...shop.aliases]
      .map((t) => t.trim())
      .filter((t) => t.length >= 2)
      .sort((a, b) => b.length - a.length);

    let matchedTerm: string | null = null;
    let positionIndex = -1;

    for (const term of candidateTerms) {
      const idx = responseText.indexOf(term);
      if (idx !== -1) {
        // 짧은 약칭(4자 이하)인 경우 ±20자 문맥 안에 disambiguationTokens 중 하나가 있거나 정식 상호가 포함되어야 인정
        if (term.length <= 4 && shop.disambiguationTokens.length > 0) {
          const start = Math.max(0, idx - 20);
          const end = Math.min(responseText.length, idx + term.length + 20);
          const windowText = responseText.slice(start, end);
          const hasContext = shop.disambiguationTokens.some((tok) => windowText.includes(tok));
          if (!hasContext) continue;
        }
        matchedTerm = term;
        positionIndex = idx;
        break;
      }
    }

    if (!matchedTerm || positionIndex < 0) continue;

    const s1MatchingUrls = searchUrls.filter((u) => urlMatchesShop(u, shop));
    const s2MatchingUrls = citedUrls.filter((u) => urlMatchesShop(u, shop));
    const s1InSearch = s1MatchingUrls.length > 0 || s2MatchingUrls.length > 0;
    const s2Cited = s2MatchingUrls.length > 0;
    const s3FirstCited =
      s2Cited && citedUrls.length > 0 && urlMatchesShop(citedUrls[0], shop);

    matches.push({
      shopId: shop.shopId,
      shopCode: shop.shopCode,
      shopName: shop.shopName,
      cohortId: shop.cohortId,
      matchedTerm,
      positionIndex,
      s1InSearch,
      s2Cited,
      s3FirstCited,
      citedUrl: s2MatchingUrls[0] ?? s1MatchingUrls[0] ?? null,
    });
  }

  // INV-3: 등장 순서나 점수로 서열화하지 않고 가나다순(shopName)으로 반환한다
  return matches.sort((a, b) => a.shopName.localeCompare(b.shopName, 'ko'));
}

/**
 * 코호트 내 가게 실명 비교 표를 생성한다 (결정 4 반영: 가게 실명까지 표시, 가나다순·코드순 무순위 정렬)
 */
export function buildNamedShopCohortTable(params: {
  cohortId: LocalCohortId;
  sortBy?: string;
  shops?: readonly LocalShop[];
}): NamedShopCohortRow[] {
  const sortKey = params.sortBy ?? 'name';
  if (!ALLOWED_SHOP_SORT_KEYS.has(sortKey)) {
    throw new Error(
      `INV-3 위반: 매장 목록은 점수·측정값으로 정렬할 수 없습니다. 허용 정렬 키: name, code (요청: ${sortKey})`,
    );
  }

  const cohortShops = (params.shops ?? LOCAL_SHOPS).filter(
    (s) => s.cohortId === params.cohortId,
  );

  const rows: NamedShopCohortRow[] = cohortShops.map((shop) => {
    const windowStateByLang: Record<LocalLanguage, LocalWindowState> = {
      ko: computeLocalWindowState(shop.recentDiscoveryHistoryByLang.ko),
      en: computeLocalWindowState(shop.recentDiscoveryHistoryByLang.en),
      ja: computeLocalWindowState(shop.recentDiscoveryHistoryByLang.ja),
      'zh-Hans': computeLocalWindowState(shop.recentDiscoveryHistoryByLang['zh-Hans']),
    };

    const factEvaluations = evaluateShopAllFacts(shop);
    const totalHighRiskFacts = factEvaluations.length;
    const citedCount = factEvaluations.filter((e) => e.s2Cited).length;
    const matchedCount = factEvaluations.filter((e) => e.s4Verdict === 'matched').length;
    const walkAwayRiskCount = factEvaluations.filter((e) => e.walkAwayRisk).length;
    const bookingConnected = factEvaluations.some((e) => e.bookingConnected);

    let highestStageReached: 'S4' | 'S3' | 'S2' | 'S1' | 'NONE' = 'NONE';
    if (matchedCount > 0) highestStageReached = 'S4';
    else if (factEvaluations.some((e) => e.s3FirstCited)) highestStageReached = 'S3';
    else if (citedCount > 0) highestStageReached = 'S2';
    else if (factEvaluations.some((e) => e.s1InSearch)) highestStageReached = 'S1';

    const officialOrPlaceCitationRatePct =
      totalHighRiskFacts > 0 ? Math.round((citedCount / totalHighRiskFacts) * 100) : 0;

    return {
      shopId: shop.shopId,
      shopCode: shop.shopCode,
      shopName: shop.shopName,
      category: shop.category,
      neighborhood: shop.neighborhood,
      isMedicalRegulated: shop.isMedicalRegulated,
      windowStateByLang,
      highestStageReached,
      officialOrPlaceCitationRatePct,
      walkAwayRiskCount,
      totalHighRiskFacts,
      bookingConnected,
    };
  });

  return rows.sort((a, b) => {
    if (sortKey === 'code') {
      return a.shopCode.localeCompare(b.shopCode, 'en');
    }
    return a.shopName.localeCompare(b.shopName, 'ko');
  });
}
