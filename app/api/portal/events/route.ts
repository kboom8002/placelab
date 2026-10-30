// app/api/portal/events/route.ts
// §13 & FR-87 & INV-4: 지자체 포털 정비 사건(F·T·Q·D·U·A·S·L·N)·알리기 사건(M·E·P·G·R·W)·선언표 등록 API
import { NextRequest, NextResponse } from 'next/server';
import {
  REPAIR_EVENT_ACTIVE_CODES,
  REPAIR_EVENT_DEFENSE_CODES,
} from '@/lib/jeongdap';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const unitId = String(body?.unitId ?? '').trim();
    const eventTrack = String(body?.eventTrack ?? 'defense').trim(); // 'defense' | 'active' | 'declaration'
    const typeCode = String(body?.typeCode ?? '').trim().toUpperCase();
    const targetUrl = String(body?.targetUrl ?? '').trim();

    if (!unitId || !targetUrl) {
      return NextResponse.json(
        { error: '기관 ID(unitId)와 대상 공식 URL(targetUrl)이 필수입니다.' },
        { status: 400 }
      );
    }

    if (eventTrack === 'defense') {
      if (!(typeCode in REPAIR_EVENT_DEFENSE_CODES)) {
        return NextResponse.json(
          { error: `유효하지 않은 방어 정비 코드입니다. 허용 코드: ${Object.keys(REPAIR_EVENT_DEFENSE_CODES).join(', ')}` },
          { status: 400 }
        );
      }
    } else if (eventTrack === 'active') {
      if (!(typeCode in REPAIR_EVENT_ACTIVE_CODES)) {
        return NextResponse.json(
          { error: `유효하지 않은 능동 알리기 코드입니다. 허용 코드: ${Object.keys(REPAIR_EVENT_ACTIVE_CODES).join(', ')}` },
          { status: 400 }
        );
      }
    }

    const now = Date.now();
    const remeasure2w = new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const remeasure6w = new Date(now + 42 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    return NextResponse.json(
      {
        ok: true,
        unitId,
        eventTrack,
        typeCode,
        targetUrl,
        scheduledRemeasurements: {
          plus2Weeks: remeasure2w,
          plus6Weeks: remeasure6w,
        },
        denominatorNotice: '포털 등록 통계는 항상 "등록한 N곳 중"으로만 표기됩니다 (INV-4).',
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }
}
