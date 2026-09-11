#!/usr/bin/env npx tsx
// scripts/measure-v2/measure-nonsan-deep.ts
// 논산시 이원적 심화 프로브 45문항 × 3회 = 135슬롯 측정
// Google Gemini + Search Grounding
// INV-9: 회차별 원자료 저장, INV-11: 탐색적 측정

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

const args = process.argv.slice(2);
function getArg(name: string, def: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
}

const REPS = parseInt(getArg('reps', '3'));
const MODEL = getArg('model', 'gemini-3.5-flash-lite');

const SYSTEM_KO = `당신은 대한민국 지방 행정, 국방 산업, 농업 엑스포, 군 복무 및 지역 관광 전문 지식을 갖춘 AI 어시스턴트입니다. 사용자의 질문에 정확하고 최신 정보를 기반으로 답해주세요. 답변은 3~5문장으로 핵심 정보를 간결하게 제공하세요. 출처가 있으면 URL도 함께 알려주세요.`;
const SYSTEM_EN = `You are an AI assistant with expertise in Korean municipal policies, defense logistics, agricultural expos, and tourism. Answer accurately based on the most up-to-date information. Provide concise answers in 3-5 sentences. Include source URLs if available.`;

const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!geminiKey) { console.error('\n❌ GEMINI_API_KEY 없음'); process.exit(1); }
const client = new GoogleGenAI({ apiKey: geminiKey });

const questionFile = path.resolve(__dirname, '../../docs/aeo-questions/nonsan-deep.json');
const questionData = JSON.parse(fs.readFileSync(questionFile, 'utf-8'));
const questions: Array<{
  id: string; axis: string; category: string; body: string; lang: string; probe_type: string;
}> = questionData.questions;

interface NonsanResult {
  questionId: string; axis: string; category: string; probe_type: string; lang: string;
  question: string; rep: number; response: string; responseHash: string;
  model: string; latencyMs: number; citedUrls: string[];
  groundingChunks: Array<{ uri: string; title: string }>; webSearchQueries: string[];
  timestamp: string;
}

