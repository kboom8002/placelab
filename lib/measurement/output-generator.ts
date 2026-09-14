// lib/measurement/output-generator.ts
// docs/measurement-spec: 산출물 생성기 및 3대 공표 경로 게이트웨이
// 규율: spec/05_산출물.md, schema/output.schema.json
// 불변식: 5대 절 순서 고정, 전국 공표문 사전통지 게이트 강제,
//        총점/순위/등급/가중치/빈칸수/예측치 생성 절대 금지.

import type {
  Output,
  OutputSection,
  PublicationChannel,
  Grid,
  Verdict,
  Observation,
  SensitivityFlag,
} from '@/lib/types/measurement-spec';

export const PROXY_NOTICE_DEFAULT =
  '조회 응답은 사용자가 실제로 보는 답과 같지 않습니다. 접속 경로, 개인화, 지역, 시점이 다릅니다 (spec/03 §1).';

/** 익명 원자료의 역추적 방지를 위한 최소 기관 수 (spec/05 §6.3) */
export const MIN_CELL_SIZE = 5;

export interface BuildOutputOptions {
  outputId?: string;
  channel: PublicationChannel;
  agencyHandle: string;
  runProfileId: string;
  observedStart: string;
  observedEnd: string;
  ledgerAsOf: string;
  notifiedAt?: string;
  reviewClosedAt?: string;
  grid?: Grid;
  verdicts: Verdict[];
  observations: Observation[];
  peerGroupBand?: string;
  peerGroupId?: string;
  residualSpreadValue?: any;
  /** anonymized_dataset 경로: 같은 동류집단 × 계열 내 기관 수 */
  peerGroupSize?: number;
  /** 채널별 필터링에 사용할 문항 민감도 맵 (question_id → sensitivity) */
  questionSensitivityMap?: Record<string, SensitivityFlag>;
  /** 역점사업 question_id 접두사 (기본: 'PRJ-'). national_report에서 자동 제외 */
  projectQuestionPrefix?: string;
  note?: string;
}

// ── 익명 손잡이 치환 유틸리티 ──────────────────────────────────

const ANON_LABELS = [
  'A군', 'B시', 'C구', 'D군', 'E시', 'F구', 'G군', 'H시', 'I구',
  'J군', 'K시', 'L구', 'M군', 'N시', 'O구', 'P군', 'Q시', 'R구',
  'S군', 'T시', 'U구', 'V군', 'W시', 'X구', 'Y군', 'Z시',
];

const anonHandleCache = new Map<string, string>();

/**
 * 실명 손잡이를 익명 라벨로 치환한다. 같은 손잡이는 동일 세션 내 같은 라벨로 고정.
 * 전국 공표문(national_report) 및 익명 원자료(anonymized_dataset)에서 사용.
 */
export function anonymizeHandle(agencyHandle: string): string {
  if (anonHandleCache.has(agencyHandle)) {
    return anonHandleCache.get(agencyHandle)!;
  }
  const idx = anonHandleCache.size;
  const label = idx < ANON_LABELS.length
    ? ANON_LABELS[idx]
    : `익명-${(idx + 1).toString().padStart(3, '0')}`;
  anonHandleCache.set(agencyHandle, label);
  return label;
}

/** 세션 간 익명 캐시 초기화 (테스트용) */
export function resetAnonymization(): void {
  anonHandleCache.clear();
}

// ── 채널별 필터 유틸리티 ──────────────────────────────────────

/**
 * 채널에 따라 판정·관측 목록을 필터링한다.
 * - national_report: 민감도 restricted 문항 제외, 역점사업(PRJ-) 제외
 * - agency_notice: 해당 기관 소속 데이터만 포함
 * - anonymized_dataset: restricted 및 역점사업 제외
 */
function filterByChannel(
  channel: PublicationChannel,
  agencyHandle: string,
  verdicts: Verdict[],
  observations: Observation[],
  sensitivityMap?: Record<string, SensitivityFlag>,
  projectPrefix?: string,
): { filteredVerdicts: Verdict[]; filteredObservations: Observation[] } {
  const prefix = projectPrefix || 'PRJ-';

  let filteredVerdicts = [...verdicts];
  let filteredObservations = [...observations];

  if (channel === 'national_report' || channel === 'anonymized_dataset') {
    // 역점사업 문항 제외
    filteredVerdicts = filteredVerdicts.filter((v) => !v.question_id.startsWith(prefix));
    filteredObservations = filteredObservations.filter((o) => !o.question_id.startsWith(prefix));

    // 민감도 restricted 문항 제외
    if (sensitivityMap) {
      filteredVerdicts = filteredVerdicts.filter(
        (v) => sensitivityMap[v.question_id] !== 'restricted'
      );
      filteredObservations = filteredObservations.filter(
        (o) => sensitivityMap[o.question_id] !== 'restricted'
      );
    }
  }

  if (channel === 'agency_notice') {
    // 해당 기관 데이터만 포함, 타 기관 상태 배제
    filteredVerdicts = filteredVerdicts.filter((v) => v.agency_handle === agencyHandle);
    filteredObservations = filteredObservations.filter((o) => o.agency_handle === agencyHandle);
  }

  return { filteredVerdicts, filteredObservations };
}

