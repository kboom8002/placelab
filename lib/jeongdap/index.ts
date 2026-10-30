// lib/jeongdap/index.ts
// 모두의 정답노트 (Jeongdap Note) 순수 도메인 모듈 배럴 및 불변식 가드 함수

import {
  JEONGDAP_PRECISION_MODEL,
  JEONGDAP_PRECISION_PROFILE_ID,
  OUT_OF_SCOPE_REPORT_CATEGORIES,
  PLACEBO_CATEGORY_HOLD_RATE,
  PLACEBO_GLOBAL_STOP_RATE,
} from './constants';
import { JeongdapPrecisionRequestProfile, PlaceboKind } from './types';

export * from './constants';
export * from './types';
export * from './official-domain';
export * from './source-stages';
export * from './stability';
export * from './window-state';
export * from './band';
export * from './gazetteer-match';
export * from './cited-page-fetcher';
export * from './shadow-runner';
export * from './stats';
export * from './agreement';
export * from './did';
export * from './i18n';

/**
 * INV-13: 정밀 측정용 OpenAI Responses API 요청 페이로드 생성기.
 * - instructions(시스템 프롬프트) 및 user_location(위치 신호) 키를 절대 포함하지 않는다.
 * - 1단 판정을 위해 include: ["web_search_call.action.sources"] 를 고정한다.
 */
export function buildPrecisionResponsesPayload(
  questionText: string,
  model: string = JEONGDAP_PRECISION_MODEL
) {
  if (!questionText || !questionText.trim()) {
    throw new Error('정밀 측정 질문 원문이 비어 있습니다.');
  }
  return {
    model,
    input: questionText,
    tools: [{ type: 'web_search' as const }],
    include: ['web_search_call.action.sources' as const],
  };
}

export const DEFAULT_PRECISION_PROFILE: JeongdapPrecisionRequestProfile = {
  profileId: JEONGDAP_PRECISION_PROFILE_ID,
  model: JEONGDAP_PRECISION_MODEL,
  tools: [{ type: 'web_search' }],
  include: ['web_search_call.action.sources'],
  hasInstructions: false,
  locationSignal: false,
} as const;

/**
 * INV-16: 재난·안전 문항은 공개 집계 및 공개 응답에서 제외한다.
 */
export function filterOutDisasterItems<T extends { disaster?: boolean }>(items: readonly T[]): T[] {
  return items.filter((item) => !item.disaster);
}

/**
 * INV-18: 신고판 접수 단계에서 범위 제외(정부 입장·재난·개별 영리 업소) 여부를 검사한다.
 */
export function validateCitizenReportScope(input: {
  scopeCategory?: string;
  questionText: string;
}): { allowed: boolean; reason?: string } {
  if (
    input.scopeCategory &&
    (OUT_OF_SCOPE_REPORT_CATEGORIES as readonly string[]).includes(input.scopeCategory)
  ) {
    return {
      allowed: false,
      reason: `범위 제외 대상(${input.scopeCategory})은 신고판에 접수하지 않습니다 (INV-18).`,
    };
  }
  return { allowed: true };
}

/**
 * 위약(Placebo) 30문항 거짓 양성 게이트 (H2, methodology/01·02):
 * - 종류별 5% 이상이면 해당 해석 보류
 * - 전체 10% 이상이면 등장 판정 전체 보류
 */
export function evaluatePlaceboFalsePositives(
  results: readonly { kind: PlaceboKind; falsePositive: boolean }[]
) {
  if (results.length === 0) {
    return { overallFpRate: 0, globalHold: false, heldKinds: [] as PlaceboKind[] };
  }
  const totalFp = results.filter((r) => r.falsePositive).length;
  const overallFpRate = totalFp / results.length;
  const kinds: PlaceboKind[] = ['fictional_entity', 'other_region_entity', 'similar_name_entity'];
  const heldKinds: PlaceboKind[] = [];

  for (const k of kinds) {
    const sub = results.filter((r) => r.kind === k);
    if (sub.length > 0) {
      const rate = sub.filter((r) => r.falsePositive).length / sub.length;
      if (rate >= PLACEBO_CATEGORY_HOLD_RATE) {
        heldKinds.push(k);
      }
    }
  }

  return {
    overallFpRate,
    globalHold: overallFpRate >= PLACEBO_GLOBAL_STOP_RATE,
    heldKinds,
  };
}
