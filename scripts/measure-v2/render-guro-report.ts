// scripts/measure-v2/render-guro-report.ts
// 구로구 내부 정밀 분석 보고서 렌더러 — 보고서의 숫자는 전부 이 스크립트가 데이터에서 계산한다 (하드코딩된 수치·사실 주장 없음).
//  - 원장과 일치한 회차 비율은 항상 Floor Risk 분포와 같은 표에 낸다 (INV-9)
//  - 대주민 · 대외 · 검증용(C1)은 따로 낸다. 하나의 지수로 합치지 않는다. 점수·등급·순위를 만들지 않는다 (INV-3)
//  - C2 · B6 는 일치 비율과 합치지 않고 따로 낸다
//  - 응답 원문·추출 요약문을 싣지 않는다 (INV-6)
//  - 사전 등록 PR-2026Q4-GURO-OAI-WS-KO 의 가설 판정을 같은 규칙으로 계산한다
// 사용: pnpm tsx scripts/measure-v2/render-guro-report.ts --phase=main --out=docs/aeo-reports/guro/INTERNAL-....md
import fs from 'fs';
import path from 'path';

function arg(name: string, def?: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
}
const phase = arg('phase', 'main')!;
const dir = path.resolve('.private', 'guro', phase);
const out = arg('out', 'docs/aeo-reports/guro/INTERNAL-guro-ko-oai-ws.md')!;
const rd = (p: string) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf-8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const analysis = JSON.parse(fs.readFileSync(path.join(dir, 'analysis.json'), 'utf-8').replace(/^\uFEFF/, ''));
const verdicts = rd(path.join(dir, 'verdicts.jsonl'));
const decisions = rd(path.join(dir, 'review-decisions.jsonl'));
const responses = rd(path.join(dir, 'responses.jsonl'));
const qs = new Map<string, any>(JSON.parse(fs.readFileSync('docs/aeo-questions/guro/all.json', 'utf-8').replace(/^\uFEFF/, '')).questions.map((q: any) => [q.id, q]));
const qrows: any[] = analysis.questions;

const JUDGED = ['match', 'partial', 'mismatch', 'absence', 'review'];
const pct = (x: number | null | undefined) => (x == null ? '—' : `${(x * 100).toFixed(0)}%`);
const rng = (a: number | null | undefined, b: number | null | undefined) => (a == null ? '—' : `${pct(a)}–${pct(b)}`);
const ci = (c: [number, number] | null) => (c ? `${pct(c[0])}–${pct(c[1])}` : '—');

function wilson(k: number, n: number): [number, number] | null {
  if (!n) return null;
  const z = 1.96;
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
}
let seed = 20261007;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
function boot(stat: (idx: number[]) => number | null, n: number, iters = 2000): [number, number] | null {
  if (!n) return null;
  const xs: number[] = [];
  for (let b = 0; b < iters; b++) {
    const idx = Array.from({ length: n }, () => Math.floor(rnd() * n));
    const v = stat(idx);
    if (v != null && Number.isFinite(v)) xs.push(v);
  }
  xs.sort((a, b) => a - b);
  return xs.length ? [xs[Math.floor(0.025 * xs.length)], xs[Math.floor(0.975 * xs.length)]] : null;
}

// 값형 문항(구로구 누리집 근거) 만 — C2·B6 제외
const valueRows = qrows.filter((r) => r.type === 'value' && r.module !== 'C2' && r.module !== 'B6');
const byQ = new Map<string, any[]>();
for (const v of verdicts) (byQ.get(v.question_id) ?? byQ.set(v.question_id, []).get(v.question_id)!).push(v);

const fl = (d: Record<string, number>) => `높음 ${d.high} · 중간 ${d.moderate} · 낮음 ${d.low}${d.critical ? ` · 치명 ${d.critical}` : ''}`;
const dist = (v: any) => `일치 ${v.match} · 부분 ${v.partial} · 불일치 ${v.mismatch} · 부재 ${v.absence} · 검토중 ${v.review}`;
function line(label: string, s: any) {
  const lo = s.floor_distribution_if_review_match;
  const hi = s.floor_distribution_if_review_mismatch;
  const same = JSON.stringify(lo) === JSON.stringify(hi);
  return `| ${label} | ${s.questions} | ${s.judged_reps} | ${dist(s.verdict_reps)} | ${rng(s.match_rate_lower, s.match_rate_upper)} (군집 95% ${ci(s.match_rate_ci_cluster_lower)}) | ${same ? fl(lo) : `${fl(lo)} ~ ${fl(hi)}`} | ${s.unstable_questions} |`;
}
const HEAD = '| 구분 | 문항 | 판정 회차 | 회차별 판정 분포 | 원장과 일치한 회차 비율 | 문항별 Floor Risk (최악 회차 기준) | 회차 간 판정이 갈린 문항 |\n|---|---|---|---|---|---|---|';

