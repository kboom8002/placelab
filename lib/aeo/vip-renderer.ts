// lib/aeo/vip-renderer.ts
// VIP 보고서 마크다운 렌더러
// 출처: 수원시·증평군 수작업 보고서 구조 → 자동화
// 불변식: INV-3 (순위 금지), INV-6 (원문 제한), INV-9 (Floor Risk 병기), INV-11 (탐색적 표기)

import type {
  VIPReport,
  VIPDashboard,
  VIPReportMetadata,
  InsightBundle,
  DiamondAnalysis,
  StabilityItem,
  StrategicAction,
} from './types/vip-report';

// ─── 메인 렌더러 ───

export function renderVIPReport(report: VIPReport): string {
  const sections = [
    renderHeader(report.metadata),
    renderExecutiveSummary(report.executiveSummary),
    renderDashboard(report.dashboard, report.metadata),
    renderAssociationTest(report.insights, report.metadata.unitName),
    renderRecommendationGaps(report.insights, report.metadata.unitName),
    renderT1Checklist(report.insights.stabilityAnalysis),
    renderT2CategoryAnalysis(report.insights),
    renderStrategyMatrix(report.diamond),
    renderRoadmap(report.diamond),
    renderOneLiner(report.oneLineForLeader, report.metadata.unitName),
    renderFooter(report.metadata),
  ];

  const full = sections.join('\n\n---\n\n');

  return full;
}

// ─── 섹션별 렌더러 ───

function renderHeader(meta: VIPReportMetadata): string {
  const unitSuffix = meta.unitName.endsWith('시') || meta.unitName.endsWith('군') || meta.unitName.endsWith('구')
    ? '' : '';
  return `# ${meta.unitName} AI 검색 가시성(AEO) 종합 진단 보고서

> **탐색적 측정 — 사전 등록 전 파일럿** (INV-11)
>
> 측정일 ${meta.measuredOn} · 모델 ${meta.model} · 방법론 ${meta.methodVersion}
> ${meta.totalQueries}문항 × ${meta.reps}회 반복 = ${meta.totalQueries * meta.reps}회 측정 · 에러 ${meta.errorCount}건 · 작화 ${meta.absentCount > 0 ? meta.absentCount + '건' : '0건'}`;
}

function renderExecutiveSummary(summary: string): string {
  return `## Executive Summary

${summary}`;
}

function renderDashboard(d: VIPDashboard, meta: VIPReportMetadata): string {
  const t1Pct = Math.round(d.t1Accuracy * 100);
  const t2Pct = Math.round(d.t2RelevanceRate * 100);
  const t3Pct = Math.round(d.t3ShareOfVoice * 100);
  const t1Grade = t1Pct >= 85 ? '🟢 우수' : t1Pct >= 70 ? '🟢 양호' : t1Pct >= 50 ? '🟡 보통' : '🔴 미흡';
  const t2Grade = t2Pct >= 60 ? '🟢 양호' : t2Pct >= 40 ? '🟡 보통' : '🔴 낮음';
  const t3Grade = t3Pct >= 70 ? '🟢 우수' : t3Pct >= 50 ? '🟡 보통' : '🔴 낮음';
  const frGrade = d.floorRisk === 'low' ? '🟢 안전' : d.floorRisk === 'moderate' ? '🟡 주의' : '🔴 위험';

  const total = meta.totalQueries * meta.reps;

  let typeMentionRows = '';
  if (d.t3ByType && d.t3ByType.length > 0) {
    const typeLabels: Record<string, string> = {
      recommendation: '추천',
      association: '연상',
      keyword_entry: '키워드 진입',
      scenario: '시나리오',
      comparison: '비교',
      negative_test: '부정 테스트',
    };
    typeMentionRows = '\n\n### T3 유형별 언급률\n\n' +
      '| 유형 | 언급률 | 해석 |\n|---|---|---|\n' +
      d.t3ByType.map(t => {
        const pct = Math.round(t.rate * 100);
        const label = typeLabels[t.type] || t.type;
        const interp = pct === 0 ? '❌ **미언급**' : pct >= 80 ? '✅ 우수' : pct >= 50 ? '🟡 보통' : '🟠 낮음';
        return `| ${label} | ${pct}% | ${interp} |`;
      }).join('\n');
  }

  return `## 1. AI가 보는 ${meta.unitName} — 한눈에

| 지표 | 결과 | 등급 | 의미 |
|---|---|---|---|
| **기본 행정 정확도** | **${t1Pct}%** (${total}건 중 ${Math.round(d.t1Accuracy * d.t1TotalQuestions * meta.reps)}건) | ${t1Grade} | AI가 행정 정보를 물으면 정확하게 답하는 비율 |
| **고유 정보 인지도** | **${t2Pct}%** | ${t2Grade} | ${meta.unitName} 고유 정보를 포함하여 답하는 비율 |
| **AI 추천 점유율** | **${t3Pct}%** | ${t3Grade} | 추천·비교·시나리오 질문에 ${meta.unitName}이(가) 등장하는 비율 |
| **Floor Risk** | ${d.floorRisk} | ${frGrade} | 작화(존재하지 않는 정보 생성) 위험도 |${typeMentionRows}`;
}

