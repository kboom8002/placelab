/**
 * 구로구(AG-0017) 문항·원장 검증기.
 * 근거: docs/aeo-questions/guro/_AUTHORING_RULES.md, spec/02 (INV-3, INV-10, INV-12)
 *
 * 사용: pnpm tsx scripts/measure-v2/validate-guro-questions.ts [--merge]
 *  - 오류가 있으면 exit 1. --merge 는 오류가 없을 때만 통합 파일을 쓴다.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const QDIR = path.resolve('docs/aeo-questions/guro');
const GDIR = path.resolve('docs/ground-truth/guro');

const BANNED = ['순위', '랭킹', '등급', '1위', '최하위', '베스트', '워스트', '최고', '가장 좋은', '추천해'];
const PREAMBLE = /^\s*\[[^\]]*\]/;
const ID_RE = /^[A-Z]{3,4}-[A-Za-z0-9_-]+$/;
const JOURNEYS = new Set(['find', 'apply', 'cost', 'eligibility', 'where', 'when', 'docs', 'status', 'compare', 'verify']);

type Q = Record<string, any>;
const errors: string[] = [];
const warns: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warns.push(m);

const readJson = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));

const qFiles = fs.existsSync(QDIR)
  ? fs.readdirSync(QDIR).filter((f) => f.endsWith('.json') && !f.startsWith('_') && f !== 'all.json' && f !== 'a7-project-records.json')
  : [];

const allQ: Q[] = [];
const allGT: Record<string, any> = {};
const perModule: Record<string, { n: number; value: number; desc: number; toVerify: number; unusable: number; en: number }> = {};

for (const f of qFiles) {
  const qp = path.join(QDIR, f);
  const gp = path.join(GDIR, f);
  let qj: any;
  try {
    qj = readJson(qp);
  } catch (e) {
    err(`${f}: 문항 JSON 파싱 실패 ${(e as Error).message}`);
    continue;
  }
  let gj: any = null;
  if (!fs.existsSync(gp)) err(`${f}: 원장 파일 없음`);
  else {
    try {
      gj = readJson(gp);
    } catch (e) {
      err(`${f}: 원장 JSON 파싱 실패 ${(e as Error).message}`);
    }
  }
  const entries = gj?.entries ?? {};
  for (const [k, v] of Object.entries(entries)) {
    if (allGT[k]) err(`원장 중복 ID ${k}`);
    allGT[k] = v;
  }
  const mod = qj.module ?? f;
  const stat = (perModule[mod] ??= { n: 0, value: 0, desc: 0, toVerify: 0, unusable: 0, en: 0 });
  for (const q of qj.questions ?? []) {
    allQ.push(q);
    const id = q.id;
    stat.n++;
    if (!ID_RE.test(id ?? '')) err(`${id}: ID 형식`);
    if (typeof q.text !== 'string' || q.text.length < 8) err(`${id}: text 부적합`);
    if (PREAMBLE.test(q.text ?? '')) err(`${id}: 머리말 금지`);
    for (const b of BANNED) if ((q.text ?? '').includes(b)) err(`${id}: 금지어 '${b}' (text)`);
    if (!q.boundary || String(q.boundary).trim().length < 5) err(`${id}: boundary 비어 있음`);
    if (!JOURNEYS.has(q.journey)) err(`${id}: journey '${q.journey}'`);
    if (!['resident', 'external', 'probe'].includes(q.audience)) err(`${id}: audience`);
    if (q.named === false && /구로/.test(q.text ?? '')) err(`${id}: named=false 인데 '구로' 포함`);
    if (q.named === true && !/구로/.test(q.text ?? '')) err(`${id}: named=true 인데 '구로' 없음`);
    if (q.en_candidate && q.audience === 'resident') warn(`${id}: 대주민 문항에 en_candidate`);
    if (q.en_candidate) stat.en++;
    if (q.type === 'descriptive') {
      stat.desc++;
      if ((q.layers ?? []).includes('accuracy')) err(`${id}: 서술형에 accuracy 레이어`);
      if (q.ledger != null) warn(`${id}: 서술형 ledger 는 null 권장`);
    } else if (q.type === 'value') {
      stat.value++;
      if (!q.ledger) err(`${id}: 값형 ledger 필수`);
    } else err(`${id}: type`);

    const g = entries[id];
    if (!g) {
      err(`${id}: 원장 항목 없음`);
      continue;
    }
    const isOpp = q.module === 'B6';
    if (g.verification === 'to_verify') {
      stat.toVerify++;
      if (q.usable !== false) err(`${id}: to_verify 인데 usable!=false`);
      if (g.targetValue != null) err(`${id}: to_verify 인데 targetValue 존재`);
    } else if (q.usable !== false) {
      if (g.verification !== 'confirmed') err(`${id}: usable 인데 verification!=confirmed`);
      if (!isOpp && q.module !== 'C2') {
        if (g.targetValue == null || g.targetValue === '') err(`${id}: targetValue 비어 있음`);
        if (!Array.isArray(g.acceptableVariants) || g.acceptableVariants.length < 1) err(`${id}: acceptableVariants 없음`);
        if (!g.sourceUrl) err(`${id}: sourceUrl 없음`);
        if (!g.evidence_quote) warn(`${id}: evidence_quote 없음`);
        else if (String(g.evidence_quote).length > 80) warn(`${id}: evidence_quote 길다`);
      }
      if (q.module === 'C2') {
        if (g.expectedStance !== 'deny_or_unverified') err(`${id}: expectedStance`);
        if (!g.absenceBasis?.length) err(`${id}: absenceBasis 없음`);
      }
      if (isOpp && !(g.expectedMentions?.length)) err(`${id}: expectedMentions 없음`);
    }
    if (q.usable === false) stat.unusable++;
  }
}

// 전역 검사
const ids = new Map<string, number>();
for (const q of allQ) ids.set(q.id, (ids.get(q.id) ?? 0) + 1);
const live = allQ.filter((q) => q.status !== 'retired');
for (const [id, n] of ids) if (n > 1) err(`문항 ID 중복 ${id} ×${n}`);
for (const k of Object.keys(allGT)) if (!ids.has(k)) err(`원장에만 있는 ID ${k}`);

const norm = (s: string) => s.replace(/[\s?？.,]/g, '');
const seen = new Map<string, string>();
for (const q of live) {
  const n = norm(q.text ?? '');
  if (seen.has(n)) err(`${q.id}: 문장 중복 (${seen.get(n)})`);
  seen.set(n, q.id);
}
// 사실 중복 의심: 같은 sourceUrl + 같은 targetValue
const byFact = new Map<string, string>();
for (const q of live) {
  const g = allGT[q.id];
  if (!g?.targetValue) continue;
  const key = `${g.sourceUrl}||${g.targetValue}`;
  if (byFact.has(key)) warn(`${q.id}: ${byFact.get(key)} 와 같은 URL·값 (사실 범위 중복 의심)`);
  else byFact.set(key, q.id);
}

const usable = allQ.filter((q) => q.usable !== false && q.status !== 'retired');
console.log('모듈별 집계');
console.table(perModule);
console.log(`총 ${allQ.length}문항 / 사용 가능 ${usable.length} / 사용 불가 ${allQ.length - usable.length}`);
const byAud: Record<string, number> = {};
for (const q of usable) byAud[q.audience] = (byAud[q.audience] ?? 0) + 1;
console.log('사용 가능 audience 별:', byAud, ' en_candidate:', allQ.filter((q) => q.en_candidate).length);
if (warns.length) console.log(`\n경고 ${warns.length}건\n` + warns.map((w) => ' - ' + w).join('\n'));
if (errors.length) {
  console.log(`\n오류 ${errors.length}건\n` + errors.map((e) => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('\n오류 없음');

if (process.argv.includes('--merge')) {
  const outQ = {
    set: 'guro_all',
    agency_handle: 'AG-0017',
    revision: 1,
    reference_date: '2026-10-06',
    note: '모듈 파일이 원본. 이 파일은 병합 산출물(자동 생성).',
    questions: allQ,
  };
  fs.writeFileSync(path.join(QDIR, 'all.json'), JSON.stringify(outQ, null, 2), 'utf8');
  const outG = {
    unitId: 'guro',
    unitName: '구로구',
    agency_handle: 'AG-0017',
    upperTier: '서울특별시',
    asOf: '2026-10-06',
    entries: allGT,
  };
  fs.writeFileSync(path.resolve('docs/ground-truth/guro.json'), JSON.stringify(outG, null, 2), 'utf8');
  console.log('병합 완료: docs/aeo-questions/guro/all.json, docs/ground-truth/guro.json');
}