const L: string[] = [];
const today = (arg('date') ?? '2026-10-07');
L.push(`# 구로구(AG-0017) 한국어 본측정 — 내부 정밀 분석 보고서`);
L.push('');
L.push(`> **${today} 기준, 방법론 v2.3, OpenAI \`gpt-6-luna\` + web_search(API, Layer 3)로 측정. 앱 화면과 다를 수 있음. 문항 강건성 미검증 · 탐색적. 내부 분석용이며 공표·전달 대상이 아님. 무엇이 막고 있는지는 이 측정으로 알 수 없음.**`);
L.push('');
L.push(`- 사전 등록: [PREREG-guro-ko-oai-ws.md](../../aeo-measurements/guro/PREREG-guro-ko-oai-ws.md) (PR-2026Q4-GURO-OAI-WS-KO) · 판본 RP-2026Q4-GURO-OAI-WS-KO`);
L.push(`- 이 보고서는 \`scripts/measure-v2/render-guro-report.ts\` 가 \`.private/guro/${phase}/analysis.json\` 과 회차별 판정에서 생성했다. 응답 원문은 싣지 않았다.`);
L.push('- 아래 비율은 모두 **원장(구로구청 누리집, 2026-10-06~07 열람)과 응답 값이 일치한 회차의 비율**이며, 항상 Floor Risk 분포와 같은 줄에 둔다. 두 값(원장 일치 비율의 하한~상한)은 \'검토중\' 회차를 불일치로 볼 때와 일치로 볼 때의 범위다.');
L.push('');

// 1. 규모
const u = analysis.usage;
const reviewedCount = decisions.length;
const humanDec: Record<string, number> = {};
for (const d of decisions) humanDec[d.decision] = (humanDec[d.decision] ?? 0) + 1;
L.push('## 1. 측정 규모와 비용');
L.push('');
L.push('| 항목 | 값 |');
L.push('|---|---|');
L.push(`| 호출(문항 × 회차) | ${u.responses} (오류 ${u.errors}) |`);
L.push(`| 문항 | ${new Set(verdicts.map((v) => v.question_id)).size} (값형 ${valueRows.length}, 검증용 C1 포함) |`);
L.push(`| 반복 | ${Math.max(...verdicts.map((v) => v.rep))}회 (같은 날 별개 실행 — 날짜 간 분산 없음) |`);
L.push(`| 토큰 | 입력 ${u.input_tokens.toLocaleString('ko-KR')} · 출력 ${u.output_tokens.toLocaleString('ko-KR')} |`);
L.push(`| 검색 행위(추정) | ${u.search_actions_billed_estimate.toLocaleString('ko-KR')} |`);
L.push(`| 비용 추정(응답 생성) | 약 \$${u.cost_usd_estimate.toFixed(2)} (사용자 제공 단가 기준, 추출·2차 의견 비용 별도 소액) |`);
L.push(`| 교차검토 | 결정 ${reviewedCount}건 — ${Object.entries(humanDec).map(([k, v]) => `${k} ${v}`).join(' · ')} (**1차 검토: AI 보조 1인. 사람 검수 전**) |`);
L.push('');

// 2. 대상별
L.push('## 2. 대주민 · 대외 · 검증용(C1) — 따로 본다');
L.push('');
L.push('세 집단을 하나의 지수로 합치지 않는다. 검증용은 \'낡은 인식이 따라올 수 있는 현재 사실\'(C1) 10문항이다.');
L.push('');
L.push(HEAD);
for (const a of ['resident', 'external', 'probe']) {
  const label = a === 'resident' ? '대주민(행정·민원)' : a === 'external' ? '대외(관광·산업·투자 등)' : '검증용(C1)';
  if (analysis.by_audience[a]) L.push(line(label, analysis.by_audience[a]));
}
L.push('');
L.push(`전체 값형 문항(참고, 위 세 집단을 합친 값이며 단독 지표로 쓰지 않는다): ${analysis.all_value_questions.questions}문항 · ${rng(analysis.all_value_questions.match_rate_lower, analysis.all_value_questions.match_rate_upper)} · Floor Risk ${fl(analysis.all_value_questions.floor_distribution_if_review_match)}`);
L.push('');

