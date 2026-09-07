// lib/aeo/vip-renderer.ts
// VIP 보고서 마크다운 렌더러 — DIR-01 서식 표준 적용
// 불변식: INV-3 (순위 금지), INV-6 (원문 제한), INV-9 (Floor Risk 병기), INV-11 (탐색적 표기)
// DIR-01: P-1~P-8 전부 대응, 12항 체크리스트 통과를 전제로 설계

import type {
  VIPReport,
  VIPDashboard,
  VIPReportMetadata,
  InsightBundle,
  DiamondAnalysis,
  StabilityItem,
  R4Candidate,
} from './types/vip-report';
import type { VerificationScore } from './verification-scorer';
import type { CompetitiveResult, ReputationResult, SourceTrackingResult } from './types/probe-extended';

// ─── DIR-01 §A-3: 백분율은 반드시 분자·분모와 함께 ───

function pct(n: number, d: number): string {
  if (d === 0) return '0/0건 (0%)';
  return `${n}/${d}건 (${Math.round(n / d * 1000) / 10}%)`;
}

// ─── 메인 렌더러 — DIR-01 §3.3 목차 순서 + 확대 프로브 ───

export function renderVIPReport(report: VIPReport): string {
  const sections = [
    renderHeader(report.metadata),
    renderExecutiveSummary(report.executiveSummary),
    // §1 주민이 묻는 것에 답하지 못한 것 (생활행정 먼저)
    renderT1Checklist(report.insights.stabilityAnalysis, report.metadata),
    // §1.2 사실 검증 결과 (확대 프로브 T1-V)
    renderVerificationResults(report.verificationScores || []),
    // §2 지켜야 할 자산 (연상어 + 방어)
    renderAssociationTest(report.insights, report.metadata.unitName),
    // §3 이 모델이 우리 지역을 아는 방식 (T2)
    renderT2CategoryAnalysis(report.insights, report.metadata),
    // §4 추천에서 빠지는 지점 (T3)
    renderRecommendationGaps(report.insights, report.metadata),
    // §4.2 경쟁 매트릭스 (확대 프로브 T3-C)
    renderCompetitiveMatrix(report.competitiveResults || [], report.metadata),
    // §5 비용 0원으로 지금 할 수 있는 것 (즉시만)
    renderImmediateActions(report.diamond),
    // §6 이 측정으로는 알 수 없는 것 (DIR-01 §3.4 신설)
    renderLimitations(report.metadata, report.r4Candidates, report.verificationScores),
    // §7 단체장께 드리는 한 문장
    renderOneLiner(report.oneLineForLeader, report.metadata.unitName),
    renderFooter(report.metadata),
  ];

  return sections.filter(s => s.length > 0).join('\n\n---\n\n');
}

// ─── 표지 — DIR-01 §3.1 ───

function renderHeader(meta: VIPReportMetadata): string {
  return `# ${meta.unitName} AI 검색 가시성(AEO) 진단 보고서

> **탐색적 측정 — 사전 등록 전 파일럿** (INV-11)

| 항목 | 값 |
|---|---|
| **발행** | ${meta.publisher} |
| **측정 모델** | \`${meta.model}\` **1종** |
| **측정일** | ${meta.measuredOn} |
| **반복** | ${meta.reps}회 |
| **문항** | ${meta.totalQueries}문항 × ${meta.reps}회 = ${meta.totalQueries * meta.reps}회 측정 |
| **에러** | ${meta.errorCount}건 |
| **방법론** | ${meta.methodVersion} |
| **한계** | 단일 모델 1회 측정. 다른 모델·다른 시점에서 결과가 달라질 수 있음 |`;
}

function renderExecutiveSummary(summary: string): string {
  return `## Executive Summary

${summary}`;
}

// ─── §1 주민이 묻는 것에 답하지 못한 것 (DIR-01 §P-7, §3.3) ───

