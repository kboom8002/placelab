// app/api/units/route.ts
// SDD API 라우트: 단위 목록 조회 (INV-1 모집단 필터, INV-3 정렬 허용 목록)
import { NextRequest, NextResponse } from 'next/server';
import { getUnitsByPopulation } from '@/lib/db/units';
import { validateSortField } from '@/lib/validators/sort-allowlist';
import { Population } from '@/lib/types/layers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const popParam = searchParams.get('population') as Population;
  const population: Population = popParam === 'special_zone' ? 'special_zone' : 'local_gov';

  const sortParam = searchParams.get('sort');
  const sortField = validateSortField(sortParam); // INV-3 강제

  const units = await getUnitsByPopulation(population);

  // 정렬 수행 (허용된 필드만)
  units.sort((a, b) => {
    if (sortField === 'name') {
      return a.name.localeCompare(b.name, 'ko');
    }
    // 기본: sgg_code / unit_id
    const codeA = a.sgg_code || a.unit_id;
    const codeB = b.sgg_code || b.unit_id;
    return codeA.localeCompare(codeB);
  });

  return NextResponse.json({
    population,
    count: units.length,
    sort: sortField,
    units,
  });
}
