// lib/measurement/collector-websearch.ts
// OpenAI Responses API + web_search 수집기 (ADR-0012, FR-76 · FR-79)
//
// 규율
//  - chat.completions 를 쓰지 않는다. 검색 도구를 전달하고, 회차마다 발동 여부·질의·출처를 저장한다 (D-1, D-3)
//  - 도메인 필터(filters.allowed_domains)를 쓰지 않는다 (D-1)
//  - 문항 본문 외의 지역명·머리말을 주입하지 않는다 (spec/03 §2.1, F-3)
//  - 재시도는 모두 retries[] 에 남긴다. 성공만 남기지 않는다 (spec/03 §2.1)
//  - 거절은 결측이 아니라 관측값이다 (spec/03 §4.3). 문자열 휴리스틱이 아니라 응답의 refusal 항목으로만 판정한다
//  - 라벨은 on_verified | off | unverified 세 값 (D-2). 이 수집기는 on_verified 만 만든다
//
// 이 파일은 공식 문서(2026-10-06 조회)에 기술된 응답 구조를 따른다:
//   output[] 의 web_search_call (action: search | open_page | find_in_page),
//   message.content[].annotations 의 url_citation.
// 실제 계정 응답과의 일치는 scripts/measure-v2/smoke-openai-websearch.ts 로 확인한다.

import * as crypto from 'crypto';
import type OpenAI from 'openai';
import type { ResponseRecord, SearchCallRecord } from '../types/measurement-spec';

// ── 판본(run profile) 중 수집기가 읽는 부분 ──────────────────────

export interface WebSearchProfile {
  run_profile_id: string;
  model_identifier: string;
  language: 'ko' | 'en';
  preamble: string;
  parameters: {
    reasoning_effort: 'low' | 'medium' | 'high';
    max_output_tokens: number;
    search_context_size: 'low' | 'medium' | 'high';
    user_location: { type: 'approximate'; country: string; city?: string; region?: string };
    tool_choice: 'auto';
    /** 소스 목록 포함 요청. 계정이 거부하면 스모크 테스트에서 드러난다 */
    include_sources: boolean;
  };
  /** 재시도 상한 (최초 시도 제외) */
  max_retries: number;
}

export interface WebSearchJob {
  questionId: string;
  agencyHandle: string;
  /** 문항 본문 그대로. 지역명·머리말을 덧붙이지 않는다 */
  text: string;
  attempt: number;
}

// ── 요청 조립 (순수 함수) ───────────────────────────────────────

export function buildRequestParams(profile: WebSearchProfile, text: string): Record<string, unknown> {
  const p = profile.parameters;
  const params: Record<string, unknown> = {
    model: profile.model_identifier,
    instructions: profile.preamble,
    input: text,
    reasoning: { effort: p.reasoning_effort },
    max_output_tokens: p.max_output_tokens,
    tool_choice: p.tool_choice,
    tools: [
      {
        type: 'web_search',
        search_context_size: p.search_context_size,
        user_location: p.user_location,
        // filters 를 넣지 않는다 — 출처 분포를 왜곡한다 (ADR-0012 D-1)
      },
    ],
  };
  if (p.include_sources) {
    params.include = ['web_search_call.action.sources'];
  }
  return params;
}

// ── 응답 해석 (순수 함수) ───────────────────────────────────────

export interface ParsedWebSearchResponse {
  text: string;
  modelReturned: string;
  searchTriggered: boolean;
  searchCalls: SearchCallRecord[];
  /** url_citation 주석의 주소. 본문 URL 과 합산하지 않는다 */
  citationUrls: string[];
  refused: boolean;
  usage: { input_tokens?: number; output_tokens?: number; search_call_count: number };
  /** 인식하지 못한 output 항목 type. 구조 변경 감지용 */
  unknownOutputTypes: string[];
}

function uniq<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