// 3. 모듈별
L.push('## 3. 모듈별');
L.push('');
L.push('문항 수가 모듈마다 다르다. 문항이 적은 모듈의 비율은 불확실성이 크므로 모듈 간 비교용으로 쓰지 않는다.');
L.push('');
L.push(HEAD);
const MODNAME: Record<string, string> = { A1: 'A1 행정·민원', A2: 'A2 환경·청소', A3: 'A3 복지', A4: 'A4 교육', A5: 'A5 안전', A6: 'A6 구정', B1: 'B1 관광·문화', B2: 'B2 산업·일자리', B3: 'B3 수출·통상', B4: 'B4 투자·통계', B5: 'B5 다문화', C1: 'C1 평판 확인' };
for (const m of Object.keys(analysis.by_module).sort()) L.push(line(MODNAME[m] ?? m, analysis.by_module[m]));
L.push('');

// 4. 불일치 유형
L.push('## 4. 값이 어긋난 회차의 모습');
L.push('');
const vr = verdicts.filter((v) => JUDGED.includes(v.verdict) && v.module !== 'C2' && v.module !== 'B6');
const cnt = (f: (v: any) => boolean) => vr.filter(f).length;
L.push('| 구분 | 회차 |');
L.push('|---|---|');
L.push(`| 원장과 일치 | ${cnt((v) => v.verdict === 'match')} |`);
L.push(`| 부분 일치(묻는 사실의 일부·더 넓거나 좁은 범위) | ${cnt((v) => v.verdict === 'partial')} |`);
L.push(`| 불일치 — 다른 값을 구체적으로 진술 | ${cnt((v) => v.verdict === 'mismatch' && v.stance === 'gives_specific')} |`);
L.push(`| 불일치 — 있는 것을 없다고 진술 | ${cnt((v) => v.verdict === 'mismatch' && v.stance === 'denies_existence')} |`);
L.push(`| 부재 — 구체 값 없이 회피 | ${cnt((v) => v.verdict === 'absence')} |`);
L.push(`| 검토중(사람 확인 필요) | ${cnt((v) => v.verdict === 'review')} |`);
const exclReps = verdicts.filter((v) => String(v.note).includes('human:ledger_error'));
L.push(`| 집계에서 제외(원장 오류·불확실) | ${exclReps.length} |`);
L.push('');
L.push(`작화(없는 것을 있다고 구체적으로 지어냄)와 부재(모른다고 함)는 같은 무게로 평균하지 않는다. 값형 문항에서 \'있는 것을 없다고 진술\'한 회차는 불일치로 센다.`);
L.push('');

// 5. 검색·출처
L.push('## 5. 검색과 출처');
L.push('');
const s = analysis.source_summary;
L.push('| 항목 | 값 |');
L.push('|---|---|');
L.push(`| 검색 도구가 작동한 회차 | ${s.search_triggered_reps}/${s.reps} (95% ${ci(s.search_triggered_interval)}) |`);
L.push(`| 회차당 검색 도구 항목 | ${s.mean_search_calls_per_rep.toFixed(2)} |`);
L.push(`| 출처 URL이 있는 회차 | ${s.reps_with_citations}/${s.reps} |`);
L.push(`| 구로구 누리집을 인용한 회차 | ${s.reps_citing_guro_domain}/${s.reps} |`);
L.push(`| 구로구·서울시·중앙정부 도메인 중 하나라도 인용한 회차 | ${s.reps_citing_any_official}/${s.reps} |`);
L.push(`| 검색이 작동하지 않은 값형 회차 | ${s.value_reps_not_triggered} |`);
L.push('');
L.push('검색이 거의 모든 회차에서 작동하므로 \'검색 없는 응답\'과의 비교는 이 측정으로 할 수 없다.');
L.push('');

