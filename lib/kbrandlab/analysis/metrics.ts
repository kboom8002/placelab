// lib/kbrandlab/analysis/metrics.ts
// K-Brand Lab M-01 ~ M-16 핵심 지표 계산기 (§8.6, §16.4, INV-08)

import {
  MetricRatio,
  MetricDistribution,
  H2HResult,
  MetricsSummary,
  ResponseSemantic,
  CaptureStatus,
} from '../types';

export interface RawSlotInput {
  slotId: string;
  probeId: string;
  probeType: 'branded' | 'open' | 'h2h' | 'fact_check';
  language: string;
  rep: number;
  captureStatus: CaptureStatus;
  started: boolean;
  semantic?: ResponseSemantic;
  brandMentioned?: boolean;
  brandRecommended?: boolean;
  h2hResult?: H2HResult;
  citedUrls?: string[];
  officialChannelCited?: boolean;
  controllableSourceCited?: boolean;
}

export interface ClaimVerificationInput {
  claimId: string;
  hasIndependentStandard: boolean; // 검증 기준 자료 존재 여부
  verdict: 'correct' | 'incorrect' | 'insufficient' | 'disputed';
  citationSupportsClaim?: boolean;
}

export interface DescriptionDiffInput {
  propertyId: string;
  status: 'match' | 'omission' | 'different' | 'indeterminate';
}

function makeRatio(id: string, name: string, numerator: number, denominator: number, notes?: string): MetricRatio {
  if (denominator === 0) {
    return {
      id,
      name,
      numerator,
      denominator,
      rate: null,
      display: 'N/A (분모 0)',
      notes,
    };
  }
  const rate = numerator / denominator;
  const pct = (rate * 100).toFixed(1);
  return {
    id,
    name,
    numerator,
    denominator,
    rate,
    display: `${pct}% (${numerator}/${denominator})`,
    notes,
  };
}

export class MetricsCalculator {
  /**
   * M-01: 수집 완료율 = N_cap / N_plan
   */
  static calcM01(slots: RawSlotInput[], plannedCount: number): MetricRatio {
    const nCap = slots.filter((s) => s.captureStatus === 'captured').length;
    return makeRatio('M-01', '수집 완료율', nCap, plannedCount);
  }

  /**
   * M-02: 기술 성공률 = N_cap / N_started (슬롯 기준, 시도 횟수가 아님)
   */
  static calcM02(slots: RawSlotInput[]): MetricRatio {
    const nStarted = slots.filter((s) => s.started).length;
    const nCap = slots.filter((s) => s.captureStatus === 'captured').length;
    return makeRatio('M-02', '기술 성공률', nCap, nStarted, '슬롯 기준 집계 (재시도 요청 수 제외)');
  }

  /**
   * M-03: 실질 답변률 = substantive 슬롯 수 / N_cap
   */
  static calcM03(slots: RawSlotInput[]): MetricRatio {
    const captured = slots.filter((s) => s.captureStatus === 'captured');
    const substantive = captured.filter((s) => s.semantic === 'substantive').length;
    return makeRatio('M-03', '실질 답변률', substantive, captured.length);
  }

  /**
   * M-04: 브랜드 언급률 = N_answer 중 대상 브랜드 언급 수 / N_answer
   * N_answer = substantive 또는 insufficient 슬롯
   */
  static calcM04(slots: RawSlotInput[]): MetricRatio {
    const nAnswer = slots.filter(
      (s) => s.captureStatus === 'captured' && (s.semantic === 'substantive' || s.semantic === 'insufficient')
    );
    const mentioned = nAnswer.filter((s) => s.brandMentioned).length;
    return makeRatio('M-04', '브랜드 언급률', mentioned, nAnswer.length);
  }

  /**
   * M-05: 전체 수집 대비 언급률 = 브랜드 언급 수 / N_cap
   */
  static calcM05(slots: RawSlotInput[]): MetricRatio {
    const captured = slots.filter((s) => s.captureStatus === 'captured');
    const nAnswer = captured.filter(
      (s) => s.semantic === 'substantive' || s.semantic === 'insufficient'
    );
    const mentioned = nAnswer.filter((s) => s.brandMentioned).length;
    return makeRatio('M-05', '전체 수집 대비 언급률', mentioned, captured.length);
  }

  /**
   * M-06: 추천 응답률 = open 질문 N_answer 중 대상 브랜드 추천 수 / open 질문 N_answer
   */
  static calcM06(slots: RawSlotInput[]): MetricRatio {
    const openAnswer = slots.filter(
      (s) =>
        s.probeType === 'open' &&
        s.captureStatus === 'captured' &&
        (s.semantic === 'substantive' || s.semantic === 'insufficient')
    );
    const recommended = openAnswer.filter((s) => s.brandRecommended).length;
    return makeRatio('M-06', '추천 응답률', recommended, openAnswer.length);
  }

  /**
   * M-07: 추천 점유율 = 대상 추천 응답 수 / 고정 경쟁군 추천 합
   */
  static calcM07(targetBrand: string, competitorRecommendationCounts: Record<string, number>): MetricRatio {
    const numerator = competitorRecommendationCounts[targetBrand] || 0;
    const denominator = Object.values(competitorRecommendationCounts).reduce((acc, c) => acc + c, 0);
    return makeRatio('M-07', `${targetBrand} 추천 점유율`, numerator, denominator, '고정 경쟁군 내 추천 비중');
  }

