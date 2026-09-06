// lib/aeo/generate-tier2.ts
// AI를 활용한 Tier 2 지자체 고유 질문 후보 자동 생성 엔진
// 출처: K04 v2.1, AGENTS.md

import OpenAI from 'openai';
import type { CrawlResult } from './crawl-unit';

export interface QuestionCandidate {
  category: string; // one of 7 categories
  body: string;
  groundTruthCandidate: string;
  sourceUrl?: string;
}

const TIER2_CATEGORIES = [
  { key: 'specialty_industry', name: '특산·산업', desc: '지역 대표 특산물, 주력 산업, 특화 클러스터, 기업 생태계' },
  { key: 'landmark', name: '고유 시설·랜드마크', desc: '지자체 독점 복합문화시설, 대표 공원, 특수 스포츠 시설, 공공 건축물' },
  { key: 'local_policy', name: '독자 정책·조례', desc: '전국 최초이거나 해당 지자체만의 차별화된 조례, 특화 청년/복지/출산 혜택' },
  { key: 'heritage', name: '역사·문화재', desc: '지역 지정 문화재, 역사적 사건, 향토사, 위인, 설화' },
  { key: 'geography', name: '지리·생활권', desc: '행정구역 경계, 하천/산지, 주요 생활권, 대중교통 거점 및 특성' },
  { key: 'local_food', name: '로컬 음식·명소', desc: '지역 대표 먹거리, 특화 음식 거리, 현지인 추천 명소' },
  { key: 'recent_issue', name: '최근 이슈·사업', desc: '최근 진행 중인 대형 공공사업, 신규 정책 추진 현황, 미래 비전' },
] as const;

/**
 * 크롤링된 코퍼스로부터 컨텍스트 요약본 생성 (최대 ~3000 토큰 / 약 8000자)
 */
function buildCorpusContext(corpus: CrawlResult[], maxChars = 8000): string {
  if (!corpus || corpus.length === 0) {
    return '수집된 웹사이트 코퍼스가 없습니다. 지자체에 대한 기본 지식을 바탕으로 생성하세요.';
  }

  let text = '';
  for (let i = 0; i < corpus.length; i++) {
    const item = corpus[i];
    const ogDesc = item.ogTags['description'] ? ` (설명: ${item.ogTags['description']})` : '';
    const chunk = `[문서 ${i + 1}] 제목: ${item.title || '무제'}${ogDesc}\nURL: ${item.url}\n본문 요약: ${item.contentSummary}\n\n`;
    if (text.length + chunk.length > maxChars) {
      break;
    }
    text += chunk;
  }
  return text;
}

/**
 * generateTier2Candidates: gpt-5.6-luna를 호출하여 7개 카테고리별 질문 후보 생성
 * - max_completion_tokens: 4000 사용 (max_tokens 사용 금지)
 * - temperature 파라미터 제외 (gpt-5.6-luna 미지원)
 */
