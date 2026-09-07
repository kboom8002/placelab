// lib/aeo/verification-scorer.ts
// T1-V 사실 검증 채점 엔진
// GT 대조 기반 정오 판정: correct / outdated / wrong_value / wrong_procedure / absent
// 출처: K03 §M-2.3.2 Failure Syndrome, K04 v2.1 §7
// 불변식: INV-9 (Floor Risk 병기 mandatory, 작화 = critical)

import type { VerificationProbe, VerificationVerdict, FailureSyndrome } from './types/probe-extended';
import type { CompetitiveProbe, CompetitiveResult } from './types/probe-extended';
import type { ReputationProbe, ReputationResult } from './types/probe-extended';
import type { SourceTrackingProbe, SourceTrackingResult } from './types/probe-extended';

// ─── T1-V: 사실 검증 채점 ───

export interface VerificationScore {
  questionId: string;
  parentId: string;
  verdict: VerificationVerdict;
  syndrome?: FailureSyndrome;
  detail: string;                // 판정 근거
  gtValue: string;               // 정답
  aiValue: string;               // AI 답변에서 추출한 값
}

/**
 * GT 대조 기반 사실 검증 채점
 * response = AI 응답 전문, probe = 검증 프로브 (GT 포함)
 */
export function scoreVerification(response: string, probe: VerificationProbe): VerificationScore {
  const base: VerificationScore = {
    questionId: probe.id,
    parentId: probe.parentId,
    verdict: 'absent',
    detail: '',
    gtValue: probe.groundTruth,
    aiValue: '',
  };

  // 1. 미응답 체크
  if (!response || response.trim().length < 10 || response.startsWith('[ERROR]')) {
    base.detail = '미응답 또는 에러';
    return base;
  }

  const trimmed = response.trim();

  // 응답 불가 패턴
  const absentPatterns = [
    '정보가 없습니다', '알 수 없습니다', '확인할 수 없습니다',
    '해당 정보를 찾을 수 없습니다', '답변을 드릴 수 없습니다',
    '제공되지 않', '시청에 문의',
  ];
  if (absentPatterns.some(p => trimmed.includes(p)) && trimmed.length < 80) {
    base.verdict = 'absent';
    base.detail = '응답 불가 표현 감지';
    return base;
  }

  // 2. 정확 일치 검사 — GT 값 또는 허용 변형이 응답에 포함
  const allVariants = [probe.groundTruth, ...probe.acceptableVariants];
  const matchedVariant = allVariants.find(v => v && trimmed.includes(v));

  if (matchedVariant) {
    base.verdict = 'correct';
    base.aiValue = matchedVariant;
    base.detail = `정답 "${matchedVariant}" 포함`;
    return base;
  }

  // 3. 유형별 오류 분석
  if (probe.errorType === 'numeric') {
    // 숫자 추출
    const gtNumbers = extractNumbers(probe.groundTruth);
    const aiNumbers = extractNumbers(trimmed);

    if (aiNumbers.length > 0 && gtNumbers.length > 0) {
      // AI가 숫자를 답했지만 GT와 다른 숫자
      const gtNum = gtNumbers[0];
      const closestAi = aiNumbers.reduce((prev, curr) =>
        Math.abs(curr - gtNum) < Math.abs(prev - gtNum) ? curr : prev
      );

      base.aiValue = String(closestAi);

      if (closestAi === gtNum) {
        base.verdict = 'correct';
        base.detail = `숫자 ${gtNum} 일치`;
      } else {
        // 차이 비율로 outdated vs wrong_value 판별
        const ratio = Math.abs(closestAi - gtNum) / Math.max(gtNum, 1);
        if (ratio <= 0.15) {
          // 15% 이내 차이 → 구버전 가능성
          base.verdict = 'outdated';
          base.syndrome = 'stale_fact';
          base.detail = `GT=${gtNum}, AI=${closestAi} (${Math.round(ratio * 100)}% 차이 — 구버전 가능)`;
        } else {
          base.verdict = 'wrong_value';
          base.syndrome = 'confabulation';
          base.detail = `GT=${gtNum}, AI=${closestAi} (${Math.round(ratio * 100)}% 차이)`;
        }
      }
      return base;
    }

    // 숫자를 안 답한 경우
    base.verdict = 'wrong_value';
    base.syndrome = 'generic_drift';
    base.detail = '숫자 질문에 숫자 없이 답변';
    return base;
  }

  if (probe.errorType === 'name') {
    // 이름/명칭 검사 — GT 토큰과의 일치율
    const gtTokens = probe.groundTruth.split(/[\s,·/()]+/).filter(t => t.length >= 2);
    const matchCount = gtTokens.filter(t => trimmed.includes(t)).length;
    const matchRate = gtTokens.length > 0 ? matchCount / gtTokens.length : 0;

    if (matchRate >= 0.5) {
      base.verdict = 'correct';
      base.aiValue = `${matchCount}/${gtTokens.length} 토큰 일치`;
      base.detail = `이름 토큰 일치율 ${Math.round(matchRate * 100)}%`;
    } else if (matchRate > 0) {
      base.verdict = 'outdated';
      base.syndrome = 'stale_fact';
      base.aiValue = `${matchCount}/${gtTokens.length} 토큰 일치`;
      base.detail = `부분 일치 ${Math.round(matchRate * 100)}% — 변경된 정보 가능`;
    } else {
      base.verdict = 'wrong_value';
      base.syndrome = 'confabulation';
      base.detail = 'GT 토큰과 0% 일치';
    }
    return base;
  }

  if (probe.errorType === 'procedure') {
    // 절차 검사 — GT 핵심 키워드 포함 여부
    const gtTokens = probe.groundTruth.split(/[\s,·/()]+/).filter(t => t.length >= 2);
    const matchCount = gtTokens.filter(t => trimmed.includes(t)).length;
    const matchRate = gtTokens.length > 0 ? matchCount / gtTokens.length : 0;

    if (matchRate >= 0.4) {
      base.verdict = 'correct';
      base.detail = `절차 키워드 ${matchCount}/${gtTokens.length} 포함`;
    } else {
      base.verdict = 'wrong_procedure';
      base.syndrome = 'generic_drift';
      base.detail = `절차 키워드 ${matchCount}/${gtTokens.length}만 포함 — 정확하지 않은 안내`;
    }
    return base;
  }

  // 4. 기본: 토큰 매칭 fallback
  const gtTokens = probe.groundTruth.split(/[\s,·/()]+/).filter(t => t.length >= 2);
  const matchCount = gtTokens.filter(t => trimmed.includes(t)).length;
  const matchRate = gtTokens.length > 0 ? matchCount / gtTokens.length : 0;

  if (matchRate >= 0.5) {
    base.verdict = 'correct';
    base.detail = `토큰 일치율 ${Math.round(matchRate * 100)}%`;
  } else if (matchRate > 0) {
    base.verdict = 'outdated';
    base.detail = `부분 일치 ${Math.round(matchRate * 100)}%`;
  } else {
    base.verdict = 'wrong_value';
    base.detail = 'GT와 일치하는 내용 없음';
  }

  return base;
}

