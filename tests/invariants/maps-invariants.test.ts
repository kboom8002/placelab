// tests/invariants/maps-invariants.test.ts
// ADR-0026 · ADR-0027 · FR-97 ~ FR-106: MAPS 스튜디오 불변식(MAPS-INV-01 ~ 20) 및 8대 골든 시나리오(MG-1 ~ MG-8) 검증

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  appendFactVersionRevision,
  buildMapsWorkspaceSnapshot,
  checkMapsEligibility,
  computeCostPerGapClosed,
  computeGapForProperty,
  computeKrippendorffAlpha,
  computeMapsMetrics,
  detectModelUpdate,
  diagnoseCause6Stage,
  estimateMapsEffect,
  factsAsOf,
  judgeObservationAsOf,
  lintMapsCopy,
  MAPS_FICTIONAL_SAMPLE_REPORT,
  MAPS_SEED_CANARY_BASELINE,
  MAPS_SEED_CANARY_CURRENT_STABLE,
  MAPS_SEED_ENTITIES,
  MAPS_SEED_FACT_VERSIONS,
  MAPS_SEED_INTERVENTIONS,
  MAPS_SEED_OBSERVATIONS,
  MAPS_SEED_PEER_FACTS,
  MAPS_SEED_PROPS,
  MAPS_SKU_CATALOG,
  MAPS_VERDICT_META,
  resolveEntityMention,
  supersedeJudgment,
} from '../../lib/maps/core';
import {
  processTossWebhookIdempotent,
  validateOrderCreation,
  verifyTossWebhookSignature,
  type TossWebhookPayload,
} from '../../lib/maps/billing/toss';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

