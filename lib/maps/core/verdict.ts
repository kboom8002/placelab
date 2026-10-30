// lib/maps/core/verdict.ts
// 관측 시점 기준일(as-of) 6분류 판정 및 무변이 재판정 도메인 모듈
// 근거: ADR-0026, MAPS-INV-04, MAPS-INV-20

import { factsAsOf } from './as-of';
import { HARM_LIMIT_VIOLATION_THRESHOLD } from './constants';
import type {
  MapsCitationClass,
  MapsCitationItem,
  MapsEntity,
  MapsFactVersion,
  MapsJudgment,
  MapsObservation,
  MapsPropDefinition,
  MapsVerdict6Way,
} from './types';

export interface PeerEntityFactCandidate {
  entityId: string;
  entityName: string;
  propKey: string;
  valueNorm: string | number | boolean | Record<string, unknown>;
}

export interface JudgeObservationInput {
  judgmentId: string;
  observation: MapsObservation;
  targetEntity: MapsEntity;
  propDef: MapsPropDefinition;
  allFactVersions: readonly MapsFactVersion[];
  peerFacts?: readonly PeerEntityFactCandidate[];
  judgeId?: string;
  judgedAtIso?: string;
}

function normalizeScalar(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'string') {
    return val.trim().toLowerCase().replace(/[\s,_-]+/g, '');
  }
  return JSON.stringify(val);
}

function valuesMatch(
  claimed: unknown,
  canonical: unknown,
  propDef: MapsPropDefinition
): boolean {
  if (typeof claimed === 'number' && typeof canonical === 'number') {
    const tol = propDef.toleranceRatio ?? 0;
    if (tol === 0) return claimed === canonical;
    const diff = Math.abs(claimed - canonical);
    return diff <= Math.abs(canonical) * tol;
  }
  return normalizeScalar(claimed) === normalizeScalar(canonical);
}

export function classifyCitations(
  citations: readonly MapsCitationItem[],
  entity: MapsEntity
): MapsCitationClass {
  if (!citations || citations.length === 0) {
    return 'none';
  }

  const officialSet = new Set(
    entity.officialDomains.map((d) => d.toLowerCase().replace(/^www\./, ''))
  );
  const primaryUrlSet = new Set(
    entity.primaryUrls.map((u) => u.toLowerCase().replace(/\/+$/, ''))
  );

  for (const c of citations) {
    if (c.httpStatus && c.httpStatus >= 400) {
      return 'broken';
    }
    const cleanUrl = c.url.toLowerCase().replace(/\/+$/, '');
    const cleanDomain = c.domain.toLowerCase().replace(/^www\./, '');
    if (primaryUrlSet.has(cleanUrl) || officialSet.has(cleanDomain)) {
      return 'official';
    }
    for (const offDom of officialSet) {
      if (cleanDomain.endsWith(`.${offDom}`)) {
        return 'official';
      }
    }
  }

  // 블로그·카페 등 UGC 판별
  const hasUgc = citations.some((c) =>
    /blog\.naver\.com|cafe\.naver\.com|tistory\.com|brunch\.co\.kr|velog\.io/i.test(
      c.domain
    )
  );
  if (hasUgc) return 'ugc_blog';

  return 'secondary_press';
}

/**
 * 관측 시점(observation.observedAt)에 유효했던 정본만을 사용하여 6분류 판정을 산출한다.
 *
 * 6분류 규칙 (ADR-0026, MAPS-INV-04, MAPS-INV-20):
 * 1. honest_unknown: refusalType === 'honest_unknown' 또는 주장 없음
 * 2. correct: 현재 유효 정본과 일치 + 공식/1차 출처 인용('official' | 'primary_doc')
 * 3. asserted: 현재 유효 정본과 값은 일치하나 공식/1차 출처 인용이 없음 (MAPS-INV-20: factualRate 분자 제외)
 * 4. outdated: 현재 정본과는 다르나, 관측 시점 이전에 만료된 과거 정본 버전과 일치 (lagDays 계산)
 * 5. confused: 현재·과거 정본과 다르나, 동종/동명이인 타 대상(peerFacts)의 값과 일치
 * 6. fabricated: 위 어디에도 해당하지 않는 근거 없는 창작 수치·주장
 */
