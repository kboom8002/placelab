// tests/invariants/e2e-golden-scenarios.test.ts
// 모두의 정답노트 (Jeongdap Note) 7대 주요 시나리오 End-to-End 골든 테스트 스위트
//
// 시나리오 목록:
// G-1: 정밀 측정 E2E (instances.jsonl + ledger.csv 골든 원장 → 무프롬프트 요청 → S1~S4/공급공백 판정 → 9회 안정성 → 군집 부트스트랩 95% CI → 중단 규칙)
// G-2: 공표 게이트 & 공개 API E2E (GET /api/regions, /api/regions/[id]/metrics, /api/maps/bands, /api/export/jeongdap — INV-1·3·6·14·16·17)
// G-3: 주간 상시 관측 & 기상도 E2E (observe_questions.csv + 2026-07 인천 개편 gazetteer → 20자 동명 문맥 매칭 → 4주 12회 창 상태 → 기상도·주간 API INV-15)
// G-4: 시민 참여 3종 E2E (POST /api/join/report, /suggest, /vote — INV-4 자발적 참여 분모 고지, INV-18 범위 제외 차단, 개인정보 마스킹)
// G-5: 기관 포털 7단계 & 페이지 단위 DiD 효과 추정 E2E (POST /api/portal/events 정비·알리기·선언표 → +2주/+6주 재측정 예약 → DiD 30건·10곳 공표 게이트)
// G-6: 시민 확인단 2% 표본 검수 & H1~H5 가설 판정 E2E (Cohen's kappa, 2인 일치율, 확인단-운영팀 차이 <= 5%p, 위약 거짓 양성률 < 5%)
// G-7: 역할 10종 보안·방화벽 행렬 & 원본 기록 열람 감사 로그 E2E (authorize() 10개 역할 행렬 + POST /api/records/request)

