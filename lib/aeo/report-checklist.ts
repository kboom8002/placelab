// lib/aeo/report-checklist.ts
// DIR-01 부록 · 발행 전 체크리스트 12항 자동 검증
// 1항이라도 실패하면 보고서에 _DRAFT 접미사

import type { VIPReport } from './types/vip-report';

export interface CheckResult {
  id: number;
  description: string;
  passed: boolean;
  detail: string;
}

/**
 * DIR-01 부록 12항 자동 검증
 * 마크다운 전문과 구조 데이터를 모두 검사
 */
export function runChecklist(report: VIPReport): CheckResult[] {
  const md = report.markdownFull;
  const results: CheckResult[] = [];

  // 1. 표의 판정을 직접 센 값과 요약 줄이 일치하는가
  const stability = report.insights.stabilityAnalysis.filter(s => s.questionId.startsWith('B-'));
  const stableCount = stability.filter(s => s.status === 'stable').length;
  const unstableCount = stability.filter(s => s.status === 'unstable').length;
  const absentCount = stability.filter(s => s.status === 'absent').length;
  const summaryMatch = md.includes(`안정(3/3) ${stableCount}`) &&
    md.includes(`불안정(1~2/3) ${unstableCount}`) &&
    md.includes(`미응답(0/3) ${absentCount}`);
  results.push({
    id: 1,
    description: '표 판정 직접 센 값 = 요약줄',
    passed: summaryMatch,
    detail: summaryMatch ? `안정${stableCount}/불안정${unstableCount}/미응답${absentCount} 일치` :
      `요약줄 불일치 — 실제: 안정${stableCount}/불안정${unstableCount}/미응답${absentCount}`
  });

  // 2. 모든 백분율에 분자·분모가 병기되어 있는가
  // 백분율 단독 패턴: "N%" 앞에 "/" 없으면 위반 (건 단위 표현 없이 % 단독)
  const pctPattern = /(?<!\d\/\d+건\s*\()(\d+\.?\d*)%/g;
  const pctMatches = [...md.matchAll(pctPattern)];
  // 표지의 산출식 안 백분율, 푸터, 표 내부(GT값), "중위소득" 등은 허용
  const isolatedPcts = pctMatches.filter(m => {
    const context = md.substring(Math.max(0, m.index! - 50), m.index! + 20);
    return !context.includes('/') && !context.includes('건') && !context.includes('산출식')
      && !context.includes('중위소득') && !context.includes('| ❌') && !context.includes('| ✅')
      && !context.includes('| 🟡') && !context.includes('공식 정보');
  });
  results.push({
    id: 2,
    description: '모든 백분율에 분자·분모 병기',
    passed: isolatedPcts.length === 0,
    detail: isolatedPcts.length === 0 ? '통과' :
      `분자·분모 없는 백분율 ${isolatedPcts.length}건: ${isolatedPcts.slice(0, 3).map(m => m[0]).join(', ')}`
  });

  // 3. 백분율 산출식이 문서에 적혀 있는가
  const hasFormula = md.includes('산출식') || md.includes('응답 건수 ÷ 총 관측 건수');
  results.push({
    id: 3,
    description: '백분율 산출식 명시',
    passed: hasFormula,
    detail: hasFormula ? '산출식 기재됨' : '산출식 누락'
  });

  // 4. 판정 등급 정의가 문서 안에서 하나인가
  const hasStableDef = md.includes('안정(3/3)') && md.includes('불안정(1~2/3)') && md.includes('미응답(0/3)');
  const hasConflictingTerms = md.includes('위험') && md.includes('취약');
  results.push({
    id: 4,
    description: '판정 등급 정의 통일',
    passed: hasStableDef && !hasConflictingTerms,
    detail: hasStableDef ? '통일된 3등급 사용' : '등급 정의 불일치'
  });

  // 5. 다른 지자체와의 수치 비교·등수 표현이 없는가
  const rankWords = ['등수', '랭킹', '전국 평균', '보다 낮', '보다 높', '국내 유일', '세계 최초'];
  // '순위'는 '우선순위'와 주석(INV-3)을 제외하고 검사
  const foundRank = rankWords.filter(w => md.includes(w));
  // '순위' 단독 검사 (우선순위 제외)
  const rankAlone = md.replace(/우선순위/g, '').replace(/INV-3.*순위.*금지/g, '').replace(/순위 금지/g, '');
  if (rankAlone.includes('순위')) foundRank.push('순위');
  results.push({
    id: 5,
    description: '타 지자체 수치 비교·등수 없음',
    passed: foundRank.length === 0,
    detail: foundRank.length === 0 ? '통과' : `위반: ${foundRank.join(', ')}`
  });

  // 6. "AI가"를 "이 모델은"으로 바꿨는가
  const aiGaCount = (md.match(/AI가/g) || []).length;
  const aiNeunCount = (md.match(/AI는/g) || []).length;
  // 표지 한계 설명 등의 "AI" 단독은 허용, "AI가" "AI는" 주어 사용이 문제
  results.push({
    id: 6,
    description: '"이 모델은" 사용 ("AI가" 없음)',
    passed: aiGaCount === 0 && aiNeunCount === 0,
    detail: aiGaCount + aiNeunCount === 0 ? '통과' : `"AI가" ${aiGaCount}건, "AI는" ${aiNeunCount}건`
  });

  // 7. 단일 모델·단일 시점 한계가 표지에 있는가
  const hasLimit = md.includes('다른 모델·다른 시점에서 결과가 달라질 수 있음') ||
    md.includes('단일 모델') || md.includes('1종');
  results.push({
    id: 7,
    description: '단일 모델·시점 한계 표지 기재',
    passed: hasLimit,
    detail: hasLimit ? '한계 기재됨' : '한계 누락'
  });

  // 8. 탐색적 측정 표기
  const hasExploratory = md.includes('탐색적 측정') || md.includes('사전 등록 전');
  results.push({
    id: 8,
    description: '탐색적 측정 표기',
    passed: hasExploratory,
    detail: hasExploratory ? '표기됨' : '누락'
  });

  // 9. 「이 측정으로는 알 수 없는 것」 장이 있는가
  const hasLimitations = md.includes('이 측정으로는 알 수 없는 것');
  results.push({
    id: 9,
    description: '「알 수 없는 것」 장 존재',
    passed: hasLimitations,
    detail: hasLimitations ? '존재' : '누락'
  });

  // 10. R4 후보가 한 건 이상 별도 표시되어 있는가
  const hasR4 = report.r4Candidates && report.r4Candidates.length > 0;
  results.push({
    id: 10,
    description: 'R4 후보 1건 이상',
    passed: !!hasR4,
    detail: hasR4 ? `${report.r4Candidates.length}건` : '없음'
  });

  // 11. 생활행정이 브랜딩보다 앞에 있는가
  const adminIdx = md.indexOf('주민이 묻는 것');
  const brandIdx = md.indexOf('추천에서');
  const adminFirst = adminIdx >= 0 && brandIdx >= 0 && adminIdx < brandIdx;
  results.push({
    id: 11,
    description: '생활행정이 브랜딩보다 앞',
    passed: adminFirst,
    detail: adminFirst ? '§1 생활행정 → §4 추천' : '순서 위반'
  });

  // 12. 발행 주체가 DMN 단독으로 표기되어 있는가
  const hasDMN = md.includes('디지털미디어네트워크');
  const hasAIKA = md.includes('AIKA') || md.includes('인공지능');
  results.push({
    id: 12,
    description: '발행 주체 DMN 단독',
    passed: hasDMN && !hasAIKA,
    detail: hasDMN ? 'DMN 표기됨' : 'DMN 누락'
  });

  return results;
}

/**
 * 체크리스트 결과를 콘솔에 출력
 */
export function printChecklistResults(results: CheckResult[]): boolean {
  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  console.log(`\n📋 DIR-01 발행 전 체크리스트 (${passed}/${total})`);
  console.log('─'.repeat(60));

  for (const r of results) {
    const mark = r.passed ? '✅' : '❌';
    console.log(`  ${mark} ${r.id}. ${r.description}`);
    if (!r.passed) {
      console.log(`     → ${r.detail}`);
    }
  }

  console.log('─'.repeat(60));
  if (passed === total) {
    console.log('  🟢 전항 통과 — 발행 가능');
  } else {
    console.log(`  🔴 ${total - passed}항 실패 — DRAFT 상태`);
  }

  return passed === total;
}
