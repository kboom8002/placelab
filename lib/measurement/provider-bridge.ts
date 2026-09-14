// lib/measurement/provider-bridge.ts
// 공급자 어댑터(ProviderAdapter)와 측정 파이프라인(ResponseRecord) 간의 브릿지 (§8.2, INV-7)

import type { Question, ResponseRecord } from '@/lib/types/measurement-spec';
import { ProviderAdapter, AdapterConfig } from '@/lib/kbrandlab/adapters/types';
import { AdapterRegistry } from '@/lib/kbrandlab/adapters/adapter-registry';
import { extractBodyUrls } from './collector';

export interface CollectWithAdapterOptions {
  adapter: ProviderAdapter;
  question: Question;
  agencyHandle: string;
  agencyName: string;
  attempt: number;
  runProfileId: string;
  preamble?: string;
  maxTokens?: number;
}

/**
 * 거절 응답 감지 (N5 엔진 회피 관측값)
 */
function checkIsRefusal(text: string): boolean {
  if (!text) return false;
  return (
    text.includes('답변을 제공할 수 없습니다') ||
    text.includes('답변을 드릴 수 없습니다') ||
    text.includes('요청하신 정보는 제공이 불가합니다') ||
    text.includes('해당 질문에는 답변할 수 없습니다') ||
    text.includes('답변 정책에 따라 안내해 드릴 수 없습니다')
  );
}

/**
 * ProviderAdapter를 이용해 단일 회차 수집을 실행하고 ResponseRecord를 생성
 */
export async function collectWithAdapter(
  options: CollectWithAdapterOptions
): Promise<ResponseRecord> {
  const timestamp = new Date().toISOString();
  const dateTag = timestamp.slice(0, 10).replace(/-/g, '');
  const randTag = Math.random().toString(36).slice(2, 8);
  const responseId = `RSP-${dateTag}-${options.question.id}-${options.attempt}-${randTag}`;

  // 질문 텍스트에 지자체명 바인딩
  const promptText = options.question.text.includes(options.agencyName)
    ? options.question.text
    : `[${options.agencyName}] ${options.question.text}`;

  const preamble =
    options.preamble ||
    '당신은 한국 지자체 민원 안내 도우미입니다. 사용자의 질문에 정확하게, 최신 검색 결과를 바탕으로 객관적 사실과 출처를 명시하여 답하세요. 답변은 3~5문장으로 핵심 정보를 간결하게 제공하세요.';

  const adapterConfig: Partial<AdapterConfig> = {
    systemInstruction: preamble,
    maxOutputTokens: options.maxTokens || 1000,
    searchGrounding: true,
  };

  const result = await options.adapter.execute(promptText, adapterConfig);

  // 오류 발생 시
  if (result.errorCode && !result.rawResponse) {
    return {
      response_id: responseId,
      question_id: options.question.id,
      agency_handle: options.agencyHandle,
      run_profile_id: options.runProfileId,
      attempt: options.attempt,
      observed_at: timestamp,
      outcome: 'error',
      raw_text: '',
      body_urls: [],
      citation_urls: [],
      error_detail: `[${result.errorCode}] ${result.errorMessage || 'API 호출 실패'}`,
    };
  }

  const rawText = result.rawResponse || '';
  const isRefusal = checkIsRefusal(rawText);
  const outcome: 'answered' | 'refused' = isRefusal ? 'refused' : 'answered';

  const bodyUrls = extractBodyUrls(rawText);
  const citationUrls = result.citedUrls || [];

  return {
    response_id: responseId,
    question_id: options.question.id,
    agency_handle: options.agencyHandle,
    run_profile_id: options.runProfileId,
    attempt: options.attempt,
    observed_at: timestamp,
    outcome,
    raw_text: rawText,
    body_urls: bodyUrls,
    citation_urls: citationUrls,
  };
}

/**
 * 프로바이더와 모델명에 맞는 어댑터를 가져옵니다.
 */
export function getMeasurementAdapter(
  provider: 'gemini' | 'openai',
  model?: string
): ProviderAdapter {
  return AdapterRegistry.getAdapter(provider, model);
}
