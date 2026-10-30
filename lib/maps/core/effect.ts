// lib/maps/core/effect.ts
// 대조군 동반 개입 전후 효과 추정(DiD) 및 모델 업데이트 구간 분리 엔진
// 근거: ADR-0026, C-4, C-13(MAPS-H1), MAPS-INV-07, MAPS-INV-12

import type { CanaryDriftResult } from './fingerprint';

export interface CohortRateWindow {
  preNumerator: number;
  preDenominator: number;
  postNumerator: number;
  postDenominator: number;
}

export interface EstimateMapsEffectInput {
  treated: CohortRateWindow;
  /** 대조군(비개입 속성 또는 동종 비교군). 없으면 인과 효과 주장 불가(MAPS-INV-07) */
  control: CohortRateWindow | null;
  canaryChecksDuringWindow?: readonly CanaryDriftResult[];
}

export interface MapsEffectEstimateResult {
  status:
    | 'valid_did'
    | 'exploratory_no_control'
    | 'segmented_by_model_update';
  /** 인과적 "개입 효과" 표현 허용 여부 (MAPS-INV-07) */
  effectClaimAllowed: boolean;
  modelUpdateDetected: boolean;
  modelUpdateEventAt: string | null;
  treatedPreRate: number;
  treatedPostRate: number;
  treatedDelta: number;
  controlPreRate: number | null;
  controlPostRate: number | null;
  controlDelta: number | null;
  /** 순효과 DiD = (Treated Post - Treated Pre) - (Control Post - Control Pre) */
  didNetEffect: number | null;
  ci95Low: number | null;
  ci95High: number | null;
  timelineSegments: Array<{
    segmentLabel: string;
    note: string;
  }>;
  interpretationKo: string;
}

function safeRate(num: number, den: number): number {
  if (den <= 0) return 0;
  return Number((num / den).toFixed(4));
}

function seProp(p: number, n: number): number {
  if (n <= 0) return 0;
  const clamped = Math.min(0.99, Math.max(0.01, p));
  return Math.sqrt((clamped * (1 - clamped)) / n);
}

/**
 * 개입 전후 효과 추정 (Proof 모듈 핵심 로직)
 *
 * 불변식(MAPS-INV-07, MAPS-INV-12):
 * 1. 대조군(control)이 없거나 분모가 0이면 effectClaimAllowed = false 로 강제하고
 *    탐색적 전후 변화량만 보고한다 ("개입 효과"라는 인과 표현 금지).
 * 2. 측정 창 내부에 카나리아 모델 업데이트(modelUpdateSuspected = true)가 감지되면
 *    시계열을 업데이트 전/후 구간으로 강제 분리하고, 단일 연속선 인과 주장을 차단한다.
 */
