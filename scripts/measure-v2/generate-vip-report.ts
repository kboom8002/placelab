#!/usr/bin/env npx tsx
// scripts/measure-v2/generate-vip-report.ts
// 측정 결과 JSON → VIP 보고서 마크다운 자동 생성
// DIR-01 서식 표준 적용 · 12항 체크리스트 자동 검증
// 사용법: npx tsx scripts/measure-v2/generate-vip-report.ts --unit 수원시 --unit-id lg-41110

import * as fs from 'fs';
import * as path from 'path';
import { scoreAll } from '../../lib/aeo/scored-result';
import { extractInsights } from '../../lib/aeo/insight-extractor';
import { analyzeDiamond } from '../../lib/aeo/diamond-analyzer';
import {
  renderVIPReport,
  generateExecutiveSummary,
  generateOneLiner,
} from '../../lib/aeo/vip-renderer';
import { calculateFloorRisk } from '../../lib/aeo/scorer';
import { runChecklist, printChecklistResults } from '../../lib/aeo/report-checklist';
import {
  scoreVerification,
  scoreCompetitive,
  scoreReputation,
  scoreSourceTracking,
} from '../../lib/aeo/verification-scorer';
import type { MeasureResult } from '../../lib/aeo/measure-engine';
import type {
  VIPReport,
  VIPReportMetadata,
  VIPDashboard,
  ScoredResult,
  R4Candidate,
} from '../../lib/aeo/types/vip-report';

// ─── CLI 인자 파싱 ───
const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

const UNIT_NAME = getArg('unit') || '수원시';
const UNIT_ID = getArg('unit-id') || 'lg-41110';
const MEASUREMENT_FILE = getArg('file');

// DIR-01 §P-8: 발행 주체
const PUBLISHER = '(주)디지털미디어네트워크';

// ─── 측정 파일 찾기 ───
function findMeasurementFile(): string {
  if (MEASUREMENT_FILE) return path.resolve(MEASUREMENT_FILE);

  const dir = path.resolve(__dirname, '../../docs/aeo-measurements');
  if (!fs.existsSync(dir)) {
    console.error('❌ docs/aeo-measurements 디렉토리 없음');
    process.exit(1);
  }

  const idNum = UNIT_ID.replace(/[^0-9]/g, '');
  const files = fs.readdirSync(dir)
    .filter(f => f.includes(idNum) && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error(`❌ ${idNum}에 대한 측정 파일 없음`);
    process.exit(1);
  }

  return path.join(dir, files[0]);
}

// ─── T2/T3 질문 파일 로드 ───
function loadTier2Questions() {
  const f = path.resolve(__dirname, `../../docs/aeo-questions/${UNIT_ID}-tier2.json`);
  if (!fs.existsSync(f)) return [];
  const raw = JSON.parse(fs.readFileSync(f, 'utf-8'));
  return Array.isArray(raw) ? raw : (raw.questions || []);
}

function loadTier3Questions() {
  const f = path.resolve(__dirname, `../../docs/aeo-questions/${UNIT_ID}-tier3.json`);
  if (!fs.existsSync(f)) return [];
  return JSON.parse(fs.readFileSync(f, 'utf-8'));
}

