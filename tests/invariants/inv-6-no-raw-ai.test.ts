// tests/invariants/inv-6-no-raw-ai.test.ts
import fs from 'fs';
import path from 'path';

export async function testInv6NoRawAi() {
  // 1. observations 및 item_results 마이그레이션 확인
  const obsMigration = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260905000009_create_observations.sql'),
    'utf-8'
  );

  const itemMigration = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260905000010_create_item_results.sql'),
    'utf-8'
  );

  // raw_response, full_text, response_body 등의 컬럼이 없어야 함
  const forbiddenColumns = ['raw_response', 'full_response', 'response_text', 'generated_text'];
  for (const col of forbiddenColumns) {
    if (obsMigration.includes(col) || itemMigration.includes(col)) {
      throw new Error(`AI 응답 원문 저장을 위한 컬럼 '${col}'이 존재합니다 (INV-6 위반)`);
    }
  }

  // 2. tech_scans에도 raw_summary나 raw_text 대신 raw_hash만 보존하는지
  const techMigration = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260905000005_create_tech_scans.sql'),
    'utf-8'
  );

  if (!/raw_hash\s+text\s+not null/i.test(techMigration)) {
    throw new Error('tech_scans에 raw_hash가 필수로 지정되지 않았습니다');
  }
}
