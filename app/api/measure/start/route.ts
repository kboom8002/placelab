// app/api/measure/start/route.ts
// 측정 시작 API — 시뮬레이션 모드 (API 키 미설정 시)
// 실제 구현은 OpenAI/Gemini/Perplexity API 키 설정 후 활성화

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const StartSchema = z.object({
  unit_id: z.string().min(1),
  unit_name: z.string().min(1),
  mode: z.enum(['quick', 'full']),
  options: z.object({
    competition: z.boolean().default(false),
    personas: z.array(z.string()).default(['P1','P2','P3','P4','P5','P6']),
  }).default({}),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = StartSchema.parse(body);

    // API 키 확인
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGemini = !!process.env.GOOGLE_AI_API_KEY;
    const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;

    const isSimulation = !hasOpenAI;

    // 측정 ID 생성
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 8);
    const measurementId = `m-${timestamp}-${parsed.unit_id.replace('lg-', '')}-${random}`;

    // 퀵 모드: 35문항 × 1회, 완전 모드: 35문항 × 5회 × 3서비스
    const questionCount = parsed.options.personas.length > 0
      ? parsed.options.personas.reduce((acc, p) => {
          const counts: Record<string, number> = { P1: 6, P2: 7, P3: 6, P4: 5, P5: 5, P6: 6 };
          return acc + (counts[p] || 0);
        }, 0)
      : 35;

    const totalQueries = parsed.mode === 'quick'
      ? questionCount
      : questionCount * 5 * 3;

    const estimatedSeconds = parsed.mode === 'quick' ? 120 : 600;

    return NextResponse.json({
      measurement_id: measurementId,
      unit_id: parsed.unit_id,
      unit_name: parsed.unit_name,
      mode: parsed.mode,
      simulation: isSimulation,
      total_queries: totalQueries,
      question_count: questionCount,
      estimated_seconds: estimatedSeconds,
      services: parsed.mode === 'quick'
        ? ['chatgpt']
        : ['chatgpt', 'gemini', 'perplexity'],
      options: parsed.options,
      started_at: new Date().toISOString(),
      // 측정 조건 (INV-7 필수)
      method_version: 'v2.0',
      web_search: 'on',
      language: 'ko',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