export function estimateMapsEffect(
  input: EstimateMapsEffectInput
): MapsEffectEstimateResult {
  const { treated, control, canaryChecksDuringWindow = [] } = input;

  const treatedPreRate = safeRate(treated.preNumerator, treated.preDenominator);
  const treatedPostRate = safeRate(
    treated.postNumerator,
    treated.postDenominator
  );
  const treatedDelta = Number((treatedPostRate - treatedPreRate).toFixed(4));

  const suspectedCanary = canaryChecksDuringWindow.find(
    (c) => c.modelUpdateSuspected
  );
  const modelUpdateDetected = Boolean(suspectedCanary);
  const modelUpdateEventAt = suspectedCanary?.checkedAtIso ?? null;

  // 1. 대조군 부재 시 인과 주장 차단
  if (
    !control ||
    control.preDenominator <= 0 ||
    control.postDenominator <= 0
  ) {
    return {
      status: 'exploratory_no_control',
      effectClaimAllowed: false,
      modelUpdateDetected,
      modelUpdateEventAt,
      treatedPreRate,
      treatedPostRate,
      treatedDelta,
      controlPreRate: null,
      controlPostRate: null,
      controlDelta: null,
      didNetEffect: null,
      ci95Low: null,
      ci95High: null,
      timelineSegments: [
        {
          segmentLabel: '단일 코호트 전후 관측 (대조군 없음)',
          note: '비개입 대조군이 없으므로 외부 모델·웹 환경 변화와 정본 정비 효과를 분리할 수 없습니다.',
        },
      ],
      interpretationKo: `개입 대상의 정본 일치율이 ${(treatedPreRate * 100).toFixed(1)}%에서 ${(treatedPostRate * 100).toFixed(1)}%로 변했으나(Δ ${(treatedDelta * 100).toFixed(1)}%p), 비개입 대조군이 없어 인과적 개입 효과로 주장하지 않습니다(탐색적 전후 관측).`,
    };
  }

  const controlPreRate = safeRate(control.preNumerator, control.preDenominator);
  const controlPostRate = safeRate(
    control.postNumerator,
    control.postDenominator
  );
  const controlDelta = Number((controlPostRate - controlPreRate).toFixed(4));
  const didNetEffect = Number((treatedDelta - controlDelta).toFixed(4));

  const seTotal = Math.sqrt(
    seProp(treatedPreRate, treated.preDenominator) ** 2 +
      seProp(treatedPostRate, treated.postDenominator) ** 2 +
      seProp(controlPreRate, control.preDenominator) ** 2 +
      seProp(controlPostRate, control.postDenominator) ** 2
  );
  const halfWidth = 1.96 * seTotal;
  const ci95Low = Number((didNetEffect - halfWidth).toFixed(4));
  const ci95High = Number((didNetEffect + halfWidth).toFixed(4));

  // 2. 모델 업데이트 감지 시 구간 강제 분리 및 단일 연속 인과 주장 차단
  if (modelUpdateDetected) {
    return {
      status: 'segmented_by_model_update',
      effectClaimAllowed: false,
      modelUpdateDetected: true,
      modelUpdateEventAt,
      treatedPreRate,
      treatedPostRate,
      treatedDelta,
      controlPreRate,
      controlPostRate,
      controlDelta,
      didNetEffect,
      ci95Low,
      ci95High,
      timelineSegments: [
        {
          segmentLabel: `구간 1 · 모델 업데이트 이전 (~ ${modelUpdateEventAt})`,
          note: '개입 배포 직후 구 모델 지문 구간',
        },
        {
          segmentLabel: `구간 2 · 카나리아 드리프트 감지 이후 (${modelUpdateEventAt} ~)`,
          note: 'AI 서비스 자체 업데이트가 겹쳐 시계열을 분리 표기함 (MAPS-INV-07)',
        },
      ],
      interpretationKo: `대조군 차감 변화량은 ${(didNetEffect * 100).toFixed(1)}%p(95% CI ${(ci95Low * 100).toFixed(1)}~${(ci95High * 100).toFixed(1)}%p)이나, 관측 기간 중 카나리아 모델 드리프트(${modelUpdateEventAt})가 감지되어 시계열을 분리 표기하며 단독 개입 효과로 단정하지 않습니다.`,
    };
  }

  const significantPositive = ci95Low > 0;

  return {
    status: 'valid_did',
    effectClaimAllowed: significantPositive,
    modelUpdateDetected: false,
    modelUpdateEventAt: null,
    treatedPreRate,
    treatedPostRate,
    treatedDelta,
    controlPreRate,
    controlPostRate,
    controlDelta,
    didNetEffect,
    ci95Low,
    ci95High,
    timelineSegments: [
      {
        segmentLabel: '동일 카나리아 지문 내 개입 전·후 대조 구간',
        note: '카나리아 드리프트 임계값 미만, 비개입 대조군 동시 측정 완료',
      },
    ],
    interpretationKo: significantPositive
      ? `개입군 변화(+${(treatedDelta * 100).toFixed(1)}%p)에서 비개입 대조군 변화(${(controlDelta * 100).toFixed(1)}%p)를 뺀 대조군 대비 순변화(DiD)는 +${(didNetEffect * 100).toFixed(1)}%p (95% 신뢰 구간 +${(ci95Low * 100).toFixed(1)}~+${(ci95High * 100).toFixed(1)}%p)입니다.`
      : `대조군 대비 순변화(DiD)는 ${(didNetEffect * 100).toFixed(1)}%p (95% 신뢰 구간 ${(ci95Low * 100).toFixed(1)}~${(ci95High * 100).toFixed(1)}%p)로 95% 신뢰 구간이 0을 포함하여 통계적으로 확정하지 않습니다.`,
  };
}
