// lib/maps/core/entity-resolution.ts
// 개체 해소(Entity Resolution) 이중 임계값(τ, δ) 및 동명이인 감점 엔진
// 근거: ADR-0026, docs/maps-concept-repo-v1.0.md §5.1

import { ENTITY_RESOLUTION_THRESHOLDS } from './constants';
import type { MapsEntity } from './types';

export interface EntityCandidateScore {
  entityId: string;
  canonicalName: string;
  score: number;
  matchedAlias: string | null;
  matchedDisambiguators: string[];
  hitNegativeAliases: string[];
}

export interface EntityResolutionResult {
  status: 'resolved' | 'ambiguous' | 'unmatched';
  resolvedEntityId: string | null;
  topScore: number;
  secondScore: number;
  margin: number;
  rankedCandidates: EntityCandidateScore[];
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * 언급 문자열(mentionText)과 주변 문맥(contextText)을 기반으로 후보 개체(candidates) 중
 * 이중 임계값(top1 >= τ 이고 top1 - top2 >= δ)을 통과한 개체만 확정(resolved)한다.
 * 동명이인이나 지역·계열사가 불분명하여 격차(δ)가 부족하면 억지로 매칭하지 않고 'ambiguous'로 남긴다.
 */
export function resolveEntityMention(params: {
  mentionText: string;
  contextText: string;
  candidates: readonly MapsEntity[];
  tau?: number;
  delta?: number;
}): EntityResolutionResult {
  const {
    mentionText,
    contextText,
    candidates,
    tau = ENTITY_RESOLUTION_THRESHOLDS.TAU_MIN_SCORE,
    delta = ENTITY_RESOLUTION_THRESHOLDS.DELTA_MIN_MARGIN,
  } = params;

  const mentionNorm = norm(mentionText);
  const fullContextNorm = norm(`${mentionText} ${contextText}`);

  const scored: EntityCandidateScore[] = candidates.map((entity) => {
    let score = 0;
    let matchedAlias: string | null = null;

    const canonicalNorm = norm(entity.canonicalName);
    if (mentionNorm === canonicalNorm || fullContextNorm.includes(canonicalNorm)) {
      score += 0.65;
      matchedAlias = entity.canonicalName;
    } else {
      for (const alias of entity.aliases) {
        const aliasNorm = norm(alias);
        if (aliasNorm.length > 0 && (mentionNorm === aliasNorm || fullContextNorm.includes(aliasNorm))) {
          score += 0.55;
          matchedAlias = alias;
          break;
        }
      }
    }

    const matchedDisambiguators: string[] = [];
    for (const token of entity.disambiguators) {
      const tokenNorm = norm(token);
      if (tokenNorm.length > 0 && fullContextNorm.includes(tokenNorm)) {
        matchedDisambiguators.push(token);
      }
    }
    if (matchedDisambiguators.length > 0) {
      score += Math.min(0.35, matchedDisambiguators.length * 0.18);
    }

    const hitNegativeAliases: string[] = [];
    for (const neg of entity.negativeAliases) {
      const negNorm = norm(neg);
      if (negNorm.length > 0 && fullContextNorm.includes(negNorm)) {
        hitNegativeAliases.push(neg);
      }
    }
    if (hitNegativeAliases.length > 0) {
      score -= hitNegativeAliases.length * 0.45;
    }

    const clamped = Number(Math.max(0, Math.min(1, score)).toFixed(4));
    return {
      entityId: entity.entityId,
      canonicalName: entity.canonicalName,
      score: clamped,
      matchedAlias,
      matchedDisambiguators,
      hitNegativeAliases,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const top1 = scored[0]?.score ?? 0;
  const top2 = scored[1]?.score ?? 0;
  const margin = Number((top1 - top2).toFixed(4));

  if (top1 < tau) {
    return {
      status: top1 >= 0.4 ? 'ambiguous' : 'unmatched',
      resolvedEntityId: null,
      topScore: top1,
      secondScore: top2,
      margin,
      rankedCandidates: scored,
    };
  }

  if (scored.length > 1 && margin < delta) {
    return {
      status: 'ambiguous',
      resolvedEntityId: null,
      topScore: top1,
      secondScore: top2,
      margin,
      rankedCandidates: scored,
    };
  }

  return {
    status: 'resolved',
    resolvedEntityId: scored[0].entityId,
    topScore: top1,
    secondScore: top2,
    margin,
    rankedCandidates: scored,
  };
}
