// app/api/aeo/ground-truth/route.ts
// 지자체별 사실 원장(Ground Truth) 조회 및 관리자 입력/저장 API (§8.2, INV-7)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { loadGroundTruth, saveCustomGroundTruth } from '@/lib/measurement/ground-truth-loader';

const SaveGtSchema = z.object({
  agency_handle: z.string().min(1, '기관 식별자가 필요합니다.'),
  entries: z.record(
    z.object({
      targetValue: z.string().min(1, '원장 정답 값이 필요합니다.'),
      acceptableVariants: z.array(z.string()).optional(),
    })
  ),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agency = searchParams.get('agency');

  if (!agency) {
    return NextResponse.json(
      { ok: false, error: 'agency 쿼리 파라미터가 필요합니다.' },
      { status: 400 }
    );
  }

  const result = loadGroundTruth(agency);
  const itemsObj: Record<string, any> = {};
  result.items.forEach((item, k) => {
    itemsObj[k] = item;
  });

  return NextResponse.json({
    ok: true,
    agency,
    sourcePath: result.sourcePath,
    itemsCount: result.itemsCount,
    items: itemsObj,
    rawEntries: result.rawEntries || {},
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SaveGtSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { agency_handle, entries } = parsed.data;
    const savedPath = await saveCustomGroundTruth(agency_handle, entries);

    return NextResponse.json({
      ok: true,
      message: 'Ground Truth 원장이 성공적으로 저장되었습니다.',
      agency_handle,
      savedPath,
      entriesCount: Object.keys(entries).length,
    });
  } catch (err: any) {
    console.error('[API /api/aeo/ground-truth] 저장 오류:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Ground Truth 저장 실패' },
      { status: 500 }
    );
  }
}
