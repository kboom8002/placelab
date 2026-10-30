// lib/maps/core/copy-lint.ts
// MAPS 카피·리포트 금칙어 및 보증/가상/가정 표기 검증기
// 근거: ADR-0026, ADR-0027, INV-3, INV-12, MAPS-INV-06, MAPS-INV-10, MAPS-INV-15, MAPS-INV-18

import { FORBIDDEN_WORDS } from '@/lib/constants/measurement';

/**
 * MAPS 추가 금지 표현 (제3자 AI 답변 통제·보장 암시 문구)
 */
export const MAPS_EXTRA_FORBIDDEN_PHRASES = [
  '답변 변경 보장',
  'AI 답변 보장',
  '100% 반영 보장',
  '추천 보장',
  '첫 줄 보장',
  '단독 1위',
] as const;

export interface LintMapsCopyOptions {
  /** 가상 샘플 리포트인 경우 '[가상]' 표기 포함 의무 (MAPS-INV-15) */
  isFictionalSample?: boolean;
  /** 가격 가정(미확정) 안내 문구인 경우 '[가정]' 표기 포함 의무 (INV-12, MAPS-INV-10) */
  isUnconfirmedPricingCopy?: boolean;
  /** 대조군 없는 전후 관측 리포트인 경우 인과 단정("개입 효과로 확정") 차단 (MAPS-INV-07) */
  hasValidControlGroup?: boolean;
}

export interface LintMapsCopyResult {
  passed: boolean;
  violations: Array<{
    code:
      | 'FORBIDDEN_WORD'
      | 'MAPS_GUARANTEE_CLAIM'
      | 'MISSING_FICTIONAL_BADGE'
      | 'MISSING_ASSUMPTION_BADGE'
      | 'UNCONTROLLED_CAUSAL_CLAIM';
    matchedTerm: string;
    messageKo: string;
  }>;
}

export function lintMapsCopy(
  text: string,
  options: LintMapsCopyOptions = {}
): LintMapsCopyResult {
  const violations: LintMapsCopyResult['violations'] = [];

  for (const word of FORBIDDEN_WORDS) {
    if (text.includes(word)) {
      violations.push({
        code: 'FORBIDDEN_WORD',
        matchedTerm: word,
        messageKo: `금칙어("${word}")가 포함되어 있습니다 (INV-3 / AGENTS.md §4).`,
      });
    }
  }

  for (const phrase of MAPS_EXTRA_FORBIDDEN_PHRASES) {
    if (text.includes(phrase)) {
      violations.push({
        code: 'MAPS_GUARANTEE_CLAIM',
        matchedTerm: phrase,
        messageKo: `제3자 AI 답변 통제·보증을 암시하는 표현("${phrase}")은 금지됩니다 (MAPS-INV-06/18).`,
      });
    }
  }

  if (options.isFictionalSample && !text.includes('[가상]')) {
    violations.push({
      code: 'MISSING_FICTIONAL_BADGE',
      matchedTerm: '[가상]',
      messageKo:
        '가상 샘플 리포트에는 반드시 "[가상]" 배지 표기가 포함되어야 합니다 (MAPS-INV-15).',
    });
  }

  if (options.isUnconfirmedPricingCopy && !text.includes('[가정]')) {
    violations.push({
      code: 'MISSING_ASSUMPTION_BADGE',
      matchedTerm: '[가정]',
      messageKo:
        '미확정 가격 가정 안내에는 반드시 "[가정]" 표기가 포함되어야 합니다 (INV-12, MAPS-INV-10).',
    });
  }

  if (
    options.hasValidControlGroup === false &&
    (text.includes('개입 효과로 입증') || text.includes('정비 효과로 확정'))
  ) {
    violations.push({
      code: 'UNCONTROLLED_CAUSAL_CLAIM',
      matchedTerm: '개입 효과로 입증/정비 효과로 확정',
      messageKo:
        '비개입 대조군이 없는 관측에서는 인과적 개입 효과를 확정 주장할 수 없습니다 (MAPS-INV-07).',
    });
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