// ── 메인 빌더 ────────────────────────────────────────────────

/**
 * 5대 절 순서를 엄격히 준수하여 규격 합격 산출물 레코드 생성
 */
export function buildOutput(options: BuildOutputOptions): Output {
  const outputId =
    options.outputId ||
    `OUT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${options.channel.slice(0, 3).toUpperCase()}-${Math.random().toString(36).slice(2, 8)}`;

  // 1. 전국 공표문 게이트 검사: 사전 통지 및 확인 기간 필수
  if (options.channel === 'national_report') {
    if (!options.notifiedAt || !options.reviewClosedAt) {
      throw new Error(
        '전국 공표문(national_report)은 사전 통지(notified_at)와 확인 기간 종료(review_closed_at)를 거쳐야만 공표할 수 있습니다 (spec/05 §6)'
      );
    }
  }

  // 2. 익명 원자료 역추적 방지 게이트: 동류집단 × 계열 최소 기관 수 검사
  if (options.channel === 'anonymized_dataset') {
    const size = options.peerGroupSize ?? 0;
    if (size > 0 && size < MIN_CELL_SIZE) {
      throw new Error(
        `익명 원자료(anonymized_dataset)의 동류집단 × 계열 조합 기관 수(${size})가 최소 요건(${MIN_CELL_SIZE}곳)에 미달합니다. 역추적 방지를 위해 자동 제외됩니다 (spec/05 §6.3)`
      );
    }
  }

  // 3. 채널별 필터링 적용
  const { filteredVerdicts, filteredObservations } = filterByChannel(
    options.channel,
    options.agencyHandle,
    options.verdicts,
    options.observations,
    options.questionSensitivityMap,
    options.projectQuestionPrefix,
  );

  // 4. 전국 공표문 / 익명 원자료의 기관 실명 노출 금지 — 익명 손잡이 치환
  const displayHandle =
    options.channel === 'national_report' || options.channel === 'anonymized_dataset'
      ? anonymizeHandle(options.agencyHandle)
      : options.agencyHandle;

  // 5. 5대 절 조립 (순서 변경 절대 금지)
  const sections: OutputSection[] = [];

  // 절 1: 정본 부재 영역과 그 귀속 (canon_absence_and_ownership)
  const canonAbsentRows = options.grid
    ? options.grid.rows.filter((r) => r.row_verdict === 'canon_absent')
    : [];
  sections.push({
    order: 1,
    kind: 'canon_absence_and_ownership',
    items: canonAbsentRows.map((r) => ({
      question_id: r.question_id,
      ownership: r.ownership,
    })),
  });

  // 절 2: 서술형 개체의 실재·등록 상태 (entity_existence)
  const descriptiveRows = options.grid
    ? options.grid.rows.filter((r) => r.cells.some((c) => c.value === 'published'))
    : [];
  sections.push({
    order: 2,
    kind: 'entity_existence',
    items: descriptiveRows.map((r) => ({
      question_id: r.question_id,
      published_roles: r.cells
        .filter((c) => c.value === 'published')
        .map((c) => c.actor_role),
    })),
  });

  // 절 3: 무응답 귀책 분포 (nonresponse_distribution)
  const nonresponseVerdicts = filteredVerdicts.filter(
    (v) => v.nonresponse_code !== undefined
  );
  sections.push({
    order: 3,
    kind: 'nonresponse_distribution',
    items: nonresponseVerdicts.map((v) => ({
      question_id: v.question_id,
      nonresponse_code: v.nonresponse_code,
      note: v.note,
    })),
  });

  // 절 4: 공적 출처가 근거로 쓰인 정도 (public_source_citation)
  // 상용 도구 복제품 오해 방지를 위해 4절에 엄격 배치
  const publicSourceObs = filteredObservations.map((obs) => ({
    question_id: obs.question_id,
    public_source_present: obs.extracted.public_source_present,
    body_url_count: obs.extracted.body_url_count,
    citation_url_count: obs.extracted.citation_url_count,
  }));
  sections.push({
    order: 4,
    kind: 'public_source_citation',
    items: publicSourceObs,
  });

  // 절 5: 여건 고정 후 잔여 폭 (residual_spread)
  sections.push({
    order: 5,
    kind: 'residual_spread',
    items: options.residualSpreadValue ? [options.residualSpreadValue] : [],
  });

  return {
    output_id: outputId,
    channel: options.channel,
    proxy_notice: PROXY_NOTICE_DEFAULT,
    run_profile_id: options.runProfileId,
    observed_at: {
      start: options.observedStart,
      end: options.observedEnd,
    },
    ledger_as_of: options.ledgerAsOf,
    notified_at: options.notifiedAt,
    review_closed_at: options.reviewClosedAt,
    band: options.peerGroupBand,
    band_of: options.peerGroupId,
    sections,
    note: options.note,
  };
}