function renderT1Checklist(stability: StabilityItem[], meta: VIPReportMetadata): string {
  if (!stability || stability.length === 0) return '';

  const t1Items = stability.filter(s => s.questionId.startsWith('B-'));
  if (t1Items.length === 0) return '';

  const rows = t1Items.map((s, i) => {
    const reps = s.reps.map(r => {
      if (r.verdict === 'accurate') return '✅';
      if (r.verdict === 'absent') return '—';
      return '🟡';
    });
    // DIR-01 §A-4: 판정 등급 정의 통일
    const status = s.status === 'stable' ? '안정(3/3)' :
      s.status === 'absent' ? '미응답(0/3)' :
      `불안정(${s.reps.filter(r => r.verdict === 'accurate').length}/3)`;
    return `| ${i + 1} | ${s.question.substring(0, 30)} | ${reps.join(' | ')} | ${status} |`;
  }).join('\n');

  const stableCount = t1Items.filter(s => s.status === 'stable').length;
  const unstableCount = t1Items.filter(s => s.status === 'unstable').length;
  const absentCount = t1Items.filter(s => s.status === 'absent').length;

  // DIR-01 §A-3: 분자·분모 병기
  const totalObs = t1Items.length * meta.reps;
  const successObs = t1Items.reduce((acc, s) =>
    acc + s.reps.filter(r => r.verdict === 'accurate').length, 0);

  return `## 1. 주민이 묻는 것에 이 모델이 답하지 못한 것

> 산출식: 응답 건수 ÷ 총 관측 건수 = ${successObs}/${totalObs}건 (${Math.round(successObs / totalObs * 1000) / 10}%)

| # | 질문 | 1회 | 2회 | 3회 | 판정 |
|---|---|---|---|---|---|
${rows}

**안정(3/3) ${stableCount}문항 · 불안정(1~2/3) ${unstableCount}문항 · 미응답(0/3) ${absentCount}문항**

> 📌 "답했다"와 "맞다"는 다릅니다. 이 표는 이 모델이 **답을 내놓았는지**만 봅니다. 답의 정확성은 원문 대조(이번 측정 범위 밖)가 필요합니다.`;
}

// ─── §2 지켜야 할 자산 (연상어) ───

function renderAssociationTest(insights: InsightBundle, unitName: string): string {
  const at = insights.associationTest;
  if (!at || at.responses.length === 0) return '';

  const shortUnit = unitName.replace(/(특별시|광역시|특별자치시|특별자치도|특례시|시|군|구)$/, '');

  const rows = at.responses.map(r => {
    const words = r.words.length > 0 ? r.words.map((w, i) => `${i + 1}. ${w}`).join(' ') : r.rawText.substring(0, 100);
    return `| ${r.rep}회차 | ${words} |`;
  }).join('\n');

  const stableList = at.stableWords.length > 0
    ? at.stableWords.map(w => `**${w}**`).join(', ')
    : '(안정 키워드 없음)';

  return `## 2. 지켜야 할 자산

### "${shortUnit} 하면 뭐가 떠올라?" — 이 모델의 연상어 테스트

| 반복 | 이 모델이 떠올린 것 |
|---|---|
${rows}

- **안정 키워드** (${at.responses.length}/${at.responses.length} 등장): ${stableList}

> 📌 안정 키워드는 **방어 자산**입니다. 관련 페이지를 개편할 때 기존 텍스트를 보존하십시오. 건드리지 마십시오.`;
}

// ─── §3 이 모델이 우리 지역을 아는 방식 (T2) ───

function renderT2CategoryAnalysis(insights: InsightBundle, meta: VIPReportMetadata): string {
  const cats = insights.categoryInsights;
  if (!cats || cats.length === 0) return '';

  const catLabels: Record<string, string> = {
    specialty_industry: '특산·산업', landmark: '시설·랜드마크',
    local_policy: '독자정책', heritage: '역사·문화재',
    geography: '지리·생활권', local_food: '음식·명소',
    recent_issue: '최근이슈',
  };

  const rows = cats.map(c => {
    const label = catLabels[c.category] || c.category;
    const total = c.totalQuestions * meta.reps;
    const relCount = c.relevantCount;
    const genCount = c.genericCount;
    return `| ${label} | ${pct(relCount, total)} | ${pct(genCount, total)} | ${c.absentCount} |`;
  }).join('\n');

  return `## 3. 이 모델이 ${meta.unitName}을(를) 아는 방식

| 카테고리 | 고유정보 포함 | 범용 답변 | 미응답 |
|---|---|---|---|
${rows}

- **고유정보 포함**: 이 모델이 ${meta.unitName}만의 구체적 정보를 포함하여 답한 비율
- **범용 답변**: "시청에 문의하세요" 수준의 답변`;
}

