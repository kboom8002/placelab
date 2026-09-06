// lib/aeo/report-generator.ts
// 3-Tier AEO 진단 보고서 생성기
// 출처: ADR-0011, K04 v2.1
// 불변식: INV-6 (전문 비공개), INV-7 (측정 조건), INV-9 (회차별 저장, Floor Risk mandatory), INV-3 (자체 순위 생성 금지)

import type { MeasureResult } from './measure-engine';
import type {
  AEODiagnosisReport,
  FloorRisk,
  Verdict,
  Tier2Verdict,
  Tier2Category,
  Tier3QuestionType,
  AiServiceId,
} from '../types/source-analysis';
import { scoreTier1, scoreTier2, calculateFloorRisk } from './scorer';
import { analyzeSoV, scoreTier3Response } from './sov-analyzer';

export interface ReportInput {
  measurementId: string;
  unitId: string;
  unitName: string;
  population: 'local_gov' | 'special_zone';
  aiService: string;
  measuredOn: string;
  results: MeasureResult[];
  tier2Questions?: { id: string; groundTruth: string; category?: Tier2Category }[];
  tier3TargetKeywords?: string[];
  tier3CompetitorUnits?: string[];
  previousReport?: AEODiagnosisReport;  // for monthly tracking
}

const TIER2_CATEGORIES: Tier2Category[] = [
  'specialty_industry',
  'landmark',
  'local_policy',
  'heritage',
  'geography',
  'local_food',
  'recent_issue',
];

const TIER3_QUESTION_TYPES: Tier3QuestionType[] = [
  'recommendation',
  'association',
  'keyword_entry',
  'scenario',
  'comparison',
  'negative_test',
];

/**
 * 텍스트에서 연상어(명사 중심 토큰) 추출
 */
