// tests/measurement/collector-websearch.test.ts
// ADR-0012 / FR-76 · FR-77 · FR-79 검증. 네트워크 호출 없음 (가짜 클라이언트 사용).

import fs from 'fs';
import path from 'path';
import {
  buildRequestParams,
  parseWebSearchResponse,
  collectWebSearchOnce,
  RunGuard,
  type WebSearchProfile,
} from '../../lib/measurement/collector-websearch';
import type { ResponseRecord } from '../../lib/types/measurement-spec';

const PROFILE: WebSearchProfile = {
  run_profile_id: 'RP-TEST',
  model_identifier: 'test-model',
  language: 'ko',
  preamble: '공통 앞말',
  parameters: {
    reasoning_effort: 'low',
    max_output_tokens: 1000,
    search_context_size: 'medium',
    user_location: { type: 'approximate', country: 'KR', city: 'Seoul' },
    tool_choice: 'auto',
    include_sources: true,
  },
  max_retries: 2,
};

const FIXTURE_SEARCHED = {
  model: 'test-model-2026-10',
  output: [
    { type: 'reasoning' },
    {
      type: 'web_search_call',
      id: 'ws_1',
      status: 'completed',
      action: { type: 'search', query: '구로구청 전화번호', sources: [{ url: 'https://www.guro.go.kr/a' }, { url: 'https://blog.example/b' }] },
    },
    { type: 'web_search_call', id: 'ws_2', status: 'completed', action: { type: 'open_page', url: 'https://www.guro.go.kr/a' } },
    {
      type: 'message',
      content: [
        {
          type: 'output_text',
          text: '구로구청은 ... 자세한 내용은 https://www.guro.go.kr/a 에서 확인하세요.',
          annotations: [{ type: 'url_citation', url: 'https://www.guro.go.kr/a', title: 't', start_index: 0, end_index: 3 }],
        },
      ],
    },
  ],
  usage: { input_tokens: 1200, output_tokens: 300 },
};

const FIXTURE_NO_SEARCH = {
  model: 'test-model-2026-10',
  output: [{ type: 'message', content: [{ type: 'output_text', text: '검색 없이 답함', annotations: [] }] }],
  usage: { input_tokens: 50, output_tokens: 20 },
};

const FIXTURE_REFUSAL = {
  model: 'test-model-2026-10',
  output: [{ type: 'message', content: [{ type: 'refusal', refusal: '답할 수 없습니다' }] }],
};

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

function fakeClient(sequence: Array<() => any>) {
  let i = 0;
  return {
    responses: {
      create: async () => {
        const f = sequence[Math.min(i, sequence.length - 1)];
        i += 1;
        return f();
      },
    },
  } as any;
}

