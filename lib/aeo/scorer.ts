// lib/aeo/scorer.ts
// 3-Tier AEO 채점 엔진 (T1/T2/T3 및 Floor Risk 판정)
// 출처: K04 v2.1, ADR-0011, SDD.md
// 불변식: INV-9 (Floor Risk 병기 mandatory, 작화 = critical)

export type Tier1Verdict = 'accurate' | 'partial' | 'wrong' | 'absent';
export type Tier2Verdict = 'accurate_relevant' | 'accurate_generic' | 'partial' | 'wrong' | 'absent';
export type Tier3Verdict = 'mentioned_positive' | 'mentioned_neutral' | 'mentioned_negative' | 'not_mentioned';

/**
 * Tier 1: keyword-based scoring
 * - if response is empty or '(응답 없음)' → 'absent'
 * - otherwise → 'accurate' (detailed scoring requires ground truth, placeholder for now)
 */
export function scoreTier1(response: string, groundTruth?: string): Tier1Verdict {
  if (!response || !response.trim() || response.trim() === '(응답 없음)' || response.startsWith('[ERROR]')) {
    return 'absent';
  }
  return 'accurate';
}

/**
 * Tier 2: check if response contains ground truth keywords AND unit-specific info
 * - absent check
 * - if response contains key facts from groundTruth AND unit-specific info → accurate_relevant
 * - if response is correct but generic ('시청에 문의하세요') → accurate_generic
 * - otherwise placeholder logic
 */
export function scoreTier2(
  response: string,
  groundTruth?: string,
  unitName?: string
): Tier2Verdict {
  if (!response || !response.trim() || response.trim() === '(응답 없음)' || response.startsWith('[ERROR]')) {
    return 'absent';
  }

  const trimmed = response.trim();

  // absent check
  const absentPatterns = [
    '정보가 없습니다',
    '알 수 없습니다',
    '확인할 수 없습니다',
    '해당 정보를 찾을 수 없습니다',
    '답변을 드릴 수 없습니다',
    '자료가 없습니다',
  ];
  if (absentPatterns.some(p => trimmed.includes(p)) && trimmed.length < 60) {
    return 'absent';
  }

  // generic markers ('시청에 문의하세요', etc.)
  const genericPatterns = [
    '시청에 문의',
    '군청에 문의',
    '구청에 문의',
    '주민센터에 문의',
    '관할 지자체에 문의',
    '해당 지자체 홈페이지',
    '지자체 홈페이지를 참고',
    '문의하시기 바랍니다',
    '부서에 문의',
    '홈페이지에서 확인',
  ];
  const isGeneric = genericPatterns.some(p => trimmed.includes(p));

  // Unit-specific check
  const shortUnit = unitName ? unitName.replace(/(특별시|광역시|특별자치시|특별자치도|특례시|시|군|구)$/, '') : '';
  const hasUnitSpecificInfo = Boolean(
    (unitName && trimmed.includes(unitName)) ||
    (shortUnit && shortUnit.length >= 2 && trimmed.includes(shortUnit))
  );

  // Ground truth key facts check
  let gtMatchRate = 0;
  if (groundTruth && groundTruth.trim().length > 0) {
    const gtTokens = groundTruth
      .trim()
      .split(/[\s,·/()]+/)
      .filter(t => t.length >= 2);

    if (gtTokens.length > 0) {
      const matchCount = gtTokens.filter(t => trimmed.includes(t)).length;
      gtMatchRate = matchCount / gtTokens.length;
    }
  }

  // 1. If response contains key facts from groundTruth AND unit-specific info → accurate_relevant
  if (gtMatchRate >= 0.35 && hasUnitSpecificInfo) {
    return 'accurate_relevant';
  }

  // 2. If response is correct but generic ('시청에 문의하세요') → accurate_generic
  if (isGeneric && !hasUnitSpecificInfo) {
    return 'accurate_generic';
  }

  // If high match with ground truth even without explicit unit name
  if (gtMatchRate >= 0.5) {
    return 'accurate_relevant';
  }

  if (isGeneric) {
    return 'accurate_generic';
  }

  // Otherwise placeholder logic
  if (gtMatchRate > 0 || hasUnitSpecificInfo) {
    return 'partial';
  }

  if (groundTruth && groundTruth.trim().length > 0 && gtMatchRate === 0) {
    return 'wrong';
  }

  return 'partial';
}

