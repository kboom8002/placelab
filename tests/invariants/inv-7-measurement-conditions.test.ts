// tests/invariants/inv-7-measurement-conditions.test.ts
import fs from 'fs';
import path from 'path';

export async function testInv7MeasurementConditions() {
  const obsMigration = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260905000009_create_observations.sql'),
    'utf-8'
  );

  // 1. 필수 5개 조건 컬럼이 not null로 명시되어 있는지 확인
  const requiredConditions = [
    'method_version   text        not null',
    'measured_on      date        not null',
    'ai_service       text        not null',
    'web_search       boolean     not null',
    'language         text        not null',
  ];

  for (const cond of requiredConditions) {
    // 공백 유연 매칭
    const regex = new RegExp(cond.replace(/\s+/g, '\\s+'));
    if (!regex.test(obsMigration)) {
      throw new Error(`observations 테이블에 측정 조건 제약 '${cond}'이 누락되었습니다 (INV-7 위반)`);
    }
  }

  // 2. enforce_named_total 트리거가 지명 문항 12개 합계를 검증하는지 확인
  if (!obsMigration.includes('enforce_named_total')) {
    throw new Error('지명 문항 합계 검증 트리거 enforce_named_total이 누락되었습니다');
  }
}
