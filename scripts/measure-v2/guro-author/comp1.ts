// scripts/measure-v2/guro-author/comp1.ts
// 구로구 비지명 경쟁 질문 세트 1차 (초안) — 사전 등록 전 단계. 아직 측정하지 않았다.
//
// 목적: 질문에 지명이 없을 때 (1) 구로구가 응답에 등장하는가 (2) 등장하면 구로구로 맞게 귀속되는가
//       (3) 등장하지 않을 때 어떤 다른 자치구·지역이 대신 등장하는가 (4) 구로구 관련 내용의 출처가 구청·연결기관인가
//
// 편향 통제
//  - 문항을 '구로구에 유리한 것'만 고르지 않는다. 구로구 자산과의 거리를 사전에 4단계로 선언한다(분석자 추정, 측정 전 고정)
//      anchor     구로구에 대표 자산이 뚜렷하다고 보는 문항 (측정이 제대로 되는지 보는 감도 점검)
//      plausible  구로구가 후보로 나올 수 있다고 보는 문항
//      weak       구로구가 나올 이유가 약하다고 보는 문항 (일반 추천·타 자치구 쪽이 자연스러운 문항)
//      negative   구로구가 나오면 오귀속 후보인 문항 (음성 대조)
//  - 결과를 본 뒤 단계를 바꾸지 않는다. 바꾸려면 새 사전 등록을 쓴다 (INV-11)
//  - 질문 문장에 '구로'·구로구 소재 지명(신도림·고척·가리봉 등)을 넣지 않는다. 'G밸리'는 브랜드명이라 anchor 한 문항에만 둔다
//  - 정답 하나를 묻지 않는다. 추천·후보·소재를 묻는다 → 응답 안에 여러 곳이 등장할 수 있다
//
// 문구: 질문은 AI에게 하는 질문이다. 우리가 순위를 만들지 않는다 (INV-3). 결과는 등장 여부·귀속·분포로만 낸다
//
// 사용: pnpm tsx scripts/measure-v2/guro-author/comp1.ts
import fs from 'fs';
import path from 'path';

type Tier = 'anchor' | 'plausible' | 'weak' | 'negative';
interface C {
  id: string;
  cat: string;
  tier: Tier;
  persona: string;
  text: string;
  // 구로구 소재로 알려진 후보 개체(등장 판정 보조). 공식 페이지에서 확인된 것만. 없으면 빈 배열
  entities: string[];
  basis?: string; // 개체의 근거 URL(구청 누리집)
}
const U = 'https://www.guro.go.kr/www/contents.do?key=';

const rows: C[] = [];
let n = 0;
const add = (cat: string, tier: Tier, persona: string, text: string, entities: string[] = [], basis?: string) =>
  rows.push({ id: `GUR-CMP-${String(++n).padStart(3, '0')}`, cat, tier, persona, text, entities, basis });

// ── I. 산업·창업·입주 (7)
add('산업', 'anchor', '직장인', '서울에서 IT·소프트웨어 기업이 많이 모여 있는 산업단지는 어디인가요?', ['구로디지털', 'G밸리'], U + '2849');
add('산업', 'anchor', '창업자', '서울에서 지식산업센터에 입주해 사무실을 쓸 수 있는 지역은 어디가 있나요?', ['구로디지털', 'G밸리'], U + '2849');
add('산업', 'plausible', '창업자', '서울에서 스타트업이 사무실을 얻기 좋은 지역을 추천해 주세요.');
add('산업', 'plausible', '중소기업 대표', '서울에서 중소기업이 해외 바이어와 만나는 수출 상담회를 지원하는 자치구 사업이 있나요?', ['구로구'], U + '2844');
add('산업', 'plausible', '학생', '서울에서 제조업 공장이 밀집해 있던 지역은 어디이고 지금은 어떻게 바뀌었나요?', ['구로공단', '구로디지털'], U + '2849');
add('산업', 'weak', '투자자', '서울에서 바이오·의료 기업이 입주하기 좋은 지역은 어디인가요?');
add('산업', 'weak', '구직자', '서울에서 외국인 근로자가 많이 일하는 산업단지 주변 지역은 어디인가요?');

