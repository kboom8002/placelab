// lib/kbrandlab/reports/templates.ts
// K-Brand Lab PRD v3 §14.1 납품물 D-01 ~ D-08 템플릿 렌더러

import { MetricsSummary, MetricRatio } from '../types';

export interface DeliverableContext {
  projectName: string;
  brandName: string;
  categoryName: string;
  reportDate: string;
  methodVersion: string;
  targetMarket: string;
  summaryMetrics?: MetricsSummary;
  topThemes?: Array<{
    title: string;
    issueType: string;
    actionPlan: string;
    priority: number;
  }>;
  questionsSummary?: {
    totalActualQuestions: number;
    totalObservations: number;
    topJourneys: Array<{ journey: string; count: number }>;
  };
}

export class DeliverablesGenerator {
  /**
   * D-01: 소비자 질문 지도 마크다운 렌더러 (§14.1)
   */
  static renderD01QuestionMap(ctx: DeliverableContext): string {
    return `# [D-01] 소비자 질문 지도 (Customer Question Map)
- **고객사 / 브랜드**: ${ctx.projectName} (${ctx.brandName})
- **카테고리**: ${ctx.categoryName} | **목표 시장**: ${ctx.targetMarket}
- **조사 일시**: ${ctx.reportDate} (방법론: ${ctx.methodVersion})

## 1. 수집 질문 총괄
- **실제 소비자 고유 질문 수**: ${ctx.questionsSummary?.totalActualQuestions ?? 0}건
- **총 누적 관찰 발생 수**: ${ctx.questionsSummary?.totalObservations ?? 0}회
- *주의: 서로 다른 채널의 관찰 건수는 인구 통계학적 전수 빈도를 대표하지 않습니다 (INV-01, INV-08).*

## 2. 6단계 구매 여정별 분포
${ctx.questionsSummary?.topJourneys.map(j => `- **${j.journey}**: ${j.count}건`).join('\n') || '- 데이터 수집 진행 중'}

---
*발행: (주)디지털미디어네트워크 · K-Brand Lab 연구팀*
`;
  }

  /**
   * D-03: 브랜드 과제와 기회 테마 브리프 (§14.1)
   */
  static renderD03BrandThemes(ctx: DeliverableContext): string {
    return `# [D-03] 브랜드 과제 및 사업 기회 테마 (Brand Themes & Opportunities)
- **프로젝트**: ${ctx.projectName} (${ctx.brandName})
- **발행일**: ${ctx.reportDate}

## 핵심 발견 과제 요약
${ctx.topThemes?.map((t, idx) => `
### ${idx + 1}. [${t.issueType}] ${t.title} (우선순위: ${t.priority})
- **실행 권고안**: ${t.actionPlan}
- **개선 유형**: ${t.issueType === 'info_gap' ? '콘텐츠/FAQ 개선 (비용 0원~저비용)' : t.issueType === 'verification_gap' ? '공인 시험 자료 및 근거 공개' : '운영/제품 R&D 가설'}
`).join('\n') || '과제 도출 대기 중'}

---
*발행: (주)디지털미디어네트워크 · K-Brand Lab 연구팀*
`;
  }

  /**
   * D-04: AI 진단 질문과 측정 결과 보고서 (§14.1)
   */
  static renderD04MeasurementReport(ctx: DeliverableContext, m: MetricsSummary): string {
    const fmt = (r: MetricRatio) => `${r.display}`;

    return `# [D-04] AI 응답 측정 결과 보고서 (AI Visibility & Accuracy Report)
- **대상 브랜드**: ${ctx.brandName} | **카테고리**: ${ctx.categoryName}
- **측정 시점**: ${ctx.reportDate} | **방법론 버전**: ${ctx.methodVersion}
- **측정 원칙**: 수집·답변·언급·추천·인용의 분모와 누락을 투명하게 공개함 (INV-08).

## 1. 실행 및 기술 수집 지표
- **M-01 수집 완료율**: ${fmt(m.m01_collection_completion)}
- **M-02 기술 성공률**: ${fmt(m.m02_technical_success)} *(슬롯 기준 산출, 재시도 횟수 제외)*
- **M-03 실질 답변률**: ${fmt(m.m03_substantive_response)}

## 2. 브랜드 가시성 및 추천 점유율
- **M-04 브랜드 언급률 (답변 대비)**: ${fmt(m.m04_brand_mention)}
- **M-05 전체 수집 대비 언급률**: ${fmt(m.m05_total_collected_mention)}
- **M-06 추천 응답률 (Open 질문)**: ${fmt(m.m06_recommendation_rate)}

## 3. 출처 및 정본 인용 분석
- **M-09 공식 채널 인용률**: ${fmt(m.m09_official_citation_rate)}
- **M-11 직접 갱신 가능 출처 비중**: ${fmt(m.m11_controllable_source_share)}

## 4. 사실 주장 정확성 검증 (L1)
- **M-12 검증 가능 주장 비율**: ${fmt(m.m12_verifiable_claims_rate)}
- **M-13 확인된 주장 정확도**: ${fmt(m.m13_confirmed_claim_accuracy)} *(미확인 주장 별도)*

## 5. 글로벌 언어별 관찰 차이 (KR vs EN)
- **M-16 언어 관찰 격차**: ${m.m16_language_observation_gap.gapPercentagePoints !== null ? `${m.m16_language_observation_gap.gapPercentagePoints}%p` : 'N/A'}
  - 한국어: ${fmt(m.m16_language_observation_gap.koRatio)}
  - 영어: ${fmt(m.m16_language_observation_gap.enRatio)}

---
*주의: AI의 언급·추천 수치는 외부 AI 검색 환경에서의 관찰 결과(L1)이며, 제품의 품질 인증이나 미래 매출 증가를 보장하지 않습니다 (INV-03, INV-11).*
`;
  }
}
