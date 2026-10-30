// scripts/measure-v2/judge-guro.ts
// 구로구 판정·집계 단계 — 규칙 기반 (judged_by: 'rule'), 판정 자체에 언어 모형 개입 없음 (spec/04, ADR-0006)
// 단, adjudicate-guro.ts 의 2차 의견이 있으면 '불일치'를 '검토(review)'로만 옮긴다(일치로 올리지 않음)
//
// 입력: .private/guro/<phase>/{responses,extractions}.jsonl, docs/aeo-questions/guro/all.json, docs/ground-truth/guro.json
// 출력: .private/guro/<phase>/{verdicts.jsonl, analysis.json}
//
// 규율
//  - 회차별 판정을 먼저 만들고, 집계는 그 위에서 한다 (INV-9). 문항당 1행으로 뭉치지 않는다
//  - 정확도 비율은 항상 Floor Risk 와 함께 낸다. 평균만 내보내지 않는다
//  - 점수·등급·순위를 만들지 않는다. 문항 목록의 정렬은 ID 순이다 (INV-3)
//  - '확정할 수 없는 것'은 확정하지 않는다: 원문엔 값이 있으나 추출 요약엔 없는 경우는 review 로 분리하고,
//    Floor Risk 는 review 를 (일치 쪽 / 불일치 쪽) 두 극단으로 계산해 구간으로 낸다
//  - 작화(confabulation)는 추출 단계의 stance 에서 온 '후보'다. 사람 검수 전에는 후보로만 표기한다
//
// 사용: pnpm tsx scripts/measure-v2/judge-guro.ts --phase=pilot

import fs from 'fs';
import path from 'path';

function arg(name: string, def?: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
}
const readJsonl = (p: string) =>
  fs.existsSync(p)
    ? fs
        .readFileSync(p, 'utf-8')
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l))
    : [];

/** 비교용 정규화: 공백·구두점·괄호 제거, 소문자 */
export const norm = (s: string) => (s ?? '').toLowerCase().replace(/[^0-9a-z가-힣]/g, '');

export type RepVerdict =
  | 'match'
  | 'partial' // 부분 일치: 묻는 사실의 일부만 맞거나 더 넓은/좁은 범위 (Floor Risk low)
  | 'mismatch'
  | 'absence' // 부재: 구체 값 없이 회피·거절
  | 'review' // 원문에는 원장 값이 있으나 추출 요약엔 없음 → 사람 확인
  | 'confabulation_candidate' // C2: 없는 것을 있다고 진술한 것으로 추출됨 (후보)
  | 'rejected_premise' // C2: 전제를 올바르게 부정
  | 'mentioned' // B6: 기대 표기 등장
  | 'not_mentioned' // B6: 기대 표기 미등장
  | 'no_verdict' // 서술형·원장 미확정 등
  | 'error'; // 호출 실패 — 판정 대상 아님

const JUDGED = ['match', 'partial', 'mismatch', 'absence', 'review'];

const SEVERITY: Record<string, number> = {
  confabulation_candidate: 4,
  mismatch: 3,
  absence: 2,
  partial: 0.5,
  review: 1,
  match: 0,
  rejected_premise: 0,
};
export type FloorRisk = 'critical' | 'high' | 'moderate' | 'low' | 'n/a';

function floorOf(vs: RepVerdict[], reviewAs: 'match' | 'mismatch'): FloorRisk {
  const eff = vs.map((v) => (v === 'review' ? reviewAs : v));
  const scored = eff.filter((v) => v in SEVERITY);
  if (scored.length === 0) return 'n/a';
  const worst = Math.max(...scored.map((v) => SEVERITY[v]));
  return worst >= 4 ? 'critical' : worst === 3 ? 'high' : worst === 2 ? 'moderate' : 'low';
}

function wilson(k: number, n: number, z = 1.96): [number, number] | null {
  if (n === 0) return null;
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
}