async function callGemini(q: typeof questions[0], rep: number): Promise<NonsanResult> {
  const start = Date.now();
  const systemPrompt = q.lang === 'en' ? SYSTEM_EN : SYSTEM_KO;
  try {
    const response = await client.models.generateContent({
      model: MODEL, contents: q.body,
      config: { systemInstruction: systemPrompt, maxOutputTokens: 800, tools: [{ googleSearch: {} }] },
    });
    const latencyMs = Date.now() - start;
    const candidate = response.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || '(응답 없음)';
    const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);

    const gMeta = candidate?.groundingMetadata;
    const chunks: Array<{ uri: string; title: string }> = [];
    if (gMeta?.groundingChunks) {
      for (const c of gMeta.groundingChunks) {
        if (c.web?.uri) {
          chunks.push({ uri: c.web.uri, title: c.web.title || '' });
        }
      }
    }
    const searchQueries: string[] = gMeta?.webSearchQueries || [];
    const urlMatches = text.match(/https?:\/\/[^\s)>]+/g) || [];

    console.log(`  ✓ ${q.id} R${rep} (${q.axis}/${q.category}) — ${latencyMs}ms [${chunks.length}건]`);
    return {
      questionId: q.id, axis: q.axis, category: q.category, probe_type: q.probe_type, lang: q.lang,
      question: q.body, rep, response: text, responseHash: hash,
      model: MODEL, latencyMs, citedUrls: Array.from(new Set(urlMatches)),
      groundingChunks: chunks, webSearchQueries: searchQueries,
      timestamp: new Date().toISOString(),
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ ${q.id} R${rep} 에러: ${msg}`);
    return {
      questionId: q.id, axis: q.axis, category: q.category, probe_type: q.probe_type, lang: q.lang,
      question: q.body, rep, response: `[ERROR] ${msg}`, responseHash: '',
      model: MODEL, latencyMs, citedUrls: [], groundingChunks: [], webSearchQueries: [],
      timestamp: new Date().toISOString(),
    };
  }
}

async function runAll(): Promise<NonsanResult[]> {
  const results: NonsanResult[] = [];
  for (let rep = 1; rep <= REPS; rep++) {
    console.log(`\n═══ 반복 ${rep}/${REPS} (${questions.length}문항) ═══`);
    for (let i = 0; i < questions.length; i += 3) {
      const batch = questions.slice(i, i + 3);
      console.log(`[${i + 1}~${Math.min(i + 3, questions.length)} / ${questions.length}]`);
      const batchResults = await Promise.all(batch.map(q => callGemini(q, rep)));
      results.push(...batchResults);
      if (i + 3 < questions.length) await new Promise(r => setTimeout(r, 1200));
    }
    if (rep < REPS) await new Promise(r => setTimeout(r, 2000));
  }
  return results;
}

async function main() {
  const axisNames: Record<string, string> = {
    A_defense_industry: '국방산업·방산클러스터',
    B_strawberry_expo: '딸기산업·2027세계엑스포',
    C_military_family: '훈련소영외면회·생활인구',
    D_heritage_tourism: '레트로·생태·유교관광',
    E_competition_h2h: '경쟁도시H2H·광역SoV',
    F_reverse_settlement: '역발상리스크·정주여건',
  };
  const axisCounts = questions.reduce<Record<string, number>>((acc, q) => { acc[q.axis] = (acc[q.axis] || 0) + 1; return acc; }, {});

  console.log('═══════════════════════════════════════════════════');
  console.log('  논산시 이원적 AI 심화 진단 (Gemini + Search Grounding)');
  console.log(`  모델: ${MODEL} | 반복: ${REPS}회`);
  for (const [axis, count] of Object.entries(axisCounts)) {
    console.log(`  [${axis}] ${axisNames[axis] || axis}: ${count}문항 × ${REPS}회 = ${count * REPS}슬롯`);
  }
  console.log(`  총 ${questions.length}문항 × ${REPS}회 = ${questions.length * REPS}슬롯`);
  console.log('═══════════════════════════════════════════════════');

  const allResults = await runAll();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const measurementId = `m-${dateStr}-nonsan-deep`;
  const outDir = path.resolve(__dirname, '../../docs/aeo-measurements');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${measurementId}.json`);

  const success = allResults.filter(r => !r.response.startsWith('[ERROR]') && r.response !== '(응답 없음)').length;
  const errors = allResults.filter(r => r.response.startsWith('[ERROR]'));
  const absent = allResults.filter(r => r.response === '(응답 없음)');
  const groundedCount = allResults.filter(r => r.groundingChunks.length > 0).length;
  const totalGroundingUrls = allResults.reduce((acc, r) => acc + r.groundingChunks.length, 0);

  const axisStats: Record<string, { total: number; success: number; grounded: number; sources: number }> = {};
  for (const r of allResults) {
    if (!axisStats[r.axis]) axisStats[r.axis] = { total: 0, success: 0, grounded: 0, sources: 0 };
    axisStats[r.axis].total++;
    if (!r.response.startsWith('[ERROR]') && r.response !== '(응답 없음)') axisStats[r.axis].success++;
    if (r.groundingChunks.length > 0) axisStats[r.axis].grounded++;
    axisStats[r.axis].sources += r.groundingChunks.length;
  }

  const probeStats: Record<string, { total: number; success: number }> = {};
  for (const r of allResults) {
    if (!probeStats[r.probe_type]) probeStats[r.probe_type] = { total: 0, success: 0 };
    probeStats[r.probe_type].total++;
    if (!r.response.startsWith('[ERROR]') && r.response !== '(응답 없음)') probeStats[r.probe_type].success++;
  }

  const domainFreq: Record<string, number> = {};
  for (const r of allResults) {
    for (const chunk of r.groundingChunks) {
      try {
        const uri = chunk.uri;
        let domain: string;
        if (uri.includes('vertexaisearch.cloud.google.com')) {
          const match = uri.match(/url=([^&]+)/);
          domain = match ? new URL(decodeURIComponent(match[1])).hostname : chunk.title || 'vertexaisearch';
        } else { domain = new URL(uri).hostname; }
        domain = domain.replace(/^www\./, '');
        domainFreq[domain] = (domainFreq[domain] || 0) + 1;
      } catch { domainFreq['(parse-error)'] = (domainFreq['(parse-error)'] || 0) + 1; }
    }
  }

  // SoV: 논산 등장률
  const sovQuestions = allResults.filter(r => r.probe_type === 'sov');
  const sovMentionNonsan = sovQuestions.filter(r => /논산|nonsan/i.test(r.response)).length;

  const output = {
    measurement: {
      id: measurementId, subject: '논산시', subject_type: 'local_gov', subject_code: '44230',
      method_version: 'v1.0-nonsan-deep', ai_service: 'gemini', model: MODEL, search_grounding: true,
      web_search: 'google_search_grounding', language: ['ko', 'en'], mode: REPS <= 3 ? 'quick' : 'full',
      reps: REPS, status: 'completed', disclaimer: '탐색적 측정 · 사전 등록 전 파일럿 (INV-11)',
      started_at: allResults[0]?.timestamp, completed_at: allResults[allResults.length - 1]?.timestamp,
      total_slots: allResults.length, error_count: errors.length, absent_count: absent.length, success_count: success,
      grounding_stats: { grounded_responses: groundedCount, total_grounding_sources: totalGroundingUrls, grounding_rate: (groundedCount / allResults.length * 100).toFixed(1) + '%' },
      axis_stats: axisStats, probe_stats: probeStats,
      domain_frequency: Object.entries(domainFreq).sort(([, a], [, b]) => b - a).slice(0, 30).reduce<Record<string, number>>((acc, [k, v]) => { acc[k] = v; return acc; }, {}),
      sov_analysis: { total_sov_questions: sovQuestions.length, target_mentioned: sovMentionNonsan, sov_rate: sovQuestions.length > 0 ? (sovMentionNonsan / sovQuestions.length * 100).toFixed(1) + '%' : 'N/A' },
      h2h_total: allResults.filter(r => r.probe_type === 'h2h').length,
    },
    results: allResults,
  };

  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n✓ 측정 완료! ${allResults.length}슬롯`);
  console.log(`  저장: ${outFile}`);
  console.log(`  성공: ${success}건 | 응답없음: ${absent.length}건 | 에러: ${errors.length}건`);
  console.log(`  🔍 그라운딩: ${groundedCount}/${allResults.length} (${(groundedCount / allResults.length * 100).toFixed(1)}%)`);
  console.log(`  📎 출처: 총 ${totalGroundingUrls}건`);
  console.log(`\n  ── SoV ──`);
  console.log(`  비브랜드 SoV 질문: ${sovQuestions.length}슬롯 | 논산 등장: ${sovMentionNonsan} (${sovQuestions.length > 0 ? (sovMentionNonsan / sovQuestions.length * 100).toFixed(1) : 0}%)`);
  console.log(`\n  ── 출처 TOP 10 ──`);
  Object.entries(domainFreq).sort(([, a], [, b]) => b - a).slice(0, 10).forEach(([d, c]) => console.log(`  ${d}: ${c}건`));
}

main().catch(console.error);