// ── II. 관광·여가 (8)
add('관광', 'anchor', '야구 팬', '서울에서 돔구장에서 야구 경기를 볼 수 있는 곳은 어디인가요?', ['고척스카이돔', '고척돔'], U + '2957');
add('관광', 'anchor', '부모', '서울에서 서울시 1호 공립수목원은 어디인가요?', ['푸른수목원'], U + '2792');
add('관광', 'plausible', '부모', '서울에서 아이와 함께 가볼 만한 수목원을 추천해 주세요.', ['푸른수목원'], U + '2792');
add('관광', 'plausible', '산책객', '서울에서 옛 철길을 따라 걸을 수 있는 산책 코스는 어디인가요?', ['항동철길', '항동 철길'], U + '2956');
add('관광', 'plausible', '부모', '서울에서 여름에 아이들과 갈 수 있는 하천 물놀이장은 어디가 있나요?', ['안양천'], U + '2945');
add('관광', 'weak', '방문자', '서울에서 가을에 걷기 좋은 둘레길을 추천해 주세요.', ['개웅산'], U + '2982');
add('관광', 'weak', '사진 애호가', '서울에서 여름에 연꽃을 볼 수 있는 곳은 어디인가요?', ['궁동생태공원'], U + '2960');
add('관광', 'weak', '방문자', '서울에서 산림형 올레길 코스를 걸을 수 있는 곳은 어디인가요?', ['올레길'], U + '2955');

// ── III. 거주·생활 (6)
add('거주', 'plausible', '직장인', '서울 서남권에서 출퇴근하기 편한 동네를 추천해 주세요.');
add('거주', 'plausible', '직장인', '서울에서 지하철 1호선과 7호선이 함께 지나는 지역은 어디인가요?');
add('거주', 'plausible', '외국인', '서울에서 외국인이 많이 사는 동네는 어디인가요?');
add('거주', 'weak', '신혼부부', '서울에서 신혼부부가 살기 좋은 자치구를 추천해 주세요.');
add('거주', 'weak', '부모', '서울에서 아이 키우기 좋은 자치구를 추천해 주세요.');
add('거주', 'weak', '1인 가구', '서울에서 1인 가구가 월세 부담이 상대적으로 적은 지역은 어디인가요?');

// ── IV. 문화·외국인·역사 (6)
add('문화', 'anchor', '서울 방문자', '서울에서 아시아 여러 나라 문화를 함께 즐길 수 있는 지역 축제가 있나요?', ['G페스티벌', 'G 페스티벌'], U + '2976');
add('문화', 'plausible', '외국인', '서울에서 외국인 주민이 한국어를 무료로 배울 수 있는 곳은 어디인가요?');
add('문화', 'plausible', '다문화가족', '서울에서 다문화가족이 받을 수 있는 자치구 지원 프로그램에는 무엇이 있나요?');
add('문화', 'plausible', '주민', '서울에서 저렴하게 공연을 볼 수 있는 구립 공연장은 어디인가요?', ['구로아트밸리', '오류아트홀'], U + '2926');
add('문화', 'weak', '서울 방문자', '서울에서 가볼 만한 지역 축제를 추천해 주세요.', ['G페스티벌'], U + '2976');
add('문화', 'weak', '학생', '서울에서 산업화와 공단의 역사를 볼 수 있는 박물관이나 전시관은 어디인가요?', ['G밸리산업박물관'], U + '2992');

