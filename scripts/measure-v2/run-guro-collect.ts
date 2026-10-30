// scripts/measure-v2/run-guro-collect.ts
// 구로구(AG-0017) OpenAI Responses + web_search 수집 실행기 (ADR-0012, FR-76 · FR-79)
//
// 규율
//  - 입력은 문항 본문뿐이다. 지역명·머리말·기관별 시스템 프롬프트를 덧붙이지 않는다 (spec/03 §2.1)
//  - 원문 응답은 .private/ 에만 둔다 (INV-6, .gitignore). 공개 경로로 나가지 않는다
//  - 재개 가능: 이미 기록된 (문항, 회차)는 건너뛴다. 실패(error)도 기록하며 성공만 남기지 않는다
//  - 중단 규칙은 RunGuard 가 집행한다. 중단되면 사유를 stop.json 에 남긴다
//  - 회차 층별 순회: rep 1 을 전 문항에 먼저 돌린 뒤 rep 2 … (시간대 편향을 한 문항에 몰지 않는다)
//
// 사용:
//  pnpm tsx scripts/measure-v2/run-guro-collect.ts --phase=pilot --pilot-n=30 --reps=3 --max-calls=120 --max-search-calls=400
//  pnpm tsx scripts/measure-v2/run-guro-collect.ts --phase=main --reps=5 --rep-from=1 --rep-to=1 --max-calls=1450 --max-search-calls=2900
//  --dry 를 주면 호출 없이 작업 목록만 출력한다.

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import {
  collectWebSearchOnce,
  RunGuard,
  type WebSearchProfile,
} from '../../lib/measurement/collector-websearch';

function arg(name: string, def?: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
}
const flag = (n: string) => process.argv.includes(`--${n}`);

function loadEnv() {
  const p = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf-8').split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
}

interface Q {
  id: string;
  module: string;
  text: string;
  usable?: boolean;
  status?: string;
}

/** 파일럿 표본: 모듈별로 id 순 앞에서 균등 배분. 무작위가 아니라 결정적이다(재현 가능) */
function pickPilot(qs: Q[], n: number): Q[] {
  const byMod = new Map<string, Q[]>();
  for (const q of qs) (byMod.get(q.module) ?? byMod.set(q.module, []).get(q.module)!).push(q);
  const mods = [...byMod.keys()].sort();
  const picked: Q[] = [];
  let round = 0;
  while (picked.length < n) {
    let added = false;
    for (const m of mods) {
      const list = byMod.get(m)!.sort((a, b) => a.id.localeCompare(b.id));
      // 모듈 안에서는 간격을 두고 고른다(앞쪽 쏠림 방지)
      const idx = Math.min(list.length - 1, Math.floor((round * list.length) / Math.max(1, Math.ceil(n / mods.length))));
      const cand = list.find((q, i) => i >= idx && !picked.includes(q)) ?? list.find((q) => !picked.includes(q));
      if (cand && picked.length < n) {
        picked.push(cand);
        added = true;
      }
    }
    if (!added) break;
    round++;
  }
  return picked;
}

async function pool<T>(items: T[], size: number, fn: (x: T) => Promise<boolean>) {
  let i = 0;
  let stop = false;
  const workers = Array.from({ length: size }, async () => {
    while (!stop) {
      const k = i++;
      if (k >= items.length) return;
      const cont = await fn(items[k]);
      if (!cont) stop = true;
    }
  });
  await Promise.all(workers);
}

