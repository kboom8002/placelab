// scripts/measure-v2/analyze-guro-sources.ts
// 구로구 본측정(693건)의 '출처' 재분석 — 정답이 아니라 *어느 출처가 답을 만들었나*를 본다 (ADR-0011 D-2)
//
// 분류(도메인 기준, 근거 = 구청 누리집 '유관기관·패밀리사이트' 링크 목록, 2026-10-07 열람)
//   구로구청      : guro.go.kr 및 그 하위 도메인 (lib/toy/eminwon/hasu/hc.guro.go.kr …)
//   구로구 연결기관: 구청 누리집이 '유관기관/패밀리사이트'로 링크한 구 소속·위탁·지원 기관(문화재단·시설관리공단·복지관 등)
//                    — 법적 산하기관 여부는 확인하지 않았다. '구청 누리집이 연결한 기관'이라는 뜻이다
//   서울시·시 산하 : seoul.go.kr / seoul.kr 하위, 서울시설공단 등
//   중앙·공공      : 그 밖의 *.go.kr, gov.kr, 공공기관 도메인
//   타 자치구      : 서울 다른 자치구 누리집
//   그 밖          : 언론·백과·블로그·상업·미분류 — 구청 누리집 링크 목록에 없는 구 소속 기관 자체 사이트가
//                    여기에 섞여 있을 수 있다(예: 일부 도서관·가족센터). 연결기관 몫은 하한이다
//
// 규율
//   - 점수·순위를 만들지 않는다 (INV-3). 분포와 개수만 낸다
//   - 정확도 비율은 Floor Risk(불일치·부재 개수)와 함께 낸다 (INV-9)
//   - 원문은 쓰지 않는다. URL 호스트·경로 유형·질의 형태만 쓴다 (INV-6)
//   - 이 분석은 사후 탐색 분석이다 (사전 등록 가설이 아님, INV-11). 탐색적으로 표시한다
// 사용: pnpm tsx scripts/measure-v2/analyze-guro-sources.ts --out=docs/aeo-reports/guro/INTERNAL-guro-sources.md
import fs from 'fs';
import path from 'path';

