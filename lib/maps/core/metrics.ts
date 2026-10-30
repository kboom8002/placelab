// lib/maps/core/metrics.ts
// MAPS 4대 헤드라인 지표 산출 및 Wilson 95% 신뢰 구간 · 반복 노이즈 마루(σ_rep) 계산
// 근거: ADR-0026, MAPS-INV-02, MAPS-INV-20

import { getActiveJudgments } from './verdict';
import type {
  MapsHeadlineMetrics,
  MapsJudgment,
  MapsMetricWithCI,
  MapsObservation,
} from './types';

/**
 * Wilson score 95% 신뢰 구간 (z = 1.96)
 */
export function computeWilsonCI(
  numerator: number,
  denominator: number
): MapsMetricWithCI {
  if (denominator <= 0) {
    return {
      rate: 0,
      ci95Low: 0,
      ci95High: 0,
      numerator: 0,
      denominator: 0,
    };
  }

  const z = 1.96;
  const p = numerator / denominator;
  const n = denominator;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denom;
  const halfWidth =
    (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;

  return {
    rate: Number(p.toFixed(4)),
    ci95Low: Number(Math.max(0, center - halfWidth).toFixed(4)),
    ci95High: Number(Math.min(1, center + halfWidth).toFixed(4)),
    numerator,
    denominator,
  };
}

/**
 * 동일 문항의 반복 관측(rep) 간 판정 변동 표준편차 평균(노이즈 마루 σ_rep)을 계산한다.
 */
export function computeRepeatNoiseFloor(
  observations: readonly MapsObservation[],
  activeJudgments: readonly MapsJudgment[]
): number {
  const obsByQuestion = new Map<string, string[]>();
  for (const obs of observations) {
    const key = `${obs.runId}::${obs.questionId}`;
    const list = obsByQuestion.get(key) ?? [];
    list.push(obs.observationId);
    obsByQuestion.set(key, list);
  }

  const judgmentByObs = new Map<string, MapsJudgment>();
  for (const j of activeJudgments) {
    judgmentByObs.set(j.observationId, j);
  }

  const questionSds: number[] = [];
  obsByQuestion.forEach((obsIds) => {
    if (obsIds.length < 2) return;
    const binaryHits: number[] = obsIds.map((id) =>
      judgmentByObs.get(id)?.verdict === 'correct' ? 1 : 0
    );
    const mean = binaryHits.reduce((a, b) => a + b, 0) / binaryHits.length;
    const variance =
      binaryHits.reduce((acc, v) => acc + (v - mean) ** 2, 0) /
      (binaryHits.length - 1);
    questionSds.push(Math.sqrt(variance));
  });

  if (questionSds.length === 0) return 0;
  const avgSd = questionSds.reduce((a, b) => a + b, 0) / questionSds.length;
  return Number(avgSd.toFixed(4));
}

/**
 * MAPS 4대 헤드라인 지표 산출
 * - MAPS-INV-02: 단일 종합 점수를 절대 반환하지 않는다.
 * - MAPS-INV-20: asserted(인용 없는 단언)는 factualRate 분자에 절대 포함하지 않고 assertedRate 로 분리 보고한다.
 */
export function computeMapsMetrics(params: {
  observations: readonly MapsObservation[];
  judgments: readonly MapsJudgment[];
  measuredRoundStamp: string;
}): MapsHeadlineMetrics {
  const { observations, judgments, measuredRoundStamp } = params;
  const active = getActiveJudgments(judgments);
  const total = active.length;

  // 1. 존재율 (Presence Rate): 추출된 주장이 존재하고 답변 거부가 아닌 비율
  const obsMap = new Map(observations.map((o) => [o.observationId, o]));
  let presentCount = 0;
  let correctCount = 0;
  let officialCiteCount = 0;
  let harmRiskCount = 0;
  let assertedCount = 0;
  let outdatedCount = 0;
  let limitViolationCount = 0;
  const lagDaysList: number[] = [];

  for (const j of active) {
    const obs = obsMap.get(j.observationId);
    if (obs && obs.extractedClaims.length > 0 && obs.refusalType === 'none') {
      presentCount += 1;
    }

    // MAPS-INV-20: 오직 'correct'(정본 일치 + 공식/1차 인용)만 factualRate 분자에 산입
    if (j.verdict === 'correct') {
      correctCount += 1;
    }
    if (j.verdict === 'asserted') {
      assertedCount += 1;
    }
    if (j.verdict === 'outdated') {
      outdatedCount += 1;
      if (typeof j.lagDays === 'number') {
        lagDaysList.push(j.lagDays);
      }
    }
    if (j.citationClass === 'official' || j.citationClass === 'primary_doc') {
      officialCiteCount += 1;
    }
    if (
      j.verdict === 'fabricated' ||
      j.verdict === 'confused' ||
      (j.verdict === 'outdated' && j.harmScore >= 2.5)
    ) {
      harmRiskCount += 1;
    }
    if (j.limitViolation) {
      limitViolationCount += 1;
    }
  }

  const avgLagDays =
    lagDaysList.length > 0
      ? Number(
          (
            lagDaysList.reduce((a, b) => a + b, 0) / lagDaysList.length
          ).toFixed(1)
        )
      : null;

  const repeatNoiseFloor = computeRepeatNoiseFloor(observations, active);

  return {
    presenceRate: computeWilsonCI(presentCount, total),
    factualRate: computeWilsonCI(correctCount, total),
    officialCitationRate: computeWilsonCI(officialCiteCount, total),
    harmRiskRate: computeWilsonCI(harmRiskCount, total),
    assertedRate: computeWilsonCI(assertedCount, total),
    outdatedRate: computeWilsonCI(outdatedCount, total),
    avgLagDays,
    repeatNoiseFloor,
    limitViolationCount,
    measuredRoundStamp,
  };
}
