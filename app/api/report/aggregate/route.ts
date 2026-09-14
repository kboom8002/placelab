// app/api/report/aggregate/route.ts
// 시민 제보 집계 대시보드 데이터 API (INV-1, INV-3, INV-4 준수)

import { NextRequest, NextResponse } from 'next/server';
import { aggregateReports } from '@/lib/crowdsource/report-aggregator';
import type { Population } from '@/lib/types/layers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const populationParam = searchParams.get('population');

    // INV-1: population 인자 필수 검증 (기본값으로 두지 않고 명시 강제)
    if (!populationParam || (populationParam !== 'local_gov' && populationParam !== 'special_zone')) {
      return NextResponse.json(
        {
          error:
            '모집단(population: "local_gov" 또는 "special_zone") 파라미터는 필수입니다. AGENTS.md INV-1 참조.',
        },
        { status: 400 }
      );
    }

    const population: Population = populationParam as Population;

    // 집계 실행 (INV-1, INV-3, INV-4가 aggregateReports 내에서 강제됨)
    const { stat, clusters } = await aggregateReports({ population });

    return NextResponse.json({
      success: true,
      population,
      stat,
      clusters,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '집계 처리 중 오류 발생' },
      { status: 500 }
    );
  }
}
