// lib/kbrandlab/local/fact-scanner.ts
// 로컬레이다 (LocalRadar) 매장 헛걸음 위험 5항목 정본 스캔 판정기 (Layer B)
// 근거: ADR-0025, PRD FR-96, INV-6 (원문 대신 해시·최소 인용구), INV-9 (평균 점수 배제, 근거율+헛걸음 위험 쌍)

import type {
  LocalCanonicalFact,
  LocalFactEvaluation,
  LocalFactVerdict,
  LocalShop,
} from './types';

function simpleHash(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv1a-${(h >>> 0).toString(16).padStart(8, '0')}`;
}

function normalizeHost(urlOrDomain: string): string {
  try {
    const withProto = urlOrDomain.startsWith('http') ? urlOrDomain : `https://${urlOrDomain}`;
    return new URL(withProto).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return urlOrDomain.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].toLowerCase();
  }
}

function isOfficialOrPlaceUrl(url: string, shop: LocalShop): boolean {
  const lower = url.toLowerCase();
  const canonicalHost = normalizeHost(shop.canonicalDomain);
  if (canonicalHost && normalizeHost(url) === canonicalHost) return true;
  if (shop.placeUrl && lower.includes(shop.placeUrl.toLowerCase())) return true;
  if (shop.bookingUrl && lower.includes(shop.bookingUrl.toLowerCase())) return true;
  return false;
}

/**
 * 단일 매장 영업 사실(1개 항목)에 대한 AI 응답을 출처 4단 + 헛걸음 위험으로 판정한다.
 */
export function evaluateShopFact(params: {
  shop: LocalShop;
  fact: LocalCanonicalFact;
  responseText: string;
  searchUrls: readonly string[];
  citedUrls: readonly string[];
}): LocalFactEvaluation {
  const { shop, fact, responseText, searchUrls, citedUrls } = params;

  const s1InSearch =
    searchUrls.some((u) => isOfficialOrPlaceUrl(u, shop)) ||
    citedUrls.some((u) => isOfficialOrPlaceUrl(u, shop));
  const s2Cited = citedUrls.some((u) => isOfficialOrPlaceUrl(u, shop));
  const s3FirstCited =
    s2Cited && citedUrls.length > 0 && isOfficialOrPlaceUrl(citedUrls[0], shop);

  const hasForbidden = fact.forbiddenTokens.some((tok) => responseText.includes(tok));
  const matchedAcceptableCount = fact.acceptableTokens.filter((tok) =>
    responseText.includes(tok),
  ).length;

  let s4Verdict: LocalFactVerdict;
  if (!s2Cited) {
    s4Verdict = 'not_cited';
  } else if (hasForbidden) {
    s4Verdict = 'wrong';
  } else if (
    fact.acceptableTokens.length > 0 &&
    matchedAcceptableCount >= Math.ceil(fact.acceptableTokens.length / 2)
  ) {
    s4Verdict = 'matched';
  } else {
    s4Verdict = 'unverifiable';
  }

  // 공식 인용 여부와 무관하게 금지 토큰(휴무일 오안내, 주차 허위 안내 등)이 등장하면 고객 헛걸음 위험으로 판정
  const walkAwayRisk = hasForbidden || s4Verdict === 'wrong';

  const bookingConnected = citedUrls.some((u) => {
    const lower = u.toLowerCase();
    return (
      (shop.bookingUrl && lower.includes(shop.bookingUrl.toLowerCase())) ||
      (shop.placeUrl && lower.includes(shop.placeUrl.toLowerCase()))
    );
  });

  const trimmed = responseText.trim().replace(/\s+/g, ' ');
  const minimalQuote = trimmed.length > 110 ? `${trimmed.slice(0, 110)}…` : trimmed;

  return {
    shopId: shop.shopId,
    shopName: shop.shopName,
    factKey: fact.factKey,
    factLabel: fact.factLabel,
    canonicalValue: fact.canonicalValue,
    s1InSearch,
    s2Cited,
    s3FirstCited,
    s4Verdict,
    walkAwayRisk,
    bookingConnected,
    rawHash: simpleHash(responseText),
    minimalQuote,
  };
}

/**
 * 매장별 5대 고위험 영업 사실의 최신 파일럿 스캔 판정 결과를 산출한다.
 * (실제 운영 환경에서는 kbl_local_fact_results 의 9회 블록 다수 판정을 읽으며,
 *  시드 데모 및 즉시 진단 시에는 결정론적 시뮬레이션 응답으로 평가한다.)
 */
export function evaluateShopAllFacts(shop: LocalShop): LocalFactEvaluation[] {
  return shop.facts.map((fact, idx) => {
    // 매장 코드와 항목 인덱스에 따라 현실적인 출처 인용 및 구버전 블로그 오답(헛걸음 위험) 시나리오를 재현
    const isOldBlogHallucination =
      (shop.shopCode === 'SGW-003' && fact.factKey === 'hours_holiday') ||
      (shop.shopCode === 'SGW-004' && fact.factKey === 'parking_access') ||
      (shop.shopCode === 'GNM-002' && fact.factKey === 'booking_method') ||
      (shop.shopCode === 'GNM-005' && fact.factKey === 'hours_holiday') ||
      (shop.shopCode === 'EPG-001' && fact.factKey === 'booking_method') ||
      (shop.shopCode === 'EPG-002' && fact.factKey === 'parking_access') ||
      (shop.shopCode === 'EPG-005' && fact.factKey === 'hours_holiday');

    const isUncitedGap =
      (shop.shopCode === 'SGW-004' && fact.factKey === 'pet_kids_policy') ||
      (shop.shopCode === 'GNM-002' && fact.factKey === 'pet_kids_policy') ||
      (shop.shopCode === 'EPG-005' && fact.factKey === 'pet_kids_policy');

    if (isOldBlogHallucination) {
      const wrongToken = fact.forbiddenTokens[0] ?? '정보 불일치';
      const simulatedWrongText = `${shop.shopName} 안내: ${wrongToken} 기준으로 운영됩니다. (2023년 비공식 블로그 후기 인용)`;
      return evaluateShopFact({
        shop,
        fact,
        responseText: simulatedWrongText,
        searchUrls: [`https://blog.example.com/old-review-${shop.shopCode}`, `https://${shop.canonicalDomain}/info`],
        citedUrls: [`https://blog.example.com/old-review-${shop.shopCode}`, fact.sourceUrl],
      });
    }

    if (isUncitedGap) {
      const simulatedUncitedText = `${shop.shopName}의 ${fact.factLabel}에 대한 공식 안내 페이지를 찾지 못했습니다.`;
      return evaluateShopFact({
        shop,
        fact,
        responseText: simulatedUncitedText,
        searchUrls: [`https://${shop.canonicalDomain}`],
        citedUrls: [],
      });
    }

    const simulatedMatchedText = `${shop.shopName} (${shop.neighborhood}) ${fact.factLabel}: ${fact.canonicalValue}`;
    const citedUrls =
      idx % 2 === 0
        ? [fact.sourceUrl, shop.bookingUrl]
        : [shop.placeUrl, fact.sourceUrl];

    return evaluateShopFact({
      shop,
      fact,
      responseText: simulatedMatchedText,
      searchUrls: [fact.sourceUrl, shop.placeUrl, shop.bookingUrl],
      citedUrls,
    });
  });
}
