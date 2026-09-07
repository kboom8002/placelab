#!/usr/bin/env npx tsx
// scripts/measure-v2/generate-vip-report.ts
// 측정 결과 JSON → VIP 보고서 마크다운 자동 생성
// 사용법: npx tsx scripts/measure-v2/generate-vip-report.ts --unit-id lg-41110 --unit 수원시

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
import type { MeasureResult } from '../../lib/aeo/measure-engine';
import type {
  VIPReport,
  VIPReportMetadata,
  VIPDashboard,
  ScoredResult,
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

// ─── 측정 파일 찾기 ───
function findMeasurementFile(): string {
  if (MEASUREMENT_FILE) return path.resolve(MEASUREMENT_FILE);

  const dir = path.resolve(__dirname, '../../docs/aeo-measurements');
  if (!fs.existsSync(dir)) {
    console.error('❌ docs/aeo-measurements 디렉토리 없음');
    process.exit(1);
  }

  // unit-id에서 숫자만 추출
  const idNum = UNIT_ID.replace(/[^0-9]/g, '');
  const files = fs.readdirSync(dir)
    .filter(f => f.includes(idNum) && f.endsWith('.json'))
    .sort()
    .reverse(); // 최신 파일 우선

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

// ─── 대시보드 계산 ───
function computeDashboard(scored: ScoredResult[], reps: number): VIPDashboard {
  const t1 = scored.filter(r => r.tier === 'T1');
  const t2 = scored.filter(r => r.tier === 'T2');
  const t3 = scored.filter(r => r.tier === 'T3');

  // T1 정확도
  const t1Accurate = t1.filter(r => r.verdict === 'accurate').length;
  const t1Accuracy = t1.length > 0 ? t1Accurate / t1.length : 0;

  // T1 안정 문항 수 (3/3 정확)
  const t1ByQ = new Map<string, string[]>();
  for (const r of t1) {
    if (!t1ByQ.has(r.questionId)) t1ByQ.set(r.questionId, []);
    t1ByQ.get(r.questionId)!.push(r.verdict);
  }
  let t1StableCount = 0;
  for (const [, verdicts] of t1ByQ) {
    if (verdicts.every(v => v === 'accurate')) t1StableCount++;
  }

  // T2 relevant / generic 비율
  const t2Relevant = t2.filter(r => r.verdict === 'accurate_relevant').length;
  const t2Generic = t2.filter(r => r.verdict === 'accurate_generic').length;
  const t2RelevanceRate = t2.length > 0 ? t2Relevant / t2.length : 0;
  const t2GenericRate = t2.length > 0 ? t2Generic / t2.length : 0;

  // T3 Share of Voice
  const t3Mentioned = t3.filter(r => r.targetMentioned === true).length;
  const t3Sov = t3.length > 0 ? t3Mentioned / t3.length : 0;

  // T3 유형별
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
  }));

  // Floor Risk
  const allVerdicts = scored.map(r => r.verdict);
  const floorRisk = calculateFloorRisk(allVerdicts);

  const confabulationCount = scored.filter(r => r.verdict === 'wrong').length;

  return {
    t1Accuracy,
    t1StableCount,
    t1TotalQuestions: t1ByQ.size,
    t2RelevanceRate,
    t2GenericRate,
    t2TotalQuestions: new Set(t2.map(r => r.questionId)).size,
    t3ShareOfVoice: t3Sov,
    t3ByType,
    floorRisk,
    confabulationCount,
  };
}

// ─── 메인 ───
async function main() {
  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`  VIP 보고서 생성`);
  console.log(`  단위: ${UNIT_NAME} (${UNIT_ID})`);
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
  console.log(`  → T1 안정: ${insights.stabilityAnalysis.filter(s => s.status === 'stable').length}문항`);

  // 5. 대시보드 계산
  const reps = rawData.reps || 3;
  const dashboard = computeDashboard(scored, reps);
  console.log(`\n📊 대시보드:`);
  console.log(`  T1 정확도: ${Math.round(dashboard.t1Accuracy * 100)}%`);
  console.log(`  T2 고유정보: ${Math.round(dashboard.t2RelevanceRate * 100)}%`);
  console.log(`  T3 SoV: ${Math.round(dashboard.t3ShareOfVoice * 100)}%`);
  console.log(`  Floor Risk: ${dashboard.floorRisk}`);

  // 6. 다이아몬드 분석
  console.log(`\n⚙️ Stage 3: 다이아몬드 분석 중...`);
  const diamond = analyzeDiamond(insights, dashboard, UNIT_NAME);
  console.log(`  → 강점 ${diamond.signals.strengths.length}, 약점 ${diamond.signals.weaknesses.length}`);
  console.log(`  → 기회 ${diamond.signals.opportunities.length}, 위협 ${diamond.signals.threats.length}`);
  console.log(`  → 방어 ${diamond.defenseAreas.length}건, 기회 ${diamond.opportunityAreas.length}건`);

  // 7. 보고서 조립
  console.log(`\n⚙️ Stage 4: 보고서 렌더링 중...`);
  const metadata: VIPReportMetadata = {
    unitId: UNIT_ID,
    unitName: UNIT_NAME,
    population: 'local_gov',
    measuredOn: rawData.measuredOn || new Date().toISOString().split('T')[0],
    model: rawData.model || 'gpt-5.6-luna',
    methodVersion: rawData.methodVersion || 'v2.1',
    totalQueries: new Set(results.map(r => r.questionId)).size,
    successCount: results.filter(r => r.response && !r.response.startsWith('[ERROR]')).length,
    absentCount: results.filter(r => !r.response || r.response === '(응답 없음)').length,
    errorCount: results.filter(r => r.response?.startsWith('[ERROR]')).length,
    reps,
    isExploratory: true, // INV-11
  };

  const executiveSummary = generateExecutiveSummary(dashboard, insights, UNIT_NAME);
  const oneLineForLeader = generateOneLiner(dashboard, insights, UNIT_NAME);

  const vipReport: VIPReport = {
    metadata,
    dashboard,
    executiveSummary,
    oneLineForLeader,
    insights,
    diamond,
    markdownFull: '',
    markdownSections: [],
  };

  // 마크다운 렌더링
  vipReport.markdownFull = renderVIPReport(vipReport);

  // 8. 저장
  const outDir = path.resolve(__dirname, '../../docs/aeo-reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const dateStr = metadata.measuredOn.replace(/-/g, '');
  const mdFile = path.join(outDir, `vip-${UNIT_ID}-${dateStr}.md`);
  const jsonFile = path.join(outDir, `vip-${UNIT_ID}-${dateStr}.json`);

  fs.writeFileSync(mdFile, vipReport.markdownFull, 'utf-8');
  fs.writeFileSync(jsonFile, JSON.stringify(vipReport, null, 2), 'utf-8');

  console.log(`\n✅ VIP 보고서 생성 완료!`);
  console.log(`  📄 마크다운: ${mdFile}`);
  console.log(`  📊 JSON: ${jsonFile}`);
  console.log(`\n핵심 요약:`);
  console.log(`  ${oneLineForLeader}`);
}

main().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
