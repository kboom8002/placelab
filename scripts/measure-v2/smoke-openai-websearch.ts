// scripts/measure-v2/smoke-openai-websearch.ts
// ADR-0012 D-5 스모크 테스트. 관측이 아니다 — 측정 결과로 저장하지 않고, 어떤 보고서에도 쓰지 않는다.
// 확인 항목: ① 모델 접근 가능 여부 ② 반환 model 문자열 ③ web_search_call / url_citation 구조
//           ④ include 소스 요청 수락 여부 ⑤ 호출당 토큰·검색 호출 수 (예산 상한 산정 근거)
// 사용: pnpm tsx scripts/measure-v2/smoke-openai-websearch.ts [--model=gpt-6-astra] [--n=2] [--no-sources]

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import {
  buildRequestParams,
  parseWebSearchResponse,
  type WebSearchProfile,
} from '../../lib/measurement/collector-websearch';

function arg(name: string, def?: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
}

function loadEnv() {
  const p = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf-8').split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
}

// 스모크 전용 문항. 구로구 측정 문항이 아니다 (문항 세트와 무관, 저장하지 않음)
const SMOKE_QUESTIONS = [
  '서울 구로구청의 대표 전화번호와 민원실 운영 시간을 알려주세요.',
  '서울 구로구 주민이 대형폐기물을 배출하려면 어떻게 신청하나요?',
];

async function main() {
  loadEnv();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY 가 .env.local 에 필요합니다.');

  const draft = JSON.parse(
    fs.readFileSync('docs/measurement-spec/data/registries/run_profile.draft.guro.json', 'utf-8'),
  ).profiles[0];

  const profile: WebSearchProfile = {
    run_profile_id: 'SMOKE-NOT-AN-OBSERVATION',
    model_identifier: arg('model', draft.model_identifier)!,
    language: 'ko',
    preamble: draft.preamble,
    parameters: { ...draft.parameters, include_sources: !process.argv.includes('--no-sources') },
    max_retries: 0, // 스모크는 재시도 없이 실패를 그대로 본다
  };

  const n = Math.min(Number(arg('n', '2')), SMOKE_QUESTIONS.length);
  const client = new OpenAI({ apiKey });

  console.log(`모델 요청: ${profile.model_identifier} · include_sources=${profile.parameters.include_sources}`);
  console.log('요청 본문(키만):', Object.keys(buildRequestParams(profile, 'x')).join(', '));

  for (let i = 0; i < n; i++) {
    const t0 = Date.now();
    try {
      const resp: any = await (client as any).responses.create(buildRequestParams(profile, SMOKE_QUESTIONS[i]));
      const p = parseWebSearchResponse(resp);
      console.log(`\n[${i + 1}] ${Date.now() - t0}ms`);
      console.log('  model 반환 문자열 :', p.modelReturned);
      console.log('  output 항목 type  :', (resp.output ?? []).map((o: any) => o.type).join(', '));
      console.log('  검색 발동         :', p.searchTriggered, `(호출 ${p.usage.search_call_count}회)`);
      console.log('  검색 질의/출처수  :', p.searchCalls.map((c) => `${c.query} [src=${c.sources?.length ?? 0}]`).join(' | ') || '(없음)');
      console.log('  url_citation 수   :', p.citationUrls.length);
      console.log('  토큰 in/out       :', p.usage.input_tokens, '/', p.usage.output_tokens);
      console.log('  refused           :', p.refused);
      console.log('  알 수 없는 type   :', p.unknownOutputTypes.join(',') || '(없음)');
      console.log('  본문 앞 120자     :', p.text.slice(0, 120).replace(/\s+/g, ' '));
      const firstCall = (resp.output ?? []).find((o: any) => o.type === 'web_search_call');
      if (firstCall) console.log('  web_search_call 키:', Object.keys(firstCall).join(','), '| action 키:', Object.keys(firstCall.action ?? {}).join(','));
    } catch (e: any) {
      console.log(`\n[${i + 1}] 실패: status=${e?.status} ${e?.message}`);
    }
  }
  console.log('\n※ 이 출력은 관측으로 저장되지 않는다.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
