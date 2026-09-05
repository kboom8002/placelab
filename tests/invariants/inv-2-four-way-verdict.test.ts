// tests/invariants/inv-2-four-way-verdict.test.ts
import fs from 'fs';
import path from 'path';
import { parseRobotsTxt } from '../../supabase/functions/_shared/robots-parser';

export async function testInv2FourWayVerdict() {
  // 1. 서버 장애나 HTML 응답 시 undetermined_reason이 반드시 동반되는지 확인
  const timeoutResult = parseRobotsTxt('', 504);
  if (timeoutResult.verdict !== 'undetermined' || !timeoutResult.reason) {
    throw new Error('504 타임아웃에 대해 undetermined_reason이 누락되었습니다');
  }

  const malformedResult = parseRobotsTxt('<!DOCTYPE html><html><body>Error</body></html>', 200);
  if (malformedResult.verdict !== 'undetermined' || malformedResult.reason !== 'malformed') {
    throw new Error('HTML 반환에 대해 malformed 사유가 판정되지 않았습니다');
  }

  // 2. DDL에 tech_scans_undetermined_needs_reason CHECK 제약이 존재하는지 확인
  const migration5 = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260905000005_create_tech_scans.sql'),
    'utf-8'
  );

  if (!migration5.includes('tech_scans_undetermined_needs_reason')) {
    throw new Error('tech_scans 테이블에 undetermined_needs_reason 제약조건이 없습니다');
  }

  // 3. FourWayVerdictSummary에 4가지 항목(개방, 차단, 파일 없음, 판정 불가)이 모두 표시되는지 확인
  const summaryComponent = fs.readFileSync(
    path.join(process.cwd(), 'components/ui/FourWayVerdictSummary.tsx'),
    'utf-8'
  );

  for (const keyword of ['개방', '차단', '파일 없음', '판정 불가']) {
    if (!summaryComponent.includes(keyword)) {
      throw new Error(`FourWayVerdictSummary 컴포넌트에 '${keyword}' 항목이 누락되었습니다`);
    }
  }
}
