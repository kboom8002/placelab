// app/api/regions/route.ts
// §13: GET /api/regions?population= (INV-1 모집단 필수, INV-3 정렬 허용 목록 code/name)
import { NextRequest, NextResponse } from 'next/server';
import { getUnitsByPopulation } from '@/lib/db/units';
import { parseSort } from '@/lib/validators/sort-allowlist';
import { JEONGDAP_POPULATIONS } from '@/lib/jeongdap';
import { Population } from '@/lib/types/layers';
import { loadGazetteerWith2026IncheonReorg } from '@/scripts/jeongdap/import-seed-data';

const ALLOWED_POPULATIONS = [...JEONGDAP_POPULATIONS, 'local_gov'] as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const populationParam = searchParams.get('population');
  const orderParam = searchParams.get('order') ?? 'sgg_code';

  // INV-1: 모집단 인자 필수
  if (!populationParam || !ALLOWED_POPULATIONS.includes(populationParam as any)) {
    return NextResponse.json(
      {
        error:
          'INV-1 Violation: population 파라미터(metro | basic | special_zone | local_gov)가 필수입니다.',
      },
      { status: 400 }
    );
  }

  // INV-3: 점수·측정값 정렬 거부 (code/sgg_code | name 만 허용)
  let sortCol: string;
  try {
    sortCol = parseSort(orderParam === 'code' ? 'sgg_code' : orderParam);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '허용되지 않는 정렬 필드입니다.' },
      { status: 400 }
    );
  }

  if (populationParam === 'metro' || populationParam === 'basic') {
    const gazRows = loadGazetteerWith2026IncheonReorg();
    const activeUnits = gazRows.filter((u) => u.active && u.population === populationParam);

    const sorted = [...activeUnits].sort((a, b) => {
      if (sortCol === 'name') {
        return a.name.localeCompare(b.name, 'ko-KR');
      }
      return a.unitId.localeCompare(b.unitId, 'ko-KR');
    });

    return NextResponse.json({
      population: populationParam,
      order: sortCol,
      count: sorted.length,
      units: sorted.map((u) => ({
        unitId: u.unitId,
        name: u.name,
        short: u.short,
        sido: u.sido,
        unitType: u.unitKind,
        sggCode: u.unitId,
        host: u.officialDomain,
      })),
    });
  }

  const dbPopulation: Population =
    populationParam === 'local_gov' || populationParam === 'special_zone'
      ? (populationParam as Population)
      : 'local_gov';

  const units = await getUnitsByPopulation(dbPopulation);

  const sorted = [...units].sort((a, b) => {
    if (sortCol === 'name') {
      return a.name.localeCompare(b.name, 'ko-KR');
    }
    return (a.sgg_code ?? a.unit_id).localeCompare(b.sgg_code ?? b.unit_id, 'ko-KR');
  });

  return NextResponse.json({
    population: populationParam,
    order: sortCol,
    count: sorted.length,
    units: sorted.map((u) => ({
      unitId: u.unit_id,
      name: u.name,
      unitType: u.unit_type,
      sggCode: u.sgg_code,
      host: u.host,
    })),
  });
}
