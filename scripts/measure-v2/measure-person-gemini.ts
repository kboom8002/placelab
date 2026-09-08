#!/usr/bin/env npx tsx
// scripts/measure-v2/measure-person-gemini.ts
// 김민석 당대표 Google Gemini + Search Grounding 측정 CLI
// 사용법: npx tsx scripts/measure-v2/measure-person-gemini.ts --name "김민석" --title "더불어민주당 대표" --model gemini-3.5-flash-lite --reps 3

import { GoogleGenAI } from '@google/genai';
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

// ─── CLI 인자 ───
const args = process.argv.slice(2);
function getArg(name: string, def: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
}

const NAME = getArg('name', '김민석');
const TITLE = getArg('title', '더불어민주당 대표');
const REPS = parseInt(getArg('reps', '3'));
const MODEL = getArg('model', 'gemini-3.5-flash-lite');
const SYSTEM_PROMPT = `당신은 한국 정치·시사 전문 지식을 가진 AI 어시스턴트입니다. 사용자의 질문에 정확하게, 최신 정보를 기반으로 답해주세요. 답변은 3~5문장으로 핵심 정보를 간결하게 제공하세요. 출처가 있으면 URL도 함께 알려주세요.`;

// ─── Gemini 클라이언트 ───
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!geminiKey) {
  console.error('\n❌ GEMINI_API_KEY 또는 GOOGLE_API_KEY가 .env.local에 설정되지 않았습니다.');
  console.error('  Google AI Studio에서 발급: https://aistudio.google.com/apikey');
  console.error('  .env.local에 추가: GEMINI_API_KEY=AIzaSy...\n');
  process.exit(1);
}

const client = new GoogleGenAI({ apiKey: geminiKey });

// ─── 티어 정의 ───
type PersonTier = 'P1' | 'P1V' | 'P2' | 'P3' | 'P3C' | 'P3D' | 'P4';

// ─── P1 기본 사실 (15문항) ───
const P1_QUESTIONS = [
  { id: 'P1-01', category: 'identity', body: `${TITLE}가 누구야?` },
  { id: 'P1-02', category: 'identity', body: `${NAME} 나이랑 출생지 알려줘` },
  { id: 'P1-03', category: 'career', body: `${NAME}이 국회의원 몇 선이야?` },
  { id: 'P1-04', category: 'career', body: `${NAME} 당대표 되기 전 주요 경력 뭐야?` },
  { id: 'P1-05', category: 'career', body: `${NAME}이 어느 지역구 출신이야?` },
  { id: 'P1-06', category: 'education', body: `${NAME} 학력이 뭐야?` },
  { id: 'P1-07', category: 'party', body: `${NAME}이 당대표로 선출된 게 언제야?` },
  { id: 'P1-08', category: 'party', body: `${NAME}이 당대표 되기 전에 당내에서 어떤 역할 했어?` },
  { id: 'P1-09', category: 'policy_stance', body: `${NAME}의 대표적인 정책 분야가 뭐야?` },
  { id: 'P1-10', category: 'policy_stance', body: `${NAME}의 경제 정책 기조가 뭐야?` },
  { id: 'P1-11', category: 'legislation', body: `${NAME}이 대표 발의한 법안 알려줘` },
  { id: 'P1-12', category: 'election', body: `${NAME} 최근 선거 결과 알려줘` },
  { id: 'P1-13', category: 'media', body: `${NAME} 공식 SNS 계정이나 홈페이지 알려줘` },
  { id: 'P1-14', category: 'personal', body: `${NAME}의 별명이나 정치적 이미지가 뭐야?` },
  { id: 'P1-15', category: 'current', body: `${NAME}이 최근에 어떤 이슈로 활동하고 있어?` },
];

// ─── 파일 기반 질문 로드 ───
function loadQuestions(suffix: string): any[] {
  const filePath = path.resolve(__dirname, `../../docs/person-questions/${NAME}-${suffix}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️ ${suffix} 질문 파일 없음 — 건너뜀`);
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const questions = Array.isArray(raw) ? raw : (raw.questions || []);
  console.log(`  ✓ ${suffix} 질문 ${questions.length}개 로드됨`);
  return questions;
}

// ─── 결과 인터페이스 ───
interface PersonResult {
  tier: PersonTier;
  questionId: string;
  category: string;
  question: string;
  rep: number;
  response: string;
  responseHash: string;
  model: string;
  latencyMs: number;
  citedUrls: string[];
  groundingMetadata: any;
  timestamp: string;
}

