#!/usr/bin/env npx tsx
// scripts/measure-v2/measure-3tier.ts
// 3-Tier AEO 진단 CLI 측정 스크립트
// 사용법: npx tsx scripts/measure-v2/measure-3tier.ts --unit 수원시 --unit-id lg-41110 --reps 3

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

const UNIT = getArg('unit', '수원시');
const UNIT_ID = getArg('unit-id', 'lg-00000');
const REPS = parseInt(getArg('reps', '3'));
const MODEL = 'gpt-5.6-luna';
const SYSTEM_PROMPT = '당신은 한국 지자체 민원 안내 도우미입니다. 사용자의 질문에 정확하게, 최신 정보를 기반으로 답해주세요. 답변은 3~5문장으로 핵심 정보를 간결하게 제공하세요. 출처가 있으면 URL도 함께 알려주세요.';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Tier 1 확정 질문 (15문항) ───
const TIER1 = [
  { id: 'B-01', category: 'birth', body: `${UNIT} 둘째 출산지원금이랑 산후조리비 총 얼마야?` },
  { id: 'B-02', category: 'move_in', body: `${UNIT} 전입신고 하면 받을 수 있는 혜택 있어?` },
  { id: 'B-03', category: 'waste', body: `${UNIT} 대형폐기물 스티커 가격이랑 배출 신청 방법 알려줘` },
  { id: 'B-04', category: 'waste_bag', body: `${UNIT} 종량제봉투 종류별 가격 알려줘` },
  { id: 'B-05', category: 'civil', body: `${UNIT} 청/군청 민원실 점심시간에도 되는지, 주차요금 얼마야?` },
  { id: 'B-06', category: 'senior_bus', body: `${UNIT} 어르신 버스비 지원 대상 나이랑 금액 알려줘` },
  { id: 'B-07', category: 'senior_bath', body: `${UNIT} 어르신 목욕권이나 이미용 지원 있어?` },
  { id: 'B-08', category: 'youth_rent', body: `${UNIT} 청년 월세 지원 대상 조건이랑 지원 금액 알려줘` },
  { id: 'B-09', category: 'startup', body: `${UNIT} 청년 창업 지원금이나 창업 공간 지원 있어?` },
  { id: 'B-10', category: 'night_care', body: `${UNIT} 밤에 아이가 아프면 갈 수 있는 소아과 어디야?` },
  { id: 'B-11', category: 'child_care', body: `${UNIT} 초등 방과후 돌봄교실이나 지역아동센터 정보 알려줘` },
  { id: 'B-12', category: 'multicultural', body: `${UNIT} 다문화가족지원센터 위치랑 프로그램 알려줘` },
  { id: 'B-13', category: 'loan', body: `${UNIT} 소상공인 특례보증 대출 조건 알려줘` },
  { id: 'B-14', category: 'tax', body: `${UNIT} 소상공인 무료 세무 상담 받을 수 있는 곳 있어?` },
  { id: 'B-15', category: 'festival', body: `${UNIT} 올해 열리는 대표 축제 일정이랑 장소 안내해줘` },
];

// ─── Tier 2 질문 로드 (파일 기반) ───
function loadTier2(): { id: string; category: string; body: string; groundTruth: string }[] {
  const t2File = path.resolve(__dirname, `../../docs/aeo-questions/${UNIT_ID}-tier2.json`);
  if (!fs.existsSync(t2File)) {
    console.log('  ⚠️ Tier 2 질문 파일 없음 — Tier 2 건너뜀');
    return [];
  }
  return JSON.parse(fs.readFileSync(t2File, 'utf-8'));
}

// ─── Tier 3 질문 로드 (파일 기반) ───
function loadTier3(): { id: string; type: string; body: string; targetKeywords: string[] }[] {
  const t3File = path.resolve(__dirname, `../../docs/aeo-questions/${UNIT_ID}-tier3.json`);
  if (!fs.existsSync(t3File)) {
    console.log('  ⚠️ Tier 3 질문 파일 없음 — Tier 3 건너뜀');
    return [];
  }
  return JSON.parse(fs.readFileSync(t3File, 'utf-8'));
}

// ─── 단일 호출 ───
interface Result {
  tier: 'T1' | 'T2' | 'T3';
  questionId: string;
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

async function callAI(tier: 'T1' | 'T2' | 'T3', qId: string, category: string, body: string, rep: number): Promise<Result> {
  const start = Date.now();
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: body },
      ],
      max_completion_tokens: 800,
    });
    const elapsed = Date.now() - start;
    const content = completion.choices[0]?.message?.content || '(응답 없음)';
    const urls = content.match(/https?:\/\/[^\s)]+/g) || [];
    const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);

    console.log(`  ✓ ${tier} ${qId} R${rep} (${category}) — ${elapsed}ms`);
    return {
      tier, questionId: qId, category, question: body, rep,
      response: content, responseHash: hash,
      model: completion.model || MODEL,
      latencyMs: elapsed, citedUrls: urls,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    const elapsed = Date.now() - start;
    console.error(`  ✗ ${tier} ${qId} R${rep} — ERROR: ${err.message}`);
    return {
      tier, questionId: qId, category, question: body, rep,
      response: `[ERROR] ${err.message}`, responseHash: '',
      model: MODEL, latencyMs: elapsed, citedUrls: [],
      timestamp: new Date().toISOString(),
    };
  }
}

