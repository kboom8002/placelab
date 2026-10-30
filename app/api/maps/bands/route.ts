// app/api/maps/bands/route.ts
// §13: GET /api/maps/bands?population= (INV-1 모집단 필수, INV-3 구간 내 가나다순, INV-17 2027-03 게이트)
import { NextRequest, NextResponse } from 'next/server';
import {
  canPublishNamedUnitMetrics,
  groupAndSortBandEntries,
  JEONGDAP_POPULATIONS,
  PUBLICATION_STATE_LABELS,
  UNMEASURED_REGION_NOTICE,
} from '@/lib/jeongdap';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const population = searchParams.get('population');

  if (!population || !(JEONGDAP_POPULATIONS as readonly string[]).includes(population)) {
    return NextResponse.json(
      {
        error: 'INV-1 Violation: population 파라미터(metro | basic | special_zone)가 필수입니다.',
      },
      { status: 400 }
    );
  }

  const nowIso = new Date().toISOString().slice(0, 10);
  if (!canPublishNamedUnitMetrics(nowIso)) {
    return NextResponse.json(
      {
        population,
        publicationState: PUBLICATION_STATE_LABELS.before_measurement,
        message: UNMEASURED_REGION_NOTICE,
        bands: groupAndSortBandEntries([], population as 'metro' | 'basic'),
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    population,
    publicationState: PUBLICATION_STATE_LABELS.before_measurement,
    bands: groupAndSortBandEntries([], population as 'metro' | 'basic'),
  });
}
