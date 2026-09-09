#!/usr/bin/env npx tsx
// scratch: analyze wando deep measurement results for L2 report
import * as fs from 'fs';
import * as path from 'path';

const raw = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../docs/aeo-measurements/m-20260909-wando-deep.json'), 'utf-8'
));
const results: any[] = raw.results;
const meta = raw.measurement;

// ─── 1. GT 대조 분석 ───
const GT: Record<string, { facts: string[]; label: string }> = {
  'WD-A01': { facts: ['2023', '11', '24', '신지면'], label: '센터 위치/개관일' },
  'WD-A02': { facts: ['36,000', '36000', '100,000', '100000', '125,000', '125000'], label: '센터 요금' },
  'WD-B08': { facts: ['70%', '70', '52%', '52'], label: '전복/해조류 비율' },
  'WD-C01': { facts: ['2031', '1,815', '1815', '381'], label: '난대수목원' },
  'WD-D01': { facts: ['1,000원', '1000원', '천원'], label: '천원 여객선' },
};

console.log('\n═══ GT(정답) 대조 분석 ═══');
for (const [qId, gt] of Object.entries(GT)) {
  const qResults = results.filter((r: any) => r.questionId === qId);
  for (const r of qResults) {
    const matched = gt.facts.filter(f => r.response.includes(f));
    const ratio = matched.length > 0 ? '✓ 일치' : '✗ 불일치';
    console.log(`  ${qId} R${r.rep} [${gt.label}]: ${ratio} (매칭: ${matched.join(', ') || 'none'})`);
  }
}

// ─── 2. SoV 상세 분석 ───
console.log('\n═══ SoV(비브랜드 추천) 상세 분석 ═══');
const sovIds = ['WD-A05', 'WD-A06', 'WD-A07', 'WD-B04', 'WD-C06', 'WD-E06'];
for (const qId of sovIds) {
  const qResults = results.filter((r: any) => r.questionId === qId);
  console.log(`\n  ${qId} [${qResults[0]?.category}]:`);
  for (const r of qResults) {
    const hasWando = /완도|wando/i.test(r.response);
    const snippet = r.response.replace(/\n/g, ' ').slice(0, 200);
    console.log(`    R${r.rep}: ${hasWando ? '✓ 완도 등장' : '✗ 완도 미등장'} — "${snippet}..."`);
  }
}

// ─── 3. H2H 분석 ───
console.log('\n═══ H2H(1:1 대결) 분석 ═══');
const h2hIds = ['WD-E01', 'WD-E02', 'WD-E03', 'WD-E04'];
const h2hLabels: Record<string, string> = {
  'WD-E01': 'vs 태안', 'WD-E02': 'vs 거제', 'WD-E03': 'vs 제주', 'WD-E04': 'vs 진도'
};
for (const qId of h2hIds) {
  const qResults = results.filter((r: any) => r.questionId === qId);
  console.log(`\n  ${qId} [${h2hLabels[qId]}]:`);
  for (const r of qResults) {
    // 간이 판정: 완도 추천/긍정 vs 상대 추천
    const resp = r.response;
    const wandoPositive = /완도.*추천|완도.*장점|완도.*좋|완도가 낫|완도를 추천/i.test(resp);
    const snippet = resp.replace(/\n/g, ' ').slice(0, 250);
    console.log(`    R${r.rep}: ${wandoPositive ? '● 완도 우세' : '△ 중립/상대 우세'} — "${snippet}..."`);
  }
}

// ─── 4. EN(영문) 응답 분석 ───
console.log('\n═══ EN(영문) 응답 분석 ═══');
const enIds = ['WD-E05', 'WD-E06', 'WD-E07', 'WD-E08'];
for (const qId of enIds) {
  const qResults = results.filter((r: any) => r.questionId === qId);
  console.log(`\n  ${qId} [${qResults[0]?.category}]:`);
  for (const r of qResults) {
    const snippet = r.response.replace(/\n/g, ' ').slice(0, 250);
    const hasWando = /wando/i.test(r.response);
    console.log(`    R${r.rep}: ${hasWando ? '✓ Wando' : '✗ No Wando'} [${r.groundingChunks.length} sources] — "${snippet}..."`);
  }
}