// ─── 배치 실행 ───
async function runBatch(
  tier: 'T1' | 'T2' | 'T3',
  questions: { id: string; category: string; body: string }[],
  reps: number
): Promise<Result[]> {
  const results: Result[] = [];

  for (let rep = 1; rep <= reps; rep++) {
    console.log(`\n── ${tier} 반복 ${rep}/${reps} ──`);
    for (let i = 0; i < questions.length; i += 5) {
      const batch = questions.slice(i, i + 5);
      console.log(`[${i + 1}~${Math.min(i + 5, questions.length)} / ${questions.length}]`);
      const batchResults = await Promise.all(
        batch.map(q => callAI(tier, q.id, q.category, q.body, rep))
      );
      results.push(...batchResults);
      if (i + 5 < questions.length) await new Promise(r => setTimeout(r, 800));
    }
    if (rep < reps) await new Promise(r => setTimeout(r, 1500));
  }

  return results;
}

// ─── 메인 ───
async function main() {
  const tier2 = loadTier2();
  const tier3 = loadTier3();

  const t1Count = TIER1.length * REPS;
  const t2Count = tier2.length * REPS;
  const t3Count = tier3.length * REPS;
  const total = t1Count + t2Count + t3Count;

  console.log('═══════════════════════════════════════════════════');
  console.log('  kplacelab v2.1 3-Tier AEO 측정');
  console.log(`  단위: ${UNIT} (${UNIT_ID}) | 모델: ${MODEL}`);
  console.log(`  Tier 1: ${TIER1.length}문항 × ${REPS}회 = ${t1Count}회`);
  console.log(`  Tier 2: ${tier2.length}문항 × ${REPS}회 = ${t2Count}회`);
  console.log(`  Tier 3: ${tier3.length}문항 × ${REPS}회 = ${t3Count}회`);
  console.log(`  총: ${total}회 API 호출`);
  console.log('═══════════════════════════════════════════════════');

  const allResults: Result[] = [];

  // Tier 1
  const t1Results = await runBatch('T1', TIER1, REPS);
  allResults.push(...t1Results);

  // Tier 2
  if (tier2.length > 0) {
    const t2Questions = tier2.map(q => ({ id: q.id, category: q.category, body: q.body }));
    const t2Results = await runBatch('T2', t2Questions, REPS);
    allResults.push(...t2Results);
  }

  // Tier 3
  if (tier3.length > 0) {
    const t3Questions = tier3.map(q => ({ id: q.id, category: q.type, body: q.body }));
    const t3Results = await runBatch('T3', t3Questions, REPS);
    allResults.push(...t3Results);
  }

  // 결과 저장
  const measurementId = `m-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${UNIT_ID.replace('lg-', '')}`;
  const outDir = path.resolve(__dirname, '../../docs/aeo-measurements');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, `${measurementId}.json`);
  fs.writeFileSync(outFile, JSON.stringify({
    measurement: {
      id: measurementId,
      unit_id: UNIT_ID,
      unit_name: UNIT,
      method_version: 'v2.1',
      ai_service: 'chatgpt',
      model: MODEL,
      web_search: 'on',
      mode: REPS <= 3 ? 'quick' : 'full',
      reps: REPS,
      status: 'completed',
      started_at: allResults[0]?.timestamp,
      completed_at: allResults[allResults.length - 1]?.timestamp,
      total_queries: allResults.length,
      error_count: allResults.filter(r => r.response.startsWith('[ERROR]')).length,
      tier_counts: {
        T1: t1Results.length,
        T2: allResults.filter(r => r.tier === 'T2').length,
        T3: allResults.filter(r => r.tier === 'T3').length,
      },
    },
    results: allResults,
  }, null, 2), 'utf-8');

  const errors = allResults.filter(r => r.response.startsWith('[ERROR]'));
  const absent = allResults.filter(r => r.response === '(응답 없음)');
  console.log(`\n✓ 측정 완료! ${allResults.length}건`);
  console.log(`  저장: ${outFile}`);
  console.log(`  성공: ${allResults.length - errors.length - absent.length}건`);
  console.log(`  응답없음: ${absent.length}건`);
  console.log(`  에러: ${errors.length}건`);
}

main().catch(console.error);