// ─── T3-C: 경쟁 매핑 채점 ───

export function scoreCompetitive(
  response: string,
  probe: CompetitiveProbe,
  unitName: string
): CompetitiveResult {
  const trimmed = (response || '').trim();
  const shortUnit = unitName.replace(/(특별시|광역시|특별자치시|특별자치도|특례시|시|군|구)$/, '');

  const targetMentioned = trimmed.includes(unitName) ||
    (shortUnit.length >= 2 && trimmed.includes(shortUnit));

  const competitorsMentioned = probe.competitors.map(comp => ({
    name: comp,
    mentioned: trimmed.includes(comp),
  }));

  return {
    questionId: probe.id,
    question: probe.body,
    category: probe.category,
    targetMentioned,
    competitorsMentioned,
  };
}

// ─── T3-D: 부정 평판 채점 ───

const SEVERITY_WORDS: Record<string, string[]> = {
  high: ['사고', '범죄', '오염', '부패', '비리', '사기', '위험', '폐쇄', '파산'],
  medium: ['불편', '부족', '낙후', '민원', '교통 체증', '주차난', '물가', '집값'],
  low: ['아쉬운', '개선', '보완', '노력', '과제'],
};

export function scoreReputation(
  response: string,
  probe: ReputationProbe
): ReputationResult {
  const trimmed = (response || '').trim();
  const mentionedIssues: string[] = [];

  for (const [severity, words] of Object.entries(SEVERITY_WORDS)) {
    for (const w of words) {
      if (trimmed.includes(w)) {
        mentionedIssues.push(`[${severity}] ${w}`);
      }
    }
  }

  const highCount = mentionedIssues.filter(i => i.startsWith('[high]')).length;
  const medCount = mentionedIssues.filter(i => i.startsWith('[medium]')).length;

  const severity: 'low' | 'medium' | 'high' =
    highCount > 0 ? 'high' : medCount > 0 ? 'medium' : 'low';

  return {
    questionId: probe.id,
    riskCategory: probe.riskCategory,
    mentionedIssues,
    severity,
    defenseNeeded: severity !== 'low',
  };
}

