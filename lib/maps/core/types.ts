// lib/maps/core/types.ts
// MAPS 스튜디오 (Multi-AI Presence & Alignment Studio) 코어 타입 정의
// 근거: ADR-0026, ADR-0027, PRD FR-97 ~ FR-106

export type MapsOrgType =
  | 'enterprise'
  | 'hospital'
  | 'university'
  | 'smb'
  | 'public_corp'
  | 'foundation'
  | 'agency_partner'
  | 'local_gov_blocked';

export type MapsEligibilityStatus =
  | 'approved'
  | 'rejected_conflict_of_interest'
  | 'pending_review';

/** 확인 수준 ('등급' 금칙어 대신 '수준' 사용 — INV-3 준수) */
export type MapsConfirmLevel = 'unreviewed' | 'doc_verified' | 'owner_signed';

/**
 * 6분류 판정 (ADR-0026, MAPS-INV-04, MAPS-INV-20)
 * - correct: 정본 값과 일치 + 공식/1차 인용 동반
 * - outdated: 관측 시점에는 만료된 과거 정본 버전과 일치 (지연 일수 산출)
 * - confused: 동명이인·유사 기관/타 상품의 정본 값과 혼동
 * - fabricated: 정본·과거 정본·타 대상 어디에도 없는 창작 수치/사실
 * - asserted: 값은 현재 정본과 일치하나 공식·1차 인용이 전혀 없는 단언 (factualRate 분자에서 제외)
 * - honest_unknown: 확인할 수 없음을 정직하게 밝힘
 */
export type MapsVerdict6Way =
  | 'correct'
  | 'outdated'
  | 'confused'
  | 'fabricated'
  | 'asserted'
  | 'honest_unknown';

export type MapsCitationClass =
  | 'official'
  | 'primary_doc'
  | 'secondary_press'
  | 'ugc_blog'
  | 'broken'
  | 'unrelated'
  | 'none';

/** 6대 간극(G1~G6) 분류 (ADR-0026, FR-100) */
export type MapsGapType =
  | 'G1_presence'
  | 'G2_fact'
  | 'G3_time'
  | 'G4_source'
  | 'G5_context'
  | 'G6_engine';

/** 6단계 원인 소거 진단 단계 (Stage 1~6, FR-100) */
export type MapsDiagnosisStage =
  | 'S1_existence'
  | 'S2_crawl_access'
  | 'S3_indexing_discoverability'
  | 'S4_parseability'
  | 'S5_conflict_recency'
  | 'S6_model_internal';

/** 6단계 진단과 1:1 대응하는 처방 코드 (P1~P6) */
export type MapsPrescriptionCode =
  | 'P1_publish_canonical'
  | 'P2_open_robots_sitemap'
  | 'P3_ia_deeplink_anchor'
  | 'P4_html_table_jsonld'
  | 'P5_retire_old_date_pin'
  | 'P6_official_objection_pack';

/** 5대 편향 렌즈 (L1~L5) */
export type MapsBiasLens =
  | 'L1_channel'
  | 'L2_language'
  | 'L3_query_frame'
  | 'L4_engine'
  | 'L5_time_lag';

export interface MapsTenant {
  tenantId: string;
  name: string;
  slug: string;
  orgType: MapsOrgType;
  eligibilityStatus: MapsEligibilityStatus;
  sponsorDisclosure: string | null;
  primaryDomain: string;
  contactEmail?: string;
}

export interface MapsEntity {
  entityId: string;
  tenantId: string;
  entityType: 'organization' | 'product' | 'service' | 'location' | 'person' | 'policy';
  canonicalName: string;
  aliases: string[];
  disambiguators: string[];
  negativeAliases: string[];
  officialDomains: string[];
  primaryUrls: string[];
}

export interface MapsPropDefinition {
  propKey: string;
  sector: string;
  labelKo: string;
  valueType:
    | 'number'
    | 'money'
    | 'hours'
    | 'phone'
    | 'address'
    | 'enum'
    | 'boolean'
    | 'date_range'
    | 'url'
    | 'text';
  riskWeight: number; // 0..5
  volatility: 'low' | 'medium' | 'high' | 'seasonal';
  unit?: string;
  toleranceRatio?: number;
}

/** 이원 시간(Bitemporal) 정본 대장 버전 행 (MAPS-INV-03: append-only) */
export interface MapsFactVersion {
  factVersionId: string;
  tenantId: string;
  entityId: string;
  propKey: string;
  valueNorm: string | number | boolean | Record<string, unknown>;
  valueRaw: string;
  unit?: string;
  qualifiers: Record<string, string>;
  /** 사실이 현실에서 유효하기 시작한 시각 (미래 예고 시 미래 시각 가능) */
  validFrom: string; // ISO timestamp
  /** 사실 효력이 종료된 시각 (현재 유효 시 null) */
  validTo: string | null;
  /** 대장 기록 시각 (Transaction time) */
  recordedAt: string; // ISO timestamp
  supersededAt: string | null;
  sourceUrl: string;
  sourceQuote?: string;
  confirmLevel: MapsConfirmLevel;
  confirmedBy?: string;
  confirmedAt?: string;
  supersedesFactVersionId: string | null;
}

