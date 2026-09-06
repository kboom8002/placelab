// lib/aeo/sov-analyzer.ts
// Share of Voice (SoV) 및 Tier 3 홍보력 분석기
// 출처: ADR-0011, K04 v2.1

import type { MeasureResult } from './measure-engine';
import type { ShareOfVoice, Tier3Verdict } from '../types/source-analysis';

// 한국 시·군 목록 (대표 지자체 및 주요 도시)
const KOREAN_CITIES = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '수원', '용인', '성남', '부천', '화성', '안산', '안양', '평택', '시흥', '김포', '파주', '의정부',
  '광명', '하남', '군포', '오산', '이천', '양주', '구리', '안성', '포천', '의왕', '양평', '여주',
  '동두천', '가평', '과천', '연천',
  '춘천', '원주', '강릉', '속초', '동해', '삼척', '태백', '홍천', '횡성', '영월', '평창', '정선',
  '철원', '화천', '양구', '인제', '고성', '양양',
  '청주', '충주', '제천', '보은', '옥천', '영동', '증평', '진천', '괴산', '음성', '단양',
  '천안', '아산', '서산', '당진', '공주', '논산', '보령', '계룡', '홍성', '예산', '부여', '서천',
  '청양', '태안', '금산',
  '전주', '익산', '군산', '정읍', '남원', '김제', '완주', '고창', '부안', '임실', '순창', '진안',
  '무주', '장수',
  '여수', '순천', '목포', '나주', '광양', '무안', '해남', '고흥', '화순', '영암', '영광', '완도',
  '담양', '장성', '보성', '신안', '장흥', '강진', '함평', '진도', '곡성', '구례',
  '포항', '구미', '경주', '경산', '안동', '김천', '영주', '상주', '영천', '문경', '칠곡', '의성',
  '울진', '영덕', '청도', '성주', '예천', '봉화', '고령', '군위', '청송', '영양', '울릉',
  '창원', '김해', '양산', '진주', '거제', '통영', '사천', '밀양', '함안', '창녕', '거창', '고성',
  '하동', '합천', '남해', '함양', '산청', '의령',
  '제주', '서귀포'
];

/**
 * 지자체명의 검색용 별칭 목록 생성
 * 예: "증평군" -> ["증평군", "증평"]
 * 예: "수원특례시" -> ["수원특례시", "수원시", "수원"]
 */
export function getUnitAliases(unitName: string): string[] {
  if (!unitName) return [];
  const trimmed = unitName.trim();
  const aliases = new Set<string>();
  aliases.add(trimmed);

  const base = trimmed.replace(/(특별시|광역시|특별자치시|특별자치도|특례시|시|군|구)$/, '');
  if (base && base.length >= 2) {
    aliases.add(base);
    aliases.add(`${base}시`);
    aliases.add(`${base}군`);
    aliases.add(`${base}구`);
  }

  return Array.from(aliases);
}

/**
 * 텍스트에서 도시명이 언급되었는지 확인하는 정규식 생성
 */
