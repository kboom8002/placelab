// scripts/measure-v2/guro-author/supp1.ts
// 구로구 보완 질문 1차(탐색적) — 본측정 문항 세트(all.json, 사전등록 해시 고정)와 분리해서 둔다.
//
// 성격
//  - 사전 등록 없음 → 결과는 '탐색적'으로만 쓴다 (INV-11). 강건성 미검사 (INV-10) → 공표·전달 불가
//  - 수요 근거: 구청 누리집 '주요업무별 전화번호'(key=4642, 콘텐츠수정일 2026.08.10)의 '주요민원업무' 목록을
//    구청 스스로 꼽은 민원 수요의 대리 지표로 쓰고, 그 안에서 생활 민원 빈도는 분석자가 추정했다(미검증).
//    실제 민원 통계(국민신문고·120·콜센터 분류)로 검증한 것이 아니다.
//  - 사실(값·근거 구절·URL)은 .private/guro/pages/ 에 캐시한 구로구청 누리집 페이지에서 읽은 것만 쓴다.
//  - 문항 ID 접두 GUR-SX1- 는 본측정 ID 와 겹치지 않는다. 폐기 ID 재사용 금지 규칙은 동일하게 적용한다.
//
// 판정 유형
//  route    : 민원 연결 — 담당 부서명 또는 대표번호가 맞는가 (다른 정상 경로 언급은 별도 표기)
//  fact     : 값 — 원장 값/허용 변형이 있는가
//  variant2 : 누리집 안에 두 표현이 공존 — 어느 쪽을 말했는지 기록 (원장 상충, 정오 판정 안 함)
//  coverage : 공식 목록 중 몇 개가 등장하는가 (분포로만 보고, 점수화하지 않는다)
//  mention  : 무지명 탐침 — 개체(장소·사업) 등장 / 구로구 귀속 등장을 따로 본다. 등장하지 않는 것이 오류는 아니다
//  negative : 음성 대조 — 구로가 등장하면 오귀속 후보
//
// 사용: pnpm tsx scripts/measure-v2/guro-author/supp1.ts
import fs from 'fs';
import path from 'path';

const U = 'https://www.guro.go.kr/www/contents.do?key=';
const DIR = U + '4642'; // 주요업무별 전화번호 (콘텐츠수정일 2026.08.10)
const DIR_AS_OF = '2026-08-10';

type Kind = 'route' | 'fact' | 'variant2' | 'coverage' | 'mention' | 'negative';
interface SQ {
  id: string;
  group: 'demand_route' | 'representation' | 'unnamed_probe';
  audience: 'resident' | 'external' | 'probe';
  persona: string;
  text: string;
  kind: Kind;
  ledger: Record<string, unknown>;
}

const route = (n: number, persona: string, text: string, dept: string[], phone: string, quote: string): SQ => ({
  id: `GUR-SX1-${String(n).padStart(3, '0')}`,
  group: 'demand_route',
  audience: 'resident',
  persona,
  text,
  kind: 'route',
  ledger: {
    dept,
    phone: [phone, phone.replace('02-', '')],
    alt_channels: ['120', '다산콜', '안전신문고', '국민신문고', '동주민센터', '주민센터', '정부24', '860-2114'],
    sourceUrl: DIR,
    asOfSource: DIR_AS_OF,
    evidence_quote: quote,
    demand_basis: '구청 주요업무별 전화번호의 주요민원업무 + 분석자 추정(미검증)',
  },
});

const probe = (n: number, persona: string, text: string, entity: string[], district: string[], url: string, quote: string, note = ''): SQ => ({
  id: `GUR-SX1-${String(n).padStart(3, '0')}`,
  group: 'unnamed_probe',
  audience: 'probe',
  persona,
  text,
  kind: 'mention',
  ledger: { entity, district, sourceUrl: url, evidence_quote: quote, note: note || '등장 여부만 본다. 등장하지 않는 것이 오류라는 뜻이 아니다.' },
});

