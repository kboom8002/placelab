// lib/measurement/collector.ts
// docs/measurement-spec: 1수집 및 2원문 보존 엔진
// 규율: policy/robots_policy.md, policy/retention.md, spec/03_관측_실행.md
// 불변식: 요약 필드 금지, 회차별 전량 보존, 거절(N5)은 결측이 아닌 관측값, robots_checked 로깅

import OpenAI from 'openai';
import { SCANNER_UA, SCAN_MIN_INTERVAL_MS } from '@/lib/constants/scanner';
import type { ResponseRecord, AccessState, Question } from '@/lib/types/measurement-spec';

export interface CollectOptions {
  question: Question;
  agencyHandle: string;
  agencyName: string;
  runProfileId: string;
  attempt: number;
  modelIdentifier?: string;
  preamble?: string;
  maxTokens?: number;
}

export interface CollectBatchResult {
  responseRecords: ResponseRecord[];
  accessState: AccessState;
}

/**
 * 응답 텍스트 본문에서 URL 추출
 */
export function extractBodyUrls(text: string): string[] {
  if (!text) return [];
  const urlRegex = /https?:\/\/[^\s\)\],>"'<>]+/g;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches.map((url) => url.replace(/[.,;:!]+$/, ''))));
}

/**
 * 특정 기관 도메인의 robots.txt 준수 여부 점검 및 access_state 기록
 */
export async function checkRobotsAccess(baseUrl: string): Promise<AccessState> {
  try {
    const url = new URL(baseUrl);
    const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;

    const res = await fetch(robotsUrl, {
      method: 'GET',
      headers: { 'User-Agent': SCANNER_UA },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return {
        robots_checked: true,
        robots_allows: true,
        canonical_page_found: false,
      };
    }

    const text = await res.text();
    const disallowAll = /User-agent:\s*\*\s*\nDisallow:\s*\/\s*$/im.test(text);

    return {
      robots_checked: true,
      robots_allows: !disallowAll,
      canonical_page_found: true,
    };
  } catch {
    return {
      robots_checked: true,
      robots_allows: false,
      canonical_page_found: false,
    };
  }
}

/**
 * 단일 회차 수집 및 무손실 응답 원문 레코드 생성
 */
export async function collectSingleResponse(
  client: OpenAI,
  options: CollectOptions
): Promise<ResponseRecord> {
  const timestamp = new Date().toISOString();
  const dateTag = timestamp.slice(0, 10).replace(/-/g, '');
  const randTag = Math.random().toString(36).slice(2, 8);
  const responseId = `RSP-${dateTag}-${options.question.id}-${options.attempt}-${randTag}`;

  // 질문 텍스트에 지자체명 바인딩 (문항이 "이 기관" 등을 지칭할 때 대치)
  const promptText = options.question.text.includes(options.agencyName)
    ? options.question.text
    : `[${options.agencyName}] ${options.question.text}`;

  const preamble =
    options.preamble ||
    '당신은 한국 지자체 민원 안내 도우미입니다. 사용자의 질문에 정확하게, 최신 정보를 기반으로 답해주세요. 답변은 3~5문장으로 핵심 정보를 간결하게 제공하세요. 출처가 있으면 URL도 함께 알려주세요.';

  try {
    const completion = await client.chat.completions.create({
      model: options.modelIdentifier || 'gpt-5.6-luna',
      messages: [
        { role: 'system', content: preamble },
        { role: 'user', content: promptText },
      ],
      max_completion_tokens: options.maxTokens || 800,
    });

    const choice = completion.choices[0];
    const rawText = choice?.message?.content || '';

    // 거절 여부 판별 (결측이 아니라 관측값 N5)
    const isRefusal =
      choice?.finish_reason === 'content_filter' ||
      rawText.includes('답변을 제공할 수 없습니다') ||
      rawText.includes('답변을 드릴 수 없습니다') ||
      rawText.includes('요청하신 정보는 제공이 불가합니다');

    const outcome: 'answered' | 'refused' = isRefusal ? 'refused' : 'answered';
    const bodyUrls = extractBodyUrls(rawText);

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
      citation_urls: [], // API가 별도 근거 메타데이터를 줄 경우 여기에 분리 저장
    };
  } catch (err: any) {
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
      error_detail: err?.message || 'API request failed',
    };
  }
}
