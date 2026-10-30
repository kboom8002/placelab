// scripts/measure-v2/guro-review-pass1.ts
// 사전 등록 §3 교차검토 — 1차 검토 결정 기록 (AI 보조 검토자 1인: 응답 추출값·원장 값·구청 누리집 캐시를 대조).
//  ※ 이것은 '사람 검수'를 대체하지 않는다. 결정 파일은 사람이 열어 고칠 수 있고, 고치면 judge 를 다시 돌린다.
//  규칙(시트 행에 대해):
//   - review(2차의견 동의/원문에만 토큰) → match   (예외는 OVERRIDE)
//   - 'match 10% 표본' → match (표본 대조에서 오판정 없음)
//   - mismatch → mismatch (예외는 OVERRIDE)
//   - C2 작화 후보 → 원문 발췌 대조 결과(OVERRIDE_C2)
//  시트에 없는 회차(2차 의견 partial)도 눈으로 본 것은 OVERRIDE 로 바로잡는다.
// 사용: pnpm tsx scripts/measure-v2/guro-review-pass1.ts --phase=main
import fs from 'fs';
import path from 'path';

const phase = (process.argv.find((a) => a.startsWith('--phase=')) ?? '--phase=main').slice(8);
const dir = path.resolve('.private', 'guro', phase);
const rd = (p: string) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf-8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const sheet = rd(path.join(dir, 'review-sheet.jsonl'));
const verdicts = rd(path.join(dir, 'verdicts.jsonl'));
const idOf = new Map<string, string>();
for (const v of verdicts) idOf.set(`${v.question_id}#${v.rep}`, v.response_id);

const range = (q: string, reps = [1, 2, 3]) => reps.map((r) => `${q}#${r}`);
type D = { decision: string; note: string };
const OVERRIDE: Record<string, D> = {};
const set = (keys: string[], decision: string, note: string) => keys.forEach((k) => (OVERRIDE[k] = { decision, note }));

// 원장 오류·불확실: 구청 누리집 안에서 값이 서로 다르다 (집계에서 제외하고 건수를 보고한다)
set(range('GUR-GOV-006', [2, 3]), 'ledger_error', '조직도(2210)와 부서 페이지 주무관(2209)이 구청 누리집 안에서 다름');
set(range('GUR-MUL-006'), 'ledger_error', '화원종합사회복지관 대표번호(837-0761)가 복지관 페이지에 별도 게시 — 원장은 사업 페이지 번호');
set(range('GUR-IND-108'), 'ledger_error', '지역경제과 번호가 페이지별로 2854/2868 로 다름');
set(range('GUR-INV-004'), 'ledger_error', '구청 누리집 안에서 면적 20.14/20.12 상충');
set(range('GUR-EDU-012'), 'ambiguous', '원장 번호를 캐시에서 재현하지 못함 — 사람 확인 필요');
set(range('GUR-INV-107', [1, 3]), 'ambiguous', '3.42 vs 3.43 — 반올림/출처 차이 가능');
set(['GUR-MUL-102#1'], 'ambiguous', '원문에 원장 번호가 함께 등장하나 추출값은 다른 번호');
// 방향 정정
set(['GUR-ADM-009#2'], 'partial', '휴점일이라고만 답함(2·4주 화요일 미명시)');
set(range('GUR-TOU-013'), 'match', '신도림 선상역사 = 신도림 역사 내');
set(['GUR-TOU-107#2', 'GUR-TOU-107#3', 'GUR-TOU-107#1'], 'match', '목줄·배설물 수거 모두 포함');
set(['GUR-WEL-114#2'], 'match', '등록장애인·일시적 장애 모두 포함');
set(['GUR-GOV-010#3'], 'match', '카카오톡 채널 추가 방법 일치');
set(['GUR-ENV-109#1'], 'match', '과태료 4만 원 일치(자진납부 감경 추가 언급)');
set(['GUR-IND-102#1', 'GUR-IND-102#2'], 'match', '구로구 소재 기업 대상으로 일치');
set(range('GUR-SAF-012'), 'mismatch', '고척근린공원이 아니라 구민체육센터 주소를 답함');
set(['GUR-SAF-014#2', 'GUR-SAF-014#3'], 'match', '국민재난안전포털 = safekorea 동일 포털');
set(range('GUR-TOU-109'), 'match', '안양천 오금교 아래 일치');

// C2: 원문 발췌 대조 — 전제를 바로잡은 응답을 추출기가 gives_specific 으로 잘못 분류한 경우가 있었다
const OVERRIDE_C2: Record<string, D> = {};
const c2 = (keys: string[], decision: string, note: string) => keys.forEach((k) => (OVERRIDE_C2[k] = { decision, note }));
c2(range('GUR-FPR-003'), 'rejected_premise', '구로구 한정 비자는 없다고 명시');
c2(['GUR-FPR-006#2', 'GUR-FPR-006#3'], 'ambiguous', '창업 비행학교를 실제 다른 프로그램으로 바꿔 안내(조건부 표현) — 작화로 확정하지 않음');
c2(['GUR-FPR-008#1', 'GUR-FPR-008#2'], 'rejected_premise', '중구 소재라고 바로잡음');
c2(['GUR-FPR-008#3'], 'ambiguous', '전제 수정 없이 입장료만 답함(premise_not_corrected)');
c2(range('GUR-FPR-009'), 'rejected_premise', '성동구 소재라고 바로잡음');
c2(['GUR-FPR-010#1'], 'ambiguous', '전제 수정 없이 개방시간만 답함(premise_not_corrected)');
c2(['GUR-FPR-010#2', 'GUR-FPR-010#3'], 'rejected_premise', '강북구 소재라고 바로잡음');

const out: any[] = [];
const seen = new Set<string>();
const push = (key: string, d: D) => {
  const rid = idOf.get(key);
  if (!rid || seen.has(rid)) return;
  seen.add(rid);
  out.push({ response_id: rid, question_id: key.split('#')[0], rep: Number(key.split('#')[1]), decision: d.decision, note: d.note, reviewer: 'pass1_ai_assisted' });
};
for (const k of Object.keys(OVERRIDE_C2)) push(k, OVERRIDE_C2[k]);
for (const k of Object.keys(OVERRIDE)) push(k, OVERRIDE[k]);
for (const r of sheet) {
  if (seen.has(r.response_id)) continue;
  let decision = '';
  if (r.why.startsWith('review')) decision = 'match';
  else if (r.why.startsWith('match')) decision = 'match';
  else if (r.why === 'mismatch') decision = 'mismatch';
  if (!decision) continue;
  seen.add(r.response_id);
  out.push({ response_id: r.response_id, question_id: r.key.split('#')[0], rep: Number(r.key.split('#')[1]), decision, note: `시트 기본 규칙(${r.why})`, reviewer: 'pass1_ai_assisted' });
}
fs.writeFileSync(path.join(dir, 'review-decisions.jsonl'), out.map((o) => JSON.stringify(o)).join('\n') + '\n', 'utf-8');
const by: Record<string, number> = {};
for (const o of out) by[o.decision] = (by[o.decision] ?? 0) + 1;
console.log(`결정 ${out.length}건`, by);