// ─── Search Grounding 호출 ───
async function callGemini(tier: PersonTier, qId: string, category: string, body: string, rep: number): Promise<PersonResult> {
  const start = Date.now();
  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: body,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 800,
        tools: [{ googleSearch: {} }],  // ← Search Grounding 활성화
      },
    });

    const elapsed = Date.now() - start;
    const content = response.text || '(응답 없음)';

    // 출처 URL 추출 (응답 본문 + 그라운딩 메타데이터)
    const textUrls = content.match(/https?:\/\/[^\s)]+/g) || [];
    const groundingMeta = (response as any).candidates?.[0]?.groundingMetadata || null;
    const groundingUrls: string[] = [];
    if (groundingMeta?.groundingChunks) {
      for (const chunk of groundingMeta.groundingChunks) {
        if (chunk.web?.uri) groundingUrls.push(chunk.web.uri);
      }
    }
    const allUrls = [...new Set([...textUrls, ...groundingUrls])];

    const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);

    console.log(`  ✓ ${tier} ${qId} R${rep} (${category}) — ${elapsed}ms [검색 ${groundingUrls.length}건]`);
    return {
      tier, questionId: qId, category, question: body, rep,
      response: content, responseHash: hash,
      model: MODEL,
      latencyMs: elapsed, citedUrls: allUrls,
      groundingMetadata: groundingMeta,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    const elapsed = Date.now() - start;
    console.error(`  ✗ ${tier} ${qId} R${rep} — ERROR: ${err.message}`);
    return {
      tier, questionId: qId, category, question: body, rep,
      response: `[ERROR] ${err.message}`, responseHash: '',
      model: MODEL, latencyMs: elapsed, citedUrls: [],
      groundingMetadata: null,
      timestamp: new Date().toISOString(),
    };
  }
}

// ─── 배치 실행 (동시 3건 + 인터벌) ───
async function runBatch(
  tier: PersonTier,
  questions: { id: string; category: string; body: string }[],
  reps: number
): Promise<PersonResult[]> {
  const results: PersonResult[] = [];

  for (let rep = 1; rep <= reps; rep++) {
    console.log(`\n── ${tier} 반복 ${rep}/${reps} ──`);
    for (let i = 0; i < questions.length; i += 3) {
      const batch = questions.slice(i, i + 3);
      console.log(`[${i + 1}~${Math.min(i + 3, questions.length)} / ${questions.length}]`);
      const batchResults = await Promise.all(
        batch.map(q => callGemini(tier, q.id, q.category, q.body, rep))
      );
      results.push(...batchResults);
      // Gemini 속도 제한 준수: 배치 간 1200ms
      if (i + 3 < questions.length) await new Promise(r => setTimeout(r, 1200));
    }
    if (rep < reps) await new Promise(r => setTimeout(r, 2000));
  }

  return results;
}

