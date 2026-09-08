#!/usr/bin/env npx tsx
// scripts/measure-v2/measure-person-gemini-deep.ts
// 김민석 Gemini+서치 그라운딩 심화 측정 (출처 지배력·프레이밍·경쟁 SoV)
// 사용법: npx tsx scripts/measure-v2/measure-person-gemini-deep.ts --reps 3

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// .env.local 로드
const envPath = path.resolve(__dirname, '../../.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) process.env[key.trim()] = vals.join('=').trim();
  }
}

const args = process.argv.slice(2);
const getArg = (n: string, d: string) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i+1] ? args[i+1] : d; };
const REPS = parseInt(getArg('reps', '3'));
const MODEL = getArg('model', 'gemini-3.5-flash-lite');
const SYSTEM_PROMPT = '당신은 한국 정치·시사 전문 분석가입니다. 사용자의 질문에 구체적 근거와 사례를 들어 3~5문장으로 답하세요. 비교 질문에는 양쪽의 장단점을 균형 있게 제시하고, 출처 URL이 있으면 함께 알려주세요.';

const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!geminiKey) { console.error('❌ GEMINI_API_KEY 없음'); process.exit(1); }
const client = new GoogleGenAI({ apiKey: geminiKey });

interface Result {
  questionId: string; axis: string; category: string; question: string; rep: number;
  response: string; responseHash: string; model: string; latencyMs: number;
  citedUrls: string[]; groundingChunks: any[]; groundingSearchQueries: string[];
  timestamp: string;
}

async function callGemini(q: any, rep: number): Promise<Result> {
  const start = Date.now();
  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: q.body,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 1000,
        tools: [{ googleSearch: {} }],
      },
    });
    const elapsed = Date.now() - start;
    const content = response.text || '(응답 없음)';
    const textUrls = content.match(/https?:\/\/[^\s)]+/g) || [];
    const gm = (response as any).candidates?.[0]?.groundingMetadata || null;
    const chunks = gm?.groundingChunks || [];
    const chunkUrls = chunks.filter((c: any) => c.web?.uri).map((c: any) => c.web.uri);
    const searchQueries = gm?.webSearchQueries || [];
    const allUrls = [...new Set([...textUrls, ...chunkUrls])];
    const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
    console.log(`  ✓ ${q.id} R${rep} [${q.axis}/${q.category}] — ${elapsed}ms [검색 ${chunks.length}건]`);
    return {
      questionId: q.id, axis: q.axis, category: q.category, question: q.body, rep,
      response: content, responseHash: hash, model: MODEL, latencyMs: elapsed,
      citedUrls: allUrls, groundingChunks: chunks, groundingSearchQueries: searchQueries,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    const elapsed = Date.now() - start;
    console.error(`  ✗ ${q.id} R${rep} — ERROR: ${err.message}`);
    return {
      questionId: q.id, axis: q.axis, category: q.category, question: q.body, rep,
      response: `[ERROR] ${err.message}`, responseHash: '', model: MODEL, latencyMs: elapsed,
      citedUrls: [], groundingChunks: [], groundingSearchQueries: [],
      timestamp: new Date().toISOString(),
    };
  }
}

async function main() {
  const qFile = path.resolve(__dirname, '../../docs/person-questions/김민석-deep-sov.json');
  const questions: any[] = JSON.parse(fs.readFileSync(qFile, 'utf-8'));

  console.log('═'.repeat(60));
  console.log('  김민석 당대표 심화 측정 (출처·프레이밍·경쟁 SoV)');
  console.log(`  모델: ${MODEL} + Search Grounding | 문항: ${questions.length} | 반복: ${REPS}`);
  console.log('═'.repeat(60));

  const results: Result[] = [];
  for (let rep = 1; rep <= REPS; rep++) {
    console.log(`\n── 반복 ${rep}/${REPS} ──`);
    for (let i = 0; i < questions.length; i += 3) {
      const batch = questions.slice(i, i + 3);
      console.log(`[${i+1}~${Math.min(i+3, questions.length)} / ${questions.length}]`);
      const br = await Promise.all(batch.map(q => callGemini(q, rep)));
      results.push(...br);
      if (i + 3 < questions.length) await new Promise(r => setTimeout(r, 1200));
    }
    if (rep < REPS) await new Promise(r => setTimeout(r, 2000));
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const outDir = path.resolve(__dirname, '../../docs/person-measurements');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `pm-${dateStr}-김민석-gemini-deep.json`);

  const errors = results.filter(r => r.response.startsWith('[ERROR]'));
  const grounded = results.filter(r => r.groundingChunks.length > 0);
  const totalChunks = results.reduce((a, r) => a + r.groundingChunks.length, 0);

  fs.writeFileSync(outFile, JSON.stringify({
    measurement: {
      id: `pm-${dateStr}-김민석-gemini-deep`,
      subject_name: '김민석', subject_title: '더불어민주당 대표',
      scope: 'deep_source_framing_sov',
      method_version: 'v1.1-person-gemini-deep',
      ai_service: 'gemini', model: MODEL,
      search_grounding: true, reps: REPS,
      total_queries: results.length, error_count: errors.length,
      grounding_stats: {
        grounded_responses: grounded.length,
        total_grounding_sources: totalChunks,
        grounding_rate: (grounded.length / results.length * 100).toFixed(1) + '%',
      },
      axis_counts: {
        A_source: results.filter(r => r.axis === 'A').length,
        B_framing: results.filter(r => r.axis === 'B').length,
        C_sov: results.filter(r => r.axis === 'C').length,
      },
    },
    results,
  }, null, 2), 'utf-8');

  console.log(`\n✓ 심화 측정 완료! ${results.length}건`);
  console.log(`  저장: ${outFile}`);
  console.log(`  에러: ${errors.length}건`);
  console.log(`  🔍 검색 그라운딩: ${grounded.length}/${results.length}건 (${(grounded.length/results.length*100).toFixed(1)}%)`);
  console.log(`  📎 그라운딩 출처: 총 ${totalChunks}건`);
}

main().catch(console.error);