// ─── DIR-01 §A-2: 대시보드 재계산 (원자료 기반) ───
function computeDashboard(scored: ScoredResult[], reps: number): VIPDashboard {
  const t1 = scored.filter(r => r.tier === 'T1');
  const t2 = scored.filter(r => r.tier === 'T2');
  const t3 = scored.filter(r => r.tier === 'T3');

  // T1: 응답률 (정확도가 아님 — DIR-01 §P-2)
  const t1Responded = t1.filter(r => r.verdict !== 'absent').length;
  const t1ResponseRate = t1.length > 0 ? t1Responded / t1.length : 0;

  // T1 문항별 안정도
  const t1ByQ = new Map<string, string[]>();
  for (const r of t1) {
    if (!t1ByQ.has(r.questionId)) t1ByQ.set(r.questionId, []);
    t1ByQ.get(r.questionId)!.push(r.verdict);
  }
  let t1StableCount = 0, t1UnstableCount = 0, t1AbsentCount = 0;
  for (const [, verdicts] of t1ByQ) {
    const respondedCount = verdicts.filter(v => v !== 'absent').length;
    if (respondedCount === reps) t1StableCount++;
    else if (respondedCount === 0) t1AbsentCount++;
    else t1UnstableCount++;
  }

  // T2
  const t2Relevant = t2.filter(r => r.verdict === 'accurate_relevant').length;
  const t2Generic = t2.filter(r => r.verdict === 'accurate_generic').length;
  const t2RelevanceRate = t2.length > 0 ? t2Relevant / t2.length : 0;
  const t2GenericRate = t2.length > 0 ? t2Generic / t2.length : 0;

  // T3
  const t3Mentioned = t3.filter(r => r.targetMentioned === true).length;
  const t3Sov = t3.length > 0 ? t3Mentioned / t3.length : 0;

  // T3 유형별 — DIR-01 §A-3: 분자·분모 병기
  const typeGroups = new Map<string, { mentioned: number; total: number }>();
  for (const r of t3) {
    const type = r.category;
    if (!typeGroups.has(type)) typeGroups.set(type, { mentioned: 0, total: 0 });
    const g = typeGroups.get(type)!;
    g.total++;
    if (r.targetMentioned) g.mentioned++;
  }
  const t3ByType = Array.from(typeGroups.entries()).map(([type, g]) => ({
    type,
    rate: g.total > 0 ? g.mentioned / g.total : 0,
    mentioned: g.mentioned,
    total: g.total,
  }));

  // Floor Risk
  const allVerdicts = scored.map(r => r.verdict);
  const floorRisk = calculateFloorRisk(allVerdicts);
  const confabulationCount = scored.filter(r => r.verdict === 'wrong').length;

  return {
    t1ResponseRate,
    t1ResponseCount: t1Responded,
    t1TotalCount: t1.length,
    t1StableCount,
    t1UnstableCount,
    t1AbsentCount,
    t1TotalQuestions: t1ByQ.size,
    t2RelevanceRate,
    t2RelevanceCount: t2Relevant,
    t2TotalCount: t2.length,
    t2GenericRate,
    t2TotalQuestions: new Set(t2.map(r => r.questionId)).size,
    t3ShareOfVoice: t3Sov,
    t3MentionCount: t3Mentioned,
    t3TotalCount: t3.length,
    t3ByType,
    floorRisk,
    confabulationCount,
  };
}

// ─── DIR-01 §3.5: R4 후보 탐지 ───
function detectR4Candidates(
  stability: { questionId: string; question: string; status: string; reps: { rep: number; verdict: string }[] }[]
): R4Candidate[] {
  const candidates: R4Candidate[] = [];

  for (const s of stability) {
    if (!s.questionId.startsWith('B-')) continue;
    // R4: 응답은 했지만 불안정 (2/3) — 정보가 있는데 안정적이지 않은 것
    const respondedCount = s.reps.filter(r => r.verdict !== 'absent').length;
    if (respondedCount >= 2 && s.status === 'unstable') {
      candidates.push({
        questionId: s.questionId,
        question: s.question,
        observation: `${s.reps.length}회 중 ${respondedCount}회 답했지만 일관되지 않음`,
        hypothesis: '안내 자체는 확인되지만, 이것은 안내의 문제가 아니라 신청 절차나 창구 운영의 문제일 수 있습니다. 이 구분은 이번 측정 범위 밖입니다.',
      });
    }
  }

  return candidates.slice(0, 3); // 최대 3건
}

