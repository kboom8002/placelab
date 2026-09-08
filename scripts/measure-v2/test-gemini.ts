#!/usr/bin/env npx tsx
// scripts/measure-v2/test-gemini.ts
// Google Gemini API 연결 및 모델 지원 여부 확인 테스트 스크립트
// 사용법: npx tsx scripts/measure-v2/test-gemini.ts [--model <model-name>]

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

// .env.local 로드
const envPath = path.resolve(__dirname, '../../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
}

const args = process.argv.slice(2);
const modelArgIdx = args.indexOf('--model');
const TARGET_MODEL = modelArgIdx >= 0 && args[modelArgIdx + 1] ? args[modelArgIdx + 1] : 'gemini-3.5-flash-lite';

const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

console.log('═══════════════════════════════════════════════════════');
console.log('  Google Gemini API 연결 테스트');
console.log(`  확인 대상 모델: ${TARGET_MODEL}`);
console.log('═══════════════════════════════════════════════════════');

if (!geminiKey) {
  console.log('\n❌ GEMINI_API_KEY (또는 GOOGLE_API_KEY)가 설정되어 있지 않습니다.');
  console.log('  .env.local 파일에 키를 추가해주세요:');
  console.log('  GEMINI_API_KEY=AIzaSy...\n');
  process.exit(1);
}

console.log('✓ GEMINI_API_KEY 확인 완료 (길이: ' + geminiKey.length + '자)');

const client = new OpenAI({
  apiKey: geminiKey,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

async function testModel(modelName: string) {
  console.log(`\n▶ [테스트] 모델 "${modelName}" 호출 시도...`);
  const start = Date.now();
  try {
    const res = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: '당신은 정치·시사 전문 AI 어시스턴트입니다.' },
        { role: 'user', content: '더불어민주당 김민석 대표의 현재 직책과 주요 경력을 2문장으로 요약해줘.' },
      ],
      max_completion_tokens: 300,
    });
    const elapsed = Date.now() - start;
    const answer = res.choices[0]?.message?.content || '(응답 없음)';
    console.log(`  ✅ 호출 성공! (${elapsed}ms)`);
    console.log(`  [응답 샘플]:\n  ${answer.trim()}`);
    return true;
  } catch (err: any) {
    const elapsed = Date.now() - start;
    console.log(`  ❌ 호출 실패 (${elapsed}ms): ${err.message}`);
    return false;
  }
}

async function main() {
  const ok = await testModel(TARGET_MODEL);
  if (!ok) {
    console.log('\n💡 지정된 모델이 아직 프리뷰이거나 명칭이 다를 수 있습니다. 대체 모델 후보 테스트:');
    const candidates = ['gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];
    for (const cand of candidates) {
      if (cand !== TARGET_MODEL) {
        const res = await testModel(cand);
        if (res) {
          console.log(`\n  👉 "${cand}" 모델을 대신 사용할 수 있습니다.`);
          break;
        }
      }
    }
  }
}

main().catch(console.error);
