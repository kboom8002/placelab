// app/api/admin/promotions/route.ts
// 관리자 승격 엔진 제어 및 Layer 3 검증 실행 API (FR-72, INV-8, INV-11)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getPromotionQueue,
  evaluatePromotionCandidates,
  queuePromotionCandidate,
  approveAndExecutePromotion,
} from '@/lib/crowdsource/promotion-engine';

/**
 * GET: 승격 큐 목록 및 대기 중인 신규 후보 조회
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') as any) || undefined;
    const unitId = searchParams.get('unitId') || undefined;

    const queueItems = await getPromotionQueue({ status, unitId });
    const pendingCandidates = await evaluatePromotionCandidates();

    return NextResponse.json({
      success: true,
      queue: queueItems,
      pendingCandidates,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

const queueCandidateSchema = z.object({
  action: z.literal('queue_candidate'),
  candidate: z.object({
    unitId: z.string(),
    unitName: z.string(),
    triggerReports: z.array(z.string()),
    triggerCount: z.number(),
    triggerSyndrome: z.enum([
      'confabulation',
      'stale_fact',
      'generic_drift',
      'cross_unit',
      'wrong_number',
      'other',
    ]),
    probePrompt: z.string(),
    probeCategory: z.string().optional(),
    priority: z.number(),
    reason: z.string(),
  }),
});

const executePromotionSchema = z.object({
  action: z.literal('execute_promotion'),
  queueId: z.string(),
  providers: z.array(z.enum(['gemini', 'openai'])).default(['gemini']),
  simulation: z.boolean().default(false),
  adminPromptOverride: z.string().optional(),
});

const actionSchema = z.discriminatedUnion('action', [
  queueCandidateSchema,
  executePromotionSchema,
]);

/**
 * POST: 승격 후보 큐 등록 또는 Layer 3 검증 실행
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = actionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '요청 유효성 검증 실패', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.action === 'queue_candidate') {
      const item = await queuePromotionCandidate(data.candidate);
      return NextResponse.json({
        success: true,
        message: '승격 후보가 큐에 등록되었습니다.',
        item,
      });
    }

    if (data.action === 'execute_promotion') {
      const result = await approveAndExecutePromotion(data.queueId, {
        providers: data.providers,
        simulation: data.simulation,
        adminPromptOverride: data.adminPromptOverride,
      });

      return NextResponse.json({
        success: true,
        message: '승격 검증이 시작되었습니다. Layer 3 러너가 실행 중입니다.',
        queueItem: result.queueItem,
        measureJobId: result.measureJobId,
      });
    }

    return NextResponse.json({ error: '알 수 없는 동작입니다.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