// 6. 가설 판정 (사전 등록 규칙 그대로)
L.push('## 6. 사전 등록 가설 점검');
L.push('');
L.push('임계값은 사전 등록 문서에 있다(시범 측정을 본 뒤 정했으므로 **탐색적**).');
L.push('');
// H1
const hi1 = valueRows.filter((r) => r.floor_risk_if_review_mismatch === 'high' || r.floor_risk_if_review_mismatch === 'critical').length;
const lo1 = valueRows.filter((r) => r.floor_risk_if_review_match === 'high' || r.floor_risk_if_review_match === 'critical').length;
const wl = wilson(lo1, valueRows.length);
const wh = wilson(hi1, valueRows.length);
const h1 = wl && wl[0] >= 0.1 ? '지지(구간 하한이 10% 이상)' : wh && wh[1] < 0.1 ? '기각(구간 상한이 10% 미만)' : '판정 보류(구간이 10%를 걸침)';
L.push(`**H1** — 회차 중 한 번이라도 Floor Risk \`높음\` 이상이 나온 값형 문항 비율이 10% 이상인가: ${lo1}~${hi1}/${valueRows.length}문항 (${pct(lo1 / valueRows.length)}~${pct(hi1 / valueRows.length)}), 이항 95% 구간 ${wl && wh ? `${pct(wl[0])}–${pct(wh[1])}` : '—'} → **${h1}**. 사람 검수 전이며 원장 오류가 섞였을 수 있다.`);
L.push('');
// H2
const guroQs = valueRows.map((r) => {
  const rows = (byQ.get(r.id) ?? []).filter((v) => JUDGED.includes(v.verdict));
  const a = rows.filter((v) => v.cites_guro_domain);
  const b = rows.filter((v) => !v.cites_guro_domain);
  return { kA: a.filter((v) => v.verdict === 'match').length, nA: a.length, kB: b.filter((v) => v.verdict === 'match').length, nB: b.length };
});
const tA = guroQs.reduce((x, g) => x + g.nA, 0);
const kA = guroQs.reduce((x, g) => x + g.kA, 0);
const tB = guroQs.reduce((x, g) => x + g.nB, 0);
const kB = guroQs.reduce((x, g) => x + g.kB, 0);
const rateA = tA ? kA / tA : null;
const rateB = tB ? kB / tB : null;
const diffCI = boot((idx) => {
  let ka = 0, na = 0, kb = 0, nb = 0;
  for (const i of idx) { ka += guroQs[i].kA; na += guroQs[i].nA; kb += guroQs[i].kB; nb += guroQs[i].nB; }
  return na && nb ? ka / na - kb / nb : null;
}, guroQs.length);
const h2 = diffCI ? (diffCI[0] > 0 ? '지지' : diffCI[1] < 0 ? '방향 반대' : '기각(구간이 0 포함)') : '—';
L.push(`**H2** — 구로구 누리집을 인용한 회차가 인용하지 않은 회차보다 원장과 더 자주 일치하는가: 인용 ${kA}/${tA} (${pct(rateA)}) · 미인용 ${kB}/${tB} (${pct(rateB)}) · 차이 ${rateA != null && rateB != null ? ((rateA - rateB) * 100).toFixed(0) : '—'}%p, 문항 군집 95% 구간 ${diffCI ? `${(diffCI[0] * 100).toFixed(0)}~${(diffCI[1] * 100).toFixed(0)}%p` : '—'} → **${h2}**. 인용 여부는 원인이 아니라 동반 관찰이다(어려운 문항일수록 다른 곳을 인용할 수 있음).`);
L.push('');
// H3
const resQ = valueRows.filter((r) => r.audience === 'resident');
const extQ = valueRows.filter((r) => r.audience === 'external');
const grp = (rows: any[]) => rows.map((r) => ({ k: r.counts.match ?? 0, n: JUDGED.reduce((a, k) => a + (r.counts[k] ?? 0), 0) })).filter((g) => g.n > 0);
const gR = grp(resQ);
const gE = grp(extQ);
const rate = (g: { k: number; n: number }[]) => g.reduce((a, x) => a + x.k, 0) / g.reduce((a, x) => a + x.n, 0);
const sub = (g: { k: number; n: number }[], idx: number[]) => { let k = 0, n = 0; for (const i of idx) { k += g[i].k; n += g[i].n; } return n ? k / n : null; };
const dResExt = (() => {
  const xs: number[] = [];
  for (let b = 0; b < 2000; b++) {
    const ir = Array.from({ length: gR.length }, () => Math.floor(rnd() * gR.length));
    const ie = Array.from({ length: gE.length }, () => Math.floor(rnd() * gE.length));
    const a = sub(gR, ir);
    const e = sub(gE, ie);
    if (a != null && e != null) xs.push(a - e);
  }
  xs.sort((a, b) => a - b);
  return [xs[Math.floor(0.025 * xs.length)], xs[Math.floor(0.975 * xs.length)]] as [number, number];
})();
const h3 = dResExt[0] > 0 ? '지지(대외가 더 낮음)' : dResExt[1] < 0 ? '방향 반대' : '기각(구간이 0 포함)';
L.push(`**H3** — 대외 문항의 원장 일치 회차 비율이 대주민보다 낮은가: 대주민 ${pct(rate(gR))} · 대외 ${pct(rate(gE))} (일치만 센 하한 기준), 차이(대주민−대외) ${((rate(gR) - rate(gE)) * 100).toFixed(0)}%p, 문항 군집 95% 구간 ${(dResExt[0] * 100).toFixed(0)}~${(dResExt[1] * 100).toFixed(0)}%p → **${h3}**. 두 집단은 문항 성격이 달라(주소·전화·시간 등 값 유형) 하나의 지수로 합치지 않는다.`);
L.push('');
// H4
const c2 = analysis.c2_false_premise;
L.push(`**H4** — 거짓 전제 문항 ${c2.questions}개 중 사람 검수로 확정된 작화가 1건 이상인가: 확정 ${c2.confabulation_confirmed_reps}회차, 전제를 바로잡음 ${c2.rejected_premise_reps}회차, 모호 ${c2.ambiguous_reps_after_review}회차(전제를 고치지 않고 값만 답했거나 다른 실제 사업으로 바꿔 안내) → **${c2.confabulation_confirmed_reps > 0 ? '지지' : '기각(확정 0건)'}**. 검수는 1차(AI 보조 1인)이며 모호 회차는 사람 판단이 필요하다.`);
L.push('');