// ─── §4 추천에서 빠지는 지점 (T3) ───

function renderRecommendationGaps(insights: InsightBundle, meta: VIPReportMetadata): string {
  const gaps = insights.recommendationGaps.filter(g => g.targetMissing);

  // DIR-01 §3.2: "AI가" → "이 모델은"
  // DIR-01 §A-3: 분자·분모 병기
  const t3Types = insights.t3MentionByType;
  const typeLabels: Record<string, string> = {
    recommendation: '추천', association: '연상', keyword_entry: '키워드 진입',
    scenario: '시나리오', comparison: '비교', negative_test: '부정 테스트',
  };

  let typeRows = '';
  if (t3Types.length > 0) {
    typeRows = '\n### 유형별 언급률\n\n| 유형 | 언급 | 해석 |\n|---|---|---|\n' +
      t3Types.map(t => {
        const label = typeLabels[t.type] || t.type;
        const interp = t.rate === 0 ? '❌ 미언급' : t.rate >= 0.8 ? '✅' : '🟡';
        return `| ${label} | ${pct(t.mentioned, t.total)} | ${interp} |`;
      }).join('\n');
  }

  if (gaps.length === 0) {
    return `## 4. 추천에서 ${meta.unitName}의 위치

이 모델의 추천·시나리오 질문에서 ${meta.unitName}이(가) 모두 언급되었습니다.${typeRows}`;
  }

  const rows = gaps.slice(0, 10).map((g, i) => {
    const ai = g.aiRecommended.substring(0, 50);
    return `| ${i + 1} | ${g.questionText.substring(0, 35)} | ${ai}… |`;
  }).join('\n');

  return `## 4. 추천에서 ${meta.unitName}이(가) 빠지는 지점

### 이 모델이 ${meta.unitName}을(를) 빼놓은 질문 (${gaps.length}건)

| # | 질문 | 이 모델이 추천한 곳 |
|---|---|---|
${rows}

> 이 모델이 ${meta.unitName}을(를) 몰라서가 아닙니다. 직접 물으면 답합니다. **추천 후보에 올릴 만큼의 온라인 콘텐츠가 부족**한 것으로 보입니다.${typeRows}`;
}

// ─── §5 비용 0원으로 지금 할 수 있는 것 (DIR-01 §P-5) ───

function renderImmediateActions(diamond: DiamondAnalysis): string {
  const imm = diamond.roadmap.immediate;
  if (imm.length === 0) return '';

  const rows = imm.map(r => `- ✅ ${r.action}`).join('\n');

  return `## 5. 비용 0원으로 지금 할 수 있는 것

${rows}

> 1개월·3개월 조치는 이 측정만으로 순서를 정할 근거가 부족합니다. 반복 측정 후 우선순위를 확정할 수 있습니다.`;
}

// ─── §1.2 사실 검증 결과 (확대 프로브 T1-V) ───

function renderVerificationResults(scores: VerificationScore[]): string {
  if (!scores || scores.length === 0) return '';

  const correct = scores.filter(s => s.verdict === 'correct').length;
  const wrong = scores.filter(s => s.verdict === 'wrong_value').length;
  const outdated = scores.filter(s => s.verdict === 'outdated').length;
  const wrongProc = scores.filter(s => s.verdict === 'wrong_procedure').length;
  const absent = scores.filter(s => s.verdict === 'absent').length;
  const total = scores.length;

  const rows = scores.map((s, i) => {
    const icon = s.verdict === 'correct' ? '✅' :
      s.verdict === 'absent' ? '—' :
      s.verdict === 'outdated' ? '🟡' : '❌';
    const verdictLabel = s.verdict === 'correct' ? '정확' :
      s.verdict === 'wrong_value' ? '오류' :
      s.verdict === 'outdated' ? '구버전' :
      s.verdict === 'wrong_procedure' ? '절차오류' : '미응답';
    return `| ${i + 1} | ${s.questionId} | ${icon} ${verdictLabel} | ${s.gtValue} | ${s.aiValue || '—'} |`;
  }).join('\n');

  return `### 1.2 이 모델이 틀리게 답한 것 (사실 검증)

> 핵심 ${total}건의 구체적 사실을 공식 정보와 대조했습니다.
> 정확 ${correct} · 오류 ${wrong + wrongProc} · 구버전 ${outdated} · 미응답 ${absent}

| # | 문항 | 판정 | 공식 정보 | 이 모델의 답 |
|---|---|---|---|---|
${rows}

${wrong + wrongProc > 0 ? `> ⚠️ **${wrong + wrongProc}건의 사실 오류**가 확인되었습니다. 이 모델은 주민에게 잘못된 정보를 안내할 수 있습니다.` : '> 검증 범위 내에서 사실 오류는 발견되지 않았습니다.'}`;
}

