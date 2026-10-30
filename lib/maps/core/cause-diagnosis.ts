// lib/maps/core/cause-diagnosis.ts
// 6단계 원인 소거 진단 트리(Stage 1~6) 및 1:1 실행 처방전 산출 엔진
// 근거: ADR-0026, FR-100, docs/maps-concept-repo-v1.0.md §7

import { MAPS_STAGE_PRESCRIPTION_META } from './constants';
import type {
  MapsDiagnosisStage,
  MapsPrescriptionCode,
  MapsVerdict6Way,
} from './types';

export interface CauseSignalInput {
  /** Stage 1: 공식 도메인 내에 해당 속성이 적힌 웹페이지가 존재하는가 */
  hasCanonicalWebPage: boolean;
  /** Stage 2: 수집기(robots.txt 및 HTTP 200 SSR) 접근이 열려 있는가 */
  isCrawlAccessible: boolean;
  /** Stage 3: 검색 도구 1단 후보 목록(search sources)에 공식 URL이 포착되는가 */
  isCapturedInSearchCandidates: boolean;
  /** Stage 4: 문서가 통이미지/스캔 PDF가 아닌 기계 가독 HTML/JSON-LD 구조인가 */
  isMachineParseableHtmlOrJsonLd: boolean;
  /** Stage 5: 웹상에 구버전 공지나 외부 요약본과의 날짜/내용 충돌이 없는가 */
  isFreeOfOutdatedConflict: boolean;
  /** 관측된 대표 판정 */
  sampleVerdict?: MapsVerdict6Way;
}

export interface CauseDiagnosisResult {
  diagnosisStage: MapsDiagnosisStage;
  stageOrder: number;
  stageLabelKo: string;
  prescriptionCode: MapsPrescriptionCode;
  prescriptionTitleKo: string;
  prescriptionSteps: string[];
  feasibility: number;
  costEfficiency: number;
}

/**
 * 1단계부터 6단계까지 순서대로 소거(Elimination)하여 가장 먼저 실패한 병목 단계를 진단하고
 * 그에 1:1로 대응하는 실행 처방전을 반환한다.
 *
 * Stage 1 (공식 정본 유무) -> Stage 2 (수집 접근성) -> Stage 3 (검색 발견성) ->
 * Stage 4 (기계 가독성/파싱) -> Stage 5 (구버전 경합·날짜 충돌) -> Stage 6 (모델 내부 잔상)
 */
export function diagnoseCause6Stage(
  signal: CauseSignalInput
): CauseDiagnosisResult {
  let stage: MapsDiagnosisStage;

  if (!signal.hasCanonicalWebPage) {
    stage = 'S1_existence';
  } else if (!signal.isCrawlAccessible) {
    stage = 'S2_crawl_access';
  } else if (!signal.isCapturedInSearchCandidates) {
    stage = 'S3_indexing_discoverability';
  } else if (!signal.isMachineParseableHtmlOrJsonLd) {
    stage = 'S4_parseability';
  } else if (
    !signal.isFreeOfOutdatedConflict ||
    signal.sampleVerdict === 'outdated'
  ) {
    stage = 'S5_conflict_recency';
  } else {
    stage = 'S6_model_internal';
  }

  const meta = MAPS_STAGE_PRESCRIPTION_META[stage];

  return {
    diagnosisStage: stage,
    stageOrder: meta.stageOrder,
    stageLabelKo: meta.stageLabelKo,
    prescriptionCode: meta.prescriptionCode,
    prescriptionTitleKo: meta.prescriptionTitleKo,
    prescriptionSteps: [...meta.defaultSteps],
    feasibility: meta.defaultFeasibility,
    costEfficiency: meta.defaultCostEfficiency,
  };
}