export async function testCollectorWebSearch() {
  // 1. 요청 조립 — 도메인 필터 없음, 도구는 web_search, 문항 본문 그대로
  const params: any = buildRequestParams(PROFILE, '구로구 대형폐기물 신청 방법은?');
  assert(params.input === '구로구 대형폐기물 신청 방법은?', '문항 본문 외 텍스트를 주입하면 안 된다 (spec/03 §2.1)');
  assert(params.tools.length === 1 && params.tools[0].type === 'web_search', 'web_search 도구 하나여야 한다');
  assert(!('filters' in params.tools[0]), '도메인 필터는 쓰지 않는다 (ADR-0012 D-1)');
  assert(params.tool_choice === 'auto', 'tool_choice 는 auto');
  assert(!JSON.stringify(params).includes('web_search_preview'), '구형 도구 금지');
  assert(params.instructions === '공통 앞말', '앞말 지시문은 판본 값 그대로');

  // 2. 응답 해석 — 발동, 질의, 소스, 인용, 본문 URL 분리
  const s = parseWebSearchResponse(FIXTURE_SEARCHED);
  assert(s.searchTriggered === true, '검색 발동 감지');
  assert(s.usage.search_call_count === 2, 'open_page 도 호출로 센다');
  assert(s.searchCalls[0].query === '구로구청 전화번호' && s.searchCalls[0].sources?.length === 2, '질의·출처 저장');
  assert(s.citationUrls.length === 1 && s.citationUrls[0] === 'https://www.guro.go.kr/a', 'url_citation 만 citation_urls');
  assert(s.modelReturned === 'test-model-2026-10', '반환 모델 문자열 보존');
  assert(s.unknownOutputTypes.length === 0, 'reasoning 은 알려진 type');

  const n = parseWebSearchResponse(FIXTURE_NO_SEARCH);
  assert(n.searchTriggered === false && n.searchCalls.length === 0, '미발동도 관측값으로 남는다');

  const r = parseWebSearchResponse(FIXTURE_REFUSAL);
  assert(r.refused === true, '거절은 refusal 항목으로 판정');

  const u = parseWebSearchResponse({ output: [{ type: 'new_future_item' }] });
  assert(u.unknownOutputTypes.includes('new_future_item'), '구조 변경은 숨기지 않고 드러낸다');

  // 3. 단일 회차 수집 — 성공 레코드 형태, 라벨, 본문 URL/인용 분리
  const ok = await collectWebSearchOnce(
    fakeClient([() => FIXTURE_SEARCHED]),
    PROFILE,
    { questionId: 'GUR-ADM-001', agencyHandle: 'AG-0017', text: '질문', attempt: 1 },
  );
  assert(ok.outcome === 'answered', 'answered');
  assert(ok.search_condition_label === 'on_verified' && ok.search_enabled === true && ok.search_triggered === true, '조건·발동 분리 저장');
  assert(ok.raw_hash && ok.raw_hash.length === 64, 'raw_hash 필수');
  assert(!('retries' in ok) || ok.retries === undefined, '재시도가 없으면 retries 를 만들지 않는다');
  assert(ok.body_urls!.includes('https://www.guro.go.kr/a') && ok.citation_urls!.length === 1, '본문 URL 과 인용 분리');
  assert(ok.lang === 'ko', 'lang 기록');

  const noSearch = await collectWebSearchOnce(
    fakeClient([() => FIXTURE_NO_SEARCH]),
    PROFILE,
    { questionId: 'GUR-ADM-002', agencyHandle: 'AG-0017', text: '질문', attempt: 1 },
  );
  assert(noSearch.search_enabled === true && noSearch.search_triggered === false, '도구 전달 + 미발동 = on_verified 이지만 triggered=false');

  // 4. 재시도 — 성공만 남기지 않고 실패를 retries 에 전량 기록
  const flaky = await collectWebSearchOnce(
    fakeClient([
      () => { const e: any = new Error('server'); e.status = 500; throw e; },
      () => { const e: any = new Error('rate'); e.status = 429; throw e; },
      () => FIXTURE_SEARCHED,
    ]),
    { ...PROFILE },
    { questionId: 'GUR-ADM-003', agencyHandle: 'AG-0017', text: '질문', attempt: 1 },
  );
  assert(flaky.outcome === 'answered' && flaky.retries?.length === 2, '재시도 2건이 모두 기록되어야 한다');

  // 5. 비재시도 오류 — error 레코드, 라벨은 unverified (호출이 완료되지 않았다)
  const bad = await collectWebSearchOnce(
    fakeClient([() => { const e: any = new Error('model not found'); e.status = 404; throw e; }]),
    PROFILE,
    { questionId: 'GUR-ADM-004', agencyHandle: 'AG-0017', text: '질문', attempt: 1 },
  );
  assert(bad.outcome === 'error' && bad.search_condition_label === 'unverified' && bad.retries?.length === 1, '404 는 재시도하지 않고 기록');

  // 6. 중단 규칙 — 모델 문자열 변경, 오류율, 예산
  const rec = (over: Partial<ResponseRecord>): ResponseRecord => ({ ...ok, ...over });
  const g1 = new RunGuard({ maxCalls: 100, maxSearchCalls: 100, maxErrorRate: 0.1, minSampleForErrorRate: 20 });
  assert(!g1.observe(rec({ model_returned: 'A' })).halt, '첫 응답은 기준선');
  const drift = g1.observe(rec({ model_returned: 'B' }));
  assert(drift.halt && drift.reason === 'model_string_changed', '모델 문자열 변경 시 중단');

  const g2 = new RunGuard({ maxCalls: 1000, maxSearchCalls: 1000, maxErrorRate: 0.1, minSampleForErrorRate: 10 });
  let halted = false;
  for (let i = 0; i < 10; i++) {
    const v = g2.observe(rec({ outcome: i < 3 ? 'error' : 'answered', model_returned: 'A' }));
    if (v.halt) halted = v.reason === 'error_rate';
  }
  assert(halted, '오류율 30% > 10% 중단');

  const g3 = new RunGuard({ maxCalls: 2, maxSearchCalls: 1000, maxErrorRate: 1, minSampleForErrorRate: 1000 });
  g3.observe(rec({ model_returned: 'A' }));
  assert(g3.observe(rec({ model_returned: 'A' })).reason === 'budget_calls', '호출 예산 도달 시 중단');

  // 7. 정오표 — 파일 존재, 라벨은 unverified, 확인되지 않은 것을 단정하지 않는다
  const errata = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'docs/measurement-spec/data/registries/condition_label_errata.json'), 'utf-8'),
  );
  assert(errata.entries.length > 0, '정오표 항목');
  for (const e of errata.entries) {
    assert(e.corrected_label === 'unverified', `${e.path}: 정정 라벨은 unverified (off 로 단정하지 않는다)`);
    assert(fs.existsSync(path.join(process.cwd(), e.path)), `${e.path}: 정오표 대상 파일이 존재해야 한다`);
  }

  // 8. 재발 방지 — chat.completions 로 OpenAI 를 호출하는 스크립트는 검색 'on' 라벨을 쓰지 않는다 (ADR-0012 D-4)
  const scriptsDir = path.join(process.cwd(), 'scripts');
  const walk = (d: string): string[] =>
    fs.readdirSync(d, { withFileTypes: true }).flatMap((x) =>
      x.isDirectory() ? walk(path.join(d, x.name)) : x.name.endsWith('.ts') ? [path.join(d, x.name)] : [],
    );
  for (const f of walk(scriptsDir)) {
    const t = fs.readFileSync(f, 'utf-8');
    if (/chat\.completions\.create/.test(t) && /web_search\s*:\s*'on/.test(t)) {
      throw new Error(`${path.relative(process.cwd(), f)}: chat.completions 호출인데 web_search 'on' 라벨을 기록한다 (ADR-0012 D-2 위반)`);
    }
  }
}
