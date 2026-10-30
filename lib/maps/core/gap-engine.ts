// lib/maps/core/gap-engine.ts
// 6대 간극(G1~G6) 조회 시점 산출 · 5요소 우선순위 분해 · 5대 편향 렌즈 · 메운 간극 1건당 원가 엔진
// 근거: ADR-0026, INV-9, MAPS-INV-08, MAPS-INV-09

import {
  diagnoseCause6Stage,
  type CauseSignalInput,
} from './cause-diagnosis';
import { getActiveJudgments } from './verdict';
import type {
  MapsBiasLens,
  MapsEntity,
  MapsGapTask,
  MapsGapType,
  MapsIntervention,
  MapsJudgment,
  MapsObservation,
  MapsPriorityComponents,
  MapsPropDefinition,
} from './types';

/**
 * MAPS-INV-09: 우선순위 점수는 반드시 5대 구성요소(demand, gap, harm, feasibility, cost)와 함께 산출·반환한다.
 */
export function computeGapPriority(components: MapsPriorityComponents): {
  priority: number;
  priorityComponents: MapsPriorityComponents;
} {
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const normalized: MapsPriorityComponents = {
    demand: Number(clamp(components.demand).toFixed(4)),
    gap: Number(clamp(components.gap).toFixed(4)),
    harm: Number(clamp(components.harm).toFixed(4)),
    feasibility: Number(clamp(components.feasibility).toFixed(4)),
    cost: Number(clamp(components.cost).toFixed(4)),
  };

  // 내부 우선순위 결합식 (외부 공개 페이지에는 산식 가중치 비노출 — MAPS-INV-19)
  const raw =
    normalized.demand * 0.22 +
    normalized.gap * 0.26 +
    normalized.harm * 0.28 +
    normalized.feasibility * 0.14 +
    normalized.cost * 0.1;

  return {
    priority: Number(raw.toFixed(4)),
    priorityComponents: normalized,
  };
}

export interface ComputePropertyGapInput {
  gapTaskId: string;
  tenantId: string;
  entity: MapsEntity;
  propDef: MapsPropDefinition;
  observations: readonly MapsObservation[];
  judgments: readonly MapsJudgment[];
  demandScore: number; // 0..1
  causeSignal: CauseSignalInput;
}

/**
 * MAPS-INV-08: 간극(G1~G6)은 정적 입력이 아니라 관측(observations)과 판정(judgments)으로부터 조회 시점에 계산한다.
 */
