// scripts/measure-v2/guro-author/gen.ts
// 구로구 문항·원장 후보 생성기 — '저장된 공식 페이지 본문'에서만 사실을 꺼낸다.
//
// 원칙 (_AUTHORING_RULES.md §0)
//  - 언어 모형은 페이지 본문에 적힌 사실을 문항 후보로 바꾸는 데만 쓴다. 기억·추정으로 값을 만들지 못하게 막는다
//  - 모든 후보는 프로그램이 검증한다: evidence_quote 가 본문에 '그대로' 있어야 하고,
//    targetValue 의 핵심 토큰(숫자·고유명사)이 그 구절 안에 있어야 한다. 하나라도 어긋나면 폐기한다
//  - 수정일이 MIN_ASOF 이전인 페이지는 쓰지 않는다 (낡은 원장 방지). 수정일이 없는 페이지는 쓰지 않는다
//  - 최종 산출물은 사람이 표본 검수한다 (생성기 통과 ≠ 정확)
//
// 사용: pnpm tsx scripts/measure-v2/guro-author/gen.ts <모듈ID> [--dry]

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { buildModule, type Row } from './lib';

const MODEL = process.env.GEN_MODEL ?? 'gpt-5.4';
const MIN_ASOF = '2024-01-01';
const DIR = path.resolve('.private', 'guro', 'pages');

interface Page { url: string; crumb: string; body: string; asOf: string | null; dept: string }

function loadPages(): Page[] {
  const out: Page[] = [];
  const seen = new Set<string>();
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.txt'))) {
    const lines = fs.readFileSync(path.join(DIR, f), 'utf-8').split('\n');
    const url = (lines[0] ?? '').replace(/^URL:\s*/, '').trim().replace(/&+$/, '');
    if (seen.has(url) || !/contents\.do\?key=\d+/.test(url)) continue;
    seen.add(url);
    let start = -1;
    let end = lines.length;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '공유하기') start = i;
      if (start >= 0 && lines[i].includes('담당자 정보')) { end = i; break; }
    }
    if (start < 0) continue;
    const body = lines.slice(start + 1, end).map((l) => l.trim()).filter(Boolean).join(' ').replace(/^페이스북 X 블로그 닫기\s*/, '');
    const tail = lines.slice(end, end + 8).join(' ');
    const m = tail.match(/콘텐츠수정일\s*(\d{4})\.(\d{2})\.(\d{2})/);
    const d = tail.match(/담당부서\s*(\S+)/);
    out.push({ url, crumb: (lines[4] ?? '').trim().replace(/-구로구청$/, ''), body, asOf: m ? `${m[1]}-${m[2]}-${m[3]}` : null, dept: d?.[1] ?? '' });
  }
  return out;
}

interface Cfg {
  file: string; set: string; module: string; audience: 'resident' | 'external' | 'probe';
  prefix: string; count: number; titleRe: RegExp; excludeRe?: RegExp;
  personas: string[]; guide: string; perPage?: number; maxToVerify?: number; en?: number;
  named?: boolean;
}

