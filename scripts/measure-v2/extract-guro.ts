// scripts/measure-v2/extract-guro.ts
// 구로구 응답 추출 단계 (spec/03 §4.1: 추출과 판정의 분리)
//
// 규율
//  - 언어 모형은 응답 원문에서 '말한 값'을 꺼내는 데까지만 쓴다. 맞고 틀림은 판정 단계(규칙)가 한다
//  - 추출기에는 원장 값을 보여주지 않는다 (확증 편향 차단)
//  - 생성 모형(gpt-6-luna)과 다른 모형을 쓴다 (자기 평가 편향 차단)
//  - 회차별로 추출한다. 회차를 합치지 않는다 (INV-9)
//  - 원문은 .private/ 에만 있고, 추출 산출물에도 원문 전문을 넣지 않는다 (INV-6): 값은 150자 이내 요약
//
// 사용: pnpm tsx scripts/measure-v2/extract-guro.ts --phase=pilot [--model=gpt-5.4-mini] [--concurrency=4]

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

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

export const EXTRACT_STANCES = [
  'gives_specific', // 질문이 묻는 사실을 구체적으로 진술
  'hedges_no_info', // 확인할 수 없다/공식 안내를 보라 등 구체 값 없이 회피
  'refuses', // 답변 거절
  'denies_existence', // 그런 제도·시설이 없다/확인되지 않는다고 진술
  'affirms_existence', // 질문이 전제한 제도·시설이 있다고 인정하고 세부를 진술
] as const;

const SYSTEM = `당신은 AI 응답에서 '말한 내용'을 꺼내는 추출기입니다. 응답이 맞는지 판단하지 마세요. 외부 지식으로 보정하지 마세요. 응답에 적힌 것만 꺼내세요.
JSON 한 개만 출력합니다:
{
 "stance": "gives_specific | hedges_no_info | refuses | denies_existence | affirms_existence",
 "stated_value": "질문이 묻는 핵심 사실에 대해 응답이 말한 값을 150자 이내로 그대로 요약 (응답에 없으면 null)",
 "named_entities": ["응답이 언급한 기관·시설·제도·장소의 고유명사 (최대 8개)"],
 "hedge_present": true|false
}
stance 기준:
- gives_specific: 질문이 묻는 사실(장소·시간·금액·절차·명칭 등)을 구체적으로 진술
- hedges_no_info: 구체 값을 주지 않고 공식 누리집·전화 확인을 안내하는 데 그침
- refuses: 답을 거절
- denies_existence: 질문이 전제한 제도·시설·창구가 없거나 확인되지 않는다고 말함
- affirms_existence: 질문이 전제한 제도·시설·창구가 존재한다고 보고 세부(신청 방법·금액·시간 등)를 진술
hedge_present: 답 중 '정확한 내용은 확인 필요' 같은 단서가 하나라도 있으면 true`;

async function main() {
  loadEnv();
  const phase = arg('phase', 'pilot')!;
  const model = arg('model', 'gpt-5.4-mini')!;
  const concurrency = Number(arg('concurrency', '4'));
  const dir = path.resolve('.private', 'guro', phase);
  const inFile = path.join(dir, 'responses.jsonl');
  const outFile = path.join(dir, 'extractions.jsonl');
  if (!fs.existsSync(inFile)) throw new Error(`없음: ${inFile}`);
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY 필요');

  const qs = new Map<string, any>();
  for (const q of JSON.parse(fs.readFileSync('docs/aeo-questions/guro/all.json', 'utf-8').replace(/^\uFEFF/, '')).questions) qs.set(q.id, q);

  const recs = fs
    .readFileSync(inFile, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l))
    .filter((r) => r.outcome === 'answered' || r.outcome === 'refused');

  const done = new Set<string>();
  if (fs.existsSync(outFile)) {
    for (const l of fs.readFileSync(outFile, 'utf-8').split('\n').filter(Boolean)) {
      try {
        const o = JSON.parse(l);
        if (o.stance !== 'extract_failed') done.add(o.response_id);
      } catch {
        /* 무시 */
      }
    }
  }
  const todo = recs.filter((r) => !done.has(r.response_id));
  console.log(`추출 대상 ${todo.length} (완료 ${done.size}) 모델=${model}`);

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let i = 0;
  let tokIn = 0;
  let tokOut = 0;
  let fail = 0;
  const worker = async () => {
    while (true) {
      const k = i++;
      if (k >= todo.length) return;
      const r = todo[k];
      const q = qs.get(r.question_id);
      let out: any = null;
      let err = '';
      for (let t = 0; t < 3 && !out; t++) {
        try {
          const resp: any = await (client as any).responses.create({
            model,
            instructions: SYSTEM,
            input: `질문:\n${q?.text ?? ''}\n\n응답:\n${r.raw_text}\n\n위 지시대로 JSON 으로만 출력하세요.`,
            max_output_tokens: 700,
            text: { format: { type: 'json_object' } },
          });
          tokIn += resp?.usage?.input_tokens ?? 0;
          tokOut += resp?.usage?.output_tokens ?? 0;
          out = JSON.parse(resp.output_text ?? '');
        } catch (e: any) {
          err = `${e?.status ?? ''} ${e?.message ?? e}`;
          await new Promise((s) => setTimeout(s, 1000 * 2 ** t));
        }
      }
      const row = out
        ? {
            response_id: r.response_id,
            question_id: r.question_id,
            rep: r.attempt,
            stance: (EXTRACT_STANCES as readonly string[]).includes(out.stance) ? out.stance : 'invalid',
            stated_value: typeof out.stated_value === 'string' ? out.stated_value.slice(0, 150) : null,
            named_entities: Array.isArray(out.named_entities) ? out.named_entities.slice(0, 8) : [],
            hedge_present: Boolean(out.hedge_present),
            extractor_model: model,
          }
        : { response_id: r.response_id, question_id: r.question_id, rep: r.attempt, stance: 'extract_failed', error: err, extractor_model: model };
      if (!out) fail++;
      fs.appendFileSync(outFile, JSON.stringify(row) + '\n', 'utf-8');
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log(`완료. 토큰 in=${tokIn} out=${tokOut} 실패=${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
