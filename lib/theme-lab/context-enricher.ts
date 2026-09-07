// lib/theme-lab/context-enricher.ts
// Policy Theme Lab (PRD v3.0 §8) 중립적 맥락 보완 모듈
// 주민의 질문/불편 원문에서 유도 없이 상황·과업·막힘을 묻는 후속 질문 제안

export interface FollowupPrompt {
  questionText: string;
  targetField: 'intended_task' | 'blocked_at' | 'already_checked' | 'resolution_status';
  isSynthetic: boolean;
}

/**
 * PRD §8 가이드라인에 따른 중립적 후속 질문 세트 생성
 * 특정 불만이나 정책 실패를 예단하지 않고 사실적 맥락만 확인
 */
export function generateNeutralFollowupQuestions(
  rawText: string,
  inputType: string
): FollowupPrompt[] {
  const prompts: FollowupPrompt[] = [];

  if (inputType === 'experience' || rawText.includes('못했') || rawText.includes('어려')) {
    prompts.push({
      questionText: '당시 어떤 일(신청, 방문, 확인 등)을 진행하려고 하셨나요?',
      targetField: 'intended_task',
      isSynthetic: false,
    });
    prompts.push({
      questionText: '진행 과정 중 어느 단계(안내문 확인, 서류 준비, 창구 상담 등)에서 막힘이 있었나요?',
      targetField: 'blocked_at',
      isSynthetic: false,
    });
    prompts.push({
      questionText: '해당 문의나 신청은 이후 어떻게 처리되었나요? (해결됨 / 아직 미해결 / 다른 방법 이용)',
      targetField: 'resolution_status',
      isSynthetic: false,
    });
  } else if (inputType === 'comparison') {
    prompts.push({
      questionText: '두 대상(지역이나 제도)을 비교하실 때 가장 중요하게 보시는 조건은 무엇인가요?',
      targetField: 'intended_task',
      isSynthetic: false,
    });
    prompts.push({
      questionText: '어느 기관이나 웹사이트의 자료를 주로 참고하셨나요?',
      targetField: 'already_checked',
      isSynthetic: false,
    });
  } else {
    // 일반 질문 (question)
    prompts.push({
      questionText: '어떤 상황이나 목적에서 이 정보를 찾고 계신가요?',
      targetField: 'intended_task',
      isSynthetic: false,
    });
    prompts.push({
      questionText: '시청/군청 홈페이지나 포털 검색 등에서 이미 확인해보신 내용이 있으신가요?',
      targetField: 'already_checked',
      isSynthetic: false,
    });
  }

  return prompts.slice(0, 3); // 최대 3개로 피로도 최소화 (PRD §8 권고)
}
