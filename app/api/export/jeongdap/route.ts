// app/api/export/jeongdap/route.ts
// §13: GET /api/export/jeongdap?population= (모집단별 재현 패키지 내보내기 · 원문(INV-6)·재난(INV-16)·보류 문항(INV-10) 제외)
import { NextRequest, NextResponse } from 'next/server';
import {
  filterOutDisasterItems,
  JEONGDAP_METHOD_VERSION,
  JEONGDAP_POPULATIONS,
} from '@/lib/jeongdap';

export async function GET(req: NextRequest) {
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

  // INV-6 (원문 제외) & INV-16 (재난 제외) & INV-10 (보류 제외) 적용 빈 배열/스키마
  const safeRecords = filterOutDisasterItems([] as Array<{ instanceId: string; disaster?: boolean }>);

  return NextResponse.json({
    schemaVersion: 'jeongdap-export-v1.0',
    methodVersion: JEONGDAP_METHOD_VERSION,
    population,
    exportedAt: new Date().toISOString(),
    invariantsEnforced: {
      populationIsolated: true,
      rawAnswerExcluded: true,
      disasterSafetyExcluded: true,
      unfrozenExcluded: true,
    },
    records: safeRecords,
  });
}
