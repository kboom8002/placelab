// lib/theme-lab/followup-generator.ts
// Policy Theme Lab (PRD v3.0 §21) 진단 결과 기반 후속 질문 자동 생성기
// PlaceLab AEO 실측의 오답·누락·출처부재 패턴에서 다음 탐색 질문 도출

export interface FollowupQuestionCandidate {
  originQuestionId: string;
  syndromeType: 'absent' | 'outdated_or_wrong' | 'source_missing' | 'generic' | 'confabulation';
  followupPrompt: string;
  recommendedLifeTopic: string;
  recommendedTaskStage: string;
  rationale: string;
}

/**
 * PRD §21 5가지 탐색 규칙에 기반하여 진단 결과로부터 후속 질문 생성
 */
export function generateFollowupQuestionsFromResults(
  unitName: string,
  questionId: string,
  questionText: string,
  verdict: string,
  groundTruth?: string,
  responseExcerpt?: string
): FollowupQuestionCandidate | null {
  // 1. 답이 빠진 부분 (absent)
  if (verdict === 'absent' || (responseExcerpt && responseExcerpt.length < 15)) {
    return {
      originQuestionId: questionId,
      syndromeType: 'absent',
      followupPrompt: `${unitName}에서 "${questionText.replace(unitName, '').trim()}" 관련하여 홈페이지 어디 메뉴나 어느 담당 부서로 문의해야 정확한 절차를 알 수 있나요?`,
      recommendedLifeTopic: 'civic_admin',
      recommendedTaskStage: 'application',
      rationale: 'AI 모델이 해당 질문에 침묵함 → 주민이 실제로 다음 창구를 찾을 수 있는 안내 질문으로 확장',
    };
  }

  // 2. 수치 오류 또는 구버전 (wrong_value, outdated)
  if (verdict === 'wrong_value' || verdict === 'outdated') {
    return {
      originQuestionId: questionId,
      syndromeType: 'outdated_or_wrong',
      followupPrompt: `${unitName}의 최근 변경된 공식 조례나 지침 기준으로 볼 때, 해당 지원금이나 요금의 정확한 기준일과 예외 조건은 무엇인가요?`,
      recommendedLifeTopic: 'care',
      recommendedTaskStage: 'understanding',
      rationale: `공식 정답(${groundTruth || '확인필요'})과 AI 답변 간 불일치 발생 → 조례 개정 시점과 적용 예외 조건을 확인하는 질문 생성`,
    };
  }

  // 3. 범용 답변 (generic)
  if (verdict === 'accurate_generic') {
    return {
      originQuestionId: questionId,
      syndromeType: 'generic',
      followupPrompt: `${unitName}만의 독자적인 특화 정책이나 타 시·군과 차별화되는 구체적 혜택 내용은 무엇인가요?`,
      recommendedLifeTopic: 'work',
      recommendedTaskStage: 'comparison',
      rationale: '원론적인 일반론 답변만 제시됨 → 지역만의 고유한 혜택이나 특화 지점을 묻는 질문으로 구체화',
    };
  }

  return null;
}