// ─── §4.2 경쟁 매트릭스 (확대 프로브 T3-C) ───

function renderCompetitiveMatrix(results: CompetitiveResult[], meta: VIPReportMetadata): string {
  if (!results || results.length === 0) return '';

  // 모든 경쟁자 수집
  const allCompetitors = [...new Set(results.flatMap(r => r.competitorsMentioned.map(c => c.name)))];
  if (allCompetitors.length === 0) return '';

  const header = `| 질문 | ${meta.unitName} | ${allCompetitors.join(' | ')} |`;
  const sep = `|---|${['---', ...allCompetitors.map(() => '---')].join('|')}|`;

  const rows = results.map(r => {
    const target = r.targetMentioned ? '✅' : '❌';
    const comps = allCompetitors.map(name => {
      const comp = r.competitorsMentioned.find(c => c.name === name);
      return comp?.mentioned ? '✅' : '—';
    }).join(' | ');
    return `| ${r.question.substring(0, 25)} | ${target} | ${comps} |`;
  }).join('\n');

  const wins = results.filter(r => r.targetMentioned).length;
  const losses = results.filter(r => !r.targetMentioned && r.competitorsMentioned.some(c => c.mentioned)).length;

  return `### 4.2 경쟁자 대비 언급 매트릭스

${header}
${sep}
${rows}

> ${meta.unitName} 언급: ${pct(wins, results.length)} · 경쟁자만 언급(우리 누락): ${losses}건`;
}

// ─── §6 이 측정으로는 알 수 없는 것 (DIR-01 §3.4 신설) ───

function renderLimitations(meta: VIPReportMetadata, r4Candidates: R4Candidate[], verificationScores?: VerificationScore[]): string {
  let r4Section = '';
  if (r4Candidates && r4Candidates.length > 0) {
    const r4Rows = r4Candidates.map(r =>
      `> **${r.question.substring(0, 30)}**: ${r.observation}. ${r.hypothesis}`
    ).join('\n>\n');

    r4Section = `\n\n### 정보 문제가 아닐 수 있는 항목\n\n${r4Rows}\n\n> 위 항목은 단정이 아닙니다. 확인하지 않았으며, "~일 수 있습니다"입니다.`;
  }

  // 사실 검증을 수행했으면 §6.1을 업데이트
  const hasVerification = verificationScores && verificationScores.length > 0;
  const verNote = hasVerification
    ? `핵심 ${verificationScores!.length}건의 원문 대조를 수행했습니다. 나머지 문항의 원문 대조는 수행하지 않았습니다.`
    : '이 모델의 답이 실제 공식 정보와 일치하는지는 확인하지 않았습니다. 원문 대조는 이번 측정 범위 밖입니다.';

  return `## 6. 이 측정으로는 알 수 없는 것

1. **"답했다"와 "맞다"는 다릅니다.** ${verNote}

2. **빈칸의 원인을 가르지 않았습니다.** 각 빈칸이 ① 정보가 틀렸거나 ② 기계가 못 읽거나 ③ 여러 곳에 다르게 있거나 ④ 정보를 고쳐도 해결되지 않는 절차 문제인지 구분하지 않았습니다.

3. **우선순위를 정할 수 없습니다.** \`${meta.model}\` 1종, 1회 측정으로는 무엇을 먼저 할지 확정할 근거가 부족합니다. 반복 측정이 필요합니다.${r4Section}`;
}

