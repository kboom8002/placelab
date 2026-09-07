// app/api/theme-lab/submissions/route.ts
// Policy Theme Lab 주민 질문/불편 접수 API (FR-61, FR-62)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateNeutralFollowupQuestions } from '@/lib/theme-lab/context-enricher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      rawText,
      unitId,
      inputType = 'question',
      isRealExperience = true,
      contactEmail,
      intendedTask,
      blockedAt,
      alreadyChecked,
      resolutionStatus = 'unresolved',
    } = body;

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 5) {
      return NextResponse.json(
        { error: '질문 또는 불편 내용을 최소 5자 이상 입력해주세요.' },
        { status: 400 }
      );
    }

    // 중립 후속 질문 생성 (PRD §8)
    const followupPrompts = generateNeutralFollowupQuestions(rawText, inputType);

    // Supabase DB 저장 시도
    let savedId = 'temp-' + Date.now();
    try {
      const supabase = await createClient();
      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .insert({
          raw_text: rawText.trim(),
          unit_id: unitId || null,
          input_type: inputType,
          source_type: 'citizen',
          is_real_experience: !!isRealExperience,
          consent_scope: 'internal',
          contact_email: contactEmail || null,
        })
        .select('id')
        .single();

      if (!subError && subData) {
        savedId = subData.id;

        // 맥락 정보 저장
        await supabase.from('submission_contexts').insert({
          submission_id: savedId,
          intended_task: intendedTask || null,
          blocked_at: blockedAt || null,
          already_checked: alreadyChecked || null,
          resolution_status: resolutionStatus,
          followup_questions: followupPrompts,
          confirmed_by_participant: false,
        });
      }
    } catch (dbErr) {
      console.warn('DB 저장 생략 (환경변수 미설정 또는 오프라인 모드):', dbErr);
    }

    return NextResponse.json({
      success: true,
      submissionId: savedId,
      message: '주민님의 소중한 질문/의견이 접수되었습니다. (공식 민원 처리가 아닌 정책 연구 및 AI 진단 문항 발굴 목적으로 활용됩니다.)',
      followupPrompts,
    });
  } catch (err) {
    console.error('Submission API Error:', err);
    return NextResponse.json({ error: '요청 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
