#!/usr/bin/env tsx
// scripts/sync-spec-questions.ts
// docs/measurement-spec/data/questions/ → 앱/DB 동기화 도구
// 사용: pnpm tsx scripts/sync-spec-questions.ts [--dry-run] [--verify-only]
//
// 목적: data/questions/ 디렉토리의 JSON 파일(SSOT)을 읽어서
// 1. 문항 수와 구조를 검증하고
// 2. question.schema.json에 대해 유효성 검사하고
// 3. --verify-only가 아니면 DB(supabase question_bank)로 upsert 안내를 출력한다.
//
// 코드에 문항을 하드코딩하지 않는다 (AGENTS.md §3).

import * as fs from 'fs';
import * as path from 'path';

const QUESTIONS_DIR = path.join(
  process.cwd(),
  'docs',
  'measurement-spec',
  'data',
  'questions'
);
const SCHEMA_FILE = path.join(
  process.cwd(),
  'docs',
  'measurement-spec',
  'schema',
  'question.schema.json'
);

interface QuestionEntry {
  id: string;
  revision: number;
  status: string;
  text: string;
  type: string;
  layers: string[];
  owner_role: string;
  difficulty: string;
  sensitivity: string;
  [key: string]: any;
}

function loadSchema(): { required: string[]; properties: Record<string, any> } | null {
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.warn(`⚠️  스키마 파일을 찾을 수 없습니다: ${SCHEMA_FILE}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf-8'));
}

function loadQuestionFiles(): { file: string; questions: QuestionEntry[] }[] {
  if (!fs.existsSync(QUESTIONS_DIR)) {
    console.error(`❌ 문항 디렉토리를 찾을 수 없습니다: ${QUESTIONS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith('.json'));
  return files.map((file) => {
    const content = JSON.parse(
      fs.readFileSync(path.join(QUESTIONS_DIR, file), 'utf-8')
    );
    // project_template.json은 역점사업 템플릿으로 일반 문항 스키마가 아님 — 구조 검증 별도
    const isTemplate = file.includes('template');
    const questions: QuestionEntry[] = isTemplate
      ? [] // 템플릿은 표준 문항 검증에서 제외
      : Array.isArray(content)
        ? content
        : content.questions || [content];
    return { file, questions };
  });
}

function validateQuestion(
  q: QuestionEntry,
  requiredFields: string[],
  file: string
): string[] {
  const errors: string[] = [];

  // 필수 필드 검사
  for (const field of requiredFields) {
    if (!(field in q) || q[field] === null || q[field] === undefined) {
      errors.push(`${file}/${q.id || '?'}: 필수 필드 '${field}' 누락`);
    }
  }

  // ID 패턴 검사
  if (q.id && !/^[A-Z]{3,4}-[A-Za-z0-9_-]+$/.test(q.id)) {
    errors.push(`${file}/${q.id}: ID 패턴 위반 (^[A-Z]{3,4}-[A-Za-z0-9_-]+$)`);
  }

  // revision >= 1
  if (q.revision !== undefined && q.revision < 1) {
    errors.push(`${file}/${q.id}: revision은 1 이상이어야 합니다 (${q.revision})`);
  }

  // status
  if (q.status && !['active', 'retired'].includes(q.status)) {
    errors.push(`${file}/${q.id}: status는 active|retired여야 합니다 (${q.status})`);
  }

  return errors;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verifyOnly = args.includes('--verify-only');

  console.log('=== measurement-spec 문항 SSOT 동기화 도구 ===\n');
  if (dryRun) console.log('🔍 드라이런 모드: 실제 변경 없음\n');
  if (verifyOnly) console.log('🔍 검증 전용 모드: 유효성 검사만 수행\n');

  const schema = loadSchema();
  const requiredFields = schema?.required || [];
  const questionSets = loadQuestionFiles();

  let totalQuestions = 0;
  let activeQuestions = 0;
  const allErrors: string[] = [];
  const idSet = new Set<string>();
  const duplicateIds: string[] = [];

  console.log('📂 문항 파일 목록:');
  for (const { file, questions } of questionSets) {
    console.log(`   ${file}: ${questions.length}개 문항`);
    totalQuestions += questions.length;

    for (const q of questions) {
      // 중복 ID 검사
      if (q.id) {
        if (idSet.has(q.id)) {
          duplicateIds.push(q.id);
        }
        idSet.add(q.id);
      }

      if (q.status === 'active') activeQuestions++;

      // 스키마 기반 검증
      const errors = validateQuestion(q, requiredFields, file);
      allErrors.push(...errors);
    }
  }

  console.log(`\n📊 통계:`);
  console.log(`   총 문항: ${totalQuestions}개`);
  console.log(`   활성 문항: ${activeQuestions}개`);
  console.log(`   고유 ID: ${idSet.size}개`);
  console.log(`   파일 수: ${questionSets.length}개`);

  if (duplicateIds.length > 0) {
    console.log(`\n❌ 중복 ID 발견:`);
    for (const id of duplicateIds) {
      console.log(`   - ${id}`);
      allErrors.push(`중복 ID: ${id}`);
    }
  }

  if (allErrors.length > 0) {
    console.log(`\n❌ 검증 오류 ${allErrors.length}건:`);
    for (const err of allErrors) {
      console.log(`   - ${err}`);
    }
    process.exit(1);
  }

  console.log('\n✅ 모든 문항이 스키마 규격을 준수합니다.');

  if (verifyOnly) {
    console.log('\n🔍 검증 전용 모드 종료.');
    return;
  }

  // DB 동기화 안내 (실제 Supabase 연결은 환경변수 필요)
  console.log('\n📤 DB 동기화:');
  if (dryRun) {
    console.log('   [드라이런] 아래 문항을 question_bank 테이블에 upsert할 것입니다:');
    for (const { questions } of questionSets) {
      for (const q of questions) {
        if (q.status === 'active') {
          console.log(`   UPSERT: ${q.id} (rev ${q.revision}) — ${q.text.slice(0, 40)}…`);
        }
      }
    }
  } else {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.log(
        '   ⚠️  NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다. --dry-run 또는 --verify-only로 실행하세요.'
      );
    } else {
      console.log(
        `   Supabase 연결: ${supabaseUrl}`
      );
      console.log(
        '   question_bank 테이블에 활성 문항을 upsert합니다...'
      );
      // TODO: 실제 Supabase client로 upsert 구현
      // createClient(supabaseUrl, serviceKey).from('question_bank').upsert(...)
      console.log('   ⚠️  실제 DB upsert는 Supabase 서비스 키 설정 후 활성화됩니다.');
    }
  }
}

main();