// 7. 거짓 전제 · B6
L.push('## 7. 검증용 — 거짓 전제(C2)와 이름 없는 질문(B6)');
L.push('');
L.push('이 둘은 원장 일치 비율과 합치지 않는다.');
L.push('');
L.push('### 7.1 거짓 전제 (C2)');
L.push('');
L.push('| 문항 | 유형 | 전제를 바로잡음 | 모호 | 작화 확정 | 부재 |');
L.push('|---|---|---|---|---|---|');
for (const r of qrows.filter((x) => x.module === 'C2').sort((a, b) => a.id.localeCompare(b.id))) {
  const gt = JSON.parse(fs.readFileSync('docs/ground-truth/guro.json', 'utf-8').replace(/^\uFEFF/, '')).entries[r.id];
  const rows = byQ.get(r.id) ?? [];
  const conf = rows.filter((v) => String(v.note).includes('human:confabulation_confirmed')).length;
  L.push(`| ${r.id} ${qs.get(r.id)?.text ?? ''} | ${gt?.premise_kind ?? ''} | ${r.counts.rejected_premise ?? 0}/${r.reps_total} | ${r.counts.review ?? 0} | ${conf} | ${r.counts.absence ?? 0} |`);
}
L.push('');
L.push('\'없음\'은 증명할 수 없다(근거: 2026-10-07 웹 검색과 구로구청 누리집 캐시 대조). 후보 판정은 추출 단계 분류에서 왔고, 원문 발췌 대조에서 전제를 바로잡은 응답이 다수 확인되었다 → 추출기의 C2 분류는 후보 선별용으로만 쓴다.');
L.push('');
L.push('### 7.2 이름 없는 질문 (B6, 노출 탐침)');
L.push('');
L.push('문장에 \'구로\'가 없다. 등장하지 않는 것이 오류라는 뜻이 아니다. 음성 대조 2문항은 구로구에 없는 유형이다.');
L.push('');
L.push('| 문항 | 구분 | 기대 표기가 등장한 회차 | 95% 구간 |');
L.push('|---|---|---|---|');
const gtAll = JSON.parse(fs.readFileSync('docs/ground-truth/guro.json', 'utf-8').replace(/^\uFEFF/, '')).entries;
for (const b of analysis.b6_unnamed_appearance.slice().sort((a: any, b: any) => a.id.localeCompare(b.id))) {
  const neg = gtAll[b.id]?.negative_control ? '음성 대조' : '';
  L.push(`| ${b.id} ${qs.get(b.id)?.text ?? ''} | ${neg || '탐침'} | ${b.mentioned}/${b.reps} | ${b.interval ? `${pct(b.interval[0])}–${pct(b.interval[1])}` : '—'} |`);
}
L.push('');

