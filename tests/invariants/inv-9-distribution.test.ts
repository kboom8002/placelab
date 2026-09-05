// tests/invariants/inv-9-distribution.test.ts
import fs from 'fs';
import path from 'path';

export async function testInv9Distribution() {
  const itemMigration = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260905000010_create_item_results.sql'),
    'utf-8'
  );

  // 1. primary key에 rep 컬럼이 포함되어 있는지 확인
  if (!itemMigration.includes('primary key (observation_id, question_id, rep)')) {
    throw new Error('item_results 테이블이 회차(rep)별로 분리 저장되지 않습니다 (INV-9 위반)');
  }

  // 2. 작화 시 critical을 산출하는 floor_risk_of 함수 정의 확인
  if (!itemMigration.includes("when bool_or(confabulated)                     then 'critical'")) {
    throw new Error('floor_risk_of 함수에 작화(confabulated) 시 critical 반환 로직이 누락되었습니다');
  }

  // 3. 작화는 반드시 confabulation 증상군이어야 한다는 일치 제약 확인
  if (!itemMigration.includes('item_results_confabulation_consistent')) {
    throw new Error('작화 증상군 일관성 제약조건이 누락되었습니다');
  }
}
