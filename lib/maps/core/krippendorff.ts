// lib/maps/core/krippendorff.ts
// 명목 척도(Nominal) Krippendorff's α 판정자 간 일치도 계산 및 발행 게이트
// 근거: ADR-0026, MAPS-INV-14

import { KRIPPENDORFF_THRESHOLDS } from './constants';

export interface KrippendorffResult {
  alpha: number;
  observedDisagreement: number;
  expectedDisagreement: number;
  itemCount: number;
  totalPairableValues: number;
  status: 'confirmed' | 'tentative' | 'retrain_required';
  publishAllowed: boolean;
  recommendationKo: string;
}

/**
 * 명목 척도(Nominal scale) Krippendorff's α 계산
 * @param ratingsByItem 각 문항/관측(item)별로 복수 판정자가 부여한 판정 라벨 배열 (결측 제외한 유효 라벨 목록)
 *
 * 게이트 규칙 (MAPS-INV-14):
 * - α >= 0.800: 'confirmed' (확정 발행 허용)
 * - 0.667 <= α < 0.800: 'tentative' (잠정 표기 조건부 허용)
 * - α < 0.667: 'retrain_required' (발행 차단 및 루브릭 재교육 필수)
 */
export function computeKrippendorffAlpha(
  ratingsByItem: ReadonlyArray<ReadonlyArray<string>>
): KrippendorffResult {
  // 2명 이상 판정한 유닛만 추출
  const validUnits = ratingsByItem.filter((u) => u.length >= 2);
  if (validUnits.length === 0) {
    return {
      alpha: 0,
      observedDisagreement: 1,
      expectedDisagreement: 1,
      itemCount: 0,
      totalPairableValues: 0,
      status: 'retrain_required',
      publishAllowed: false,
      recommendationKo: '2인 이상 교차 판정된 표본이 없습니다.',
    };
  }

  let totalN = 0;
  const globalCounts = new Map<string, number>();
  let weightedDisagreeSum = 0;

  for (const unit of validUnits) {
    const m = unit.length;
    totalN += m;

    const unitCounts = new Map<string, number>();
    for (const label of unit) {
      unitCounts.set(label, (unitCounts.get(label) ?? 0) + 1);
      globalCounts.set(label, (globalCounts.get(label) ?? 0) + 1);
    }

    // 유닛 내 불일치 쌍 수 / (m - 1)
    let unitDisagreePairs = 0;
    const labels = Array.from(unitCounts.keys());
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        unitDisagreePairs +=
          2 * (unitCounts.get(labels[i]) ?? 0) * (unitCounts.get(labels[j]) ?? 0);
      }
    }
    weightedDisagreeSum += unitDisagreePairs / (m - 1);
  }

  const observedDisagreement =
    totalN > 1 ? weightedDisagreeSum / totalN : 0;

  // 기대 불일치 Do / De
  let expectedDisagreePairs = 0;
  const allLabels = Array.from(globalCounts.keys());
  for (let i = 0; i < allLabels.length; i++) {
    for (let j = i + 1; j < allLabels.length; j++) {
      expectedDisagreePairs +=
        2 *
        (globalCounts.get(allLabels[i]) ?? 0) *
        (globalCounts.get(allLabels[j]) ?? 0);
    }
  }

  const expectedDisagreement =
    totalN > 1 ? expectedDisagreePairs / (totalN * (totalN - 1)) : 0;

  let alpha = 1;
  if (expectedDisagreement > 0) {
    alpha = 1 - observedDisagreement / expectedDisagreement;
  } else if (observedDisagreement > 0) {
    alpha = 0;
  }

  const roundedAlpha = Number(alpha.toFixed(4));

  if (roundedAlpha >= KRIPPENDORFF_THRESHOLDS.MIN_CONFIRMED) {
    return {
      alpha: roundedAlpha,
      observedDisagreement: Number(observedDisagreement.toFixed(4)),
      expectedDisagreement: Number(expectedDisagreement.toFixed(4)),
      itemCount: validUnits.length,
      totalPairableValues: totalN,
      status: 'confirmed',
      publishAllowed: true,
      recommendationKo: `판정자 간 일치도(α = ${roundedAlpha})가 기준(${KRIPPENDORFF_THRESHOLDS.MIN_CONFIRMED}) 이상으로 확정 공표 가능합니다.`,
    };
  }

  if (roundedAlpha >= KRIPPENDORFF_THRESHOLDS.MIN_TENTATIVE) {
    return {
      alpha: roundedAlpha,
      observedDisagreement: Number(observedDisagreement.toFixed(4)),
      expectedDisagreement: Number(expectedDisagreement.toFixed(4)),
      itemCount: validUnits.length,
      totalPairableValues: totalN,
      status: 'tentative',
      publishAllowed: true,
      recommendationKo: `판정자 간 일치도(α = ${roundedAlpha})가 잠정 구간(0.667~0.800)이므로 [잠정 판정] 배지를 동반해야 합니다.`,
    };
  }

  return {
    alpha: roundedAlpha,
    observedDisagreement: Number(observedDisagreement.toFixed(4)),
    expectedDisagreement: Number(expectedDisagreement.toFixed(4)),
    itemCount: validUnits.length,
    totalPairableValues: totalN,
    status: 'retrain_required',
    publishAllowed: false,
    recommendationKo: `판정자 간 일치도(α = ${roundedAlpha})가 최소 기준(${KRIPPENDORFF_THRESHOLDS.MIN_TENTATIVE}) 미만이므로 발행을 차단하고 판정 지침을 재점검해야 합니다.`,
  };
}
