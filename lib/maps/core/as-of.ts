// lib/maps/core/as-of.ts
// 이원 시간(Bitemporal) 정본 대장 조회 및 무변이(Append-Only) 개정 도메인 로직
// 근거: ADR-0026, MAPS-INV-03, MAPS-INV-04

import type { MapsConfirmLevel, MapsFactVersion } from './types';

export interface AsOfFactLookupResult {
  /** 관측 시각(observedAt)에 실제로 유효했던 정본 버전 */
  activeFact: MapsFactVersion | null;
  /** 관측 시각 이전에 만료된 구버전 정본 목록 (최신 만료순) */
  expiredFactsBeforeObservedAt: MapsFactVersion[];
  /** 관측 시각 이후에 효력이 시작되는 미래 예고 정본 목록 */
  scheduledFutureFacts: MapsFactVersion[];
}

/**
 * 특정 관측 시점(observedAt)을 기준으로 유효했던 정본(activeFact)과
 * 그 시점에 이미 만료된 과거 정본(expiredFactsBeforeObservedAt)을 분리 조회한다.
 *
 * 중요(MAPS-INV-03/04):
 * - 정본 대장은 완전한 Append-Only 이므로, 후속 정본(validFrom 이 더 늦은 행)이 추가되면
 *   이전 정본의 유효 종료 시각(effectiveValidTo)은 후속 정본의 validFrom 으로 자동 결정된다.
 * - 따라서 기존 정본 행을 전혀 수정하지 않고도 과거 관측(observedAt)은 당시 유효했던 정본(`factVersionId` 불변)으로
 *   판정되며, 개정일 이후 관측에서는 이전 정본이 자동으로 만료 목록(expiredFactsBeforeObservedAt)으로 이동한다.
 */
export function factsAsOf(
  allFactVersions: readonly MapsFactVersion[],
  entityId: string,
  propKey: string,
  observedAtIso: string
): AsOfFactLookupResult {
  const observedMs = Date.parse(observedAtIso);
  if (Number.isNaN(observedMs)) {
    throw new Error(`Invalid observedAt timestamp: ${observedAtIso}`);
  }

  const propFacts = allFactVersions
    .filter((fv) => fv.entityId === entityId && fv.propKey === propKey)
    .sort((a, b) => Date.parse(a.validFrom) - Date.parse(b.validFrom));

  let activeFact: MapsFactVersion | null = null;
  const expiredFactsBeforeObservedAt: MapsFactVersion[] = [];
  const scheduledFutureFacts: MapsFactVersion[] = [];

  for (let i = 0; i < propFacts.length; i++) {
    const fv = propFacts[i];
    const fromMs = Date.parse(fv.validFrom);

    // 후속 버전이 존재하면 후속 버전의 validFrom 이 이전 버전의 실질 만료 시각이 된다
    const nextVersion = propFacts[i + 1];
    const nextFromIso = nextVersion?.validFrom ?? null;
    const effectiveValidToIso = fv.validTo ?? nextFromIso;
    const toMs = effectiveValidToIso ? Date.parse(effectiveValidToIso) : null;

    const hydratedFv: MapsFactVersion =
      effectiveValidToIso && !fv.validTo
        ? { ...fv, validTo: effectiveValidToIso }
        : fv;

    if (fromMs <= observedMs && (toMs === null || observedMs < toMs)) {
      if (
        !activeFact ||
        Date.parse(hydratedFv.recordedAt) >= Date.parse(activeFact.recordedAt)
      ) {
        activeFact = hydratedFv;
      }
    } else if (toMs !== null && toMs <= observedMs) {
      expiredFactsBeforeObservedAt.push(hydratedFv);
    } else if (fromMs > observedMs) {
      scheduledFutureFacts.push(hydratedFv);
    }
  }

  expiredFactsBeforeObservedAt.sort((a, b) => {
    const aTo = a.validTo ? Date.parse(a.validTo) : 0;
    const bTo = b.validTo ? Date.parse(b.validTo) : 0;
    return bTo - aTo;
  });

  scheduledFutureFacts.sort(
    (a, b) => Date.parse(a.validFrom) - Date.parse(b.validFrom)
  );

  return {
    activeFact,
    expiredFactsBeforeObservedAt,
    scheduledFutureFacts,
  };
}

export interface CreateFactRevisionInput {
  newFactVersionId: string;
  previousFact: MapsFactVersion;
  newValueNorm: string | number | boolean | Record<string, unknown>;
  newValueRaw: string;
  effectiveFromIso: string;
  recordedAtIso: string;
  sourceUrl: string;
  sourceQuote?: string;
  confirmLevel: MapsConfirmLevel;
  confirmedBy: string;
}

/**
 * MAPS-INV-03: 기존 정본 행을 전혀 수정·복제하지 않고(Immutable Append-Only),
 * 새 효력 시작일(effectiveFromIso)을 가진 신규 정본 버전 1행만 대장 끝에 추가한다.
 */
export function appendFactVersionRevision(
  ledger: readonly MapsFactVersion[],
  input: CreateFactRevisionInput
): MapsFactVersion[] {
  const prev = input.previousFact;
  const effectiveMs = Date.parse(input.effectiveFromIso);
  const prevFromMs = Date.parse(prev.validFrom);

  if (Number.isNaN(effectiveMs) || effectiveMs <= prevFromMs) {
    throw new Error(
      'New fact version validFrom must be strictly after previous fact validFrom'
    );
  }

  const nextFact: MapsFactVersion = {
    factVersionId: input.newFactVersionId,
    tenantId: prev.tenantId,
    entityId: prev.entityId,
    propKey: prev.propKey,
    valueNorm: input.newValueNorm,
    valueRaw: input.newValueRaw,
    unit: prev.unit,
    qualifiers: { ...prev.qualifiers },
    validFrom: input.effectiveFromIso,
    validTo: null,
    recordedAt: input.recordedAtIso,
    supersededAt: null,
    sourceUrl: input.sourceUrl,
    sourceQuote: input.sourceQuote,
    confirmLevel: input.confirmLevel,
    confirmedBy: input.confirmedBy,
    confirmedAt: input.recordedAtIso,
    supersedesFactVersionId: prev.factVersionId,
  };

  return [...ledger, nextFact];
}
