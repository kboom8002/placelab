// tests/kbrandlab/measurement.test.ts
// 슬롯 생성 산식 및 비용 한도 제어 단위 테스트 (§8.4, §8.9, AC-16, AC-17, AC-28)

import { SlotManager, SlotPlanConfig } from '../../lib/kbrandlab/measurement/slot-manager';
import { ProviderAdapter, RawAttemptResult } from '../../lib/kbrandlab/adapters/types';

export async function testMeasurementEngines() {
  console.log('--- [TEST] 슬롯 생성 산식 & 시도/재시도 통제 & 예산 한도 테스트 ---');

  // 1. 슬롯 산출 산식 테스트 (§8.9)
  // 20문항 × 2언어 × 2환경 × 3회 = 240 슬롯
  const probeIds = Array.from({ length: 20 }, (_, i) => `p-${i + 1}`);
  const planConfig: SlotPlanConfig = {
    runId: 'run-test-1',
    probeIds,
    languages: ['ko', 'en'],
    providers: [
      { provider: 'openai', model: 'gpt-5.6-luna', searchGrounding: false },
      { provider: 'gemini', model: 'gemini-3.5-flash-lite', searchGrounding: true },
    ],
    reps: 3,
    timepoint: 'baseline_1',
    budgetLimitUsd: 10.0,
  };

  const slots = SlotManager.generateSlots(planConfig);
  console.log(`  ✓ 계획 슬롯 생성 수: ${slots.length}개 (기대값: 20×2×2×3 = 240개)`);
  if (slots.length !== 240) {
    throw new Error(`슬롯 생성 산식 실패: 기대값 240개, 실제 ${slots.length}개`);
  }

  // 2. 브랜드 미언급 시 재시도 금지 테스트 (AC-17)
  const mockAdapterSuccessNoBrand: ProviderAdapter = {
    providerId: 'mock',
    modelId: 'mock-model',
    isVerified: true,
    async execute(): Promise<RawAttemptResult> {
      return {
        modelReturned: 'mock-model',
        latencyMs: 150,
        costUsd: 0.0001,
        rawResponse: '텀블러는 스테인리스 304 재질이 가장 널리 쓰입니다.',
        rawResponseHash: 'hash123',
        citedUrls: ['https://example.com/tumbler'],
        sentAt: new Date().toISOString(),
      };
    },
  };

  const costTracker = {
    currentSpendUsd: 0,
    budgetLimitUsd: 5.0,
    addCost(c: number) {
      this.currentSpendUsd += c;
    },
  };

  const slot1 = { ...slots[0] };
  const executedSlot1 = await SlotManager.executeSlot(slot1, '텀블러 추천해줘', mockAdapterSuccessNoBrand, costTracker);
  console.log(`  ✓ 브랜드 미언급 정상 답변: 상태=${executedSlot1.captureStatus}, 시도횟수=${executedSlot1.attemptsCount}`);
  if (executedSlot1.captureStatus !== 'captured' || executedSlot1.attemptsCount !== 1) {
    throw new Error('AC-17 실패: 정상 답변에 브랜드가 없다는 이유로 재시도되었거나 캡처 실패');
  }

  // 3. 예산 한도 도달 시 신규 요청 중단 테스트 (AC-28, NFR-05)
  const costTrackerOverBudget = {
    currentSpendUsd: 4.99995,
    budgetLimitUsd: 5.0, // 잔여 예산 0.00005 < 0.0001
    addCost(c: number) {
      this.currentSpendUsd += c;
    },
  };

  const slot2 = { ...slots[1] };
  const executedSlot2 = await SlotManager.executeSlot(slot2, '텀블러 추천', mockAdapterSuccessNoBrand, costTrackerOverBudget);
  console.log(`  ✓ 예산 한도 초과 시 신규 요청 상태: ${executedSlot2.captureStatus} (시도횟수: ${executedSlot2.attemptsCount})`);
  if (executedSlot2.captureStatus !== 'cancelled' || executedSlot2.attemptsCount !== 0) {
    throw new Error('AC-28 실패: 예산 한도 도달 시 요청이 취소되지 않고 발송됨');
  }

  console.log('🎉 슬롯 생성 및 비용 제어 엔진 테스트 완벽 통과!\n');
}

if (require.main === module) {
  testMeasurementEngines().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