const qs: SQ[] = [
  // ── A. 민원 수요(추정) → 연결 경로 14 ─────────────────────────────
  route(1, '구로구 주민', '구로구에서 집 앞에 불법주정차된 차 때문에 민원을 넣고 싶은데, 구청 어느 부서에 연락하면 되나요?', ['주차관리과'], '02-860-2086', '불법주정차 위반 단속, 불법주정차 위반 과태료 주차관리과 02-860-2086'),
  route(2, '구로구 주민', '구로구에서 근처 공사장 소음이 너무 심하면 구청 어디에 민원을 넣어야 하나요?', ['환경과'], '02-860-2370', '환경 민원(소음, 대기, 수질, 토양 … 환경과 02-860-2370'),
  route(3, '구로구 주민', '구로구청에서 여권을 새로 만들려면 어느 부서로 가야 하고 문의 전화번호는 몇 번인가요?', ['민원여권과'], '02-860-2219', '여권 발급, 여권 관련 증명서 … 민원여권과 02-860-2219'),
  route(4, '구로구 주민 자녀', '구로구에 사시는 부모님 기초연금 신청 문제로 구청에 문의하려면 어느 부서에 연락하나요?', ['어르신복지과'], '02-860-2444', '노인복지, 기초연금, 노인일자리사업 … 어르신복지과 02-860-2444'),
  route(5, '구로구 직장인', '구로구 보건소에서 보건증(건강진단결과서) 발급 문의는 어디로 전화하면 되나요?', ['보건소민원실', '보건소 민원실'], '02-860-2426', '건강진단결과서(구-보건증), 건강진단서 발급 보건소민원실 02-860-2426'),
  route(6, '구로구 주민', '구로구에서 동네 길고양이나 유기동물 관련 민원은 구청 어느 부서에 하나요?', ['질병관리과'], '02-860-3040', '유기동물, 길고양이관리 질병관리과 02-860-3040'),
  route(7, '구로구 주민', '구로구에서 지방세가 체납됐는데 문의는 어느 부서로 해야 하나요?', ['징수과'], '02-860-2111', '지방세 체납 … 징수과 02-860-2111'),
  route(8, '구로구 주민', '구로구 재산세에 대해 물어보려면 구청 어느 부서, 몇 번으로 전화하나요?', ['재산세과'], '02-860-2112', '재산세, 부동산 취득세 … 재산세과 02-860-2112'),
  route(9, '구로구 주민', '구로구에서 보도블록이 깨져 있거나 도로가 파손된 곳을 신고하려면 구청 어느 부서에 연락하나요?', ['도로과'], '02-860-2405', '도로개설․굴착․복구 도로 보도 관리 도로과 02-860-2405'),
  route(10, '구로구 주민', '구로구에서 불법 현수막이나 불법 광고물을 신고하려면 구청 어디에 연락하나요?', ['가로경관과'], '02-860-2400', '불법광고물, 현수막 … 가로경관과 02-860-2400'),
  route(11, '구로구 부모', '구로구에서 어린이집 보육료나 양육수당 문의는 구청 어느 부서로 하나요?', ['가족보육과'], '02-860-2090', '보육시설, 어린이집, 보육료, 양육수당 … 가족보육과 02-860-2090'),
  route(12, '구로구 주민', '구로구 식당에서 식중독이 의심되거나 위생 문제가 있으면 구청 어디에 신고하나요?', ['위생과'], '02-860-2360', '식품접객업 … 식중독, 모범음식점 위생과 02-860-2360'),
  route(13, '구로구 주민', '구로구에서 위반건축물을 신고하려면 구청 어느 부서에 해야 하나요?', ['주택과'], '02-860-2380', '위반건축물 단속, 무허가건축물 … 주택과 02-860-2380'),
  route(14, '구로구 주민', '구로구민안전보험은 구청 어느 부서에서 담당하나요?', ['도시안전과'], '02-860-2089', '구민안전보험, 그늘막, 민방위 … 도시안전과 02-860-2089'),

  // ── B. 구정 대표성 6 ──────────────────────────────────────────
  {
    id: 'GUR-SX1-015', group: 'representation', audience: 'resident', persona: '구로구 주민', kind: 'fact',
    text: '지금 구로구청장은 누구인가요?',
    ledger: { targetValue: '장인홍', acceptableVariants: ['장인홍'], sourceUrl: U + '1809', evidence_quote: '장인홍 구청장 전화번호 02-860-2323', volatility: 'event' },
  },
  {
    id: 'GUR-SX1-016', group: 'representation', audience: 'resident', persona: '구로구 주민', kind: 'variant2',
    text: '구로구의 구정 슬로건(구정 목표)은 무엇인가요?',
    ledger: {
      variants: { A: ['따뜻한 동행', '변화하는 구로'], B: ['더 나은 내일', '더나은 내일', '함께 여는 구로', '함께여는 구로'] },
      sources: [
        { url: U + '1961', quote: '“따뜻한 동행, 변화하는 구로” 라는 민선 8기 구정 슬로건' },
        { url: U + '2029', quote: '"따뜻한 동행, 변화하는 구로"의 구정목표와 부합되는지' },
        { url: U + '1998', quote: '"더 나은 내일, 함께 여는 구로"라는 구정목표를 실현해' },
        { url: U + '2070', quote: '민선자치8기(장인홍 구청장)를 맞이하여「더나은 내일, 함께여는 구로」라는 구정목표' },
        // 응답을 본 뒤(2026-10-07) 보도자료 게시판에서 추가 확인 — 탐색 측정이라 기록을 남기고 보정한다
        { url: 'https://www.guro.go.kr/www/selectBbsNttList.do?bbsNo=665&key=1793&searchCnd=SJ&searchKrwd=%EC%8A%AC%EB%A1%9C%EA%B1%B4', quote: '새 구호(슬로건) … 더 나은 내일, 함께 여는 구로 … 확정 2025.05.07' },
        { url: 'https://www.guro.go.kr/www/selectBbsNttList.do?bbsNo=665&key=1793&searchCnd=SJ&searchKrwd=%EC%8A%AC%EB%A1%9C%EA%B1%B4', quote: '따뜻한 동행, 변화하는 구로 … 민선8기 슬로건 확정(2022.7.15.)' },
      ],
      current: 'B',
      note: '누리집 안에서 두 표현이 공존한다(누리집 머리 영역은 A). 보도자료상 A=2022-07 민선8기 슬로건, B=2025-05-07 확정 새 구호 → 현행은 B. B 를 이 문항의 현행 값으로 본다(응답 확인 후 보정, 기록 남김)',
    },
  },
  {
    id: 'GUR-SX1-017', group: 'representation', audience: 'external', persona: '서울 방문자', kind: 'fact',
    text: '구로구의 대표 지역 축제는 무엇인가요?',
    ledger: { targetValue: 'G페스티벌', acceptableVariants: ['G페스티벌', 'G 페스티벌', 'G-페스티벌', '지페스티벌', '구로G페스티벌'], sourceUrl: U + '2976', evidence_quote: "기존 지역대표 축제인 ‘점프!구로”와 ’아시아문화축제’를 하나로 통합한 G페스티벌" },
  },
  {
    id: 'GUR-SX1-018', group: 'representation', audience: 'resident', persona: '구로구 주민', kind: 'fact',
    text: '구로사랑상품권은 살 때 몇 퍼센트 할인되나요?',
    ledger: { targetValue: '5%', acceptableVariants: ['5%', '5 %', '5퍼센트'], sourceUrl: U + '4586', evidence_quote: '구로사랑상품권 할인혜택(2026년 7월 발행분 기준) - 상품권 구매 시 5% 할인', asOfSource: '2026-07', volatility: 'event', note: '발행분마다 바뀐다. 다른 값이 과거·다른 발행분일 수 있어 불일치는 사람 확인' },
  },
  {
    id: 'GUR-SX1-019', group: 'representation', audience: 'external', persona: '서울 방문자', kind: 'coverage',
    text: '구로구에 가볼 만한 명소에는 어떤 곳이 있나요?',
    ledger: {
      items: {
        고척스카이돔: ['고척스카이돔', '고척돔'],
        푸른수목원: ['푸른수목원'],
        구로디지털산업단지: ['구로디지털', 'G밸리', '지밸리'],
        G페스티벌: ['G페스티벌', 'G 페스티벌'],
        구로아트밸리예술극장: ['구로아트밸리'],
        신도림역세권: ['신도림'],
        남구로시장: ['남구로시장'],
        궁동생태공원: ['궁동생태공원'],
        명품올레길: ['올레길'],
        개웅산한바퀴: ['개웅산'],
        가리봉동측백나무: ['측백나무'],
        오류아트홀: ['오류아트홀'],
        항동철길: ['항동철길', '항동 철길', '항동기찻길'],
        안양천: ['안양천'],
      },
      sourceUrl: U + '2973',
      evidence_quote: '고척스카이돔 항동푸른수목원 구로디지털산업단지 G페스티벌 구로아트밸리예술극장 신도림역세권 남구로시장 궁동생태공원 구로 명품올레길 개웅산 한바퀴(둘레길) 가리봉동 측백나무 제례행사 오류아트홀',
      note: '구로자랑거리 12곳 + 九景의 항동기찻길·안양천. 다른 구의 명소를 구로구로 소개하면 오귀속(사람 확인)',
    },
  },
  {
    id: 'GUR-SX1-020', group: 'representation', audience: 'resident', persona: '구로구 주민', kind: 'fact',
    text: '구로구청장에게 직접 건의하거나 의견을 내고 싶으면 어떻게 하나요?',
    ledger: { targetValue: '구청장에게 바란다', acceptableVariants: ['구청장에게 바란다', '열린구청장실', '열린 구청장실'], sourceUrl: 'https://www.guro.go.kr/www/index.do', evidence_quote: '구청장에게 바란다 열린 구청장실 매니페스토 (공약)' },
  },

  // ── C. 무지명 시나리오 탐침 9 + 음성 대조 1 ─────────────────────
  probe(21, '창업자', '서울에서 IT 스타트업 사무실을 알아보려는데, 기업이 많이 모인 산업단지로는 어떤 곳이 있나요?', ['구로디지털', 'G밸리', '지밸리', '구로'], ['구로'], U + '2849', '2000년도 이후 첨단기술·벤처 등 지식정보 산업중심의 첨단 디지털단지로 탈바꿈', 'G밸리는 구로구·금천구에 걸친다(금천 언급은 오귀속 아님)'),
  probe(22, '야구 팬', '서울에서 돔구장에서 야구 경기를 볼 수 있는 곳은 어디인가요?', ['고척'], ['구로'], U + '2957', '서울 구로구 고척동'),
  probe(23, '부모', '서울에서 아이와 함께 가볼 만한 수목원에는 어떤 곳이 있나요?', ['푸른수목원'], ['구로', '항동'], U + '2792', '2018년 서울시 1호 공립수목원으로 지정되었습니다'),
  probe(24, '부모', '서울에서 여름에 아이들과 갈 수 있는 하천 물놀이장에는 어떤 곳이 있나요?', ['안양천'], ['구로', '오금교'], U + '2945', '위 치 : 안양천 우안 둔치(오금교 아래)', '안양천은 여러 자치구를 지난다. 구로구 시설로 귀속했는지가 관심'),
  probe(25, '산책객', '서울에서 옛 철길을 따라 걸을 수 있는 산책 코스에는 어떤 곳이 있나요?', ['항동'], ['구로'], U + '2956', '1954년 비료회사가 운반을 위해 설치한 단선철도'),
  probe(26, '사진 애호가', '서울에서 여름에 연꽃을 볼 수 있는 공원에는 어떤 곳이 있나요?', ['궁동'], ['구로'], U + '2960', '7-8월이면 이 저수지 위에 가득한 연꽃들이 만개한다고 하니'),
  probe(27, '학생', '서울에서 우리나라 산업화와 공단의 역사를 볼 수 있는 박물관이 있나요?', ['G밸리산업박물관', 'G밸리 산업박물관', '지밸리산업박물관', '지밸리 산업박물관'], ['구로'], U + '2992', '주소 : 서울시 구로구 디지털로26길 38, G-Tower 3층'),
  probe(28, '중소기업 대표', '서울에서 중소기업이 해외 바이어와 만나는 수출 상담회를 지원하는 자치구 사업이 있나요?', ['구로'], ['구로'], U + '2844', '해외 판로개척을 희망하는 G밸리 소재 중소기업'),
  probe(29, '서울 방문자', '서울에서 아시아 여러 나라 문화를 함께 즐길 수 있는 지역 축제가 있나요?', ['G페스티벌', 'G 페스티벌', '지페스티벌', 'G-페스티벌'], ['구로'], U + '2976', "’아시아문화축제’를 하나로 통합한 G페스티벌"),
  {
    id: 'GUR-SX1-030', group: 'unnamed_probe', audience: 'probe', persona: '서울 방문자', kind: 'negative',
    text: '서울에서 스키장을 이용할 수 있는 곳은 어디인가요?',
    ledger: { entity: ['구로'], district: ['구로'], expectedPresent: false, sourceUrl: U + '2973', evidence_quote: '구로자랑거리 목록에 스키장 없음', absence_not_provable: true, note: '음성 대조. 구로가 등장하면 오귀속 후보' },
  },
];

