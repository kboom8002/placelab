// lib/kbrandlab/questions/issue-classifier.ts
// K-Brand Lab 5종 브랜드 과제 분류기 (FR-04, §5.3)

import { IssueType } from '../types';

export interface IssueClassificationResult {
  primaryIssueType: IssueType;
  secondaryIssueTypes: IssueType[];
  confidence: number;
  rationale: string;
  recommendedAction: string;
  isAutomatedSuggestion: boolean;
}

interface IssuePattern {
  type: IssueType;
  keywords: string[];
  regex: RegExp[];
  action: string;
  weight: number;
}

const ISSUE_PATTERNS: IssuePattern[] = [
  {
    type: 'info_gap',
    keywords: ['어떻게', '방법', '설명', '규격', '용량', '사이즈', '사용법', '어디서', '알려줘', '주의사항', '식세기 가능'],
    regex: [/(?:어떻게|방법|사용법|설명서)/i, /(?:용량|사이즈|크기|무게|치수)/i, /(?:가능한가요|되나요|알려줘)/i],
    action: '상세 페이지·FAQ·비주얼 가이드 개선 (비용 0원~저비용)',
    weight: 1.0,
  },
  {
    type: 'verification_gap',
    keywords: ['진짜', '믿을만한', '인증', '검증', '유해물질', '안전한가', '시험성적서', 'bpa', '보온시간', '정말', '과장', '허위'],
    regex: [/(?:진짜|정말|믿을|인증|공인|시험)/i, /(?:bpa|환경호르몬|중금속|안전성|유해)/i, /(?:광고.*맞아|과장)/i],
    action: '공인 시험 성적서 확인, 공인 자료 대조 및 근거 공개',
    weight: 1.3,
  },
  {
    type: 'purchase_barrier',
    keywords: ['배송', '해외', '직구', '교체 부품', '패킹 구매', '부품만 따로', '부품 구매', '부속품', 'as', '품절', '구매처', '반품비', '교환', '배송비'],
    regex: [/(?:배송|직구|통관|관세)/i, /(?:부품.*구매|패킹.*구매|뚜껑만.*따로|소모품.*구매|리필)/i, /(?:품절|재입고|파는곳)/i, /(?:as|수리|보증기간)/i],
    action: '공식 소모품 판매 채널 개설, 배송/CS 운영 프로세스 개선',
    weight: 1.2,
  },
  {
    type: 'product_unfit',
    keywords: ['샌다', '물샘', '누수', '샜', '샜어요', '헐거움', '헐거워서', '벗겨짐', '코팅', '녹슴', '깨짐', '불량', '결함', '설계 결함', '냄새 안빠짐', '무거워', '뜨거워'],
    regex: [/(?:물새|누수|새어|샜|흘러내림)/i, /(?:코팅.*벗겨|녹이|깨져|부서져)/i, /(?:불량|결함|하자|설계|헐거)/i, /(?:냄새가.*안.*빠)/i],
    action: '제품 금형·실리콘 패킹 설계 개선 또는 신제품 R&D 가설 수립',
    weight: 1.4,
  },
  {
    type: 'new_demand',
    keywords: ['탄산 전용', '대용량 2L', '차량용 컵홀더 맞는', '스트랩 일체형', '온도 표시', '새로운 용도', '이런거 없나', '출시 계획'],
    regex: [/(?:탄산|맥주|스프).*텀블러/i, /(?:온도.*표시|스마트)/i, /(?:이런.*제품.*없나|출시.*계획)/i],
    action: '신규 카테고리 기획 및 라인업 확장 콘셉트 검증',
    weight: 1.1,
  },
];

export class IssueClassifier {
  /**
   * 질문 및 소비자 경험 텍스트를 5대 과제 유형으로 분류
   */
  static classify(text: string): IssueClassificationResult {
    const scores: Record<IssueType, number> = {
      info_gap: 0,
      verification_gap: 0,
      purchase_barrier: 0,
      product_unfit: 0,
      new_demand: 0,
    };

    const matchedKeywords: Record<IssueType, string[]> = {
      info_gap: [],
      verification_gap: [],
      purchase_barrier: [],
      product_unfit: [],
      new_demand: [],
    };

    for (const pattern of ISSUE_PATTERNS) {
      for (const kw of pattern.keywords) {
        if (text.includes(kw)) {
          scores[pattern.type] += 2 * pattern.weight;
          matchedKeywords[pattern.type].push(kw);
        }
      }
      for (const rx of pattern.regex) {
        if (rx.test(text)) {
          scores[pattern.type] += 3 * pattern.weight;
        }
      }
    }

    const sorted = (Object.entries(scores) as [IssueType, number][])
      .sort((a, b) => b[1] - a[1]);

    const topType = sorted[0][0];
    const topScore = sorted[0][1];

    if (topScore === 0) {
      return {
        primaryIssueType: 'info_gap',
        secondaryIssueTypes: [],
        confidence: 0.3,
        rationale: '일치하는 특정 이슈 키워드가 없어 기본 정보 공백(info_gap)으로 분류함',
        recommendedAction: ISSUE_PATTERNS.find(p => p.type === 'info_gap')!.action,
        isAutomatedSuggestion: true,
      };
    }

    const secondary: IssueType[] = [];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i][1] >= topScore * 0.5 && sorted[i][1] > 1) {
        secondary.push(sorted[i][0]);
      }
    }

    const matchedPattern = ISSUE_PATTERNS.find(p => p.type === topType)!;
    const confidence = Math.min(1.0, Math.round((topScore / 8) * 100) / 100);
    const keywordsUsed = matchedKeywords[topType].slice(0, 3).join(', ');

    return {
      primaryIssueType: topType,
      secondaryIssueTypes: secondary,
      confidence,
      rationale: keywordsUsed ? `키워드 [${keywordsUsed}] 감지 기반 자동 제안` : '패턴 매칭 기반 자동 제안',
      recommendedAction: matchedPattern.action,
      isAutomatedSuggestion: true,
    };
  }
}
