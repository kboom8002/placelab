// scripts/measure-v2/adjudicate-guro.ts
// 규칙 판정이 '불일치'로 낸 회차에 대한 2차 의견(표기·동의어·단위 차이 구제용).
//
// 규율
//  - 규칙 판정(judge-guro.ts)이 원본이다. 이 단계는 '불일치 → 검토(review)'로만 옮길 수 있고, '일치'로 올리지 않는다
//  - 입력은 추출된 값(≤150자)과 원장 값뿐이다. 응답 원문 전문을 보내지 않는다 (INV-6)
//  - 판단 모형은 생성 모형과 다르다. 결과는 .private/ 에만 둔다
//  - 'equivalent' 로 판정된 회차도 사람 교차검토 표본에 반드시 포함한다
//
// 사용: judge → adjudicate → judge
//   pnpm tsx scripts/measure-v2/adjudicate-guro.ts --phase=pilot [--model=gpt-5.4-mini]

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
const readJsonl = (p: string) =>
  fs.existsSync(p) ? fs.readFileSync(p, 'utf-8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];

const SYSTEM = `당신은 두 값이 같은 사실을 가리키는지 비교하는 검사기입니다. 외부 지식으로 어느 쪽이 맞는지 판단하지 마세요. 두 값만 비교합니다.
JSON 한 개만 출력합니다: {"relation":"equivalent | conflict | partial | unclear","reason":"40자 이내"}
- equivalent: 표기·단위·어순·동의어 차이뿐 같은 사실 (예: 무상=무료, 22:00=오후 10시)
- conflict: 서로 다른 값·장소·명칭
- partial: 질문이 묻는 사실의 일부만 일치하거나, 한쪽이 더 넓은/좁은 범위
- unclear: 비교할 수 없음`;

async function main() {
  loadEnv();
  const phase = arg('phase', 'pilot')!;
  const model = arg('model', 'gpt-5.4-mini')!;
  const dir = path.resolve('.private', 'guro', phase);
  const out = path.join(dir, 'adjudications.jsonl');
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY 필요');
  const qs = new Map<string, any>();
  for (const q of JSON.parse(fs.readFileSync('docs/aeo-questions/guro/all.json', 'utf-8').replace(/^\uFEFF/, '')).questions) qs.set(q.id, q);
  const gt = JSON.parse(fs.readFileSync('docs/ground-truth/guro.json', 'utf-8').replace(/^\uFEFF/, '')).entries as Record<string, any>;
  const ex = new Map<string, any>();
  for (const e of readJsonl(path.join(dir, 'extractions.jsonl'))) ex.set(e.response_id, e);
  const done = new Set(readJsonl(out).map((r) => r.response_id));

  const todo = readJsonl(path.join(dir, 'verdicts.jsonl')).filter(
    (v) => v.verdict === 'mismatch' && v.module !== 'C2' && v.module !== 'B6' && !done.has(v.response_id),
  );
  console.log(`2차 의견 대상 ${todo.length} (완료 ${done.size}) 모델=${model}`);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let tokIn = 0;
  let tokOut = 0;
  let i = 0;
  const worker = async () => {
    while (true) {
      const k = i++;
      if (k >= todo.length) return;
      const v = todo[k];
      const q = qs.get(v.question_id);
      const g = gt[v.question_id];
      const e = ex.get(v.response_id);
      let res: any = null;
      for (let t = 0; t < 3 && !res; t++) {
        try {
          const r: any = await (client as any).responses.create({
            model,
            instructions: SYSTEM,
            input: `질문: ${q?.text}\n값 A(원장): ${g?.targetValue}\n값 B(응답에서 추출): ${e?.stated_value}\n\nJSON 으로만 출력하세요.`,
            max_output_tokens: 300,
            text: { format: { type: 'json_object' } },
          });
          tokIn += r?.usage?.input_tokens ?? 0;
          tokOut += r?.usage?.output_tokens ?? 0;
          res = JSON.parse(r.output_text ?? '');
        } catch {
          await new Promise((s) => setTimeout(s, 1000 * 2 ** t));
        }
      }
      const rel = ['equivalent', 'conflict', 'partial', 'unclear'].includes(res?.relation) ? res.relation : 'unclear';
      fs.appendFileSync(
        out,
        JSON.stringify({ response_id: v.response_id, question_id: v.question_id, rep: v.rep, relation: rel, reason: String(res?.reason ?? '').slice(0, 60), model }) + '\n',
        'utf-8',
      );
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  console.log(`완료. 토큰 in=${tokIn} out=${tokOut}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
