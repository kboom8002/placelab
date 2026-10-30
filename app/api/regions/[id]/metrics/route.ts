// app/api/regions/[id]/metrics/route.ts
// §13: GET /api/regions/[id]/metrics (PublicMetricPair + RoundStamp; 2027-03 이전 403 측정 전 · INV-14 · INV-17)
import { NextRequest, NextResponse } from 'next/server';
import {
  canPublishNamedUnitMetrics,
  UNMEASURED_REGION_NOTICE,
  PUBLICATION_STATE_LABELS,
} from '@/lib/jeongdap';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const unitId = params.id;
  const nowIso = new Date().toISOString().slice(0, 10);

  // INV-17: 2027-03 이전에는 이름 붙은 단위 수치를 공개하지 않고 「측정 전」 반환
  if (!canPublishNamedUnitMetrics(nowIso)) {
    return NextResponse.json(
      {
        unitId,
        publicationState: PUBLICATION_STATE_LABELS.before_measurement,
        message: UNMEASURED_REGION_NOTICE,
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    unitId,
    publicationState: PUBLICATION_STATE_LABELS.before_measurement,
    metrics: null,
    roundStamp: null,
  });
}
