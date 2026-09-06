// lib/types/source-analysis.ts
// 출처: ADR-0011, K03 v2.0, K04 v2.0
// 출처 분석 6축 타입 정의

// ─── 출처 권위도 등급 ───

/** 1차: 해당 지자체 공식 도메인 및 산하 기관 */
/** 2차: 상위 정부·언론사·공공 데이터 포털 */
/** 3차: 블로그·커뮤니티·개인 유튜브 */
export type SourceAuthority = 'official' | 'institutional' | 'user_generated';

// ─── 개별 출처 기록 ───

export interface CitedSource {
  /** 인용된 URL */
  url: string;
  /** 도메인 (e.g., "suwon.go.kr") */
  domain: string;
  /** 권위도 등급 */
  authority: SourceAuthority;
  /** 인용 정보의 추정 게시 일자 (null = 추정 불가) */
  estimated_publish_date: string | null;
  /** 해당 페이지에 JSON-LD 존재 여부 (null = 확인 불가) */
  has_structured_data: boolean | null;
  /** 타 도시/타 기관 경유 여부 */
  is_competitor_source: boolean;
}

// ─── 출처 분석 6축 집계 ───

export interface SourceAnalysis {
  /** S1: 출처 권위도 — 각 등급별 인용 비율 */
  authority_distribution: {
    official: number;      // 0.0 ~ 1.0
    institutional: number;
    user_generated: number;
  };
  /** S2: 출처 시점 — 인용 정보의 중앙 게시 일자 */
  median_publish_date: string | null;
  /** S3: 정본 도달률 — 공식 URL을 최종 안내한 비율 */
  canonical_reach_rate: number;  // 0.0 ~ 1.0
  /** S4: 구조화 데이터 연관 — JSON-LD 존재 페이지의 인용 비율 */
  structured_data_cite_rate: number;  // 0.0 ~ 1.0
  /** S5: 인용 안정성 — 5회 반복 시 동일 출처 인용 비율 */
  citation_stability: number;  // 0.0 ~ 1.0
  /** S6: 경쟁 출처 비율 — 타 도시/타 기관 페이지 경유 비율 */
  competitor_source_rate: number;  // 0.0 ~ 1.0
}

// ─── 문항 결과 (v2.0 단일 관측) ───

/** v1.0의 4단계 판정 + 작화 */
export type Verdict = 'accurate' | 'partial' | 'inaccurate' | 'absent' | 'confabulation';

/** 골격/세부 일치 */
export type MatchResult = 'match' | 'mismatch' | 'not_applicable';

/** Floor Risk 등급 */
export type FloorRisk = 'critical' | 'high' | 'moderate' | 'low';

/** 증상군 (K03 M-2.3.2) */
export type SymptomCode =
  | 'confabulation'
  | 'stale_fact'
  | 'generic_drift'
  | 'cross_unit'
  | 'hypersensitivity'
  | 'unstable_skeleton';

/** 페르소나 ID */
export type PersonaId = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';

/** 질문 유형 */
export type QuestionType =
  | 'eligibility'      // 자격 확인
  | 'fact_check'       // 팩트 확인
  | 'procedure'        // 절차 안내
  | 'existence'        // 존재 확인
  | 'facility_find'    // 시설 찾기
  | 'exploration'      // 탐색
  | 'comparison'       // 비교/추천
  | 'time_sensitive';  // 시점 민감

/** AI 서비스 ID */
export type AiServiceId = 'chatgpt' | 'gemini' | 'perplexity';

/** 단일 관측 기록 (INV-9: 반복 회차별 저장) */
export interface ObservationV2 {
  // ── INV-7 필수 측정 조건 ──
  method_version: 'v2.0';
  ai_service: AiServiceId;
  web_search: 'on' | 'off';
  language: string;
  measured_on: string;  // ISO 8601 date

  // ── 문항 식별 ──
  question_id: string;  // e.g., "P1-01"
  persona: PersonaId;
  question_type: QuestionType;
  unit_id: string;      // e.g., "lg-41110"

  // ── 반복 회차 (INV-9) ──
  rep: number;  // 1-based

  // ── 판정 ──
  verdict: Verdict;
  skeleton_match: MatchResult;
  detail_match: MatchResult;
  symptoms: SymptomCode[];

  // ── 출처 분석 (on 조건에서만) ──
  cited_sources: CitedSource[];
  canonical_reached: boolean;

  // ── 원문 (INV-6: 전문 저장 금지, 요약만) ──
  response_summary: string;  // 200자 이내 요약
  response_hash: string;     // SHA-256 해시 (재현 가능성)
}

// ─── 문항별 집계 (조회 시점에 산출, 저장하지 않음 — INV-9) ───

export interface QuestionAggregateV2 {
  question_id: string;
  ai_service: AiServiceId;
  web_search: 'on' | 'off';
  total_reps: number;

  // 판정 분포
  verdict_distribution: Record<Verdict, number>;

  // Floor Risk (최악 응답 기준)
  floor_risk: FloorRisk;

  // 출처 분석 집계 (on 조건)
  source_analysis: SourceAnalysis | null;
}

// ─── 단위(지자체) 전체 보고서 ───

export interface UnitReportV2 {
  unit_id: string;
  unit_name: string;
  population: 'local_gov' | 'special_zone';
  method_version: 'v2.0';
  measured_on: string;
  l1_verdict: string;

  // 서비스별 집계
  services: {
    service: AiServiceId;
    total_observations: number;
    accuracy_rate: number;
    confabulation_rate: number;
    floor_risk: FloorRisk;
    official_citation_rate: number;
    canonical_reach_rate: number;
  }[];

  // 페르소나별 집계
  personas: {
    persona: PersonaId;
    accuracy_rate: number;
    floor_risk: FloorRisk;
    weakest_question: string;
  }[];

  // 시민 영향 카드 (critical/high 문항)
  impact_cards: ImpactCard[];
}

// ─── 시민 영향 카드 ───

export interface ImpactCard {
  question_id: string;
  severity: 'critical' | 'high';
  confabulation_content: string;
  affected_persona: PersonaId;
  affected_action: string;    // "주민센터에 목욕권 문의"
  affected_outcome: string;   // "그런 제도 없습니다 → 헛걸음"
  off_frequency: string;      // "2/5회"
  on_frequency: string;       // "0/5회"
}

// ─── 익명 벤치마크 (INV-3 호환) ───

export interface AnonymousBenchmark {
  /** 우리 도시 (실명) */
  target_unit: {
    unit_id: string;
    unit_name: string;
    official_citation_rate: number;
    accuracy_on: number;
    confabulation_off: number;
  };
  /** 비교 도시 (익명) */
  comparison_units: {
    label: string;  // "도시 A", "도시 B", ...
    official_citation_rate: number;
    accuracy_on: number;
    confabulation_off: number;
  }[];
  /** 비교 그룹 유형 */
  comparison_type: 'population_similar' | 'same_region' | 'same_l1_verdict';
}