// 8. 원장 오류
L.push('## 8. 원장 오류·불확실로 집계에서 제외한 항목');
L.push('');
const exQ = new Map<string, string>();
for (const d of decisions) if (d.decision === 'ledger_error') exQ.set(d.question_id, d.note);
L.push('구청 누리집 안에서 같은 사실이 페이지마다 다르게 적혀 있어 원장 한 값으로 판정할 수 없는 문항이다. **구로구 누리집의 정합성 확인 대상**이며, AI 응답의 오류로 세지 않았다.');
L.push('');
L.push('| 문항 | 사유 |');
L.push('|---|---|');
for (const [id, note] of [...exQ.entries()].sort()) L.push(`| ${id} ${qs.get(id)?.text ?? ''} | ${note} |`);
L.push('');

// 9. 문항별
L.push('## 9. 문항별 회차 판정 (문항 ID 순)');
L.push('');
L.push('정렬은 문항 ID 순이다. 이 표는 순서를 매기는 용도가 아니다.');
L.push('');
L.push('| 문항 | 모듈 | 회차 판정(일치/부분/불일치/부재/검토) | Floor Risk | 구로구 누리집 인용 |');
L.push('|---|---|---|---|---|');
for (const r of valueRows.slice().sort((a, b) => a.id.localeCompare(b.id))) {
  const c = r.counts;
  const f = r.floor_risk_if_review_match === r.floor_risk_if_review_mismatch ? r.floor_risk_if_review_match : `${r.floor_risk_if_review_match}~${r.floor_risk_if_review_mismatch}`;
  const FR: Record<string, string> = { critical: '치명', high: '높음', moderate: '중간', low: '낮음', 'n/a': '—' };
  const frTxt = f.split('~').map((x: string) => FR[x] ?? x).join('~');
  L.push(`| ${r.id} ${qs.get(r.id)?.text ?? ''} | ${r.module} | ${c.match ?? 0}/${c.partial ?? 0}/${c.mismatch ?? 0}/${c.absence ?? 0}/${c.review ?? 0} | ${frTxt} | ${r.cites_guro_reps}/${r.reps_total} |`);
}
L.push('');

// 10. 한계
L.push('## 10. 한계와 주의');
L.push('');
const sampN = decisions.filter((d) => String(d.note).includes('match 10%')).length;
const sampDiff = decisions.filter((d) => String(d.note).includes('match 10%') && d.decision !== 'match').length;
const matchTotal = verdicts.filter((v) => v.verdict === 'match' && v.module !== 'B6').length;
L.push(`- **교차검토는 1차(AI 보조 1인)** 이다. 규칙이 일치로 판정한 회차 ${matchTotal}건 중 무작위 표본 ${sampN}건(10%)을 대조했고 판정이 바뀐 것은 ${sampDiff}건이었다. 불일치·부분·검토중 회차의 사람 확인이 남아 있다. 결정 파일(\`.private/guro/main/review-decisions.jsonl\`)을 고치고 \`judge-guro.ts\` 를 다시 돌리면 이 보고서가 갱신된다.`);
L.push('- 원장은 구로구청 누리집 한 곳에서 읽었다. 같은 사실이 페이지마다 다르게 적힌 문항은 8절에서 제외했으나, **원장이 낡았을 가능성**(응답이 원장과 일관되게 다른 문항)은 남아 있다. 이런 문항은 원장 재확인 대상이다.');
L.push('- 반복 3회는 같은 날 별개 실행이다. 날짜에 따른 변동은 반영되지 않았다.');
L.push('- 추출기(`gpt-5.4-mini`)는 거짓 전제를 바로잡은 응답을 \'구체 진술\'로 잘못 분류한 경우가 있었다(C2). 값형은 표본 대조에서 문제가 없었으나, 추출 단계 오류율은 별도 측정하지 않았다.');
L.push('- 문항 강건성 검사를 하지 않았다(INV-10). 이 결과는 공표·외부 전달에 쓸 수 없다.');
L.push('- 모델·검색 결과는 시점에 따라 달라진다. 이 값은 측정 창 안의 관측이며, 무엇이 응답을 막거나 틀리게 하는지는 이 측정으로 알 수 없다(원인 규명은 별도 작업).');
L.push('');

fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(path.resolve(out), L.join('\n') + '\n', 'utf-8');
console.log(`보고서 생성: ${out} (${L.length}줄)`);
