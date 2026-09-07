// lib/aeo/types/vip-report.ts
// VIP 보고서 타입 정의
// 출처: 수원시·증평군 보고서 수작업 → 자동화 전환
// 불변식: INV-3 (순위 금지), INV-6 (원문 제한), INV-9 (Floor Risk 병기), INV-11 (탐색적 표기)

import type { MeasureResult } from '../measure-engine';
import type { Tier2Category, Tier3QuestionType, FloorRisk } from '../../types/source-analysis';
import type { Tier1Verdict, Tier2Verdict, Tier3Verdict } from '../scorer';

// ─── Stage 1: 채점 결과 + 원문 보존 ───

export interface ScoredResult extends MeasureResult {
  verdict: Tier1Verdict | Tier2Verdict | Tier3Verdict;
  category: string;                    // T1 카테고리, T2 Tier2Category, T3 Tier3QuestionType

  // T2 전용
  groundTruthMatchRate?: number;       // GT 키워드 일치율 (0~1)
  hasUnitSpecificInfo?: boolean;       // 도시 고유 정보 포함 여부

  // T3 전용
  targetMentioned?: boolean;           // 대상 도시 언급 여부
  mentionSentiment?: 'positive' | 'neutral' | 'negative';

  // 원문 보존 (INV-6: 내부용만, 공개 API 미노출)
  responseExcerpt: string;             // 응답 첫 150자 (보고서 인용용)
}

// ─── Stage 2: 인사이트 번들 ───

export interface AssociationTestResult {
  responses: { rep: number; rawText: string; words: string[] }[];
  stableWords: string[];               // 3/3 등장
  unstableWords: string[];             // 1~2/3만 등장
}

export interface RecommendationGap {
  questionId: string;
  questionText: string;
  questionType: Tier3QuestionType;
  aiRecommended: string;               // AI가 추천한 도시/지역
  targetMissing: boolean;              // 대상 도시 빠짐
  whyShouldBeIncluded: string;         // 증평: "보강천 사질양토, 인삼축제"
}

export interface CategoryInsight {
  category: Tier2Category;
  totalQuestions: number;
  relevantCount: number;               // accurate_relevant 비율
  genericCount: number;
  absentCount: number;
  strongQuestions: { id: string; matchRate: number }[];
  weakQuestions: { id: string; verdict: string }[];
  sampleResponse?: string;
}

export interface StabilityItem {
  questionId: string;
  category: string;
  question: string;
  stableCount: number;                 // 3회 중 정확 횟수
  status: 'stable' | 'unstable' | 'absent';
  reps: { rep: number; verdict: string }[];
}

export interface UrlAnalysis {
  totalResults: number;
  withUrlCount: number;
  publicUrlCount: number;              // .go.kr, .or.kr
  ownDomainCount: number;              // 해당 지자체 도메인
  topDomains: { domain: string; count: number }[];
}

export interface InsightBundle {
  associationTest: AssociationTestResult;
  recommendationGaps: RecommendationGap[];
  categoryInsights: CategoryInsight[];
  stabilityAnalysis: StabilityItem[];
  urlAnalysis: UrlAnalysis;
  t3MentionByType: { type: Tier3QuestionType; mentioned: number; total: number; rate: number }[];
}

// ─── Stage 3: 다이아몬드 분석 ───

export interface Signal {
  id: string;
  description: string;
  evidence: string;                    // 근거 (문항ID + 수치)
  impact: 'high' | 'medium' | 'low';
}

export interface StrategicAction {
  rank: number;
  area: string;
  currentState: string;
  evidence: string;
  action: string;
  cost: string;                        // "0원" | "300만원" | ...
  timeline: string;                    // "즉시" | "1개월" | "3개월"
  expectedEffect: string;
}

export interface RoadmapItem {
  action: string;
  detail: string;
  cost: string;
}

export interface DiamondAnalysis {
  signals: {
    strengths: Signal[];
    weaknesses: Signal[];
    opportunities: Signal[];
    threats: Signal[];
  };
  defenseAreas: StrategicAction[];
  opportunityAreas: StrategicAction[];
  roadmap: {
    immediate: RoadmapItem[];          // 1주일, 비용 0원
    oneMonth: RoadmapItem[];
    threeMonths: RoadmapItem[];
  };
}

// ─── Stage 4: 최종 VIP 보고서 ───

export interface VIPReportMetadata {
  unitId: string;
  unitName: string;
  population: 'local_gov' | 'special_zone';
  measuredOn: string;
  model: string;
  methodVersion: string;
  totalQueries: number;
  successCount: number;
  absentCount: number;
  errorCount: number;
  reps: number;
  isExploratory: boolean;              // INV-11
}

export interface VIPDashboard {
  t1Accuracy: number;                  // 0~1
  t1StableCount: number;              // 3/3 안정 문항 수
  t1TotalQuestions: number;
  t2RelevanceRate: number;             // accurate_relevant / total
  t2GenericRate: number;               // accurate_generic / total
  t2TotalQuestions: number;
  t3ShareOfVoice: number;             // mentioned / total
  t3ByType: { type: string; rate: number }[];
  floorRisk: FloorRisk;
  confabulationCount: number;
}

export interface VIPReport {
  metadata: VIPReportMetadata;
  dashboard: VIPDashboard;
  executiveSummary: string;
  oneLineForLeader: string;
  insights: InsightBundle;
  diamond: DiamondAnalysis;
  markdownFull: string;
  markdownSections: { id: string; title: string; content: string }[];
}

// ─── VIP 생성 입력 ───

export interface VIPReportInput {
  measurementId: string;
  unitId: string;
  unitName: string;
  population: 'local_gov' | 'special_zone';
  measuredOn: string;
  model: string;
  results: MeasureResult[];
  tier2Questions?: { id: string; body: string; groundTruth?: string; category?: string }[];
  tier3Questions?: { id: string; body: string; type?: string; targetKeywords?: string[] }[];
  tier3TargetKeywords?: string[];
  // 비교 대상 (optional)
  comparisonReport?: VIPReport;
}