/**
 * Tier 3: check if target unit is mentioned in response
 * - if targetUnit appears in response → check context (simple heuristic)
 * - positive words nearby → mentioned_positive
 * - negative words nearby → mentioned_negative
 * - otherwise → mentioned_neutral
 * - if not mentioned → not_mentioned
 */
export function scoreTier3(
  response: string,
  targetUnit: string,
  targetKeywords: string[] = []
): Tier3Verdict {
  if (!response || !response.trim() || response.trim() === '(응답 없음)' || response.startsWith('[ERROR]')) {
    return 'not_mentioned';
  }

  const trimmed = response.trim();
  const shortUnit = targetUnit ? targetUnit.replace(/(특별시|광역시|특별자치시|특별자치도|특례시|시|군|구)$/, '') : '';

  // Check if targetUnit appears in response
  const unitPatterns = [targetUnit];
  if (shortUnit && shortUnit.length >= 2 && shortUnit !== targetUnit) {
    unitPatterns.push(shortUnit);
  }

  const hasMention = unitPatterns.some(pattern => pattern && trimmed.includes(pattern));
  if (!hasMention) {
    return 'not_mentioned';
  }

  // Context heuristic
  const positiveWords = [
    '추천', '좋은', '좋습', '유명', '아름다운', '아름답', '편리', '훌륭',
    '인기', '매력', '활성화', '적합', '안성맞춤', '만족', '살기 좋은', '살기좋은',
    '쾌적', '장점', '호평', '우수', '발달', '풍부', '선호', '대표'
  ];

  const negativeWords = [
    '단점', '불편', '부족', '열악', '아쉬운', '아쉽', '낙후', '한계',
    '어려움', '부담', '문제', '불만', '위험', '취약', '미흡', '낙제', '우려'
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  for (const pw of positiveWords) {
    const matches = trimmed.match(new RegExp(pw, 'g'));
    if (matches) positiveScore += matches.length;
  }

  for (const nw of negativeWords) {
    const matches = trimmed.match(new RegExp(nw, 'g'));
    if (matches) negativeScore += matches.length;
  }

  if (targetKeywords && targetKeywords.length > 0) {
    for (const kw of targetKeywords) {
      if (kw && trimmed.includes(kw)) {
        positiveScore += 1;
      }
    }
  }

  if (positiveScore > negativeScore) {
    return 'mentioned_positive';
  } else if (negativeScore > positiveScore) {
    return 'mentioned_negative';
  } else {
    return 'mentioned_neutral';
  }
}

/**
 * Floor Risk calculator
 * INV-9: Floor Risk mandatory alongside accuracy. Confabulation = critical.
 */
export function calculateFloorRisk(
  verdicts: string[]
): 'critical' | 'high' | 'moderate' | 'low' {
  if (!verdicts || verdicts.length === 0) {
    return 'low';
  }

  // 1. 작화(confabulation) 또는 critical 판정 시 critical
  if (verdicts.some(v => v === 'confabulation' || v === 'critical')) {
    return 'critical';
  }

  // 2. 오답(wrong / inaccurate) 체크: 다수 오답이거나 비율이 높으면 critical, 1건이면 high
  const wrongCount = verdicts.filter(v => v === 'wrong' || v === 'inaccurate').length;
  if (wrongCount >= 2 || (verdicts.length > 0 && wrongCount / verdicts.length >= 0.5)) {
    return 'critical';
  }
  if (wrongCount > 0) {
    return 'high';
  }

  // 3. 미응답/부분/범용/미언급(absent / partial / accurate_generic / not_mentioned)
  const moderateCount = verdicts.filter(
    v =>
      v === 'absent' ||
      v === 'partial' ||
      v === 'accurate_generic' ||
      v === 'not_mentioned' ||
      v === 'mentioned_negative'
  ).length;
  if (moderateCount > 0) {
    return 'moderate';
  }

  return 'low';
}
