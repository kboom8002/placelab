// app/api/reports/[slug]/download/route.ts
// 보고서 마크다운 및 실측 원자료 JSON 파일 다운로드 API

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getReportBySlug } from '@/lib/reports/diagnostic-reports';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const report = getReportBySlug(params.slug);
  if (!report) {
    return NextResponse.json({ error: '보고서를 찾을 수 없습니다' }, { status: 404 });
  }

  const format = request.nextUrl.searchParams.get('format') || 'md';

  try {
    if (format === 'json') {
      if (!report.jsonPath) {
        return NextResponse.json({ error: '해당 보고서는 JSON 원자료가 첨부되어 있지 않습니다' }, { status: 404 });
      }
      const jsonFullPath = path.resolve(process.cwd(), report.jsonPath);
      if (!fs.existsSync(jsonFullPath)) {
        return NextResponse.json({ error: 'JSON 파일을 찾을 수 없습니다' }, { status: 404 });
      }
      const jsonContent = fs.readFileSync(jsonFullPath, 'utf-8');
      const filename = path.basename(report.jsonPath);

      return new NextResponse(jsonContent, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Default: format === 'md'
    const mdFullPath = path.resolve(process.cwd(), report.reportPath);
    if (!fs.existsSync(mdFullPath)) {
      return NextResponse.json({ error: '마크다운 파일을 찾을 수 없습니다' }, { status: 404 });
    }
    const mdContent = fs.readFileSync(mdFullPath, 'utf-8');
    const filename = path.basename(report.reportPath);

    return new NextResponse(mdContent, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '서버 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
