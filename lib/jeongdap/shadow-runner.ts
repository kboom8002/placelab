// lib/jeongdap/shadow-runner.ts
// 출처:
// - docs/IMPLEMENTATION-PLAN-jeongdap-note.md §11.1 (TS 그림자 실행 및 중단 규칙 P02 L141-149)
// - AGENTS.md v2.0 INV-7, INV-11, INV-13

import {
  H5_MIN_CREW_COUNT,
  PLACEBO_GLOBAL_STOP_RATE,
  TOOL_SOURCES_MISSING_HOLD_RATE,
} from './constants';
import { StageEvaluationResult } from './source-stages';

export interface BlockStoppingRuleInput {
  expectedModelVersion: string;
  observedModelVersions: readonly string[];
  totalResponses: number;
  missingToolSourcesCount: number;
  placeboFpRate: number;
  activeCrewCount: number;
}

export interface BlockStoppingRuleVerdict {
  canProceedPrimary: boolean;
  holdStage1: boolean;
  holdAppearance: boolean;
  holdH5CrewComparison: boolean;
  rerunRequiredForModelDrift: boolean;
  reasons: string[];
}

/**
 * 1차 사전 등록 중단 규칙 (02_first-round-preregistration.md L141-149):
 * 1) 모델 판본이 블록 도중 바뀌면 해당 블록 재측정 (rerunRequiredForModelDrift)
 * 2) 도구 반환 목록(tool_sources) 누락이 5% 초과면 1단(검색 노출) 판정 보류 (holdStage1)
 * 3) 위약 거짓 양성률이 10% 이상이면 등장 판정 전체 보류 (holdAppearance)
 * 4) 시민 확인단 활동 인원이 15명 미만이면 H5 검증 보류 (holdH5CrewComparison)
 */
export function evaluateBlockStoppingRules(input: BlockStoppingRuleInput): BlockStoppingRuleVerdict {
  const reasons: string[] = [];

  const uniqueModels = Array.from(new Set(input.observedModelVersions.filter(Boolean)));
  const rerunRequiredForModelDrift =
    uniqueModels.length > 1 ||
    (uniqueModels.length === 1 &&
      Boolean(input.expectedModelVersion) &&
      uniqueModels[0] !== input.expectedModelVersion);

  if (rerunRequiredForModelDrift) {
    reasons.push(
      `블록 내 반환 모델 판본 변동 감지(기대: ${input.expectedModelVersion}, 관측: ${uniqueModels.join(', ')}) — 블록 재측정 필요`
    );
  }

  const missingRate =
    input.totalResponses > 0 ? input.missingToolSourcesCount / input.totalResponses : 0;
  const holdStage1 = missingRate > TOOL_SOURCES_MISSING_HOLD_RATE;
  if (holdStage1) {
    reasons.push(
      `도구 반환 목록(tool_sources) 누락률 ${(missingRate * 100).toFixed(1)}% > 5.0% — 1단(검색에 뜸) 판정 보류`
    );
  }

  const holdAppearance = input.placeboFpRate >= PLACEBO_GLOBAL_STOP_RATE;
  if (holdAppearance) {
    reasons.push(
      `위약 문항 거짓 양성률 ${(input.placeboFpRate * 100).toFixed(1)}% >= 10.0% — 등장 판정 전체 보류`
    );
  }

  const holdH5CrewComparison = input.activeCrewCount < H5_MIN_CREW_COUNT;
  if (holdH5CrewComparison) {
    reasons.push(`시민 확인단 활동 인원(${input.activeCrewCount}명) < ${H5_MIN_CREW_COUNT}명 — H5 가설 검증 보류`);
  }

  return {
    canProceedPrimary: !rerunRequiredForModelDrift && !holdAppearance,
    holdStage1,
    holdAppearance,
    holdH5CrewComparison,
    rerunRequiredForModelDrift,
    reasons,
  };
}

/**
 * Python 자동 판정기와 TS 자동 판정기 간 1~3단 일치율 계산 (0단계 그림자 실행 검증용)
 */
export function compareShadowStageAgreement(
  pythonResults: readonly Pick<
    StageEvaluationResult,
    's1AppearedInSearch' | 's2CitedByAi' | 's3FirstCitationOfficial'
  >[],
  tsResults: readonly Pick<
    StageEvaluationResult,
    's1AppearedInSearch' | 's2CitedByAi' | 's3FirstCitationOfficial'
  >[]
): { count: number; s1Agreement: number; s2Agreement: number; s3Agreement: number; allThreeAgreement: number } {
  const n = Math.min(pythonResults.length, tsResults.length);
  if (n === 0) {
    return { count: 0, s1Agreement: 1, s2Agreement: 1, s3Agreement: 1, allThreeAgreement: 1 };
  }
  let s1Hit = 0;
  let s2Hit = 0;
  let s3Hit = 0;
  let allHit = 0;

  for (let i = 0; i < n; i++) {
    const p = pythonResults[i];
    const t = tsResults[i];
    const m1 = p.s1AppearedInSearch === t.s1AppearedInSearch;
    const m2 = p.s2CitedByAi === t.s2CitedByAi;
    const m3 = p.s3FirstCitationOfficial === t.s3FirstCitationOfficial;
    if (m1) s1Hit++;
    if (m2) s2Hit++;
    if (m3) s3Hit++;
    if (m1 && m2 && m3) allHit++;
  }

  return {
    count: n,
    s1Agreement: s1Hit / n,
    s2Agreement: s2Hit / n,
    s3Agreement: s3Hit / n,
    allThreeAgreement: allHit / n,
  };
}
