// tests/invariants/inv-11-preregistration.test.ts
import fs from 'fs';
import path from 'path';

export async function testInv11Preregistration() {
  const preregMigration = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260905000013_create_notifications_citations_prereg.sql'),
    'utf-8'
  );

  // 1. 사전 등록 시각이 측정 시작 시각보다 앞서야 하는 제약조건 확인
  if (!preregMigration.includes('published_at <= started_at')) {
    throw new Error('preregistrations 테이블에 측정 시작 전 공개 강제(published_at <= started_at) 제약이 누락되었습니다 (INV-11 위반)');
  }

  // 2. observations에 prereg_id 컬럼 추가 확인
  if (!preregMigration.includes('alter table observations    add column prereg_id text references preregistrations(id)')) {
    throw new Error('observations 테이블에 prereg_id 외래키 연결이 누락되었습니다');
  }
}