const CFGS: Record<string, Cfg> = {
  A2: {
    file: 'a2-env', set: 'guro_resident_env', module: 'A2', audience: 'resident', prefix: 'GUR-ENV', count: 16,
    titleRe: /쓰레기배출요령|음식물쓰레기|재활용품 분리|재활용\/알뜰|대형폐기물|주정차|주차|소음|무단투기|종량제|그린파킹|안전신고방|폐기물 수거 및 배출|폐기물 감량|일회용품/,
    excludeRe: /배출업소|지정폐기물|의료폐기물|배출시설|배출가스|자체진단|법령준수|위반사례|적환|선별시설|압축/,
    personas: ['30대 직장인', '50대 주민', '70대 어르신', '신혼부부', '자취하는 20대'],
    guide: '생활쓰레기 배출 방법·시간, 종량제봉투, 음식물 배출, 재활용 분리배출, 대형폐기물, 주정차 단속·과태료, 불법투기, 소음, 안전신고 등 주민이 일상에서 묻는 질문. 과태료·수수료 금액은 표에서 정확히 한 칸만 묻는다.',
  },
  A3: {
    file: 'a3-welfare', set: 'guro_resident_welfare', module: 'A3', audience: 'resident', prefix: 'GUR-WEL', count: 20,
    titleRe: /복지|돌봄|보육|한부모|다문화가족|기초연금|경로|임산부|양육수당|장애|긴급지원|저소득|어르신|아이돌봄|요양|치매/,
    excludeRe: /국가유공자|시설$|보육시설$|자동차|전세|고속도로|통행료|지도|현황$|다문화지정/,
    personas: ['30대 학부모', '70대 어르신', '신혼부부', '장애인 가족', '40대 한부모', '임신 중인 30대'],
    guide: '출산·양육·돌봄·어르신·장애인·긴급복지 등 복지 서비스의 신청 창구·대상·지급 항목·연락처 중 페이지에 적힌 값 하나.',
  },
  A4: {
    file: 'a4-edu', set: 'guro_resident_edu', module: 'A4', audience: 'resident', prefix: 'GUR-EDU', count: 14,
    titleRe: /평생|학습|도서관|청년|일자리|취업|청소년증|장학|진로|방과후|사이버/,
    excludeRe: /기업|장애인 일자리|어르신일자리|여성일자리|마을기업|사회적기업|전자도서관/,
    personas: ['20대 구직자', '40대 학부모', '대학생', '60대 주민', '고등학생 부모'],
    guide: '개인(학생·구직자·청년·주민) 대상 교육·도서관·일자리·청년 서비스의 신청 방법·대상·시간·전화 등 하나.',
  },
  A5: {
    file: 'a5-safety', set: 'guro_resident_safety', module: 'A5', audience: 'resident', prefix: 'GUR-SAF', count: 14,
    titleRe: /안심귀가|안전신고|지진|민방위|응급|재난|대피|보건소|예방접종|검진|치매|정신건강|침수/,
    excludeRe: /사례|인적재난|기반재난|자연재난$/,
    personas: ['20대 여성 직장인', '50대 주민', '70대 어르신', '학부모'],
    guide: '보건·안전·재난 서비스의 이용 방법·시간·장소·연락처 하나. 의료 조언이나 질병 정보는 묻지 않는다.',
  },
  B1: {
    file: 'b1-tourism', set: 'guro_external_tourism', module: 'B1', audience: 'external', prefix: 'GUR-TOU', count: 22,
    titleRe: /올레길|수목원|시장|생태공원|산책로|관광|아트밸리|개웅산|문화철도|정선옹주|황톳길|둘레길|공원|문화원|생활문화|문화누리|문화행사|온수도시/,
    excludeRe: /녹지현황|공원 및 녹지|위험수목|옥상공원|문화행사SMS|전자도서관/,
    personas: ['서울 여행자', '주말 나들이 가족', '걷기 좋아하는 40대', '외국인 방문객', '역사 탐방 학생'],
    guide: '구로구 안의 공원·산책로·올레길·시장·문화시설 등 방문지의 위치·교통·운영시간·입장료·코스 길이 등 하나. 맛집·숙소 추천은 쓰지 않는다.',
    en: 8,
  },
  B2: {
    file: 'b2-industry', set: 'guro_external_industry', module: 'B2', audience: 'external', prefix: 'GUR-IND', count: 16,
    titleRe: /구로디지털|디지털산업단지|기업지원|입주절차|기업\/일자리|시설현황|기업지원시설|취업박람회|판로|지식산업|G밸리|일자리창출우수기업/,
    excludeRe: /어르신|여성|장애인/,
    personas: ['IT 스타트업 창업자', '입주를 검토하는 기업 담당자', '투자 검토자', '외국계 기업 담당자'],
    guide: '구로디지털단지(G밸리) 등 산업·기업 지원·입주 절차의 공식 명칭·위치·면적·기업 수·지원사업·문의처 하나.',
    en: 8,
  },
  B3: {
    file: 'b3-export', set: 'guro_external_export', module: 'B3', audience: 'external', prefix: 'GUR-EXP', count: 12,
    titleRe: /판로|수출|해외|통상|무역|교류도시/,
    excludeRe: /할인 혜택/,
    personas: ['수출을 준비하는 중소기업 대표', '해외 판로를 찾는 제조업체 담당자'],
    guide: '구로구 소재 기업이 이용할 수 있는 수출·해외 판로 지원의 창구·대상·내용 하나. 페이지에 없는 지원은 묻지 않는다.',
    en: 6,
  },
  B4: {
    file: 'b4-invest', set: 'guro_external_invest', module: 'B4', audience: 'external', prefix: 'GUR-INV', count: 10,
    titleRe: /기본현황|산업\/경제|교통\/통신|교통$|주거,인구,산업|도시계획현황|구로주요통계/,
    excludeRe: /재개발|재건축/,
    personas: ['이전을 검토하는 기업 담당자', '투자 검토자', '이주를 고민하는 직장인'],
    guide: '구로구 입지·교통·인구·면적·도시계획 등 공식 통계와 현황 중 기준일이 있는 값 하나. 기준일을 질문에 쓰지 않아도 되지만 원장에 적는다.',
    en: 4,
  },
  B5: {
    file: 'b5-multicultural', set: 'guro_external_multicultural', module: 'B5', audience: 'external', prefix: 'GUR-MUL', count: 10,
    titleRe: /외국인|다문화|체류지|영문|중문/,
    excludeRe: /지정시설/,
    personas: ['구로구에 사는 외국인 근로자', '외국인 주민의 한국인 가족', '유학생'],
    guide: '구로구의 외국인 주민 지원 시설·체류지 변경 신고·다문화 가족 지원·외국인 주민 통계 중 하나.',
    en: 8,
  },
  C1: {
    file: 'c1-reputation', set: 'guro_probe_reputation', module: 'C1', audience: 'probe', prefix: 'GUR-REP', count: 14,
    titleRe: /연혁|역사|산업\/경제|문화전통|구로공단|디지털단지|기본현황|동별역사/,
    personas: ['외지에서 온 방문자', '구로구를 잘 모르는 직장인', '학생'],
    guide: '구로구의 현재 사실과 흔히 알려진 낡은 인식이 갈리는 항목(행정동 수·지명·산업 전환·연혁 연도 등) 중 페이지에서 확인되는 현행 사실 하나. 중립적으로 쓴다.',
    maxToVerify: 2,
  },
};