export async function generateTier2Candidates(
  unitName: string,
  unitId: string,
  corpus: CrawlResult[],
  targetCount = 50
): Promise<QuestionCandidate[]> {
  const corpusContext = buildCorpusContext(corpus);
  const questionsPerCategory = Math.ceil(targetCount / 7);

  const systemPrompt = `당신은 대한민국 지방자치단체 AEO(AI Engine Optimization) 전문 평가 연구원입니다.
지자체 웹사이트에서 수집된 공식 정보 코퍼스를 바탕으로, 해당 지자체(${unitName})만의 'Tier 2 고유 정보(Local Knowledge)' 질문 후보를 생성해야 합니다.

[7개 평가 카테고리]
1. specialty_industry (특산·산업)
2. landmark (고유 시설·랜드마크)
3. local_policy (독자 정책·조례)
4. heritage (역사·문화재)
5. geography (지리·생활권)
6. local_food (로컬 음식·명소)
7. recent_issue (최근 이슈·사업)

[작성 지침]
- 각 카테고리당 약 ${questionsPerCategory}개씩, 총 약 ${targetCount}개의 질문 후보를 생성하세요.
- 각 질문(body)은 실제 시민이나 관광객이 생성형 AI에 물어볼 법한 자연스러운 대화체 한국어로 작성하세요.
- 질문 본문에는 지자체명('${unitName}')이 명시적으로 포함되어야 합니다.
- 각 질문마다 객관적으로 검증 가능한 '정답 후보(groundTruthCandidate)'를 명확하고 구체적인 수치/명칭/사실을 포함하여 작성하세요.
- 코퍼스 내에 관련 정보가 있다면 해당 sourceUrl을 지정하고, 없다면 해당 지자체 공식 웹사이트 기준의 대표 URL을 기록하세요.
- 일반적인 행정 절차(전국 공통 민원)는 제외하고, 오직 ${unitName}만의 고유한 정보를 타겟팅해야 합니다.

[응답 포맷]
반드시 다음 JSON 규격으로만 응답하세요:
{
  "candidates": [
    {
      "category": "specialty_industry",
      "body": "${unitName} 대표 특산물이나 주력 육성 산업이 뭐야?",
      "groundTruthCandidate": "구체적인 사실 및 정답 내용",
      "sourceUrl": "https://..."
    }
  ]
}`;

  const userPrompt = `대상 지자체: ${unitName} (ID: ${unitId})
목표 문항 수: ${targetCount}개 (카테고리당 약 ${questionsPerCategory}개)

[공식 웹사이트 수집 코퍼스 요약]
${corpusContext}

위 자료를 분석하여 7개 카테고리별 고유 정보 질문 후보를 JSON 객체로 반환해주세요.`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[generateTier2Candidates] OPENAI_API_KEY가 없어 fallback 질문 후보를 생성합니다.');
    return generateFallbackCandidates(unitName, unitId, corpus);
  }

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: 'gpt-5.6-luna',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 4000,
      // 주의: gpt-5.6-luna는 temperature 파라미터를 지원하지 않음
    });

    const content = response.choices[0]?.message?.content || '{}';
    // 마크다운 코드 블록 제거 후 파싱
    const cleanJson = content.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (Array.isArray(parsed.candidates)) {
      return parsed.candidates.map((c: any) => ({
        category: validateCategory(c.category),
        body: String(c.body || '').trim(),
        groundTruthCandidate: String(c.groundTruthCandidate || c.ground_truth_candidate || '').trim(),
        sourceUrl: c.sourceUrl || c.source_url || (corpus[0]?.url ?? undefined),
      }));
    }

    return generateFallbackCandidates(unitName, unitId, corpus);
  } catch (err: any) {
    console.error(`[generateTier2Candidates] OpenAI API 호출 실패: ${err.message}`);
    return generateFallbackCandidates(unitName, unitId, corpus);
  }
}

/**
 * 유효한 카테고리인지 검증
 */
function validateCategory(cat: string): string {
  const validKeys = TIER2_CATEGORIES.map((c) => c.key);
  if (validKeys.includes(cat as any)) {
    return cat;
  }
  return 'specialty_industry';
}

/**
 * API 미설정 또는 실패 시 기본 후보 세트 생성
 */
