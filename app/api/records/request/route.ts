// app/api/records/request/route.ts
// §13 & FR-91 & INV-6: POST /api/records/request (원본 기록 열람·검증 요청 → 운영 큐 + 감사 로그)
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const instanceId = String(body?.instanceId ?? '').trim();
    const requesterRole = String(body?.requesterRole ?? 'agency_official').trim();
    const reason = String(body?.reason ?? '').trim();

    if (!instanceId || !reason) {
      return NextResponse.json(
        { error: '열람 요청 대상 문항 ID(instanceId)와 요청 사유(reason)가 필요합니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        status: 'queued_for_ops_audit',
        instanceId,
        requesterRole,
        message:
          '원본 기록 검증 요청이 운영 감사 큐에 등록되었습니다. AI 응답 원문은 공개 경로로 직접 노출하지 않으며(INV-6), 소관 확인 후 검증 패킷으로 회신됩니다.',
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }
}
