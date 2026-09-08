#!/usr/bin/env npx tsx
// scripts/measure-v2/measure-jeju-en-deep.ts
// 제주도 영문 심화(고급 관광·외국인 투자유치·출처 추적) AEO 실측 스크립트
// 사용법: npx tsx scripts/measure-v2/measure-jeju-en-deep.ts --reps 3

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// .env.local 로드
const envPath = path.resolve(__dirname, '../../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) process.env[key.trim()] = vals.join('=').trim();
  }
}

const args = process.argv.slice(2);
function getArg(name: string, def: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
}

const REPS = parseInt(getArg('reps', '3'));
const MODEL = 'gpt-5.6-luna';

// 고급 관광 및 글로벌 비즈니스 전문 시스템 프롬프트
const SYSTEM_PROMPT = 'You are a senior advisor on Jeju Special Self-Governing Province specializing in luxury tourism, foreign direct investment (FDI), regional economic development, and international affairs. Provide precise, executive-level insights in 3-5 sentences with concrete facts, regulatory specifics, and exact official web portal URLs.';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Question {
  id: string;
  tier?: string;
  category?: string;
  body: string;
  targetKeywords?: string[];
}

interface Result {
  questionId: string;
  tier: string;
  category: string;
  question: string;
  rep: number;
  response: string;
  responseHash: string;
  model: string;
  latencyMs: number;
  citedUrls: string[];
  timestamp: string;
}

async function callAI(q: Question, rep: number): Promise<Result> {
  const start = Date.now();
  const cat = q.category || 'general';
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
    const content = completion.choices[0]?.message?.content || '(no response)';
    const urls = content.match(/https?:\/\/[^\s)]+/g) || [];
    const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
    console.log(`  ✓ ${q.id} R${rep} (${cat}) — ${elapsed}ms`);
    return {
      questionId: q.id,
      tier,
      category: cat,
      question: q.body,
      rep,
      response: content,
      responseHash: hash,
      model: completion.model || MODEL,
      latencyMs: elapsed,
      citedUrls: urls,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    const elapsed = Date.now() - start;
    console.error(`  ✗ ${q.id} R${rep} — ERROR: ${err.message}`);
    return {
      questionId: q.id,
      tier,
      category: cat,
      question: q.body,
      rep,
      response: `[ERROR] ${err.message}`,
      responseHash: '',
      model: MODEL,
      latencyMs: elapsed,
      citedUrls: [],
      timestamp: new Date().toISOString(),
    };
  }
}

async function main() {
  const qFile = path.resolve(__dirname, '../../docs/aeo-questions/jeju-global-en-deep.json');
  const questions: Question[] = JSON.parse(fs.readFileSync(qFile, 'utf-8'));

  console.log('═'.repeat(60));
  console.log(`  Jeju Deep Global Visibility Measurement (Luxury & Investment)`);
  console.log(`  Model: ${MODEL} · Reps: ${REPS} · Questions: ${questions.length}`);
  console.log('═'.repeat(60));

  const results: Result[] = [];
  for (let rep = 1; rep <= REPS; rep++) {
    console.log(`\n── Repetition ${rep}/${REPS} ──`);
    for (let i = 0; i < questions.length; i += 5) {
      const batch = questions.slice(i, i + 5);
      console.log(`[Batch ${i + 1}~${Math.min(i + 5, questions.length)} / ${questions.length}]`);
      const batchResults = await Promise.all(batch.map(q => callAI(q, rep)));
      results.push(...batchResults);
      if (i + 5 < questions.length) await new Promise(r => setTimeout(r, 800));
    }
    if (rep < REPS) await new Promise(r => setTimeout(r, 1500));
  }

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const outDir = path.resolve(__dirname, '../../docs/aeo-measurements');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `m-${today}-jeju-en-deep.json`);

  const success = results.filter(r => !r.response.startsWith('[ERROR]') && r.response !== '(no response)').length;
  const absent = results.filter(r => r.response === '(no response)').length;
  const error = results.filter(r => r.response.startsWith('[ERROR]')).length;

  fs.writeFileSync(outFile, JSON.stringify({
    unit: 'Jeju Special Self-Governing Province',
    unit_id: 'lg-50000',
    scope: 'deep_global_luxury_and_fdi',
    language: 'en',
    model: MODEL,
    method_version: 'v2.2-jeju-en-deep',
    reps: REPS,
    measuredAt: new Date().toISOString(),
    totalQueries: results.length,
    summary: { success, absent, error },
    results,
  }, null, 2), 'utf-8');

  console.log(`\n✓ Deep measurement completed! ${results.length} queries`);
  console.log(`  Saved: ${outFile}`);
  console.log(`  Success: ${success} | Absent: ${absent} | Error: ${error}`);
}

main().catch(console.error);
