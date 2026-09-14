// app/api/measure/run/route.ts
// 웹 UI 기반 측정 작업 등록 POST API (§8.2, INV-7)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createMeasureJob } from '@/lib/measurement/job-manager';
import { findAgencyByHandle, findAgencyByDisplay } from '@/lib/measurement/registries';

const RunMeasureSchema = z.object({
  agency_handle: z.string().min(1, '지자체 식별자가 필요합니다.'),
  agency_name: z.string().optional(),
  providers: z.array(z.enum(['gemini', 'openai'])).min(1, '하나 이상의 AI 모델을 선택해야 합니다.'),
  models: z.record(z.string()).optional(),
  question_set: z.enum(['core', 'custom']).default('core'),
  repetitions: z.number().int().min(1).max(5).default(3),
  channel: z.enum(['national_report', 'agency_notice', 'anonymized_dataset']).default('agency_notice'),
  simulation: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RunMeasureSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 기관 검증 및 이름 보완
    const agencyEntry = findAgencyByHandle(data.agency_handle) || findAgencyByDisplay(data.agency_handle);
    const agencyName = data.agency_name || agencyEntry?.display || data.agency_handle;
    const agencyHandle = agencyEntry?.handle || data.agency_handle;

    // 환경 변수 검증 (시뮬레이션이 아닐 때)
    if (!data.simulation) {
      const missingKeys: string[] = [];
      if (data.providers.includes('gemini') && !process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        missingKeys.push('GEMINI_API_KEY');
      }
      if (data.providers.includes('openai') && !process.env.OPENAI_API_KEY) {
        missingKeys.push('OPENAI_API_KEY');
      }

      if (missingKeys.length > 0) {
        return NextResponse.json(
          {
            ok: false,
            error: `선택한 모델을 실행하기 위한 환경 변수가 설정되지 않았습니다: ${missingKeys.join(', ')}`,
            missingKeys,
          },
          { status: 422 }
        );
      }
    }

    const job = await createMeasureJob({
      agencyHandle,
      agencyName,
      providers: data.providers,
      models: data.models,
      questionSet: data.question_set,
      repetitions: data.repetitions,
      channel: data.channel,
      simulation: data.simulation,
    });

    return NextResponse.json({
      ok: true,
      job_id: job.id,
      agency: {
        handle: agencyHandle,
        name: agencyName,
      },
      stream_url: `/api/measure/stream/${job.id}`,
    });
  } catch (err: any) {
    console.error('[API /api/measure/run] 오류:', err);
    return NextResponse.json(
      { ok: false, error: err.message || '작업 등록 중 서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
