// scripts/maps/run-maps-audit.ts
// MAPS 스튜디오 코어 파이프라인 CLI 감사 스크립트 (정본 as-of 6분류 판정 · G1~G6 간극 · 6단계 소거 처방 · Proof DiD)

import {
  buildMapsWorkspaceSnapshot,
  checkMapsEligibility,
  MAPS_GAP_META,
  MAPS_VERDICT_META,
} from '../../lib/maps/core';

function main() {
  console.log('==============================================================');
  console.log('  MAPS Studio (Multi-AI Presence & Alignment Studio) CLI Audit');
  console.log('==============================================================\n');

  const muniBlock = checkMapsEligibility({
    orgName: '수원시청',
    orgType: 'local_gov_blocked',
    domain: 'suwon.go.kr',
  });
  console.log(
    `[A원칙 방화벽 점검] 수원시청(suwon.go.kr) -> eligible=${muniBlock.eligible}, code=${muniBlock.reasonCode}`
  );

  const snapshot = buildMapsWorkspaceSnapshot('ten-seoulmiso');
  console.log(`\n[테넌트] ${snapshot.tenant.name} (${snapshot.tenant.primaryDomain})`);
  console.log(`[측정 스탬프] ${snapshot.metrics.measuredRoundStamp}\n`);

  console.log('--- 1. 4대 헤드라인 지표 (MAPS-INV-02 / MAPS-INV-20) ---');
  console.log(
    `• 존재율(Presence): ${(snapshot.metrics.presenceRate.rate * 100).toFixed(1)}% (95% CI ${(snapshot.metrics.presenceRate.ci95Low * 100).toFixed(1)}~${(snapshot.metrics.presenceRate.ci95High * 100).toFixed(1)}%)`
  );
  console.log(
    `• 정본 일치율(Factual + 공식 인용): ${(snapshot.metrics.factualRate.rate * 100).toFixed(1)}% (무인용 단언 ${snapshot.metrics.assertedRate.numerator}건 제외)`
  );
  console.log(
    `• 공식 인용률(Official Citation): ${(snapshot.metrics.officialCitationRate.rate * 100).toFixed(1)}%`
  );
  console.log(
    `• 피해 위험 비율(Harm Risk): ${(snapshot.metrics.harmRiskRate.rate * 100).toFixed(1)}% (하한선 위반 ${snapshot.metrics.limitViolationCount}건, 평균 구버전 지연 ${snapshot.metrics.avgLagDays ?? 0}일)`
  );

  console.log('\n--- 2. 관측 시점(as-of) 6분류 판정 내역 ---');
  for (const j of snapshot.judgments) {
    const vMeta = MAPS_VERDICT_META[j.verdict];
    console.log(
      `  [${j.observationId}] ${j.propKey} -> ${vMeta.symbol} ${vMeta.labelKo} (${j.verdict}) | ${j.rationale}`
    );
  }

  console.log('\n--- 3. G1~G6 간극 작업함 & 6단계 소거 처방전 (MAPS-INV-09) ---');
  for (const g of snapshot.gapTasks) {
    const gMeta = MAPS_GAP_META[g.gapType];
    console.log(
      `  [${gMeta.code} ${gMeta.labelKo}] ${g.propLabel} | 우선순위=${g.priority.toFixed(3)} (demand=${g.priorityComponents.demand}, gap=${g.priorityComponents.gap}, harm=${g.priorityComponents.harm}, feasibility=${g.priorityComponents.feasibility}, cost=${g.priorityComponents.cost})`
    );
    console.log(`    -> 진단=${g.diagnosisStage} | 처방=${g.prescriptionCode}: ${g.prescriptionTitle}`);
  }

  console.log('\n--- 4. Proof 대조군 전후 검증 (DiD) & 북극성 원가 지표 ---');
  console.log(`• ${snapshot.proofEffect.interpretationKo}`);
  console.log(
    `• 메운 간극 1건당 평균 소요: ${snapshot.costEfficiency.minutesPerGapClosed}분 / 평균 원가: ${snapshot.costEfficiency.costPerGapClosedKrw?.toLocaleString()}원`
  );
  console.log(
    `• 판정자 간 일치도(Krippendorff α): ${snapshot.raterAgreement.alpha} (${snapshot.raterAgreement.status})\n`
  );
}

main();