const SYSTEM = (c: Cfg) => `당신은 지자체 누리집 페이지에서 '측정 문항'과 '정답 원장'을 만드는 편집자입니다.
규칙:
1. 아래 [페이지 본문]에 **글자 그대로** 적힌 사실만 정답으로 씁니다. 기억·상식·추정으로 값을 만들지 마세요.
2. 한 문항은 사실 하나만 묻습니다. 문항은 실제 사람이 입력할 법한 자연스러운 한국어 한 문장입니다. 문항 안에 "구로구"를 포함합니다.
3. 문항 본문만 AI에 보내므로, 문항만 읽고도 무엇을 묻는지 알 수 있어야 합니다. "이 페이지", "위 표", "OO 안내에서", "OO 페이지에서" 같은 메뉴·페이지 이름 언급은 금지입니다. 누리집을 모르는 주민이 일상에서 하는 질문으로 씁니다(예: "구로구에서 음식물쓰레기는 몇 시에 내놓을 수 있나요?").
3-1. 표의 칸을 묻는 경우, 그 행과 열의 이름이 본문에서 분명할 때만 냅니다. 열 이름이 불분명한 가격표·숫자 나열은 후보로 내지 않습니다. 서울시 전체 통계처럼 구로구 자료가 아닌 값도 내지 않습니다.
3-2. 같은 evidence_quote 로 둘 이상의 문항을 만들지 않습니다. 후보끼리 사실이 겹치지 않아야 합니다.
4. 순위·최고·1위·추천해 같은 표현, 정치인·단체장 이름, 개인정보는 쓰지 않습니다. 의견·평가를 묻지 않습니다.
5. evidence_quote 는 본문에서 그대로 복사한 60자 이내 구절입니다(띄어쓰기·기호 포함 정확히). 요약·변형 금지.
6. targetValue 는 evidence_quote 에 들어 있는 값만으로 구성합니다. acceptable_variants 는 AI 답에 나올 법한 핵심 토큰 2~5개(숫자는 쉼표 있는/없는 두 표기, 명칭은 약칭 포함)이며, "구로구" 같은 흔한 말은 넣지 않습니다. 각 토큰은 evidence_quote 에 있거나 그 표기 변형이어야 합니다.
7. 금액·시간·연령·기한·전화번호·개소 수처럼 정답이 하나로 떨어지는 값을 우선합니다. 표에서는 정확히 한 칸만 묻습니다.
8-1. 주민·방문객이 실제로 궁금해할 실용 정보(신청 방법·창구·운영시간·금액·연락처·장소·대상·기한·교통)만 냅니다. 법령상 정의, 일반 안전수칙, 일반 상식, 구로구가 아닌 다른 기관(소방학교·한국장애인고용공단 등)의 번호, 사업 소개 문구, 책자·메뉴 이름, 통계 설명은 제외합니다. 각 후보에 interest(1~5, 5=주민이 매우 자주 묻는 실용 질문, 3 이하=의미 약함)를 정직하게 매깁니다.
8. 페이지에 근거가 약하면 후보를 적게(0개도 가능) 냅니다. 억지로 채우지 마세요.
이 모듈의 취지: ${c.guide}
persona 는 다음 중에서: ${c.personas.join(' / ')}.
JSON 하나만 출력:
{"items":[{"text":"","journey":"find|apply|cost|eligibility|where|when|docs|status|verify","boundary":"무엇은 묻지 않는지","persona":"","ledger":"출처 이름(예: 구로구청 누리집 'OO' 안내)","target_value":"","acceptable_variants":[""],"evidence_quote":"","volatility":"static|annual|event","owner_role":"agency_hq|affiliate|upper_tier","interest":1}]}
owner_role: 그 사실을 실제로 바꿀 수 있는 주체(구청 직접=agency_hq, 구 산하·출연=affiliate, 서울시·정부=upper_tier).`;

