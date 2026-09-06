// lib/aeo/measure-engine.ts
// 3-Tier AEO 측정 엔진 (출처: K04 v2.1)
// 불변식: INV-6 (전문 비공개/해시), INV-7 (측정 조건), INV-9 (회차별 저장, Floor Risk 병기)

import OpenAI from 'openai';
import { Tier1Question } from './tier1-questions';
import { V2_DEFAULT_MODEL } from '@/lib/constants/measurement';

export interface MeasureResult {
  tier: 'T1' | 'T2' | 'T3';
  questionId: string;
  question: string;
  rep: number;
  response: string;
  responseHash: string;  // simple hash
  model: string;
  latencyMs: number;
  citedUrls: string[];   // extract URLs from response
  timestamp: string;
}

export interface MeasureOptions {
  unitName: string;
  unitId: string;
  reps?: number;  // default 3
  tier1Questions: Tier1Question[];
  tier2Questions?: { id: string; body: string }[];
  tier3Questions?: { id: string; body: string }[];
  onProgress?: (completed: number, total: number, tier: string) => void;
}

const MODEL = V2_DEFAULT_MODEL || 'gpt-5.6-luna';
const SYSTEM_PROMPT =
  '당신은 한국 지자체 민원 안내 도우미입니다. 사용자의 질문에 정확하게, 최신 정보를 기반으로 답해주세요. 답변은 3~5문장으로 핵심 정보를 간결하게 제공하세요. 출처가 있으면 URL도 함께 알려주세요.';
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 800;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractUrls(text: string): string[] {
  if (!text) return [];
  const urlRegex = /https?:\/\/[^\s\)\],>"'<>]+/g;
  const matches = text.match(urlRegex) || [];
  return matches.map(url => url.replace(/[.,;:!]+$/, ''));
}

function computeResponseHash(text: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(text, 'utf-8').toString('base64').slice(0, 16);
  }
  return btoa(encodeURIComponent(text)).slice(0, 16);
}

interface QuestionTask {
  tier: 'T1' | 'T2' | 'T3';
  questionId: string;
  question: string;
  rep: number;
}

async function callOpenAI(
  client: OpenAI,
  task: QuestionTask
): Promise<MeasureResult> {
  const startTime = Date.now();
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: task.question },
      ],
      max_completion_tokens: 800,
    });
    const latencyMs = Date.now() - startTime;
    const response = completion.choices[0]?.message?.content || '(응답 없음)';
    return {
      tier: task.tier,
      questionId: task.questionId,
      question: task.question,
      rep: task.rep,
      response,
      responseHash: computeResponseHash(response),
      model: completion.model || MODEL,
      latencyMs,
      citedUrls: extractUrls(response),
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const response = `[ERROR] ${err?.message || 'API request failed'}`;
    return {
      tier: task.tier,
      questionId: task.questionId,
      question: task.question,
      rep: task.rep,
      response,
      responseHash: computeResponseHash(response),
      model: MODEL,
      latencyMs,
      citedUrls: [],
      timestamp: new Date().toISOString(),
    };
  }
}

export async function measureAll(options: MeasureOptions): Promise<MeasureResult[]> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const reps = options.reps ?? 3;
  const results: MeasureResult[] = [];

  // 1. Build Tier 1 question tasks
  const t1Tasks: QuestionTask[] = [];
  for (let rep = 1; rep <= reps; rep++) {
    for (const q of options.tier1Questions) {
      t1Tasks.push({
        tier: 'T1',
        questionId: q.id,
        question: q.bodyTemplate.replace(/\{unit\}/g, options.unitName),
        rep,
      });
    }
  }

  // 2. Build Tier 2 question tasks if provided
  const t2Tasks: QuestionTask[] = [];
  if (options.tier2Questions && options.tier2Questions.length > 0) {
    for (let rep = 1; rep <= reps; rep++) {
      for (const q of options.tier2Questions) {
        t2Tasks.push({
          tier: 'T2',
          questionId: q.id,
          question: q.body,
          rep,
        });
      }
    }
  }

  // 3. Build Tier 3 question tasks if provided
  const t3Tasks: QuestionTask[] = [];
  if (options.tier3Questions && options.tier3Questions.length > 0) {
    for (let rep = 1; rep <= reps; rep++) {
      for (const q of options.tier3Questions) {
        t3Tasks.push({
          tier: 'T3',
          questionId: q.id,
          question: q.body,
          rep,
        });
      }
    }
  }

  const totalCalls = t1Tasks.length + t2Tasks.length + t3Tasks.length;
  let completed = 0;

  // Helper to execute tasks for a specific tier in batches
  async function runTierBatches(tasks: QuestionTask[], tierName: string, isLastTier: boolean) {
    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(task => callOpenAI(client, task))
      );
      results.push(...batchResults);
      completed += batchResults.length;
      options.onProgress?.(completed, totalCalls, tierName);

      const hasMoreInTier = i + BATCH_SIZE < tasks.length;
      if (hasMoreInTier || !isLastTier) {
        await sleep(BATCH_DELAY_MS);
      }
    }
  }

  // Execute Tier 1 (15 × reps)
  const hasMoreAfterT1 = t2Tasks.length > 0 || t3Tasks.length > 0;
  await runTierBatches(t1Tasks, 'T1', !hasMoreAfterT1);

  // Execute Tier 2 (if provided, 20 × reps)
  if (t2Tasks.length > 0) {
    const hasMoreAfterT2 = t3Tasks.length > 0;
    await runTierBatches(t2Tasks, 'T2', !hasMoreAfterT2);
  }

  // Execute Tier 3 (if provided, 15 × reps)
  if (t3Tasks.length > 0) {
    await runTierBatches(t3Tasks, 'T3', true);
  }

  return results;
}
