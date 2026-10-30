// scripts/measure-v2/make-guro-review-sheet.ts
// 사람 교차검토용 시트 생성 (사전 등록 §3).
//  - 검토(review) 회차 전수 · 불일치 회차 전수 · C2 작화 후보 전수 · 일치 회차 10% 무작위(결정적 시드) 표본
//  - 시트는 .private/ 에만 둔다. 응답 원문 전문은 싣지 않고 '추출된 값(≤150자)'과 원장 값만 싣는다 (INV-6)
//  - 판정 결과는 .private/guro/<phase>/review-decisions.jsonl 에 한 줄씩 적는다:
//      {"response_id": "...", "decision": "match|mismatch|ledger_error|ambiguous", "note": "..."}
//
// 사용: pnpm tsx scripts/measure-v2/make-guro-review-sheet.ts --phase=main
import fs from 'fs';
import path from 'path';

const phase = (process.argv.find((a) => a.startsWith('--phase=')) ?? '--phase=main').slice(8);
const dir = path.resolve('.private', 'guro', phase);
const rd = (p: string) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf-8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const verdicts = rd(path.join(dir, 'verdicts.jsonl'));
const ex = new Map(rd(path.join(dir, 'extractions.jsonl')).map((e: any) => [e.response_id, e]));
const adj = new Map(rd(path.join(dir, 'adjudications.jsonl')).map((a: any) => [a.response_id, a.relation]));
const gt = JSON.parse(fs.readFileSync('docs/ground-truth/guro.json', 'utf-8').replace(/^\uFEFF/, '')).entries as Record<string, any>;
const qs = new Map<string, any>(JSON.parse(fs.readFileSync('docs/aeo-questions/guro/all.json', 'utf-8').replace(/^\uFEFF/, '')).questions.map((q: any) => [q.id, q]));

let seed = 20261007;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const rows: any[] = [];
const matches = verdicts.filter((v) => v.verdict === 'match' && v.module !== 'B6');
const matchSample = new Set<string>();
const need = Math.ceil(matches.length * 0.1);
const pool = [...matches];
while (matchSample.size < need && pool.length) {
  const i = Math.floor(rnd() * pool.length);
  matchSample.add(pool.splice(i, 1)[0].response_id);
}
for (const v of verdicts) {
  let why = '';
  if (v.verdict === 'review') why = v.note === 'llm_second_opinion_equivalent' ? 'review(2차의견 동의)' : 'review(원문에만 토큰)';
  else if (v.verdict === 'mismatch') why = 'mismatch';
  else if (v.verdict === 'confabulation_candidate') why = 'C2 작화 후보';
  else if (v.verdict === 'match' && matchSample.has(v.response_id)) why = 'match 10% 표본';
  if (!why) continue;
  const q = qs.get(v.question_id);
  const g = gt[v.question_id];
  const e: any = ex.get(v.response_id);
  rows.push({
    key: `${v.question_id}#${v.rep}`,
    response_id: v.response_id,
    why,
    adj: adj.get(v.response_id) ?? '',
    q: q?.text,
    gt: v.module === 'C2' ? `(거짓 전제: ${g?.premise_kind})` : g?.targetValue,
    ai: e?.stated_value ?? '',
    stance: e?.stance ?? '',
  });
}
rows.sort((a, b) => a.key.localeCompare(b.key));
fs.writeFileSync(path.join(dir, 'review-sheet.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf-8');
const md = rows
  .map((r) => `${r.key}|${r.why}${r.adj ? '/' + r.adj : ''}|Q:${r.q}|GT:${r.gt}|AI:${r.ai}|${r.stance}`)
  .join('\n');
fs.writeFileSync(path.join(dir, 'review-sheet.txt'), md + '\n', 'utf-8');
const by: Record<string, number> = {};
for (const r of rows) by[r.why] = (by[r.why] ?? 0) + 1;
console.log(`시트 ${rows.length}행`, by, `match 표본 ${matchSample.size}/${matches.length}`);