export interface MapsExtractedClaim {
  entityMention: string;
  propKey: string;
  claimedValueNorm: string | number | boolean;
  claimedValueRaw: string;
  contextSnippet: string;
}

export interface MapsCitationItem {
  url: string;
  domain: string;
  title?: string;
  isFirstCitation: boolean;
  httpStatus?: number;
}

/** 반복 회차별 원시 관측 행 (INV-6 원문 격리, INV-9 회차 보존, MAPS-INV-01 불변) */
export interface MapsObservation {
  observationId: string;
  runId: string;
  questionId: string;
  rep: number;
  engineId: string;
  maskedEngineLabel: string;
  lang: string;
  frameAxis: 'neutral' | 'positive_premise' | 'critical_premise' | 'constraint_heavy' | 'alternative_seeking';
  channel: 'api_websearch' | 'api_nosearch';
  observedAt: string; // ISO timestamp
  rawRef: string;
  rawHash: string;
  extractedClaims: MapsExtractedClaim[];
  citations: MapsCitationItem[];
  refusalType: 'none' | 'honest_unknown' | 'safety_refusal' | 'policy_disclaimer';
  latencyMs?: number;
}

/** 6분류 판정 행 (MAPS-INV-04 append-only) */
export interface MapsJudgment {
  judgmentId: string;
  observationId: string;
  targetEntityId: string;
  propKey: string;
  asOfFactVersionId: string | null;
  verdict: MapsVerdict6Way;
  lagDays: number | null;
  confusedWithEntityId: string | null;
  citationClass: MapsCitationClass;
  harmScore: number; // 0..5
  limitViolation: boolean;
  judgeType: 'rule' | 'llm_candidate' | 'human_single' | 'human_consensus' | 'adjudicated';
  judgeId: string;
  rationale: string;
  supersedesJudgmentId: string | null;
  judgedAt: string;
}

export interface MapsMetricWithCI {
  rate: number; // 0..1
  ci95Low: number;
  ci95High: number;
  numerator: number;
  denominator: number;
}

/**
 * MAPS 4대 헤드라인 지표 (MAPS-INV-02: 단일 종합 점수 산출 금지)
 * MAPS-INV-20: asserted(인용 없는 단언)는 factualRate 분자에 절대 포함하지 않고 assertedRate로 분리 보고
 */
export interface MapsHeadlineMetrics {
  presenceRate: MapsMetricWithCI;
  factualRate: MapsMetricWithCI;
  officialCitationRate: MapsMetricWithCI;
  harmRiskRate: MapsMetricWithCI;
  assertedRate: MapsMetricWithCI;
  outdatedRate: MapsMetricWithCI;
  avgLagDays: number | null;
  repeatNoiseFloor: number;
  limitViolationCount: number;
  measuredRoundStamp: string;
}

/** MAPS-INV-09: 우선순위 5대 구성요소 동반 의무 */
export interface MapsPriorityComponents {
  demand: number;      // 질문 중요도·탐색 빈도 (0..1)
  gap: number;         // 간극 심각도 (0..1)
  harm: number;        // 오답 시 피해 위험 (0..1)
  feasibility: number; // 고객사 직접 교정 가능성 (0..1)
  cost: number;        // 예상 소요 비용/시간 역수 효율 (0..1, 높을수록 저비용)
}

export interface MapsGapTask {
  gapTaskId: string;
  tenantId: string;
  entityId: string;
  entityName: string;
  propKey: string;
  propLabel: string;
  gapType: MapsGapType;
  diagnosisStage: MapsDiagnosisStage;
  prescriptionCode: MapsPrescriptionCode;
  prescriptionTitle: string;
  prescriptionSteps: string[];
  priority: number;
  priorityComponents: MapsPriorityComponents;
  affectedEngineLabels: string[];
  sampleVerdict: MapsVerdict6Way;
  lagDays: number | null;
  status: 'open' | 'in_progress' | 'deployed_waiting_remeasure' | 'closed' | 'wont_fix';
}

export interface MapsIntervention {
  interventionId: string;
  tenantId: string;
  gapTaskId: string;
  actionType:
    | 'canonical_page_publish'
    | 'jsonld_embed'
    | 'robots_sitemap_update'
    | 'outdated_doc_retire'
    | 'html_table_refactor'
    | 'provider_feedback_submit';
  targetUrl: string;
  artifactHash: string;
  deployedAt: string;
  verifiedCrawlAt: string | null;
  elapsedMinutes: number;
  estimatedCostKrw: number;
  notes: string;
  createdBy: string;
}

export interface MapsSkuProduct {
  skuCode: string;
  nameKo: string;
  stageLabel: '무료 점검' | '재기 (진단)' | '맞추기·메우기 (정본·개입)' | '증명 (전후 대조)' | '상시 감시' | '로컬 상권';
  billingCycle: 'free' | 'one_time' | 'monthly' | 'quarterly' | 'annual' | 'quote_only';
  priceStatus: 'assumption' | 'confirmed';
  confirmedPriceKrw: number | null;
  assumptionRangeLabel: string;
  deliverables: string[];
  nonGuaranteeNotice: string;
}
