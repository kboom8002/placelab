// tests/invariants/inv-1-two-populations.test.ts
import fs from 'fs';
import path from 'path';
import { calculateCoverage } from '../../lib/utils/coverage';

export async function testInv1TwoPopulations() {
  // 1. calculateCoverage 함수가 population을 인자로 받지 않으면 오류
  const dummyUnits: any[] = [
    { population: 'local_gov', robots_verdict: 'open' },
    { population: 'special_zone', robots_verdict: 'blocked_all' },
  ];

  const localGovStats = calculateCoverage(dummyUnits, 'local_gov');
  const specialZoneStats = calculateCoverage(dummyUnits, 'special_zone');

  if (localGovStats.total !== 1 || localGovStats.open !== 1) {
    throw new Error('local_gov 집계에 special_zone 데이터가 오염되었습니다');
  }

  if (specialZoneStats.total !== 1 || specialZoneStats.blocked !== 1) {
    throw new Error('special_zone 집계에 local_gov 데이터가 오염되었습니다');
  }

  // 2. DDL 마이그레이션 파일에서 v_layer1_coverage에 UNION 키워드가 없어야 함
  const migrationSql = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260905000014_create_views.sql'),
    'utf-8'
  );

  if (/union\s+all/i.test(migrationSql) || /union\s+select/i.test(migrationSql)) {
    throw new Error('v_layer1_coverage 뷰 정의에 두 모집단을 UNION하는 쿼리가 존재합니다');
  }

  // 3. 코드베이스 내 "전국 249곳" 또는 합산 문자열 금지 확인
  const homepageContent = fs.readFileSync(
    path.join(process.cwd(), 'app/(public)/page.tsx'),
    'utf-8'
  );

  if (homepageContent.includes('249곳')) {
    throw new Error('공개 화면에 두 모집단을 합산한 249곳 문자열이 하드코딩되어 있습니다');
  }
}