// ─── 메인 ───
async function main() {
  const p1v = loadQuestions('p1v');
  const p2 = loadQuestions('p2');
  const p3 = loadQuestions('p3');
  const p3c = loadQuestions('p3c');
  const p3d = loadQuestions('p3d');
  const p4 = loadQuestions('p4');

  const counts = {
    P1: P1_QUESTIONS.length * REPS,
    P1V: p1v.length * REPS,
    P2: p2.length * REPS,
    P3: p3.length * REPS,
    P3C: p3c.length * REPS,
    P3D: p3d.length * REPS,
    P4: p4.length * REPS,
  };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  console.log('═══════════════════════════════════════════════════');
  console.log('  정치인 AI 가시성·정합성 측정 (Google Gemini + Search Grounding)');
  console.log(`  대상: ${NAME} (${TITLE}) | 모델: ${MODEL}`);
  console.log(`  🔍 Search Grounding: 활성화`);
  console.log(`  P1  기본 사실:     ${P1_QUESTIONS.length}문항 × ${REPS}회 = ${counts.P1}회`);
  console.log(`  P1V 사실 검증:     ${p1v.length}문항 × ${REPS}회 = ${counts.P1V}회`);
  console.log(`  P2  정책·활동:     ${p2.length}문항 × ${REPS}회 = ${counts.P2}회`);
  console.log(`  P3  인지도·연상:   ${p3.length}문항 × ${REPS}회 = ${counts.P3}회`);
  console.log(`  P3C 경쟁 포지셔닝: ${p3c.length}문항 × ${REPS}회 = ${counts.P3C}회`);
  console.log(`  P3D 위기·평판:     ${p3d.length}문항 × ${REPS}회 = ${counts.P3D}회`);
  console.log(`  P4  출처·시의성:   ${p4.length}문항 × ${REPS}회 = ${counts.P4}회`);
  console.log(`  총: ${total}회 API 호출`);
  console.log('═══════════════════════════════════════════════════');

  const allResults: PersonResult[] = [];

  // P1 기본 사실
  const p1Results = await runBatch('P1', P1_QUESTIONS, REPS);
  allResults.push(...p1Results);

  // P1V 사실 검증
  if (p1v.length > 0) {
    const p1vQ = p1v.map((q: any) => ({ id: q.id, category: q.category || 'verification', body: q.body }));
    allResults.push(...await runBatch('P1V', p1vQ, REPS));
  }

  // P2 정책·활동
  if (p2.length > 0) {
    const p2Q = p2.map((q: any) => ({ id: q.id, category: q.category, body: q.body }));
    allResults.push(...await runBatch('P2', p2Q, REPS));
  }

  // P3 인지도·연상
  if (p3.length > 0) {
    const p3Q = p3.map((q: any) => ({ id: q.id, category: q.type || q.category, body: q.body }));
    allResults.push(...await runBatch('P3', p3Q, REPS));
  }

  // P3C 경쟁 포지셔닝
  if (p3c.length > 0) {
    const p3cQ = p3c.map((q: any) => ({ id: q.id, category: q.category || 'competitive', body: q.body }));
    allResults.push(...await runBatch('P3C', p3cQ, REPS));
  }

  // P3D 위기·평판
  if (p3d.length > 0) {
    const p3dQ = p3d.map((q: any) => ({ id: q.id, category: q.riskCategory || 'reputation', body: q.body }));
    allResults.push(...await runBatch('P3D', p3dQ, REPS));
  }

  // P4 출처·시의성
  if (p4.length > 0) {
    const p4Q = p4.map((q: any) => ({ id: q.id, category: q.category || 'source', body: q.body }));
    allResults.push(...await runBatch('P4', p4Q, REPS));
  }

  // ─── 결과 저장 ───
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const measurementId = `pm-${dateStr}-${NAME}-gemini`;
  const outDir = path.resolve(__dirname, '../../docs/person-measurements');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, `${measurementId}.json`);

  const errors = allResults.filter(r => r.response.startsWith('[ERROR]'));
  const absent = allResults.filter(r => r.response === '(응답 없음)');
  const success = allResults.length - errors.length - absent.length;

  // 그라운딩 통계
  const groundedCount = allResults.filter(r => r.groundingMetadata?.groundingChunks?.length > 0).length;
  const totalGroundingUrls = allResults.reduce((acc, r) => {
    const chunks = r.groundingMetadata?.groundingChunks || [];
    return acc + chunks.length;
  }, 0);

  fs.writeFileSync(outFile, JSON.stringify({
    measurement: {
      id: measurementId,
      subject_name: NAME,
      subject_title: TITLE,
      subject_type: 'politician',
      method_version: 'v1.0-person-gemini',
      ai_service: 'gemini',
      model: MODEL,
      search_grounding: true,
      web_search: 'google_search_grounding',
      mode: REPS <= 3 ? 'quick' : 'full',
      reps: REPS,
      status: 'completed',
      started_at: allResults[0]?.timestamp,
      completed_at: allResults[allResults.length - 1]?.timestamp,
      total_queries: allResults.length,
      error_count: errors.length,
      absent_count: absent.length,
      success_count: success,
      grounding_stats: {
        grounded_responses: groundedCount,
        total_grounding_sources: totalGroundingUrls,
        grounding_rate: (groundedCount / allResults.length * 100).toFixed(1) + '%',
      },
      tier_counts: {
        P1: allResults.filter(r => r.tier === 'P1').length,
        P1V: allResults.filter(r => r.tier === 'P1V').length,
        P2: allResults.filter(r => r.tier === 'P2').length,
        P3: allResults.filter(r => r.tier === 'P3').length,
        P3C: allResults.filter(r => r.tier === 'P3C').length,
        P3D: allResults.filter(r => r.tier === 'P3D').length,
        P4: allResults.filter(r => r.tier === 'P4').length,
      },
    },
    results: allResults,
  }, null, 2), 'utf-8');

  console.log(`\n✓ 측정 완료! ${allResults.length}건`);
  console.log(`  저장: ${outFile}`);
  console.log(`  성공: ${success}건`);
  console.log(`  응답없음: ${absent.length}건`);
  console.log(`  에러: ${errors.length}건`);
  console.log(`  🔍 검색 그라운딩: ${groundedCount}/${allResults.length}건 (${(groundedCount / allResults.length * 100).toFixed(1)}%)`);
  console.log(`  📎 그라운딩 출처: 총 ${totalGroundingUrls}건`);
}

main().catch(console.error);
