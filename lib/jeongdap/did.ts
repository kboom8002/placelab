// lib/jeongdap/did.ts
// 정비·알리기 사건 페이지 단위 이중차분(Difference-in-Differences, DiD) 효과 추정 및 최소 표본 게이트
// 출처: docs/methodology/01_measurement-methodology-v1.0.md L178-194, docs/methodology/04_active-outcome-measurement-and-weekly-diagnosis.md

export interface DiDObservationPair {
  /** 사건 또는 문항 식별자 */
  itemId: string;
  /** 행정단위 식별자 */
  unitId: string;
  /** 문항 영역·기능 분류 (동일 회차·영역·기능 매칭용) */
  domainCategory: string;
  /** 정비·알리기 사건 발생 여부 (처치군 true / 대조군 false) */
  treated: boolean;
  /** 사건 전 기준(baseline) 공식 근거율 (0~1) */
  preRate: number;
  /** 사건 후(+2주 또는 +6주) 공식 근거율 (0~1) */
  postRate: number;
}

export interface DiDEstimationResult {
  /** 처치군 사건(문항) 수 */
  treatedEventCount: number;
  /** 처치군 참여 단위(기관) 수 */
  treatedUnitCount: number;
  /** 대조군 문항 수 */
  controlItemCount: number;
  /** 처치군 평균 전후 변화량 (post - pre) */
  treatedDelta: number;
  /** 대조군 평균 전후 변화량 (post - pre) */
  controlDelta: number;
  /** 이중차분 추정치 (treatedDelta - controlDelta) */
  didEstimate: number;
  /** 효과 주장 최소 표본 게이트(사건 30건 이상 · 기관 10곳 이상) 통과 여부 */
  canPublishCausalEffect: boolean;
  /** 공표 상태 라벨 ('confirmed_did' | 'exploratory_insufficient_sample') */
  publicationStatus: 'confirmed_did' | 'exploratory_insufficient_sample';
}

export const DID_MIN_TREATED_EVENTS = 30;
export const DID_MIN_TREATED_UNITS = 10;

/**
 * 페이지 단위 이중차분(DiD) 추정 및 최소 표본 게이트(30건 · 10곳) 검증
 * - 대조군은 동일 회차·영역·기능의 미정비 문항으로 매칭한다.
 * - 처치 사건 30건 미만 또는 참여 기관 10곳 미만일 때는 인과 효과 주장을 보류하고 탐색적(`exploratory_insufficient_sample`)으로만 기록한다.
 */
export function computePageLevelDiD(
  observations: readonly DiDObservationPair[]
): DiDEstimationResult {
  const treated = observations.filter((o) => o.treated);
  const controls = observations.filter((o) => !o.treated);

  const treatedEventCount = treated.length;
  const treatedUnitCount = new Set(treated.map((o) => o.unitId)).size;
  const controlItemCount = controls.length;

  const canPublishCausalEffect =
    treatedEventCount >= DID_MIN_TREATED_EVENTS &&
    treatedUnitCount >= DID_MIN_TREATED_UNITS &&
    controlItemCount > 0;

  if (treatedEventCount === 0 || controlItemCount === 0) {
    return {
      treatedEventCount,
      treatedUnitCount,
      controlItemCount,
      treatedDelta: 0,
      controlDelta: 0,
      didEstimate: 0,
      canPublishCausalEffect: false,
      publicationStatus: 'exploratory_insufficient_sample',
    };
  }

  const treatedDeltaAvg =
    treated.reduce((acc, o) => acc + (o.postRate - o.preRate), 0) / treatedEventCount;
  const controlDeltaAvg =
    controls.reduce((acc, o) => acc + (o.postRate - o.preRate), 0) / controlItemCount;
  const did = treatedDeltaAvg - controlDeltaAvg;

  return {
    treatedEventCount,
    treatedUnitCount,
    controlItemCount,
    treatedDelta: Number(treatedDeltaAvg.toFixed(4)),
    controlDelta: Number(controlDeltaAvg.toFixed(4)),
    didEstimate: Number(did.toFixed(4)),
    canPublishCausalEffect,
    publicationStatus: canPublishCausalEffect
      ? 'confirmed_did'
      : 'exploratory_insufficient_sample',
  };
}