export function parseWebSearchResponse(resp: any): ParsedWebSearchResponse {
  const output: any[] = Array.isArray(resp?.output) ? resp.output : [];
  const searchCalls: SearchCallRecord[] = [];
  const citationUrls: string[] = [];
  const textParts: string[] = [];
  const unknown: string[] = [];
  let refused = false;
  let searchCallCount = 0;

  for (const item of output) {
    const t = item?.type;
    if (t === 'web_search_call') {
      searchCallCount += 1;
      const a = item.action ?? {};
      if (a.type === 'search') {
        const queries: string[] = Array.isArray(a.queries) ? a.queries : a.query ? [a.query] : [];
        const sources: string[] = Array.isArray(a.sources)
          ? a.sources.map((s: any) => (typeof s === 'string' ? s : s?.url)).filter(Boolean)
          : [];
        if (queries.length === 0) {
          // 질의가 없는 검색 호출도 호출이다. 빈 질의로 기록하고 숨기지 않는다
          searchCalls.push({ query: '', sources });
        } else {
          for (const q of queries) searchCalls.push({ query: q, sources });
        }
      } else if (a.type === 'open_page' && a.url) {
        searchCalls.push({ query: `[open_page] ${a.url}`, sources: [a.url] });
      } else if (a.type === 'find_in_page') {
        searchCalls.push({ query: `[find_in_page] ${a.pattern ?? ''}`.trim(), sources: a.url ? [a.url] : [] });
      }
    } else if (t === 'message') {
      for (const c of item.content ?? []) {
        if (c?.type === 'output_text') {
          textParts.push(c.text ?? '');
          for (const an of c.annotations ?? []) {
            if (an?.type === 'url_citation' && an.url) citationUrls.push(an.url);
          }
        } else if (c?.type === 'refusal') {
          refused = true;
          textParts.push(c.refusal ?? '');
        }
      }
    } else if (t !== 'reasoning') {
      unknown.push(String(t));
    }
  }

  // SDK 편의 필드는 보조. output 에서 얻은 텍스트가 비었을 때만 쓴다
  const text = textParts.join('') || (typeof resp?.output_text === 'string' ? resp.output_text : '');

  return {
    text,
    modelReturned: String(resp?.model ?? ''),
    searchTriggered: searchCallCount > 0,
    searchCalls,
    citationUrls: uniq(citationUrls),
    refused,
    usage: {
      input_tokens: resp?.usage?.input_tokens,
      output_tokens: resp?.usage?.output_tokens,
      search_call_count: searchCallCount,
    },
    unknownOutputTypes: uniq(unknown),
  };
}

// ── 본문 URL 추출 (collector.ts 와 같은 규칙. 순환 의존을 피해 복제) ──

export function extractBodyUrlsLocal(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s)\],>"'<>]+/g) || [];
  return uniq(matches.map((u) => u.replace(/[.,;:!]+$/, '')));
}

