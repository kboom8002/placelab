// app/api/weekly/[week]/route.ts
// §13: GET /api/weekly/[week]?population= (INV-1 광역·기초 분리, INV-15 미등장 지역 목록 미반환)
import { NextRequest, NextResponse } from 'next/server';
import {
  filterWeatherMapAppearingUnits,
  JEONGDAP_METHOD_VERSION,
  JEONGDAP_POPULATIONS,
} from '@/lib/jeongdap';

export async function GET(
  req: NextRequest,
  { params }: { params: { week: string } }
) {
  const { searchParams } = new URL(req.url);
  const population = searchParams.get('population');

  // INV-1: 모집단 인자 필수
  if (!population || !(JEONGDAP_POPULATIONS as readonly string[]).includes(population)) {
    return NextResponse.json(
      {
        error: 'INV-1 Violation: population 파라미터(metro | basic | special_zone)가 필수입니다.',
      },
      { status: 400 }
    );
  }

  const weekNum = parseInt(params.week.replace(/\D/g, ''), 10) || 1;
  const editionKind = weekNum % 2 === 0 ? 'defense' : 'active';

  return NextResponse.json({
    week: params.week,
    population,
    methodVersion: JEONGDAP_METHOD_VERSION,
    editionKind,
    appearingUnits: filterWeatherMapAppearingUnits([]),
  });
}