// ─── 5. 출처 도메인 상세 ───
console.log('\n═══ 출처 도메인 전체 (빈도 2 이상) ═══');
const allDomains: Record<string, number> = {};
for (const r of results) {
  for (const chunk of r.groundingChunks) {
    const title = chunk.title || '(no title)';
    allDomains[title] = (allDomains[title] || 0) + 1;
  }
}
const sorted = Object.entries(allDomains).sort(([,a],[,b]) => b - a);
for (const [domain, count] of sorted) {
  if (count >= 2) console.log(`  ${domain}: ${count}건`);
}

// ─── 6. 축별 평균 출처 수 ───
console.log('\n═══ 축별 평균 출처 수 ═══');
const axes = ['A_healing', 'B_bio', 'C_eco_tourism', 'D_admin', 'E_h2h_en'];
for (const axis of axes) {
  const axResults = results.filter((r: any) => r.axis === axis);
  const avgSources = axResults.reduce((a: number, r: any) => a + r.groundingChunks.length, 0) / axResults.length;
  const avgLatency = axResults.reduce((a: number, r: any) => a + r.latencyMs, 0) / axResults.length;
  console.log(`  [${axis}] 평균 출처: ${avgSources.toFixed(1)}건 | 평균 응답시간: ${avgLatency.toFixed(0)}ms`);
}

// ─── 7. 작화/오류 의심 체크 ───
console.log('\n═══ 작화 의심 패턴 체크 ═══');
// 난대수목원 "이미 완공" 작화
const c01 = results.filter((r: any) => r.questionId === 'WD-C01');
for (const r of c01) {
  const hasCompleted = /완공|개원.*했|개원.*되|오픈.*했/i.test(r.response);
  if (hasCompleted && !/예정|목표|계획|조성.*중/i.test(r.response)) {
    console.log(`  ⚠️ WD-C01 R${r.rep}: 난대수목원 "이미 완공" 작화 의심!`);
  } else {
    console.log(`  ✓ WD-C01 R${r.rep}: "조성 중/예정" 올바른 서술`);
  }
}

// 센터 요금 오류
const a02 = results.filter((r: any) => r.questionId === 'WD-A02');
for (const r of a02) {
  const has36k = /36,?000|3만.*6/i.test(r.response);
  const has100k = /100,?000|10만/i.test(r.response);
  const has125k = /125,?000|12만.*5/i.test(r.response);
  console.log(`  WD-A02 R${r.rep} 요금: 베이식${has36k?'✓':'✗'} 디럭스${has100k?'✓':'✗'} 프리미엄${has125k?'✓':'✗'}`);
}

// ─── 8. 완도군 통제 가능 출처 비율 ───
console.log('\n═══ 통제 가능 출처 비율 (M-11) ═══');
const controllableDomains = ['wando.go.kr', 'wandohealing.or.kr', 'wandostory.co.kr', 'gmwando.com', 'cheongsando.net', 'hdhy.co.kr'];
const totalSources = meta.grounding_stats.total_grounding_sources;
let controllableCount = 0;
for (const d of controllableDomains) {
  controllableCount += meta.domain_frequency[d] || 0;
}
console.log(`  통제 가능 도메인: ${controllableDomains.join(', ')}`);
console.log(`  통제 가능 출처: ${controllableCount}/${totalSources} (${(controllableCount/totalSources*100).toFixed(1)}%)`);
console.log(`  비통제 출처: ${totalSources - controllableCount}/${totalSources} (${((totalSources-controllableCount)/totalSources*100).toFixed(1)}%)`);

// ─── 9. 해양치유 SoV 상세 – 완도 vs 경쟁지 ───
console.log('\n═══ 해양치유 오픈 SoV — 경쟁지 등장 분석 ═══');
const sovHealingIds = ['WD-A05', 'WD-A06', 'WD-A07'];
const competitors = ['태안', '제주', '거제', '강릉', '부산', '강원', '속초', '경주', '보령', '서귀포', '여수'];
for (const qId of sovHealingIds) {
  const qResults = results.filter((r: any) => r.questionId === qId);
  console.log(`\n  ${qId} [${qResults[0]?.category}]:`);
  for (const r of qResults) {
    const found: string[] = [];
    if (/완도|wando/i.test(r.response)) found.push('완도');
    for (const c of competitors) {
      if (r.response.includes(c)) found.push(c);
    }
    console.log(`    R${r.rep}: 등장 지역 = [${found.join(', ')}]`);
  }
}
