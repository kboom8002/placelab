// tests/kbrandlab/run-all.ts
// K-Brand Lab PRD v3.0 종합 검증 스위트

import { testMetricsCalculator } from './metrics.test';
import { testQuestionEngines } from './questions.test';
import { testMeasurementEngines } from './measurement.test';

async function runAllKBrandLabTests() {
  console.log('====================================================');
  console.log('  K-Brand Lab PRD v3.0 종합 검수 스위트 실행');
  console.log('====================================================\n');

  try {
    await testMetricsCalculator();
    await testQuestionEngines();
    await testMeasurementEngines();
    console.log('🎉 K-Brand Lab 전체 기능 검수를 완벽하게 통과했습니다.\n');
    process.exit(0);
  } catch (err: any) {
    console.error(`❌ [FAIL] K-Brand Lab 검수 실패: ${err.message}`);
    process.exit(1);
  }
}

runAllKBrandLabTests();
