// lib/maps/core/fingerprint.ts
// 카나리아 문항 지문(Fingerprint) 드리프트 감지 및 모델 업데이트 의심 경보
// 근거: ADR-0026, MAPS-INV-12

import { CANARY_DRIFT_THRESHOLD } from './constants';

export interface CanaryFingerprintVector {
  engineId: string;
  checkedAtIso: string;
  avgResponseLength: number;
  refusalRate: number;
  citationCountMean: number;
  anchorTokenHitRate: number;
}

export interface CanaryDriftResult {
  engineId: string;
  checkedAtIso: string;
  driftScore: number;
  modelUpdateSuspected: boolean;
  notes: string;
}

/**
 * 기준 카나리아 지문(baseline)과 현재 지문(current) 사이의 정규화 변동을 계산하여
 * 임계값(0.25) 이상이면 모델 업데이트 의심(modelUpdateSuspected = true)으로 표기한다.
 */
export function detectModelUpdate(
  baseline: CanaryFingerprintVector,
  current: CanaryFingerprintVector,
  threshold: number = CANARY_DRIFT_THRESHOLD
): CanaryDriftResult {
  const lenDiff =
    Math.abs(current.avgResponseLength - baseline.avgResponseLength) /
    Math.max(100, baseline.avgResponseLength);
  const refusalDiff = Math.abs(current.refusalRate - baseline.refusalRate);
  const citeDiff =
    Math.abs(current.citationCountMean - baseline.citationCountMean) /
    Math.max(1, baseline.citationCountMean);
  const anchorDiff = Math.abs(
    current.anchorTokenHitRate - baseline.anchorTokenHitRate
  );

  const rawScore =
    lenDiff * 0.25 + refusalDiff * 0.25 + citeDiff * 0.25 + anchorDiff * 0.25;
  const driftScore = Number(Math.min(1, rawScore).toFixed(4));
  const modelUpdateSuspected = driftScore >= threshold;

  return {
    engineId: current.engineId,
    checkedAtIso: current.checkedAtIso,
    driftScore,
    modelUpdateSuspected,
    notes: modelUpdateSuspected
      ? `카나리아 지문 변동(${driftScore})이 임계값(${threshold}) 이상이므로 모델/검색기 내부 업데이트 구간으로 분리합니다.`
      : `카나리아 지문 안정 (변동 ${driftScore} < ${threshold})`,
  };
}
