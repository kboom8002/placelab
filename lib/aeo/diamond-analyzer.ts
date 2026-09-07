import type { InsightBundle, DiamondAnalysis, Signal, StrategicAction, RoadmapItem } from './types/vip-report';
import type { VIPDashboard } from './types/vip-report';

export function analyzeDiamond(
  insights: InsightBundle,
  dashboard: VIPDashboard,
  unitName: string
): DiamondAnalysis {
  const strengths: Signal[] = [];
  const weaknesses: Signal[] = [];
  const opportunities: Signal[] = [];
  const threats: Signal[] = [];

  const defenseAreas: StrategicAction[] = [];
  const opportunityAreas: StrategicAction[] = [];

  const immediate: RoadmapItem[] = [];
  const oneMonth: RoadmapItem[] = [];
  const threeMonths: RoadmapItem[] = [];

  // --- 강점(Strengths) ---
  if (insights.associationTest.stableWords.length >= 2) {
    strengths.push({
      id: 'S-ASSOC',
      description: '명확한 도시 브랜드 연상(Association)',
      evidence: `연관어 테스트에서 ${insights.associationTest.stableWords.length}개의 키워드가 안정적으로 등장함`,
      impact: 'high'
    });
  }

  insights.t3MentionByType.forEach(t3 => {
    if (t3.rate > 0.8) {
      strengths.push({
        id: `S-T3-${t3.type}`,
        description: `높은 ${t3.type} 맥락 인지도`,
        evidence: `추천/언급 비율이 ${Math.round(t3.rate * 100)}%에 달함`,
        impact: 'high'
      });
    }
  });

  if (dashboard.t1StableCount > 10) {
    strengths.push({
      id: 'S-T1-STABLE',
      description: '기본 정보의 높은 안정성',
      evidence: `T1 문항 중 ${dashboard.t1StableCount}개가 안정적으로 응답됨`,
      impact: 'medium'
    });
  }

  if (insights.urlAnalysis.withUrlCount > 0 && 
      (insights.urlAnalysis.ownDomainCount / insights.urlAnalysis.withUrlCount) > 0.5) {
    strengths.push({
      id: 'S-URL',
      description: '공식 채널 출처 비중이 높음',
      evidence: `총 인용 URL 중 공식 도메인 비중 50% 초과`,
      impact: 'medium'
    });
  }

  // --- 약점(Weaknesses) & 방어 영역(Defense Areas) ---
  insights.stabilityAnalysis.forEach((item, idx) => {
    if (item.status === 'absent') {
      weaknesses.push({
        id: `W-T1-ABSENT-${item.questionId}`,
        description: `필수 정보 부재: ${item.category}`,
        evidence: `T1 문항 "${item.question}"에서 정보가 전혀 출력되지 않음`,
        impact: 'high'
      });

      defenseAreas.push({
        rank: defenseAreas.length + 1,
        area: item.category,
        currentState: '정보 부재 (Absent)',
        evidence: item.questionId,
        action: 'FAQ 신설',
        cost: '0원',
        timeline: '즉시',
        expectedEffect: 'AI 응답 내 기초 정보 포함'
      });

      immediate.push({
        action: `FAQ 신설 (${item.category})`,
        detail: `문항 "${item.question}" 대응 콘텐츠 추가`,
        cost: '0원'
      });
    } else if (item.status === 'unstable') {
      weaknesses.push({
        id: `W-T1-UNSTABLE-${item.questionId}`,
        description: `응답 불안정성: ${item.category}`,
        evidence: `T1 문항 "${item.question}"에 대한 응답이 매번 다름 (할루시네이션 위험)`,
        impact: 'medium'
      });

      defenseAreas.push({
        rank: defenseAreas.length + 1,
        area: item.category,
        currentState: '정보 불안정 (Unstable)',
        evidence: item.questionId,
        action: 'FAQ 보강',
        cost: '내부 리소스',
        timeline: '1개월',
        expectedEffect: '일관성 확보'
      });
    }
  });

  insights.categoryInsights.forEach(cat => {
    if (cat.relevantCount === 0 && cat.totalQuestions > 0) {
      weaknesses.push({
        id: `W-T2-ZERO-${cat.category}`,
        description: `세부 맥락 이해도 부족 (${cat.category})`,
        evidence: '해당 카테고리에서 정확도(relevant)가 0%임',
        impact: 'high'
      });
    }
  });

  const recommendationMention = insights.t3MentionByType.find(t => t.type === 'recommendation');
  if (recommendationMention && recommendationMention.rate === 0) {
    weaknesses.push({
      id: 'W-T3-REC-ZERO',
      description: 'AI 추천 목록 내 진입 실패',
      evidence: '추천형 질의(T3)에서 한 번도 언급되지 않음',
      impact: 'high'
    });

    opportunityAreas.push({
      rank: opportunityAreas.length + 1,
      area: '추천 진입',
      currentState: '추천 빈도 0%',
      evidence: 'T3 Recommendation',
      action: 'AI 추천 목록 진입을 위한 통합 소개 페이지 개설',
      cost: '웹사이트 수정 필요',
      timeline: '1개월',
      expectedEffect: 'LLM 문맥에 지자체 추천 맥락 강화'
    });
  }

  // --- 기회(Opportunities) & 기회 영역(Opportunity Areas) ---
  insights.categoryInsights.forEach(cat => {
    if (cat.relevantCount > 0 && cat.genericCount > 0) {
      opportunities.push({
        id: `O-T2-PARTIAL-${cat.category}`,
        description: `부분적 이해도 활용 (${cat.category})`,
        evidence: '범용적(generic) 응답을 상세(relevant) 응답으로 전환 가능성 높음',
        impact: 'medium'
      });

      opportunityAreas.push({
        rank: opportunityAreas.length + 1,
        area: cat.category,
        currentState: '범용적 안내 수준',
        evidence: `Category: ${cat.category}`,
        action: 'JSON-LD 구조화 데이터 삽입',
        cost: '0원 ~ 소액',
        timeline: '즉시',
        expectedEffect: '구체적 사실(Fact)의 검색 노출 및 AI 인용률 상승'
      });

      immediate.push({
        action: `JSON-LD 구조화 데이터 삽입 (${cat.category})`,
        detail: '기존 페이지에 메타데이터 보강',
        cost: '0원'
      });
    }
  });

  const keywordEntry = insights.t3MentionByType.find(t => t.type === 'keyword_entry');
  if (keywordEntry && keywordEntry.rate > 0 && keywordEntry.rate < 1) {
    opportunities.push({
      id: 'O-T3-KEYWORD',
      description: '키워드 연상성 확대',
      evidence: '키워드 진입(T3) 비율이 상승 여력이 있음',
      impact: 'medium'
    });
  }

  if (insights.associationTest.unstableWords.length > 0) {
    opportunities.push({
      id: 'O-ASSOC-UNSTABLE',
      description: '잠재적 연관어 발굴',
      evidence: `불안정하게 노출되는 단어(${insights.associationTest.unstableWords[0]} 등)를 제3의 키워드로 육성 가능`,
      impact: 'low'
    });

    opportunityAreas.push({
      rank: opportunityAreas.length + 1,
      area: '브랜드 연상',
      currentState: '일부 키워드 불안정',
      evidence: `불안정 키워드: ${insights.associationTest.unstableWords.slice(0, 2).join(', ')}`,
      action: '3번째 키워드 콘텐츠 전략',
      cost: '콘텐츠 마케팅 비용',
      timeline: '3개월',
      expectedEffect: '신규 키워드 선점 및 AI 연관성 강화'
    });

    threeMonths.push({
      action: '신규 키워드 전략 실행',
      detail: `${insights.associationTest.unstableWords.slice(0, 2).join(', ')} 중심의 콘텐츠 발행`,
      cost: '마케팅 비용 편성 필요'
    });
  }

  // 방어 영역 추가 보충 (안정적인 키워드)
  if (insights.associationTest.stableWords.length > 0) {
    defenseAreas.push({
      rank: defenseAreas.length + 1,
      area: '핵심 브랜드',
      currentState: '높은 인지도 유지 중',
      evidence: '안정적 키워드 도출',
      action: '현 상태 유지 (모니터링)',
      cost: '0원',
      timeline: '즉시',
      expectedEffect: '현상 유지'
    });
  }

  // 추가 로드맵 항목 정리
  oneMonth.push({
    action: '범용 카테고리 페이지 개편',
    detail: 'AI가 자주 언급하는 범용 답변 영역 구체화',
    cost: '웹 운영 리소스'
  });

  return {
    signals: {
      strengths,
      weaknesses,
      opportunities,
      threats
    },
    defenseAreas,
    opportunityAreas,
    roadmap: {
      immediate,
      oneMonth,
      threeMonths
    }
  };
}
