// scripts/measure-v2/guro-author/retire.ts
// 검토에서 탈락한 문항을 '삭제'하지 않고 폐기(retired) 처리한다.
// ID 는 한 번 붙이면 바꾸지 않는다 (_AUTHORING_RULES.md §2). 원장 항목은 이력으로 남긴다.
import fs from 'fs';
import path from 'path';

const RETIRE: Record<string, string> = {
  // 확장분 검토 (2026-10-07)
  'GUR-INV-001': '파일럿: 문장에 기준일이 없어 AI 가 월별 최신치를 답함 → INV-201 로 대체(기준일 명시)',
  'GUR-INV-002': '파일럿 근거 동일 → INV-202 로 대체',
  'GUR-INV-003': '파일럿 근거 동일 → INV-203 로 대체',
  'GUR-ENV-009': '원장 오류: 가격표에서 490원은 일반 20ℓ(10ℓ는 250원) — 열 혼동',
  'GUR-ENV-107': '원장 오류: 740원은 일반 30ℓ(20ℓ는 490원) — 열 혼동',
  'GUR-ENV-102': 'GUR-ENV-103 과 같은 번호(사실 중복)',
  'GUR-ENV-113': 'GUR-ENV-103 과 같은 번호(사실 중복)',
  'GUR-WEL-103': 'GUR-WEL-004 와 문장 중복',
  'GUR-EDU-101': 'GUR-WEL-004 와 사실 중복',
  'GUR-WEL-110': '담당 공무원 개인 성명 포함',
  'GUR-WEL-112': '답이 자명(장애인) — 변별력 없음',
  'GUR-SAF-101': 'GUR-SAF-001 과 사실 중복',
  'GUR-SAF-105': 'GUR-SAF-009 와 문장 중복',
  'GUR-SAF-107': '정답이 복수 번호 — 단일 사실 아님',
  'GUR-SAF-114': '담당 공무원 연락처',
  'GUR-TOU-104': 'GUR-EDU-114 와 사실 범위 중복',
  'GUR-TOU-110': '민간 영화관 — 구 소관 아님',
  'GUR-TOU-112': '시점 만료(2025년 11월 예정)',
  'GUR-TOU-113': '밴드 URL — 사실 가치 낮음',
  'GUR-IND-101': 'GUR-IND-001 과 사실 중복',
  'GUR-IND-106': '시점 만료(2026년 10월 예정)',
  'GUR-IND-110': 'GUR-IND-108 과 같은 번호(사실 중복)',
  'GUR-IND-112': 'GUR-IND-005 와 사실 중복',
  'GUR-IND-114': '민간 병원명·연도 한정 — 변동성 큼',
  'GUR-INV-102': '출처 간 기준일 상이(2024-02)',
  'GUR-INV-103': '기본현황(383,829)과 상충하는 다른 인구값 — 원장 불안정',
  'GUR-INV-104': '기준일·출처 불안정(INV-103 과 같은 페이지)',
  'GUR-INV-105': '기준일·출처 불안정(INV-103 과 같은 페이지)',
  'GUR-INV-106': 'GUR-INV-004 와 같은 값(면적 20.14)',
  'GUR-MUL-101': 'GUR-MUL-107 과 같은 번호(사실 중복)',
  'GUR-MUL-103': 'GUR-MUL-009 와 사실 중복',
  // A2
  'GUR-ENV-006': '자명한 답(문밖) — 측정 가치 낮음',
  // A3 · A4 중복
  'GUR-WEL-009': 'GUR-EDU-003 과 사실 중복(청년통장 신청처)',
  'GUR-EDU-001': 'GUR-WEL-004 와 사실 중복(청소년증 연령)',
  'GUR-EDU-005': '타 기관(한국장애인고용공단) 주소 — 구로구 정보 아님',
  'GUR-EDU-006': '자격 요건 문항 — 주민 질문으로 부자연스러움',
  'GUR-EDU-009': '책자 이름·PDF 위치 — 주민 실용 정보 아님',
  // A5
  'GUR-SAF-010': '일반 응급 상식(119) — 구로구 고유 사실 아님',
  // B1
  'GUR-TOU-001': '도서관 문항 — A4 소관·중복',
  'GUR-TOU-002': '도서관 문항 — A4 소관·중복',
  'GUR-TOU-003': 'GUR-EDU-012 와 중복',
  'GUR-TOU-004': 'GUR-EDU-013 과 중복',
  'GUR-TOU-006': '"66필지" 등 관람객 실용 정보 아님',
  'GUR-TOU-016': 'GUR-IND-005 와 사실 중복',
  'GUR-TOU-021': 'GUR-TOU-015 와 사실 중복(수목원 개방시간)',
  // B2
  'GUR-IND-002': '지난 행사 일정 — 시점 만료',
  'GUR-IND-006': '공식 페이지 간 면적 상충(198만㎡ vs 192만㎡) — 원장 불안정',
  'GUR-IND-003': 'GUR-EXP-001 과 중복',
  'GUR-IND-004': 'GUR-EXP-002 와 중복',
  'GUR-IND-009': '개인 구직자 대상 — A4 소관',
  'GUR-IND-010': '개인 구직자 대상 — A4 소관',
  'GUR-IND-011': '개인 구직자 대상 — A4 소관',
  'GUR-IND-012': '개인 구직자 대상 — A4 소관',
  'GUR-IND-014': 'GUR-IND-005 와 사실 중복',
  'GUR-IND-016': 'GUR-IND-005 와 같은 값(명칭만 다름)',
  // B4
  'GUR-INV-005': '같은 누리집 내 다른 페이지의 값(406,664명)이 기본현황(2026.1.1) 값과 충돌 — 기준일 불명',
  'GUR-INV-006': '같은 누리집 내 다른 페이지의 값(20.12㎢)이 기본현황 값과 충돌 — 기준일 불명',
  'GUR-INV-008': '같은 누리집 내 다른 페이지의 값(20.12㎢)이 기본현황 값과 충돌 — 기준일 불명',
  'GUR-INV-007': 'GUR-GOV-004 와 중복',
  // B5
  'GUR-MUL-005': 'GUR-WEL-005 와 중복',
  // C1 — 전부 다른 모듈과 중복·주제 이탈. 수작업으로 재작성
  'GUR-REP-001': 'GUR-GOV-004 와 중복',
  'GUR-REP-002': 'GUR-GOV-004 와 중복',
  'GUR-REP-003': 'GUR-INV-001 과 중복',
  'GUR-REP-004': 'GUR-INV-004 와 중복',
  'GUR-REP-005': '평판·낡은 인식 주제와 무관',
  'GUR-REP-006': '평판·낡은 인식 주제와 무관(복지)',
  'GUR-REP-007': '평판·낡은 인식 주제와 무관(복지)',
  'GUR-REP-008': '평판·낡은 인식 주제와 무관(복지)',
  'GUR-REP-009': '평판·낡은 인식 주제와 무관(복지)',
  'GUR-REP-010': '평판·낡은 인식 주제와 무관(복지)',
};

const qd = path.resolve('docs/aeo-questions/guro');
let n = 0;
for (const f of fs.readdirSync(qd).filter((x) => x.endsWith('.json') && !x.startsWith('_') && x !== 'all.json' && x !== 'a7-project-records.json')) {
  const p = path.join(qd, f);
  const j = JSON.parse(fs.readFileSync(p, 'utf-8'));
  let changed = false;
  for (const q of j.questions) {
    if (RETIRE[q.id] && q.status !== 'retired') {
      q.status = 'retired';
      q.usable = false;
      q.note = `폐기: ${RETIRE[q.id]}`;
      changed = true;
      n++;
    }
  }
  if (changed) fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n', 'utf-8');
}
console.log(`폐기 처리 ${n}건`);
