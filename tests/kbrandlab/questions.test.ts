// tests/kbrandlab/questions.test.ts
// 질문 여정 분류기, 과제 분류기, 프로브 빌더 단위 테스트 (FR-04, FR-09)

import { JourneyClassifier } from '../../lib/kbrandlab/questions/journey-classifier';
import { IssueClassifier } from '../../lib/kbrandlab/questions/issue-classifier';
import { ProbeBuilder } from '../../lib/kbrandlab/questions/probe-builder';

export async function testQuestionEngines() {
  console.log('--- [TEST] 질문 6단계 여정 & 5대 과제 분류기 & 프로브 빌더 테스트 ---');

  // 1. 여정 분류 테스트
  const q1 = '출근길에 들고 다니면서 절대 새지 않는 텀블러 있을까?';
  const j1 = JourneyClassifier.classify(q1);
  console.log(`  ✓ Q: "${q1}" → 여정: ${j1.primaryJourney} (신뢰도: ${j1.confidence})`);
  if (j1.primaryJourney !== 'need_discovery' && j1.primaryJourney !== 'usage_troubleshooting') {
    throw new Error(`여정 분류 실패: ${j1.primaryJourney}`);
  }

  const q2 = '뚜껑 안쪽 고무패킹 부품만 따로 구매할 수 있나요? 해외 배송비는 얼마인가요?';
  const j2 = JourneyClassifier.classify(q2);
  console.log(`  ✓ Q: "${q2}" → 여정: ${j2.primaryJourney}`);
  if (j2.primaryJourney !== 'purchase_terms') {
    throw new Error(`여정 분류 기대값 purchase_terms, 실제 ${j2.primaryJourney}`);
  }

  const q3 = '텀블러 안쪽에 커피 냄새가 배어서 안 빠지는데 식초로 세척하면 되나요?';
  const j3 = JourneyClassifier.classify(q3);
  console.log(`  ✓ Q: "${q3}" → 여정: ${j3.primaryJourney}`);
  if (j3.primaryJourney !== 'usage_troubleshooting') {
    throw new Error(`여정 분류 기대값 usage_troubleshooting, 실제 ${j3.primaryJourney}`);
  }

  // 2. 과제 유형 분류 테스트
  const issue1 = IssueClassifier.classify('뚜껑 고무패킹이 헐거워서 가방 안에서 물이 다 샜어요. 설계 결함 아닌가요?');
  console.log(`  ✓ Issue: 물샘 불만 → 과제: ${issue1.primaryIssueType}`);
  if (issue1.primaryIssueType !== 'product_unfit') {
    throw new Error(`과제 분류 기대값 product_unfit, 실제 ${issue1.primaryIssueType}`);
  }

  const issue2 = IssueClassifier.classify('식기세척기 안심 사용 가능하다고 하는데 공식 시험 성적서나 BPA Free 인증서가 있나요?');
  console.log(`  ✓ Issue: 인증 문의 → 과제: ${issue2.primaryIssueType}`);
  if (issue2.primaryIssueType !== 'verification_gap') {
    throw new Error(`과제 분류 기대값 verification_gap, 실제 ${issue2.primaryIssueType}`);
  }

  // 3. 프로브 빌더 테스트
  const probes = ProbeBuilder.generateProbeCandidates('클린보틀', '텀블러', '식기세척기 사용 가능한가요?', ['스탠리']);
  if (probes.length !== 4) {
    throw new Error(`프로브 후보 생성 개수 실패: 기대값 4개, 실제 ${probes.length}개`);
  }
  const summary = ProbeBuilder.validateAndSummarize('v1.0', '클린보틀 1차 진단 세트', probes);
  console.log(`  ✓ 프로브 세트 생성 요약: 총 ${summary.totalProbes}개 (개발용 ${summary.byPurpose.development}, 평가용 ${summary.byPurpose.evaluation})`);
  if (summary.byPurpose.evaluation !== 1 || summary.byPurpose.development !== 3) {
    throw new Error('개발/평가 분리 요건 불충족');
  }

  console.log('🎉 질문 및 프로브 처리 엔진 테스트 완벽 통과!\n');
}

if (require.main === module) {
  testQuestionEngines().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