// ─── §7 한 문장 ───

function renderOneLiner(oneLiner: string, unitName: string): string {
  const title = unitName.endsWith('시') ? '시장' :
    unitName.endsWith('군') ? '군수' :
    unitName.endsWith('구') ? '구청장' : '단체장';

  return `## 7. ${title}님께 드리는 한 문장

> **${oneLiner}**`;
}

function renderFooter(meta: VIPReportMetadata): string {
  return `*발행: ${meta.publisher}*
*이 보고서는 \`${meta.model}\` 1종의 응답을 분석한 것이며, 이 모델의 응답이 곧 사실은 아닙니다.*
*방법론 ${meta.methodVersion} · ${meta.totalQueries}문항 × ${meta.reps}회 반복 · 단일 모델 1회 측정*
*이 값은 탐색적 측정이며, 사전 등록된 확정 결과가 아닙니다 (INV-11).*`;
}

// ─── Executive Summary 자동 생성 (DIR-01 §3.2 적용) ───

export function generateExecutiveSummary(
  dashboard: VIPDashboard,
  insights: InsightBundle,
  unitName: string,
  meta: VIPReportMetadata
): string {
  const stableWords = insights.associationTest.stableWords;
  const gaps = insights.recommendationGaps.filter(g => g.targetMissing);
  const absentItems = insights.stabilityAnalysis.filter(s => s.status === 'absent');
  const unstableItems = insights.stabilityAnalysis.filter(s => s.status === 'unstable');

  let summary = '';

  // 생활행정 먼저 (DIR-01 §P-7)
  if (absentItems.length > 0) {
    const item = absentItems[0];
    summary += `${meta.reps}회 반복 측정에서, 주민이 실제로 묻는 **${item.question.substring(0, 15)}** 등 ${absentItems.length}개 문항에 이 모델은 **한 번도 답하지 못했습니다.** `;
  }
  if (unstableItems.length > 0) {
    summary += `${unstableItems.length}개 문항은 ${meta.reps}회 중 일부만 답했습니다. `;
  }

  // 응답률 (DIR-01 §A-3: 분자·분모 병기)
  summary += `기본 행정 15문항의 응답률은 ${pct(dashboard.t1ResponseCount, dashboard.t1TotalCount)}입니다.\n\n`;

  // 연상어
  if (stableWords.length >= 1) {
    summary += `이 모델에게 "${unitName} 하면?"을 물으면 **${stableWords.slice(0, 3).join(' · ')}**을(를) 답합니다. `;
  }

  // 추천 누락
  if (gaps.length > 0) {
    summary += `그러나 "추천해줘"에서 ${unitName}이(가) 빠지는 질문이 ${gaps.length}건입니다.`;
  }

  return summary.trim();
}

// ─── 한 문장 자동 생성 (DIR-01 §3.2 적용) ───

export function generateOneLiner(
  dashboard: VIPDashboard,
  insights: InsightBundle,
  unitName: string,
  meta: VIPReportMetadata
): string {
  const absentItems = insights.stabilityAnalysis.filter(s => s.status === 'absent');
  const gaps = insights.recommendationGaps.filter(g => g.targetMissing);

  if (absentItems.length > 0) {
    const item = absentItems[0];
    return `이 모델에게 ${item.question.substring(0, 15)}을(를) ${meta.reps}번 물어도 0번 답합니다. 홈페이지에 이 정보를 텍스트로 게시하는 것이 가장 시급합니다.`;
  }

  if (gaps.length >= 5) {
    return `이 모델에게 "${gaps[0].questionText.substring(0, 20)}…"를 물으면 ${unitName}이(가) 빠집니다. 홈페이지 핵심 콘텐츠를 구조화하면 추천 목록 진입이 가능합니다.`;
  }

  return `이 모델은 ${unitName}의 기본 행정 정보에 ${pct(dashboard.t1ResponseCount, dashboard.t1TotalCount)} 응답했습니다. 홈페이지 구조화로 개선 여지가 있습니다.`;
}
