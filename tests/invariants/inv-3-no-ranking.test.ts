// tests/invariants/inv-3-no-ranking.test.ts
import fs from 'fs';
import path from 'path';
import { validateSortField, UNIT_SORT_ALLOWLIST } from '../../lib/validators/sort-allowlist';
import { FORBIDDEN_WORDS } from '../../lib/constants/measurement';

export async function testInv3NoRanking() {
  // 1. 점수/측정값 계열 정렬 요청 시 허용 목록에 의해 거부되어 기본값(sgg_code)으로 반환되는지
  const forbiddenAttempts = ['score', 'accuracy', 'rank', 'floor_risk', 'best', 'worst'];
  for (const field of forbiddenAttempts) {
    const result = validateSortField(field);
    if (result !== 'sgg_code') {
      throw new Error(`허용되지 않은 정렬 파라미터 '${field}'가 통과되었습니다 (INV-3 위반)`);
    }
  }

  // 2. 허용 필드는 정상 승인되는지
  if (validateSortField('name') !== 'name') {
    throw new Error('허용 필드 name이 거부되었습니다');
  }

  // 3. FORBIDDEN_WORDS에 핵심 금지어가 포함되어 있는지
  const essentialForbidden = ['순위', '랭킹', '등급', '1위', '최하위', '베스트', '워스트'];
  for (const word of essentialForbidden) {
    if (!FORBIDDEN_WORDS.includes(word as any)) {
      throw new Error(`금지어 목록에 '${word}'가 누락되었습니다`);
    }
  }

  // 4. UnitList.tsx에 순위/1위 문자열이 하드코딩되지 않았는지 확인
  const unitListContent = fs.readFileSync(
    path.join(process.cwd(), 'components/ui/UnitList.tsx'),
    'utf-8'
  );

  if (unitListContent.includes('1위') || unitListContent.includes('최하위')) {
    throw new Error('UnitList 컴포넌트에 순위 관련 표현이 포함되어 있습니다');
  }
}