function generateFallbackCandidates(
  unitName: string,
  unitId: string,
  corpus: CrawlResult[]
): QuestionCandidate[] {
  const firstUrl = corpus[0]?.url;
  const candidates: QuestionCandidate[] = [];

  const templates: Record<string, { body: string; gt: string }[]> = {
    specialty_industry: [
      { body: `${unitName}을 대표하는 특산물이나 지리적 표시 등록 품목은 뭐야?`, gt: `${unitName} 대표 특산물 및 농축산물 지정 현황` },
      { body: `${unitName}에서 주력으로 육성하는 첨단 산업이나 산업단지는 어디야?`, gt: `${unitName} 주요 산업단지 및 유치 기업 현황` },
      { body: `${unitName} 특산품 브랜드 이름이랑 주요 판매처 알려줘`, gt: `${unitName} 공식 농특산물 공동브랜드 및 직거래장터` },
    ],
    landmark: [
      { body: `${unitName}에 있는 대표적인 랜드마크 시설이나 복합문화공간은 어디야?`, gt: `${unitName} 주요 복합문화시설 및 개관 정보` },
      { body: `${unitName} 시청/군청 인근에서 시민들이 가장 많이 찾는 대표 공원은?`, gt: `${unitName} 대표 근린공원 및 주요 시설` },
      { body: `${unitName}의 야경 명소나 뷰포인트는 어디가 유명해?`, gt: `${unitName} 공식 추천 야경 조망 명소` },
    ],
    local_policy: [
      { body: `${unitName}에서만 시행하는 독자적인 청년 지원 정책이나 조례가 있어?`, gt: `${unitName} 청년 기본 조례 및 특화 지원사업` },
      { body: `${unitName} 출산축하금이나 다자녀 혜택이 다른 지자체와 다른 점은 뭐야?`, gt: `${unitName} 출산장려 및 양육지원에 관한 조례` },
      { body: `${unitName} 소상공인을 위한 자체 특례지원 사업 조건 알려줘`, gt: `${unitName} 소상공인 지원 조례 및 특례보증 세부 기준` },
    ],
    heritage: [
      { body: `${unitName}의 대표적인 국가지정 문화재나 유네스코 유산이 있어?`, gt: `${unitName} 소재 지정문화재 명칭 및 역사적 가치` },
      { body: `${unitName} 지명의 유래와 역사적 변천 과정이 궁금해`, gt: `${unitName} 지명 유래 및 역사 기록` },
      { body: `${unitName}과 연관된 역사적 위인이나 기념관은 어디야?`, gt: `${unitName} 출신 역사적 인물 및 생가/기념관 정보` },
    ],
    geography: [
      { body: `${unitName}의 행정구역 구분과 주요 생활권 중심지가 어디야?`, gt: `${unitName} 행정동/읍면 구성 및 중심 상업권역` },
      { body: `${unitName}을 관통하는 주요 하천이나 산맥 지형 특성은 뭐야?`, gt: `${unitName} 주요 산천 지형도 및 생태공원` },
      { body: `${unitName}에서 서울이나 주요 대도시로 가는 대표 대중교통 노선은?`, gt: `${unitName} 광역버스 및 철도 연계 교통망` },
    ],
    local_food: [
      { body: `${unitName}에 가면 꼭 먹어봐야 할 향토음식이나 전통 먹거리는?`, gt: `${unitName} 지정 향토음식 및 대표 식문화` },
      { body: `${unitName}의 유명한 먹자골목이나 전통시장은 어디야?`, gt: `${unitName} 5일장 및 대표 전통시장 명칭과 위치` },
      { body: `${unitName} 현지인들이 추천하는 디저트나 지역 제과 명물 있어?`, gt: `${unitName} 특산품 가공 빵/디저트 명물` },
    ],
    recent_issue: [
      { body: `${unitName}에서 최근 추진 중인 가장 큰 도시개발이나 재생 사업은?`, gt: `${unitName} 2030 도시기본계획 및 주요 핵심사업` },
      { body: `${unitName}의 최근 신설 교통 인프라나 철도 연장 계획이 어떻게 돼?`, gt: `${unitName} 광역교통망 확충 사업 추진 현황` },
      { body: `${unitName} 올해 시정 목표나 주요 신규 슬로건이 뭐야?`, gt: `${unitName} 민선 지자체 비전 및 중점 추진과제` },
    ],
  };

  for (const [cat, qList] of Object.entries(templates)) {
    for (const q of qList) {
      candidates.push({
        category: cat,
        body: q.body,
        groundTruthCandidate: q.gt,
        sourceUrl: firstUrl,
      });
    }
  }

  return candidates;
}
