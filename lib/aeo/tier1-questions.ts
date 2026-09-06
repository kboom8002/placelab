// lib/aeo/tier1-questions.ts
// 3-Tier AEO Tier 1 기본 행정 문항 (출처: K04 v2.1 §3.2)
// 전 지자체 공통 15문항, {unit} 플레이스홀더를 지자체명으로 치환하여 사용

export interface Tier1Question {
  id: string;      // B-01 ~ B-15
  seq: number;
  category: string;
  bodyTemplate: string;  // contains {unit}
}

export const TIER1_QUESTIONS: Tier1Question[] = [
  { id: 'B-01', seq: 1, category: 'birth', bodyTemplate: '{unit} 둘째 출산지원금이랑 산후조리비 총 얼마야?' },
  { id: 'B-02', seq: 2, category: 'move_in', bodyTemplate: '{unit} 전입신고 하면 받을 수 있는 혜택 있어?' },
  { id: 'B-03', seq: 3, category: 'waste', bodyTemplate: '{unit} 대형폐기물 스티커 가격이랑 배출 신청 방법 알려줘' },
  { id: 'B-04', seq: 4, category: 'waste_bag', bodyTemplate: '{unit} 종량제봉투 종류별 가격 알려줘' },
  { id: 'B-05', seq: 5, category: 'civil', bodyTemplate: '{unit} 청/군청 민원실 점심시간에도 되는지, 주차요금 얼마야?' },
  { id: 'B-06', seq: 6, category: 'senior_bus', bodyTemplate: '{unit} 어르신 버스비 지원 대상 나이랑 금액 알려줘' },
  { id: 'B-07', seq: 7, category: 'senior_bath', bodyTemplate: '{unit} 어르신 목욕권이나 이미용 지원 있어?' },
  { id: 'B-08', seq: 8, category: 'youth_rent', bodyTemplate: '{unit} 청년 월세 지원 대상 조건이랑 지원 금액 알려줘' },
  { id: 'B-09', seq: 9, category: 'startup', bodyTemplate: '{unit} 청년 창업 지원금이나 창업 공간 지원 있어?' },
  { id: 'B-10', seq: 10, category: 'night_care', bodyTemplate: '{unit} 밤에 아이가 아프면 갈 수 있는 소아과 어디야?' },
  { id: 'B-11', seq: 11, category: 'child_care', bodyTemplate: '{unit} 초등 방과후 돌봄교실이나 지역아동센터 정보 알려줘' },
  { id: 'B-12', seq: 12, category: 'multicultural', bodyTemplate: '{unit} 다문화가족지원센터 위치랑 프로그램 알려줘' },
  { id: 'B-13', seq: 13, category: 'loan', bodyTemplate: '{unit} 소상공인 특례보증 대출 조건 알려줘' },
  { id: 'B-14', seq: 14, category: 'tax', bodyTemplate: '{unit} 소상공인 무료 세무 상담 받을 수 있는 곳 있어?' },
  { id: 'B-15', seq: 15, category: 'festival', bodyTemplate: '{unit} 올해 열리는 대표 축제 일정이랑 장소 안내해줘' },
];
