// lib/kbrandlab/local/types.ts
// 로컬레이다 (LocalRadar · 소상공인 AI 로컬 탐색 스캔) 도메인 타입 정의
// 근거: ADR-0025, PRD FR-93 ~ FR-96
// 방화벽 규칙(INV-17): 공익 측정(probe_*, observe_*, PublicMetricPair) 타입과 혼합하지 않는다.

export type LocalCohortId = 'SEOGWIPO_STAY' | 'GANGNAM_SMB' | 'EUNPYEONG_LOCAL';

export type LocalLanguage = 'ko' | 'en' | 'ja' | 'zh-Hans';

export type SponsorStatus =
  | 'self_funded'
  | 'foundation_sponsored'
  | 'public_corp_sponsored';

/**
 * 상시 탐색 스캔 4주 12회 창 상태 (ADR-0024, FR-95)
 */
export type LocalWindowState = '신규' | '안정' | '가끔' | '드묾' | '소멸' | '미등장';

/**
 * 소상공인 헛걸음 위험 5대 고위험 영업 사실 항목 (FR-96)
 */
export type HighRiskFactKey =
  | 'hours_holiday'   // 1. 영업시간·정기휴무·브레이크타임
  | 'price_menu'      // 2. 대표 메뉴/객실·시술 가격 및 추가 요금
  | 'booking_method'  // 3. 예약 방법·워크인 가능 여부·취소 규정
  | 'parking_access'  // 4. 주차 가능 여부·대중교통 접근성
  | 'pet_kids_policy'; // 5. 반려동물·영유아 동반·외국어 응대 규정

export interface LocalCohort {
  cohortId: LocalCohortId;
  name: string;
  regionLabel: string;
  sectorLabel: string;
  description: string;
  sponsorStatus: SponsorStatus;
  sponsorOrgName: string | null;
  allowFuturePublicCorpSponsor: boolean;
  disclosureNote: string;
  monthlyPriceKrw: number;
  precisionPackPriceKrw: number;
}

export interface LocalCanonicalFact {
  factKey: HighRiskFactKey;
  factLabel: string;
  canonicalValue: string;
  acceptableTokens: readonly string[];
  forbiddenTokens: readonly string[];
  sourceUrl: string;
  ownerVerifiedAt: string;
}

export interface LocalShop {
  shopId: string;
  cohortId: LocalCohortId;
  shopCode: string;
  shopName: string;
  category: string;
  neighborhood: string;
  aliases: readonly string[];
  /** 동명이인 매장 구분용 지역·상권 문맥 토큰 (±20자 윈도우 검사) */
  disambiguationTokens: readonly string[];
  canonicalDomain: string;
  placeUrl: string;
  bookingUrl: string;
  isMedicalRegulated: boolean;
  licenseVerified: boolean;
  facts: readonly LocalCanonicalFact[];
  /** 최근 4주(12회) 언어별 탐색 스캔 등장 이력 (boolean[12]: 0..5 전반 6회, 6..11 후반 6회) */
  recentDiscoveryHistoryByLang: Record<LocalLanguage, readonly boolean[]>;
}

export interface LocalDiscoveryProbe {
  probeId: string;
  cohortId: LocalCohortId;
  intentCategory: string;
  questions: Record<LocalLanguage, string>;
}

export interface ShopDiscoveryMatch {
  shopId: string;
  shopCode: string;
  shopName: string;
  cohortId: LocalCohortId;
  matchedTerm: string;
  positionIndex: number;
  s1InSearch: boolean;
  s2Cited: boolean;
  s3FirstCited: boolean;
  citedUrl: string | null;
}

export type LocalFactVerdict = 'matched' | 'wrong' | 'unverifiable' | 'not_cited';

export interface LocalFactEvaluation {
  shopId: string;
  shopName: string;
  factKey: HighRiskFactKey;
  factLabel: string;
  canonicalValue: string;
  s1InSearch: boolean;
  s2Cited: boolean;
  s3FirstCited: boolean;
  s4Verdict: LocalFactVerdict;
  /** 영업시간·휴무·가격·예약·주차 등 손님의 헛걸음/금전 손실을 유발하는 오답 여부 */
  walkAwayRisk: boolean;
  /** 예약·플레이스·공식 안내 링크가 실제로 연결되었는가 */
  bookingConnected: boolean;
  rawHash: string;
  minimalQuote: string;
}

export interface NamedShopCohortRow {
  shopId: string;
  shopCode: string;
  shopName: string;
  category: string;
  neighborhood: string;
  isMedicalRegulated: boolean;
  windowStateByLang: Record<LocalLanguage, LocalWindowState>;
  highestStageReached: 'S4' | 'S3' | 'S2' | 'S1' | 'NONE';
  officialOrPlaceCitationRatePct: number;
  walkAwayRiskCount: number;
  totalHighRiskFacts: number;
  bookingConnected: boolean;
}
