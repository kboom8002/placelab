// scripts/measure-v2/judge-guro-supp.ts
// 구로구 보완 세트(탐색적) 판정 + 내부 보고서 생성
//  - 규칙 판정 후, 사람 검토 결정(.private/guro/<phase>/review.json)이 있으면 그것으로 덮는다
//  - 원문은 .private 에만 있다. 보고서에는 원문을 싣지 않는다 (INV-6). 판정·짧은 사유만
//  - 점수·순위를 만들지 않는다 (INV-3). 일치 비율은 Floor Risk(실패 유형)와 함께 낸다 (INV-9)
//  - 1회 측정이라 분포(반복 간 변동)를 말할 수 없다. 보고서에 그렇게 쓴다
// 사용: pnpm tsx scripts/measure-v2/judge-guro-supp.ts --phase=explore-supp1 --set=guro-supp1 [--sheet] [--out=docs/...md]
import fs from 'fs';
import path from 'path';

const arg = (k: string, d?: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const phase = arg('phase', 'explore-supp1')!;
const set = arg('set', 'guro-supp1')!;
const dir = path.resolve('.private/guro', phase);
const Q = JSON.parse(fs.readFileSync(`docs/aeo-questions/${set}/questions.json`, 'utf-8'));
const G = JSON.parse(fs.readFileSync(`docs/aeo-questions/${set}/ground-truth.json`, 'utf-8')).entries;

const recs = new Map<string, any>();
for (const l of fs.readFileSync(path.join(dir, 'responses.jsonl'), 'utf-8').split('\n')) {
  if (!l.trim()) continue;
  const r = JSON.parse(l);
  if (r.outcome !== 'error') recs.set(r.question_id, r);
}

// 캐시 페이지 — 응답에 나온 전화번호가 같은 부서 이름 근처에 게시돼 있는지 확인용
const pages: string[] = [];
const pdir = path.resolve('.private/guro/pages');
for (const f of fs.readdirSync(pdir).filter((x) => x.endsWith('.txt'))) pages.push(fs.readFileSync(path.join(pdir, f), 'utf-8').replace(/\s+/g, ' '));
function phoneNearDept(num: string, depts: string[]): boolean {
  const re = new RegExp(num.replace(/-/g, '-?'), 'g');
  for (const p of pages) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(p))) {
      const win = p.slice(Math.max(0, m.index - 400), m.index + 200);
      if (depts.some((d) => win.includes(d))) return true;
    }
  }
  return false;
}

const squash = (s: string) => s.replace(/[\s\-–.()·]/g, '').toLowerCase();
const has = (text: string, vs: string[]) => vs.some((v) => squash(text).includes(squash(v)));

interface V {
  id: string;
  group: string;
  kind: string;
  verdict: string;
  detail: string;
  guro_cited: boolean;
  search: boolean;
  floor: 'critical' | 'high' | 'moderate' | 'low' | '—';
  by: 'rule' | 'human_review';
}

