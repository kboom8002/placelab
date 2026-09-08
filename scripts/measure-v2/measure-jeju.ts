#!/usr/bin/env npx tsx
// scripts/measure-v2/measure-jeju.ts
// 제주특별자치도 5대 축 AEO 진단 CLI 측정 스크립트
// 사용법: npx tsx scripts/measure-v2/measure-jeju.ts --reps 3

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ─── .env.local 로드 ───
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

// ─── CLI 인자 파싱 ───
const args = process.argv.slice(2);
function getArg(name: string, defaultVal: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

const REPS = parseInt(getArg('reps', '3'));
const MODEL = 'gpt-5.6-luna';

// 제주 전용 시스템 프롬프트 — 관광객 + 도민 복합
const SYSTEM_PROMPT = '당신은 제주특별자치도 민원·관광 안내 전문 AI입니다. 제주도민의 생활민원, 관광객의 여행 문의, 미래 산업·정책 관련 질문에 정확하게, 최신 정보를 기반으로 답해주세요. 답변은 3~5문장으로 핵심 정보를 간결하게 제공하세요. 출처가 있으면 URL도 함께 알려주세요.';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── 5대 축 질문 파일 정의 ───
const AXIS_FILES = [
  { axis: 'A1', label: '기본행정·복지', file: 'jeju-axis1-admin.json' },
  { axis: 'A2', label: '관광·체류·문화', file: 'jeju-axis2-tourism.json' },
  { axis: 'A3', label: '신산업·에너지', file: 'jeju-axis3-industry.json' },
  { axis: 'A4', label: '정주·이주·인프라', file: 'jeju-axis4-residence.json' },
  { axis: 'A5', label: '위기·평판방어', file: 'jeju-axis5-reputation.json' },
];

// ─── 질문 로드 ───
interface Question {
  id: string;
  tier?: string;
  category?: string;
  riskCategory?: string;
  body: string;
  targetKeywords?: string[];
  unit_scope?: string;
  persona?: string;
}

function loadAxisQuestions(filename: string): Question[] {
  const filePath = path.resolve(__dirname, `../../docs/aeo-questions/${filename}`);
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️ ${filename} 파일 없음 — 건너뜀`);
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return Array.isArray(raw) ? raw : (raw.questions || []);
}

// ─── 단일 호출 ───
interface Result {
  axis: string;
  tier: string;
  questionId: string;
  category: string;
  question: string;
  rep: number;
  response: string;
  responseHash: string;
  model: string;
  latencyMs: number;
  citedUrls: string[];
  unit_scope: string;
  persona: string;
  timestamp: string;
}

async function callAI(axis: string, q: Question, rep: number): Promise<Result> {
  const start = Date.now();
  const cat = q.category || q.riskCategory || 'unknown';
  const tier = q.tier || 'T2';
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: q.body },
      ],
      max_completion_tokens: 800,
    });
    const elapsed = Date.now() - start;
    const content = completion.choices[0]?.message?.content || '(응답 없음)';
    const urls = content.match(/https?:\/\/[^\s)]+/g) || [];
    const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);

    console.log(`  ✓ ${axis} ${q.id} R${rep} (${cat}) — ${elapsed}ms`);
    return {
      axis, tier, questionId: q.id, category: cat, question: q.body, rep,
      response: content, responseHash: hash,
      model: completion.model || MODEL,
      latencyMs: elapsed, citedUrls: urls,
      unit_scope: q.unit_scope || 'province_wide',
      persona: q.persona || 'general',
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    const elapsed = Date.now() - start;
    console.error(`  ✗ ${axis} ${q.id} R${rep} — ERROR: ${err.message}`);
    return {
      axis, tier, questionId: q.id, category: cat, question: q.body, rep,
      response: `[ERROR] ${err.message}`, responseHash: '',
      model: MODEL, latencyMs: elapsed, citedUrls: [],
      unit_scope: q.unit_scope || 'province_wide',
      persona: q.persona || 'general',
      timestamp: new Date().toISOString(),
    };
  }
}

// ─── 배치 실행 ───
async function runAxisBatch(axis: string, questions: Question[], reps: number): Promise<Result[]> {
  const results: Result[] = [];
  for (let rep = 1; rep <= reps; rep++) {
    console.log(`\n── ${axis} 반복 ${rep}/${reps} ──`);
    for (let i = 0; i < questions.length; i += 5) {
      const batch = questions.slice(i, i + 5);
      console.log(`[${i + 1}~${Math.min(i + 5, questions.length)} / ${questions.length}]`);
      const batchResults = await Promise.all(
        batch.map(q => callAI(axis, q, rep))
      );
      results.push(...batchResults);
      if (i + 5 < questions.length) {
        await new Promise(r => setTimeout(r, 800));
      }
    }
    if (rep < reps) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  return results;
}

// ─── 메인 ───
async function main() {
  console.log('═'.repeat(60));
  console.log(`  제주특별자치도 5대 축 AEO 진단 측정`);
  console.log(`  모델: ${MODEL} · 반복: ${REPS}회`);
  console.log('═'.repeat(60));

  const allResults: Result[] = [];

  for (const { axis, label, file } of AXIS_FILES) {
    console.log(`\n▶ ${axis} ${label}: ${file}`);
    const questions = loadAxisQuestions(file);
    if (questions.length === 0) continue;
    console.log(`  ✓ ${questions.length}개 질문 로드됨`);
    const results = await runAxisBatch(axis, questions, REPS);
    allResults.push(...results);
  }

  // ─── 저장 ───
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const outDir = path.resolve(__dirname, '../../docs/aeo-measurements');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `m-${today}-jeju.json`);

  const successCount = allResults.filter(r => !r.response.startsWith('[ERROR]') && r.response !== '(응답 없음)').length;
  const absentCount = allResults.filter(r => r.response === '(응답 없음)').length;
  const errorCount = allResults.filter(r => r.response.startsWith('[ERROR]')).length;

  const output = {
    unit: '제주특별자치도',
    unit_id: 'lg-50000',
    model: MODEL,
    method_version: 'v2.2-jeju',
    reps: REPS,
    measuredAt: new Date().toISOString(),
    totalQueries: allResults.length,
    summary: { success: successCount, absent: absentCount, error: errorCount },
    axisSummary: AXIS_FILES.map(({ axis, label }) => {
      const axisResults = allResults.filter(r => r.axis === axis);
      return {
        axis, label,
        total: axisResults.length,
        success: axisResults.filter(r => !r.response.startsWith('[ERROR]') && r.response !== '(응답 없음)').length,
        absent: axisResults.filter(r => r.response === '(응답 없음)').length,
        error: axisResults.filter(r => r.response.startsWith('[ERROR]')).length,
      };
    }),
    results: allResults,
  };

  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n✓ 측정 완료! ${allResults.length}건`);
  console.log(`  저장: ${outFile}`);
  console.log(`  성공: ${successCount}건`);
  console.log(`  응답없음: ${absentCount}건`);
  console.log(`  에러: ${errorCount}건`);
}

main().catch(console.error);