const arg = (k: string, d?: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const dir = path.resolve('.private/guro/main');
const rd = (f: string) => fs.readFileSync(path.join(dir, f), 'utf-8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const qs: any[] = JSON.parse(fs.readFileSync('docs/aeo-questions/guro/all.json', 'utf-8').replace(/^\uFEFF/, '')).questions;
const qById = new Map(qs.map((q) => [q.id, q]));
const resp = rd('responses.jsonl').filter((r) => r.outcome !== 'error');
const ver = new Map<string, any>(rd('verdicts.jsonl').map((v) => [`${v.question_id}#${v.rep}`, v]));

const AFFIL = [
  'guroc.go.kr', // 구로구의회
  'gurocc.or.kr', 'guroartsvalley.or.kr', 'gurosc.or.kr', 'gurosisul.or.kr', 'laborguro.org',
  '9ro.or.kr', 'gurosenior.or.kr', 'hwawon.org', 'gr.dfsc.or.kr', 'guroedu.or.kr', 'edenwelfare.or.kr',
  'happykd.or.kr', 'fwc.or.kr', 'on9988.or.kr', 'mojawon.or.kr', 'peacehome.or.kr', 'changshinsarang.or.kr',
  'guro1318.org', 'gurolife.org', 'gurojahwal.or.kr', 'gurohope.or.kr', 'gurosen.or.kr', 'jobdream.or.kr',
  'guro-creative.co.kr', 'smart-guro.com',
];
const OTHER_DISTRICT = ['gangnam.go.kr', 'gangdong.go.kr', 'gangbuk.go.kr', 'gangseo.seoul.kr', 'gwanak.go.kr', 'gwangjin.go.kr', 'geumcheon.go.kr', 'nowon.kr', 'dobong.go.kr', 'ddm.go.kr', 'dongjak.go.kr', 'mapo.go.kr', 'sdm.go.kr', 'seocho.go.kr', 'sd.go.kr', 'sb.go.kr', 'songpa.go.kr', 'gangbuk.seoul.kr', 'jungnang.seoul.kr', 'yangcheon.go.kr', 'ydp.go.kr', 'yongsan.go.kr', 'ep.go.kr', 'jongno.go.kr', 'junggu.seoul.kr', 'jungnang.go.kr', 'cheoingu.go.kr'];
const SEOUL_EXTRA = ['sisul.or.kr', 'investseoul.org', 'smc.seoul.kr', 'sba.seoul.kr', 'seoulwelfare.or.kr', 'seoulshinbo.co.kr'];
const T = ['구로구청', '구로구 연결기관', '서울시·시 산하', '중앙·공공', '타 자치구', '그 밖'] as const;
type Tier = (typeof T)[number];

const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};
const endsWithAny = (h: string, list: string[]) => list.some((d) => h === d || h.endsWith('.' + d));
function tierOf(url: string): Tier {
  const h = hostOf(url);
  if (!h) return '그 밖';
  if (h === 'guro.go.kr' || h.endsWith('.guro.go.kr')) return '구로구청';
  if (endsWithAny(h, AFFIL)) return '구로구 연결기관';
  if (endsWithAny(h, OTHER_DISTRICT)) return '타 자치구';
  if (h.endsWith('seoul.go.kr') || h.endsWith('.seoul.kr') || h === 'seoul.kr' || endsWithAny(h, SEOUL_EXTRA)) return '서울시·시 산하';
  if (h.endsWith('.go.kr') || h === 'gov.kr' || h.endsWith('.gov.kr') || ['kostat.go.kr', 'law.go.kr'].includes(h)) return '중앙·공공';
  return '그 밖';
}
const clean = (u: string) => u.replace(/[?&]utm_source=openai/, '').replace(/&$/, '');
function pageType(u: string): string {
  const p = (() => { try { return new URL(u).pathname; } catch { return ''; } })();
  if (/selectBbsNttView/.test(p)) return '게시판 글(공지·보도자료 등)';
  if (/selectBbsNttList/.test(p)) return '게시판 목록';
  if (/selectEmplDeptWebList/.test(p)) return '부서·직원 안내';
  if (/contents\.do/.test(p)) return '고정 안내 페이지(contents)';
  if (/sub\.do/.test(p)) return '부서 소개(sub)';
  if (/index\.do|^\/$|\/www\/?$/.test(p)) return '메인·인덱스';
  return '그 밖 경로';
}

interface Row { id: string; rep: number; cited: Tier[]; first: Tier | null; retr: Set<Tier>; citedUrls: string[]; siteQ: boolean; nq: number; audience: string; named: boolean; module: string; verdict: string; }
const rows: Row[] = resp.map((r) => {
  const cu: string[] = (r.citation_urls ?? []).map(clean);
  const cited = cu.map(tierOf);
  const calls: any[] = r.search_calls ?? [];
  const retr = new Set<Tier>();
  for (const c of calls) for (const s of c.sources ?? []) retr.add(tierOf(s));
  const q = qById.get(r.question_id);
  const v = ver.get(`${r.question_id}#${r.attempt}`);
  return {
    id: r.question_id, rep: r.attempt, cited, first: cited[0] ?? null, retr, citedUrls: cu,
    siteQ: calls.some((c) => /site:guro\.go\.kr/.test(c.query ?? '')), nq: calls.length,
    audience: q?.audience ?? '?', named: !!q?.named, module: q?.module ?? '?', verdict: v?.verdict ?? '(판정없음)',
  };
});

const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : '—');
function wilson(k: number, n: number): string {
  if (!n) return '—';
  const z = 1.96, p = k / n;
  const den = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / den;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / den;
  return `${Math.round(100 * Math.max(0, c - h))}~${Math.round(100 * Math.min(1, c + h))}%`;
}
const own = (t: Tier) => t === '구로구청' || t === '구로구 연결기관';

