// tests/kbrandlab/metrics.test.ts
// PRD v3 §16.4 가상 데이터 검수 시나리오 기반 지표 단위 테스트

import { MetricsCalculator, RawSlotInput, ClaimVerificationInput } from '../../lib/kbrandlab/analysis/metrics';

export async function testMetricsCalculator() {
  console.log('--- [TEST] PRD v3 §16.4 지표 검수 가상 데이터 테스트 ---');

  // PRD §16.4 슬롯 10개 픽스처
  // - 계획 10개, 시작 10개, 정상 수집 8개, 기술 실패 2개
  // - 정상 수집 8개: substantive 5개, insufficient 1개, refusal 1개, empty 1개
  // - 관련 답변 6개 중 대상 브랜드 언급 3개, 추천 2개 (모두 open 프로브)
  const fixtureSlots: RawSlotInput[] = [
    // 5 substantive, 3 mentioned, 2 recommended
    { slotId: 's1', probeId: 'p1', probeType: 'open', language: 'ko', rep: 1, captureStatus: 'captured', started: true, semantic: 'substantive', brandMentioned: true, brandRecommended: true },
    { slotId: 's2', probeId: 'p2', probeType: 'open', language: 'ko', rep: 1, captureStatus: 'captured', started: true, semantic: 'substantive', brandMentioned: true, brandRecommended: true },
    { slotId: 's3', probeId: 'p3', probeType: 'open', language: 'ko', rep: 1, captureStatus: 'captured', started: true, semantic: 'substantive', brandMentioned: true, brandRecommended: false },
    { slotId: 's4', probeId: 'p4', probeType: 'open', language: 'ko', rep: 1, captureStatus: 'captured', started: true, semantic: 'substantive', brandMentioned: false, brandRecommended: false },
    { slotId: 's5', probeId: 'p5', probeType: 'open', language: 'ko', rep: 1, captureStatus: 'captured', started: true, semantic: 'substantive', brandMentioned: false, brandRecommended: false },
    // 1 insufficient, 0 mentioned
    { slotId: 's6', probeId: 'p6', probeType: 'open', language: 'ko', rep: 1, captureStatus: 'captured', started: true, semantic: 'insufficient', brandMentioned: false, brandRecommended: false },
    // 1 refusal
    { slotId: 's7', probeId: 'p7', probeType: 'open', language: 'ko', rep: 1, captureStatus: 'captured', started: true, semantic: 'refusal' },
    // 1 empty
    { slotId: 's8', probeId: 'p8', probeType: 'open', language: 'ko', rep: 1, captureStatus: 'captured', started: true, semantic: 'empty' },
    // 2 technical failed
    { slotId: 's9', probeId: 'p9', probeType: 'open', language: 'ko', rep: 1, captureStatus: 'technical_failed', started: true },
    { slotId: 's10', probeId: 'p10', probeType: 'open', language: 'ko', rep: 1, captureStatus: 'technical_failed', started: true },
  ];

  // 1. M-01 수집 완료율 (8/10 = 80%)
  const m01 = MetricsCalculator.calcM01(fixtureSlots, 10);
  if (m01.rate !== 0.8 || m01.numerator !== 8 || m01.denominator !== 10) {
    throw new Error(`M-01 실패: 기대값 80% (8/10), 실제 ${m01.display}`);
  }
  console.log(`  ✓ M-01 수집 완료율: ${m01.display}`);

  // 2. M-02 기술 성공률 (8/10 = 80%, 슬롯 기준, 시도횟수 12회가 분모가 아님!)
  const m02 = MetricsCalculator.calcM02(fixtureSlots);
  if (m02.rate !== 0.8 || m02.numerator !== 8 || m02.denominator !== 10) {
    throw new Error(`M-02 실패: 기대값 80% (8/10), 실제 ${m02.display}`);
  }
  console.log(`  ✓ M-02 기술 성공률: ${m02.display}`);

  // 3. M-03 실질 답변률 (5/8 = 62.5%)
  const m03 = MetricsCalculator.calcM03(fixtureSlots);
  if (m03.rate !== 0.625 || m03.numerator !== 5 || m03.denominator !== 8) {
    throw new Error(`M-03 실패: 기대값 62.5% (5/8), 실제 ${m03.display}`);
  }
  console.log(`  ✓ M-03 실질 답변률: ${m03.display}`);

  // 4. M-04 브랜드 언급률 (3/6 = 50.0%)
  const m04 = MetricsCalculator.calcM04(fixtureSlots);
  if (m04.rate !== 0.5 || m04.numerator !== 3 || m04.denominator !== 6) {
    throw new Error(`M-04 실패: 기대값 50.0% (3/6), 실제 ${m04.display}`);
  }
  console.log(`  ✓ M-04 브랜드 언급률: ${m04.display}`);

  // 5. M-05 전체 수집 대비 언급률 (3/8 = 37.5%)
  const m05 = MetricsCalculator.calcM05(fixtureSlots);
  if (m05.rate !== 0.375 || m05.numerator !== 3 || m05.denominator !== 8) {
    throw new Error(`M-05 실패: 기대값 37.5% (3/8), 실제 ${m05.display}`);
  }
  console.log(`  ✓ M-05 전체 수집 대비 언급률: ${m05.display}`);

  // 6. M-06 추천 응답률 (2/6 = 33.3%)
  const m06 = MetricsCalculator.calcM06(fixtureSlots);
  const m06Pct = (m06.rate! * 100).toFixed(1);
  if (m06Pct !== '33.3' || m06.numerator !== 2 || m06.denominator !== 6) {
    throw new Error(`M-06 실패: 기대값 33.3% (2/6), 실제 ${m06.display}`);
  }
  console.log(`  ✓ M-06 추천 응답률: ${m06.display}`);

  // 7. M-07 고정 경쟁군 X·Y·Z의 추천 응답 수 각각 2, 3, 1개일 때 X의 추천 점유율 = 2/(2+3+1) = 33.3%
  const competitorCounts = { X: 2, Y: 3, Z: 1 };
  const m07 = MetricsCalculator.calcM07('X', competitorCounts);
  const m07Pct = (m07.rate! * 100).toFixed(1);
  if (m07Pct !== '33.3' || m07.numerator !== 2 || m07.denominator !== 6) {
    throw new Error(`M-07 실패: 기대값 33.3% (2/6), 실제 ${m07.display}`);
  }
  console.log(`  ✓ M-07 추천 점유율: ${m07.display}`);

  // 8. PRD §16.4 정확성 지표 별도 예:
  // 검증 대상 사실 주장 10개 중 맞음 5개, 틀림 1개, 근거 부족 4개
  // - M-12 = 6/10 = 60.0%
  // - M-13 = 5/6 = 83.3%
  const claimFixtures: ClaimVerificationInput[] = [
    { claimId: 'c1', hasIndependentStandard: true, verdict: 'correct' },
    { claimId: 'c2', hasIndependentStandard: true, verdict: 'correct' },
    { claimId: 'c3', hasIndependentStandard: true, verdict: 'correct' },
    { claimId: 'c4', hasIndependentStandard: true, verdict: 'correct' },
    { claimId: 'c5', hasIndependentStandard: true, verdict: 'correct' },
    { claimId: 'c6', hasIndependentStandard: true, verdict: 'incorrect' },
    { claimId: 'c7', hasIndependentStandard: false, verdict: 'insufficient' },
    { claimId: 'c8', hasIndependentStandard: false, verdict: 'insufficient' },
    { claimId: 'c9', hasIndependentStandard: false, verdict: 'insufficient' },
    { claimId: 'c10', hasIndependentStandard: false, verdict: 'insufficient' },
  ];

  const m12 = MetricsCalculator.calcM12(claimFixtures);
  if (m12.rate !== 0.6 || m12.numerator !== 6 || m12.denominator !== 10) {
    throw new Error(`M-12 실패: 기대값 60.0% (6/10), 실제 ${m12.display}`);
  }
  console.log(`  ✓ M-12 검증 가능 주장 비율: ${m12.display}`);

  const m13 = MetricsCalculator.calcM13(claimFixtures);
  const m13Pct = (m13.rate! * 100).toFixed(1);
  if (m13Pct !== '83.3' || m13.numerator !== 5 || m13.denominator !== 6) {
    throw new Error(`M-13 실패: 기대값 83.3% (5/6), 실제 ${m13.display}`);
  }
  console.log(`  ✓ M-13 확인된 주장 정확도: ${m13.display}`);

  // 9. M-16 언어 관찰 격차 (KR vs EN)
  const koRatio = m04; // 50.0%
  const enRatio = { id: 'M-04', name: '브랜드 언급률', numerator: 4, denominator: 5, rate: 0.8, display: '80.0% (4/5)' };
  const m16 = MetricsCalculator.calcM16(koRatio, enRatio);
  if (m16.gapPercentagePoints !== -30.0) {
    throw new Error(`M-16 실패: 기대값 -30.0%p, 실제 ${m16.gapPercentagePoints}%p`);
  }
  console.log(`  ✓ M-16 언어별 관찰 차이: ${m16.gapPercentagePoints}%p`);

  console.log('🎉 PRD v3 §16.4 모든 수치 검수 테스트 완벽 통과!\n');
}

if (require.main === module) {
  testMetricsCalculator().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
