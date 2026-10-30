// 일회성: 파일럿에서 드러난 '기준일 불명시' 문항(INV-001~003)을 폐기하고, 기준일을 문장에 명시한 새 문항(INV-201~203)으로 대체한다.
// 사실·근거는 기존 원장 항목 그대로(구로구청 '기본현황', 기준일 2026.1.1). 그리고 IND-001 의 동의어 변형('무료')을 원장에 추가한다.
import fs from 'fs';
const QD = 'docs/aeo-questions/guro';
const GD = 'docs/ground-truth/guro';
const rd = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8').replace(/^\uFEFF/, ''));
const wr = (p: string, o: any) => fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n', 'utf-8');

const src = rd(`${QD}/b4-invest.json`);
const srcG = rd(`${GD}/b4-invest.json`);
const ext = rd(`${QD}/b4-invest-ext.json`);
const extG = rd(`${GD}/b4-invest-ext.json`);

const map: Record<string, { id: string; text: string }> = {
  'GUR-INV-001': { id: 'GUR-INV-201', text: '2026년 1월 1일 기준 구로구의 총 인구(등록 외국인 포함)는 몇 명인가요?' },
  'GUR-INV-002': { id: 'GUR-INV-202', text: '2026년 1월 1일 기준 구로구의 주민등록인구는 몇 명인가요?' },
  'GUR-INV-003': { id: 'GUR-INV-203', text: '2026년 1월 1일 기준 구로구에 등록된 외국인은 몇 명인가요?' },
};
for (const [oldId, n] of Object.entries(map)) {
  const q = src.questions.find((x: any) => x.id === oldId);
  const g = srcG.entries[oldId];
  if (!q || !g) throw new Error(`없음 ${oldId}`);
  if (ext.questions.some((x: any) => x.id === n.id)) continue;
  ext.questions.push({
    ...q,
    id: n.id,
    text: n.text,
    status: 'active',
    boundary: q.boundary + ' (기준일 2026-01-01 명시: 월별 갱신 통계와 기준일 차이로 인한 오판 방지)',
    note: `${oldId} 대체. 기준일을 문장에 명시`,
  });
  extG.entries[n.id] = { ...g };
}
wr(`${QD}/b4-invest-ext.json`, ext);
wr(`${GD}/b4-invest-ext.json`, extG);

// IND-001 동의어 변형
const ind = rd(`${GD}/b2-industry.json`);
const e = ind.entries['GUR-IND-001'];
if (!e.acceptableVariants.includes('무료')) e.acceptableVariants.push('무료');
wr(`${GD}/b2-industry.json`, ind);

// SAF-008 시각 표기 변형
const saf = rd(`${GD}/a5-safety.json`);
const s = saf.entries['GUR-SAF-008'];
for (const v of ['오후 10시부터 다음 날 오전 1시', '밤 10시부터 다음 날 새벽 1시', '22시~01시', '22시부터 01시']) {
  if (!s.acceptableVariants.includes(v)) s.acceptableVariants.push(v);
}
wr(`${GD}/a5-safety.json`, saf);
console.log('완료');