export async function testMapsInvariantsAndGoldenScenarios() {
  // =========================================================================
  // MG-1: 이원 시간(as-of) 정본 대장 · 과거 관측 소급 불변 · 지연 일수(lagDays) 검증 (MAPS-INV-03, MAPS-INV-04)
  // =========================================================================
  const entity = MAPS_SEED_ENTITIES[0];
  const feeProp = MAPS_SEED_PROPS.find((p) => p.propKey === 'prop-exam-fee')!;

  // (a) 2026-09-15 시점에는 fv-exam-v1(50,000원)이 현행 유효 정본이어야 한다.
  const lookupSep = factsAsOf(
    MAPS_SEED_FACT_VERSIONS,
    entity.entityId,
    'prop-exam-fee',
    '2026-09-15T10:00:00Z'
  );
  assert(
    lookupSep.activeFact?.factVersionId === 'fv-exam-v1' &&
      lookupSep.activeFact.valueNorm === 50000,
    'MG-1 실패: 2026-09-15 기준 유효 정본은 fv-exam-v1(50,000원)이어야 합니다'
  );

  // (b) 2026-09-15에 50,000원이라고 답한 관측은 'correct'로 판정되어야 한다.
  const obsSep15 = {
    ...MAPS_SEED_OBSERVATIONS[0],
    observationId: 'obs-sep15',
    observedAt: '2026-09-15T10:00:00Z',
    extractedClaims: [
      {
        entityMention: '서울미소안과의원',
        propKey: 'prop-exam-fee',
        claimedValueNorm: 50000,
        claimedValueRaw: '50,000원',
        contextSnippet: '검진 비용 50,000원',
      },
    ],
  };
  const jdgSep15 = judgeObservationAsOf({
    judgmentId: 'jdg-sep15',
    observation: obsSep15,
    targetEntity: entity,
    propDef: feeProp,
    allFactVersions: MAPS_SEED_FACT_VERSIONS,
  });
  assert(
    jdgSep15.verdict === 'correct' && jdgSep15.asOfFactVersionId === 'fv-exam-v1',
    'MG-1 실패: 개정 전(09-15) 관측은 당시 정본(50,000원) 기준으로 correct여야 합니다'
  );

  // (c) 2026-10-01에 70,000원으로 개정된 뒤 2026-10-23에 50,000원을 답한 관측(obs-002)은 'outdated' 및 lagDays = 22여야 한다.
  const jdgOct23Outdated = judgeObservationAsOf({
    judgmentId: 'jdg-oct23-outdated',
    observation: MAPS_SEED_OBSERVATIONS[1],
    targetEntity: entity,
    propDef: feeProp,
    allFactVersions: MAPS_SEED_FACT_VERSIONS,
  });
  assert(
    jdgOct23Outdated.verdict === 'outdated' && jdgOct23Outdated.lagDays === 22,
    `MG-1 실패: 10-23 구버전 응답은 outdated 및 lagDays=22여야 합니다 (실제: ${jdgOct23Outdated.verdict}, lag=${jdgOct23Outdated.lagDays})`
  );

  // (d) 2026-11-01 효력 개정을 Append-Only로 추가해도 과거(10-23) 판정은 변하지 않는다.
  const frozenLedger = Object.freeze([...MAPS_SEED_FACT_VERSIONS]);
  const appendedLedger = appendFactVersionRevision(frozenLedger, {
    newFactVersionId: 'fv-exam-v3-nov',
    previousFact: MAPS_SEED_FACT_VERSIONS[1],
    newValueNorm: 80000,
    newValueRaw: '80,000원',
    effectiveFromIso: '2026-11-01T00:00:00Z',
    recordedAtIso: '2026-10-25T00:00:00Z',
    sourceUrl: 'https://seoulmisoeye.co.kr/facts/fees',
    confirmLevel: 'owner_signed',
    confirmedBy: '원무팀장',
  });
  const jdgOct23AfterNovRevision = judgeObservationAsOf({
    judgmentId: 'jdg-oct23-recheck',
    observation: MAPS_SEED_OBSERVATIONS[0],
    targetEntity: entity,
    propDef: feeProp,
    allFactVersions: appendedLedger,
  });
  assert(
    jdgOct23AfterNovRevision.verdict === 'correct' &&
      jdgOct23AfterNovRevision.asOfFactVersionId === 'fv-exam-v2',
    'MG-1/MAPS-INV-04 실패: 미래 정본 개정이 과거(10-23) 관측 판정을 소급 변경해서는 안 됩니다'
  );

  // =========================================================================
  // MG-2: 개체 해소 이중 임계값(τ, δ) 및 타 대상 혼동(confused) 판정 검증
  // =========================================================================
  const resolvedJongno = resolveEntityMention({
    mentionText: '미소안과의원',
    contextText: '종로구 종각역 인근 종로본원 진료 안내',
    candidates: MAPS_SEED_ENTITIES,
  });
  assert(
    resolvedJongno.status === 'resolved' &&
      resolvedJongno.resolvedEntityId === 'ent-seoulmiso-main',
    'MG-2 실패: 종로구/종각역 문맥이 있을 때 종로본원으로 해소되어야 합니다'
  );

  const ambiguousMention = resolveEntityMention({
    mentionText: '미소안과',
    contextText: '안과 진료 시간 문의',
    candidates: MAPS_SEED_ENTITIES,
  });
  assert(
    ambiguousMention.status !== 'resolved' &&
      ambiguousMention.resolvedEntityId === null,
    'MG-2 실패: 구분 문맥 없는 동명이인 언급은 억지 매칭하지 않고 ambiguous/unmatched로 처리해야 합니다'
  );

  const satProp = MAPS_SEED_PROPS.find((p) => p.propKey === 'prop-saturday-hours')!;
  const jdgConfused = judgeObservationAsOf({
    judgmentId: 'jdg-confused-check',
    observation: MAPS_SEED_OBSERVATIONS[2],
    targetEntity: entity,
    propDef: satProp,
    allFactVersions: MAPS_SEED_FACT_VERSIONS,
    peerFacts: MAPS_SEED_PEER_FACTS,
  });
  assert(
    jdgConfused.verdict === 'confused' &&
      jdgConfused.confusedWithEntityId === 'ent-gangnammiso-peer',
    'MG-2 실패: 타 법인(강남미소안과) 진료시간 응답은 confused로 판정되어야 합니다'
  );

  // =========================================================================
  // MG-3: 무인용 단언(asserted) 분리 및 정본 일치율(factualRate) 분자 제외 검증 (MAPS-INV-20)
  // =========================================================================
  const bookingProp = MAPS_SEED_PROPS.find((p) => p.propKey === 'prop-booking-policy')!;
  const jdgAsserted = judgeObservationAsOf({
    judgmentId: 'jdg-asserted-check',
    observation: MAPS_SEED_OBSERVATIONS[3],
    targetEntity: entity,
    propDef: bookingProp,
    allFactVersions: MAPS_SEED_FACT_VERSIONS,
  });
  assert(
    jdgAsserted.verdict === 'asserted',
    'MG-3/MAPS-INV-20 실패: 값은 맞으나 공식 인용이 없는 응답은 asserted로 판정되어야 합니다'
  );

  const snapshot = buildMapsWorkspaceSnapshot('ten-seoulmiso');
  assert(
    snapshot.metrics.factualRate.numerator === 1 &&
      snapshot.metrics.assertedRate.numerator === 1,
    'MG-3/MAPS-INV-20 실패: asserted 판정은 factualRate 분자에 포함되지 않고 assertedRate로 분리되어야 합니다'
  );
  assert(
    !('compositeScore' in snapshot.metrics) && !('totalScore' in snapshot.metrics),
    'MAPS-INV-02 실패: 단일 합산 점수가 산출되어서는 안 됩니다'
  );

  // 재판정 Append-Only 계보 검증 (MAPS-INV-04)
  const supersededList = supersedeJudgment(
    snapshot.judgments,
    snapshot.judgments[0],
    {
      newJudgmentId: 'jdg-re-001',
      verdict: 'asserted',
      judgeType: 'adjudicated',
      judgeId: 'human-ops-1',
      rationale: '이의 심사 결과 인용 URL 깨짐 확인',
      judgedAtIso: '2026-10-24T00:00:00Z',
    }
  );
  assert(
    supersededList.length === snapshot.judgments.length + 1,
    'MAPS-INV-04 실패: 재판정은 기존 행을 덮어쓰지 않고 행을 추가해야 합니다'
  );

  // =========================================================================
  // MG-4: 6단계 원인 소거 진단(Stage 1~6) 및 5요소 우선순위 분해 검증 (MAPS-INV-08, MAPS-INV-09)
  // =========================================================================
  const stage1 = diagnoseCause6Stage({
    hasCanonicalWebPage: false,
    isCrawlAccessible: false,
    isCapturedInSearchCandidates: false,
    isMachineParseableHtmlOrJsonLd: false,
    isFreeOfOutdatedConflict: false,
  });
  assert(
    stage1.diagnosisStage === 'S1_existence' &&
      stage1.prescriptionCode === 'P1_publish_canonical',
    'MG-4 실패: 공식 페이지 부재 시 Stage 1(S1_existence)이 최우선 소거 진단이어야 합니다'
  );

  const stage4 = diagnoseCause6Stage({
    hasCanonicalWebPage: true,
    isCrawlAccessible: true,
    isCapturedInSearchCandidates: true,
    isMachineParseableHtmlOrJsonLd: false,
    isFreeOfOutdatedConflict: false,
  });
  assert(
    stage4.diagnosisStage === 'S4_parseability' &&
      stage4.prescriptionCode === 'P4_html_table_jsonld',
    'MG-4 실패: 통이미지/비구조화 문서일 때 Stage 4(S4_parseability -> P4_html_table_jsonld)로 진단되어야 합니다'
  );

  for (const task of snapshot.gapTasks) {
    const c = task.priorityComponents;
    assert(
      typeof c.demand === 'number' &&
        typeof c.gap === 'number' &&
        typeof c.harm === 'number' &&
        typeof c.feasibility === 'number' &&
        typeof c.cost === 'number',
      `MAPS-INV-09 실패: 간극 작업(${task.gapTaskId})에 5대 우선순위 구성요소가 모두 있어야 합니다`
    );
  }

  const costStat = computeCostPerGapClosed({
    interventions: MAPS_SEED_INTERVENTIONS,
    closedGapCount: 2,
  });
  assert(
    costStat.costPerGapClosedKrw !== null && costStat.costPerGapClosedKrw > 0,
    'MG-4 실패: 메운 간극 1건당 원가가 정상 산출되어야 합니다'
  );

  // =========================================================================
  // MG-5: 대조군 없는 효과 주장 차단 및 카나리아 모델 업데이트 구간 분리 (MAPS-INV-07, MAPS-INV-12)
  // =========================================================================
  const noControlEffect = estimateMapsEffect({
    treated: {
      preNumerator: 10,
      preDenominator: 30,
      postNumerator: 25,
      postDenominator: 30,
    },
    control: null,
  });
  assert(
    noControlEffect.status === 'exploratory_no_control' &&
      noControlEffect.effectClaimAllowed === false,
    'MG-5/MAPS-INV-07 실패: 대조군이 없으면 effectClaimAllowed가 반드시 false여야 합니다'
  );

  const driftedCanary = detectModelUpdate(MAPS_SEED_CANARY_BASELINE, {
    engineId: 'eng-openai-ws',
    checkedAtIso: '2026-10-18T00:00:00Z',
    avgResponseLength: 1200,
    refusalRate: 0.45,
    citationCountMean: 0.5,
    anchorTokenHitRate: 0.4,
  });
  assert(
    driftedCanary.modelUpdateSuspected === true,
    'MG-5/MAPS-INV-12 실패: 큰 카나리아 지문 변동 시 modelUpdateSuspected=true여야 합니다'
  );

  const driftedEffect = estimateMapsEffect({
    treated: {
      preNumerator: 10,
      preDenominator: 30,
      postNumerator: 25,
      postDenominator: 30,
    },
    control: {
      preNumerator: 10,
      preDenominator: 30,
      postNumerator: 11,
      postDenominator: 30,
    },
    canaryChecksDuringWindow: [driftedCanary],
  });
  assert(
    driftedEffect.status === 'segmented_by_model_update' &&
      driftedEffect.effectClaimAllowed === false &&
      driftedEffect.timelineSegments.length === 2,
    'MG-5/MAPS-INV-07 실패: 모델 업데이트 감지 시 시계열을 2구간으로 분리하고 단독 효과 주장을 차단해야 합니다'
  );

  // =========================================================================
  // MG-6: Krippendorff's α 판정자 간 일치도 게이트 검증 (MAPS-INV-14)
  // =========================================================================
  const highAlpha = computeKrippendorffAlpha([
    ['correct', 'correct'],
    ['outdated', 'outdated'],
    ['confused', 'confused'],
    ['fabricated', 'fabricated'],
    ['asserted', 'asserted'],
  ]);
  assert(
    highAlpha.alpha === 1 &&
      highAlpha.status === 'confirmed' &&
      highAlpha.publishAllowed === true,
    'MG-6 실패: 완전 일치 시 α=1.0 및 confirmed여야 합니다'
  );

  const lowAlpha = computeKrippendorffAlpha([
    ['correct', 'fabricated'],
    ['outdated', 'correct'],
    ['confused', 'asserted'],
    ['fabricated', 'honest_unknown'],
  ]);
  assert(
    lowAlpha.alpha < 0.667 &&
      lowAlpha.status === 'retrain_required' &&
      lowAlpha.publishAllowed === false,
    'MG-6/MAPS-INV-14 실패: α < 0.667 일 때 발행이 차단(publishAllowed=false)되어야 합니다'
  );

  // =========================================================================
  // MG-7: A원칙 지자체 유상 판매 차단 및 준공공 공시 의무 게이트 (INV-17, MAPS-INV-17)
  // =========================================================================
  const muniCheck = checkMapsEligibility({
    orgName: '수원시청',
    orgType: 'local_gov_blocked',
    domain: 'suwon.go.kr',
  });
  assert(
    muniCheck.eligible === false &&
      muniCheck.reasonCode === 'BLOCKED_MUNICIPAL_A_PRINCIPLE' &&
      muniCheck.redirectPath === '/selfcheck',
    'MG-7/INV-17 실패: 기초·광역 지자체는 MAPS 상용 트랙에서 즉시 차단되어야 합니다'
  );

  const govDomainCheck = checkMapsEligibility({
    orgName: '구로구시설안내',
    orgType: 'enterprise',
    domain: 'guro.go.kr',
  });
  assert(
    govDomainCheck.eligible === false &&
      govDomainCheck.reasonCode === 'BLOCKED_PUBLIC_DOMAIN_SUFFIX',
    'MG-7/INV-17 실패: .go.kr 도메인은 조직 구분을 우회해도 차단되어야 합니다'
  );

  const foundationWithoutDisclosure = checkMapsEligibility({
    orgName: '강원문화관광재단',
    orgType: 'foundation',
    domain: 'gwcto.or.kr',
    sponsorDisclosure: '',
  });
  assert(
    foundationWithoutDisclosure.eligible === false &&
      foundationWithoutDisclosure.reasonCode === 'REQUIRES_SPONSOR_DISCLOSURE',
    'MG-7 실패: 공시 문구 없는 출자·출연 재단은 승인되지 않아야 합니다'
  );

  const foundationWithDisclosure = checkMapsEligibility({
    orgName: '강원문화관광재단',
    orgType: 'foundation',
    domain: 'gwcto.or.kr',
    sponsorDisclosure: '2026년 자체 디지털 정본 정비 시범 용역',
  });
  assert(
    foundationWithDisclosure.eligible === true &&
      foundationWithDisclosure.reasonCode ===
        'ELIGIBLE_QUASI_PUBLIC_WITH_DISCLOSURE',
    'MG-7 실패: 공시 문구가 입력된 출자·출연 재단은 승인되어야 합니다'
  );

  // =========================================================================
  // MG-8: 결제·판정 완전 격리, 가격 가정([가정]) 결제 차단, 웹훅 서명·멱등성, 린트 게이트 (MAPS-INV-05/10/13/15/16/18/19)
  // =========================================================================
  const assumptionSku = MAPS_SKU_CATALOG.find(
    (s) => s.priceStatus === 'assumption'
  )!;
  const blockedCheckout = validateOrderCreation({
    sku: assumptionSku,
    orderMode: 'pg_checkout',
  });
  assert(
    blockedCheckout.allowed === false,
    'MG-8/INV-12 실패: price_status=assumption 인 상품은 즉시 결제(pg_checkout)가 차단되어야 합니다'
  );

  const confirmedSku = MAPS_SKU_CATALOG.find(
    (s) => s.skuCode === 'MAPS-PULSE-ONETIME'
  )!;
  const allowedCheckout = validateOrderCreation({
    sku: confirmedSku,
    orderMode: 'pg_checkout',
  });
  assert(
    allowedCheckout.allowed === true && allowedCheckout.amountKrw === 990000,
    'MG-8 실패: price_status=confirmed 상품은 정가 주문이 가능해야 합니다'
  );

  // Toss 웹훅 서명 및 멱등성 검증
  const webhookPayload: TossWebhookPayload = {
    eventType: 'PAYMENT_STATUS_CHANGED',
    createdAt: '2026-10-23T03:00:00Z',
    data: {
      paymentKey: 'tviva202610230001',
      orderId: 'ord_pulse_001',
      status: 'DONE',
      totalAmount: 990000,
      method: '카드',
    },
  };
  const rawBody = JSON.stringify(webhookPayload);
  const secret = 'test-webhook-secret-key';
  const validSig = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');

  assert(
    verifyTossWebhookSignature({
      rawBody,
      signatureHeader: validSig,
      secretKey: secret,
    }) === true,
    'MG-8 실패: 유효한 Toss 웹훅 HMAC 서명이 통과해야 합니다'
  );
  assert(
    verifyTossWebhookSignature({
      rawBody,
      signatureHeader: 'deadbeef',
      secretKey: secret,
    }) === false,
    'MG-8 실패: 위조된 Toss 웹훅 서명은 거부되어야 합니다'
  );

  const firstWebhook = processTossWebhookIdempotent({
    existingPayments: [],
    payload: webhookPayload,
    rawBody,
  });
  const secondWebhook = processTossWebhookIdempotent({
    existingPayments: firstWebhook.payments,
    payload: webhookPayload,
    rawBody,
  });
  assert(
    firstWebhook.duplicated === false &&
      secondWebhook.duplicated === true &&
      secondWebhook.payments.length === 1,
    'MG-8 실패: 중복 웹훅은 멱등하게 1회만 기록되어야 합니다'
  );

  // 카피 린트 게이트 및 [가상] 샘플 리포트 검증 (MAPS-INV-15, MAPS-INV-18)
  const sampleLint = lintMapsCopy(MAPS_FICTIONAL_SAMPLE_REPORT.disclaimer, {
    isFictionalSample: true,
  });
  assert(
    sampleLint.passed === true,
    'MAPS-INV-15 실패: [가상] 샘플 리포트 고지문이 린트를 통과해야 합니다'
  );

  const missingVirtualBadgeLint = lintMapsCopy('샘플 리포트 본문입니다.', {
    isFictionalSample: true,
  });
  assert(
    missingVirtualBadgeLint.passed === false,
    'MAPS-INV-15 실패: [가상] 배지가 빠진 샘플 리포트는 린트에서 차단되어야 합니다'
  );

  // 시각 접근성 3요소(색상+기호+한국어 라벨) 검증 (MAPS-INV-16)
  for (const [verdictKey, meta] of Object.entries(MAPS_VERDICT_META)) {
    assert(
      meta.symbol.length > 0 &&
        meta.labelKo.length > 0 &&
        meta.badgeClass.length > 0,
      `MAPS-INV-16 실패: ${verdictKey} 판정에 기호·한국어라벨·색상 클래스가 모두 있어야 합니다`
    );
  }

  // 정적 격리 검사:
  // 1) lib/maps/core/** 파일이 lib/maps/billing/** 또는 공공 측정 테이블을 절대 import/참조하지 않는지 확인 (MAPS-INV-05)
  const coreDir = path.join(process.cwd(), 'lib/maps/core');
  const coreFiles = fs
    .readdirSync(coreDir)
    .filter((f) => f.endsWith('.ts'));
  for (const file of coreFiles) {
    const content = fs.readFileSync(path.join(coreDir, file), 'utf-8');
    assert(
      !content.includes('/billing/') && !content.includes('maps_billing_'),
      `MAPS-INV-05 위반: 코어 판정/간극 모듈(lib/maps/core/${file})이 결제(billing) 모듈을 참조합니다`
    );
    assert(
      !content.includes(".from('probe_runs')") &&
        !content.includes(".from('probe_judgments')"),
      `INV-17 위반: MAPS 코어 모듈(lib/maps/core/${file})이 공공 측정 테이블을 직접 참조합니다`
    );
  }

  // 2) 마이그레이션 파일 내 Append-Only 트리거 및 private_control RLS 정책 존재 확인 (MAPS-INV-01/03/04/13)
  const migrationSql = fs.readFileSync(
    path.join(
      process.cwd(),
      'supabase/migrations/20261023000001_maps_core_and_billing.sql'
    ),
    'utf-8'
  );
  assert(
    migrationSql.includes('trg_maps_fact_versions_append_only') &&
      migrationSql.includes('trg_maps_observations_append_only') &&
      migrationSql.includes('trg_maps_judgments_append_only'),
    'MAPS-INV-01/03/04 실패: DB 마이그레이션에 정본·관측·판정 Append-Only 보호 트리거가 모두 정의되어야 합니다'
  );
  assert(
    migrationSql.includes("split_group <> 'private_control'"),
    'MAPS-INV-13 실패: 고객사 RLS에서 private_control(비공개 대조군) 문항 열람이 차단되어야 합니다'
  );
}
