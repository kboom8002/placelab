// tests/measurement/measurement-spec-pipeline.test.ts
// docs/measurement-spec: 전 파이프라인 무결성 및 불변식 준수 통합 테스트

import { getCoreCommonQuestions, getAllActiveQuestions } from '@/lib/measurement/questions';
import { getPopulationFrame, getRunProfileRegistry, findAgencyByHandle } from '@/lib/measurement/registries';
import { extractBodyUrls } from '@/lib/measurement/collector';
import { extractObservation } from '@/lib/measurement/extractor';
import { verifyObservation } from '@/lib/measurement/verifier';
import { buildGrid } from '@/lib/measurement/grid-analyzer';
import { createProjectRecord, generateProjectQuestions } from '@/lib/measurement/project-tracker';
import { buildOutput, PROXY_NOTICE_DEFAULT } from '@/lib/measurement/output-generator';
import { populationBand, peerGroup, bandOf } from '@/lib/measurement/sealed-bridge';
import type { ResponseRecord, Question } from '@/lib/types/measurement-spec';

export async function testMeasurementSpecPipeline() {
  console.log('--- 1. 문항 및 등록부 SSOT 로드 검증 ---');
  const coreQuestions = getCoreCommonQuestions();
  if (coreQuestions.length !== 30) {
    throw new Error(`공통 코어 문항이 30개여야 하는데 ${coreQuestions.length}개입니다.`);
  }

  const activeQuestions = getAllActiveQuestions();
  if (activeQuestions.length === 0) {
    throw new Error('활성 문항 목록이 비어 있습니다.');
  }

  const popFrame = getPopulationFrame();
  if (popFrame.agencies.length !== 226) {
    throw new Error(`전국 기초자치단체 수가 226개여야 하는데 ${popFrame.agencies.length}개입니다.`);
  }

  const runRegistry = getRunProfileRegistry();
  if (runRegistry.profiles.length === 0) {
    throw new Error('고정된 관측 프로필이 없습니다.');
  }

  console.log('--- 2. 수집 및 원문 보존 레코드 시뮬레이션 ---');
  const sampleQuestion = coreQuestions[0]; // CORE-001 (청사 주소)
  const agency = popFrame.agencies[0]; // 종로구

  const sampleResponses: ResponseRecord[] = [
    {
      response_id: 'RSP-TEST-01',
      question_id: sampleQuestion.id,
      agency_handle: agency.handle,
      run_profile_id: 'RP-2026Q3-A',
      attempt: 1,
      observed_at: new Date().toISOString(),
      outcome: 'answered',
      raw_text: '종로구청의 청사 주소는 서울특별시 종로구 삼봉로 43 (수송동) 입니다. 공식 홈페이지는 https://www.jongno.go.kr 입니다.',
      body_urls: ['https://www.jongno.go.kr'],
      citation_urls: [],
    },
    {
      response_id: 'RSP-TEST-02',
      question_id: sampleQuestion.id,
      agency_handle: agency.handle,
      run_profile_id: 'RP-2026Q3-A',
      attempt: 2,
      observed_at: new Date().toISOString(),
      outcome: 'answered',
      raw_text: '종로구청 청사는 서울 종로구 삼봉로 43 에 위치하고 있습니다.',
      body_urls: [],
      citation_urls: [],
    },
  ];

  console.log('--- 3. 추출(Extraction) 및 불안정(Unstable) 검사 ---');
  const observation = await extractObservation({
    question: sampleQuestion,
    agencyHandle: agency.handle,
    runProfileId: 'RP-2026Q3-A',
    windowStart: '2026-09-14T00:00:00Z',
    windowEnd: '2026-09-14T23:59:59Z',
    responseRecords: sampleResponses,
    accessState: { robots_checked: true, robots_allows: true },
  });

  if (!observation.extracted.stated_value) {
    throw new Error('진술 값(stated_value)이 추출되지 않았습니다.');
  }

  console.log('--- 4. 판정(Verdict, judged_by = rule) 검증 ---');
  const verdict = verifyObservation({
    question: sampleQuestion,
    observation,
    groundTruth: {
      questionId: sampleQuestion.id,
      ledgerValue: '삼봉로 43',
      ledgerValueNature: 'measured',
      ledgerAsOf: '2026-09-14',
    },
  });

  if (verdict.judged_by !== 'rule') {
    throw new Error(`판정자가 rule이어야 하는데 ${verdict.judged_by}입니다 (불변식 위반).`);
  }
  if (verdict.result !== 'match') {
    throw new Error(`일치 판정이 나와야 하는데 ${verdict.result}입니다.`);
  }

  console.log('--- 5. 질문-주체 격자(Grid) 및 정본 부재(canon_absent) 검증 ---');
  const grid = buildGrid({
    agencyHandle: agency.handle,
    windowStart: '2026-09-14T00:00:00Z',
    windowEnd: '2026-09-14T23:59:59Z',
    questions: [sampleQuestion],
  });

  if (grid.rows.length !== 1) {
    throw new Error('격자 행 수가 1이어야 합니다.');
  }
  // 기본적으로 정본 발행이 없으므로 canon_absent 및 ownership 부여 확인
  if (grid.rows[0].row_verdict === 'canon_absent' && !grid.rows[0].ownership) {
    throw new Error('정본 부재 시 ownership이 필수입니다.');
  }

  console.log('--- 6. 역점사업(ProjectRecord) 3대 요건 및 6물음 검증 ---');
  const project = createProjectRecord({
    projectId: 'PRJ-AG-0001-01',
    agencyHandle: agency.handle,
    officialName: '종로 모던 한옥 복원 사업',
    budgeted: true,
    owned: true,
    named: true,
    owningDepartment: '한옥문화과',
    stage: 'started',
    stageAsOf: '2026-09-14',
    stageLedger: '실시계획 착공 고시',
  });

  if (project.sensitivity !== 'agency_only') {
    throw new Error('역점사업의 민감도는 agency_only 여야 합니다.');
  }

  const projectQuestions = generateProjectQuestions(agency.handle, agency.display, 1, project.official_name);
  if (projectQuestions.length !== 6) {
    throw new Error(`역점사업 문항은 6개여야 하는데 ${projectQuestions.length}개입니다.`);
  }

  console.log('--- 7. 산출물(Output) 5대 절 순서 및 사전통지 게이트 검증 ---');
  // 사전 통지 누락 시 에러 검증
  try {
    buildOutput({
      channel: 'national_report',
      agencyHandle: agency.handle,
      runProfileId: 'RP-2026Q3-A',
      observedStart: '2026-09-14T00:00:00Z',
      observedEnd: '2026-09-14T23:59:59Z',
      ledgerAsOf: '2026-09-14',
      grid,
      verdicts: [verdict],
      observations: [observation],
    });
    throw new Error('사전통지 누락된 전국 공표문이 통과되었습니다 (게이트 위반).');
  } catch (e: any) {
    if (!e.message.includes('사전 통지')) {
      throw e;
    }
  }

  // 정상 조립 검증
  const output = buildOutput({
    channel: 'national_report',
    agencyHandle: agency.handle,
    runProfileId: 'RP-2026Q3-A',
    observedStart: '2026-09-14T00:00:00Z',
    observedEnd: '2026-09-14T23:59:59Z',
    ledgerAsOf: '2026-09-14',
    notifiedAt: '2026-09-01T00:00:00Z',
    reviewClosedAt: '2026-09-14T00:00:00Z',
    grid,
    verdicts: [verdict],
    observations: [observation],
  });

  if (output.sections.length !== 5) {
    throw new Error(`산출물 절의 수가 5개여야 하는데 ${output.sections.length}개입니다.`);
  }
  const orderSeq = output.sections.map((s) => s.order);
  if (JSON.stringify(orderSeq) !== '[1,2,3,4,5]') {
    throw new Error(`절의 순서가 1~5 순차적이어야 합니다: ${orderSeq}`);
  }

  console.log('--- 8. 봉인 인터페이스(sealed) 브릿지 검증 ---');
  const pBand = populationBand(agency.handle, '2026-09-14');
  const pGroup = peerGroup(agency.handle, '2026-09-14');
  const bOf = bandOf(agency.handle, 'canon_absence_and_ownership', '2026-09-14');

  if (!['P1', 'P2', 'P3'].includes(pBand)) {
    throw new Error(`인구 밴드 반환값 이상: ${pBand}`);
  }
  if (!pGroup.startsWith('PG-')) {
    throw new Error(`동류 집단 식별자 이상: ${pGroup}`);
  }

  console.log('🎉 measurement-spec 전 파이프라인 테스트 완벽 통과!');
}
