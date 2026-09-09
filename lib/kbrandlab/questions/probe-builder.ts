// lib/kbrandlab/questions/probe-builder.ts
// K-Brand Lab 프로브 생성기 및 버전 관리 (FR-09, §8.3, §9.2)

import { ProbeType } from '../types';

export interface ProbeDefinition {
  id?: string;
  probeType: ProbeType;
  targetEntityName: string;
  comparisonEntityNames?: string[];
  promptKo: string;
  promptEn?: string;
  evaluationPurpose: 'development' | 'evaluation';
  sourceQuestionText?: string;
}

export interface ProbeSetSummary {
  version: string;
  title: string;
  isLocked: boolean;
  totalProbes: number;
  byType: Record<ProbeType, number>;
  byPurpose: { development: number; evaluation: number };
  probes: ProbeDefinition[];
}

export class ProbeBuilder {
  /**
   * 소비자 원 질문으로부터 4종 프로브 자동 생성 템플릿 제안
   */
  static generateProbeCandidates(
    brandName: string,
    categoryName: string,
    questionText: string,
    competitors: string[] = ['스탠리', '써모스']
  ): ProbeDefinition[] {
    const probes: ProbeDefinition[] = [];

    // 1. Branded 프로브 (브랜드명 명시)
    probes.push({
      probeType: 'branded',
      targetEntityName: brandName,
      promptKo: `${brandName} ${categoryName} ${questionText}`,
      promptEn: `Tell me about ${brandName} ${categoryName}: ${questionText}`,
      evaluationPurpose: 'development',
      sourceQuestionText: questionText,
    });

    // 2. Open 프로브 (브랜드명 없는 카테고리 탐색/추천 질문, SoV 측정용)
    probes.push({
      probeType: 'open',
      targetEntityName: brandName,
      promptKo: `${categoryName} 중에 ${questionText.replace(brandName, '').trim()} 제품 추천해줘`,
      promptEn: `Which ${categoryName} would you recommend for ${questionText.replace(brandName, '').trim()}?`,
      evaluationPurpose: 'development',
      sourceQuestionText: questionText,
    });

    // 3. H2H 프로브 (경쟁사 1:1 비교 질문)
    if (competitors.length > 0) {
      const comp = competitors[0];
      probes.push({
        probeType: 'h2h',
        targetEntityName: brandName,
        comparisonEntityNames: [comp],
        promptKo: `${brandName}과 ${comp} ${categoryName} 중 어느 쪽이 더 우수해?`,
        promptEn: `Between ${brandName} and ${comp} ${categoryName}, which one is better and why?`,
        evaluationPurpose: 'development',
        sourceQuestionText: questionText,
      });
    }

    // 4. Fact-check 프로브 (평가용 격리 문항, §9.2)
    probes.push({
      probeType: 'fact_check',
      targetEntityName: brandName,
      promptKo: `${brandName} ${categoryName}의 공식 스펙과 정품 확인 기준은?`,
      promptEn: `What are the official specifications and authenticity standards for ${brandName} ${categoryName}?`,
      evaluationPurpose: 'evaluation',
      sourceQuestionText: questionText,
    });

    return probes;
  }

  /**
   * 프로브 세트 유효성 검증 및 요약 (§9.2 과적합 방지: 개발용과 평가용 분리 확인)
   */
  static validateAndSummarize(version: string, title: string, probes: ProbeDefinition[]): ProbeSetSummary {
    const byType: Record<ProbeType, number> = {
      branded: 0,
      open: 0,
      h2h: 0,
      fact_check: 0,
    };
    const byPurpose = { development: 0, evaluation: 0 };

    for (const p of probes) {
      byType[p.probeType]++;
      byPurpose[p.evaluationPurpose]++;
      if (!p.promptKo || p.promptKo.trim().length === 0) {
        throw new Error(`프로브 한국어 프롬프트가 비어 있습니다 (타입: ${p.probeType})`);
      }
    }

    return {
      version,
      title,
      isLocked: false,
      totalProbes: probes.length,
      byType,
      byPurpose,
      probes,
    };
  }
}