export function computeGapForProperty(
  input: ComputePropertyGapInput
): MapsGapTask | null {
  const {
    gapTaskId,
    tenantId,
    entity,
    propDef,
    observations,
    judgments,
    demandScore,
    causeSignal,
  } = input;

  const active = getActiveJudgments(judgments).filter(
    (j) => j.targetEntityId === entity.entityId && j.propKey === propDef.propKey
  );
  if (active.length === 0) return null;

  const obsMap = new Map(observations.map((o) => [o.observationId, o]));

  let correctCount = 0;
  let outdatedCount = 0;
  let fabricatedOrConfusedCount = 0;
  let assertedOrNonOfficialCount = 0;
  let unknownOrMissingCount = 0;
  let maxLagDays: number | null = null;
  const engineCorrectRate = new Map<string, { ok: number; total: number }>();
  const affectedEngines = new Set<string>();

  for (const j of active) {
    const obs = obsMap.get(j.observationId);
    const engineLabel = obs?.maskedEngineLabel ?? 'svc-unknown';
    const stat = engineCorrectRate.get(engineLabel) ?? { ok: 0, total: 0 };
    stat.total += 1;

    if (j.verdict === 'correct') {
      correctCount += 1;
      stat.ok += 1;
    } else {
      affectedEngines.add(engineLabel);
    }
    engineCorrectRate.set(engineLabel, stat);

    if (j.verdict === 'outdated') {
      outdatedCount += 1;
      if (typeof j.lagDays === 'number') {
        maxLagDays =
          maxLagDays === null ? j.lagDays : Math.max(maxLagDays, j.lagDays);
      }
    } else if (j.verdict === 'fabricated' || j.verdict === 'confused') {
      fabricatedOrConfusedCount += 1;
    } else if (j.verdict === 'asserted') {
      assertedOrNonOfficialCount += 1;
    } else if (j.verdict === 'honest_unknown') {
      unknownOrMissingCount += 1;
    }
  }

  // 모든 관측이 정본 일치 + 공식 인용이면 간극 없음
  if (correctCount === active.length) {
    return null;
  }

  // 엔진 간 편차 계산 (G6 판별용)
  const engineRates = Array.from(engineCorrectRate.values()).map((s) =>
    s.total > 0 ? s.ok / s.total : 0
  );
  const engineSpread =
    engineRates.length >= 2
      ? Math.max(...engineRates) - Math.min(...engineRates)
      : 0;

  let gapType: MapsGapType;
  if (outdatedCount > 0 && outdatedCount >= fabricatedOrConfusedCount) {
    gapType = 'G3_time';
  } else if (fabricatedOrConfusedCount > 0) {
    gapType = 'G2_fact';
  } else if (assertedOrNonOfficialCount > 0) {
    gapType = 'G4_source';
  } else if (unknownOrMissingCount >= Math.ceil(active.length * 0.5)) {
    gapType = 'G1_presence';
  } else if (engineSpread >= 0.5) {
    gapType = 'G6_engine';
  } else {
    gapType = 'G5_context';
  }

  const sampleNonCorrect =
    active.find((j) => j.verdict !== 'correct') ?? active[0];

  const diagnosis = diagnoseCause6Stage({
    ...causeSignal,
    sampleVerdict: sampleNonCorrect.verdict,
  });

  const gapRatio = (active.length - correctCount) / active.length;
  const normHarm = Math.min(1, propDef.riskWeight / 5);

  const { priority, priorityComponents } = computeGapPriority({
    demand: demandScore,
    gap: gapRatio,
    harm: normHarm,
    feasibility: diagnosis.feasibility,
    cost: diagnosis.costEfficiency,
  });

  return {
    gapTaskId,
    tenantId,
    entityId: entity.entityId,
    entityName: entity.canonicalName,
    propKey: propDef.propKey,
    propLabel: propDef.labelKo,
    gapType,
    diagnosisStage: diagnosis.diagnosisStage,
    prescriptionCode: diagnosis.prescriptionCode,
    prescriptionTitle: diagnosis.prescriptionTitleKo,
    prescriptionSteps: diagnosis.prescriptionSteps,
    priority,
    priorityComponents,
    affectedEngineLabels: Array.from(affectedEngines).sort(),
    sampleVerdict: sampleNonCorrect.verdict,
    lagDays: maxLagDays,
    status: 'open',
  };
}

export interface BiasLensSummary {
  lens: MapsBiasLens;
  headlineGapDelta: number;
  summaryTextKo: string;
}

/**
 * 5대 편향 렌즈(채널·언어·질문틀·엔진·시간지연) 요약 계산
 */
