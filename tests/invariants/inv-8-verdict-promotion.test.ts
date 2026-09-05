// tests/invariants/inv-8-verdict-promotion.test.ts
import fs from 'fs';
import path from 'path';

export async function testInv8VerdictPromotion() {
  const verdictMigration = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260905000006_create_verdicts.sql'),
    'utf-8'
  );

  // 1. consecutive_weeks >= 2 제약조건 존재 확인
  if (!verdictMigration.includes('consecutive_weeks >= 2')) {
    throw new Error('verdicts 테이블에 2주 연속 확인(consecutive_weeks >= 2) 제약이 누락되었습니다 (INV-8 위반)');
  }

  // 2. verdicts 테이블이 tech_scans와 분리된 물리 테이블인지 확인
  if (!verdictMigration.includes('create table verdicts')) {
    throw new Error('verdicts 물리 테이블이 존재하지 않습니다');
  }

  // 3. verdict-promote Edge Function에서 scans.length < 2 이면 continue 하는지 확인
  const promoteFn = fs.readFileSync(
    path.join(process.cwd(), 'supabase/functions/verdict-promote/index.ts'),
    'utf-8'
  );

  if (!promoteFn.includes('scans.length < 2')) {
    throw new Error('verdict-promote 함수에 2회 미만 스캔 배제 로직이 없습니다');
  }
}