// 질문 단위 집계
const byQ = new Map<string, Row[]>();
for (const r of rows) (byQ.get(r.id) ?? byQ.set(r.id, []).get(r.id)!).push(r);
const qStat = [...byQ.entries()].map(([id, rs]) => {
  const q = qById.get(id);
  return {
    id, text: q?.text ?? '', audience: q?.audience, named: !!q?.named, module: q?.module, n: rs.length,
    guro: rs.filter((r) => r.cited.includes('구로구청')).length,
    ownAny: rs.filter((r) => r.cited.some(own)).length,
    firstOwn: rs.filter((r) => r.first && own(r.first)).length,
    retrOwn: rs.filter((r) => [...r.retr].some(own)).length,
    rs,
  };
});

const L: string[] = [];
const P = (s = '') => L.push(s);
P('# 구로구 AI 응답의 출처 분석 — 내부 보고서 (본측정 693건 재분석)');
P('');
P('> [!WARNING]');
P('> **사후 탐색 분석**이다(사전 등록 가설 아님, INV-11). 문항 강건성 미검사(INV-10). 공표·구로구 전달에 쓸 수 없다. 출처 분류는 도메인 기준이며 법적 산하기관 여부를 확인한 것이 아니다. 이 분석으로는 **왜** 그 출처가 인용됐는지 알 수 없다.');
P('');
P('## 0. 이 분석이 답하는 것과 못 하는 것');
P('');
P('- 답하는 것: 구로구 이름이 들어간 질문에서 AI가 **구청·구청 연결 기관의 페이지**를 근거로 삼는가, 다른 출처를 삼는가.');
P('- 못 하는 것: 이름이 없는 경쟁 질문에서 구로구가 나오는가(별도 측정 필요). 아래 결과는 **이름을 넣어 물었을 때**의 값이라 구청에 유리한 방향으로 편향돼 있다(§2).');
P('');

// ── 1. 전체
const n = rows.length;
const anyGuro = rows.filter((r) => r.cited.includes('구로구청')).length;
const anyOwn = rows.filter((r) => r.cited.some(own)).length;
const noCite = rows.filter((r) => r.cited.length === 0).length;
const firstTier = new Map<string, number>();
for (const r of rows) firstTier.set(r.first ?? '(인용 없음)', (firstTier.get(r.first ?? '(인용 없음)') ?? 0) + 1);
P('## 1. 전체 (693회차 = 231문항 × 3회, 한국어, 웹검색 on)');
P('');
P(`- 구로구청 페이지를 한 번이라도 **인용**한 회차: ${anyGuro}/${n} (${pct(anyGuro, n)})`);
P(`- 구청 또는 연결기관을 인용한 회차: ${anyOwn}/${n} (${pct(anyOwn, n)})`);
P(`- 인용이 하나도 없는 회차: ${noCite}/${n}`);
P('');
P('**첫 번째 인용 출처(분포)**');
P('');
P('| 첫 인용 출처 | 회차 |');
P('|---|---|');
for (const t of [...T, '(인용 없음)']) P(`| ${t} | ${firstTier.get(t) ?? 0} (${pct(firstTier.get(t) ?? 0, n)}) |`);
P('');
const retrCnt = new Map<Tier, number>();
for (const r of rows) for (const t of r.retr) retrCnt.set(t, (retrCnt.get(t) ?? 0) + 1);
P('**검색에서 가져온 출처(인용 여부와 무관)가 해당 유형을 포함한 회차**');
P('');
P('| 유형 | 회차 |');
P('|---|---|');
for (const t of T) P(`| ${t} | ${retrCnt.get(t) ?? 0} (${pct(retrCnt.get(t) ?? 0, n)}) |`);
P('');
const citedTier = new Map<Tier, number>();
let totalCites = 0;
for (const r of rows) for (const t of r.cited) { citedTier.set(t, (citedTier.get(t) ?? 0) + 1); totalCites++; }
P(`**인용 건 전체(${totalCites}건)의 출처 유형**: ${T.map((t) => `${t} ${citedTier.get(t) ?? 0}`).join(' · ')}`);
P('');

