// lib/measurement/verifier.ts
// docs/measurement-spec: 4판정 엔진
// 규율: spec/04_판정_규칙.md, schema/verdict.schema.json
// 불변식: judged_by = 'rule' (언어 모형 개입 절대 금지), 점수/등급/순위 산출 금지,
//        결과는 match / mismatch / not_confirmed 셋뿐.

import type {
  Question,
  Observation,
  Verdict,
  NonresponseCode,
  MismatchCode,
  ValueNature,
} from '@/lib/types/measurement-spec';

export interface GroundTruthItem {
  questionId: string;
  ledgerValue: string | null;
  ledgerValueNature?: ValueNature;
  ledgerAsOf: string; // YYYY-MM-DD
  ledgerStale?: boolean;
  expectedKeywords?: string[];
  collisionNames?: string[];
}

export interface VerifyOptions {
  question: Question;
  observation: Observation;
  groundTruth?: GroundTruthItem;
  referenceDate?: string;
}

/**
 * 규칙과 원장 대조로만 판정하는 결정론적 판정기 (judged_by: 'rule')
 */
export function verifyObservation(options: VerifyOptions): Verdict {
  const { question, observation, groundTruth } = options;
  const judgedAt = new Date().toISOString();
  const dateTag = judgedAt.slice(0, 10).replace(/-/g, '');
  const randTag = Math.random().toString(36).slice(2, 8);
  const verdictId = `VRD-${dateTag}-${question.id}-${randTag}`;

  const ledgerAsOf = groundTruth?.ledgerAsOf || options.referenceDate || judgedAt.slice(0, 10);
  const billable = question.difficulty !== 'D0'; // D0 무료 도구 항목은 청구 불가

  // 1. 회차 간 답이 갈린 경우 (unstable: true) → 판정 확정 불가
  if (observation.unstable) {
    return {
      verdict_id: verdictId,
      observation_id: observation.observation_id,
      question_id: question.id,
      agency_handle: observation.agency_handle,
      result: 'not_confirmed',
      judged_by: 'rule',
      judged_at: judgedAt,
      ledger_as_of: ledgerAsOf,
      billable,
      note: '회차 사이에 답이 갈려 판정을 확정하지 않음 (spec/03 §5)',
    };
  }

  // 2. 원장 자체가 낡아 있는 경우 (ledger_stale: true) → 판정 불가 (스키마 강제: result = not_confirmed)
  if (groundTruth?.ledgerStale) {
    return {
      verdict_id: verdictId,
      observation_id: observation.observation_id,
      question_id: question.id,
      agency_handle: observation.agency_handle,
      result: 'not_confirmed',
      ledger_stale: true,
      judged_by: 'rule',
      judged_at: judgedAt,
      ledger_as_of: ledgerAsOf,
      billable,
      note: '원장 자체가 낡아 있어 판정을 내리지 않음 (spec/04 §6)',
    };
  }

  // 3. 서술형 문항인 경우 → 애초에 값 판정 대상이 아님 (격자에서 다룸)
  if (question.type === 'descriptive') {
    return {
      verdict_id: verdictId,
      observation_id: observation.observation_id,
      question_id: question.id,
      agency_handle: observation.agency_handle,
      result: 'not_confirmed',
      judged_by: 'rule',
      judged_at: judgedAt,
      ledger_as_of: ledgerAsOf,
      billable,
      note: '서술형 문항은 값 판정 대상이 아니며 질문-주체 격자 대상임',
    };
  }

  const extracted = observation.extracted;
  const statedVal = extracted?.stated_value;

  // 4. 답이 나오지 않은 경우 → 무응답 귀책 코드(N1~N5) 판정
  if (!statedVal || statedVal.trim() === '' || statedVal.includes('(응답 없음)')) {
    let nonresponse: NonresponseCode = 'N2'; // 기본: 내용 부재

    if (observation.access_state && observation.access_state.robots_allows === false) {
      nonresponse = 'N1'; // 기술 차단
    } else if (statedVal?.includes('제공할 수 없습니다') || statedVal?.includes('거절')) {
      nonresponse = 'N5'; // 엔진 회피
    }

    return {
      verdict_id: verdictId,
      observation_id: observation.observation_id,
      question_id: question.id,
      agency_handle: observation.agency_handle,
      result: 'not_confirmed',
      nonresponse_code: nonresponse,
      ledger_value: groundTruth?.ledgerValue ?? null,
      ledger_value_nature: groundTruth?.ledgerValueNature || 'unstated',
      judged_by: 'rule',
      judged_at: judgedAt,
      ledger_as_of: ledgerAsOf,
      billable,
      note: `답이 나오지 않음 (귀책 코드: ${nonresponse})`,
    };
  }

  // 5. 원장 자료가 제공되지 않은 경우 → 대조 불가
  if (!groundTruth || groundTruth.ledgerValue === undefined) {
    return {
      verdict_id: verdictId,
      observation_id: observation.observation_id,
      question_id: question.id,
      agency_handle: observation.agency_handle,
      result: 'not_confirmed',
      mismatch_code: 'C0',
      judged_by: 'rule',
      judged_at: judgedAt,
      ledger_as_of: ledgerAsOf,
      billable,
      note: '대조할 원장 기준값이 등록되지 않음',
    };
  }

  // 6. 대상 혼동(C4) 확인
  if (groundTruth.collisionNames && groundTruth.collisionNames.length > 0) {
    const collided = groundTruth.collisionNames.filter((name) =>
      statedVal.includes(name)
    );
    if (collided.length > 0) {
      return {
        verdict_id: verdictId,
        observation_id: observation.observation_id,
        question_id: question.id,
        agency_handle: observation.agency_handle,
        result: 'mismatch',
        mismatch_code: 'C4', // 대상 혼동
        ledger_value: groundTruth.ledgerValue,
        ledger_value_nature: groundTruth.ledgerValueNature || 'unstated',
        name_collision: collided,
        judged_by: 'rule',
        judged_at: judgedAt,
        ledger_as_of: ledgerAsOf,
        billable,
        note: `같은 이름의 다른 대상 혼동 (${collided.join(', ')})`,
      };
    }
  }

  // 7. 원장 대조 (규칙 기반 매칭)
  const targetLedger = (groundTruth.ledgerValue || '').trim().toLowerCase();
  const lowerStated = statedVal.toLowerCase();

  const isExactMatch = targetLedger !== '' && lowerStated.includes(targetLedger);
  const isKeywordMatch =
    groundTruth.expectedKeywords &&
    groundTruth.expectedKeywords.length > 0 &&
    groundTruth.expectedKeywords.every((kw) => lowerStated.includes(kw.toLowerCase()));

  if (isExactMatch || isKeywordMatch) {
    return {
      verdict_id: verdictId,
      observation_id: observation.observation_id,
      question_id: question.id,
      agency_handle: observation.agency_handle,
      result: 'match',
      ledger_value: groundTruth.ledgerValue,
      ledger_value_nature: groundTruth.ledgerValueNature || 'measured',
      judged_by: 'rule',
      judged_at: judgedAt,
      ledger_as_of: ledgerAsOf,
      billable,
    };
  }

  // 불일치 시 부정합 코드(C1: 값 불일치 또는 C2: 출처 부적절) 부여
  const mismatch: MismatchCode = !extracted.public_source_present ? 'C2' : 'C1';

  return {
    verdict_id: verdictId,
    observation_id: observation.observation_id,
    question_id: question.id,
    agency_handle: observation.agency_handle,
    result: 'mismatch',
    mismatch_code: mismatch,
    ledger_value: groundTruth.ledgerValue,
    ledger_value_nature: groundTruth.ledgerValueNature || 'measured',
    judged_by: 'rule',
    judged_at: judgedAt,
    ledger_as_of: ledgerAsOf,
    billable,
    note: `원장 값과 어긋남 (${mismatch === 'C2' ? '공적 출처 부재 및 값 불일치' : '값 불일치'})`,
  };
}
