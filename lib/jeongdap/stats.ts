// lib/jeongdap/stats.ts
// 95% 신뢰 구간(문항 군집 부트스트랩 및 Wilson 구간) 및 최소 셀 크기 게이트
// 출처: docs/methodology/01_measurement-methodology-v1.0.md, docs/IMPLEMENTATION-PLAN-jeongdap-note.md §10

export interface ConfidenceIntervalResult {
  /** 점추정 비율 (0~1) */
  point: number;
  /** 95% 신뢰 구간 하한 (0~1) */
  lower: number;
  /** 95% 신뢰 구간 상한 (0~1) */
  upper: number;
  /** 군집(문항) 수 또는 분모 */
  clusterCount: number;
  /** 총 관측 회차 수 */
  observationCount: number;
  /** 사용된 추정 방법 */
  method: 'cluster_bootstrap_95' | 'wilson_95' | 'raw_distribution_only';
  /** 최소 셀 크기(문항 10개 이상, 문항당 3회차 이상) 충족 여부 */
  meetsMinCellSize: boolean;
}

export interface ClusterObservation {
  /** 군집 식별자 (예: question_id 또는 instance_id) */
  clusterId: string;
  /** 반복 회차별 이진 결과 (예: S3 공식 첫 근거 성립 여부 true/false) */
  outcomes: readonly boolean[];
}

export const MIN_CLUSTER_COUNT_FOR_CI = 10;
export const MIN_REPS_PER_CLUSTER = 3;

/**
 * 결정론적 시드 난수 생성기 (Mulberry32) — 재현 가능한 부트스트랩용
 */
function createSeededRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Wilson 95% 신뢰 구간 (단일 비율 기본 공식)
 */
export function computeWilsonCI(successes: number, total: number, z = 1.959963984540054): {
  point: number;
  lower: number;
  upper: number;
} {
  if (total <= 0) {
    return { point: 0, lower: 0, upper: 0 };
  }
  const p = successes / total;
  const z2 = z * z;
  const denom = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denom;
  const halfWidth = (z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total))) / denom;
  return {
    point: Number(p.toFixed(4)),
    lower: Number(Math.max(0, center - halfWidth).toFixed(4)),
    upper: Number(Math.min(1, center + halfWidth).toFixed(4)),
  };
}

/**
 * 문항 군집 부트스트랩(Cluster Bootstrap) 95% 신뢰 구간
 * - 문항(clusterId) 단위로 복원 추출하여 동일 문항 내 반복 회차 간 상관성을 반영한다.
 * - 문항당 회차가 3회 미만이거나 군집 수가 최소 셀 크기(10문항) 미만이면 `meetsMinCellSize = false` 및 `raw_distribution_only`로 표시한다.
 */
export function computeClusterBootstrapCI(
  clusters: readonly ClusterObservation[],
  options?: { iterations?: number; seed?: number }
): ConfidenceIntervalResult {
  const validClusters = clusters.filter((c) => c.outcomes.length > 0);
  const clusterCount = validClusters.length;
  const observationCount = validClusters.reduce((acc, c) => acc + c.outcomes.length, 0);

  if (clusterCount === 0 || observationCount === 0) {
    return {
      point: 0,
      lower: 0,
      upper: 0,
      clusterCount: 0,
      observationCount: 0,
      method: 'raw_distribution_only',
      meetsMinCellSize: false,
    };
  }

  const totalSuccesses = validClusters.reduce(
    (acc, c) => acc + c.outcomes.filter(Boolean).length,
    0
  );
  const point = Number((totalSuccesses / observationCount).toFixed(4));

  const minReps = Math.min(...validClusters.map((c) => c.outcomes.length));
  const meetsMinCellSize =
    clusterCount >= MIN_CLUSTER_COUNT_FOR_CI && minReps >= MIN_REPS_PER_CLUSTER;

  if (!meetsMinCellSize) {
    const wilson = computeWilsonCI(totalSuccesses, observationCount);
    return {
      point,
      lower: wilson.lower,
      upper: wilson.upper,
      clusterCount,
      observationCount,
      method: 'raw_distribution_only',
      meetsMinCellSize: false,
    };
  }

  const iterations = options?.iterations ?? 1000;
  const rng = createSeededRng(options?.seed ?? 20261020);
  const bootMeans: number[] = [];

  for (let b = 0; b < iterations; b++) {
    let succ = 0;
    let count = 0;
    for (let i = 0; i < clusterCount; i++) {
      const pickedIdx = Math.floor(rng() * clusterCount);
      const picked = validClusters[pickedIdx];
      for (const out of picked.outcomes) {
        count += 1;
        if (out) succ += 1;
      }
    }
    bootMeans.push(count > 0 ? succ / count : 0);
  }

  bootMeans.sort((a, b) => a - b);
  const lowerIdx = Math.max(0, Math.floor(iterations * 0.025));
  const upperIdx = Math.min(iterations - 1, Math.floor(iterations * 0.975));

  return {
    point,
    lower: Number(bootMeans[lowerIdx].toFixed(4)),
    upper: Number(bootMeans[upperIdx].toFixed(4)),
    clusterCount,
    observationCount,
    method: 'cluster_bootstrap_95',
    meetsMinCellSize: true,
  };
}
