// app/api/measure/status/[id]/route.ts
// 측정 진행 상태 조회 API
import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const measurementId = params.id;

  // 파일 기반 상태 조회 (Supabase 미연결 시 폴백)
  const statusFile = path.join(
    process.cwd(),
    'docs',
    'aeo-measurements',
    `${measurementId}.json`
  );

  if (!fs.existsSync(statusFile)) {
    return NextResponse.json(
      { error: 'Measurement not found', measurement_id: measurementId },
      { status: 404 }
    );
  }

  try {
    const data = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
    return NextResponse.json({
      measurement_id: measurementId,
      status: data.measurement?.status || 'unknown',
      progress: {
        completed: data.results?.length || 0,
        total: data.measurement?.total_queries || 0,
        current_tier: data.measurement?.current_tier || null,
      },
      errors: data.measurement?.error_count || 0,
      unit_name: data.measurement?.unit_name,
      started_at: data.measurement?.started_at,
      completed_at: data.measurement?.completed_at,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to read measurement data' },
      { status: 500 }
    );
  }
}
