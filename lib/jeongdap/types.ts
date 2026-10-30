// lib/jeongdap/types.ts
// 출처:
// - docs/IMPLEMENTATION-PLAN-jeongdap-note.md §3, §5, §10, §12
// - docs/adr/0014 ~ 0024
// - AGENTS.md v2.0 INV-1 ~ INV-18

declare const metricBrand: unique symbol;

export type JeongdapPopulation = 'metro' | 'basic' | 'special_zone';
export type JeongdapUnitKind = 'national' | 'metro' | 'basic' | 'emd' | 'special_zone';

export type OfficialDomainKind =
  | 'self'          // 해당 기관
  | 'metro'         // 소관 광역
  | 'central'       // 중앙행정기관 (.go.kr, gov.kr 등)
  | 'linked_agency' // 산하·연결 공공기관
  | 'culture'       // 문화·관광 공식 포털
  | 'other';        // 비공식 / 그 밖

export type Stage4Category =
  | 'present_match'         // 있음/맞음
  | 'differ'                // 다름
  | 'no_info'               // 정보 없음
  | 'undetermined_page_ok'  // 원인 미확정 — 페이지는 정합
  | 'official_conflict'     // 공식 간 상충
  | 'supply_gap'            // 공급 공백 (분모 제외)
  | 'not_applicable'        // 해당 없음 (분모 제외)
  | 'pending';              // 사람 판정 대기 / 보류

export type AutoStage4Candidate =
  | 'match_candidate'    // 맞음 후보
  | 'mismatch_candidate' // 다름 후보
  | 'supply_gap'         // 공급 공백
  | 'not_applicable'     // 해당 없음
  | 'pending';           // 보류

export type RiskLevel = 'high' | 'medium' | 'low';

export type PlaceboKind =
  | 'fictional_entity'       // 허구 개체 10
  | 'other_region_entity'    // 타 권역 실재 개체 10
  | 'similar_name_entity';   // 이름이 비슷한 타 지역 개체 10

export type WindowState =
  | '신규'
  | '안정'
  | '가끔'
  | '소멸'
  | '드묾';

export type BandKey = 'high' | 'mid' | 'low';
export type BandLabel = '공식 근거 많음' | '보통' | '공식 근거 적음';
export type BandMovement = 'up' | 'down' | 'same' | 'initial';

export type PagePublicationState =
  | 'before_measurement' // 측정 전
  | 'measuring'          // 측정 중
  | 'published'          // 발행됨
  | 'corrected';         // 정정됨 (엠바고·기관 확인 상태는 ADR-0016 으로 폐지)

// INV-13: 정밀 측정 요청 프로필 — instructions(시스템 프롬프트) 및 위치 신호 금지
export interface JeongdapPrecisionRequestProfile {
  readonly profileId: string;
  readonly model: string;
  readonly tools: readonly [{ readonly type: 'web_search' }];
  readonly include: readonly ['web_search_call.action.sources'];
  readonly hasInstructions: false;
  readonly locationSignal: false;
}

// 회차·측정 조건 필수 표기 스탬프 (INV-7, INV-14, §12 RoundStamp)
export interface RoundStampData {
  roundLabel: string;       // 예: "2026년 10월 0단계 파일럿"
  measuredDates: string;    // 예: "2026-10-27 ~ 10-29"
  modelVersion: string;     // 예: "gpt-5"
  searchToolVersion: string; // 예: "web_search (Responses API)"
  methodVersion: string;    // 예: "jeongdap-v1.0"
  observationBasis: 'API 기준 관측';
  locationSignal: false;
  preregId: string;
}

// INV-9, INV-14: 공개 머리 지표는 반드시 공식 근거율과 피해 위험 건수 쌍으로만 반환한다.
// 종합 점수(score), 순위(rank), 단일 정답률(accuracy) 필드는 둘 수 없다.
export interface PublicMetricPair {
  readonly [metricBrand]?: 'jeongdap_public_metric_pair';
  readonly population: 'metro' | 'basic';
  readonly officialSourceRate: {
    readonly rate: number;         // 0..1
    readonly ci95Low: number;      // 0..1
    readonly ci95High: number;     // 0..1
    readonly numerator: number;    // 공식 첫 인용 회차 수
    readonly denominator: number;  // 공급 공백·해당 없음 제외 회차 수
    readonly supplyGapCount: number;
    readonly notApplicableCount: number;
    readonly totalReps: number;
  };
  readonly harmRiskCount: {
    readonly count: number;                // 행동 피해 가능 문항 수
    readonly highRiskQuestionTotal: number; // 고위험 문항 분모
    readonly excludesDisasterSafety: true; // 재난·안전 제외 필수 표기 (INV-16)
  };
  readonly roundStamp: RoundStampData;
}

// 관찰 측정(OpenAI 외 2곳 소표본)은 정밀 측정과 절대 합산하지 않는다 (INV-4, ADR-0019)
export interface ObservationServiceStat {
  readonly [metricBrand]?: 'observation_service_stat';
  readonly maskedLabel: '서비스 A' | '서비스 B';
  readonly sampleQuestionCount: number;
  readonly language: 'ko' | 'en';
  readonly stage3Count: number;
  readonly note: '정밀 측정과 합산하지 않습니다';
}

// 구간 지도 항목 — 구간 내 가나다순 무순위, 점수·석차 없음 (INV-3, ADR-0018)
export interface BandUnitEntry {
  unitId: string;
  name: string;
  population: 'metro' | 'basic';
  band: BandKey;
  bandLabel: BandLabel;
  movement: BandMovement;
  hasRepairEventRegistered: boolean;
}