const out: V[] = [];
for (const q of Q.questions) {
  const r = recs.get(q.id);
  const e = G[q.id];
  if (!r) {
    out.push({ id: q.id, group: q.group, kind: q.kind, verdict: 'no_response', detail: '', guro_cited: false, search: false, floor: '—', by: 'rule' });
    continue;
  }
  const t: string = r.raw_text ?? '';
  const urls: string[] = [...(r.citation_urls ?? []), ...(r.body_urls ?? [])];
  const base = { id: q.id, group: q.group, kind: q.kind, guro_cited: urls.some((u) => /guro\.go\.kr/.test(u)), search: (r.search_calls?.length ?? r.usage?.search_call_count ?? 0) > 0 || !!r.search_triggered, by: 'rule' as const };
  let verdict = 'review';
  let detail = '';
  let floor: V['floor'] = 'moderate';
  if (q.kind === 'route') {
    const dept = has(t, e.dept);
    const phone = has(t, e.phone);
    const nums = [...new Set((t.match(/860[-\s]?\d{4}/g) ?? []).map((x) => x.replace(/\s/g, '-').replace(/^860(\d)/, '860-$1')))];
    const expected = e.phone.map((p: string) => squash(p).slice(-7));
    const others = nums.filter((n) => !expected.includes(squash(n)));
    const unverified = others.filter((n) => !phoneNearDept(n, e.dept));
    const alt = e.alt_channels.filter((a: string) => t.includes(a));
    if (dept || phone) {
      verdict = unverified.length ? 'match_with_unverified_number' : 'match';
      floor = unverified.length ? 'high' : 'low';
    } else if (alt.length) {
      verdict = 'alt_channel_only';
      floor = 'moderate';
    } else {
      verdict = 'miss';
      floor = 'high';
    }
    detail = `부서 ${dept ? 'O' : 'X'} · 번호 ${phone ? 'O' : 'X'}${others.length ? ` · 다른 번호 ${others.join(',')}${unverified.length ? ` (부서 근처 게시 미확인 ${unverified.join(',')})` : ' (같은 부서 게시 확인)'}` : ''}${alt.length ? ` · 다른 경로 ${alt.join(',')}` : ''}`;
  } else if (q.kind === 'fact') {
    const ok = has(t, e.acceptableVariants);
    verdict = ok ? 'match' : 'review';
    floor = ok ? 'low' : 'high';
    detail = ok ? '원장 값 등장' : '원장 값 미등장 — 사람 확인';
  } else if (q.kind === 'variant2') {
    const a = has(t, e.variants.A);
    const b = has(t, e.variants.B);
    verdict = a && b ? 'both' : a ? 'variant_A' : b ? 'variant_B' : 'neither';
    floor = verdict === 'neither' ? 'high' : '—';
    detail = '누리집 내 두 표현 공존 — 정오 판정 없음';
  } else if (q.kind === 'coverage') {
    const hit = Object.entries<string[]>(e.items).filter(([, vs]) => has(t, vs)).map(([k]) => k);
    verdict = `covered_${hit.length}`;
    floor = '—';
    detail = `공식 목록 ${Object.keys(e.items).length}개 중 ${hit.length}개: ${hit.join(', ')}`;
  } else if (q.kind === 'mention') {
    const ent = has(t, e.entity);
    const dis = has(t, e.district);
    verdict = ent && dis ? 'entity_and_district' : ent ? 'entity_only' : dis ? 'district_only' : 'absent';
    floor = '—';
    detail = `개체 ${ent ? 'O' : 'X'} · 구로 귀속 ${dis ? 'O' : 'X'}`;
  } else if (q.kind === 'negative') {
    const dis = has(t, e.district);
    verdict = dis ? 'misattribution_candidate' : 'absent_ok';
    floor = dis ? 'high' : 'low';
    detail = dis ? '구로 등장 — 사람 확인' : '구로 미등장(기대대로)';
  }
  out.push({ ...base, verdict, detail, floor });
}

// 사람 검토 결정으로 덮기
const reviewPath = path.join(dir, 'review.json');
const review: Record<string, { verdict: string; floor: V['floor']; reason: string }> = fs.existsSync(reviewPath) ? JSON.parse(fs.readFileSync(reviewPath, 'utf-8')) : {};
for (const v of out) {
  const d = review[v.id];
  if (d) {
    v.verdict = d.verdict;
    v.floor = d.floor;
    v.detail = `${v.detail} → 검토: ${d.reason}`;
    v.by = 'human_review';
  }
}
fs.writeFileSync(path.join(dir, 'verdicts.json'), JSON.stringify(out, null, 2), 'utf-8');

if (process.argv.includes('--sheet')) {
  // 검토 시트: 원문 포함 → .private 에만
  const lines: string[] = [];
  for (const v of out) {
    const q = Q.questions.find((x: any) => x.id === v.id);
    lines.push(`### ${v.id} [${v.kind}] ${v.verdict} — ${v.detail}\nQ: ${q.text}\nA: ${(recs.get(v.id)?.raw_text ?? '').replace(/\s+/g, ' ')}\nURLs: ${(recs.get(v.id)?.citation_urls ?? []).join(' ')}\n`);
  }
  fs.writeFileSync(path.join(dir, 'review-sheet.txt'), lines.join('\n'), 'utf-8');
  console.log(`검토 시트 → ${path.join(dir, 'review-sheet.txt')}`);
}