// ── 2. 질의 형태
const siteN = rows.filter((r) => r.siteQ).length;
const withSearch = rows.filter((r) => r.nq > 0).length;
P('## 2. 질문에 지명이 있으면 AI가 구청 누리집을 직접 겨냥한다 (편향의 크기)');
P('');
P(`- 검색 질의에 \`site:guro.go.kr\` 를 **스스로 붙인** 회차: ${siteN}/${withSearch} (${pct(siteN, withSearch)})`);
const named = rows.filter((r) => r.named && r.nq > 0), unnamed = rows.filter((r) => !r.named && r.nq > 0);
P(`  - 지명 있는 질문: ${named.filter((r) => r.siteQ).length}/${named.length} (${pct(named.filter((r) => r.siteQ).length, named.length)})`);
P(`  - 지명 없는 질문(B6 무지명 탐침 등): ${unnamed.filter((r) => r.siteQ).length}/${unnamed.length} (${pct(unnamed.filter((r) => r.siteQ).length, unnamed.length)})`);
P('- 의미: 지명이 들어간 질문에서는 AI가 구청 누리집으로 곧장 가는 경향이 크므로, 이 측정의 높은 구청 인용률은 **"구청이 AI 검색에서 잘 발견된다"가 아니라 "구청 이름을 넣어 물으면 구청에서 찾는다"**로 읽어야 한다. 이름 없는 질문에서의 발견 가능성은 이 데이터로 알 수 없다.');
P('');

// ── 3. 대상·모듈
function tableBy(label: string, groups: [string, typeof qStat][]) {
  P(`| ${label} | 문항 | 구청 인용 회차 | 구청·연결기관 인용 회차 | 첫 인용이 구청·연결기관 | 구청·연결기관 인용 **0/3** 문항 |`);
  P('|---|---|---|---|---|---|');
  for (const [name, qsub] of groups) {
    const nr = qsub.reduce((a, q) => a + q.n, 0);
    const g = qsub.reduce((a, q) => a + q.guro, 0);
    const o = qsub.reduce((a, q) => a + q.ownAny, 0);
    const f = qsub.reduce((a, q) => a + q.firstOwn, 0);
    const z = qsub.filter((q) => q.ownAny === 0).length;
    P(`| ${name} | ${qsub.length} | ${g}/${nr} (${pct(g, nr)}) | ${o}/${nr} (${pct(o, nr)}) | ${f}/${nr} (${pct(f, nr)}) | ${z}/${qsub.length} |`);
  }
  P('');
}
P('## 3. 대상·모듈별');
P('');
P('회차 비율은 같은 문항의 3회가 묶여 있어 독립 표본이 아니다. 비율만 보고 구간을 읽지 않는다. 모듈별 문항 수가 작은 곳이 있다.');
P('');
const audGroups: [string, typeof qStat][] = [
  ['주민(resident)', qStat.filter((q) => q.audience === 'resident')],
  ['대외(external)', qStat.filter((q) => q.audience === 'external')],
  ['탐침 — 지명 있음(C1·C2)', qStat.filter((q) => q.audience === 'probe' && q.named)],
  ['탐침 — 지명 없음(B6)', qStat.filter((q) => q.audience === 'probe' && !q.named)],
];
tableBy('대상', audGroups);
const mods = [...new Set(qStat.map((q) => q.module))].sort();
tableBy('모듈', mods.map((m) => [m as string, qStat.filter((q) => q.module === m)] as [string, typeof qStat]));

