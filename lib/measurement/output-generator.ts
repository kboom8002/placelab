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
} from '@/lib/types/measurement-spec';

export const PROXY_NOTICE_DEFAULT =
  '조회 응답은 사용자가 실제로 보는 답과 같지 않습니다. 접속 경로, 개인화, 지역, 시점이 다릅니다 (spec/03 §1).';

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
  note?: string;
}

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

  // 2. 5대 절 조립 (순서 변경 절대 금지)
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
  const nonresponseVerdicts = options.verdicts.filter(
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
  const publicSourceObs = options.observations.map((obs) => ({
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
