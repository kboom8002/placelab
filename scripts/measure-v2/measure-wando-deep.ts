#!/usr/bin/env npx tsx
// scripts/measure-v2/measure-wando-deep.ts
// 완도군 5대 심화 프로브 40문항 × 3회 = 120슬롯 측정
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

// ─── CLI 인자 ───
const args = process.argv.slice(2);
function getArg(name: string, def: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
}

const REPS = parseInt(getArg('reps', '3'));
const MODEL = getArg('model', 'gemini-3.5-flash-lite');

// 한국어 / 영어 시스템 프롬프트 분리
const SYSTEM_KO = `당신은 한국 지역 관광·행정·산업 전문 지식을 가진 AI 어시스턴트입니다. 사용자의 질문에 정확하게, 최신 정보를 기반으로 답해주세요. 답변은 3~5문장으로 핵심 정보를 간결하게 제공하세요. 출처가 있으면 URL도 함께 알려주세요.`;
const SYSTEM_EN = `You are an AI assistant with expertise in Korean regional tourism, government services, and marine industries. Answer the user's question accurately based on the most up-to-date information. Provide concise answers in 3-5 sentences. Include source URLs if available.`;

// ─── Gemini 클라이언트 ───
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!geminiKey) {
  console.error('\n❌ GEMINI_API_KEY가 .env.local에 설정되지 않았습니다.');
  process.exit(1);
}
const client = new GoogleGenAI({ apiKey: geminiKey });

// ─── 질문 로드 ───
const questionFile = path.resolve(__dirname, '../../docs/aeo-questions/wando-deep.json');
const questionData = JSON.parse(fs.readFileSync(questionFile, 'utf-8'));
const questions: Array<{
  id: string; axis: string; category: string; body: string; lang: string; probe_type: string;
}> = questionData.questions;

// ─── 결과 인터페이스 ───
interface WandoResult {
  questionId: string;
  axis: string;
  category: string;
  probe_type: string;
  lang: string;
  question: string;
  rep: number;
  response: string;
  responseHash: string;
  model: string;
  latencyMs: number;
  citedUrls: string[];
  groundingChunks: Array<{ uri: string; title: string }>;
  webSearchQueries: string[];
  timestamp: string;
}

// ─── Search Grounding 호출 ───
async function callGemini(q: typeof questions[0], rep: number): Promise<WandoResult> {
  const start = Date.now();
  const systemPrompt = q.lang === 'en' ? SYSTEM_EN : SYSTEM_KO;
  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: q.body,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 800,
        tools: [{ googleSearch: {} }],
      },
    });

    const elapsed = Date.now() - start;
    const content = response.text || '(응답 없음)';

    // 출처 URL 추출
    const textUrls = content.match(/https?:\/\/[^\s)]+/g) || [];
    const groundingMeta = (response as any).candidates?.[0]?.groundingMetadata || null;
    const groundingChunks: Array<{ uri: string; title: string }> = [];
    if (groundingMeta?.groundingChunks) {
      for (const chunk of groundingMeta.groundingChunks) {
        if (chunk.web?.uri) {
          groundingChunks.push({ uri: chunk.web.uri, title: chunk.web.title || '' });
        }
      }
    }
    const webSearchQueries: string[] = groundingMeta?.webSearchQueries || [];
    const allUrls = [...new Set([...textUrls, ...groundingChunks.map(c => c.uri)])];
    const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);

    console.log(`  ✓ ${q.id} R${rep} (${q.axis}/${q.category}) — ${elapsed}ms [검색 ${groundingChunks.length}건]`);
    return {
      questionId: q.id, axis: q.axis, category: q.category,
      probe_type: q.probe_type, lang: q.lang,
      question: q.body, rep,
      response: content, responseHash: hash,
      model: MODEL, latencyMs: elapsed,
      citedUrls: allUrls, groundingChunks, webSearchQueries,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    const elapsed = Date.now() - start;
    console.error(`  ✗ ${q.id} R${rep} — ERROR: ${err.message}`);
    return {
      questionId: q.id, axis: q.axis, category: q.category,
      probe_type: q.probe_type, lang: q.lang,
      question: q.body, rep,
      response: `[ERROR] ${err.message}`, responseHash: '',
      model: MODEL, latencyMs: elapsed,
      citedUrls: [], groundingChunks: [], webSearchQueries: [],
      timestamp: new Date().toISOString(),
    };
  }
}