// ── 4. 구청 출처 미도달 문항
const zero = qStat.filter((q) => q.ownAny === 0 && q.audience !== 'probe');
P('## 4. 3회 모두 구청·연결기관 출처가 인용되지 않은 문항');
P('');
P(`지명이 있는 주민·대외 문항 중 ${zero.length}개. 이 문항의 정답은 구청 누리집에 게시돼 있는데, AI는 다른 출처로 답했다. 원인은 이 측정으로 알 수 없다(가설: 구청 페이지가 검색 결과 상위에 오르지 않음, 내용이 PDF·이미지·표에만 있음, 같은 정보를 가진 외부 페이지가 더 쉽게 읽힘 등).`);
P('');
P('| 문항 | 모듈 | 3회 판정(일치/부분/불일치/부재/검토·제외) | 인용된 출처 유형 |');
P('|---|---|---|---|');
const vc = (rs: Row[]) => {
  const c: Record<string, number> = {};
  for (const r of rs) {
    const k = r.verdict === 'match' ? 'm' : r.verdict === 'partial' ? 'p' : r.verdict === 'mismatch' ? 'x' : r.verdict === 'absence' ? 'a' : 'r';
    c[k] = (c[k] ?? 0) + 1;
  }
  return `${c.m ?? 0}/${c.p ?? 0}/${c.x ?? 0}/${c.a ?? 0}/${c.r ?? 0}`;
};
for (const q of zero.sort((a, b) => a.id.localeCompare(b.id))) {
  const tiers = new Map<string, number>();
  for (const r of q.rs) for (const t of r.cited) tiers.set(t, (tiers.get(t) ?? 0) + 1);
  P(`| ${q.id} ${q.text} | ${q.module} | ${vc(q.rs)} | ${[...tiers.entries()].map(([t, k]) => `${t} ${k}`).join(' · ') || '인용 없음'} |`);
}
P('');