// ─── 메인 ───
async function main() {
  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`  VIP 보고서 생성 (DIR-01 서식 표준)`);
  console.log(`  단위: ${UNIT_NAME} (${UNIT_ID})`);
  console.log(`  발행: ${PUBLISHER}`);
  console.log(`═══════════════════════════════════════════════════\n`);

  // 1. 측정 파일 로드
  const measureFile = findMeasurementFile();
  console.log(`📂 측정 파일: ${measureFile}`);
  const rawData = JSON.parse(fs.readFileSync(measureFile, 'utf-8'));
  const results: MeasureResult[] = rawData.results;
  console.log(`  → ${results.length}건 로드됨`);

  // 2. T2/T3 질문 로드
  const t2q = loadTier2Questions();
  const t3q = loadTier3Questions();
  console.log(`  → T2 질문 ${t2q.length}개, T3 질문 ${t3q.length}개`);

  // 3. 채점
  console.log(`\n⚙️ Stage 1: 채점 중...`);
  const scored = scoreAll(results, UNIT_NAME, t2q, t3q);
  console.log(`  → ${scored.length}건 채점 완료`);

  // 4. 인사이트 추출
  console.log(`⚙️ Stage 2: 인사이트 추출 중...`);
  const insights = extractInsights(scored, UNIT_NAME, t2q, t3q);
  console.log(`  → 연상어: ${insights.associationTest.stableWords.join(', ') || '(없음)'}`);
  console.log(`  → 추천 누락: ${insights.recommendationGaps.filter(g => g.targetMissing).length}건`);

  // 5. 대시보드 계산 (DIR-01 §A-2: 원자료 기반 재계산)
  const reps = rawData.reps || 3;
  const dashboard = computeDashboard(scored, reps);
  console.log(`\n📊 대시보드 (DIR-01 재계산):`);
  console.log(`  T1 응답률: ${dashboard.t1ResponseCount}/${dashboard.t1TotalCount}건 (${Math.round(dashboard.t1ResponseRate * 1000) / 10}%)`);
  console.log(`  T1 안정/불안정/미응답: ${dashboard.t1StableCount}/${dashboard.t1UnstableCount}/${dashboard.t1AbsentCount}`);
  console.log(`  T2 고유정보: ${dashboard.t2RelevanceCount}/${dashboard.t2TotalCount}건 (${Math.round(dashboard.t2RelevanceRate * 1000) / 10}%)`);
  console.log(`  T3 SoV: ${dashboard.t3MentionCount}/${dashboard.t3TotalCount}건 (${Math.round(dashboard.t3ShareOfVoice * 1000) / 10}%)`);

  // 6. R4 후보 탐지 (DIR-01 §3.5)
  const r4Candidates = detectR4Candidates(insights.stabilityAnalysis);
  console.log(`  R4 후보: ${r4Candidates.length}건`);

  // 6.5 확대 프로브 채점 (T1-V, T3-C, T3-D, T4)
  console.log(`\n⚙️ Stage 2.5: 확대 프로브 채점 중...`);
  const t1vResults = results.filter(r => r.tier === 'T1-V');
  const t3cResults = results.filter(r => r.tier === 'T3-C');
  const t3dResults = results.filter(r => r.tier === 'T3-D');
  const t4Results = results.filter(r => r.tier === 'T4');

  // T1-V: 사실 검증 채점
  let verificationScores: any[] = [];
  const t1vProbeFile = path.resolve(__dirname, `../../docs/aeo-questions/${UNIT_ID}-t1v.json`);
  if (t1vResults.length > 0 && fs.existsSync(t1vProbeFile)) {
    const t1vProbes = JSON.parse(fs.readFileSync(t1vProbeFile, 'utf-8'));
    for (const probe of (Array.isArray(t1vProbes) ? t1vProbes : t1vProbes.questions || [])) {
      // 다수결: 3회 중 가장 많은 verdict
      const reps = t1vResults.filter(r => r.questionId === probe.id);
      if (reps.length === 0) continue;
      const scores = reps.map(r => scoreVerification(r.response, probe));
      // 대표 결과: 첫번째 rep 기준 (후속 안정성 분석에서 개선 가능)
      verificationScores.push(scores[0]);
    }
    const correct = verificationScores.filter(s => s.verdict === 'correct').length;
    const wrong = verificationScores.filter(s => s.verdict === 'wrong_value' || s.verdict === 'wrong_procedure').length;
    const outdated = verificationScores.filter(s => s.verdict === 'outdated').length;
    console.log(`  T1-V: 정확 ${correct} · 오류 ${wrong} · 구버전 ${outdated} / ${verificationScores.length}건`);
  }

  // T3-C: 경쟁 매핑 채점
  let competitiveResults: any[] = [];
  const t3cProbeFile = path.resolve(__dirname, `../../docs/aeo-questions/${UNIT_ID}-t3c.json`);
  if (t3cResults.length > 0 && fs.existsSync(t3cProbeFile)) {
    const t3cProbes = JSON.parse(fs.readFileSync(t3cProbeFile, 'utf-8'));
    for (const probe of (Array.isArray(t3cProbes) ? t3cProbes : t3cProbes.questions || [])) {
      const reps = t3cResults.filter(r => r.questionId === probe.id);
      if (reps.length === 0) continue;
      // 대표 결과: 1회차 기준
      competitiveResults.push(scoreCompetitive(reps[0].response, probe, UNIT_NAME));
    }
    const wins = competitiveResults.filter(r => r.targetMentioned).length;
    console.log(`  T3-C: ${UNIT_NAME} 언급 ${wins}/${competitiveResults.length}건`);
  }

  // T3-D: 평판 채점
  let reputationResults: any[] = [];
  const t3dProbeFile = path.resolve(__dirname, `../../docs/aeo-questions/${UNIT_ID}-t3d.json`);
  if (t3dResults.length > 0 && fs.existsSync(t3dProbeFile)) {
    const t3dProbes = JSON.parse(fs.readFileSync(t3dProbeFile, 'utf-8'));
    for (const probe of (Array.isArray(t3dProbes) ? t3dProbes : t3dProbes.questions || [])) {
      const reps = t3dResults.filter(r => r.questionId === probe.id);
      if (reps.length === 0) continue;
      reputationResults.push(scoreReputation(reps[0].response, probe));
    }
    const highRisk = reputationResults.filter(r => r.severity === 'high').length;
    console.log(`  T3-D: 고위험 ${highRisk}/${reputationResults.length}건`);
  }

  // T4: 출처 추적 채점
  let sourceTrackingResults: any[] = [];
  const t4ProbeFile = path.resolve(__dirname, `../../docs/aeo-questions/${UNIT_ID}-t4.json`);
  if (t4Results.length > 0 && fs.existsSync(t4ProbeFile)) {
    const t4Probes = JSON.parse(fs.readFileSync(t4ProbeFile, 'utf-8'));
    for (const probe of (Array.isArray(t4Probes) ? t4Probes : t4Probes.questions || [])) {
      const reps = t4Results.filter(r => r.questionId === probe.id);
      if (reps.length === 0) continue;
      sourceTrackingResults.push(scoreSourceTracking(reps[0].response, probe));
    }
    const official = sourceTrackingResults.filter(r => r.sourceQuality === 'official').length;
    console.log(`  T4: 공식 출처 ${official}/${sourceTrackingResults.length}건`);
  }

  // 7. 다이아몬드 분석
  console.log(`\n⚙️ Stage 3: 다이아몬드 분석 중...`);
  const diamond = analyzeDiamond(insights, dashboard, UNIT_NAME);

  // 8. 메타데이터
  const metadata: VIPReportMetadata = {
    unitId: UNIT_ID,
    unitName: UNIT_NAME,
    population: 'local_gov',
    measuredOn: rawData.measurement?.completed_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    model: rawData.measurement?.model || 'gpt-5.6-luna',
    methodVersion: rawData.measurement?.method_version || 'v2.2',
    totalQueries: new Set(results.map(r => r.questionId)).size,
    successCount: results.filter(r => r.response && !r.response.startsWith('[ERROR]')).length,
    absentCount: results.filter(r => !r.response || r.response === '(응답 없음)').length,
    errorCount: results.filter(r => r.response?.startsWith('[ERROR]')).length,
    reps,
    isExploratory: true,
    publisher: PUBLISHER,
  };

  // 9. 보고서 조립
  console.log(`⚙️ Stage 4: 보고서 렌더링 중...`);
  const executiveSummary = generateExecutiveSummary(dashboard, insights, UNIT_NAME, metadata);
  const oneLineForLeader = generateOneLiner(dashboard, insights, UNIT_NAME, metadata);

  const vipReport: VIPReport = {
    metadata,
    dashboard,
    executiveSummary,
    oneLineForLeader,
    insights,
    diamond,
    r4Candidates,
    // 확대 프로브 결과 (v2.2)
    verificationScores: verificationScores.length > 0 ? verificationScores : undefined,
    competitiveResults: competitiveResults.length > 0 ? competitiveResults : undefined,
    reputationResults: reputationResults.length > 0 ? reputationResults : undefined,
    sourceTrackingResults: sourceTrackingResults.length > 0 ? sourceTrackingResults : undefined,
    markdownFull: '',
    markdownSections: [],
  };

  vipReport.markdownFull = renderVIPReport(vipReport);

  // 10. 12항 체크리스트 (DIR-01 부록)
  const checkResults = runChecklist(vipReport);
  const allPassed = printChecklistResults(checkResults);

  // 11. 저장
  const outDir = path.resolve(__dirname, '../../docs/aeo-reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const dateStr = metadata.measuredOn.replace(/-/g, '');
  const suffix = allPassed ? '' : '_DRAFT';
  const mdFile = path.join(outDir, `vip-${UNIT_ID}-${dateStr}${suffix}.md`);
  const jsonFile = path.join(outDir, `vip-${UNIT_ID}-${dateStr}${suffix}.json`);

  fs.writeFileSync(mdFile, vipReport.markdownFull, 'utf-8');
  fs.writeFileSync(jsonFile, JSON.stringify(vipReport, null, 2), 'utf-8');

  console.log(`\n${allPassed ? '✅' : '⚠️'} VIP 보고서 생성 ${allPassed ? '완료' : '(DRAFT)'}!`);
  console.log(`  📄 마크다운: ${mdFile}`);
  console.log(`  📊 JSON: ${jsonFile}`);
  console.log(`\n한 문장: ${oneLineForLeader}`);
}

main().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
