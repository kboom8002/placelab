// app/api/join/vote/route.ts
// §13 & FR-85 & FR-92: POST /api/join/vote (다음 주 질문 후보 시민 투표 접수 · 공식 지표와 비합산 INV-4)
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const candidateId = String(body?.candidateId ?? '').trim();

    if (!candidateId) {
      return NextResponse.json(
        { error: '투표할 질문 후보 ID(candidateId)가 필요합니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        candidateId,
        note: '시민 투표 신호는 다음 주 질문 선정에만 활용되며 공식 근거율·피해 위험 지표와 합산하지 않습니다 (INV-4).',
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }
}
