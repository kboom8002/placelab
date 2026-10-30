// app/api/join/suggest/route.ts
// §13 & FR-92 & INV-18: POST /api/join/suggest (다음 주 질문 제안 접수 · 범위 제외 차단 · 개인정보 마스킹)
import { NextRequest, NextResponse } from 'next/server';
import { validateCitizenReportScope } from '@/lib/jeongdap';

const PHONE_RE = /01[016789]-?\d{3,4}-?\d{4}/g;
const RRN_RE = /\d{6}-?[1-4]\d{6}/g;

function maskPii(text: string): string {
  return text.replace(RRN_RE, '[주민번호 마스킹]').replace(PHONE_RE, '[연락처 마스킹]');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const questionText = String(body?.questionText ?? '').trim();
    const scopeCategory = body?.scopeCategory ? String(body.scopeCategory) : undefined;
    const categoryCode = body?.categoryCode ? String(body.categoryCode) : 'general';

    if (!questionText || questionText.length < 5) {
      return NextResponse.json(
        { error: '제안할 질문을 5자 이상 입력해 주세요.' },
        { status: 400 }
      );
    }

    const scopeCheck = validateCitizenReportScope({ scopeCategory, questionText });
    if (!scopeCheck.allowed) {
      return NextResponse.json({ error: scopeCheck.reason }, { status: 422 });
    }

    const sanitizedQuestion = maskPii(questionText);

    return NextResponse.json(
      {
        ok: true,
        status: 'pending_review',
        categoryCode,
        sanitizedQuestion,
        message: '질문 제안이 접수되었습니다. 개인정보 검수(approved=true) 후 주간 질문 투표 후보군에 등록됩니다.',
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }
}