function createMentionRegex(aliases: string[]): RegExp {
  const escaped = aliases
    .sort((a, b) => b.length - a.length)
    .map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(?:^|[^가-힣])(${escaped.join('|')})(?:$|[^가-힣])`, 'g');
}

/**
 * 단순 키워드 기반 감성 문맥 판정
 * 긍정/부정 키워드의 출현 빈도를 비교하여 결정
 */
export function determineSentiment(
  response: string,
  targetUnit: string
): 'positive' | 'neutral' | 'negative' {
  if (!response) return 'neutral';

  const positiveKeywords = [
    '추천', '좋은', '좋습', '유명', '아름다운', '아름답', '편리', '훌륭',
    '인기', '매력', '활성화', '적합', '안성맞춤', '만족', '살기 좋은', '살기좋은',
    '쾌적', '장점', '호평', '우수', '발달', '풍부', '선호'
  ];

  const negativeKeywords = [
    '단점', '불편', '부족', '열악', '아쉬운', '아쉽', '낙후', '한계',
    '어려움', '부담', '문제', '불만', '위험', '취약', '미흡', '낙제', '우려'
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  // 전체 응답 텍스트 또는 타겟 지자체 주변 문맥에서 탐색
  for (const kw of positiveKeywords) {
    const matches = response.match(new RegExp(kw, 'g'));
    if (matches) {
      positiveScore += matches.length;
    }
  }

  for (const kw of negativeKeywords) {
    const matches = response.match(new RegExp(kw, 'g'));
    if (matches) {
      negativeScore += matches.length;
    }
  }

  if (positiveScore > negativeScore) {
    return 'positive';
  } else if (negativeScore > positiveScore) {
    return 'negative';
  }

  return 'neutral';
}

/**
 * 응답 텍스트에서 언급된 한국 도시 목록 추출
 */
export function extractCityMentions(response: string): string[] {
  if (!response) return [];

  const found = new Set<string>();

  for (const city of KOREAN_CITIES) {
    // 2자 이상 도시명에 대해 독립 단어 또는 시/군/구 접미사 형태 검색
    const regex = new RegExp(`(?:^|[^가-힣])(${city}(?:시|군)?)(?:$|[^가-힣])`, 'g');
    if (regex.test(response)) {
      found.add(city);
    }
  }

  return Array.from(found);
}

/**
 * 단일 Tier 3 응답 평가 (언급 여부, 빈도, 판정)
 */
export function scoreTier3Response(
  response: string,
  targetUnit: string,
  targetKeywords: string[] = []
): { verdict: Tier3Verdict; mentionCount: number } {
  if (!response || response.trim().length === 0) {
    return { verdict: 'not_mentioned', mentionCount: 0 };
  }

  const aliases = getUnitAliases(targetUnit);
  let mentionCount = 0;

  // 타겟 지자체명 언급 횟수 세기
  for (const alias of aliases) {
    const regex = new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = response.match(regex);
    if (matches) {
      mentionCount += matches.length;
    }
  }

  // 타겟 지자체가 언급된 경우
  if (mentionCount > 0) {
    const sentiment = determineSentiment(response, targetUnit);
    let verdict: Tier3Verdict;
    if (sentiment === 'positive') {
      verdict = 'mentioned_positive';
    } else if (sentiment === 'negative') {
      verdict = 'mentioned_negative';
    } else {
      verdict = 'mentioned_neutral';
    }
    return { verdict, mentionCount };
  }

  // 타겟 지자체가 직접 언급되지 않았지만 고유 키워드가 강력히 언급된 경우 체크
  // (기본적으로는 지자체 미언급으로 판정)
  return { verdict: 'not_mentioned', mentionCount: 0 };
}

/**
 * Tier 3 전체 결과에 대한 Share of Voice (SoV) 집계 및 분석
 */
export function analyzeSoV(
  results: MeasureResult[],
  targetUnit: string,
  targetKeywords: string[] = [],
  competitorUnits: string[] = []
): ShareOfVoice {
  const totalResponses = results.length;

  if (totalResponses === 0) {
    return {
      target_unit: targetUnit,
      target_mentions: 0,
      total_responses: 0,
      sov_rate: 0,
      context_breakdown: {
        positive: 0,
        neutral: 0,
        negative: 0,
      },
      competitor_sov: competitorUnits.map(unit => ({
        unit_name: unit,
        mentions: 0,
        sov_rate: 0,
      })),
    };
  }

  const contextBreakdown = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  let targetMentionedResponses = 0;

  // 타겟 지자체 평가
  for (const r of results) {
    const { verdict } = scoreTier3Response(r.response, targetUnit, targetKeywords);

    if (verdict === 'mentioned_positive') {
      contextBreakdown.positive++;
      targetMentionedResponses++;
    } else if (verdict === 'mentioned_neutral') {
      contextBreakdown.neutral++;
      targetMentionedResponses++;
    } else if (verdict === 'mentioned_negative') {
      contextBreakdown.negative++;
      targetMentionedResponses++;
    }
  }

  const targetSovRate = totalResponses > 0 ? Number((targetMentionedResponses / totalResponses).toFixed(4)) : 0;

  // 경쟁 지자체 언급 집계
  const competitorSov = competitorUnits.map(comp => {
    const compAliases = getUnitAliases(comp);
    let compMentionedResponses = 0;

    for (const r of results) {
      const isMentioned = compAliases.some(alias => {
        const regex = new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        return regex.test(r.response);
      });

      if (isMentioned) {
        compMentionedResponses++;
      }
    }

    const sovRate = totalResponses > 0 ? Number((compMentionedResponses / totalResponses).toFixed(4)) : 0;

    return {
      unit_name: comp,
      mentions: compMentionedResponses,
      sov_rate: sovRate,
    };
  });

  // 경쟁사 높은 순 정렬
  competitorSov.sort((a, b) => b.mentions - a.mentions);

  return {
    target_unit: targetUnit,
    target_mentions: targetMentionedResponses,
    total_responses: totalResponses,
    sov_rate: targetSovRate,
    context_breakdown: contextBreakdown,
    competitor_sov: competitorSov,
  };
}
