// scripts/measure-v2/guro-author/lib.ts
// 구로구 문항·원장 작성 보조 — 모듈 데이터(행)를 규칙 파일(_AUTHORING_RULES.md)의 JSON 형식으로 펼친다.
// 이 파일은 형식 변환만 한다. 사실(값·근거 구절·URL)은 각 모듈 데이터 파일에서 '읽은 페이지 기준'으로 적는다.
import fs from 'fs';
import path from 'path';

export interface Row {
  id: string; // 접두 포함 전체 ID
  persona: string;
  journey: string;
  text: string;
  boundary: string;
  ledger?: string; // 원장 출처 이름 (값형)
  owner?: 'agency_hq' | 'affiliate' | 'upper_tier' | 'institution' | 'private' | 'none';
  vol?: 'static' | 'annual' | 'event';
  diff?: 'D0' | 'D1' | 'D2' | 'D3';
  value?: string | null; // targetValue (null = to_verify)
  variants?: string[];
  url?: string;
  quote?: string; // 40자 이내 권장
  asOf?: string | null; // 페이지 수정일/기준일
  nature?: 'measured' | 'estimated' | 'planned';
  srcType?: string;
  authority?: string;
  tier?: 'direct' | 'affiliate' | 'upper' | 'none';
  en?: boolean;
  basis?: string; // source_basis
  desc?: boolean; // descriptive
  note?: string;
  unverifiedReason?: string; // 있으면 to_verify
  extra?: Record<string, unknown>; // 원장 항목에 덧붙일 필드 (C2, B6 등)
  named?: boolean;
  layers?: string[];
}

export interface Meta {
  file: string; // a1-admin
  set: string;
  module: string;
  audience: 'resident' | 'external' | 'probe';
  fetchedOn?: string;
}

const REF = '2026-10-06';

export function buildModule(meta: Meta, rows: Row[]) {
  const qs: any[] = [];
  const entries: Record<string, any> = {};
  for (const r of rows) {
    const toVerify = !!r.unverifiedReason;
    const named = r.named ?? /구로/.test(r.text);
    const isDesc = !!r.desc;
    qs.push({
      id: r.id,
      revision: 1,
      status: 'active',
      module: meta.module,
      audience: meta.audience,
      named,
      persona: r.persona,
      journey: r.journey,
      text: r.text,
      boundary: r.boundary,
      type: isDesc ? 'descriptive' : 'value',
      layers: r.layers ?? (isDesc ? ['access', 'readability', 'citation'] : ['access', 'readability', 'citation', 'accuracy']),
      ledger: isDesc ? null : r.ledger ?? null,
      owner_role: r.owner ?? 'agency_hq',
      difficulty: r.diff ?? 'D1',
      sensitivity: 'public',
      source_basis: r.basis ?? r.authority ?? '구로구청 누리집',
      basis_verification: toVerify ? 'to_verify' : 'confirmed',
      volatility: r.vol ?? 'annual',
      en_candidate: !!r.en,
      usable: !toVerify,
      note: r.note ?? '',
    });
    const tier = r.tier ?? ((r.owner ?? 'agency_hq') === 'upper_tier' ? 'upper' : (r.owner ?? 'agency_hq') === 'affiliate' ? 'affiliate' : 'direct');
    if (toVerify) {
      entries[r.id] = {
        targetValue: null,
        acceptableVariants: [],
        verification: 'to_verify',
        unverified_reason: r.unverifiedReason,
        ...(r.extra ?? {}),
      };
    } else if (isDesc && r.value === undefined) {
      entries[r.id] = { verification: 'confirmed', ...(r.extra ?? {}) };
    } else {
      entries[r.id] = {
        targetValue: r.value ?? null,
        acceptableVariants: r.variants ?? [],
        sourceAuthority: r.authority ?? '구로구청',
        ownerRole: r.owner ?? 'agency_hq',
        tier,
        sourceUrl: r.url,
        sourceType: r.srcType ?? '누리집',
        fetchedOn: meta.fetchedOn ?? REF,
        asOfSource: r.asOf ?? null,
        valueNature: r.nature ?? 'measured',
        verification: 'confirmed',
        evidence_quote: r.quote,
        ...(r.extra ?? {}),
      };
    }
  }
  const qd = path.resolve('docs/aeo-questions/guro');
  const gd = path.resolve('docs/ground-truth/guro');
  fs.mkdirSync(qd, { recursive: true });
  fs.mkdirSync(gd, { recursive: true });
  // 이미 폐기(retired)된 문항·원장은 이력이므로 보존한다. 새 문항이 같은 ID 를 쓰면 안 된다
  const qp = path.join(qd, `${meta.file}.json`);
  const gp = path.join(gd, `${meta.file}.json`);
  if (fs.existsSync(qp) && fs.existsSync(gp)) {
    const oldQ = JSON.parse(fs.readFileSync(qp, 'utf-8'));
    const oldG = JSON.parse(fs.readFileSync(gp, 'utf-8'));
    const newIds = new Set(qs.map((q) => q.id));
    const kept = (oldQ.questions ?? []).filter((q: any) => q.status === 'retired' && !newIds.has(q.id));
    for (const q of kept) {
      qs.unshift(q);
      if (oldG.entries?.[q.id]) entries[q.id] = oldG.entries[q.id];
    }
    const clash = (oldQ.questions ?? []).filter((q: any) => q.status === 'retired' && newIds.has(q.id));
    if (clash.length) throw new Error(`폐기된 ID 를 재사용할 수 없습니다: ${clash.map((q: any) => q.id).join(', ')}`);
  }
  const qdoc = { set: meta.set, module: meta.module, agency_handle: 'AG-0017', revision: 1, reference_date: REF, questions: qs };
  const gdoc = { unitId: 'guro', unitName: '구로구', agency_handle: 'AG-0017', upperTier: '서울특별시', asOf: REF, entries };
  fs.writeFileSync(qp, JSON.stringify(qdoc, null, 2) + '\n', 'utf-8');
  fs.writeFileSync(gp, JSON.stringify(gdoc, null, 2) + '\n', 'utf-8');
  console.log(`${meta.module}: ${qs.length}문항 (to_verify ${qs.filter((q) => !q.usable && q.status !== 'retired').length}, 폐기 ${qs.filter((q) => q.status === 'retired').length}) → ${meta.file}.json`);
}