// ─── 배치 실행 (동시 3건 + 1200ms 인터벌) ───
async function runAll(): Promise<WandoResult[]> {
  const results: WandoResult[] = [];

  for (let rep = 1; rep <= REPS; rep++) {
    console.log(`\n═══ 반복 ${rep}/${REPS} (${questions.length}문항) ═══`);
    for (let i = 0; i < questions.length; i += 3) {
      const batch = questions.slice(i, i + 3);
      console.log(`[${i + 1}~${Math.min(i + 3, questions.length)} / ${questions.length}]`);
      const batchResults = await Promise.all(
        batch.map(q => callGemini(q, rep))
      );
      results.push(...batchResults);
      // 속도 제한 준수: 배치 간 1200ms
      if (i + 3 < questions.length) await new Promise(r => setTimeout(r, 1200));
    }
    if (rep < REPS) await new Promise(r => setTimeout(r, 2000));
  }

  return results;
}

// ─── 메인 ───
async function main() {
  const axisNames: Record<string, string> = {
    A_healing: '해양치유',
    B_bio: '해양바이오',
    C_eco_tourism: '생태관광',
    D_admin: '생활행정',
    E_h2h_en: 'H2H+EN',
  };

  const axisCounts = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.axis] = (acc[q.axis] || 0) + 1;
    return acc;
  }, {});

  console.log('═══════════════════════════════════════════════════');
  console.log('  완도군 AI 심화 진단 측정 (Gemini + Search Grounding)');
  console.log(`  모델: ${MODEL} | 반복: ${REPS}회`);
  console.log('  🔍 Search Grounding: 활성화');
  for (const [axis, count] of Object.entries(axisCounts)) {
    console.log(`  [${axis}] ${axisNames[axis] || axis}: ${count}문항 × ${REPS}회 = ${count * REPS}슬롯`);
  }
  console.log(`  총: ${questions.length}문항 × ${REPS}회 = ${questions.length * REPS}슬롯`);
  console.log('═══════════════════════════════════════════════════');

  const allResults = await runAll();

  // ─── 결과 저장 ───
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const measurementId = `m-${dateStr}-wando-deep`;
  const outDir = path.resolve(__dirname, '../../docs/aeo-measurements');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, `${measurementId}.json`);

  const errors = allResults.filter(r => r.response.startsWith('[ERROR]'));
  const absent = allResults.filter(r => r.response === '(응답 없음)');
  const success = allResults.length - errors.length - absent.length;

  // 그라운딩 통계
  const groundedCount = allResults.filter(r => r.groundingChunks.length > 0).length;
  const totalGroundingUrls = allResults.reduce((acc, r) => acc + r.groundingChunks.length, 0);

  // 축별 통계
  const axisStats: Record<string, { total: number; success: number; grounded: number; sources: number }> = {};
  for (const r of allResults) {
    if (!axisStats[r.axis]) axisStats[r.axis] = { total: 0, success: 0, grounded: 0, sources: 0 };
    axisStats[r.axis].total++;
    if (!r.response.startsWith('[ERROR]') && r.response !== '(응답 없음)') axisStats[r.axis].success++;
    if (r.groundingChunks.length > 0) axisStats[r.axis].grounded++;
    axisStats[r.axis].sources += r.groundingChunks.length;
  }

  // probe_type별 통계
  const probeStats: Record<string, { total: number; success: number }> = {};
  for (const r of allResults) {
    if (!probeStats[r.probe_type]) probeStats[r.probe_type] = { total: 0, success: 0 };
    probeStats[r.probe_type].total++;
    if (!r.response.startsWith('[ERROR]') && r.response !== '(응답 없음)') probeStats[r.probe_type].success++;
  }

  // 출처 도메인 집계
  const domainFreq: Record<string, number> = {};
  for (const r of allResults) {
    for (const chunk of r.groundingChunks) {
      try {
        // vertexaisearch redirect → title에서 도메인 추출
        const uri = chunk.uri;
        let domain: string;
        if (uri.includes('vertexaisearch.cloud.google.com')) {
          // title often has domain info, but extract from actual redirect URL
          const match = uri.match(/url=([^&]+)/);
          if (match) {
            domain = new URL(decodeURIComponent(match[1])).hostname;
          } else {
            domain = chunk.title || 'vertexaisearch';
          }
        } else {
          domain = new URL(uri).hostname;
        }
        domain = domain.replace(/^www\./, '');
        domainFreq[domain] = (domainFreq[domain] || 0) + 1;
      } catch {
        domainFreq['(parse-error)'] = (domainFreq['(parse-error)'] || 0) + 1;
      }
    }
  }

  // SoV 분석 (비브랜드 추천 질문에서 완도 언급률)
  const sovQuestions = allResults.filter(r => r.probe_type === 'sov');
  const sovMentionWando = sovQuestions.filter(r =>
    /완도|wando/i.test(r.response)
  ).length;

  // H2H 분석
  const h2hQuestions = allResults.filter(r => r.probe_type === 'h2h');

  const output = {
    measurement: {
      id: measurementId,
      subject: '완도군',
      subject_type: 'local_gov',
      subject_code: '46890',
      method_version: 'v1.0-wando-deep',
      ai_service: 'gemini',
      model: MODEL,
      search_grounding: true,
      web_search: 'google_search_grounding',
      language: ['ko', 'en'],
      mode: REPS <= 3 ? 'quick' : 'full',
      reps: REPS,
      status: 'completed',
      disclaimer: '탐색적 측정 · 사전 등록 전 파일럿 (INV-11)',
      started_at: allResults[0]?.timestamp,
      completed_at: allResults[allResults.length - 1]?.timestamp,
      total_slots: allResults.length,
      error_count: errors.length,
      absent_count: absent.length,
      success_count: success,
      grounding_stats: {
        grounded_responses: groundedCount,
        total_grounding_sources: totalGroundingUrls,
        grounding_rate: (groundedCount / allResults.length * 100).toFixed(1) + '%',
      },
      axis_stats: axisStats,
      probe_stats: probeStats,
      domain_frequency: Object.entries(domainFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 30)
        .reduce<Record<string, number>>((acc, [k, v]) => { acc[k] = v; return acc; }, {}),
      sov_analysis: {
        total_sov_questions: sovQuestions.length,
        wando_mentioned: sovMentionWando,
        wando_sov_rate: sovQuestions.length > 0
          ? (sovMentionWando / sovQuestions.length * 100).toFixed(1) + '%'
          : 'N/A',
      },
      h2h_total: h2hQuestions.length,
    },
    results: allResults,
  };

  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n✓ 측정 완료! ${allResults.length}슬롯`);
  console.log(`  저장: ${outFile}`);
  console.log(`  성공: ${success}건 | 응답없음: ${absent.length}건 | 에러: ${errors.length}건`);
  console.log(`  🔍 검색 그라운딩: ${groundedCount}/${allResults.length}건 (${(groundedCount / allResults.length * 100).toFixed(1)}%)`);
  console.log(`  📎 그라운딩 출처: 총 ${totalGroundingUrls}건`);
  console.log(`\n  ── 축별 요약 ──`);
  for (const [axis, stats] of Object.entries(axisStats)) {
    console.log(`  [${axis}] 성공 ${stats.success}/${stats.total} | 검색 ${stats.grounded}건 | 출처 ${stats.sources}건`);
  }
  console.log(`\n  ── SoV 분석 ──`);
  console.log(`  비브랜드 추천 질문: ${sovQuestions.length}슬롯`);
  console.log(`  완도 언급률: ${sovMentionWando}/${sovQuestions.length} (${sovQuestions.length > 0 ? (sovMentionWando / sovQuestions.length * 100).toFixed(1) : 0}%)`);
  console.log(`\n  ── 출처 도메인 TOP 10 ──`);
  const topDomains = Object.entries(domainFreq).sort(([, a], [, b]) => b - a).slice(0, 10);
  for (const [domain, count] of topDomains) {
    console.log(`  ${domain}: ${count}건`);
  }
}

main().catch(console.error);
