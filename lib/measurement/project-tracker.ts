// lib/measurement/project-tracker.ts
// docs/measurement-spec: 역점사업 지번(개별 확장) 프로빙 및 관리 엔진
// 규율: spec/02 §4, spec/03 §6, schema/project_record.schema.json
// 불변식: 3대 대상 요건(budgeted, owned, named) 필수, 6물음 슬롯,
//        단체장 치적/홍보 요소 전면 배제, withheld(미공개사유) 분리.

import type {
  ProjectRecord,
  ProjectStage,
  ProjectValueFact,
  ProjectWithheld,
} from '@/lib/types/measurement-spec';

export interface ProjectRegisterInput {
  projectId: string;
  agencyHandle: string;
  officialName: string;
  budgeted: boolean;
  owned: boolean;
  named: boolean;
  owningDepartment: string;
  stage: ProjectStage;
  stageAsOf: string; // YYYY-MM-DD
  stageLedger: string;
  ledgerStale?: boolean;
  canonicalUrl?: string | null;
  pressReleaseUrls?: string[];
  valueFacts?: ProjectValueFact[];
  withheld?: ProjectWithheld[];
  note?: string;
}

/**
 * 3대 요건을 검증하고 정규 ProjectRecord 인스턴스 생성
 */
export function createProjectRecord(input: ProjectRegisterInput): ProjectRecord {
  // 3대 요건 검증: 예산 편성, 소관 지정, 공식 사업명 확정
  if (!input.budgeted || !input.owned || !input.named) {
    throw new Error(
      `역점사업 등록 요건 미달 [${input.officialName}]: budgeted(${input.budgeted}), owned(${input.owned}), named(${input.named}) 모두 참이어야 합니다 (spec/02 §4.1)`
    );
  }

  // 가칭 여부 검증 (이름에 가칭/임시/예정 표기 방지)
  if (input.officialName.includes('(가칭)') || input.officialName.includes('가칭')) {
    throw new Error(
      `가칭 단계의 사업은 역점사업 레코드로 등록할 수 없습니다: ${input.officialName}`
    );
  }

  return {
    project_id: input.projectId,
    agency_handle: input.agencyHandle,
    official_name: input.officialName,
    eligibility: {
      budgeted: true,
      owned: true,
      named: true,
    },
    owning_department: input.owningDepartment,
    stage: input.stage,
    stage_as_of: input.stageAsOf,
    stage_ledger: input.stageLedger,
    ledger_stale: input.ledgerStale || false,
    canonical_url: input.canonicalUrl || null,
    press_release_urls: input.pressReleaseUrls || [],
    value_facts: input.valueFacts || [],
    withheld: input.withheld || [],
    sensitivity: 'agency_only', // 기관별 통보서 경로 전용
    note: input.note,
  };
}

/**
 * 사업 하나에 대한 표준 6개 질문 생성 (지번: PRJ-{handle}-{seq}-{slot})
 */
export function generateProjectQuestions(
  agencyHandle: string,
  agencyName: string,
  projectSeq: number,
  officialName: string
) {
  const prefix = `PRJ-${agencyHandle}-${projectSeq.toString().padStart(2, '0')}`;

  return [
    {
      id: `${prefix}-01`,
      slot: 'existence',
      text: `${agencyName}에서 추진하는 '${officialName}' 사업이 있습니까`,
      type: 'value' as const,
      ledger: '재정 공시 또는 예산서의 사업명',
    },
    {
      id: `${prefix}-02`,
      slot: 'location',
      text: `'${officialName}'의 사업 대상 위치나 부지는 어디입니까`,
      type: 'value' as const,
      ledger: '실시계획 고시의 위치',
    },
    {
      id: `${prefix}-03`,
      slot: 'stage',
      text: `'${officialName}' 사업의 현재 추진 단계는 무엇입니까`,
      type: 'value' as const,
      ledger: '고시·착공계·준공검사조서의 최근 단계',
    },
    {
      id: `${prefix}-04`,
      slot: 'scale_schedule',
      text: `'${officialName}' 사업의 총 사업비 규모와 준공 예정 시기는 언제입니까`,
      type: 'value' as const,
      ledger: '투자심사 결과서 및 실시계획 공기',
    },
    {
      id: `${prefix}-05`,
      slot: 'use',
      text: `'${officialName}'이 완공되면 시민이나 주민은 어떻게 이용할 수 있습니까`,
      type: 'descriptive' as const,
      ledger: null,
    },
    {
      id: `${prefix}-06`,
      slot: 'owner',
      text: `'${officialName}' 사업의 담당 소관 부서는 어디입니까`,
      type: 'value' as const,
      ledger: '지자체 사무 분장 규칙',
    },
  ];
}