export function computeBiasLenses(
  observations: readonly MapsObservation[],
  judgments: readonly MapsJudgment[]
): BiasLensSummary[] {
  const active = getActiveJudgments(judgments);
  const obsMap = new Map(observations.map((o) => [o.observationId, o]));

  const rateWhere = (pred: (o: MapsObservation, j: MapsJudgment) => boolean) => {
    const matched = active.filter((j) => {
      const o = obsMap.get(j.observationId);
      return o ? pred(o, j) : false;
    });
    if (matched.length === 0) return 0;
    const ok = matched.filter((j) => j.verdict === 'correct').length;
    return ok / matched.length;
  };

  const searchOnRate = rateWhere((o) => o.channel === 'api_websearch');
  const searchOffRate = rateWhere((o) => o.channel === 'api_nosearch');

  const koRate = rateWhere((o) => o.lang === 'ko');
  const nonKoRate = rateWhere((o) => o.lang !== 'ko');

  const neutralRate = rateWhere((o) => o.frameAxis === 'neutral');
  const framedRate = rateWhere((o) => o.frameAxis !== 'neutral');

  const svcARate = rateWhere((o) => o.maskedEngineLabel === 'svc-A');
  const svcBRate = rateWhere((o) => o.maskedEngineLabel === 'svc-B');

  const lags = active
    .map((j) => j.lagDays)
    .filter((d): d is number => typeof d === 'number');
  const avgLag =
    lags.length > 0 ? lags.reduce((a, b) => a + b, 0) / lags.length : 0;

  return [
    {
      lens: 'L1_channel',
      headlineGapDelta: Number(Math.abs(searchOnRate - searchOffRate).toFixed(3)),
      summaryTextKo: `웹 검색 켬(${(searchOnRate * 100).toFixed(0)}%) 대비 검색 끔(${(searchOffRate * 100).toFixed(0)}%) 정본 일치율 차이`,
    },
    {
      lens: 'L2_language',
      headlineGapDelta: Number(Math.abs(koRate - nonKoRate).toFixed(3)),
      summaryTextKo: `한국어 질문(${(koRate * 100).toFixed(0)}%) 대비 다국어 질문(${(nonKoRate * 100).toFixed(0)}%) 정합성 격차`,
    },
    {
      lens: 'L3_query_frame',
      headlineGapDelta: Number(Math.abs(neutralRate - framedRate).toFixed(3)),
      summaryTextKo: `중립 질문(${(neutralRate * 100).toFixed(0)}%) 대비 유도·제약 전제 질문(${(framedRate * 100).toFixed(0)}%) 방어율 차이`,
    },
    {
      lens: 'L4_engine',
      headlineGapDelta: Number(Math.abs(svcARate - svcBRate).toFixed(3)),
      summaryTextKo: `측정 엔진 svc-A(${(svcARate * 100).toFixed(0)}%)와 svc-B(${(svcBRate * 100).toFixed(0)}%) 간 편차`,
    },
    {
      lens: 'L5_time_lag',
      headlineGapDelta: Number(avgLag.toFixed(1)),
      summaryTextKo: `정본 개정 이후 구버전 응답 평균 지연 ${avgLag.toFixed(1)}일`,
    },
  ];
}

/**
 * MAPS 북극성 운영 지표: 메운 간극 1건당 원가(Cost per Gap Closed) 계산
 */
export function computeCostPerGapClosed(params: {
  interventions: readonly MapsIntervention[];
  closedGapCount: number;
  hourlyLaborCostKrw?: number;
}): {
  totalElapsedMinutes: number;
  totalCostKrw: number;
  closedGapCount: number;
  costPerGapClosedKrw: number | null;
  minutesPerGapClosed: number | null;
} {
  const {
    interventions,
    closedGapCount,
    hourlyLaborCostKrw = 60000,
  } = params;

  const totalElapsedMinutes = interventions.reduce(
    (sum, item) => sum + item.elapsedMinutes,
    0
  );
  const directCost = interventions.reduce(
    (sum, item) => sum + item.estimatedCostKrw,
    0
  );
  const laborCost = Math.round((totalElapsedMinutes / 60) * hourlyLaborCostKrw);
  const totalCostKrw = directCost + laborCost;

  if (closedGapCount <= 0) {
    return {
      totalElapsedMinutes,
      totalCostKrw,
      closedGapCount: 0,
      costPerGapClosedKrw: null,
      minutesPerGapClosed: null,
    };
  }

  return {
    totalElapsedMinutes,
    totalCostKrw,
    closedGapCount,
    costPerGapClosedKrw: Math.round(totalCostKrw / closedGapCount),
    minutesPerGapClosed: Number(
      (totalElapsedMinutes / closedGapCount).toFixed(1)
    ),
  };
}