// ── 5. 구청 인용 페이지 유형
const pt = new Map<string, number>();
const hostsOwn = new Map<string, number>();
let guroCites = 0;
for (const r of rows) for (const u of new Set(r.citedUrls)) {
  const t = tierOf(u);
  if (t === '구로구청') { pt.set(pageType(u), (pt.get(pageType(u)) ?? 0) + 1); guroCites++; }
  if (own(t)) hostsOwn.set(hostOf(u), (hostsOwn.get(hostOf(u)) ?? 0) + 1);
}
P('## 5. 어떤 구청 페이지가 인용되나');
P('');
P(`구로구청 도메인 인용 ${guroCites}건(회차 내 중복 제거)의 페이지 유형:`);
P('');
P('| 페이지 유형 | 건 |');
P('|---|---|');
for (const [k, v] of [...pt.entries()].sort((a, b) => b[1] - a[1])) P(`| ${k} | ${v} (${pct(v, guroCites)}) |`);
P('');
P('- 게시판 글(공지·보도자료)은 시간이 지나면 낡거나 내려갈 수 있어, 고정 안내 페이지보다 낡은 정보를 줄 위험이 크다는 **가설**이 있다. 이 측정은 그 가설을 검증하지 않는다.');
P('');
P('구청·연결기관 도메인별 인용 회차(상위):');
P('');
P('| 도메인 | 회차 |');
P('|---|---|');
for (const [h, k] of [...hostsOwn.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) P(`| ${h} | ${k} |`);
P('');

// ── 6. 출처와 판정
const judged = rows.filter((r) => ['match', 'partial', 'mismatch', 'absence'].includes(r.verdict) && qById.get(r.id)?.type !== 'descriptive');
const A = judged.filter((r) => r.cited.some(own));
const B = judged.filter((r) => !r.cited.some(own));
const cntV = (rs: Row[]) => ({ m: rs.filter((r) => r.verdict === 'match').length, p: rs.filter((r) => r.verdict === 'partial').length, x: rs.filter((r) => r.verdict === 'mismatch').length, a: rs.filter((r) => r.verdict === 'absence').length });
const a = cntV(A), b = cntV(B);
const floorHigh = (rs: Row[]) => { const m = new Map<string, Row[]>(); for (const r of rs) (m.get(r.id) ?? m.set(r.id, []).get(r.id)!).push(r); return [...m.values()].filter((g) => g.some((r) => r.verdict === 'mismatch')).length; };
P('## 6. 출처와 정답의 관계 (값형 문항, 판정된 회차만)');
P('');
P('| 구분 | 회차 | 일치 | 부분 | 불일치 | 부재 | 불일치가 1회 이상 있는 문항 수 |');
P('|---|---|---|---|---|---|---|');
P(`| 구청·연결기관 인용 있음 | ${A.length} | ${a.m} | ${a.p} | ${a.x} | ${a.a} | ${floorHigh(A)} |`);
P(`| 구청·연결기관 인용 없음 | ${B.length} | ${b.m} | ${b.p} | ${b.x} | ${b.a} | ${floorHigh(B)} |`);
P('');
P(`- 일치 비율은 인용 있음 ${pct(a.m, A.length)}(구간 ${wilson(a.m, A.length)}), 인용 없음 ${pct(b.m, B.length)}(구간 ${wilson(b.m, B.length)}). 구간은 회차를 독립으로 본 근사라 실제보다 좁다. **불일치 ${a.x}건 대 ${b.x}건, 부재 ${a.a}건 대 ${b.a}건을 함께 본다(Floor Risk).**`);
P(`- 불일치 비율(회차): 인용 있음 ${pct(a.x, A.length)}, 인용 없음 ${pct(b.x, B.length)}. 부재 비율: ${pct(a.a, A.length)} 대 ${pct(b.a, B.length)}.`);
P('- 연관일 뿐 인과가 아니다. 구청 페이지를 쉽게 찾는 문항이 원래 쉬운 문항일 수 있다.');
P('- **구청 출처를 인용하고도 불일치인 회차**가 있다. 이는 인용한 구청 페이지가 낡았거나 AI가 잘못 읽었거나 구청 누리집 내부 상충일 수 있다 — 구청 정비 후보와 AI 오독을 구분하려면 개별 사람 검토가 필요하다.');
P('');
P('## 7. 종합 (관측만, 원인 단정 없음)');
P('');
P(`1. 지명이 있는 질문에서 구청 도메인 인용은 ${pct(anyGuro, n)}(회차)로 높다. 그러나 AI가 질의에 \`site:guro.go.kr\` 를 스스로 붙인 회차가 ${pct(siteN, withSearch)}이므로, 이 값은 **구청의 검색 노출도가 아니라 지명 질문에 대한 AI의 직접 탐색 경향**을 많이 반영한다.`);
P(`2. 구청 연결기관(문화재단·시설관리공단 등)이 인용된 회차는 ${pct(rows.filter((r) => r.cited.some((t) => t === '구로구 연결기관')).length, n)}로 적다. 연결기관 몫은 도메인 목록 기준의 하한이다.`);
P(`3. 모듈에 따라 구청 출처 도달이 크게 다르다(§3). 구청·연결기관 출처가 3회 모두 인용되지 않은 문항이 ${zero.length}개(§4)이며, 교육(A4)·지역 소규모 시설 문항에 몰려 있다. 이 문항들에서는 구청 외 출처(타 기관·외부 페이지)가 답의 근거였다.`);
P('4. 구청 출처가 있을 때 불일치가 적은 연관이 보이지만(§6), 이름이 있는 질문·쉬운 문항이 섞인 연관이라 인과로 읽지 않는다.');
P(`5. 이름이 없는 질문에서 구로구가 나오는지, 다른 지명이 먼저 나오는지는 **이 데이터로 알 수 없다.** 지명 없는 문항은 개·회차뿐이고 정답 하나를 묻는 형태라 경쟁 상황이 아니다. 비지명 경쟁 질문 측정은 별도 사전 등록이 필요하다.`);
P('');
fs.writeFileSync('.private/guro/main/source-analysis.json', JSON.stringify({ n, anyGuro, anyOwn, noCite, siteN, withSearch, zeroIds: zero.map((q) => q.id) }, null, 2));
const out = arg('out');
if (out) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, L.join('\n') + '\n', 'utf-8');
  console.log('보고서 →', out);
} else console.log(L.join('\n'));
