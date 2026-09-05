// app/api/units/route.ts
// SDD API 라우트: 단위 목록 조회 (INV-1 모집단 필터, INV-3 정렬 허용 목록)
import { NextRequest, NextResponse } from 'next/server';
import { getUnitsByPopulation } from '@/lib/db/units';
import { parseSort } from '@/lib/validators/sort-allowlist';
import { Population } from '@/lib/types/layers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const popParam = searchParams.get('population');
  
  if (!popParam) {
    return NextResponse.json({ error: 'population 파라미터는 필수입니다.' }, { status: 400 });
  }
  if (popParam !== 'local_gov' && popParam !== 'special_zone') {
    return NextResponse.json({ error: '유효하지 않은 population 값입니다.' }, { status: 400 });
  }

  const population = popParam as Population;

  const orderParam = searchParams.get('order');
  const sortParam = searchParams.get('sort');
  let sortField;
  try {
    sortField = parseSort(orderParam || sortParam);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

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
