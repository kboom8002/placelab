// lib/jeongdap/stability.ts
// 출처:
// - docs/adr/0024-stability-rules.md
// - jeongdap-note-repo-docs-v1.1/docs/methodology/01_measurement-methodology-v1.0.md, 02_first-round-preregistration.md (H1)
// - jeongdap-note-repo-docs-v1.1/measurement/judge_auto.py L80-86

import {
  H1_BLOCK_AGREEMENT_MIN,
  ITEM_PRIMARY_BLOCK_REPS,
  ITEM_PRIMARY_SUCCESS_MIN_REPS,
  PANEL_STABILITY_MAX_DIFF_REPS,
} from './constants';

export interface RepJudgment {
  s3FirstCitationOfficial: boolean;
  s4Label: string;
}

/**
 * 문항 단위 주 결과: 3회 중 2회 이상 공식 첫 인용(s3=true)이면 성공으로 본다 (§3.1, H1).
 */
export function isItemPrimarySuccess(s3Outcomes: boolean[]): boolean {
  if (s3Outcomes.length < ITEM_PRIMARY_BLOCK_REPS) {
    throw new Error(`문항 단위 주 결과 판정에는 최소 ${ITEM_PRIMARY_BLOCK_REPS}회 관측이 필요합니다 (단발 관측 공개 금지, INV-8)`);
  }
  const hits = s3Outcomes.filter(Boolean).length;
  return hits >= ITEM_PRIMARY_SUCCESS_MIN_REPS;
}

/**
 * 9회 블록 안정성 판정 (judge_auto.py L80-86):
 * 같은 인스턴스의 반복 판정 중 다수 (s3, s4) 쌍과 다른 횟수가 2회 이하이면 안정.
 */
export function evaluateNineRunStability(judgments: RepJudgment[]) {
  if (judgments.length === 0) {
    return { diffCount: 0, isStable: false };
  }
  const counts = new Map<string, number>();
  for (const j of judgments) {
    const key = `${j.s3FirstCitationOfficial}::${j.s4Label}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let maxModeCount = 0;
  counts.forEach((c) => {
    if (c > maxModeCount) maxModeCount = c;
  });
  const diffCount = judgments.length - maxModeCount;
  return {
    diffCount,
    isStable: diffCount <= PANEL_STABILITY_MAX_DIFF_REPS,
  };
}

/**
 * H1 가설 검증: 두 독립 3일 블록 간 문항별 주 결과 일치도 계산 (0.8 미만 시 재검토).
 */
export function evaluateBlockAgreementH1(
  block1SuccessByInstance: Record<string, boolean>,
  block2SuccessByInstance: Record<string, boolean>
) {
  const keys = Object.keys(block1SuccessByInstance).filter((k) => k in block2SuccessByInstance);
  if (keys.length === 0) {
    return { agreementRate: 0, passesH1: false, comparedCount: 0 };
  }
  const matched = keys.filter((k) => block1SuccessByInstance[k] === block2SuccessByInstance[k]).length;
  const agreementRate = matched / keys.length;
  return {
    agreementRate,
    passesH1: agreementRate >= H1_BLOCK_AGREEMENT_MIN,
    comparedCount: keys.length,
  };
}
