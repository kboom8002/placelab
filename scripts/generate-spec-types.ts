#!/usr/bin/env tsx
// scripts/generate-spec-types.ts
// docs/measurement-spec JSON Schema → TypeScript 타입 검증 도구
// 사용: pnpm tsx scripts/generate-spec-types.ts
//
// 목적: schema/*.json 파일을 읽어 lib/types/measurement-spec.ts의
// 수작업 타입 정의가 스키마와 동기화되어 있는지 검증한다.
// 스키마에 정의된 required 필드가 TypeScript 타입 파일에 존재하는지 대조.

import * as fs from 'fs';
import * as path from 'path';

const SCHEMA_DIR = path.join(process.cwd(), 'docs', 'measurement-spec', 'schema');
const TYPES_FILE = path.join(process.cwd(), 'lib', 'types', 'measurement-spec.ts');

interface SchemaFile {
  $id: string;
  title: string;
  required?: string[];
  properties?: Record<string, any>;
}

// 스키마 ID → TypeScript 인터페이스명 매핑
const SCHEMA_TO_TS: Record<string, string> = {
  'question.schema.json': 'Question',
  'response_record.schema.json': 'ResponseRecord',
  'observation.schema.json': 'Observation',
  'verdict.schema.json': 'Verdict',
  'grid.schema.json': 'Grid',
  'project_record.schema.json': 'ProjectRecord',
  'output.schema.json': 'Output',
};

function main() {
  console.log('=== measurement-spec JSON Schema ↔ TypeScript 타입 동기화 검증 ===\n');

  if (!fs.existsSync(SCHEMA_DIR)) {
    console.error(`❌ 스키마 디렉토리를 찾을 수 없습니다: ${SCHEMA_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(TYPES_FILE)) {
    console.error(`❌ TypeScript 타입 파일을 찾을 수 없습니다: ${TYPES_FILE}`);
    process.exit(1);
  }

  const tsContent = fs.readFileSync(TYPES_FILE, 'utf-8');
  const schemaFiles = fs.readdirSync(SCHEMA_DIR).filter((f) => f.endsWith('.schema.json'));

  let totalChecks = 0;
  let passCount = 0;
  let failCount = 0;
  const failures: string[] = [];

  for (const file of schemaFiles) {
    const schema: SchemaFile = JSON.parse(
      fs.readFileSync(path.join(SCHEMA_DIR, file), 'utf-8')
    );

    const tsName = SCHEMA_TO_TS[file];
    if (!tsName) {
      console.log(`⏭️  ${file} → 매핑 없음 (스킵)`);
      continue;
    }

    console.log(`📋 ${file} → ${tsName}`);

    // 1. 인터페이스 존재 확인
    totalChecks++;
    const interfacePattern = new RegExp(
      `export\\s+interface\\s+${tsName}\\s*\\{`,
      'm'
    );
    if (!interfacePattern.test(tsContent)) {
      failures.push(`${tsName}: 인터페이스가 TypeScript 파일에 없습니다`);
      failCount++;
      continue;
    }
    passCount++;

    // 2. required 필드 존재 확인
    if (schema.required) {
      for (const field of schema.required) {
        totalChecks++;
        // snake_case → 검색 (TypeScript에서 snake_case 또는 camelCase 사용 가능)
        const camelCase = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        if (tsContent.includes(field) || tsContent.includes(camelCase)) {
          passCount++;
        } else {
          failures.push(`${tsName}.${field}: required 필드가 TypeScript 타입에 없습니다`);
          failCount++;
        }
      }
    }

    // 3. 금지 필드 비존재 확인 (총점, 순위, 등급 등)
    const FORBIDDEN = [
      'total_score', 'ranking', 'rank', 'grade', 'weight',
      'empty_count', 'blank_count', 'forecast', 'prediction',
    ];
    for (const forbidden of FORBIDDEN) {
      totalChecks++;
      if (schema.properties && forbidden in schema.properties) {
        failures.push(`${file}: 스키마에 금지 필드 '${forbidden}'이 포함되어 있습니다`);
        failCount++;
      } else {
        passCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`결과: 검사 ${totalChecks}건 / 통과 ${passCount}건 / 실패 ${failCount}건`);

  if (failures.length > 0) {
    console.log('\n❌ 실패 항목:');
    for (const f of failures) {
      console.log(`   - ${f}`);
    }
    process.exit(1);
  } else {
    console.log('✅ JSON Schema와 TypeScript 타입이 완전히 동기화되어 있습니다.');
  }
}

main();