function renderAssociationTest(insights: InsightBundle, unitName: string): string {
  const at = insights.associationTest;
  if (!at || at.responses.length === 0) return '';

  const shortUnit = unitName.replace(/(특별시|광역시|특별자치시|특별자치도|특례시|시|군|구)$/, '');

  let rows = at.responses.map(r => {
    const words = r.words.length > 0 ? r.words.map((w, i) => `${i + 1}. ${w}`).join(' ') : r.rawText.substring(0, 100);
    return `| ${r.rep}회차 | ${words} |`;
  }).join('\n');

  const stableList = at.stableWords.length > 0
    ? at.stableWords.map(w => `**${w}**`).join(', ')
    : '(안정 키워드 없음)';

  const unstableList = at.unstableWords.length > 0
    ? at.unstableWords.map(w => `${w}`).join(', ')
    : '(없음)';

  return `## 2. AI가 가장 잘 아는 ${unitName}

### "${shortUnit} 하면 뭐가 떠올라?" 연상어 테스트

| 반복 | AI가 떠올린 것 |
|---|---|
${rows}

- **안정 키워드** (3/3 등장): ${stableList}
- **불안정 키워드** (1~2/3): ${unstableList}

> 📌 안정 키워드는 **방어 자산**입니다. 관련 페이지 개편 시 기존 텍스트를 보존해야 합니다.`;
}

function renderRecommendationGaps(insights: InsightBundle, unitName: string): string {
  const gaps = insights.recommendationGaps.filter(g => g.targetMissing);
  if (gaps.length === 0) {
    return `## 3. AI 추천 질문에서 ${unitName}의 위치

✅ 모든 추천·시나리오 질문에서 ${unitName}이(가) 언급됩니다.`;
  }

  const rows = gaps.map((g, i) => {
    const ai = g.aiRecommended.substring(0, 60);
    return `| ${i + 1} | ${g.questionText} | ${ai}… |`;
  }).join('\n');

  return `## 3. AI 추천에서 ${unitName}이(가) 빠지는 순간 — 가장 중요한 섹션

### ❌ "${unitName}"이(가) 빠진 질문 (${gaps.length}건)

| # | 질문 | AI가 추천한 곳 |
|---|---|---|
${rows}

> 🔴 **${gaps.length}개 추천/시나리오 질문에서 ${unitName}이(가) 빠집니다.** AI가 ${unitName}을(를) 몰라서가 아니라, **추천 후보 목록에 올릴 만큼의 온라인 콘텐츠가 부족**한 것입니다.`;
}

