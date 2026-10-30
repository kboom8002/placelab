import { buildModule, type Row } from './lib';

const U = 'https://www.guro.go.kr/www/contents.do?key=';
// B6 — 무지명 노출 탐침. 문장에 '구로' 가 없다. '구로구를 좋게/나쁘게 말하는가'가 아니라
// '구로구의 사실이 중립 질문에서 등장하는가'만 본다. 추천·최고 표현 금지. 서술형(값 판정 없음).
// expectedMentions 중 하나라도 응답 원문에 있으면 '등장'. 이 값은 정답 값이 아니라 등장 표기 후보다.
const pos = (
  n: number, persona: string, journey: string, text: string, boundary: string,
  mentions: string[], url: string, quote: string,
): Row => ({
  id: `GUR-OPP-${String(n).padStart(3, '0')}`, persona, journey, text, boundary, desc: true, en: false,
  vol: 'static', basis: '구로구청 누리집', authority: '구로구청',
  extra: {
    expectedMentions: mentions, expectedPresent: true,
    basis_url: url, basis_quote: quote, fetchedOn: '2026-10-07', verification: 'confirmed',
    note: '등장 여부만 본다. 등장하지 않는 것이 오류라는 뜻이 아니다.',
  },
});

const neg = (n: number, text: string, boundary: string): Row => ({
  id: `GUR-OPP-${String(n).padStart(3, '0')}`, persona: '서울 방문자', journey: 'find', text, boundary, desc: true, en: false,
  vol: 'static', basis: '구로구청 누리집(九景 목록)', authority: '구로구청',
  note: '음성 대조: 구로구 명소 목록(九景)에 해당 유형이 없다. 구로가 등장하면 오귀속 후보',
  extra: {
    expectedMentions: ['구로'], expectedPresent: false,
    basis_url: U + '2994', basis_quote: '푸른수목원·항동기찻길 안양천 산책로 명품 구로올레길', fetchedOn: '2026-10-07',
    verification: 'confirmed', absence_not_provable: true, negative_control: true,
  },
});

const rows: Row[] = [
  pos(1, '학생', 'find', '서울에서 우리나라 최초의 국가산업단지로 소개되는 곳은 어디인가요?', '지역 이름 한 가지. 조성 연도·규모는 묻지 않는다',
    ['구로'], U + '2849', '우리나라 최초의 국가산업단지로 현재는'),
  pos(2, '직장인', 'find', '서울에서 IT·벤처 기업이 많이 모여 있는 디지털단지는 어디에 있나요?', '지역 소개까지. 입주 방법·비용은 묻지 않는다',
    ['구로'], U + '2849', '2000년도 이후 첨단기술·벤처 등 지식정보 산업중심의 첨단 디지털단지로 탈바꿈'),
  pos(3, '학생', 'find', '서울에서 한국수출산업공단이 있었던 곳은 어디인가요?', '지역 이름 한 가지',
    ['구로'], U + '2100', '그 중심지는 구로동의 한국수출산업공단이었으며'),
  pos(4, '방문자', 'find', '서울시 1호 공립수목원은 어디에 있나요?', '수목원 이름·위치 한 가지. 개방시간은 묻지 않는다',
    ['푸른수목원', '항동'], U + '2792', '2018년 서울시 1호 공립수목원으로 지정되었습니다'),
  pos(5, '방문자', 'find', '서울에서 옛 비료회사 기찻길을 걸어 볼 수 있는 곳이 있나요?', '장소 이름 한 가지',
    ['항동'], U + '2956', '1954년 비료회사가 운반을 위해 설치한 단선철도'),
  pos(6, '방문자', 'find', '서울 신도림역 안에 있는 문화 공간은 무엇인가요?', '공간 이름 한 가지',
    ['문화철도'], U + '2959', '신도림 역사 내에 위치한'),
  pos(7, '방문자', 'where', '서울 신도림에 있는 오페라하우스 야외극장은 어디에 있나요?', '위치(주소) 한 가지',
    ['새말로', '구로'], U + '2931', '위치 서울시 구로구 새말로 97'),
  pos(8, '역사 애호가', 'find', '조선 선조의 딸 정선옹주 묘역이 있는 서울의 생태공원은 어디인가요?', '장소 이름 한 가지',
    ['궁동', '구로'], U + '2994', '정선옹주는 조선 제 14대 임금 선조의 7녀로'),
  pos(9, '방문자', 'where', '서울 개웅산 한바퀴 둘레길은 어느 자치구에 있나요?', '자치구 이름 한 가지',
    ['구로'], U + '2982', '개봉3동32-33번지 일대(대표지번)“개웅산”'),
  pos(10, '직장인', 'where', 'G밸리산업박물관은 어디에 있나요?', '위치 한 가지. 관람 방법은 묻지 않는다',
    ['디지털로26길', 'G-Tower', 'G타워', '구로'], U + '2992', '주소 : 서울시 구로구 디지털로26길 38, G-Tower 3층'),
  pos(11, '방문자', 'find', '서울에서 산림형 올레길 코스를 걸을 수 있는 곳은 어디인가요?', '지역 한 가지. 코스 길이는 묻지 않는다',
    ['구로'], U + '2955', '총 10.5km의 코스이지만'),
  pos(12, '방문자', 'where', '구일역 1번 출구에서 가까운 하천 산책로는 어디인가요?', '하천 이름 한 가지',
    ['안양천'], U + '2987', '구일역 1번 출구 나와서 도보'),
  neg(13, '서울에서 해수욕을 할 수 있는 해수욕장은 어디인가요?', '해수욕장 이름. 구로구 안내에 없는 유형(음성 대조)'),
  neg(14, '서울에서 케이블카를 타고 오를 수 있는 산은 어디인가요?', '산 이름. 구로구 안내에 없는 유형(음성 대조)'),
];

buildModule({ file: 'b6-opportunity', set: 'guro_probe_unnamed', module: 'B6', audience: 'probe' }, rows);