// ── V. 자치구 행정서비스·정책 사례 (7)
add('행정', 'plausible', '주민', '서울에서 안심귀가 서비스를 운영하는 자치구에는 어디가 있나요?', ['안심귀가스카우트'], U + '2526');
add('행정', 'weak', '청년', '서울에서 청년 자산 형성 통장 사업을 운영하는 자치구에는 어디가 있나요?', ['희망두배청년통장'], U + '2239');
add('행정', 'weak', '주민', '서울에서 지역사랑상품권을 할인된 가격에 살 수 있는 자치구 사례를 알려 주세요.', ['구로사랑상품권'], U + '4586');
add('행정', 'weak', '장애인 가족', '서울에서 장애인 바우처택시를 지원하는 자치구에는 어디가 있나요?', ['바우처택시'], U + '2286');
add('행정', 'weak', '주민', '서울에서 구청장에게 직접 의견을 낼 수 있는 온라인 창구가 있는 자치구는 어디인가요?', ['구청장에게 바란다'], 'https://www.guro.go.kr/www/index.do');
add('행정', 'weak', '주민', '서울에서 장난감을 빌려 쓸 수 있는 자치구 장난감 대여 서비스는 어디에 있나요?', ['장난감나라'], 'https://www.guro.go.kr/www/sub.do?key=1849');
add('행정', 'weak', '주민', '서울에서 무인민원발급기로 가족관계증명서를 뗄 수 있는 곳은 어디인가요?');

// ── VI. 음성 대조 (4)
add('대조', 'negative', '서울 방문자', '서울에서 스키장을 이용할 수 있는 곳은 어디인가요?');
add('대조', 'negative', '서울 방문자', '서울에서 해수욕을 할 수 있는 해수욕장은 어디인가요?');
add('대조', 'negative', '서울 방문자', '서울에서 유네스코 세계유산을 볼 수 있는 곳은 어디인가요?');
add('대조', 'negative', '서울 방문자', '서울에서 한옥마을을 체험할 수 있는 곳은 어디인가요?');

// ── 검증
const ids = new Set<string>();
for (const r of rows) {
  if (ids.has(r.id)) throw new Error(`중복 ${r.id}`);
  ids.add(r.id);
  if (/구로|신도림|고척|가리봉|항동|궁동|오류동|개봉/.test(r.text)) throw new Error(`지명 포함 ${r.id}: ${r.text}`);
  if (/순위|랭킹|등급|1위|최하위|베스트|워스트|가장 좋은|최고/.test(r.text)) throw new Error(`금지 표현 ${r.id}`);
}
const byTier = rows.reduce((m: Record<string, number>, r) => ((m[r.tier] = (m[r.tier] ?? 0) + 1), m), {});
const byCat = rows.reduce((m: Record<string, number>, r) => ((m[r.cat] = (m[r.cat] ?? 0) + 1), m), {});

const out = path.resolve('docs/aeo-questions/guro-comp1');
fs.mkdirSync(out, { recursive: true });
const doc = {
  set: 'guro_comp1_unnamed_competition_draft',
  agency_handle: 'AG-0017',
  population: 'local_gov',
  status: 'draft_preregistration_pending',
  robustness: 'not_checked',
  method_version: 'v2.3',
  tier_declared_at: '2026-10-08',
  tier_note: 'anchor/plausible/weak/negative 는 분석자 추정이며 측정 전에 고정한다. 결과를 본 뒤 바꾸지 않는다(INV-11).',
  counts: { total: rows.length, by_tier: byTier, by_category: byCat },
  questions: rows.map((r) => ({
    id: r.id, revision: 1, status: 'draft', module: 'B6', audience: 'probe', named: false, persona: r.persona, journey: 'find',
    text: r.text, type: 'descriptive', category: r.cat, expected_tier: r.tier,
    layers: ['access', 'readability', 'citation'], usable: false, // 사전 등록·강건성 검사 전까지 측정 불가
    ledger_entities: r.entities, entity_basis_url: r.basis ?? null,
    note: r.tier === 'negative' ? '구로구가 등장하면 오귀속 후보. 등장하지 않는 것을 증명할 수는 없다' : '등장 여부·귀속·경쟁 분포만 본다. 등장하지 않는 것이 오류라는 뜻이 아니다',
  })),
};
fs.writeFileSync(path.join(out, 'questions.json'), JSON.stringify(doc, null, 2) + '\n', 'utf-8');
console.log(`비지명 경쟁 질문 초안: ${rows.length}문항`, byTier, byCat);
