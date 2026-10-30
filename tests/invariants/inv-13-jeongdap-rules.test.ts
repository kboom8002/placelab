// tests/invariants/inv-13-jeongdap-rules.test.ts
// AGENTS.md v2.0 INV-13 ~ INV-18 및 모두의 정답노트 도메인 로직 검증

import {
  buildPrecisionResponsesPayload,
  canPublishNamedUnitMetrics,
  compareShadowStageAgreement,
  computeFourWeekWindowState,
  computeOfficialSourceRate,
  evaluateBlockStoppingRules,
  evaluateNineRunStability,
  evaluatePlaceboFalsePositives,
  evaluateSourceStages,
  extractGazetteerMentions,
  filterOutDisasterItems,
  filterWeatherMapAppearingUnits,
  groupAndSortBandEntries,
  isAllowedByRobotsTxt,
  matchesNumberToken,
  shouldHoldStage1ForMissingToolSources,
  validateCitizenReportScope,
} from '../../lib/jeongdap';
import { FORBIDDEN_WORDS } from '../../lib/constants/measurement';
import { authorize } from '../../lib/auth/route-policy';
import { generateFreezeManifest } from '../../scripts/jeongdap/import-seed-data';

export async function testInv13JeongdapRules() {
  // 1. INV-13: 정밀 측정 요청 객체에 instructions(시스템 프롬프트) 및 user_location(위치 신호)이 없어야 함
  const payload = buildPrecisionResponsesPayload('구로구 여권 발급 수수료는 얼마인가요?') as Record<string, unknown>;
  if ('instructions' in payload || 'system' in payload || 'user_location' in payload) {
    throw new Error('정밀 측정 요청 객체에 instructions 또는 위치 신호가 포함되어 있습니다 (INV-13 위반)');
  }
  if (!Array.isArray(payload.include) || !payload.include.includes('web_search_call.action.sources')) {
    throw new Error('정밀 측정 요청에 web_search_call.action.sources include가 누락되었습니다 (1단 판정 필수)');
  }

  // 2. 출처 4단 + 한 자리 숫자 문맥 매칭 + 공급 공백·해당 없음 분리 검증
  if (matchesNumberToken('민원실은 2026년에 개소했습니다.', '2')) {
    throw new Error('한 자리 숫자 2가 단위 문맥 없이 연도(2026)에서 오매칭되었습니다');
  }
  if (!matchesNumberToken('처리 기한은 2일입니다.', '2')) {
    throw new Error('단위 문맥(2일)이 있는 한 자리 숫자가 매칭되지 않았습니다');
  }

  const stageRes1 = evaluateSourceStages({
    answerText: '처리 기한은 2일이며 수수료는 400원입니다.',
    citations: [{ url: 'https://www.guro.go.kr/www/contents.do?key=1' }],
    toolSources: [
      { url: 'https://blog.naver.com/post1' },
      { url: 'https://www.guro.go.kr/www/contents.do?key=1' },
    ],
    domainEntry: { unitId: '11530', selfDomains: ['guro.go.kr'] },
    ledger: { instanceId: 'Q1', numbers: '2, 400', answerKey: '수수료;처리 기한' },
  });

  if (!stageRes1.s1AppearedInSearch || !stageRes1.s2CitedByAi || !stageRes1.s3FirstCitationOfficial) {
    throw new Error('공식 도메인 첫 인용에 대해 S1/S2/S3 판정이 실패했습니다');
  }
  if (stageRes1.s4Candidate !== 'match_candidate') {
    throw new Error(`정답 일치 케이스에서 match_candidate가 아닌 ${stageRes1.s4Candidate}가 반환되었습니다`);
  }

  const stageSupplyGap = evaluateSourceStages({
    answerText: '정보를 찾을 수 없습니다.',
    citations: [],
    ledger: { instanceId: 'Q2', supplyGap: true },
  });
  const rateSummary = computeOfficialSourceRate([stageRes1, stageSupplyGap]);
  if (rateSummary.denominator !== 1 || rateSummary.supplyGapCount !== 1 || rateSummary.rate !== 1) {
    throw new Error('공급 공백 문항이 공식 근거율 분모에서 올바르게 분리되지 않았습니다');
  }

  // 3. 도구 반환 목록 5% 초과 누락 중단 규칙 검증
  if (!shouldHoldStage1ForMissingToolSources(100, 6)) {
    throw new Error('도구 반환 목록 6% 누락 시 1단 보류 게이트가 작동하지 않았습니다');
  }

  // 4. ADR-0024: 9회 블록 안정성 및 4주 12회 창 상태 검증
  const nineRuns = Array.from({ length: 9 }, (_, idx) => ({
    s3FirstCitationOfficial: idx < 7,
    s4Label: 'match_candidate',
  }));
  const stab = evaluateNineRunStability(nineRuns);
  if (!stab.isStable || stab.diffCount !== 2) {
    throw new Error('9회 중 2회 변동 케이스가 안정으로 판정되지 않았습니다');
  }

  if (computeFourWeekWindowState({ weeklyHits: [2, 0, 0, 0] }) !== '신규') {
    throw new Error('지난 3주 0회 + 이번 주 2회 케이스가 신규로 판정되지 않았습니다');
  }
  if (computeFourWeekWindowState({ weeklyHits: [3, 3, 2, 2] }) !== '안정') {
    throw new Error('4주 10회 등장 케이스가 안정(9회 이상)으로 판정되지 않았습니다');
  }
  if (computeFourWeekWindowState({ weeklyHits: [0, 0, 3, 4] }) !== '소멸') {
    throw new Error('이전 7회 등장 후 최근 2주 연속 0회 케이스가 소멸로 판정되지 않았습니다');
  }
  if (computeFourWeekWindowState({ weeklyHits: [1, 0, 1, 0] }) !== '드묾') {
    throw new Error('4주 2회 등장 케이스가 드묾으로 판정되지 않았습니다');
  }

  // 5. INV-15: 기상도에는 안정·신규만 표시하고 드묾·소멸·미등장은 제외
  const weatherUnits = filterWeatherMapAppearingUnits([
    { unitId: '11530', state: '안정' as const },
    { unitId: '41110', state: '신규' as const },
    { unitId: '41590', state: '드묾' as const },
    { unitId: '43745', state: '소멸' as const },
  ]);
  if (weatherUnits.length !== 2) {
    throw new Error('기상도 필터에서 드묾·소멸 상태가 제외되지 않았습니다 (INV-15 위반)');
  }

  // 6. INV-3 & ADR-0018: 구간 안 정렬이 가나다순인지 확인
  const grouped = groupAndSortBandEntries(
    [
      {
        unitId: '41590',
        name: '화성시',
        population: 'basic',
        band: 'high',
        bandLabel: '공식 근거 많음',
        movement: 'same',
        hasRepairEventRegistered: true,
      },
      {
        unitId: '11530',
        name: '구로구',
        population: 'basic',
        band: 'high',
        bandLabel: '공식 근거 많음',
        movement: 'up',
        hasRepairEventRegistered: true,
      },
    ],
    'basic'
  );
  if (grouped.high[0]?.name !== '구로구' || grouped.high[1]?.name !== '화성시') {
    throw new Error('구간 내부 지역 목록이 가나다순으로 정렬되지 않았습니다 (INV-3 위반)');
  }

  // 7. 지명 사전 동명(서구) 20자 시·도 문맥 해소 검증
  const mentions = extractGazetteerMentions(
    '이번 행사는 광주 서구 문화센터와 인천광역시 제물포구 일대에서 열립니다.',
    [
      {
        unitId: '29140',
        level: '기초',
        sido: '광주',
        name: '광주광역시 서구',
        short: '서구',
        aliases: [],
        needsContextForShort: true,
      },
      {
        unitId: '28110',
        level: '기초',
        sido: '인천',
        name: '인천광역시 서구',
        short: '서구',
        aliases: [],
        needsContextForShort: true,
      },
      {
        unitId: '28115',
        level: '기초',
        sido: '인천',
        name: '인천광역시 제물포구',
        short: '제물포구',
        aliases: ['제물포구'],
        needsContextForShort: false,
      },
    ]
  );
  const matchedIds = mentions.map((m) => m.unitId);
  if (!matchedIds.includes('29140') || matchedIds.includes('28110') || !matchedIds.includes('28115')) {
    throw new Error(`동명 지명(서구) 시·도 문맥 매칭 또는 인천 신설 구 매칭 오류: ${matchedIds.join(',')}`);
  }

  // 8. INV-16, INV-17, INV-18 및 위약 게이트 검증
  if (filterOutDisasterItems([{ id: 1, disaster: true }, { id: 2, disaster: false }]).length !== 1) {
    throw new Error('재난·안전 문항이 공개 목록에서 제외되지 않았습니다 (INV-16 위반)');
  }
  if (canPublishNamedUnitMetrics('2026-11-17') || !canPublishNamedUnitMetrics('2027-03-01')) {
    throw new Error('2027-03 이전 단위 실명 수치 비공개 게이트가 작동하지 않았습니다 (INV-17 위반)');
  }
  if (validateCitizenReportScope({ scopeCategory: 'disaster_emergency', questionText: '대피소' }).allowed) {
    throw new Error('범위 제외(재난·응급) 신고가 차단되지 않았습니다 (INV-18 위반)');
  }
  const placeboCheck = evaluatePlaceboFalsePositives([
    { kind: 'fictional_entity', falsePositive: true },
    { kind: 'fictional_entity', falsePositive: false },
  ]);
  if (!placeboCheck.globalHold || !placeboCheck.heldKinds.includes('fictional_entity')) {
    throw new Error('위약 거짓 양성 임계값 보류 게이트가 작동하지 않았습니다');
  }

  // 9. 금지어 합본 검증
  for (const w of ['꼴찌', '종합 점수', '공식 측정', '정부 인증']) {
    if (!FORBIDDEN_WORDS.includes(w as any)) {
      throw new Error(`모두의 정답노트 금지어 '${w}'가 FORBIDDEN_WORDS에 누락되었습니다`);
    }
  }

  // 10. 인용 페이지 확인 수집기 robots.txt 준수 (INV-5)
  if (isAllowedByRobotsTxt('User-agent: *\nDisallow: /\n')) {
    throw new Error('Disallow: / 규칙이 있는 robots.txt에서 수집 허용으로 오판정되었습니다 (INV-5 위반)');
  }
  if (!isAllowedByRobotsTxt('User-agent: *\nAllow: /\n')) {
    throw new Error('Allow: / 규칙이 있는 robots.txt에서 수집 거부로 오판정되었습니다');
  }

  // 11. 1차 사전 등록 중단 규칙 (모델 판본 변경·위약 10%·확인단 15명 미만) 및 그림자 비교 검증
  const stopVerdict = evaluateBlockStoppingRules({
    expectedModelVersion: 'gpt-5-2026-08',
    observedModelVersions: ['gpt-5-2026-08', 'gpt-5-2026-10'],
    totalResponses: 100,
    missingToolSourcesCount: 7,
    placeboFpRate: 0.12,
    activeCrewCount: 12,
  });
  if (
    stopVerdict.canProceedPrimary ||
    !stopVerdict.rerunRequiredForModelDrift ||
    !stopVerdict.holdStage1 ||
    !stopVerdict.holdAppearance ||
    !stopVerdict.holdH5CrewComparison
  ) {
    throw new Error('1차 사전 등록 중단 규칙(모델 변경·도구 누락·위약·확인단 정족수) 게이트가 작동하지 않았습니다');
  }

  const shadowAgree = compareShadowStageAgreement(
    [{ s1AppearedInSearch: true, s2CitedByAi: true, s3FirstCitationOfficial: true }],
    [{ s1AppearedInSearch: true, s2CitedByAi: true, s3FirstCitationOfficial: true }]
  );
  if (shadowAgree.allThreeAgreement !== 1) {
    throw new Error('Python-TS 그림자 실행 1~3단 일치율 계산 오류');
  }

  // 12. 정본 동결 해시 매니페스트 및 2026-07 인천 개편(광역 16 · 기초 227) 시드 검증
  const manifest = generateFreezeManifest();
  if (
    manifest.populations.metroActiveCount !== 16 ||
    manifest.populations.basic2026IncheonActiveCount !== 227 ||
    !manifest.hashes.instances_jsonl_sha256 ||
    !manifest.hashes.core_60_qids_sha256
  ) {
    throw new Error(
      `동결 매니페스트 모집단 또는 해시 불일치: 광역=${manifest.populations.metroActiveCount}, 기초=${manifest.populations.basic2026IncheonActiveCount}`
    );
  }

  // 13. Python 골든 원장 파일(ledger_work/group_A_out.csv) 대조 호환성 검증 (§14)
  const fs = await import('fs');
  const path = await import('path');
  const goldenPath = path.resolve(
    process.cwd(),
    'jeongdap-note-repo-docs-v1.1',
    'measurement',
    'ledger_work',
    'group_A_out.csv'
  );
  const goldenText = fs.readFileSync(goldenPath, 'utf8');
  if (!goldenText.includes('c4ca590b76') || !goldenText.includes('db46486900')) {
    throw new Error('골든 원장(group_A_out.csv)에서 기준 인스턴스(c4ca590b76, db46486900)를 찾을 수 없습니다');
  }

  // c4ca590b76: 전입신고 14일 이내, 5만원 이하 과태료 (공식 URL: guro.go.kr / law.go.kr)
  const goldenMatchEval = evaluateSourceStages({
    answerText:
      '거주지 이전일부터 14일 이내에 신고해야 하며, 정당한 사유 없이 지연 시 5만원 이하 과태료가 부과됩니다.',
    citations: [
      { url: 'https://www.guro.go.kr/www/contents.do?key=2036' },
      { url: 'https://www.law.go.kr/법령/주민등록법/제40조' },
    ],
    toolSources: [{ url: 'https://www.guro.go.kr/www/contents.do?key=2036' }],
    domainEntry: { unitId: 'GURO', selfDomains: ['guro.go.kr'] },
    ledger: {
      instanceId: 'c4ca590b76',
      officialUrl1: 'https://www.guro.go.kr/www/contents.do?key=2036',
      officialUrl2: 'https://www.law.go.kr/법령/주민등록법/제40조',
      answerKey: '거주지 이전일부터 14일 이내 신고; 정당한 사유 없이 지연 시 5만원 이하 과태료',
      numbers: '14일 5만원',
      supplyGap: false,
    },
  });
  if (
    !goldenMatchEval.s1AppearedInSearch ||
    !goldenMatchEval.s2CitedByAi ||
    !goldenMatchEval.s3FirstCitationOfficial ||
    goldenMatchEval.s4Candidate !== 'match_candidate'
  ) {
    throw new Error('골든 원장(c4ca590b76) 정답 대조에서 S1~S4 match_candidate 판정이 실패했습니다');
  }

  // db46486900: 구로구 주정차 단속 시간대 미게시 (supply_gap = Y)
  const goldenGapEval = evaluateSourceStages({
    answerText: '평일 07시부터 22시까지 단속합니다.',
    citations: [{ url: 'https://blog.naver.com/somepost' }],
    domainEntry: { unitId: 'GURO', selfDomains: ['guro.go.kr'] },
    ledger: {
      instanceId: 'db46486900',
      supplyGap: true,
    },
  });
  const goldenRate = computeOfficialSourceRate([goldenMatchEval, goldenGapEval]);
  if (
    !goldenGapEval.supplyGap ||
    goldenRate.denominator !== 1 ||
    goldenRate.supplyGapCount !== 1 ||
    goldenRate.rate !== 1
  ) {
    throw new Error('골든 원장(db46486900) 공급 공백 분리 및 이중 분모 계산이 실패했습니다');
  }

  // 14. INV-17 A원칙 데이터 방화벽(lab_member 상업 역할과 측정 운영/기관 포털 분리) 검증
  if (
    authorize('/ops', { roles: ['lab_member'] }).kind !== 'forbidden' ||
    authorize('/portal', { roles: ['lab_member'] }).kind !== 'forbidden' ||
    authorize('/api/portal/events', { roles: ['lab_member'] }).kind !== 'forbidden' ||
    authorize('/ops', { roles: ['gov_editor'] }).kind !== 'forbidden'
  ) {
    throw new Error('INV-17 A원칙 데이터 방화벽 역할 분리 정책이 위반되었습니다');
  }
}



