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

async function runAllInvariantTests() {
  console.log('====================================================');
  console.log('  kplacelab 절대 불변식 (INV-1 ~ INV-12) 테스트 실행');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const tests = [
    { name: 'INV-1: 두 모집단 합산 금지', fn: testInv1TwoPopulations },
    { name: 'INV-2: 판정 4분 및 undetermined 분리', fn: testInv2FourWayVerdict },
    { name: 'INV-3: 점수로 정렬하지 않는다', fn: testInv3NoRanking },
    { name: 'INV-4: 레이어별 데이터 타입 수준 분리', fn: testInv4LayerSeparation },
    { name: 'INV-5: 차단 우회 금지 (SCANNER_UA)', fn: testInv5NoBypass },
    { name: 'INV-6: AI 응답 원문 비공개', fn: testInv6NoRawAi },
    { name: 'INV-7: 측정 조건 없는 관측 불가', fn: testInv7MeasurementConditions },
    { name: 'INV-8: 공표 전 판정 승격 (2주 연속)', fn: testInv8VerdictPromotion },
    { name: 'INV-9: 회차별 저장 및 Floor Risk', fn: testInv9Distribution },
    { name: 'INV-10: 강건성 검사 및 8블록 문항 구조', fn: testInv10RobustnessGate },
    { name: 'INV-11: 사전 등록 없는 측정 공표 금지', fn: testInv11Preregistration },
    { name: 'INV-12: 대장에 없는 주장 사용 금지', fn: testInv12EvidenceLedger },
    { name: 'FR-5.4: 자체 사이트 자가 준수 (robots.txt)', fn: testSelfCompliance },
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