async function main() {
  loadEnv();
  const phase = arg('phase', 'pilot')!;
  const reps = Number(arg('reps', phase === 'pilot' ? '3' : '5'));
  const repFrom = Number(arg('rep-from', '1'));
  const repTo = Number(arg('rep-to', String(reps)));
  const concurrency = Number(arg('concurrency', '4'));
  const maxCalls = Number(arg('max-calls', '0'));
  const maxSearch = Number(arg('max-search-calls', '0'));
  if (!flag('dry') && (!maxCalls || !maxSearch)) {
    throw new Error('--max-calls 와 --max-search-calls 는 필수입니다 (중단 규칙, FR-79).');
  }

  // 탐색 단계(explore-*): 사전 등록 없는 보완 세트. 별도 문항 파일을 읽고 판본 ID 에 단계명을 붙여
  // 본측정 결과로 섞이지 않게 한다 (INV-11: 탐색적으로만 쓴다)
  const isExplore = phase.startsWith('explore-');
  if (!['pilot', 'main'].includes(phase) && !isExplore) throw new Error(`알 수 없는 단계: ${phase}`);
  const qFile = isExplore ? arg('questions') : 'docs/aeo-questions/guro/all.json';
  if (!qFile) throw new Error('탐색 단계는 --questions=<문항 파일> 이 필요합니다.');
  const all = JSON.parse(fs.readFileSync(qFile, 'utf-8').replace(/^\uFEFF/, '')).questions as Q[];
  let qs = all.filter((q) => q.usable !== false && (q.status ?? 'active') === 'active');
  if (phase === 'pilot') qs = pickPilot(qs, Number(arg('pilot-n', '30')));

  // 본 측정: 열린 판본(run_profile.json, opened_at 기록)만 허용. 시범·탐색: 초안 사용
  let draft: any;
  if (phase === 'main') {
    const reg = JSON.parse(fs.readFileSync('docs/measurement-spec/data/registries/run_profile.json', 'utf-8'));
    draft = (reg.profiles ?? []).find((p: any) => p.run_profile_id === 'RP-2026Q4-GURO-OAI-WS-KO');
    if (!draft || !draft.opened_at) throw new Error('본 측정은 열린 판본(RP-2026Q4-GURO-OAI-WS-KO, opened_at)이 run_profile.json 에 있어야 시작합니다 (ADR-0009).');
    const now = Date.now();
    if (draft.window_start && now < Date.parse(draft.window_start)) throw new Error('측정 창 시작 전입니다.');
    if (draft.window_end && now > Date.parse(draft.window_end)) throw new Error('측정 창이 끝났습니다. 새 판본을 열어야 합니다.');
    if (!flag('dry') && (maxCalls! > draft.stop_rules.max_calls || maxSearch! > draft.stop_rules.max_search_calls)) {
      throw new Error(`상한은 판본 값을 넘을 수 없습니다 (호출 ${draft.stop_rules.max_calls} · 검색 ${draft.stop_rules.max_search_calls}).`);
    }
  } else {
    draft = JSON.parse(
      fs.readFileSync('docs/measurement-spec/data/registries/run_profile.draft.guro.json', 'utf-8'),
    ).profiles.find((p: any) => p.language === 'ko');
  }
  const profile: WebSearchProfile = {
    run_profile_id: phase === 'main' ? draft.run_profile_id : `${draft.run_profile_id}-${phase.toUpperCase()}`,
    model_identifier: draft.model_identifier,
    language: 'ko',
    preamble: draft.preamble,
    parameters: draft.parameters,
    max_retries: 2,
  };

  const outDir = path.resolve('.private', 'guro', phase);
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'responses.jsonl');

  const done = new Set<string>();
  if (fs.existsSync(outFile)) {
    for (const line of fs.readFileSync(outFile, 'utf-8').split('\n')) {
      if (!line.trim()) continue;
      try {
        const r = JSON.parse(line);
        // error 도 '시도됨'이지만 재개 시 다시 시도할 수 있게 answered/refused 만 완료로 본다
        if (r.outcome !== 'error') done.add(`${r.question_id}#${r.attempt}`);
      } catch {
        /* 손상 줄은 무시 */
      }
    }
  }

  const jobs: { q: Q; rep: number }[] = [];
  for (let rep = repFrom; rep <= repTo; rep++) for (const q of qs) if (!done.has(`${q.id}#${rep}`)) jobs.push({ q, rep });

  console.log(`단계=${phase} 문항=${qs.length} 회차=${repFrom}..${repTo} 대기 작업=${jobs.length} (기완료 ${done.size}) 동시성=${concurrency}`);
  console.log(`판본=${profile.run_profile_id} 모델=${profile.model_identifier} 상한: 호출 ${maxCalls} · 검색 ${maxSearch}`);
  if (flag('dry')) {
    console.log('드라이런: 호출하지 않음. 첫 5건:', jobs.slice(0, 5).map((j) => `${j.q.id}#${j.rep}`).join(', '));
    return;
  }
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY 가 .env.local 에 필요합니다.');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const guard = new RunGuard({
    maxCalls,
    maxSearchCalls: maxSearch,
    maxErrorRate: draft.stop_rules.max_error_rate,
    minSampleForErrorRate: draft.stop_rules.min_sample_for_error_rate,
    pinnedModelReturned: draft.pinned_model_returned,
  });

  let haltInfo: any = null;
  let n = 0;
  await pool(jobs, concurrency, async ({ q, rep }) => {
    if (haltInfo) return false;
    const rec = await collectWebSearchOnce(client, profile, {
      questionId: q.id,
      agencyHandle: 'AG-0017',
      text: q.text,
      attempt: rep,
    });
    fs.appendFileSync(outFile, JSON.stringify({ ...rec, module: q.module }) + '\n', 'utf-8');
    const v = guard.observe(rec);
    n++;
    if (n % 20 === 0) console.log(`  ${n}/${jobs.length}`, JSON.stringify(guard.snapshot()));
    if (v.halt) {
      haltInfo = { ...v, at: new Date().toISOString(), snapshot: guard.snapshot() };
      return false;
    }
    return true;
  });

  const snap = guard.snapshot();
  fs.writeFileSync(
    path.join(outDir, `run-${new Date().toISOString().replace(/[:.]/g, '-')}.json`),
    JSON.stringify({ phase, profile: profile.run_profile_id, repFrom, repTo, executed: n, snapshot: snap, halt: haltInfo }, null, 2),
    'utf-8',
  );
  console.log('완료', JSON.stringify(snap), haltInfo ? `중단: ${JSON.stringify(haltInfo)}` : '');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
