// scripts/kbrandlab/run-local-radar-scan.ts
// 로컬레이다 (LocalRadar · 소상공인 AI 로컬 탐색 스캔) 3대 초기 코호트 배치 진단 스크립트
// 실행: pnpm localradar:scan
// 근거: ADR-0025, PRD FR-93 ~ FR-96

import {
  buildNamedShopCohortTable,
  evaluateShopAllFacts,
  generateShopJsonLd,
  LOCAL_COHORTS,
  LOCAL_RADAR_BRAND_NAME,
  LOCAL_RADAR_BRAND_NAME_EN,
  LOCAL_RADAR_METHOD_VERSION,
  LOCAL_RADAR_SUBTITLE,
  LOCAL_SHOPS,
  validateShopCanonicalFacts,
  type LocalCohortId,
} from '../../lib/kbrandlab/local';

const COHORTS: readonly LocalCohortId[] = [
  'SEOGWIPO_STAY',
  'GANGNAM_SMB',
  'EUNPYEONG_LOCAL',
];

function main() {
  console.log('========================================================================');
  console.log(
    `  ${LOCAL_RADAR_BRAND_NAME} (${LOCAL_RADAR_BRAND_NAME_EN}) — ${LOCAL_RADAR_SUBTITLE}`,
  );
  console.log(`  방법론 버전: ${LOCAL_RADAR_METHOD_VERSION} | 측정 기준일: 2026-10-17`);
  console.log('========================================================================\n');

  let totalShops = 0;
  let totalFacts = 0;
  let totalWalkAwayRisks = 0;
  let validJsonLdCount = 0;

  for (const cid of COHORTS) {
    const cohort = LOCAL_COHORTS[cid];
    const rows = buildNamedShopCohortTable({ cohortId: cid, sortBy: 'name' });

    console.log(`■ [${cohort.regionLabel}] ${cohort.name} (등록한 ${rows.length}곳 중 · 가나다순 무순위)`);
    console.log(`  · 업종: ${cohort.sectorLabel}`);
    console.log(
      `  · 요금: Basic 월 ${cohort.monthlyPriceKrw.toLocaleString()}원 / Pro 월 ${cohort.precisionPackPriceKrw.toLocaleString()}원 (향후 공기업·재단 스폰서십 허용: ${cohort.allowFuturePublicCorpSponsor ? '예' : '아니오'})`,
    );
    console.log('  ----------------------------------------------------------------------');
    console.log(
      '  코드    | 가게 실명 (가나다순)       | KO   | EN   | JA   | ZH   | 도달 | 근거율 | 헛걸음 위험',
    );
    console.log('  ----------------------------------------------------------------------');

    for (const r of rows) {
      totalShops++;
      totalFacts += r.totalHighRiskFacts;
      totalWalkAwayRisks += r.walkAwayRiskCount;

      const shop = LOCAL_SHOPS.find((s) => s.shopId === r.shopId)!;
      const val = validateShopCanonicalFacts(shop);
      if (!val.valid) {
        throw new Error(`${shop.shopName} 정본 검증 실패: ${val.violations.join(', ')}`);
      }
      const jsonLd = generateShopJsonLd(shop);
      if (jsonLd['@context'] === 'https://schema.org') {
        validJsonLdCount++;
      }

      const paddedName = r.shopName.padEnd(16, ' ');
      console.log(
        `  ${r.shopCode} | ${paddedName} | ${r.windowStateByLang.ko.padEnd(3, ' ')} | ${r.windowStateByLang.en.padEnd(3, ' ')} | ${r.windowStateByLang.ja.padEnd(3, ' ')} | ${r.windowStateByLang['zh-Hans'].padEnd(3, ' ')} | ${r.highestStageReached.padEnd(4, ' ')} | ${String(r.officialOrPlaceCitationRatePct).padStart(4, ' ')}% | ${r.walkAwayRiskCount}건/${r.totalHighRiskFacts}항목`,
      );
    }

    // 코호트 내 감지된 헛걸음 위험 항목 상세 출력
    const cohortShops = LOCAL_SHOPS.filter((s) => s.cohortId === cid);
    for (const shop of cohortShops) {
      const risks = evaluateShopAllFacts(shop).filter((e) => e.walkAwayRisk);
      for (const risk of risks) {
        console.log(
          `    ↳ [헛걸음 위험 경보] ${shop.shopName} (${risk.factLabel}): ${risk.minimalQuote} [${risk.rawHash}]`,
        );
      }
    }
    console.log('');
  }

  console.log('========================================================================');
  console.log(
    `  요약: 3대 상권 코호트 총 ${totalShops}곳 매장 | 영업 정본 ${totalFacts}항목 스캔 완료`,
  );
  console.log(
    `  · 감지된 헛걸음 위험: 총 ${totalWalkAwayRisks}건 | Schema.org JSON-LD 생성 검증: ${validJsonLdCount}/${totalShops}곳 PASS`,
  );
  console.log('========================================================================\n');
}

main();
