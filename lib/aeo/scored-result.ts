// lib/aeo/scored-result.ts
// MeasureResult → ScoredResult 변환
// 출처: K04 v2.1, scorer.ts
// 불변식: INV-6 (원문 150자 제한), INV-9 (Floor Risk 병기)

import type { MeasureResult } from './measure-engine';
import type { ScoredResult } from './types/vip-report';
import {
  scoreTier1,
  scoreTier2,
  scoreTier3,
  type Tier1Verdict,
  type Tier2Verdict,
  type Tier3Verdict,
} from './scorer';

interface Tier2QuestionInfo {
  id: string;
  body: string;
  groundTruth?: string;
  category?: string;
}

interface Tier3QuestionInfo {
  id: string;
  body: string;
  type?: string;
  targetKeywords?: string[];
}

/**
 * MeasureResult 배열을 ScoredResult 배열로 변환
 * 채점 + 원문 excerpt + 카테고리 매핑
 */
export function scoreAll(
  results: MeasureResult[],
  unitName: string,
  tier2Questions?: Tier2QuestionInfo[],
  tier3Questions?: Tier3QuestionInfo[],
  tier3TargetKeywords?: string[]
): ScoredResult[] {
  // T2 질문 맵
  const t2Map = new Map<string, Tier2QuestionInfo>();
  if (tier2Questions) {
    for (const q of tier2Questions) t2Map.set(q.id, q);
  }

  // T3 질문 맵
  const t3Map = new Map<string, Tier3QuestionInfo>();
  if (tier3Questions) {
    for (const q of tier3Questions) t3Map.set(q.id, q);
  }

  const shortUnit = unitName.replace(/(특별시|광역시|특별자치시|특별자치도|특례시|시|군|구)$/, '');

  return results.map((r): ScoredResult => {
    const excerpt = (r.response || '')
      .replace(/\n/g, ' ')
      .trim()
      .substring(0, 150);

    if (r.tier === 'T1') {
      const verdict = scoreTier1(r.response);
      return {
        ...r,
        verdict,
        category: r.questionId.replace(/^B-/, '').toLowerCase(),
        responseExcerpt: excerpt,
      };
    }

    if (r.tier === 'T2') {
      const q = t2Map.get(r.questionId);
      const gt = q?.groundTruth;
      const verdict = scoreTier2(r.response, gt, unitName);

      // GT 일치율 계산
      let groundTruthMatchRate = 0;
      if (gt && gt.trim().length > 0) {
        const tokens = gt.split(/[\s,·/()]+/).filter(t => t.length >= 2);
        if (tokens.length > 0) {
          const matched = tokens.filter(t => r.response.includes(t)).length;
          groundTruthMatchRate = matched / tokens.length;
        }
      }

      // 도시 고유 정보 포함 여부
      const hasUnitSpecificInfo = Boolean(
        (unitName && r.response.includes(unitName)) ||
        (shortUnit && shortUnit.length >= 2 && r.response.includes(shortUnit))
      );

      return {
        ...r,
        verdict,
        category: q?.category || 'unknown',
        groundTruthMatchRate,
        hasUnitSpecificInfo,
        responseExcerpt: excerpt,
      };
    }

    // T3
    const q = t3Map.get(r.questionId);
    const keywords = q?.targetKeywords || tier3TargetKeywords || [];
    const verdict = scoreTier3(r.response, unitName, keywords);

    const targetMentioned = r.response.includes(unitName) ||
      (shortUnit.length >= 2 && r.response.includes(shortUnit));

    let mentionSentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (verdict === 'mentioned_positive') mentionSentiment = 'positive';
    if (verdict === 'mentioned_negative') mentionSentiment = 'negative';

    return {
      ...r,
      verdict,
      category: q?.type || r.questionId.split('-')[0] || 'unknown',
      targetMentioned,
      mentionSentiment,
      responseExcerpt: excerpt,
    };
  });
}

/**
 * GT 일치율 계산 유틸
 */
export function computeGTMatchRate(response: string, groundTruth: string): number {
  if (!groundTruth || !groundTruth.trim()) return 0;
  const tokens = groundTruth.split(/[\s,·/()]+/).filter(t => t.length >= 2);
  if (tokens.length === 0) return 0;
  const matched = tokens.filter(t => response.includes(t)).length;
  return matched / tokens.length;
}