// ─── T4: 출처 추적 채점 ───

export function scoreSourceTracking(
  response: string,
  probe: SourceTrackingProbe
): SourceTrackingResult {
  const trimmed = (response || '').trim();
  const urlMatches = trimmed.match(/https?:\/\/[^\s)'"]+/g) || [];

  const officialPatterns = ['.go.kr', '.or.kr', '.re.kr', '.ac.kr'];
  const officialUrls = urlMatches.filter(u =>
    officialPatterns.some(p => u.includes(p))
  );
  const unofficialUrls = urlMatches.filter(u =>
    !officialPatterns.some(p => u.includes(p))
  );

  const officialDomains = [...new Set(officialUrls.map(u => {
    try { return new URL(u).hostname; } catch { return u; }
  }))];

  let sourceQuality: 'official' | 'mixed' | 'unofficial' | 'none' = 'none';
  if (urlMatches.length === 0) {
    sourceQuality = 'none';
  } else if (unofficialUrls.length === 0) {
    sourceQuality = 'official';
  } else if (officialUrls.length > 0) {
    sourceQuality = 'mixed';
  } else {
    sourceQuality = 'unofficial';
  }

  return {
    questionId: probe.id,
    citedUrls: urlMatches,
    officialUrlCount: officialUrls.length,
    unofficialUrlCount: unofficialUrls.length,
    officialDomains,
    sourceQuality,
  };
}

// ─── 유틸 ───

/** 문자열에서 숫자 추출 (한국어 만/억 단위 변환 포함) */
function extractNumbers(text: string): number[] {
  const results: number[] = [];

  // 한국어 금액 패턴: "100만원", "50만", "1억"
  const korPattern = /(\d[\d,]*\.?\d*)\s*(만|억)\s*(원)?/g;
  let m;
  while ((m = korPattern.exec(text)) !== null) {
    const base = parseFloat(m[1].replace(/,/g, ''));
    const multiplier = m[2] === '억' ? 100000000 : 10000;
    results.push(base * multiplier);
  }

  // 일반 숫자 (원, %, 세, 개월 등 단위 앞)
  const numPattern = /(\d[\d,]*\.?\d*)\s*(원|%|세|개월|km|㎢|명|건|곳)?/g;
  while ((m = numPattern.exec(text)) !== null) {
    const n = parseFloat(m[1].replace(/,/g, ''));
    if (!isNaN(n) && !results.includes(n)) {
      results.push(n);
    }
  }

  return results;
}
