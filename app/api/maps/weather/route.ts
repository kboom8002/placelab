// app/api/maps/weather/route.ts
// §13 & INV-15: GET /api/maps/weather (안정·신규만 반환하며 미등장 지역 목록·SoV·첫 셋 절대 미반환)
import { NextResponse } from 'next/server';
import { filterWeatherMapAppearingUnits, JEONGDAP_METHOD_VERSION } from '@/lib/jeongdap';

export async function GET() {
  const appearingUnits = filterWeatherMapAppearingUnits([]);

  return NextResponse.json({
    methodVersion: JEONGDAP_METHOD_VERSION,
    allowedStates: ['안정', '신규'],
    appearingUnits,
  });
}