// ── 단일 회차 수집 ──────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function collectWebSearchOnce(
  client: OpenAI,
  profile: WebSearchProfile,
  job: WebSearchJob,
): Promise<ResponseRecord> {
  const startedAt = new Date();
  const dateTag = startedAt.toISOString().slice(0, 10).replace(/-/g, '');
  const responseId = `RSP-${dateTag}-${job.questionId}-${profile.language}-${job.attempt}-${crypto.randomBytes(3).toString('hex')}`;
  const params = buildRequestParams(profile, job.text);
  const retries: Array<{ at: string; error: string }> = [];

  const base = {
    response_id: responseId,
    question_id: job.questionId,
    agency_handle: job.agencyHandle,
    run_profile_id: profile.run_profile_id,
    attempt: job.attempt,
    lang: profile.language,
    search_enabled: true,
  } as const;

  for (let i = 0; i <= profile.max_retries; i++) {
    const t0 = Date.now();
    try {
      const resp = await (client as any).responses.create(params);
      const parsed = parseWebSearchResponse(resp);
      const bodyUrls = extractBodyUrlsLocal(parsed.text);
      return {
        ...base,
        observed_at: new Date().toISOString(),
        outcome: parsed.refused ? 'refused' : 'answered',
        raw_text: parsed.text,
        body_urls: bodyUrls,
        citation_urls: parsed.citationUrls,
        model_returned: parsed.modelReturned,
        search_condition_label: 'on_verified',
        search_triggered: parsed.searchTriggered,
        search_calls: parsed.searchCalls,
        usage: parsed.usage,
        latency_ms: Date.now() - t0,
        ...(retries.length ? { retries } : {}),
        raw_hash: crypto.createHash('sha256').update(parsed.text).digest('hex'),
        ...(parsed.unknownOutputTypes.length
          ? { error_detail: `unknown_output_types:${parsed.unknownOutputTypes.join(',')}` }
          : {}),
      };
    } catch (err: any) {
      const msg = `${err?.status ?? ''} ${err?.message ?? 'request failed'}`.trim();
      retries.push({ at: new Date().toISOString(), error: msg });
      const status = Number(err?.status);
      const retryable = !status || status === 408 || status === 409 || status === 429 || status >= 500;
      if (!retryable || i === profile.max_retries) {
        return {
          ...base,
          observed_at: new Date().toISOString(),
          outcome: 'error',
          raw_text: '',
          body_urls: [],
          citation_urls: [],
          search_condition_label: 'unverified', // 호출이 완료되지 않아 발동 여부를 알 수 없다
          latency_ms: Date.now() - t0,
          retries,
          error_detail: msg,
        };
      }
      await sleep(1000 * 2 ** i);
    }
  }
  // 도달 불가. 타입 만족용
  throw new Error('unreachable');
}

// ── 중단 규칙 집행 (FR-79) ──────────────────────────────────────

export interface RunGuardConfig {
  /** 이 판본에서 허용하는 총 생성 호출 수 */
  maxCalls: number;
  /** 총 검색 호출 상한 (비용 대리 지표) */
  maxSearchCalls: number;
  /** 오류율이 이 값을 넘으면 중단 (사전 등록: 10%) */
  maxErrorRate: number;
  /** 오류율 판정을 시작하는 최소 표본 */
  minSampleForErrorRate: number;
  /** 스모크 테스트로 확정한 반환 모델 문자열. 없으면 첫 성공 응답이 기준 */
  pinnedModelReturned?: string;
}

export interface GuardVerdict {
  halt: boolean;
  reason?: 'budget_calls' | 'budget_search_calls' | 'error_rate' | 'model_string_changed';
  detail?: string;
}

export class RunGuard {
  private calls = 0;
  private searchCalls = 0;
  private errors = 0;
  private baselineModel?: string;

  constructor(private cfg: RunGuardConfig) {
    this.baselineModel = cfg.pinnedModelReturned;
  }

  /** 레코드를 하나 받을 때마다 호출. halt=true 이면 호출자가 즉시 멈추고 사유를 기록한다 */
  observe(r: ResponseRecord): GuardVerdict {
    this.calls += 1;
    this.searchCalls += r.usage?.search_call_count ?? 0;
    if (r.outcome === 'error') this.errors += 1;

    if (r.outcome !== 'error' && r.model_returned) {
      if (!this.baselineModel) this.baselineModel = r.model_returned;
      else if (r.model_returned !== this.baselineModel) {
        return {
          halt: true,
          reason: 'model_string_changed',
          detail: `${this.baselineModel} → ${r.model_returned}`,
        };
      }
    }
    if (this.calls >= this.cfg.maxCalls) {
      return { halt: true, reason: 'budget_calls', detail: `${this.calls}/${this.cfg.maxCalls}` };
    }
    if (this.searchCalls >= this.cfg.maxSearchCalls) {
      return { halt: true, reason: 'budget_search_calls', detail: `${this.searchCalls}/${this.cfg.maxSearchCalls}` };
    }
    if (this.calls >= this.cfg.minSampleForErrorRate && this.errors / this.calls > this.cfg.maxErrorRate) {
      return {
        halt: true,
        reason: 'error_rate',
        detail: `${this.errors}/${this.calls}`,
      };
    }
    return { halt: false };
  }

  snapshot() {
    return { calls: this.calls, searchCalls: this.searchCalls, errors: this.errors, baselineModel: this.baselineModel };
  }
}