function renderT1Checklist(stability: StabilityItem[]): string {
  if (!stability || stability.length === 0) return '';

  const t1Items = stability.filter(s =>
    s.questionId.startsWith('B-')
  );

  if (t1Items.length === 0) return '';

  const rows = t1Items.map((s, i) => {
    const reps = s.reps.map(r => {
      if (r.verdict === 'accurate') return '✅';
      if (r.verdict === 'absent') return '—';
      return '🟡';
    }).join(' | ');
    const status = s.status === 'stable' ? '🟢 안정' :
      s.status === 'absent' ? '🔴 **미응답**' : '🟡 불안정';
    return `| ${i + 1} | ${s.question.substring(0, 30)}… | ${reps} | ${status} |`;
  }).join('\n');

  const stableCount = t1Items.filter(s => s.status === 'stable').length;
  const unstableCount = t1Items.filter(s => s.status === 'unstable').length;
  const absentCount = t1Items.filter(s => s.status === 'absent').length;

  return `## 4. 기본 행정 점검표 (${t1Items.length}문항 × 3회)

| # | 질문 | 1회 | 2회 | 3회 | 판정 |
|---|---|---|---|---|---|
${rows}

**🟢 안정 ${stableCount}문항 · 🟡 불안정 ${unstableCount}문항 · 🔴 미응답/위험 ${absentCount}문항**`;
}

function renderT2CategoryAnalysis(insights: InsightBundle): string {
  const cats = insights.categoryInsights;
  if (!cats || cats.length === 0) return '';

  const catLabels: Record<string, string> = {
    specialty_industry: '특산·산업',
    landmark: '시설·랜드마크',
    local_policy: '독자정책',
    heritage: '역사·문화재',
    geography: '지리·생활권',
    local_food: '음식·명소',
    recent_issue: '최근이슈',
  };

  const rows = cats.map(c => {
    const label = catLabels[c.category] || c.category;
    const relevantPct = c.totalQuestions > 0 ? Math.round(c.relevantCount / c.totalQuestions * 100) : 0;
    const genericPct = c.totalQuestions > 0 ? Math.round(c.genericCount / c.totalQuestions * 100) : 0;
    const grade = relevantPct >= 60 ? '🟢' : relevantPct >= 30 ? '🟡' : '🔴';
    return `| ${label} | ${relevantPct}% | ${genericPct}% | ${c.absentCount} | ${grade} |`;
  }).join('\n');

  return `## 5. 고유 정보 카테고리별 분석

| 카테고리 | 고유정보 포함 | 범용 답변 | 미응답 | 등급 |
|---|---|---|---|---|
${rows}

- **고유정보 포함**: AI가 해당 도시만의 구체적 정보를 답한 비율
- **범용 답변**: "시청에 문의하세요" 수준의 일반적 답변`;
}

function renderStrategyMatrix(diamond: DiamondAnalysis): string {
  const defRows = diamond.defenseAreas.map(d =>
    `| D${d.rank} | **${d.area}** | ${d.currentState} | ${d.evidence} | ${d.action} | ${d.cost} |`
  ).join('\n');

  const oppRows = diamond.opportunityAreas.map(o =>
    `| O${o.rank} | **${o.area}** | ${o.currentState} | ${o.evidence} | ${o.action} | ${o.expectedEffect} |`
  ).join('\n');

  return `## 6. 전략 매트릭스 — 기회 vs 방어

### 🛡️ 방어 필수 — "방치하면 시민 민원이 된다"

| 순위 | 영역 | 현재 | 근거 | 조치 | 비용 |
|---|---|---|---|---|---|
${defRows}

### 🚀 기회 영역 — "투자 대비 효과가 큰 곳"

| 순위 | 영역 | 현재 | 근거 | 전략 | 기대 효과 |
|---|---|---|---|---|---|
${oppRows}`;
}

function renderRoadmap(diamond: DiamondAnalysis): string {
  const imm = diamond.roadmap.immediate.map(r => `✅ ${r.action}`).join('\n');
  const one = diamond.roadmap.oneMonth.map(r => `📋 ${r.action}`).join('\n');
  const three = diamond.roadmap.threeMonths.map(r => `🎯 ${r.action}`).join('\n');

  return `## 7. 처방전 — 실행 로드맵

### 즉시 (1주일, 비용 0원)

\`\`\`
${imm}
\`\`\`

### 1개월 (예산 500만원 이내)

\`\`\`
${one}
\`\`\`

### 3개월 (콘텐츠 전략)

\`\`\`
${three}
\`\`\``;
}

function renderOneLiner(oneLiner: string, unitName: string): string {
  const title = unitName.endsWith('시') ? '시장' :
    unitName.endsWith('군') ? '군수' :
    unitName.endsWith('구') ? '구청장' : '단체장';

  return `## 8. ${title}님께 드리는 한 문장

> **${oneLiner}**`;
}