const nz = (s: string) => s.replace(/\s+/g, '').replace(/[·ㆍ]/g, '');

async function main() {
  const id = process.argv[2];
  const cfg = CFGS[id];
  if (!cfg) throw new Error(`모듈 설정 없음: ${id} (가능: ${Object.keys(CFGS).join(',')})`);
  const dry = process.argv.includes('--dry');
  const ext = process.argv.includes('--ext');
  const countArg = Number((process.argv.find((a) => a.startsWith('--count=')) ?? '').slice(8));
  if (countArg) cfg.count = countArg;
  // --ext: 기존 문항과 근거 구절이 겹치지 않는 후보만, ID 101번부터, 별도 파일(-ext)로 만든다
  const usedQuotes = new Set<string>();
  if (ext) {
    const gdir = path.resolve('docs/ground-truth/guro');
    for (const f of fs.readdirSync(gdir).filter((x) => x.endsWith('.json'))) {
      const g = JSON.parse(fs.readFileSync(path.join(gdir, f), 'utf-8'));
      for (const e of Object.values<any>(g.entries ?? {})) if (e?.evidence_quote) usedQuotes.add('Q:' + nz(String(e.evidence_quote)));
    }
  }
  const env = fs.readFileSync('.env.local', 'utf-8');
  const apiKey = env.match(/^OPENAI_API_KEY=(.*)$/m)?.[1]?.trim();
  if (!apiKey) throw new Error('OPENAI_API_KEY 필요');
  const client = new OpenAI({ apiKey });

  const pages = loadPages().filter((p) => cfg.titleRe.test(p.crumb) && !(cfg.excludeRe && cfg.excludeRe.test(p.crumb)) && p.body.length > 150);
  const fresh = pages.filter((p) => p.asOf && p.asOf >= MIN_ASOF);
  console.log(`[${id}] 후보 페이지 ${pages.length} / 수정일 ${MIN_ASOF} 이후 ${fresh.length}`);
  if (dry) { for (const p of fresh) console.log(` - ${p.crumb} (${p.asOf}, ${p.body.length}자)`); return; }

  const per = cfg.perPage ?? 5;
  const accepted: Array<{ it: any; p: Page }> = [];
  const rejected: any[] = [];
  let tokIn = 0, tokOut = 0;
  let idx = 0;
  const worker = async () => {
    while (true) {
      const k = idx++;
      if (k >= fresh.length) return;
      const p = fresh[k];
      let items: any[] = [];
      for (let t = 0; t < 3; t++) {
        try {
          const r: any = await (client as any).responses.create({
            model: MODEL,
            instructions: SYSTEM(cfg),
            input: `[페이지 제목] ${p.crumb}\n[URL] ${p.url}\n[수정일] ${p.asOf}\n[페이지 본문]\n${p.body.slice(0, 7000)}\n\n최대 ${per}개 후보. JSON 으로만 출력하세요.`,
            reasoning: { effort: 'low' },
            max_output_tokens: 3000,
            text: { format: { type: 'json_object' } },
          });
          tokIn += r.usage?.input_tokens ?? 0; tokOut += r.usage?.output_tokens ?? 0;
          items = JSON.parse(r.output_text ?? '{}').items ?? [];
          break;
        } catch (e: any) { if (t === 2) console.log(`  API 실패 ${p.url}: ${e?.status ?? ""} ${String(e?.message ?? e).slice(0, 120)}`); await new Promise((s) => setTimeout(s, 1500 * (t + 1))); }
      }
      const bodyN = nz(p.body);
      for (const it of items.slice(0, per)) {
        const why: string[] = [];
        const q = nz(String(it.evidence_quote ?? ''));
        if (!q || q.length < 4 || !bodyN.includes(q)) why.push('quote_not_in_page');
        const val = String(it.target_value ?? '');
        const digits = val.match(/\d[\d,.]*/g) ?? [];
        for (const d of digits) if (q && !nz(String(it.evidence_quote)).includes(d.replace(/,/g, '')) && !nz(String(it.evidence_quote)).includes(d)) why.push(`number_${d}_not_in_quote`);
        const vars: string[] = Array.isArray(it.acceptable_variants) ? it.acceptable_variants.map(String).filter(Boolean) : [];
        if (vars.length < 1) why.push('no_variants');
        if (!/구로/.test(String(it.text ?? ''))) why.push('no_guro_in_text');
        if (/순위|랭킹|1위|최고|베스트|워스트|추천해|이 페이지|위 표/.test(String(it.text ?? ''))) why.push('banned_phrase');
        if (String(it.text ?? '').length < 12) why.push('too_short');
        if (!(Number(it.interest) >= 4)) why.push('low_interest');
        (why.length ? rejected : accepted).push(why.length ? { why, it, url: p.url } : { it, p });
      }
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  console.log(`[${id}] 통과 ${accepted.length} / 폐기 ${rejected.length}  토큰 in=${tokIn} out=${tokOut}`);

  // 페이지별 균등 배분으로 count 개 선택 (같은 페이지에 몰리지 않게)
  const byPage = new Map<string, typeof accepted>();
  for (const a of accepted) (byPage.get(a.p.url) ?? byPage.set(a.p.url, []).get(a.p.url)!).push(a);
  for (const l of byPage.values()) l.sort((x, y) => Number(y.it.interest) - Number(x.it.interest));
  const picked: typeof accepted = [];
  const seenText = new Set<string>(usedQuotes);
  for (let round = 0; picked.length < cfg.count; round++) {
    let any = false;
    for (const [, list] of [...byPage.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const a = list[round];
      if (!a) continue;
      any = true;
      const key = nz(a.it.text);
      const qk = 'Q:' + nz(String(a.it.evidence_quote));
      if (seenText.has(key) || seenText.has(qk)) continue;
      seenText.add(key);
      seenText.add(qk);
      picked.push(a);
      if (picked.length >= cfg.count) break;
    }
    if (!any) break;
  }
  picked.sort((a, b) => a.p.url.localeCompare(b.p.url));

  const rows: Row[] = picked.map((a, i) => ({
    id: `${cfg.prefix}-${String((ext ? 100 : 0) + i + 1).padStart(3, '0')}`,
    persona: cfg.personas.includes(a.it.persona) ? a.it.persona : cfg.personas[i % cfg.personas.length],
    journey: ['find', 'apply', 'cost', 'eligibility', 'where', 'when', 'docs', 'status', 'compare', 'verify'].includes(a.it.journey) ? a.it.journey : 'find',
    text: String(a.it.text).trim(),
    boundary: String(a.it.boundary ?? '').trim() || '질문한 사실 한 가지만. 그 밖의 세부는 묻지 않는다',
    ledger: String(a.it.ledger ?? `구로구청 누리집 '${a.p.crumb.split('-').slice(-1)[0]}' 안내`),
    owner: ['agency_hq', 'affiliate', 'upper_tier'].includes(a.it.owner_role) ? a.it.owner_role : 'agency_hq',
    vol: ['static', 'annual', 'event'].includes(a.it.volatility) ? a.it.volatility : 'annual',
    value: String(a.it.target_value),
    variants: (a.it.acceptable_variants as string[]).map(String).slice(0, 6),
    url: a.p.url,
    quote: String(a.it.evidence_quote),
    asOf: a.p.asOf,
    authority: a.p.dept ? `구로구청 ${a.p.dept}` : '구로구청',
    basis: `구로구청 누리집 ${a.p.crumb.split('-').slice(-1)[0]}`,
    en: false,
  }));
  if (cfg.en) for (let i = 0; i < rows.length && i < cfg.en; i++) rows[Math.floor((i * rows.length) / cfg.en)].en = true;
  if (rows.length < cfg.count) console.log(`[${id}] 경고: 목표 ${cfg.count} 중 ${rows.length}만 확보`);
  fs.writeFileSync(path.resolve('.private', 'guro', `gen-${id}-rejected.json`), JSON.stringify(rejected, null, 2), 'utf-8');
  buildModule({ file: ext ? cfg.file + '-ext' : cfg.file, set: cfg.set, module: cfg.module, audience: cfg.audience }, rows);
}
main().catch((e) => { console.error(e); process.exit(1); });