  /**
   * M-08: H2H 결과 분포
   */
  static calcM08(slots: RawSlotInput[]): MetricDistribution<H2HResult> {
    const h2hSlots = slots.filter((s) => s.probeType === 'h2h' && s.captureStatus === 'captured' && s.h2hResult);
    const total = h2hSlots.length;
    const counts: Record<H2HResult, number> = {
      target_favorable: 0,
      opponent_favorable: 0,
      conditional: 0,
      tie: 0,
      indeterminate: 0,
    };
    for (const s of h2hSlots) {
      if (s.h2hResult) counts[s.h2hResult]++;
    }
    const proportions: Record<H2HResult, number | null> = {
      target_favorable: total > 0 ? counts.target_favorable / total : null,
      opponent_favorable: total > 0 ? counts.opponent_favorable / total : null,
      conditional: total > 0 ? counts.conditional / total : null,
      tie: total > 0 ? counts.tie / total : null,
      indeterminate: total > 0 ? counts.indeterminate / total : null,
    };
    return {
      id: 'M-08',
      name: 'H2H 결과 분포',
      counts,
      total,
      proportions,
    };
  }

  /**
   * M-09: 공식 채널 인용률
   */
  static calcM09(slots: RawSlotInput[]): MetricRatio {
    const nAnswer = slots.filter(
      (s) => s.captureStatus === 'captured' && (s.semantic === 'substantive' || s.semantic === 'insufficient')
    );
    const cited = nAnswer.filter((s) => s.officialChannelCited).length;
    return makeRatio('M-09', '공식 채널 인용률', cited, nAnswer.length);
  }

  /**
   * M-10: 출처 도메인별 인용 비중
   */
  static calcM10(slots: RawSlotInput[]): Record<string, MetricRatio> {
    const domainCounts: Record<string, number> = {};
    let totalDomainHits = 0;

    for (const s of slots) {
      if (s.captureStatus !== 'captured' || !s.citedUrls) continue;
      const seenDomainsInSlot = new Set<string>();
      for (const url of s.citedUrls) {
        try {
          const parsed = new URL(url);
          seenDomainsInSlot.add(parsed.hostname);
        } catch {
          // 정규화 실패 URL 무시
        }
      }
      for (const dom of seenDomainsInSlot) {
        domainCounts[dom] = (domainCounts[dom] || 0) + 1;
        totalDomainHits++;
      }
    }

    const result: Record<string, MetricRatio> = {};
    for (const [dom, cnt] of Object.entries(domainCounts)) {
      result[dom] = makeRatio('M-10', `도메인 인용 비중: ${dom}`, cnt, totalDomainHits);
    }
    return result;
  }

  /**
   * M-11: 직접 갱신 가능 출처 비중
   */
  static calcM11(slots: RawSlotInput[]): MetricRatio {
    const captured = slots.filter((s) => s.captureStatus === 'captured');
    let controllableHits = 0;
    let totalHits = 0;

    for (const s of captured) {
      if (!s.citedUrls || s.citedUrls.length === 0) continue;
      totalHits++;
      if (s.controllableSourceCited) {
        controllableHits++;
      }
    }
    return makeRatio('M-11', '직접 갱신 가능 출처 비중', controllableHits, totalHits);
  }

  /**
   * M-12: 검증 가능 주장 비율
   */
  static calcM12(claims: ClaimVerificationInput[]): MetricRatio {
    const verifiable = claims.filter((c) => c.hasIndependentStandard).length;
    return makeRatio('M-12', '검증 가능 주장 비율', verifiable, claims.length);
  }

  /**
   * M-13: 확인된 주장 정확도 = 맞음 / (맞음 + 틀림)
   */
  static calcM13(claims: ClaimVerificationInput[]): MetricRatio {
    const evaluated = claims.filter((c) => c.verdict === 'correct' || c.verdict === 'incorrect');
    const correct = evaluated.filter((c) => c.verdict === 'correct').length;
    return makeRatio('M-13', '확인된 주장 정확도', correct, evaluated.length);
  }

  /**
   * M-14: 인용의 주장 지원 비율
   */
  static calcM14(claims: ClaimVerificationInput[]): MetricRatio {
    const checked = claims.filter((c) => c.citationSupportsClaim !== undefined);
    const supported = checked.filter((c) => c.citationSupportsClaim === true).length;
    return makeRatio('M-14', '인용의 주장 지원 비율', supported, checked.length);
  }

  /**
   * M-15: 의도한 설명과의 차이
   */
  static calcM15(diffs: DescriptionDiffInput[]): MetricDistribution<'match' | 'omission' | 'different' | 'indeterminate'> {
    const counts = { match: 0, omission: 0, different: 0, indeterminate: 0 };
    for (const d of diffs) counts[d.status]++;
    const total = diffs.length;
    return {
      id: 'M-15',
      name: '의도한 설명과의 차이',
      counts,
      total,
      proportions: {
        match: total > 0 ? counts.match / total : null,
        omission: total > 0 ? counts.omission / total : null,
        different: total > 0 ? counts.different / total : null,
        indeterminate: total > 0 ? counts.indeterminate / total : null,
      },
    };
  }

  /**
   * M-16: 언어별 관찰 차이 (%p)
   */
  static calcM16(koRatio: MetricRatio, enRatio: MetricRatio): {
    baseMetric: string;
    gapPercentagePoints: number | null;
    koRatio: MetricRatio;
    enRatio: MetricRatio;
  } {
    if (koRatio.rate === null || enRatio.rate === null) {
      return {
        baseMetric: koRatio.name,
        gapPercentagePoints: null,
        koRatio,
        enRatio,
      };
    }
    const gap = (koRatio.rate - enRatio.rate) * 100;
    return {
      baseMetric: koRatio.name,
      gapPercentagePoints: Math.round(gap * 10) / 10,
      koRatio,
      enRatio,
    };
  }
}
