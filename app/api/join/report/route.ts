// app/api/join/report/route.ts
// §13 & INV-18: POST /api/join/report (범위 제외 대상 차단 + 개인정보 마스킹 후 검수 대기 큐 적재)
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

    if (!questionText) {
      return NextResponse.json(
        { error: '신고할 질문 또는 오답 내용을 입력해 주세요.' },
        { status: 400 }
      );
    }

    // INV-18: 정부 입장 · 재난·응급 · 개별 영리 업소 신고 접수 단계 차단
    const scopeCheck = validateCitizenReportScope({ scopeCategory, questionText });
    if (!scopeCheck.allowed) {
      return NextResponse.json({ error: scopeCheck.reason }, { status: 422 });
    }

    const sanitizedQuestion = maskPii(questionText);

    return NextResponse.json(
      {
        ok: true,
        status: 'pending_review',
        sanitizedQuestion,
        message: '신고가 비공개 검수 대기열에 접수되었습니다. 개인정보 및 정본 대조 검수 후 반영됩니다.',
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }
}