export function judgeObservationAsOf(
  input: JudgeObservationInput
): MapsJudgment {
  const {
    judgmentId,
    observation,
    targetEntity,
    propDef,
    allFactVersions,
    peerFacts = [],
    judgeId = 'rule-engine-v1',
    judgedAtIso = observation.observedAt,
  } = input;

  const { activeFact, expiredFactsBeforeObservedAt } = factsAsOf(
    allFactVersions,
    targetEntity.entityId,
    propDef.propKey,
    observation.observedAt
  );

  const citationClass = classifyCitations(observation.citations, targetEntity);
  const hasOfficialOrPrimaryCitation =
    citationClass === 'official' || citationClass === 'primary_doc';

  const propClaim = observation.extractedClaims.find(
    (c) => c.propKey === propDef.propKey
  );

  // 1. 정직한 모름 / 답변 유보
  if (observation.refusalType === 'honest_unknown' || !propClaim) {
    return {
      judgmentId,
      observationId: observation.observationId,
      targetEntityId: targetEntity.entityId,
      propKey: propDef.propKey,
      asOfFactVersionId: activeFact?.factVersionId ?? null,
      verdict: 'honest_unknown',
      lagDays: null,
      confusedWithEntityId: null,
      citationClass,
      harmScore: 0,
      limitViolation: false,
      judgeType: 'rule',
      judgeId,
      rationale:
        '확인 불가 또는 공식 채널 직접 확인 안내로 응답하여 정직한 모름(honest_unknown)으로 판정',
      supersedesJudgmentId: null,
      judgedAt: judgedAtIso,
    };
  }

  // 2. 관측 시점 유효 정본(activeFact) 대조
  if (
    activeFact &&
    valuesMatch(propClaim.claimedValueNorm, activeFact.valueNorm, propDef)
  ) {
    if (hasOfficialOrPrimaryCitation) {
      return {
        judgmentId,
        observationId: observation.observationId,
        targetEntityId: targetEntity.entityId,
        propKey: propDef.propKey,
        asOfFactVersionId: activeFact.factVersionId,
        verdict: 'correct',
        lagDays: 0,
        confusedWithEntityId: null,
        citationClass,
        harmScore: 0,
        limitViolation: false,
        judgeType: 'rule',
        judgeId,
        rationale: `관측 시점 유효 정본(${activeFact.factVersionId})과 일치하며 공식 출처가 인용됨`,
        supersedesJudgmentId: null,
        judgedAt: judgedAtIso,
      };
    }

    // MAPS-INV-20: 값은 맞으나 공식·1차 인용이 없는 단언 -> 'asserted'
    return {
      judgmentId,
      observationId: observation.observationId,
      targetEntityId: targetEntity.entityId,
      propKey: propDef.propKey,
      asOfFactVersionId: activeFact.factVersionId,
      verdict: 'asserted',
      lagDays: 0,
      confusedWithEntityId: null,
      citationClass,
      harmScore: Number((propDef.riskWeight * 0.25).toFixed(2)),
      limitViolation: false,
      judgeType: 'rule',
      judgeId,
      rationale: `값(${propClaim.claimedValueRaw})은 정본과 같으나 공식·1차 출처 인용 없이 단언함 (MAPS-INV-20)`,
      supersedesJudgmentId: null,
      judgedAt: judgedAtIso,
    };
  }

  // 3. 만료된 과거 정본 버전과 일치하는지 검사 -> 'outdated'
  for (const expired of expiredFactsBeforeObservedAt) {
    if (valuesMatch(propClaim.claimedValueNorm, expired.valueNorm, propDef)) {
      const referenceChangeIso = activeFact?.validFrom ?? expired.validTo ?? observation.observedAt;
      const lagMs = Math.max(
        0,
        Date.parse(observation.observedAt) - Date.parse(referenceChangeIso)
      );
      const lagDays = Math.floor(lagMs / (1000 * 60 * 60 * 24));
      const harmScore = Number(
        Math.min(5, propDef.riskWeight * 0.75).toFixed(2)
      );
      return {
        judgmentId,
        observationId: observation.observationId,
        targetEntityId: targetEntity.entityId,
        propKey: propDef.propKey,
        asOfFactVersionId: activeFact?.factVersionId ?? expired.factVersionId,
        verdict: 'outdated',
        lagDays,
        confusedWithEntityId: null,
        citationClass,
        harmScore,
        limitViolation: harmScore >= HARM_LIMIT_VIOLATION_THRESHOLD,
        judgeType: 'rule',
        judgeId,
        rationale: `만료된 구버전 정본(${expired.factVersionId}, 만료일 ${expired.validTo}) 값을 계속 응답함 (지연 ${lagDays}일)`,
        supersedesJudgmentId: null,
        judgedAt: judgedAtIso,
      };
    }
  }

  // 4. 동명이인·타 대상 정본 값과 일치하는지 검사 -> 'confused'
  for (const peer of peerFacts) {
    if (
      peer.entityId !== targetEntity.entityId &&
      peer.propKey === propDef.propKey &&
      valuesMatch(propClaim.claimedValueNorm, peer.valueNorm, propDef)
    ) {
      const harmScore = Number(
        Math.min(5, propDef.riskWeight * 0.9).toFixed(2)
      );
      return {
        judgmentId,
        observationId: observation.observationId,
        targetEntityId: targetEntity.entityId,
        propKey: propDef.propKey,
        asOfFactVersionId: activeFact?.factVersionId ?? null,
        verdict: 'confused',
        lagDays: null,
        confusedWithEntityId: peer.entityId,
        citationClass,
        harmScore,
        limitViolation: harmScore >= HARM_LIMIT_VIOLATION_THRESHOLD,
        judgeType: 'rule',
        judgeId,
        rationale: `타 대상(${peer.entityName}, ${peer.entityId})의 속성값(${propClaim.claimedValueRaw})과 혼동함`,
        supersedesJudgmentId: null,
        judgedAt: judgedAtIso,
      };
    }
  }

  // 5. 근거 없는 창작 -> 'fabricated'
  const harmScore = Number(Math.min(5, propDef.riskWeight * 1.0).toFixed(2));
  return {
    judgmentId,
    observationId: observation.observationId,
    targetEntityId: targetEntity.entityId,
    propKey: propDef.propKey,
    asOfFactVersionId: activeFact?.factVersionId ?? null,
    verdict: 'fabricated',
    lagDays: null,
    confusedWithEntityId: null,
    citationClass,
    harmScore,
    limitViolation: harmScore >= HARM_LIMIT_VIOLATION_THRESHOLD,
    judgeType: 'rule',
    judgeId,
    rationale: `현재·과거 정본 및 타 대상 어디에도 없는 값(${propClaim.claimedValueRaw})을 근거 없이 생성함`,
    supersedesJudgmentId: null,
    judgedAt: judgedAtIso,
  };
}

