// tests/invariants/inv-10-robustness-gate.test.ts
import fs from 'fs';
import path from 'path';

export async function testInv10RobustnessGate() {
  const robustnessMigration = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260905000011_create_robustness.sql'),
    'utf-8'
  );

  // 1. sensitive 자동 계산 컬럼 존재 확인
  if (!robustnessMigration.includes('sensitive      boolean generated always as (divergence > threshold) stored')) {
    throw new Error('question_robustness 테이블에 sensitive 자동 계산 컬럼이 누락되었습니다 (INV-10 위반)');
  }

  // 2. question_bank 8블록 컬럼 정의 확인
  const qBankMigration = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260905000008_create_question_bank.sql'),
    'utf-8'
  );

  const blocks = [
    'block_actor',
    'block_situation',
    'block_task',
    'block_knowledge',
    'block_workflow',
    'block_format',
    'block_language',
    'block_output',
  ];

  for (const block of blocks) {
    if (!qBankMigration.includes(block)) {
      throw new Error(`question_bank 테이블에 8블록 컬럼 '${block}'이 누락되었습니다 (INV-10 위반)`);
    }
  }
}
