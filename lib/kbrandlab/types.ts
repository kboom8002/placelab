// lib/kbrandlab/types.ts
// K-Brand Lab PRD v3.0 코어 도메인 타입 정의

export type QuestionSource = 'consumer_actual' | 'researcher_derived' | 'ai_suggested';

export type JourneyStage =
  | 'need_discovery'
  | 'category_exploration'
  | 'brand_comparison'
  | 'purchase_terms'
  | 'usage_troubleshooting'
  | 'repurchase_churn';

export type IssueType =
  | 'info_gap'
  | 'verification_gap'
  | 'purchase_barrier'
  | 'product_unfit'
  | 'new_demand';

export type EntityType = 'brand' | 'product' | 'poi' | 'experience';

export type ClaimType =
  | 'operational_terms'
  | 'product_spec_origin'
  | 'performance_safety'
  | 'experience_usability'
  | 'cultural_authenticity';

export type ClaimKnowledgeState =
  | 'brand_reported'
  | 'supported'
  | 'contradicted'
  | 'insufficient'
  | 'disputed'
  | 'expired';

export type CanonicalStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'published'
  | 'superseded'
  | 'expired'
  | 'withdrawn';

export type ReviewStatus =
  | 'requested'
  | 'eligibility_check'
  | 'assigned'
  | 'independent_review'
  | 'adjudication'
  | 'published'
  | 'challenged'
  | 'expired'
  | 'reopened';

export type ProbeType = 'branded' | 'open' | 'h2h' | 'fact_check';

export type CaptureStatus = 'captured' | 'technical_failed' | 'cancelled' | 'unattempted';

export type ResponseSemantic =
  | 'substantive'
  | 'insufficient'
  | 'refusal'
  | 'empty'
  | 'off_topic'
  | 'unclassified';

export type SourceControl = 'direct' | 'contractual' | 'third_party_request' | 'no_control' | 'unknown';

export type H2HResult =
  | 'target_favorable'
  | 'opponent_favorable'
  | 'conditional'
  | 'tie'
  | 'indeterminate';

// ============================================================================
// 측정 지표 M-01 ~ M-16 인터페이스 (§8.6)
// ============================================================================

export interface MetricRatio {
  id: string;
  name: string;
  numerator: number;
  denominator: number;
  rate: number | null; // denominator === 0이면 null (N/A)
  display: string; // e.g. "80.0% (8/10)" or "N/A"
  notes?: string;
}

export interface MetricDistribution<T extends string = string> {
  id: string;
  name: string;
  counts: Record<T, number>;
  total: number;
  proportions: Record<T, number | null>;
  notes?: string;
}

export interface MetricsSummary {
  m01_collection_completion: MetricRatio;       // 수집 완료율 (N_cap / N_plan)
  m02_technical_success: MetricRatio;           // 기술 성공률 (N_cap / N_started)
  m03_substantive_response: MetricRatio;        // 실질 답변률 (substantive / N_cap)
  m04_brand_mention: MetricRatio;               // 브랜드 언급률 (언급 / N_answer)
  m05_total_collected_mention: MetricRatio;     // 전체 수집 대비 언급률 (언급 / N_cap)
  m06_recommendation_rate: MetricRatio;         // 추천 응답률 (open 질문 중 추천 / open N_answer)
  m07_recommendation_sov: Record<string, MetricRatio>; // 경쟁군별 추천 점유율 (대상 추천 / 경쟁군 추천 합)
  m08_h2h_distribution: MetricDistribution<H2HResult>; // H2H 결과 분포
  m09_official_citation_rate: MetricRatio;      // 공식 채널 인용률 (공식 URL 인용 / 인용지원 N_answer)
  m10_source_citation_share: Record<string, MetricRatio>; // 출처 도메인별 인용 비중
  m11_controllable_source_share: MetricRatio;   // 직접 갱신 가능 출처 비중
  m12_verifiable_claims_rate: MetricRatio;      // 검증 가능 주장 비율
  m13_confirmed_claim_accuracy: MetricRatio;    // 확인된 주장 정확도 (맞음 / (맞음 + 틀림))
  m14_citation_claim_support: MetricRatio;      // 인용의 주장 지원 비율
  m15_intended_description_diff: MetricDistribution<'match' | 'omission' | 'different' | 'indeterminate'>;
  m16_language_observation_gap: {
    baseMetric: string;
    gapPercentagePoints: number | null;
    koRatio: MetricRatio;
    enRatio: MetricRatio;
  };
}
