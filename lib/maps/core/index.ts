// lib/maps/core/index.ts
// MAPS 스튜디오 코어 도메인 통합 엔트리포인트

export * from './types';
export * from './constants';
export * from './as-of';
export * from './verdict';
export * from './entity-resolution';
export * from './metrics';
export * from './cause-diagnosis';
export * from './gap-engine';
export * from './fingerprint';
export * from './effect';
export * from './krippendorff';
export * from './copy-lint';
export * from './eligibility';
export * from './seed-data';

import {
  MAPS_SEED_CANARY_BASELINE,
  MAPS_SEED_CANARY_CURRENT_STABLE,
  MAPS_SEED_ENTITIES,
  MAPS_SEED_FACT_VERSIONS,
  MAPS_SEED_INTERVENTIONS,
  MAPS_SEED_OBSERVATIONS,
  MAPS_SEED_PEER_FACTS,
  MAPS_SEED_PROPS,
  MAPS_SEED_TENANTS,
} from './seed-data';
import { judgeObservationAsOf } from './verdict';
import { computeMapsMetrics } from './metrics';
import {
  computeBiasLenses,
  computeCostPerGapClosed,
  computeGapForProperty,
} from './gap-engine';
import { detectModelUpdate } from './fingerprint';
import { estimateMapsEffect } from './effect';
import { computeKrippendorffAlpha } from './krippendorff';
import type { MapsGapTask, MapsJudgment } from './types';

/**
 * 워크스페이스 및 어드민 화면에서 즉시 사용할 수 있는 계산된 표준 스냅샷을 생성한다.
 * (모든 판정·지표·간극은 저장된 집계값이 아니라 원시 관측과 정본 대장에서 실시간 계산 — INV-9, MAPS-INV-08)
 */
export function buildMapsWorkspaceSnapshot(tenantId: string = 'ten-seoulmiso') {
  const tenant =
    MAPS_SEED_TENANTS.find((t) => t.tenantId === tenantId) ??
    MAPS_SEED_TENANTS[0];
  const entity = MAPS_SEED_ENTITIES[0];
  const propMap = new Map(MAPS_SEED_PROPS.map((p) => [p.propKey, p]));

  const judgments: MapsJudgment[] = MAPS_SEED_OBSERVATIONS.map((obs, idx) => {
    const claimPropKey =
      obs.extractedClaims[0]?.propKey ?? 'prop-emergency-night';
    const propDef = propMap.get(claimPropKey) ?? MAPS_SEED_PROPS[0];
    return judgeObservationAsOf({
      judgmentId: `jdg-seed-${idx + 1}`,
      observation: obs,
      targetEntity: entity,
      propDef,
      allFactVersions: MAPS_SEED_FACT_VERSIONS,
      peerFacts: MAPS_SEED_PEER_FACTS,
    });
  });

  const metrics = computeMapsMetrics({
    observations: MAPS_SEED_OBSERVATIONS,
    judgments,
    measuredRoundStamp: '2026-10-23 · maps-v1.0.0 · 2개 엔진(svc-A, svc-B)',
  });

  const gapTasks: MapsGapTask[] = [];
  for (const propDef of MAPS_SEED_PROPS) {
    const signalByProp =
      propDef.propKey === 'prop-exam-fee'
        ? {
            hasCanonicalWebPage: true,
            isCrawlAccessible: true,
            isCapturedInSearchCandidates: true,
            isMachineParseableHtmlOrJsonLd: true,
            isFreeOfOutdatedConflict: false,
          }
        : propDef.propKey === 'prop-saturday-hours'
          ? {
              hasCanonicalWebPage: true,
              isCrawlAccessible: true,
              isCapturedInSearchCandidates: true,
              isMachineParseableHtmlOrJsonLd: false,
              isFreeOfOutdatedConflict: true,
            }
          : propDef.propKey === 'prop-booking-policy'
            ? {
                hasCanonicalWebPage: true,
                isCrawlAccessible: true,
                isCapturedInSearchCandidates: false,
                isMachineParseableHtmlOrJsonLd: true,
                isFreeOfOutdatedConflict: true,
              }
            : {
                hasCanonicalWebPage: false,
                isCrawlAccessible: true,
                isCapturedInSearchCandidates: false,
                isMachineParseableHtmlOrJsonLd: false,
                isFreeOfOutdatedConflict: true,
              };

    const gap = computeGapForProperty({
      gapTaskId: `gap-${propDef.propKey}`,
      tenantId: tenant.tenantId,
      entity,
      propDef,
      observations: MAPS_SEED_OBSERVATIONS,
      judgments,
      demandScore: propDef.riskWeight / 5,
      causeSignal: signalByProp,
    });
    if (gap) {
      gapTasks.push(gap);
    }
  }

  gapTasks.sort((a, b) => b.priority - a.priority);

  const biasLenses = computeBiasLenses(MAPS_SEED_OBSERVATIONS, judgments);

  const costEfficiency = computeCostPerGapClosed({
    interventions: MAPS_SEED_INTERVENTIONS,
    closedGapCount: 2,
  });

  const canaryStatus = detectModelUpdate(
    MAPS_SEED_CANARY_BASELINE,
    MAPS_SEED_CANARY_CURRENT_STABLE
  );

  const proofEffect = estimateMapsEffect({
    treated: {
      preNumerator: 12,
      preDenominator: 30,
      postNumerator: 24,
      postDenominator: 30,
    },
    control: {
      preNumerator: 13,
      preDenominator: 30,
      postNumerator: 14,
      postDenominator: 30,
    },
    canaryChecksDuringWindow: [canaryStatus],
  });

  const raterAgreement = computeKrippendorffAlpha([
    ['correct', 'correct'],
    ['outdated', 'outdated'],
    ['confused', 'confused'],
    ['asserted', 'asserted'],
    ['fabricated', 'fabricated'],
    ['honest_unknown', 'honest_unknown'],
    ['outdated', 'outdated'],
    ['correct', 'asserted'],
  ]);

  return {
    tenant,
    entity,
    props: MAPS_SEED_PROPS,
    factVersions: MAPS_SEED_FACT_VERSIONS,
    observations: MAPS_SEED_OBSERVATIONS,
    judgments,
    metrics,
    gapTasks,
    biasLenses,
    interventions: MAPS_SEED_INTERVENTIONS,
    costEfficiency,
    canaryStatus,
    proofEffect,
    raterAgreement,
  };
}