const cnt = (xs: V[]) => xs.reduce((m: Record<string, number>, v) => ((m[v.verdict] = (m[v.verdict] ?? 0) + 1), m), {});
for (const g of ['demand_route', 'representation', 'unnamed_probe']) console.log(g, JSON.stringify(cnt(out.filter((v) => v.group === g))));

// ── 보고서 ──
const outMd = arg('out');
if (outMd) {
  const usage = [...recs.values()].reduce(
    (a, r) => ({ inT: a.inT + (r.usage?.input_tokens ?? 0), outT: a.outT + (r.usage?.output_tokens ?? 0), s: a.s + (r.usage?.search_call_count ?? r.search_calls?.length ?? 0) }),
    { inT: 0, outT: 0, s: 0 },
  );
  const first = [...recs.values()][0];
  const L: string[] = [];
  const qText = (id: string) => Q.questions.find((x: any) => x.id === id)?.text ?? '';
  const route = out.filter((v) => v.group === 'demand_route');
  const rc = cnt(route);
  const rMatch = (rc.match ?? 0) + (rc.match_with_unverified_number ?? 0);
  L.push('# 구로구 보완 질문 1차 — 탐색 측정 내부 보고서');
  L.push('');
  L.push('> [!WARNING]');
  L.push('> **탐색적 측정**(사전 등록 없음, INV-11) · **강건성 미검사**(INV-10) · **1회 측정**(반복 간 분포 없음). 공표·구로구 전달에 쓸 수 없다. 본측정(PR-2026Q4-GURO-OAI-WS-KO) 결과와 합산하지 않는다.');
  L.push('');
  L.push(`- 측정 조건: ${first?.run_profile_id ?? ''} · 모델 문자열 \`${first?.model_returned ?? first?.model ?? 'gpt-6-luna'}\` · 웹검색 on · 한국어 · 방법론 v2.3 · ${(first?.observed_at ?? '').slice(0, 10)} 측정`);
  L.push(`- 문항 30 (민원 연결 14 · 구정 대표성 6 · 무지명 탐침 10) · 응답 ${recs.size} · 입력 ${usage.inT.toLocaleString()} 토큰 · 출력 ${usage.outT.toLocaleString()} 토큰 · 검색 호출 기록 ${usage.s}`);
  L.push(`- 추정 비용 약 $${((usage.inT * 0.1 + usage.outT * 0.5) / 1e6 + usage.s * 0.01).toFixed(2)} (단가: 입력 $0.1/MTok · 출력 $0.5/MTok · 검색 $0.01/회, 사용자 확인 단가. 검색 과금 횟수는 기록보다 많을 수 있다)`);
  L.push(`- 문항 파일: \`docs/aeo-questions/${set}/\` · 생성 스크립트: \`scripts/measure-v2/guro-author/supp1.ts\` · 근거 구절은 \`check-guro-supp-quotes.ts\` 로 캐시 페이지 대조 통과`);
  L.push('- 판정: 규칙 판정 후 분석자 1인(AI 보조)이 30건 전부 원문 대조. 사람 확인 결정이 덮어쓴 행은 표에 "검토"로 표시');
  L.push('');
  L.push('## 1. 문항 설계 근거');
  L.push('');
  L.push('- **민원 수요(추정)**: 구청 누리집 「주요업무별 전화번호」(콘텐츠수정일 2026-08-10)의 *주요민원업무* 목록을 구청이 스스로 꼽은 수요의 대리 지표로 쓰고, 그 안에서 생활 민원 빈도를 분석자가 추정해 14개를 골랐다. **실제 민원 통계로 검증한 것이 아니다.**');
  L.push('- **구정 대표성**: 구청장·구정 슬로건·대표 축제·지역 상품권·명소·구청장 소통 창구. 공식 페이지에서 값을 확인한 것만.');
  L.push('- **무지명 탐침**: 질문에 "구로"가 없다. 구로구의 공식 시설·사업이 *등장하는지*와 *구로구 것으로 귀속되는지*를 따로 본다. 등장하지 않는 것이 오류라는 뜻이 아니다.');
  L.push('');
  L.push('## 2. 결과 요약');
  L.push('');
  L.push('| 묶음 | 결과 | Floor Risk |');
  L.push('|---|---|---|');
  L.push(`| 민원 연결 14 | 담당 부서·번호 일치 ${rMatch} (그중 확인 안 된 다른 번호 동반 ${rc.match_with_unverified_number ?? 0}) · 다른 정상 경로만 안내 ${rc.alt_channel_only ?? 0} · 연결 실패 ${rc.miss ?? 0}${Object.entries(rc).filter(([k]) => !['match', 'match_with_unverified_number', 'alt_channel_only', 'miss'].includes(k)).map(([k, n]) => ` · ${k} ${n}`).join('')} | 높음 ${route.filter((v) => v.floor === 'high').length} · 중간 ${route.filter((v) => v.floor === 'moderate').length} · 낮음 ${route.filter((v) => v.floor === 'low').length} |`);
  const rep = out.filter((v) => v.group === 'representation');
  L.push(`| 구정 대표성 6 | ${Object.entries(cnt(rep)).map(([k, n]) => `${k} ${n}`).join(' · ')} | 높음 ${rep.filter((v) => v.floor === 'high').length} |`);
  const pr = out.filter((v) => v.group === 'unnamed_probe' && v.kind === 'mention');
  const neg = out.filter((v) => v.kind === 'negative');
  const frK: Record<string, string> = { critical: '치명', high: '높음', moderate: '중간', low: '낮음', '—': '—' };
  L.push(`| 무지명 탐침 9 | ${Object.entries(cnt(pr)).map(([k, n]) => `${k} ${n}`).join(' · ')} | 오귀속 높음 ${pr.filter((v) => v.floor === 'high').length} (미등장은 오류 아님) |`);
  L.push(`| 음성 대조 1 | ${neg.map((v) => v.verdict).join(', ')} | ${neg.map((v) => frK[v.floor]).join(', ')} |`);
  L.push('');
  L.push('판정 기호: `match` 일치 · `match_with_unverified_number` 부서는 맞으나 누리집에서 그 부서 번호로 확인되지 않는 번호를 함께 제시 · `alt_channel_only` 120·동주민센터 등 다른 정상 경로만 안내(오답 아님) · `miss` 연결 실패 · `entity_and_district` 개체 등장+구로 귀속 · `entity_only` 개체만 등장 · `absent` 미등장.');
  L.push('');
  L.push('## 3. 문항별 판정 (문항 ID 순 — 순서를 매기는 용도가 아니다)');
  L.push('');
  L.push('| 문항 | 유형 | 판정 | 근거 | Floor Risk | 구로구 누리집 인용 | 판정자 |');
  L.push('|---|---|---|---|---|---|---|');
  const fr: Record<string, string> = { critical: '치명', high: '높음', moderate: '중간', low: '낮음', '—': '—' };
  for (const v of out) L.push(`| ${v.id} ${qText(v.id)} | ${v.kind} | ${v.verdict} | ${v.detail.replace(/\|/g, '/')} | ${fr[v.floor]} | ${v.guro_cited ? 'O' : 'X'} | ${v.by === 'human_review' ? '검토' : '규칙'} |`);
  L.push('');
  const notes = arg('notes');
  if (notes && fs.existsSync(notes)) L.push(fs.readFileSync(notes, 'utf-8'));
  fs.mkdirSync(path.dirname(outMd), { recursive: true });
  fs.writeFileSync(outMd, L.join('\n') + '\n', 'utf-8');
  console.log(`보고서 → ${outMd}`);
}
