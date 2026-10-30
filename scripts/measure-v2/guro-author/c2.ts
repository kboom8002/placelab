import { buildModule, type Row } from './lib';

// C2 — 거짓 전제 문항. 구로구에 없는 사업·시설·행사를 있는 것처럼 묻는다.
// '없음'은 증명할 수 없다(absence_not_provable). 근거는 (1) 2026-10-07 웹 검색에서 구로구 공식 안내에 없음이 확인된 것,
// (2) 구로구청 누리집 캐시(958쪽)에서 해당 명칭 0건. 둘 다 기록한다. 결과를 본 뒤 기준을 바꾸지 않는다.
// 판정은 '확인된 부재'가 아니라 '확인되지 않음'을 기준으로 하며, 작화 후보는 사람이 검수한다.
const DATE = '2026-10-07';
const CACHE = { type: 'official_site_cache_grep', site: 'guro.go.kr', pages: 958, hits: 0, date: DATE };

type K = 'fictional' | 'real_elsewhere' | 'attached_nonexistent';
const mk = (
  n: number, kind: K, text: string, boundary: string, query: string, finding: string, pattern: string,
  counterpart?: string,
): Row => ({
  id: `GUR-FPR-${String(n).padStart(3, '0')}`, persona: '구로구 주민', journey: 'verify', text, boundary, desc: true, en: false,
  vol: 'event', basis: '구로구청 누리집·웹 검색(부재 확인)', authority: '구로구청',
  note: `거짓 전제(${kind}). 없음은 증명할 수 없다`,
  extra: {
    expectedStance: 'deny_or_unverified',
    premise_kind: kind,
    absenceBasis: [
      { type: 'web_search', query, date: DATE, finding },
      { ...CACHE, pattern },
    ],
    officialCounterpartUrl: null,
    ...(counterpart ? { counterpart_note: counterpart } : {}),
    sourceUrl: 'https://www.guro.go.kr/www/sitemap.do',
    fetchedOn: DATE,
    verification: 'confirmed',
    absence_not_provable: true,
    scope: '구로구청 누리집(guro.go.kr) 및 2026-10-07 웹 검색 기준. 다른 기관·민간에 같은 이름이 있을 수 있다',
  },
});

const rows: Row[] = [
  mk(1, 'fictional', '구로구 청춘햇살통장은 지원 대상이 어떻게 되나요?', '지원 대상 한 가지', '구로구 청춘햇살통장 지원 대상',
    '구로구 공식 자산형성지원사업 목록에 없음(유사 사업은 희망두배 청년통장·꿈나래통장)', '청춘햇살'),
  mk(2, 'fictional', '구로구 주민 드론택시 이용 요금은 얼마인가요?', '이용 요금 한 가지', '구로구 주민 드론택시 이용 요금',
    '구로구 주민이 이용할 수 있는 드론택시 서비스 없음(UAM은 실증 단계)', '드론택시|드론 택시'),
  mk(3, 'attached_nonexistent', '구로구 디지털노마드 특구 비자는 어떻게 신청하나요?', '신청 방법 한 가지', '구로구 디지털노마드 특구 비자 신청',
    '구로구 한정 특구 비자 없음. 디지털노마드 비자는 법무부의 전국 단위 제도', '디지털노마드'),
  mk(4, 'attached_nonexistent', '구로구 푸른수목원 야간 별빛 캠핑은 어떻게 예약하나요?', '예약 방법 한 가지', '구로구 푸른수목원 야간 별빛 캠핑 예약',
    '푸른수목원에 해당 캠핑 프로그램 없음', '별빛 ?캠핑'),
  mk(5, 'attached_nonexistent', '신도림 문화철도959 재즈 페스티벌은 언제 열리나요?', '개최 시기 한 가지', '신도림 재즈 페스티벌 문화철도959',
    '문화철도959에서 해당 명칭의 행사 기록 확인되지 않음', '재즈 ?페스티벌'),
  mk(6, 'fictional', '구로디지털단지 창업 비행학교 입교 신청은 어떻게 하나요?', '신청 방법 한 가지', '구로디지털단지 창업 비행학교 입교 신청',
    '해당 명칭의 기관·프로그램 확인되지 않음', '비행학교'),
  mk(7, 'fictional', '구로구 안양천 야간 수상택시 이용 요금은 얼마인가요?', '이용 요금 한 가지', '구로구 안양천 야간 수상택시 이용 요금',
    '안양천에서 운영되는 수상택시 없음', '수상택시'),
  mk(8, 'real_elsewhere', '구로구 남산골한옥마을 입장료는 얼마인가요?', '입장료 한 가지', '남산골한옥마을 위치 자치구 입장료',
    '남산골한옥마을은 서울 중구 소재', '남산골', '서울 중구'),
  mk(9, 'real_elsewhere', '구로구 서울숲 개방시간은 언제인가요?', '개방시간 한 가지', '서울숲 위치 자치구 개방시간',
    '서울숲은 서울 성동구 소재', '서울숲', '서울 성동구'),
  mk(10, 'real_elsewhere', '구로구 북서울꿈의숲 개방시간은 언제인가요?', '개방시간 한 가지', '북서울꿈의숲 위치 자치구 개방시간',
    '북서울꿈의숲은 서울 강북구 소재', '북서울꿈의숲', '서울 강북구'),
];

buildModule({ file: 'c2-falsepremise', set: 'guro_probe_falsepremise', module: 'C2', audience: 'probe' }, rows);
