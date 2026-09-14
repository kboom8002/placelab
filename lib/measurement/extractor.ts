// lib/measurement/extractor.ts
// docs/measurement-spec: 3추출 엔진
// 규율: spec/03 §4.1 (추출과 판정의 분리), spec/03 §5 (반복과 불안정)
// 언어 모형은 응답 원문에서 값/주소/엔티티를 꺼내는 데까지만 사용

import OpenAI from 'openai';
import type {
  ResponseRecord,
  Observation,
  ExtractedFacts,
  AccessState,
  Question,
  ValueNature,
} from '@/lib/types/measurement-spec';

export interface ExtractOptions {
  question: Question;
  agencyHandle: string;
  runProfileId: string;
  windowStart: string;
  windowEnd: string;
  responseRecords: ResponseRecord[];
  accessState?: AccessState;
  client?: OpenAI;
}

/**
 * 복수 회차 응답들로부터 사실/주소/엔티티를 추출하고 불안정성(unstable) 탐지
 */
export async function extractObservation(
  options: ExtractOptions
): Promise<Observation> {
  const records = options.responseRecords;
  const answeredRecords = records.filter((r) => r.outcome === 'answered' && r.raw_text.trim().length > 0);

  const observationId = `OBS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${options.question.id}-${Math.random().toString(36).slice(2, 8)}`;

  // 1. 응답이 전무하거나 모두 거절/에러인 경우
  if (answeredRecords.length === 0) {
    return {
      observation_id: observationId,
      question_id: options.question.id,
      agency_handle: options.agencyHandle,
      run_profile_id: options.runProfileId,
      observed_window: {
        start: options.windowStart,
        end: options.windowEnd,
      },
      response_ids: records.map((r) => r.response_id),
      extracted: {
        stated_value: null,
        stated_value_nature: 'unstated',
        body_url_count: 0,
        citation_url_count: 0,
        public_source_present: false,
        named_entities: [],
      },
      extracted_by: 'rule',
      unstable: false,
      access_state: options.accessState,
    };
  }

  // 2. 응답 본문 기반 URL 및 공적 출처 분석 (규칙 기반)
  const allBodyUrls = Array.from(new Set(answeredRecords.flatMap((r) => r.body_urls || [])));
  const allCitationUrls = Array.from(new Set(answeredRecords.flatMap((r) => r.citation_urls || [])));
  const hasPublicSource = [...allBodyUrls, ...allCitationUrls].some((u) =>
    u.includes('.go.kr') || u.includes('.or.kr') || u.includes('.re.kr')
  );

  // 3. 진술 값(stated_value) 및 성격 추출
  // LLM 클라이언트가 제공된 경우 LLM을 통해 정밀 추출, 아닐 경우 규칙 기반 폴백
  let statedValue: string | null = null;
  let statedNature: ValueNature = 'unstated';
  let namedEntities: string[] = [];
  let extractedBy: 'model' | 'rule' = 'rule';

  if (options.client) {
    try {
      extractedBy = 'model';
      const prompt = `다음은 사용자가 질문한 지자체 행정 질문에 대한 AI의 답변들입니다.
질문: "${options.question.text}"
경계 선언: "${options.question.boundary}"

답변 원문들:
${answeredRecords.map((r, i) => `[회차 ${i + 1}]:\n${r.raw_text}`).join('\n\n')}

위 답변들에서 질문이 묻고 있는 핵심 진술 값(stated_value)과 진술의 성격(measured/estimated/planned/unstated), 언급된 주요 고유명사(named_entities), 그리고 회차 간 답변 내용이 모순되거나 갈리는지(is_unstable)를 JSON으로만 추출하세요.

JSON 포맷:
{
  "stated_value": "추출된 핵심 값 또는 문자열 (없으면 null)",
  "stated_value_nature": "measured" | "estimated" | "planned" | "unstated",
  "named_entities": ["고유명사1", "고유명사2"],
  "is_unstable": false
}`;

      const res = await options.client.chat.completions.create({
        model: 'gpt-5.6-luna',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_completion_tokens: 600,
      });

      const parsed = JSON.parse(res.choices[0]?.message?.content || '{}');
      statedValue = parsed.stated_value ?? null;
      statedNature = ['measured', 'estimated', 'planned', 'unstated'].includes(parsed.stated_value_nature)
        ? parsed.stated_value_nature
        : 'unstated';
      namedEntities = Array.isArray(parsed.named_entities) ? parsed.named_entities : [];
      const isUnstable = Boolean(parsed.is_unstable);

      return {
        observation_id: observationId,
        question_id: options.question.id,
        agency_handle: options.agencyHandle,
        run_profile_id: options.runProfileId,
        observed_window: {
          start: options.windowStart,
          end: options.windowEnd,
        },
        response_ids: records.map((r) => r.response_id),
        extracted: {
          stated_value: statedValue,
          stated_value_nature: statedNature,
          body_url_count: allBodyUrls.length,
          citation_url_count: allCitationUrls.length,
          public_source_present: hasPublicSource,
          named_entities: namedEntities,
        },
        extracted_by: 'model',
        unstable: isUnstable,
        access_state: options.accessState,
      };
    } catch {
      extractedBy = 'rule';
    }
  }

  // 규칙 기반 폴백 추출
  const firstText = answeredRecords[0].raw_text.trim();
  statedValue = firstText.slice(0, 150);
  statedNature = 'unstated';

  // 회차 간 내용 괴리(불안정) 탐지:
  // 어떤 회차는 '정보 부재/거절'이고 어떤 회차는 구체적 답변을 제시해 답이 갈리는 경우
  const refusalKeywords = ['없습니다', '모릅니다', '확인할 수 없습니다', '제공되지 않습니다', '자료가 없습니다'];
  const hasRefusal = answeredRecords.some((r) => refusalKeywords.some((kw) => r.raw_text.includes(kw)));
  const hasSubstantial = answeredRecords.some((r) => r.raw_text.length > 25 && !refusalKeywords.some((kw) => r.raw_text.includes(kw)));
  const isUnstable = hasRefusal && hasSubstantial;

  return {
    observation_id: observationId,
    question_id: options.question.id,
    agency_handle: options.agencyHandle,
    run_profile_id: options.runProfileId,
    observed_window: {
      start: options.windowStart,
      end: options.windowEnd,
    },
    response_ids: records.map((r) => r.response_id),
    extracted: {
      stated_value: statedValue,
      stated_value_nature: statedNature,
      body_url_count: allBodyUrls.length,
      citation_url_count: allCitationUrls.length,
      public_source_present: hasPublicSource,
      named_entities: namedEntities,
    },
    extracted_by: extractedBy,
    unstable: isUnstable,
    access_state: options.accessState,
  };
}
