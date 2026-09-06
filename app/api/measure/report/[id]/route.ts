// app/api/measure/report/[id]/route.ts
// 측정 보고서 조회 API
import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const measurementId = params.id;

  const dataFile = path.join(
    process.cwd(),
    'docs',
    'aeo-measurements',
    `${measurementId}.json`
  );

  if (!fs.existsSync(dataFile)) {
    return NextResponse.json(
      { error: 'Measurement not found', measurement_id: measurementId },
      { status: 404 }
    );
  }

  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

    if (data.measurement?.status !== 'completed') {
      return NextResponse.json(
        { error: 'Measurement not completed yet', status: data.measurement?.status },
        { status: 409 }
      );
    }

    // 보고서가 이미 생성되어 있으면 반환
    const reportFile = path.join(
      process.cwd(),
      'docs',
      'aeo-measurements',
      `${measurementId}-report.json`
    );

    if (fs.existsSync(reportFile)) {
      const report = JSON.parse(fs.readFileSync(reportFile, 'utf-8'));
      return NextResponse.json({ report });
    }

    // 보고서 미생성 시 원시 데이터와 함께 안내
    return NextResponse.json({
      report: null,
      message: 'Report not yet generated. Raw data available.',
      raw_stats: {
        total_observations: data.results?.length || 0,
        tiers: {
          T1: data.results?.filter((r: { tier: string }) => r.tier === 'T1').length || 0,
          T2: data.results?.filter((r: { tier: string }) => r.tier === 'T2').length || 0,
          T3: data.results?.filter((r: { tier: string }) => r.tier === 'T3').length || 0,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to read measurement data' },
      { status: 500 }
    );
  }
}