/** 문항 단위 군집 부트스트랩(결정적 시드). 같은 문항의 회차는 독립이 아니므로 문항을 재표집한다 */
function clusterBootstrap(groups: Array<{ k: number; n: number }>, iters = 2000): [number, number] | null {
  if (groups.length === 0) return null;
  let seed = 20261006;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const stats: number[] = [];
  for (let b = 0; b < iters; b++) {
    let k = 0;
    let n = 0;
    for (let i = 0; i < groups.length; i++) {
      const g = groups[Math.floor(rnd() * groups.length)];
      k += g.k;
      n += g.n;
    }
    if (n > 0) stats.push(k / n);
  }
  stats.sort((a, b) => a - b);
  return [stats[Math.floor(0.025 * stats.length)], stats[Math.floor(0.975 * stats.length)]];
}

function hostOf(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
function sourceClass(host: string): 'guro' | 'seoul' | 'central_public' | 'public_other' | 'other' {
  if (!host) return 'other';
  if (host === 'guro.go.kr' || host.endsWith('.guro.go.kr')) return 'guro';
  if (host === 'seoul.go.kr' || host.endsWith('.seoul.go.kr')) return 'seoul';
  if (host.endsWith('.go.kr') || host === 'go.kr') return 'central_public';
  if (host.endsWith('.or.kr') || host.endsWith('.re.kr') || host.endsWith('.ac.kr')) return 'public_other';
  return 'other';
}

async function main() {
  const phase = arg('phase', 'pilot')!;
  const dir = path.resolve('.private', 'guro', phase);
  const responses = readJsonl(path.join(dir, 'responses.jsonl'));
  const extractions = new Map<string, any>();
  for (const e of readJsonl(path.join(dir, 'extractions.jsonl'))) extractions.set(e.response_id, e);
  const adjudications = new Map<string, string>();
  for (const a of readJsonl(path.join(dir, 'adjudications.jsonl'))) adjudications.set(a.response_id, a.relation);
  const decisions = new Map<string, { decision: string; note?: string }>();
  for (const d of readJsonl(path.join(dir, 'review-decisions.jsonl'))) decisions.set(d.response_id, d);

  const qs = new Map<string, any>();
  for (const q of JSON.parse(fs.readFileSync('docs/aeo-questions/guro/all.json', 'utf-8').replace(/^\uFEFF/, '')).questions) qs.set(q.id, q);
  const gt = JSON.parse(fs.readFileSync('docs/ground-truth/guro.json', 'utf-8').replace(/^\uFEFF/, '')).entries as Record<string, any>;

  const verdictRows: any[] = [];

  for (const r of responses) {
    const q = qs.get(r.question_id);
    const g = gt[r.question_id];
    const ex = extractions.get(r.response_id);
    const base = {
      response_id: r.response_id,
      question_id: r.question_id,
      rep: r.attempt,
      module: q?.module,
      judged_by: 'rule',
    };
    const hosts: string[] = (r.citation_urls ?? []).map(hostOf).filter(Boolean);
    const gtHost = g?.sourceUrl ? hostOf(g.sourceUrl) : '';
    const srcInfo = {
      search_triggered: r.search_triggered ?? null,
      search_calls: r.usage?.search_call_count ?? 0,
      citation_count: (r.citation_urls ?? []).length,
      citation_classes: Array.from(new Set(hosts.map(sourceClass))),
      cites_guro_domain: hosts.some((h) => sourceClass(h) === 'guro'),
      cites_official_any: hosts.some((h) => ['guro', 'seoul', 'central_public'].includes(sourceClass(h))),
      cites_ledger_host: gtHost ? hosts.includes(gtHost) : null,
      body_url_count: (r.body_urls ?? []).length,
    };

    if (r.outcome === 'error') {
      verdictRows.push({ ...base, verdict: 'error', ...srcInfo, note: 'api_error' });
      continue;
    }
    if (!q) {
      verdictRows.push({ ...base, verdict: 'no_verdict', note: 'question_not_found', ...srcInfo });
      continue;
    }
    if (!ex || ex.stance === 'extract_failed' || ex.stance === 'invalid') {
      verdictRows.push({ ...base, verdict: 'no_verdict', note: 'extraction_missing', ...srcInfo });
      continue;
    }
    const stated = ex.stated_value ?? '';
    const rawN = norm(r.raw_text ?? '');
    let verdict: RepVerdict = 'no_verdict';
    let note = '';

    if (q.module === 'B6') {
      const exp: string[] = g?.expectedMentions ?? [];
      const hit = exp.some((t) => rawN.includes(norm(t)));
      verdict = hit ? 'mentioned' : 'not_mentioned';
    } else if (q.module === 'C2') {
      if (ex.stance === 'denies_existence') verdict = 'rejected_premise';
      else if (ex.stance === 'hedges_no_info' || ex.stance === 'refuses') verdict = 'absence';
      else verdict = 'confabulation_candidate'; // affirms_existence | gives_specific
    } else if (q.type === 'descriptive' || !g || g.verification !== 'confirmed' || q.usable === false) {
      verdict = 'no_verdict';
      note = q.type === 'descriptive' ? 'descriptive' : 'ledger_not_confirmed';
    } else if (ex.stance === 'hedges_no_info' || ex.stance === 'refuses') {
      verdict = 'absence';
    } else if (ex.stance === 'denies_existence') {
      verdict = 'mismatch';
      note = 'denies_existing_item';
    } else {
      const tokens: string[] = [g.targetValue, ...(g.acceptableVariants ?? [])].filter(Boolean);
      const sN = norm(stated);
      const inStated = tokens.some((t) => norm(t) && sN.includes(norm(t)));
      const inRaw = tokens.some((t) => norm(t) && rawN.includes(norm(t)));
      if (inStated) verdict = 'match';
      else if (inRaw) {
        verdict = 'review';
        note = 'token_in_raw_not_in_stated';
      } else {
        verdict = 'mismatch';
        // 2차 의견이 '동의'면 확정하지 않고 검토로 옮긴다 (일치로 올리지 않는다)
        const rel = adjudications.get(r.response_id);
        if (rel === 'equivalent') {
          verdict = 'review';
          note = 'llm_second_opinion_equivalent';
        } else if (rel === 'partial') {
          verdict = 'partial';
          note = 'llm_second_opinion_partial';
        }
      }
    }
    // 사람 검수 결정이 있으면 규칙·2차 의견 판정을 덮어쓴다 (judged_by 로 구분)
    let judgedBy = 'rule';
    const dec = decisions.get(r.response_id);
    if (dec) {
      judgedBy = 'human_review';
      note = `${note ? note + ' → ' : ''}human:${dec.decision}`;
      if (dec.decision === 'match' || dec.decision === 'partial' || dec.decision === 'mismatch' || dec.decision === 'absence') verdict = dec.decision as RepVerdict;
      else if (dec.decision === 'ambiguous') verdict = 'review';
      else if (dec.decision === 'ledger_error') verdict = 'no_verdict';
      else if (dec.decision === 'rejected_premise') verdict = 'rejected_premise';
      else if (dec.decision === 'confabulation_confirmed') verdict = 'confabulation_candidate';
    }
    verdictRows.push({
      ...base,
      judged_by: judgedBy,
      verdict,
      note,
      stance: ex.stance,
      hedge_present: ex.hedge_present,
      stated_value: ex.stated_value,
      ...srcInfo,
    });
  }

  fs.writeFileSync(path.join(dir, 'verdicts.jsonl'), verdictRows.map((v) => JSON.stringify(v)).join('\n') + '\n', 'utf-8');

  // ── 집계 (조회 시점 집계, 저장된 회차 판정 위에서) ──
  const byQ = new Map<string, any[]>();
  for (const v of verdictRows) (byQ.get(v.question_id) ?? byQ.set(v.question_id, []).get(v.question_id)!).push(v);

  const questionRows = [...byQ.keys()]
    .sort()
    .map((id) => {
      const q = qs.get(id);
      const rows = byQ.get(id)!;
      const judged = rows.filter((r) => r.verdict !== 'error');
      const vs = judged.map((r) => r.verdict as RepVerdict);
      const counts: Record<string, number> = {};
      for (const v of vs) counts[v] = (counts[v] ?? 0) + 1;
      const set = new Set(vs.filter((v) => v !== 'no_verdict'));
      return {
        id,
        module: q?.module,
        audience: q?.audience,
        type: q?.type,
        reps_total: rows.length,
        reps_error: rows.length - judged.length,
        excluded_ledger_error: rows.filter((r) => String(r.note ?? '').includes('human:ledger_error')).length,
        counts,
        unstable: set.size > 1,
        floor_risk_if_review_match: floorOf(vs, 'match'),
        floor_risk_if_review_mismatch: floorOf(vs, 'mismatch'),
        search_triggered_reps: rows.filter((r) => r.search_triggered).length,
        search_calls_total: rows.reduce((a, r) => a + (r.search_calls ?? 0), 0),
        cites_guro_reps: rows.filter((r) => r.cites_guro_domain).length,
        cites_official_reps: rows.filter((r) => r.cites_official_any).length,
        cites_ledger_host_reps: rows.filter((r) => r.cites_ledger_host === true).length,
      };
    });

  const valueQs = questionRows.filter((r) => r.type === 'value' && r.module !== 'C2' && r.module !== 'B6');
  const summarize = (rows: typeof questionRows) => {
    const sum = (f: (r: any) => number) => rows.reduce((a, r) => a + f(r), 0);
    const judgedReps = sum((r) => JUDGED.reduce((a, k) => a + (r.counts[k] ?? 0), 0));
    const matchReps = sum((r) => r.counts.match ?? 0);
    const reviewReps = sum((r) => r.counts.review ?? 0);
    const floorDist = (key: 'floor_risk_if_review_match' | 'floor_risk_if_review_mismatch') => {
      const d: Record<string, number> = { critical: 0, high: 0, moderate: 0, low: 0, 'n/a': 0 };
      for (const r of rows) d[r[key]]++;
      return d;
    };
    const groups = rows.map((r) => ({
      k: (r.counts.match ?? 0) + (r.counts.review ?? 0),
      n: JUDGED.reduce((a, k) => a + (r.counts[k] ?? 0), 0),
    })).filter((g) => g.n > 0);
    const lowerGroups = rows.map((r) => ({
      k: r.counts.match ?? 0,
      n: JUDGED.reduce((a, k) => a + (r.counts[k] ?? 0), 0),
    })).filter((g) => g.n > 0);
    return {
      questions: rows.length,
      judged_reps: judgedReps,
      match_reps: matchReps,
      review_reps: reviewReps,
      match_rate_lower: judgedReps ? matchReps / judgedReps : null, // review 를 불일치로 볼 때
      match_rate_upper: judgedReps ? (matchReps + reviewReps) / judgedReps : null, // review 를 일치로 볼 때
      match_rate_ci_cluster_lower: clusterBootstrap(lowerGroups),
      match_rate_ci_cluster_upper: clusterBootstrap(groups),
      wilson_rep_level_lower_bound_case: wilson(matchReps, judgedReps),
      verdict_reps: {
        match: matchReps,
        partial: sum((r) => r.counts.partial ?? 0),
        mismatch: sum((r) => r.counts.mismatch ?? 0),
        absence: sum((r) => r.counts.absence ?? 0),
        review: reviewReps,
        excluded_ledger_error: sum((r) => r.excluded_ledger_error ?? 0),
      },
      floor_distribution_if_review_match: floorDist('floor_risk_if_review_match'),
      floor_distribution_if_review_mismatch: floorDist('floor_risk_if_review_mismatch'),
      unstable_questions: rows.filter((r) => r.unstable).length,
    };
  };

  const byModule: Record<string, any> = {};
  for (const m of [...new Set(valueQs.map((r) => r.module))].sort()) byModule[m!] = summarize(valueQs.filter((r) => r.module === m));
  const byAudience: Record<string, any> = {};
  for (const a of [...new Set(valueQs.map((r) => r.audience))].sort()) byAudience[a!] = summarize(valueQs.filter((r) => r.audience === a));

  // C2 / B6 는 별도 집계 (정확도와 합치지 않는다)
  const c2 = questionRows.filter((r) => r.module === 'C2');
  const c2Summary = {
    questions: c2.length,
    reps: c2.reduce((a, r) => a + r.reps_total - r.reps_error, 0),
    confabulation_candidate_reps: c2.reduce((a, r) => a + (r.counts.confabulation_candidate ?? 0), 0),
    rejected_premise_reps: c2.reduce((a, r) => a + (r.counts.rejected_premise ?? 0), 0),
    absence_reps: c2.reduce((a, r) => a + (r.counts.absence ?? 0), 0),
    ambiguous_reps_after_review: c2.reduce((a, r) => a + (r.counts.review ?? 0), 0),
    human_reviewed_reps: verdictRows.filter((v) => v.module === 'C2' && v.judged_by === 'human_review').length,
    confabulation_confirmed_reps: verdictRows.filter((v) => v.module === 'C2' && String(v.note).includes('human:confabulation_confirmed')).length,
    questions_with_confirmed_confabulation: [
      ...new Set(verdictRows.filter((v) => v.module === 'C2' && String(v.note).includes('human:confabulation_confirmed')).map((v) => v.question_id)),
    ].sort(),
    questions_with_any_confabulation_candidate: c2.filter((r) => (r.counts.confabulation_candidate ?? 0) > 0).map((r) => r.id),
    note: '후보 — 사람 검수 전에는 작화로 확정하지 않는다',
  };
  const b6 = questionRows.filter((r) => r.module === 'B6');
  const b6Summary = b6.map((r) => ({
    id: r.id,
    reps: r.reps_total - r.reps_error,
    mentioned: r.counts.mentioned ?? 0,
    interval: wilson(r.counts.mentioned ?? 0, r.reps_total - r.reps_error),
  }));

  // 검색·출처
  const allRows = verdictRows.filter((r) => r.verdict !== 'error');
  const trig = allRows.filter((r) => r.search_triggered === true).length;
  const sourceSummary = {
    reps: allRows.length,
    search_triggered_reps: trig,
    search_triggered_interval: wilson(trig, allRows.length),
    reps_with_citations: allRows.filter((r) => r.citation_count > 0).length,
    reps_citing_guro_domain: allRows.filter((r) => r.cites_guro_domain).length,
    reps_citing_any_official: allRows.filter((r) => r.cites_official_any).length,
    mean_search_calls_per_rep: allRows.length ? allRows.reduce((a, r) => a + (r.search_calls ?? 0), 0) / allRows.length : null,
    // 검색이 발동하지 않은 회차의 일치 여부는 따로 본다 (발동 여부로 정확도를 섞지 않는다)
    value_reps_not_triggered: verdictRows.filter((r) => JUDGED.includes(r.verdict) && r.search_triggered === false).length,
  };

  // 사용량·비용 (실측)
  const tokIn = responses.reduce((a, r) => a + (r.usage?.input_tokens ?? 0), 0);
  const tokOut = responses.reduce((a, r) => a + (r.usage?.output_tokens ?? 0), 0);
  const searchActions = responses.reduce(
    (a, r) => a + (r.search_calls ?? []).filter((s: any) => !String(s.query).startsWith('[')).length,
    0,
  );
  const usage = {
    responses: responses.length,
    errors: responses.filter((r) => r.outcome === 'error').length,
    input_tokens: tokIn,
    output_tokens: tokOut,
    search_actions_billed_estimate: searchActions,
    cost_usd_estimate: tokIn * 0.1e-6 + tokOut * 0.5e-6 + searchActions * 0.01,
    cost_basis: 'input $0.1/MTok · output $0.5/MTok · web_search $0.01/회(search 행위만) — 사용자 제공 단가',
  };

  const analysis = {
    phase,
    generated_at: new Date().toISOString(),
    judged_by: 'rule',
    note: '탐색적 · 강건성 미검증 (INV-10, INV-11). 내부용.',
    usage,
    all_value_questions: summarize(valueQs),
    by_module: byModule,
    by_audience: byAudience,
    c2_false_premise: c2Summary,
    b6_unnamed_appearance: b6Summary,
    source_summary: sourceSummary,
    questions: questionRows,
  };
  fs.writeFileSync(path.join(dir, 'analysis.json'), JSON.stringify(analysis, null, 2), 'utf-8');
  console.log(JSON.stringify({ usage, all: analysis.all_value_questions, c2: c2Summary, source: sourceSummary }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
