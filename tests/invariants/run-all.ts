// tests/invariants/run-all.ts
// AGENTS.md §1: 절대 불변식 (INV-1 ~ INV-12) 및 자체 준수 종합 검증 스위트

import { testInv1TwoPopulations } from './inv-1-two-populations.test';
import { testInv2FourWayVerdict } from './inv-2-four-way-verdict.test';
import { testInv3NoRanking } from './inv-3-no-ranking.test';
import { testInv4LayerSeparation } from './inv-4-layer-separation.test';
import { testInv5NoBypass } from './inv-5-no-bypass.test';
import { testInv6NoRawAi } from './inv-6-no-raw-ai.test';
import { testInv7MeasurementConditions } from './inv-7-measurement-conditions.test';
import { testInv8VerdictPromotion } from './inv-8-verdict-promotion.test';
import { testInv9Distribution } from './inv-9-distribution.test';
import { testInv10RobustnessGate } from './inv-10-robustness-gate.test';
import { testInv11Preregistration } from './inv-11-preregistration.test';
import { testInv12EvidenceLedger } from './inv-12-evidence-ledger.test';
import { testSelfCompliance } from './self-compliance.test';
import { testSpecValidation } from './spec-validation.test';
import { testMeasurementSpecPipeline } from '../measurement/measurement-spec-pipeline.test';
import { testInv4CitizenReportSeparation } from './inv-4-citizen-report-separation.test';
import { testCollectorWebSearch } from '../measurement/collector-websearch.test';
import { testRouteGuard } from './route-guard.test';
import { testInv13JeongdapRules } from './inv-13-jeongdap-rules.test';
import { testE2EGoldenScenarios } from './e2e-golden-scenarios.test';
import { testCommercialFirewallAndLocalRadar } from './firewall-commercial.test';
import { testMapsInvariantsAndGoldenScenarios } from './maps-invariants.test';

async function runAllInvariantTests() {
  console.log('====================================================');
  console.log('  모두의 정답노트 (Jeongdap Note) 절대 불변식 테스트 실행');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const tests = [
    { name: 'INV-1: 두 모집단 합산 금지', fn: testInv1TwoPopulations },
    { name: 'INV-2: 판정 4분 및 undetermined 분리', fn: testInv2FourWayVerdict },
    { name: 'INV-3: 점수로 정렬하지 않는다', fn: testInv3NoRanking },
    { name: 'INV-4: 레이어별 데이터 타입 수준 분리', fn: testInv4LayerSeparation },
    { name: 'INV-4/L2: 시민 제보 및 승격 파이프라인 불변식 검증', fn: testInv4CitizenReportSeparation },
    { name: 'INV-5: 차단 우회 금지 (SCANNER_UA)', fn: testInv5NoBypass },
    { name: 'INV-6: AI 응답 원문 비공개', fn: testInv6NoRawAi },
    { name: 'INV-7: 측정 조건 없는 관측 불가', fn: testInv7MeasurementConditions },
    { name: 'INV-8: 공표 전 판정 승격 (2주 연속)', fn: testInv8VerdictPromotion },
    { name: 'INV-9: 회차별 저장 및 Floor Risk', fn: testInv9Distribution },
    { name: 'INV-10: 강건성 검사 및 8블록 문항 구조', fn: testInv10RobustnessGate },
    { name: 'INV-11: 사전 등록 없는 측정 공표 금지', fn: testInv11Preregistration },
    { name: 'INV-12: 대장에 없는 주장 사용 금지', fn: testInv12EvidenceLedger },
    { name: 'FR-5.4: 자체 사이트 자가 준수 (robots.txt)', fn: testSelfCompliance },
    { name: 'SPEC: measurement-spec 규격 저장소 린트 무결성', fn: testSpecValidation },
    { name: 'SPEC-PIPE: 신규 측정 파이프라인 4단계 완결 검증', fn: testMeasurementSpecPipeline },
    { name: 'ADR-0012: OpenAI 웹검색 수집기·검색 조건 라벨 정오표', fn: testCollectorWebSearch },
    { name: 'SEC-0: 보호 경로 인증·리다이렉트 검증·코드 내 비밀키 금지', fn: testRouteGuard },
    { name: 'INV-13~18: 모두의 정답노트 출처 4단·창 상태·구간·공표 게이트 검증', fn: testInv13JeongdapRules },
    { name: 'E2E-GOLDEN: 7대 주요 시나리오 End-to-End 골든 테스트 (G-1 ~ G-7)', fn: testE2EGoldenScenarios },
    { name: 'ADR-0025: 로컬레이다(LocalRadar) 3대 상권 코호트·가게 실명 비교·상업 방화벽 검증', fn: testCommercialFirewallAndLocalRadar },
    { name: 'ADR-0026/0027: MAPS 스튜디오 불변식(MAPS-INV-01~20) 및 8대 골든 시나리오(MG-1~MG-8) 검증', fn: testMapsInvariantsAndGoldenScenarios },
  ];


  for (const t of tests) {
    try {
      await t.fn();
      console.log(`✅ [PASS] ${t.name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${t.name}: ${err.message}`);
      failed++;
    }
  }

  console.log('\n----------------------------------------------------');
  console.log(`결과: 총 ${tests.length}개 테스트 중 통과 ${passed}개, 실패 ${failed}개`);
  console.log('----------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 모든 절대 불변식을 완벽하게 통과했습니다.\n');
    process.exit(0);
  }
}

runAllInvariantTests();
