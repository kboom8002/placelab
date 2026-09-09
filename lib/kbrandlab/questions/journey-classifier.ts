// lib/kbrandlab/questions/journey-classifier.ts
// K-Brand Lab 소비자 6단계 구매 여정 분류기 (FR-04, §5.3)

import { JourneyStage } from '../types';

export interface JourneyClassificationResult {
  primaryJourney: JourneyStage;
  secondaryJourneys: JourneyStage[];
  confidence: number;
  rationale: string;
  isAutomatedSuggestion: boolean;
}

interface JourneyPattern {
  stage: JourneyStage;
  keywords: string[];
  regex: RegExp[];
  weight: number;
}

const JOURNEY_PATTERNS: JourneyPattern[] = [
  {
    stage: 'need_discovery',
    keywords: ['있을까', '추천', '어떤게 좋아', '상황', '필요', '출근', '운동할 때', '아이와', '여행용', '입문', '용도'],
    regex: [/어떤.*(?:좋을까|맞을까|있을까)/i, /(?:때|용|상황에서).*추천/i, /필요한데/i],
    weight: 1.0,
  },
  {
    stage: 'category_exploration',
    keywords: ['차이', '차이점', '종류', '구분', '장단점', 'vs', '대신', '어떤 종류', '유형', '재질', '스펙'],
    regex: [/(?:와|과|vs|대비).*차이/i, /어떤.*(?:종류|유형|재질)/i, /(?:보온병|텀블러|머그|용기).*(?:차이|비교)/i],
    weight: 1.1,
  },
  {
    stage: 'brand_comparison',
    keywords: ['비교', '스탠리', '예티', '스타벅스', '써모스', '브랜드', '경쟁', '어느 브랜드', '더 좋아', '우위'],
    regex: [/(?:[A-Za-z가-힣]+)와\s*(?:[A-Za-z가-힣]+).*(?:비교|어느|누가)/i, /브랜드.*추천/i, /경쟁사/i],
    weight: 1.2,
  },
  {
    stage: 'purchase_terms',
    keywords: ['가격', '얼마', '배송', '해외 배송', '관세', '할인', '교체 부품', 'as', '보증', '정품', '파는곳', '구매처', '반품', '환불'],
    regex: [/(?:가격|비용|얼마|할인|쿠폰)/i, /(?:배송|해외배송|직구|통관)/i, /(?:as|A\/S|보증|교체\s*부품|부속|소모품)/i, /(?:반품|환불|취소)/i],
    weight: 1.3,
  },
  {
    stage: 'usage_troubleshooting',
    keywords: ['냄새', '세척', '분리', '세척기', '식세기', '식기세척기', '고장', '물샘', '새는', '녹', '변색', '사용법', '관리', '뜨거운물', '탄산'],
    regex: [/(?:냄새|악취|물때|얼룩|녹|변색)/i, /(?:세척|씻|식기세척기|식세기|소독)/i, /(?:물새|누수|새는|흘러)/i, /(?:사용법|주의사항|관리법)/i],
    weight: 1.4,
  },
  {
    stage: 'repurchase_churn',
    keywords: ['재구매', '다시 살', '다음에도', '후회', '단점', '실망', '내구성', '수명', '오래', '이탈', '바꿀까', '계속 쓸'],
    regex: [/(?:재구매|다시\s*살|계속\s*쓸)/i, /(?:후회|실망|버릴|갈아탈)/i, /(?:내구성|수명|얼마나\s*오래)/i],
    weight: 1.2,
  },
];

export class JourneyClassifier {
  /**
   * 소비자 질문 텍스트를 분석하여 주 여정 1개와 보조 여정을 도출
   */
  static classify(text: string): JourneyClassificationResult {
    const scores: Record<JourneyStage, number> = {
      need_discovery: 0,
      category_exploration: 0,
      brand_comparison: 0,
      purchase_terms: 0,
      usage_troubleshooting: 0,
      repurchase_churn: 0,
    };

    const matchedKeywords: Record<JourneyStage, string[]> = {
      need_discovery: [],
      category_exploration: [],
      brand_comparison: [],
      purchase_terms: [],
      usage_troubleshooting: [],
      repurchase_churn: [],
    };

    for (const pattern of JOURNEY_PATTERNS) {
      for (const kw of pattern.keywords) {
        if (text.includes(kw)) {
          scores[pattern.stage] += 2 * pattern.weight;
          matchedKeywords[pattern.stage].push(kw);
        }
      }
      for (const rx of pattern.regex) {
        if (rx.test(text)) {
          scores[pattern.stage] += 3 * pattern.weight;
        }
      }
    }

    // 최고 점수 순 정렬
    const sorted = (Object.entries(scores) as [JourneyStage, number][])
      .sort((a, b) => b[1] - a[1]);

    const topStage = sorted[0][0];
    const topScore = sorted[0][1];

    // 점수가 모두 0이면 기본적으로 need_discovery로 분류
    if (topScore === 0) {
      return {
        primaryJourney: 'need_discovery',
        secondaryJourneys: [],
        confidence: 0.3,
        rationale: '일치하는 특정 키워드가 없어 기본 탐색(need_discovery)으로 분류함',
        isAutomatedSuggestion: true,
      };
    }

    // 2순위 중 유의미한 점수(최고점의 50% 이상)를 보조 여정으로 추출
    const secondary: JourneyStage[] = [];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i][1] >= topScore * 0.5 && sorted[i][1] > 1) {
        secondary.push(sorted[i][0]);
      }
    }

    const confidence = Math.min(1.0, Math.round((topScore / 8) * 100) / 100);
    const keywordsUsed = matchedKeywords[topStage].slice(0, 3).join(', ');

    return {
      primaryJourney: topStage,
      secondaryJourneys: secondary,
      confidence,
      rationale: keywordsUsed ? `주요 키워드 [${keywordsUsed}] 감지 기반 자동 제안` : '패턴 매칭 기반 자동 제안',
      isAutomatedSuggestion: true,
    };
  }
}
