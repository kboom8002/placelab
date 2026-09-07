import type { ScoredResult, InsightBundle, AssociationTestResult, RecommendationGap, CategoryInsight, StabilityItem, UrlAnalysis } from './types/vip-report';
import type { Tier2Category, Tier3QuestionType } from '../types/source-analysis';

export function extractInsights(
  results: ScoredResult[],
  unitName: string,
  tier2Questions?: { id: string; body: string; groundTruth?: string; category?: string }[],
  tier3Questions?: { id: string; body: string; type?: string; targetKeywords?: string[] }[]
): InsightBundle {
  // 기본 데이터 구조 초기화
  const associationTest: AssociationTestResult = { responses: [], stableWords: [], unstableWords: [] };
  const recommendationGaps: RecommendationGap[] = [];
  const categoryInsights: CategoryInsight[] = [];
  const stabilityAnalysis: StabilityItem[] = [];
  const urlAnalysis: UrlAnalysis = { totalResults: results.length, withUrlCount: 0, publicUrlCount: 0, ownDomainCount: 0, topDomains: [] };
  const t3MentionByType: { type: Tier3QuestionType; mentioned: number; total: number; rate: number }[] = [];

  const safeResults = results || [];

  // 1. associationTest: V-B1 분석
  const assocResults = safeResults.filter(r => r.tier === 'T3' && r.questionId === 'V-B1');
  const wordFrequency: Record<string, number> = {};

  assocResults.forEach((r, idx) => {
    const rawText = r.response || r.responseExcerpt || '';
    // V-B1 응답 형식 예:
    //   "1. 수원화성  "
    //   "1. **수원화성** – 정조 시대에 축조된 세계문화유산"
    //   "1. 유네스코 세계문화유산 **수원화성**"
    const words = rawText
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        // 번호로 시작하는 행만 처리
        if (!/^\s*[\d\.\-\)]+/.test(trimmed)) return '';

        // 볼드(**...**)가 있으면 그것만 추출
        const boldMatch = trimmed.match(/\*\*([^*]+)\*\*/);
        if (boldMatch) {
          return boldMatch[1].trim();
        }

        // 볼드 없으면 번호 제거 후 전체 사용
        let content = trimmed.replace(/^\s*[\d\.\-\)]+\s*/, '');
        content = content.replace(/\s*[–—].+$/, '');
        content = content.trim();
        return content;
      })
      .filter(w => w.length > 0 && w.length < 40);

    associationTest.responses.push({
      rep: r.rep || idx + 1,
      rawText: rawText.replace(/\n/g, ' ').substring(0, 200),
      words
    });

    words.forEach(w => {
      wordFrequency[w] = (wordFrequency[w] || 0) + 1;
    });
  });

  // 안정/불안정 키워드 분류 — 부분 매칭 사용
  // "수원화성"과 "수원 화성"을 같은 키워드로 취급
  const assocTotalReps = assocResults.length || 3;
  const allWords = Object.keys(wordFrequency);

  // 먼저 정확 매칭으로 안정 키워드 찾기
  for (const [word, count] of Object.entries(wordFrequency)) {
    if (count >= assocTotalReps) {
      associationTest.stableWords.push(word);
    }
  }

  // 정확 매칭 결과가 없으면 부분 매칭 시도
  if (associationTest.stableWords.length === 0 && associationTest.responses.length >= 2) {
    // 각 rep의 words에서 공통 핵심어 추출
    const repsWords = associationTest.responses.map(r => r.words);
    if (repsWords.length >= 2) {
      const firstWords = repsWords[0];
      for (const w of firstWords) {
        const normalizedW = w.replace(/\s/g, '');
        const appearsInAll = repsWords.every(rw =>
          rw.some(ow => {
            const normalizedOw = ow.replace(/\s/g, '');
            return normalizedOw.includes(normalizedW) || normalizedW.includes(normalizedOw);
          })
        );
        if (appearsInAll) {
          associationTest.stableWords.push(w);
        }
      }
    }
  }

  // 불안정 키워드: stableWords에 없는 것
  for (const [word] of Object.entries(wordFrequency)) {
    if (!associationTest.stableWords.some(sw =>
      sw.replace(/\s/g, '').includes(word.replace(/\s/g, '')) ||
      word.replace(/\s/g, '').includes(sw.replace(/\s/g, ''))
    )) {
      associationTest.unstableWords.push(word);
    }
  }

  // 2. recommendationGaps & 6. t3MentionByType
  const t3Results = safeResults.filter(r => r.tier === 'T3');
  const typeCounts: Record<string, { mentioned: number; total: number }> = {};

  t3Results.forEach(r => {
    const qId = r.questionId;
    const qInfo = tier3Questions?.find(q => q.id === qId);
    const type = (r.category || qInfo?.type || 'unknown') as Tier3QuestionType;

    // Type counts
    if (!typeCounts[type]) typeCounts[type] = { mentioned: 0, total: 0 };
    typeCounts[type].total++;
    if (r.targetMentioned || ['mentioned_positive', 'mentioned_neutral', 'mentioned_negative'].includes(r.verdict)) {
      typeCounts[type].mentioned++;
    }

    // Recommendation Gaps
    if ((type === 'recommendation' || type === 'scenario') && !r.targetMentioned) {
      recommendationGaps.push({
        questionId: qId,
        questionText: qInfo?.body || (r as any).question || '',
        questionType: type,
        aiRecommended: (r.responseExcerpt || r.response || '').substring(0, 100),
        targetMissing: true,
        whyShouldBeIncluded: 'AI 추천 목록 진입 필요' // 기본값, 필요시 개선
      });
    }
  });

  Object.entries(typeCounts).forEach(([type, counts]) => {
    t3MentionByType.push({
      type: type as Tier3QuestionType,
      mentioned: counts.mentioned,
      total: counts.total,
      rate: counts.total > 0 ? counts.mentioned / counts.total : 0
    });
  });

  // 3. categoryInsights (Tier 2)
  const t2Results = safeResults.filter(r => r.tier === 'T2');
  const catGroups: Record<string, ScoredResult[]> = {};

  t2Results.forEach(r => {
    const qInfo = tier2Questions?.find(q => q.id === r.questionId);
    const cat = r.category || qInfo?.category || 'unknown';
    if (!catGroups[cat]) catGroups[cat] = [];
    catGroups[cat].push(r);
  });

  Object.entries(catGroups).forEach(([cat, resList]) => {
    const insight: CategoryInsight = {
      category: cat as Tier2Category,
      totalQuestions: resList.length,
      relevantCount: 0,
      genericCount: 0,
      absentCount: 0,
      strongQuestions: [],
      weakQuestions: []
    };

    const qScores: Record<string, { total: number; accurate: number; verdicts: string[] }> = {};

    resList.forEach(r => {
      if (r.verdict === 'accurate_relevant') insight.relevantCount++;
      else if (r.verdict === 'accurate_generic') insight.genericCount++;
      else if (r.verdict === 'absent') insight.absentCount++;

      if (!qScores[r.questionId]) qScores[r.questionId] = { total: 0, accurate: 0, verdicts: [] };
      qScores[r.questionId].total++;
      if (r.verdict === 'accurate_relevant' || r.verdict === 'accurate_generic') {
        qScores[r.questionId].accurate++;
      }
      qScores[r.questionId].verdicts.push(r.verdict);
    });

    Object.entries(qScores).forEach(([qId, scores]) => {
      const matchRate = scores.accurate / scores.total;
      if (matchRate > 0.5) {
        insight.strongQuestions.push({ id: qId, matchRate });
      } else {
        insight.weakQuestions.push({ id: qId, verdict: scores.verdicts[0] || 'unknown' });
      }
    });

    insight.sampleResponse = resList[0]?.responseExcerpt;
    categoryInsights.push(insight);
  });

  // 4. stabilityAnalysis (Tier 1)
  const t1Results = safeResults.filter(r => r.tier === 'T1');
  const t1QGroups: Record<string, ScoredResult[]> = {};

  t1Results.forEach(r => {
    if (!t1QGroups[r.questionId]) t1QGroups[r.questionId] = [];
    t1QGroups[r.questionId].push(r);
  });

  Object.entries(t1QGroups).forEach(([qId, reps]) => {
    const qText = reps[0]?.question || (reps[0] as any)?.query || '';
    const category = reps[0]?.category || 'unknown';
    const repData = reps.map((r, i) => ({ rep: r.rep || i + 1, verdict: r.verdict }));
    
    let stableCount = 0;
    let absentCount = 0;
    
    repData.forEach(r => {
      if (r.verdict === 'accurate' || r.verdict === 'accurate_relevant' || r.verdict === 'accurate_generic') {
        stableCount++;
      } else if (r.verdict === 'absent') {
        absentCount++;
      }
    });

    const totalReps = reps.length;
    let status: 'stable' | 'unstable' | 'absent' = 'unstable';
    if (stableCount === totalReps && totalReps > 0) status = 'stable';
    else if (absentCount === totalReps && totalReps > 0) status = 'absent';

    stabilityAnalysis.push({
      questionId: qId,
      category,
      question: qText,
      stableCount,
      status,
      reps: repData
    });
  });

  // 5. urlAnalysis
  const domains: Record<string, number> = {};
  safeResults.forEach(r => {
    // any로 타입 우회 (citedUrls가 MeasureResult에 있을 수 있음)
    const urls = (r as any).citedUrls || [];
    if (urls && urls.length > 0) {
      urlAnalysis.withUrlCount++;
      urls.forEach((url: string) => {
        try {
          const urlObj = new URL(url);
          const hostname = urlObj.hostname;
          domains[hostname] = (domains[hostname] || 0) + 1;
          
          if (hostname.endsWith('.go.kr') || hostname.endsWith('.or.kr')) {
            urlAnalysis.publicUrlCount++;
          }
          // 단순 도메인 체크 (예: suwon.go.kr)
          const shortUnit = unitName.replace(/(특별시|광역시|특별자치시|특별자치도|특례시|시|군|구)$/, '');
          if (hostname.includes(shortUnit) || (unitName === '증평군' && hostname.includes('jp.go.kr'))) {
            urlAnalysis.ownDomainCount++;
          }
        } catch (e) {
          // URL 파싱 실패 시 무시
        }
      });
    }
  });

  urlAnalysis.topDomains = Object.entries(domains)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain, count]) => ({ domain, count }));

  return {
    associationTest,
    recommendationGaps,
    categoryInsights,
    stabilityAnalysis,
    urlAnalysis,
    t3MentionByType
  };
}