function renderFooter(meta: VIPReportMetadata): string {
  return `*이 보고서는 ${meta.model} 모델의 응답을 분석한 것이며, AI의 응답이 곧 사실은 아닙니다.*
*측정 방법론 ${meta.methodVersion} · ${meta.totalQueries}문항 × ${meta.reps}회 반복*
*이 값은 탐색적 측정이며, 사전 등록된 확정 결과가 아닙니다 (INV-11).*`;
}

// ─── Executive Summary 자동 생성 (규칙 기반) ───

export function generateExecutiveSummary(
  dashboard: VIPDashboard,
  insights: InsightBundle,
  unitName: string
): string {
  const t1Pct = Math.round(dashboard.t1Accuracy * 100);
  const t3Pct = Math.round(dashboard.t3ShareOfVoice * 100);
  const stableWords = insights.associationTest.stableWords;
  const gaps = insights.recommendationGaps.filter(g => g.targetMissing);
  const shortUnit = unitName.replace(/(특별시|광역시|특별자치시|특별자치도|특례시|시|군|구)$/, '');

  let summary = '';

  // 연상어 기반 도입
  if (stableWords.length >= 2) {
    summary += `${unitName}은(는) AI가 **"${stableWords.slice(0, 3).join(' + ')}"**으로 인식하는 도시입니다. `;
  }

  // 기본 행정
  if (t1Pct >= 80) {
    summary += `기본 행정 정보는 ${t1Pct}% 정확도로 양호합니다. `;
  } else {
    summary += `기본 행정 정보의 정확도가 ${t1Pct}%로, 개선이 필요합니다. `;
  }

  // 추천 누락
  if (gaps.length > 0) {
    summary += `\n\n그러나 **"추천해줘"라는 질문에서 ${unitName}이(가) ${gaps.length}건 빠집니다.** `;
    summary += `AI가 ${shortUnit}을(를) 몰라서가 아니라, `;
    summary += `추천 후보에 올릴 만큼의 콘텐츠가 부족하기 때문입니다.`;
  } else if (t3Pct >= 80) {
    summary += `AI 추천 점유율 ${t3Pct}%로, 추천 질문에서 높은 노출을 확보하고 있습니다.`;
  }

  // 처방 방향
  summary += `\n\n**기회**: 홈페이지의 텍스트 구조화(JSON-LD)만으로 개선이 가능합니다.`;

  return summary;
}

// ─── 한 문장 자동 생성 ───

export function generateOneLiner(
  dashboard: VIPDashboard,
  insights: InsightBundle,
  unitName: string
): string {
  const stableWords = insights.associationTest.stableWords;
  const gaps = insights.recommendationGaps.filter(g => g.targetMissing);
  const absentItems = insights.stabilityAnalysis.filter(s => s.status === 'absent');

  if (absentItems.length > 0) {
    const item = absentItems[0];
    return `${unitName}은(는) AI가 ${item.question.substring(0, 15)}…을(를) 3번 물어도 0번 답합니다. 홈페이지에 FAQ 한 페이지를 추가하는 것이 가장 시급한 조치입니다.`;
  }

  if (gaps.length >= 5) {
    return `AI에게 "${gaps[0].questionText.substring(0, 20)}…"를 물으면 ${unitName}이(가) 빠집니다. 홈페이지의 핵심 콘텐츠를 JSON-LD로 구조화하면 비용 없이 AI 추천 목록에 진입할 수 있습니다.`;
  }

  if (stableWords.length >= 2) {
    return `${unitName}은(는) AI 세계에서 "${stableWords.slice(0, 2).join(' + ')}"로 확고히 인식되어 있으며, 텍스트 구조화를 통해 추가 키워드를 확보할 수 있습니다.`;
  }

  return `${unitName}의 AI 검색 가시성은 기본 행정 ${Math.round(dashboard.t1Accuracy * 100)}%, 추천 점유율 ${Math.round(dashboard.t3ShareOfVoice * 100)}%입니다. 홈페이지 구조화로 개선이 가능합니다.`;
}