function extractAssociationWords(texts: string[], unitName: string): string[] {
  const words: Record<string, number> = {};
  const baseUnit = unitName.replace(/(특별시|광역시|특별자치시|특별자치도|특례시|시|군|구)$/, '');

  const stopwords = new Set([
    baseUnit, unitName, '대한민국', '한국', '도시', '지역', '대표', '가장',
    '첫째', '둘째', '셋째', '1.', '2.', '3.', '하면', '생각나는', '떠오르는',
    '것은', '등이', '있습니다', '있으며', '유명합니다', '알려져', '추천', '소개'
  ]);

  for (const text of texts) {
    if (!text) continue;
    // 불필요한 기호 제거 및 단어 분리
    const cleaned = text.replace(/[\n\r\t.,!?:;"'()[\]{}<>~·]/g, ' ');
    const tokens = cleaned.split(/\s+/).filter(t => t.length >= 2);

    for (const token of tokens) {
      if (stopwords.has(token)) continue;
      // 숫자만 있는 경우 제외
      if (/^\d+$/.test(token)) continue;
      words[token] = (words[token] || 0) + 1;
    }
  }

  return Object.entries(words)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([w]) => w);
}

/**
 * AI Service 문자열을 AiServiceId 타입으로 정규화
 */
function normalizeAiService(service: string): AiServiceId {
  const lower = service.toLowerCase();
  if (lower.includes('gemini')) return 'gemini';
  if (lower.includes('perplexity')) return 'perplexity';
  return 'chatgpt';
}

/**
 * 3-Tier 통합 AEO 진단 보고서 생성
 */
export function generateReport(input: ReportInput): AEODiagnosisReport {
  // ── 1. Tier별 결과 분리 ──
  const t1Results: MeasureResult[] = [];
  const t2Results: MeasureResult[] = [];
  const t3Results: MeasureResult[] = [];

  for (const r of input.results) {
    if (r.tier === 'T1' || r.questionId.startsWith('B-') || r.questionId.startsWith('P')) {
      t1Results.push(r);
    } else if (r.tier === 'T2' || r.questionId.startsWith('T2-') || r.questionId.startsWith('S-') || r.questionId.startsWith('J-')) {
      t2Results.push(r);
    } else if (r.tier === 'T3' || r.questionId.startsWith('V-') || r.questionId.startsWith('T3-')) {
      t3Results.push(r);
    }
  }

  // ── 2. Tier 1 (기본 행정) 집계 및 채점 ──
  const t1QuestionsMap = new Map<string, MeasureResult[]>();
  for (const r of t1Results) {
    const list = t1QuestionsMap.get(r.questionId) || [];
    list.push(r);
    t1QuestionsMap.set(r.questionId, list);
  }

  const t1QuestionResults: {
    question_id: string;
    verdict_distribution: Record<Verdict, number>;
  }[] = [];

  let t1TotalAccurate = 0;
  let t1TotalConfabulation = 0;
  let t1MaxReps = 3;
  const allT1Verdicts: Verdict[] = [];

  for (const [qid, qResults] of t1QuestionsMap.entries()) {
    t1MaxReps = Math.max(t1MaxReps, qResults.length);
    const dist: Record<Verdict, number> = {
      accurate: 0,
      partial: 0,
      inaccurate: 0,
      absent: 0,
      confabulation: 0,
    };

    for (const res of qResults) {
      const v: Verdict = scoreTier1(res.response) as Verdict;
      dist[v] = (dist[v] || 0) + 1;
      allT1Verdicts.push(v);
      if (v === 'accurate') t1TotalAccurate++;
      if (v === 'confabulation') t1TotalConfabulation++;
    }

    t1QuestionResults.push({
      question_id: qid,
      verdict_distribution: dist,
    });
  }

  const t1AccuracyRate = t1Results.length > 0 ? Number((t1TotalAccurate / t1Results.length).toFixed(4)) : 0;
  const t1FloorRisk: FloorRisk = calculateFloorRisk(allT1Verdicts);

  // ── 3. Tier 2 (고유 정보) 집계 및 채점 ──
  const t2GtMap = new Map<string, { groundTruth: string; category?: Tier2Category }>();
  if (input.tier2Questions) {
    for (const q of input.tier2Questions) {
      t2GtMap.set(q.id, { groundTruth: q.groundTruth, category: q.category });
    }
  }

  const t2CategoriesMap = new Map<Tier2Category, { accurateRelevant: number; accurateGeneric: number; total: number }>();
  for (const cat of TIER2_CATEGORIES) {
    t2CategoriesMap.set(cat, { accurateRelevant: 0, accurateGeneric: 0, total: 0 });
  }

  let t2AccurateRelevantCount = 0;
  let t2AccurateGenericCount = 0;
  let t2WrongCount = 0;
  let t2MaxReps = 3;
  const allT2Verdicts: Tier2Verdict[] = [];

  // 문항별로 회차 추적
  const t2QuestionReps = new Map<string, number>();

  for (const res of t2Results) {
    t2QuestionReps.set(res.questionId, (t2QuestionReps.get(res.questionId) || 0) + 1);
    const gtInfo = t2GtMap.get(res.questionId);
    const v: Tier2Verdict = scoreTier2(res.response, gtInfo?.groundTruth, input.unitName);
    allT2Verdicts.push(v);

    if (v === 'accurate_relevant') t2AccurateRelevantCount++;
    if (v === 'accurate_generic') t2AccurateGenericCount++;
    if (v === 'wrong') t2WrongCount++;

    // 카테고리 식별
    let cat: Tier2Category = gtInfo?.category || 'landmark';
    if (!TIER2_CATEGORIES.includes(cat)) {
      cat = 'landmark';
    }

    const catStats = t2CategoriesMap.get(cat)!;
    catStats.total++;
    if (v === 'accurate_relevant') catStats.accurateRelevant++;
    if (v === 'accurate_generic') catStats.accurateGeneric++;
  }

  for (const count of t2QuestionReps.values()) {
    t2MaxReps = Math.max(t2MaxReps, count);
  }

  const t2TotalObs = t2Results.length || 1;
  const t2AccuracyRelevantRate = Number((t2AccurateRelevantCount / t2TotalObs).toFixed(4));
  const t2AccuracyGenericRate = Number((t2AccurateGenericCount / t2TotalObs).toFixed(4));
  const t2FloorRisk: FloorRisk = calculateFloorRisk(allT2Verdicts);

  const t2CategoryScores = TIER2_CATEGORIES.map((cat) => {
    const stats = t2CategoriesMap.get(cat)!;
    const catTotal = stats.total || 1;
    const accuracyRate = Number(((stats.accurateRelevant + stats.accurateGeneric) / catTotal).toFixed(4));
    const relevanceRate = stats.accurateRelevant + stats.accurateGeneric > 0
      ? Number((stats.accurateRelevant / (stats.accurateRelevant + stats.accurateGeneric)).toFixed(4))
      : 0;

    return {
      category: cat,
      accuracy_rate: stats.total > 0 ? accuracyRate : 0,
      relevance_rate: stats.total > 0 ? relevanceRate : 0,
    };
  });

  // ── 4. Tier 3 (대외 홍보력 및 SoV) 집계 ──
  const targetKeywords = input.tier3TargetKeywords || [];
  const competitorUnits = input.tier3CompetitorUnits || [];

  const sov = analyzeSoV(t3Results, input.unitName, targetKeywords, competitorUnits);

  // V-B1 질문 응답들에서 연상어 추출
  const vb1Responses = t3Results
    .filter(r => r.questionId === 'V-B1')
    .map(r => r.response);
  const associationWords = extractAssociationWords(vb1Responses, input.unitName);

  // 유형별 언급률 (6유형)
  const typeResultsMap = new Map<Tier3QuestionType, { mentioned: number; total: number }>();
  for (const t of TIER3_QUESTION_TYPES) {
    typeResultsMap.set(t, { mentioned: 0, total: 0 });
  }

  let t3MaxReps = 3;
  const t3QuestionReps = new Map<string, number>();

  for (const res of t3Results) {
    t3QuestionReps.set(res.questionId, (t3QuestionReps.get(res.questionId) || 0) + 1);

    // 질문 유형 매핑 (V-A -> recommendation, V-B -> association 등)
    let qType: Tier3QuestionType = 'recommendation';
    if (res.questionId.startsWith('V-A')) qType = 'recommendation';
    else if (res.questionId.startsWith('V-B')) qType = 'association';
    else if (res.questionId.startsWith('V-C')) qType = 'keyword_entry';
    else if (res.questionId.startsWith('V-D')) qType = 'scenario';
    else if (res.questionId.startsWith('V-E')) qType = 'comparison';
    else if (res.questionId.startsWith('V-F')) qType = 'negative_test';

    const typeStats = typeResultsMap.get(qType)!;
    typeStats.total++;

    const { verdict } = scoreTier3Response(res.response, input.unitName, targetKeywords);
    if (verdict !== 'not_mentioned') {
      typeStats.mentioned++;
    }
  }

  for (const count of t3QuestionReps.values()) {
    t3MaxReps = Math.max(t3MaxReps, count);
  }

  const t3TypeScores = TIER3_QUESTION_TYPES.map((t) => {
    const stats = typeResultsMap.get(t)!;
    const rate = stats.total > 0 ? Number((stats.mentioned / stats.total).toFixed(4)) : 0;
    return {
      type: t,
      mention_rate: rate,
    };
  });

  // ── 5. 처방전 생성 (P0, P1, P2) ──
  const prescriptions: {
    priority: 'P0' | 'P1' | 'P2';
    action: string;
    rationale: string;
    source_question_id: string;
  }[] = [];

  // P0: 작화 발생 또는 Floor Risk가 Critical인 경우
  if (t1TotalConfabulation > 0) {
    prescriptions.push({
      priority: 'P0',
      action: '공식 포털 정본 안내 강화 및 Schema.org GovernmentService JSON-LD 마크업 즉시 도입',
      rationale: `Tier 1 기본 행정에서 총 ${t1TotalConfabulation}건의 AI 작화(환각)가 감지되어 시민 오안내 위험이 큽니다.`,
      source_question_id: 'B-CONFAB',
    });
  }

  if (t1FloorRisk === 'critical' || t2FloorRisk === 'critical') {
    prescriptions.push({
      priority: 'P0',
      action: '비존재 제도 및 허위 복지 정책에 대한 공식 FAQ 부정(Denial) 페이지 개설',
      rationale: 'AI가 존재하지 않는 복지 혜택을 사실로 안내하는 Floor Risk Critical 상태입니다.',
      source_question_id: 'CRITICAL-RISK',
    });
  }

  // P1: 낮은 정확도 카테고리, 범용 안내(generic) 과다, 구조화 데이터 부재
  for (const catScore of t2CategoryScores) {
    if (catScore.accuracy_rate < 0.6 || catScore.relevance_rate < 0.5) {
      const categoryNames: Record<Tier2Category, string> = {
        specialty_industry: '특산·산업',
        landmark: '고유 시설·랜드마크',
        local_policy: '독자 정책·조례',
        heritage: '역사·문화재',
        geography: '지리·생활권',
        local_food: '로컬 음식·명소',
        recent_issue: '최근 이슈·사업',
      };
      prescriptions.push({
        priority: 'P1',
        action: `${categoryNames[catScore.category]} 공식 정보 페이지 콘텐츠 보강 및 오픈그래프(OG) 메타태그 정비`,
        rationale: `AI가 '${categoryNames[catScore.category]}' 카테고리의 고유 정보를 인지하지 못하고 범용 안내로 일관하거나 오답을 반환했습니다.`,
        source_question_id: `T2-${catScore.category}`,
      });
      break; // 최대 2개 P1
    }
  }

  if (t2AccuracyGenericRate > 0.3) {
    prescriptions.push({
      priority: 'P1',
      action: '지자체 대표 포털의 주요 사업 세부 정보(금액, 대상, 신청절차) 텍스트 명시화',
      rationale: `전체 Tier 2 응답 중 ${(t2AccuracyGenericRate * 100).toFixed(0)}%가 단순 "시청에 문의하세요" 수준의 범용 안내에 그쳤습니다.`,
      source_question_id: 'T2-GENERIC',
    });
  }

  // P2: 낮은 SoV, 키워드 검색 유입 부족, 경쟁 도시 대비 열세
  if (sov.sov_rate < 0.35) {
    prescriptions.push({
      priority: 'P2',
      action: '추천형 검색 및 대표 키워드 연계 온라인 콘텐츠 홍보 강화',
      rationale: `대외 추천 및 키워드 질문에서 지자체 언급 점유율(SoV)이 ${(sov.sov_rate * 100).toFixed(1)}%로 저조합니다.`,
      source_question_id: 'T3-SOV',
    });
  }

  const topCompetitor = sov.competitor_sov[0];
  if (topCompetitor && topCompetitor.sov_rate > sov.sov_rate) {
    prescriptions.push({
      priority: 'P2',
      action: `${topCompetitor.unit_name} 대비 차별화된 특화 관광·주거 환경 비교 콘텐츠 발행`,
      rationale: `인접/유사 경쟁 지자체(${topCompetitor.unit_name})의 AI 언급률이 ${(topCompetitor.sov_rate * 100).toFixed(1)}%로 본 지자체를 상회합니다.`,
      source_question_id: 'T3-COMPETITOR',
    });
  }

  // 만약 처방전이 부족하면 기본 가이드 추가
  if (prescriptions.length === 0) {
    prescriptions.push({
      priority: 'P2',
      action: '시민 빈발 민원에 대한 정기적 AEO 검색어 모니터링 체계 가동',
      rationale: '전반적인 행정 정보 및 고유 자원 인지도가 양호하므로 현 상태 유지 및 신규 정책 반영에 주력합니다.',
      source_question_id: 'MAINTAIN',
    });
  }

  // ── 6. 월별 변화 추적 계산 ──
  let monthlyTracking: AEODiagnosisReport['monthly_tracking'] = undefined;
  if (input.previousReport) {
    const prev = input.previousReport;
    const t1AccDiff = Number((t1AccuracyRate - prev.tier1.accuracy_rate).toFixed(4));
    const t2RelDiff = Number((t2AccuracyRelevantRate - prev.tier2.accuracy_relevant_rate).toFixed(4));
    const t3SovDiff = Number((sov.sov_rate - prev.tier3.share_of_voice.sov_rate).toFixed(4));

    const improved: string[] = [];
    const regressed: string[] = [];

    if (t1AccDiff > 0) improved.push('Tier 1 기본 행정 정확도 향상');
    else if (t1AccDiff < 0) regressed.push('Tier 1 기본 행정 정확도 하락');

    if (t2RelDiff > 0) improved.push('Tier 2 고유 정보 관련성 증가');
    else if (t2RelDiff < 0) regressed.push('Tier 2 고유 정보 관련성 감소');

    if (t3SovDiff > 0) improved.push('Tier 3 대외 언급 점유율(SoV) 상승');
    else if (t3SovDiff < 0) regressed.push('Tier 3 대외 언급 점유율(SoV) 하락');

    monthlyTracking = {
      tier1_accuracy_change: t1AccDiff,
      tier2_relevance_change: t2RelDiff,
      tier3_sov_change: t3SovDiff,
      improved_questions: improved,
      regressed_questions: regressed,
    };
  }

  return {
    unit_id: input.unitId,
    unit_name: input.unitName,
    population: input.population,
    method_version: 'v2.1',
    ai_service: normalizeAiService(input.aiService),
    web_search: 'on',
    measured_on: input.measuredOn,

    tier1: {
      total_questions: 15,
      reps: t1MaxReps,
      accuracy_rate: t1AccuracyRate,
      confabulation_count: t1TotalConfabulation,
      floor_risk: t1FloorRisk,
      results: t1QuestionResults,
    },

    tier2: {
      total_questions: 20,
      reps: t2MaxReps,
      accuracy_relevant_rate: t2AccuracyRelevantRate,
      accuracy_generic_rate: t2AccuracyGenericRate,
      wrong_count: t2WrongCount,
      floor_risk: t2FloorRisk,
      category_scores: t2CategoryScores,
    },

    tier3: {
      total_questions: 15,
      reps: t3MaxReps,
      share_of_voice: sov,
      association_words: associationWords,
      type_scores: t3TypeScores,
    },

    prescriptions,
    monthly_tracking: monthlyTracking,
  };
}