/**
 * MAPS-INV-04: 재판정 또는 이의 신청 인용 시 기존 판정 행을 수정하지 않고
 * supersedesJudgmentId 가 연결된 새 판정 행을 추가한다.
 */
export function supersedeJudgment(
  judgments: readonly MapsJudgment[],
  oldJudgment: MapsJudgment,
  patch: {
    newJudgmentId: string;
    verdict: MapsVerdict6Way;
    judgeType: MapsJudgment['judgeType'];
    judgeId: string;
    rationale: string;
    harmScore?: number;
    judgedAtIso: string;
  }
): MapsJudgment[] {
  const nextHarm = patch.harmScore ?? oldJudgment.harmScore;
  const newRow: MapsJudgment = {
    ...oldJudgment,
    judgmentId: patch.newJudgmentId,
    verdict: patch.verdict,
    harmScore: nextHarm,
    limitViolation: nextHarm >= HARM_LIMIT_VIOLATION_THRESHOLD,
    judgeType: patch.judgeType,
    judgeId: patch.judgeId,
    rationale: patch.rationale,
    supersedesJudgmentId: oldJudgment.judgmentId,
    judgedAt: patch.judgedAtIso,
  };

  return [...judgments, newRow];
}

/**
 * append-only 판정 목록에서 각 observationId + propKey 의 최신(현행) 판정만 추출한다.
 */
export function getActiveJudgments(
  judgments: readonly MapsJudgment[]
): MapsJudgment[] {
  const supersededSet = new Set<string>();
  for (const j of judgments) {
    if (j.supersedesJudgmentId) {
      supersededSet.add(j.supersedesJudgmentId);
    }
  }
  return judgments.filter((j) => !supersededSet.has(j.judgmentId));
}