const ids = new Set<string>();
for (const q of qs) {
  if (ids.has(q.id)) throw new Error(`중복 ID ${q.id}`);
  ids.add(q.id);
  if ((q.group !== 'unnamed_probe') !== /구로/.test(q.text)) throw new Error(`지명 규칙 위반 ${q.id}`);
}

const out = path.resolve('docs/aeo-questions/guro-supp1');
fs.mkdirSync(out, { recursive: true });
const doc = {
  set: 'guro_supp1_exploratory',
  agency_handle: 'AG-0017',
  population: 'local_gov',
  status: 'exploratory_no_prereg',
  robustness: 'not_checked',
  reference_date: '2026-10-07',
  method_version: 'v2.3',
  note: '탐색적(사전 등록 없음)·강건성 미검사. 공표·외부 전달 불가. 본측정(PR-2026Q4-GURO-OAI-WS-KO)과 합산하지 않는다.',
  questions: qs.map(({ ledger, ...q }) => ({ ...q, named: q.group !== 'unnamed_probe', usable: true, status: 'active' })),
};
const gt = { unitId: 'guro', agency_handle: 'AG-0017', set: doc.set, fetchedOn: '2026-10-07', entries: Object.fromEntries(qs.map((q) => [q.id, { kind: q.kind, verification: 'confirmed', ...q.ledger }])) };
fs.writeFileSync(path.join(out, 'questions.json'), JSON.stringify(doc, null, 2) + '\n', 'utf-8');
fs.writeFileSync(path.join(out, 'ground-truth.json'), JSON.stringify(gt, null, 2) + '\n', 'utf-8');
console.log(`보완 1차: ${qs.length}문항 → docs/aeo-questions/guro-supp1/`, Object.entries(qs.reduce((m: any, q) => ((m[q.group] = (m[q.group] ?? 0) + 1), m), {})));
