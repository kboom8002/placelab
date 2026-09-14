// app/api/admin/reports/route.ts
// 관리자 시민 제보 검수 및 관리 API (FR-70, INV-6 준수)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getAllCitizenReports,
  updateCitizenReportStatus,
} from '@/lib/crowdsource/report-aggregator';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get('unitId') || undefined;
    const status = (searchParams.get('status') as any) || undefined;

    const reports = await getAllCitizenReports({ unitId, status });

    return NextResponse.json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  status: z
    .enum(['pending', 'qualified', 'approved', 'measuring', 'completed', 'rejected', 'merged'])
    .optional(),
  piiChecked: z.boolean().optional(),
  adminNote: z.string().optional(),
  mergedInto: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: '유효하지 않은 요청 데이터', details: parsed.error.format() }, { status: 400 });
    }

    const { id, status, piiChecked, adminNote, mergedInto } = parsed.data;

    const updated = await updateCitizenReportStatus(id, {
      status,
      pii_checked: piiChecked,
      admin_note: adminNote,
      merged_into: mergedInto,
    });

    if (!updated) {
      return NextResponse.json({ error: '해당 제보를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      report: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
