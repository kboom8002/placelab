// app/api/export/layer1/route.ts
// FR-10: Layer 1 공개 데이터 CSV/JSON 내보내기
import { NextRequest, NextResponse } from 'next/server';
import { getUnitsByPopulation } from '@/lib/db/units';
import { CURRENT_METHOD_VERSION } from '@/lib/constants/measurement';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'json';

  const localGov = await getUnitsByPopulation('local_gov');
  const specialZone = await getUnitsByPopulation('special_zone');

  const allData = [
    ...localGov.map((u) => ({
      unit_id: u.unit_id,
      name: u.name,
      population: u.population,
      sgg_code: u.sgg_code || '',
      host: u.host || '',
      robots_verdict: u.robots_verdict || 'undetermined',
      undetermined_reason: u.undetermined_reason || '',
      consecutive_weeks: u.consecutive_weeks || 0,
      confirmed_at: u.confirmed_at || '',
      method_version: CURRENT_METHOD_VERSION,
    })),
    ...specialZone.map((u) => ({
      unit_id: u.unit_id,
      name: u.name,
      population: u.population,
      sgg_code: u.sgg_code || '',
      host: u.host || '',
      robots_verdict: u.robots_verdict || 'undetermined',
      undetermined_reason: u.undetermined_reason || '',
      consecutive_weeks: u.consecutive_weeks || 0,
      confirmed_at: u.confirmed_at || '',
      method_version: CURRENT_METHOD_VERSION,
    })),
  ];

  if (format === 'csv') {
    const headers = [
      'unit_id',
      'name',
      'population',
      'sgg_code',
      'host',
      'robots_verdict',
      'undetermined_reason',
      'consecutive_weeks',
      'confirmed_at',
      'method_version',
    ];

    const rows = allData.map((d) =>
      headers
        .map((h) => {
          const val = (d as any)[h];
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="kplacelab_layer1_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    method_version: CURRENT_METHOD_VERSION,
    total_count: allData.length,
    data: allData,
  });
}
