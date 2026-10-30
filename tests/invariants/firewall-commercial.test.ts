// tests/invariants/firewall-commercial.test.ts
// ADR-0025 · FR-93 ~ FR-96: 로컬레이다(LocalRadar) 소상공인 탐색 스캔 방화벽 및 3대 코호트 골든 검증
import fs from 'fs';
import path from 'path';
import {
  buildNamedShopCohortTable,
  computeLocalWindowState,
  evaluateShopAllFacts,
  evaluateShopFact,
  extractNamedShopsFromDiscoveryResponse,
  generateShopJsonLd,
  HIGH_RISK_FACT_DEFINITIONS,
  LOCAL_COHORTS,
  LOCAL_DISCOVERY_PROBES,
  LOCAL_RADAR_BRAND_NAME,
  LOCAL_RADAR_BRAND_NAME_EN,
  LOCAL_RADAR_SUBTITLE,
  LOCAL_SHOPS,
  validateShopCanonicalFacts,
  type LocalCohortId,
} from '../../lib/kbrandlab/local';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

export async function testCommercialFirewallAndLocalRadar() {
  // 1. 브랜드 명칭 검증 (결정 3: 로컬레이다 LocalRadar · 소상공인 AI 로컬 탐색 스캔)
  assert(
    LOCAL_RADAR_BRAND_NAME === '로컬레이다' && LOCAL_RADAR_BRAND_NAME_EN === 'LocalRadar',
    '로컬레이다(LocalRadar) 브랜드 상수가 일치하지 않습니다',
  );
  assert(
    LOCAL_RADAR_SUBTITLE.includes('스캔'),
    '로컬레이다 부제에 스캔(Scan) 명칭이 포함되어야 합니다',
  );

  // 2. 3대 초기 코호트 구성 및 스폰서십 정책 검증 (결정 1: 향후 가능, 결정 2: 서귀포·강남·은평구)
  const expectedCohorts: LocalCohortId[] = ['SEOGWIPO_STAY', 'GANGNAM_SMB', 'EUNPYEONG_LOCAL'];
  for (const cid of expectedCohorts) {
    const cohort = LOCAL_COHORTS[cid];
    assert(Boolean(cohort), `코호트 정의 누락: ${cid}`);
    assert(
      cohort.allowFuturePublicCorpSponsor === true,
      `${cid}: 향후 공기업·지역재단 스폰서십 허용 플래그(결정 1)가 true여야 합니다`,
    );
    assert(
      cohort.disclosureNote.length > 20,
      `${cid}: 이해관계 공시 안내문이 누락되었습니다`,
    );

    const shops = LOCAL_SHOPS.filter((s) => s.cohortId === cid);
    assert(shops.length === 5, `${cid} 코호트 소속 매장은 5곳이어야 합니다 (실제: ${shops.length})`);

    const probes = LOCAL_DISCOVERY_PROBES.filter((p) => p.cohortId === cid);
    assert(probes.length >= 3, `${cid} 코호트 공유 탐색 프로브가 부족합니다`);
    for (const p of probes) {
      assert(
        Boolean(p.questions.ko && p.questions.en && p.questions.ja && p.questions['zh-Hans']),
        `${p.probeId}: 4개 국어(ko/en/ja/zh-Hans) 탐색 질문이 모두 있어야 합니다`,
      );
    }
  }

  // 3. 코호트 내 가게 실명 비교 표 & 가나다순 무순위 정렬 검증 (결정 4 + INV-3)
  for (const cid of expectedCohorts) {
    const rowsByName = buildNamedShopCohortTable({ cohortId: cid, sortBy: 'name' });
    assert(rowsByName.length === 5, `${cid} 가게 실명 비교 표 행 수 불일치`);

    for (let i = 1; i < rowsByName.length; i++) {
      assert(
        rowsByName[i - 1].shopName.localeCompare(rowsByName[i].shopName, 'ko') <= 0,
        `${cid} 가게 실명 표가 가나다순으로 정렬되지 않았습니다`,
      );
    }

    // 점수·측정값 정렬 시도는 즉시 거부되어야 한다 (INV-3)
    let threwOnScoreSort = false;
    try {
      buildNamedShopCohortTable({ cohortId: cid, sortBy: 'score' });
    } catch {
      threwOnScoreSort = true;
    }
    assert(threwOnScoreSort, 'INV-3 위반: 매장 비교 표에서 score 정렬이 거부되지 않았습니다');
  }

  // 4. 공유 탐색 응답에서 가게 실명 및 S1~S3 단계 추출 검증
  const epgMatches = extractNamedShopsFromDiscoveryResponse({
    cohortId: 'EUNPYEONG_LOCAL',
    responseText:
      '은평구에서는 은평한옥마을소나무빵집과 연서시장손두부공방, 구파발나무공방결을 추천합니다.',
    searchUrls: [
      'https://pinebakery-hanok.kr/info',
      'https://yeonseotofu.kr/menu',
    ],
    citedUrls: [
      'https://pinebakery-hanok.kr/info',
      'https://place.map.kakao.com/epg-yeonseotofu',
    ],
  });
  assert(epgMatches.length === 3, `은평구 가게 실명 추출 건수 불일치 (기대 3, 실제 ${epgMatches.length})`);
  assert(
    epgMatches[0].shopName === '구파발나무공방결' &&
      epgMatches[1].shopName === '연서시장손두부공방' &&
      epgMatches[2].shopName === '은평한옥마을소나무빵집',
    '추출된 가게 실명이 가나다순으로 반환되어야 합니다',
  );
  const pineBakeryMatch = epgMatches.find((m) => m.shopName === '은평한옥마을소나무빵집')!;
  assert(
    pineBakeryMatch.s1InSearch && pineBakeryMatch.s2Cited && pineBakeryMatch.s3FirstCited,
    '은평한옥마을소나무빵집 S1~S3 출처 단계 판정 불일치',
  );

  // 5. 4주 12회 창 상태 및 헛걸음 위험 5항목 판정 검증
  assert(HIGH_RISK_FACT_DEFINITIONS.length === 5, '고위험 영업 사실은 5항목이어야 합니다');
  assert(
    computeLocalWindowState([false, false, false, false, false, false, true, true, true, false, false, false]) === '신규',
    '4주 창 상태 신규 판정 실패',
  );

  const testShop = LOCAL_SHOPS.find((s) => s.shopCode === 'EPG-004')!;
  const hoursFact = testShop.facts.find((f) => f.factKey === 'hours_holiday')!;
  const riskEval = evaluateShopFact({
    shop: testShop,
    fact: hoursFact,
    responseText: '은평한옥마을소나무빵집은 매주 월요일 휴무이며 17:00 마감합니다.',
    searchUrls: ['https://blog.example.com/wrong'],
    citedUrls: ['https://blog.example.com/wrong'],
  });
  assert(riskEval.walkAwayRisk === true, '휴무일 오안내 시 walkAwayRisk 가 true여야 합니다');
  assert(riskEval.rawHash.startsWith('fnv1a-'), 'INV-6: rawHash 가 생성되어야 합니다');

  const allEvals = evaluateShopAllFacts(testShop);
  assert(allEvals.length === 5, '매장별 5대 영업 사실 전체 평가 결과는 5건이어야 합니다');

  // 6. 10분 자가 정본 검증 및 Schema.org JSON-LD 생성기 & 의료법 준수 게이트 검증 (FR-96)
  for (const shop of LOCAL_SHOPS) {
    const val = validateShopCanonicalFacts(shop);
    assert(val.valid, `${shop.shopName} 시드 정본 검증 실패: ${val.violations.join(', ')}`);
    const jsonLd = generateShopJsonLd(shop);
    assert(jsonLd['@context'] === 'https://schema.org', 'JSON-LD @context 누락');
    const graph = jsonLd['@graph'] as Array<Record<string, unknown>>;
    assert(Array.isArray(graph) && graph.length === 2, 'JSON-LD @graph 는 엔티티+FAQPage 2개여야 합니다');
  }

  const medicalShop = LOCAL_SHOPS.find((s) => s.isMedicalRegulated)!;
  const tamperedMedicalShop = {
    ...medicalShop,
    facts: medicalShop.facts.map((f, i) =>
      i === 0 ? { ...f, canonicalValue: `${f.canonicalValue} 100% 효과 보장` } : f,
    ),
  };
  const tamperedVal = validateShopCanonicalFacts(tamperedMedicalShop);
  assert(
    tamperedVal.valid === false && tamperedVal.violations.length > 0,
    '의료법 준수 트랙에서 치료 효과 단정 표현이 차단되어야 합니다',
  );

  // 7. 데이터 방화벽 정적 검증 (INV-17: 로컬레이다 코드는 공익 측정 테이블을 직접 쿼리하지 않는다)
  const localRadarFiles = [
    'lib/kbrandlab/local/types.ts',
    'lib/kbrandlab/local/constants.ts',
    'lib/kbrandlab/local/shop-matcher.ts',
    'lib/kbrandlab/local/fact-scanner.ts',
    'lib/kbrandlab/local/jsonld-generator.ts',
    'app/(org)/kbrandlab/local/page.tsx',
    'app/(org)/kbrandlab/local/onboarding/page.tsx',
    'app/api/kbrandlab/local/scan/route.ts',
  ];
  const forbiddenPublicTables = [
    ".from('probe_runs')",
    ".from('probe_answers')",
    ".from('probe_judgments')",
    ".from('observe_runs')",
    ".from('observe_mentions')",
  ];

  for (const relPath of localRadarFiles) {
    const content = fs.readFileSync(path.join(process.cwd(), relPath), 'utf-8');
    for (const badQuery of forbiddenPublicTables) {
      assert(
        !content.includes(badQuery),
        `상업-공익 데이터 방화벽 위반: ${relPath} 파일이 공익 테이블(${badQuery})을 참조합니다`,
      );
    }
  }
}
