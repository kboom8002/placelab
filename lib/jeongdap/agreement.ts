// lib/jeongdap/agreement.ts
// 판정 일치도(Cohen's kappa, 2인 단순 일치율, 자동-사람 일치율, 확인단-운영팀 차이) 및 H3·H5 가설 검증
// 출처: docs/methodology/01_measurement-methodology-v1.0.md, docs/methodology/02_first-round-preregistration.md, docs/EVIDENCE.md (C-12)

export interface RaterPair {
  itemId: string;
  raterA: string;
  raterB: string;
}

export interface AgreementMetrics {
  /** 비교 문항·회차 수 */
  n: number;
  /** 단순 일치율 (0~1) */
  exactAgreement: number;
  /** Cohen's kappa (-1~1) */
  cohensKappa: number;
  /** H3 타당도 기준 통과 여부 (단순 일치 >= 0.80 및 kappa >= 0.65) */
  passesValidityGate: boolean;
}

export interface CrewComparisonMetrics {
  /** 활동 확인단 인원 수 */
  activeCrewCount: number;
  /** 확인단 다수결-운영팀 일치율 (0~1) */
  crewOpsAgreement: number;
  /** 확인단 공식 근거율과 운영팀 공식 근거율의 절대 차이 (0~1) */
  rateDelta: number;
  /** 최소 정족수(15명 이상) 충족 여부 */
  meetsQuorum: boolean;
  /** H5 가설(일치율 >= 0.80 및 차이 <= 0.05) 통과 여부 */
  passesH5: boolean;
}

export const MIN_EXACT_AGREEMENT = 0.8;
export const MIN_COHENS_KAPPA = 0.65;
export const MAX_CREW_OPS_DELTA = 0.05;
export const MIN_CREW_QUORUM = 15;

/**
 * 다범주 명목 척도에 대한 Cohen's Kappa 및 단순 일치율 계산
 */
export function computeInterRaterAgreement(pairs: readonly RaterPair[]): AgreementMetrics {
  const n = pairs.length;
  if (n === 0) {
    return {
      n: 0,
      exactAgreement: 0,
      cohensKappa: 0,
      passesValidityGate: false,
    };
  }

  const categories = new Set<string>();
  const countA = new Map<string, number>();
  const countB = new Map<string, number>();
  let exactMatches = 0;

  for (const p of pairs) {
    categories.add(p.raterA);
    categories.add(p.raterB);
    countA.set(p.raterA, (countA.get(p.raterA) ?? 0) + 1);
    countB.set(p.raterB, (countB.get(p.raterB) ?? 0) + 1);
    if (p.raterA === p.raterB) {
      exactMatches += 1;
    }
  }

  const p0 = exactMatches / n;
  let pe = 0;
  for (const cat of categories) {
    const pa = (countA.get(cat) ?? 0) / n;
    const pb = (countB.get(cat) ?? 0) / n;
    pe += pa * pb;
  }

  const kappa = pe >= 1 ? 1 : (p0 - pe) / (1 - pe);
  const exactAgreement = Number(p0.toFixed(4));
  const cohensKappa = Number(kappa.toFixed(4));

  return {
    n,
    exactAgreement,
    cohensKappa,
    passesValidityGate:
      exactAgreement >= MIN_EXACT_AGREEMENT && cohensKappa >= MIN_COHENS_KAPPA,
  };
}

/**
 * H5 시민 확인단(2인 다수결) vs 운영팀 판정 비교 및 정족수 게이트 평가
 */
export function evaluateCrewVsOpsComparison(params: {
  activeCrewCount: number;
  items: ReadonlyArray<{
    itemId: string;
    crewBinaryOfficial: boolean;
    opsBinaryOfficial: boolean;
    crewLabel: string;
    opsLabel: string;
  }>;
}): CrewComparisonMetrics {
  const { activeCrewCount, items } = params;
  const meetsQuorum = activeCrewCount >= MIN_CREW_QUORUM;
  if (items.length === 0) {
    return {
      activeCrewCount,
      crewOpsAgreement: 0,
      rateDelta: 0,
      meetsQuorum,
      passesH5: false,
    };
  }

  const n = items.length;
  const matches = items.filter((it) => it.crewLabel === it.opsLabel).length;
  const crewRate = items.filter((it) => it.crewBinaryOfficial).length / n;
  const opsRate = items.filter((it) => it.opsBinaryOfficial).length / n;

  const crewOpsAgreement = Number((matches / n).toFixed(4));
  const rateDelta = Number(Math.abs(crewRate - opsRate).toFixed(4));

  return {
    activeCrewCount,
    crewOpsAgreement,
    rateDelta,
    meetsQuorum,
    passesH5:
      meetsQuorum &&
      crewOpsAgreement >= MIN_EXACT_AGREEMENT &&
      rateDelta <= MAX_CREW_OPS_DELTA,
  };
}