import * as fs from 'fs';
import * as path from 'path';
import { NextRequest } from 'next/server';
import {
  buildPrecisionResponsesPayload,
  computeClusterBootstrapCI,
  computeFourWeekWindowState,
  computeInterRaterAgreement,
  computeOfficialSourceRate,
  computePageLevelDiD,
  evaluateBlockStoppingRules,
  evaluateCrewVsOpsComparison,
  evaluateNineRunStability,
  evaluatePlaceboFalsePositives,
  evaluateSourceStages,
  extractGazetteerMentions,
  filterWeatherMapAppearingUnits,
  getTermExplanation,
} from '../../lib/jeongdap';
import { authorize } from '../../lib/auth/route-policy';
import { loadGazetteerWith2026IncheonReorg } from '../../scripts/jeongdap/import-seed-data';
import { runStage0LedgerAndShadowAudit } from '../../scripts/jeongdap/run-stage0-shadow';
import { GET as getRegions } from '../../app/api/regions/route';
import { GET as getRegionMetrics } from '../../app/api/regions/[id]/metrics/route';
import { GET as getBandMap } from '../../app/api/maps/bands/route';
import { GET as getWeatherMap } from '../../app/api/maps/weather/route';
import { GET as getWeeklyReport } from '../../app/api/weekly/[week]/route';
import { GET as getExportJeongdap } from '../../app/api/export/jeongdap/route';
import { POST as postCitizenReport } from '../../app/api/join/report/route';
import { POST as postQuestionSuggest } from '../../app/api/join/suggest/route';
import { POST as postQuestionVote } from '../../app/api/join/vote/route';
import { POST as postPortalEvent } from '../../app/api/portal/events/route';
import { POST as postRecordsRequest } from '../../app/api/records/request/route';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[E2E Golden Scenario Failed] ${message}`);
  }
}

export async function testE2EGoldenScenarios() {
  const measurementDir = path.resolve(
    process.cwd(),
    'jeongdap-note-repo-docs-v1.1',
    'measurement'
  );

  // =========================================================================
  // Scenario G-1: 정밀 측정 E2E 파이프라인 (골든 파일 로드 → 출처 4단 → 9회 안정성 → 군집 부트스트랩 CI)
  // =========================================================================
  const instancesLines = fs
    .readFileSync(path.join(measurementDir, 'instances.jsonl'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  assert(instancesLines.length >= 2500, `instances.jsonl 건수 부족: ${instancesLines.length}`);

  const sampleInstances = instancesLines.slice(0, 12).map((line) => JSON.parse(line));
  const clusterObservations = sampleInstances.map((inst, idx) => {
    const reqPayload = buildPrecisionResponsesPayload(inst.question_ko || inst.question || '질문');
    assert(
      !('instructions' in reqPayload) && !('user_location' in reqPayload),
      'G-1: 요청 페이로드에 instructions 또는 위치 신호가 포함됨 (INV-13 위반)'
    );

    // 9회 반복 실행 시뮬레이션 (기준 단위 안정성 검증용)
    const nineRuns = Array.from({ length: 9 }, (_, rep) => {
      const isOfficialHit = idx < 9 ? rep < 8 : rep < 1; // 상위 9문항은 8/9 공식 인용, 하위 3문항은 1/9
      const stageEval = evaluateSourceStages({
        answerText: isOfficialHit
          ? '거주지 이전일부터 14일 이내에 신고하며 수수료는 400원입니다.'
          : '블로그 참고 안내입니다.',
        citations: [
          {
            url: isOfficialHit
              ? 'https://www.guro.go.kr/www/contents.do?key=2036'
              : 'https://blog.naver.com/post',
          },
        ],
        toolSources: [
          {
            url: isOfficialHit
              ? 'https://www.guro.go.kr/www/contents.do?key=2036'
              : 'https://blog.naver.com/post',
          },
        ],
        domainEntry: { unitId: 'GURO', selfDomains: ['guro.go.kr'] },
        ledger: {
          instanceId: inst.id || `Q_${idx}`,
          officialUrl1: 'https://www.guro.go.kr/www/contents.do?key=2036',
          answerKey: '14일 이내 신고; 수수료 400원',
          numbers: '14일 400원',
          supplyGap: false,
        },
      });
      return {
        s3FirstCitationOfficial: stageEval.s3FirstCitationOfficial,
        s4Label: stageEval.s4Candidate,
      };
    });

    const stab = evaluateNineRunStability(nineRuns);
    assert(stab.isStable, `G-1: 9회 중 1회 변동 문항(${idx})이 불안정으로 오판정됨`);

    return {
      clusterId: inst.id || `Q_${idx}`,
      outcomes: nineRuns.slice(0, 3).map((r) => r.s3FirstCitationOfficial),
    };
  });

  const ci = computeClusterBootstrapCI(clusterObservations, { iterations: 500, seed: 42 });
  assert(
    ci.meetsMinCellSize && ci.method === 'cluster_bootstrap_95',
    'G-1: 12문항 × 3회차 군집 부트스트랩 최소 셀 크기 게이트 미통과'
  );
  assert(
    ci.lower <= ci.point && ci.point <= ci.upper && ci.point > 0.5,
    `G-1: 군집 부트스트랩 95% CI 범위 이상 (${ci.lower} ~ ${ci.point} ~ ${ci.upper})`
  );

  const healthyBlock = evaluateBlockStoppingRules({
    expectedModelVersion: 'gpt-5-2026-08',
    observedModelVersions: ['gpt-5-2026-08'],
    totalResponses: 108,
    missingToolSourcesCount: 1,
    placeboFpRate: 0.02,
    activeCrewCount: 24,
  });
  assert(healthyBlock.canProceedPrimary, 'G-1: 정상 블록이 중단 규칙에 의해 잘못 보류됨');

  // =========================================================================
  // Scenario G-2: 공표 시점 게이트 & 공개 API E2E (INV-1, INV-3, INV-6, INV-16, INV-17)
  // =========================================================================
  // 2-1. /api/regions: population 누락 시 400 (INV-1)
  const resNoPop = await getRegions(new NextRequest('http://localhost:3000/api/regions'));
  assert(resNoPop.status === 400, 'G-2: /api/regions 에서 population 누락 시 400을 반환하지 않음 (INV-1)');

  // 2-2. /api/regions: 점수 정렬(order=score) 시 400 (INV-3)
  const resScoreSort = await getRegions(
    new NextRequest('http://localhost:3000/api/regions?population=basic&order=score')
  );
  assert(resScoreSort.status === 400, 'G-2: /api/regions 에서 점수 정렬 시도 시 400을 반환하지 않음 (INV-3)');

  // 2-3. /api/regions: 광역 16곳 · 기초 227곳(인천 개편 반영) 정확성 확인
  const resMetro = await getRegions(
    new NextRequest('http://localhost:3000/api/regions?population=metro&order=name')
  );
  const metroBody = await resMetro.json();
  assert(
    resMetro.status === 200 && metroBody.count === 16,
    `G-2: 광역 모집단 수가 16이 아님 (${metroBody.count})`
  );

  const resBasic = await getRegions(
    new NextRequest('http://localhost:3000/api/regions?population=basic&order=code')
  );
  const basicBody = await resBasic.json();
  assert(
    resBasic.status === 200 && basicBody.count === 227,
    `G-2: 2026-07 인천 개편 반영 기초 모집단 수가 227이 아님 (${basicBody.count})`
  );

  // 2-4. /api/regions/[id]/metrics & /api/maps/bands: 2027-03 이전 실명 수치 비공개 게이트 (INV-17)
  const resMetricsBefore = await getRegionMetrics(
    new NextRequest('http://localhost:3000/api/regions/GURO/metrics'),
    { params: { id: 'GURO' } }
  );
  assert(
    resMetricsBefore.status === 403,
    'G-2: 2027-03 이전에 /api/regions/GURO/metrics 가 403(측정 전 비공개)을 반환하지 않음 (INV-17)'
  );

  const resBandsBefore = await getBandMap(
    new NextRequest('http://localhost:3000/api/maps/bands?population=basic')
  );
  assert(
    resBandsBefore.status === 403,
    'G-2: 2027-03 이전에 /api/maps/bands 가 403(측정 전 비공개)을 반환하지 않음 (INV-17)'
  );

  // 2-5. /api/export/jeongdap: CSV/JSON 내보내기 시 원문 미포함(INV-6) & 재난 제외(INV-16)
  const resExportJson = await getExportJeongdap(
    new NextRequest('http://localhost:3000/api/export/jeongdap?population=basic&format=json')
  );
  const exportBody = await resExportJson.json();
  assert(
    resExportJson.status === 200 &&
      exportBody.population === 'basic' &&
      exportBody.invariantsEnforced?.populationIsolated === true &&
      exportBody.invariantsEnforced?.rawAnswerExcluded === true &&
      exportBody.invariantsEnforced?.disasterSafetyExcluded === true,
    'G-2: /api/export/jeongdap JSON 메타데이터 검증 실패'
  );
  const serializedExport = JSON.stringify(exportBody);
  assert(
    !serializedExport.includes('raw_response') && !serializedExport.includes('answer_raw'),
    'G-2: 내보내기 응답에 AI 원문 필드가 노출됨 (INV-6 위반)'
  );

  // =========================================================================
  // Scenario G-3: 주간 상시 관측 & 전국 AI 기상도 E2E (지명 사전 20자 문맥 + 4주 창 상태 + INV-15)
  // =========================================================================
  const gazRows = loadGazetteerWith2026IncheonReorg();
  const homonymShorts = new Set(['중구', '동구', '서구', '남구', '북구', '강서구', '고성군']);
  const gazEntries = gazRows
    .filter((u) => u.active)
    .map((u) => ({
      unitId: u.unitId,
      level: u.unitKind === 'metro' ? ('광역' as const) : ('기초' as const),
      sido: u.sido,
      name: u.name,
      short: u.short,
      aliases: u.aliases,
      needsContextForShort: homonymShorts.has(u.short),
    }));

  const observeSampleText =
    '가을 가족 여행지로 광주 서구 풍암호수와 인천 영종구 해변, 충북 증평군 좌구산 휴양림을 추천합니다.';
  const extractedMentions = extractGazetteerMentions(observeSampleText, gazEntries);
  const unitNameById = new Map(gazRows.map((u) => [u.unitId, u.name]));
  const mentionedNames = extractedMentions.map((m) => unitNameById.get(m.unitId) ?? m.unitId);

  assert(
    mentionedNames.includes('전남광주통합특별시 서구') &&
      mentionedNames.includes('인천광역시 영종구') &&
      mentionedNames.includes('충청북도 증평군') &&
      !mentionedNames.includes('인천광역시 서구') &&
      !mentionedNames.includes('대전광역시 서구'),
    `G-3: 상시 관측 지명 사전 동명(광주 서구) 또는 인천 신설 구(영종구) 매칭 실패: ${mentionedNames.join(',')}`
  );

  const windowStates = [
    { unitId: 'GWANGJU_SEO', state: computeFourWeekWindowState({ weeklyHits: [3, 3, 2, 2] }) }, // 10회 -> 안정
    { unitId: '28116', state: computeFourWeekWindowState({ weeklyHits: [2, 0, 0, 0] }) }, // 신규
    { unitId: 'JEUNGPYEONG', state: computeFourWeekWindowState({ weeklyHits: [1, 1, 1, 1] }) }, // 4회 -> 가끔
    { unitId: 'SUWON', state: computeFourWeekWindowState({ weeklyHits: [0, 0, 3, 3] }) }, // 이전 6회 후 최근 2주 0 -> 소멸
  ];
  assert(
    windowStates[0].state === '안정' &&
      windowStates[1].state === '신규' &&
      windowStates[2].state === '가끔' &&
      windowStates[3].state === '소멸',
    'G-3: 4주 12회 창 상태 전이 판정 오류'
  );

  const visibleWeather = filterWeatherMapAppearingUnits(windowStates);
  assert(
    visibleWeather.length === 2 &&
      visibleWeather.every((u) => u.state === '안정' || u.state === '신규'),
    'G-3: 기상도 공개 필터에 가끔·소멸 상태가 노출됨 (INV-15 위반)'
  );

  const resWeather = await getWeatherMap();
  const weatherBody = await resWeather.json();
  assert(
    resWeather.status === 200 &&
      !('unappearedUnits' in weatherBody) &&
      !('shareOfVoice' in weatherBody) &&
      !('firstThree' in weatherBody),
    'G-3: /api/maps/weather 응답에 미등장 명단·점유율·첫 셋 필드가 포함됨 (INV-15 위반)'
  );

  const resWeekly = await getWeeklyReport(
    new NextRequest('http://localhost:3000/api/weekly/2026-W49?population=basic'),
    { params: { week: '2026-W49' } }
  );
  const weeklyBody = await resWeekly.json();
  assert(
    resWeekly.status === 200 && weeklyBody.week === '2026-W49' && weeklyBody.population === 'basic',
    'G-3: /api/weekly/[week] 응답 검증 실패'
  );

  // =========================================================================
  // Scenario G-4: 시민 참여 3종 E2E (신고판 범위 제외 게이트 INV-18, 개인정보 마스킹, 문항 제안·투표 INV-4)
  // =========================================================================
  // 4-1. 범위 제외 대상(재난·응급, 영리 업소) 신고 시 422 차단 (INV-18)
  const resDisasterReport = await postCitizenReport(
    new NextRequest('http://localhost:3000/api/join/report', {
      method: 'POST',
      body: JSON.stringify({
        scopeCategory: 'disaster_emergency',
        questionText: '지진 대피소 위치가 다릅니다.',
      }),
    })
  );
  assert(
    resDisasterReport.status === 422,
    'G-4: 재난·응급 범위 제외 신고가 422로 차단되지 않음 (INV-18 위반)'
  );

  const resBizReport = await postCitizenReport(
    new NextRequest('http://localhost:3000/api/join/report', {
      method: 'POST',
      body: JSON.stringify({
        scopeCategory: 'private_business',
        questionText: '동네 식당 영업시간이 틀립니다.',
      }),
    })
  );
  assert(resBizReport.status === 422, 'G-4: 영리 업소 범위 제외 신고가 422로 차단되지 않음 (INV-18 위반)');

  // 4-2. 정상 생활행정 신고 접수 + 전화번호·주민번호 마스킹 검증
  const resValidReport = await postCitizenReport(
    new NextRequest('http://localhost:3000/api/join/report', {
      method: 'POST',
      body: JSON.stringify({
        scopeCategory: 'civil_admin',
        questionText: '구로구 여권 발급 문의 제 번호는 010-1234-5678 이고 주민번호는 900101-1234567 입니다.',
      }),
    })
  );
  const validReportBody = await resValidReport.json();
  assert(
    resValidReport.status === 201 &&
      !validReportBody.sanitizedQuestion.includes('010-1234-5678') &&
      !validReportBody.sanitizedQuestion.includes('900101-1234567') &&
      validReportBody.sanitizedQuestion.includes('[연락처 마스킹]') &&
      validReportBody.sanitizedQuestion.includes('[주민번호 마스킹]'),
    'G-4: 시민 신고판 개인정보(전화번호·주민번호) 자동 마스킹 실패'
  );

  // 4-3. 시민 문항 제안 및 투표 (INV-4 자발적 참여 분모 고지 확인)
  const resSuggest = await postQuestionSuggest(
    new NextRequest('http://localhost:3000/api/join/suggest', {
      method: 'POST',
      body: JSON.stringify({
        categoryCode: '생활행정',
        questionText: '어르신 무료 독감 예방접종 시작일은 언제인가요?',
      }),
    })
  );
  const suggestBody = await resSuggest.json();
  assert(
    resSuggest.status === 201 && suggestBody.status === 'pending_review',
    'G-4: 시민 문항 제안 응답 검증 실패'
  );

  const resVote = await postQuestionVote(
    new NextRequest('http://localhost:3000/api/join/vote', {
      method: 'POST',
      body: JSON.stringify({ candidateId: 'cand_001' }),
    })
  );
  const voteBody = await resVote.json();
  assert(
    resVote.status === 201 && String(voteBody.note).includes('INV-4'),
    'G-4: 시민 문항 투표 응답에 INV-4 분리 고지가 누락됨'
  );

  // =========================================================================
  // Scenario G-5: 기관 포털 7단계 (정비·알리기·선언표 등록 → +2/+6주 재측정 예약 → 페이지 단위 DiD 게이트)
  // =========================================================================
  const resRepairEvent = await postPortalEvent(
    new NextRequest('http://localhost:3000/api/portal/events', {
      method: 'POST',
      body: JSON.stringify({
        eventTrack: 'defense',
        unitId: 'GURO',
        typeCode: 'Q',
        targetUrl: 'https://www.guro.go.kr/www/contents.do?key=2036',
        summary: '전입신고 안내 페이지 상단 핵심 요약표(수수료·처리기한) 추가',
      }),
    })
  );
  const repairBody = await resRepairEvent.json();
  assert(
    resRepairEvent.status === 201 &&
      repairBody.scheduledRemeasurements?.plus2Weeks &&
      repairBody.scheduledRemeasurements?.plus6Weeks &&
      String(repairBody.denominatorNotice).includes('INV-4'),
    'G-5: 정비 사건 등록 시 +2주/+6주 재측정 예약 또는 INV-4 분모 고지가 누락됨'
  );

  // DiD 최소 표본 게이트: 사건 5건(30건 미만)일 때는 인과 효과 공표 불가 (`exploratory_insufficient_sample`)
  const smallDid = computePageLevelDiD([
    { itemId: 'I1', unitId: 'GURO', domainCategory: '민원', treated: true, preRate: 0.2, postRate: 0.8 },
    { itemId: 'C1', unitId: 'SUWON', domainCategory: '민원', treated: false, preRate: 0.2, postRate: 0.25 },
  ]);
  assert(
    !smallDid.canPublishCausalEffect &&
      smallDid.publicationStatus === 'exploratory_insufficient_sample',
    'G-5: 30건·10곳 미만 소표본에서 DiD 인과 효과 주장이 보류되지 않음'
  );

  // 사건 30건 · 기관 10곳 이상 충족 시 `confirmed_did` 산출
  const fullDidObs = [
    ...Array.from({ length: 30 }, (_, i) => ({
      itemId: `T_${i}`,
      unitId: `UNIT_${i % 12}`, // 12개 기관 (>= 10곳)
      domainCategory: '민원',
      treated: true,
      preRate: 0.3,
      postRate: 0.75, // +0.45p
    })),
    ...Array.from({ length: 30 }, (_, i) => ({
      itemId: `C_${i}`,
      unitId: `CTRL_${i % 12}`,
      domainCategory: '민원',
      treated: false,
      preRate: 0.3,
      postRate: 0.35, // +0.05p
    })),
  ];
  const fullDid = computePageLevelDiD(fullDidObs);
  assert(
    fullDid.canPublishCausalEffect &&
      fullDid.publicationStatus === 'confirmed_did' &&
      Math.abs(fullDid.didEstimate - 0.4) < 0.001,
    `G-5: 30건·12곳 충족 시 DiD 추정치 오류 (${fullDid.didEstimate})`
  );

  // =========================================================================
  // Scenario G-6: 시민 확인단 2% 표본 검수 & H1~H5 가설 판정 E2E (Cohen's kappa, 확인단-운영팀 차이)
  // =========================================================================
  const raterPairs = Array.from({ length: 50 }, (_, i) => ({
    itemId: `ITEM_${i}`,
    raterA: i < 30 ? 'match' : i < 45 ? 'mismatch' : 'absent',
    raterB: i < 29 ? 'match' : i < 44 ? 'mismatch' : 'absent', // 50건 중 48건 일치 (96%)
  }));
  const agreement = computeInterRaterAgreement(raterPairs);
  assert(
    agreement.passesValidityGate &&
      agreement.exactAgreement >= 0.9 &&
      agreement.cohensKappa >= 0.85,
    `G-6: H3 2인 판정 일치도(Cohen's kappa=${agreement.cohensKappa}) 계산 실패`
  );

  const crewVsOps = evaluateCrewVsOpsComparison({
    activeCrewCount: 22, // >= 15명 정족수 충족
    items: Array.from({ length: 40 }, (_, i) => ({
      itemId: `ITEM_${i}`,
      crewBinaryOfficial: i < 26, // 65.0%
      opsBinaryOfficial: i < 25, // 62.5% (차이 2.5%p <= 5%p)
      crewLabel: i < 26 ? 'match' : 'absent',
      opsLabel: i < 25 ? 'match' : 'absent', // 39/40 = 97.5% 일치
    })),
  });
  assert(
    crewVsOps.meetsQuorum && crewVsOps.passesH5 && crewVsOps.rateDelta <= 0.05,
    'G-6: H5 시민 확인단-운영팀 판정 일치 및 5%p 이내 차이 검증 실패'
  );

  const lowPlacebo = evaluatePlaceboFalsePositives(
    Array.from({ length: 30 }, (_, i) => ({
      kind:
        i < 10
          ? ('fictional_entity' as const)
          : i < 20
          ? ('other_region_entity' as const)
          : ('similar_name_entity' as const),
      falsePositive: false,
    }))
  );
  assert(
    !lowPlacebo.globalHold && lowPlacebo.heldKinds.length === 0,
    'G-6: H2 위약 거짓 양성 0% 케이스가 보류로 오판정됨'
  );

  // =========================================================================
  // Scenario G-7: 역할 10종 보안·방화벽 행렬 & 원본 기록 열람 요청 감사 로그 E2E
  // =========================================================================
  const roleMatrixChecks: Array<{
    path: string;
    role: any;
    expected: 'allow' | 'forbidden';
  }> = [
    { path: '/ops', role: 'ops_admin', expected: 'allow' },
    { path: '/ops', role: 'ops_approver', expected: 'allow' },
    { path: '/ops', role: 'ops_analyst', expected: 'allow' },
    { path: '/ops', role: 'gov_editor', expected: 'forbidden' },
    { path: '/ops', role: 'lab_member', expected: 'forbidden' },
    { path: '/ops', role: 'citizen', expected: 'forbidden' },
    { path: '/ops', role: 'minor', expected: 'forbidden' },
    { path: '/portal', role: 'gov_editor', expected: 'allow' },
    { path: '/portal', role: 'gov_viewer', expected: 'allow' },
    { path: '/portal', role: 'ops_admin', expected: 'allow' },
    { path: '/portal', role: 'lab_member', expected: 'forbidden' },
    { path: '/portal', role: 'citizen', expected: 'forbidden' },
    { path: '/kbrandlab', role: 'lab_member', expected: 'allow' },
    { path: '/kbrandlab', role: 'gov_editor', expected: 'forbidden' },
  ];

  for (const check of roleMatrixChecks) {
    const decision = authorize(check.path, { roles: [check.role] });
    assert(
      decision.kind === check.expected,
      `G-7: 경로 ${check.path} / 역할 ${check.role} 권한 판정 불일치 (기대: ${check.expected}, 실제: ${decision.kind})`
    );
  }

  const resRecordReq = await postRecordsRequest(
    new NextRequest('http://localhost:3000/api/records/request', {
      method: 'POST',
      body: JSON.stringify({
        instanceId: 'c4ca590b76',
        requesterRole: 'researcher',
        reason: '1차 방법 검증 학술·언론 교차 재현',
      }),
    })
  );
  const recordReqBody = await resRecordReq.json();
  assert(
    resRecordReq.status === 201 && recordReqBody.status === 'queued_for_ops_audit',
    'G-7: /api/records/request 원본 기록 열람 요청 접수 및 감사 큐 적재 검증 실패'
  );

  // =========================================================================
  // Scenario G-8: 0단계 정본 원장(ledger.csv) 검수 집계 & Python-TS 그림자 대조 및 쉬운 말(ko-easy) 사전 검증
  // =========================================================================
  const stage0Audit = runStage0LedgerAndShadowAudit();
  assert(
    stage0Audit.totalLedgerRows > 500 &&
      stage0Audit.bySite.GURO.total > 0 &&
      stage0Audit.bySite.SUWON.total > 0 &&
      stage0Audit.shadowGoldenComparison.readyForDecemberTsSwitch === true,
    'G-8: 0단계 정본 원장(ledger.csv) 집계 또는 Python-TS 그림자 대조 일치율(>=98%) 검증 실패'
  );

  const easyKo = getTermExplanation('official_source_rate', 'ko-easy');
  const enTerm = getTermExplanation('official_source_rate', 'en');
  assert(
    easyKo.includes('공식 근거율') && enTerm.includes('Official Source Rate'),
    'G-8: 5개 UI 로케일 및 쉬운 말(ko-easy) 용어 사전 조회 실패'
  );
}


