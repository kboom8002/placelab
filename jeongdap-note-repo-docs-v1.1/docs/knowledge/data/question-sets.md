# 질문 세트 (측정 전 공개본) — 서울·강남구·제주·서귀포

> 시드 원천: `supabase/seed/question_sets/*.sql`. 세트 버전: 광역 `KR-광역-v1.2`, 기초 `KR-기초-v1.0`.
> **정본 값은 비어 있다.** 질문은 실제 기관·시설 이름으로 썼지만 정답은 확인 전이다. 측정 세트에 넣기 전에 정본(L2 이상)과 답안지를 만든다.
> 같은 사실은 한 층에서만 묻는다 (예: 성산일출봉은 제주 광역, 대정 오일장은 대정읍).

칸: A 공통 코어 · B 층별 기본 · C 지역 특화 · D 주민 제안 · E 통제 / 정본 상태: L3 공식 · L2 담당 확인 · L1 주민 확인 · 후보 · 확인 필요 · 정본 공백

## 서울특별시 (광역, 60문항)

칸: A 24 · B 15 · C 12 · D 6 · E 3 · 위험 속성 25.0% · 🌐 = 다국어 측정 대상 (영·일·번체·간체)

| # | 칸 | 질문 | 속성 | 영역 | ⚠ | 🌐 | 정본 상태 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A | 서울시청 시민민원실은 몇 시까지 운영해요? | `life.office_hours` | 생활·행정 |  |  | L2 담당 확인 |
| 2 | A | 서울시청 주소가 어디예요? | `life.office_address` | 생활·행정 |  |  | L3 공식 |
| 3 | A | 서울에는 자치구가 몇 개 있어요? | `life.admin_name` | 생활·행정 |  |  | L3 공식 |
| 4 | A | 서울도서관은 무슨 요일에 쉬어요? | `life.library_closed` | 생활·행정 |  |  | L2 담당 확인 |
| 5 | A | 경복궁 관람 시간과 쉬는 날은? | `tour.attraction_hours` | 관광·축제 |  | 🌐 | L2 담당 확인 |
| 6 | A | 경복궁 입장료는 얼마예요? | `tour.attraction_fee` | 관광·축제 |  | 🌐 | L2 담당 확인 |
| 7 | A | 올해 서울빛초롱축제는 언제 어디서 열려요? | `tour.festival_dates` | 관광·축제 |  |  | 확인 필요 |
| 8 | A | 명동 관광정보센터는 어디 있고 어떤 언어를 지원해요? | `tour.info_center` | 관광·축제 |  | 🌐 | 후보 |
| 9 | A | 서울 심야버스 노선이 최근 바뀌었나요? | `traffic.bus_change` | 교통 |  |  | 확인 필요 |
| 10 | A | 서울고속버스터미널은 어디에 있어요? | `traffic.terminal` | 교통 |  |  | L3 공식 |
| 11 | A | 서울시 공영주차장 요금은 어디서 확인해요? | `traffic.public_parking` | 교통 |  |  | 후보 |
| 12 | A | 서울 장애인 콜택시는 어떻게 신청해요? | `traffic.mobility_support` | 교통 | ⚠ |  | L2 담당 확인 |
| 13 | A | 서울 보건소는 토요일에도 진료해요? | `welfare.health_center_hours` | 복지 | ⚠ |  | 확인 필요 |
| 14 | A | 서울시 청년수당은 누가 받을 수 있어요? | `welfare.eligibility` | 복지 | ⚠ |  | L2 담당 확인 |
| 15 | A | 서울형 기초보장은 어디서 신청해요? | `welfare.apply_where` | 복지 |  |  | L2 담당 확인 |
| 16 | A | 서울 청년월세지원 신청할 때 필요한 서류는? | `welfare.documents` | 복지 |  |  | 확인 필요 |
| 17 | A | 서울글로벌센터는 어디 있고 몇 시까지 해요? | `foreign.support_center` | 외국인 정보 |  |  | 후보 |
| 18 | A | 다산콜센터 외국어 상담은 어떤 언어로 돼요? | `foreign.multilang_days` | 외국인 정보 |  |  | 후보 |
| 19 | A | 서울에 사는 외국인은 건강보험 안내를 어디서 받아요? | `foreign.health_insurance` | 외국인 정보 |  |  | 확인 필요 |
| 20 | A | 서울에서 외국인 등록은 어디서 해요? | `foreign.registration` | 외국인 정보 |  |  | L2 담당 확인 |
| 21 | A | 서울에서 지진 대피 장소는 어떻게 찾아요? | `safety.shelter_lookup` | 재난·안전 | ⚠ |  | L3 공식 |
| 22 | A | 서울시 재난 안내는 어디서 받아요? | `safety.alert_channel` | 재난·안전 | ⚠ |  | L3 공식 |
| 23 | A | 서울에서 밤에 문 연 응급실은 어떻게 찾아요? | `safety.night_er` | 재난·안전 | ⚠ | 🌐 | L2 담당 확인 |
| 24 | A | 서울에서 일요일에 문 연 약국은 어떻게 찾아요? | `safety.holiday_pharmacy` | 재난·안전 | ⚠ |  | L2 담당 확인 |
| 25 | B | 서울시 민원 상담 전화번호는 뭐예요? | `life.civil_contact` | 생활·행정 |  |  | L3 공식 |
| 26 | B | 서울시 공공체육시설은 어디서 예약해요? | `life.sports_facility` | 생활·행정 |  |  | 후보 |
| 27 | B | 서울에서 주말에도 쓸 수 있는 무인민원발급기는 어디 있어요? | `life.kiosk` | 생활·행정 |  |  | 후보 |
| 28 | B | 서울 무장애 관광 정보는 어디서 볼 수 있어요? | `tour.accessibility` | 관광·축제 |  |  | 후보 |
| 29 | B | 인천공항에서 서울 시내로 가는 대중교통은? | `traffic.airport_access` | 교통 |  | 🌐 | L2 담당 확인 |
| 30 | B | 따릉이 1시간 이용 요금은 얼마예요? | `traffic.bike` | 교통 |  | 🌐 | L2 담당 확인 |
| 31 | B | 서울시 청년수당은 한 달에 얼마예요? | `welfare.amount` | 복지 | ⚠ |  | 확인 필요 |
| 32 | B | 서울 우리동네키움센터는 몇 시까지 운영해요? | `welfare.childcare` | 복지 |  |  | 후보 |
| 33 | B | 서울시 장애인 복지 상담은 어디에 문의해요? | `welfare.disability_desk` | 복지 | ⚠ |  | 후보 |
| 34 | B | 서울에서 관광 통역 안내 전화는 몇 번이에요? | `foreign.tourist_hotline` | 외국인 정보 |  | 🌐 | L3 공식 |
| 35 | B | 외국인이 서울에서 긴급 상황에 외국어로 도움받는 방법은? | `foreign.emergency_lang` | 외국인 정보 | ⚠ | 🌐 | L2 담당 확인 |
| 36 | B | 태풍 때 한강공원 통제 소식은 어디서 확인해요? | `safety.hazard_notice` | 재난·안전 | ⚠ |  | 후보 |
| 37 | B | 경복궁 야간 관람은 예약이 필요해요? | `tour.reservation` | 관광·축제 |  |  | 확인 필요 |
| 38 | B | 폭우 때 서울 지하차도 통제 정보는 어디서 봐요? | `safety.hazard_notice` | 재난·안전 | ⚠ |  | 후보 |
| 39 | B | 올해 서울세계불꽃축제는 언제예요? | `tour.festival_dates` | 관광·축제 |  |  | 확인 필요 |
| 40 | C | 한강버스는 어디서 타고 몇 시까지 다녀요? | `traffic.ferry` | 교통 | ⚠ | 🌐 | 확인 필요 |
| 41 | C | 기후동행카드 한 달 요금은 얼마예요? | `traffic.transit_pass*` | 교통 |  |  | 확인 필요 |
| 42 | C | 북촌 한옥마을은 몇 시부터 몇 시까지 방문할 수 있어요? | `tour.attraction_hours` | 관광·축제 |  | 🌐 | 확인 필요 |
| 43 | C | DDP 운영 시간은? | `tour.attraction_hours` | 관광·축제 |  |  | 후보 |
| 44 | C | 서울식물원 입장료는 얼마예요? | `tour.attraction_fee` | 관광·축제 |  |  | 후보 |
| 45 | C | 서울광장 스케이트장은 언제 열려요? | `tour.festival_dates` | 관광·축제 |  |  | 확인 필요 |
| 46 | C | 서울도서관은 옛 서울시청 건물에 있어요? | `life.office_address` | 생활·행정 |  |  | L3 공식 |
| 47 | C | 김포공항에서 서울역까지 가는 철도 노선은? | `traffic.airport_access` | 교통 |  |  | L2 담당 확인 |
| 48 | C | 서울시 손목닥터9988은 누가 참여할 수 있어요? | `welfare.eligibility` | 복지 | ⚠ |  | 확인 필요 |
| 49 | C | 서울 무더위쉼터는 어떻게 찾아요? | `safety.shelter_lookup` | 재난·안전 | ⚠ |  | L2 담당 확인 |
| 50 | C | 서울 외국인 주민 한국어 교실은 어디서 신청해요? | `foreign.support_center` | 외국인 정보 |  |  | 확인 필요 |
| 51 | C | 서울관광플라자는 어디에 있어요? | `tour.info_center` | 관광·축제 |  |  | 후보 |
| 52 | D | 서울 대형폐기물 배출 신고는 어디서 해요? | `life.waste_day` | 생활·행정 |  |  | 후보 |
| 53 | D | 서울 공공 산후조리 지원은 어디서 신청해요? | `welfare.apply_where` | 복지 |  |  | 정본 공백 |
| 54 | D | 한강공원 주차 요금은 얼마예요? | `traffic.public_parking` | 교통 |  |  | 후보 |
| 55 | D | 서울둘레길 스탬프 투어는 신청이 필요해요? | `tour.reservation` | 관광·축제 |  |  | 정본 공백 |
| 56 | D | 서울 공공 수영장 자유수영 예약은 어디서 해요? | `life.sports_facility` | 생활·행정 |  |  | 정본 공백 |
| 57 | D | 서울 외국인 주민 법률 상담은 무슨 요일에 해요? | `foreign.multilang_days` | 외국인 정보 |  |  | 정본 공백 |
| 58 | E | 서울시청은 어느 구에 있어요? (카나리) | `life.office_address` | 생활·행정 |  |  | L3 공식 |
| 59 | E | 서울특별시는 광역자치단체인가요? (카나리) | `life.admin_name` | 생활·행정 |  |  | L3 공식 |
| 60 | E | 2026년 7월에 출범한 통합특별시는 어디예요? (최근 변경) | `life.admin_name` | 생활·행정 |  |  | L3 공식 |

## 강남구 (기초, 시범, 120문항)

칸: A 36 · B 42 · C 24 · D 12 · E 6 · 위험 속성 25.0% · 🌐 = 다국어 측정 대상 (영·일·번체·간체)

| # | 칸 | 질문 | 속성 | 영역 | ⚠ | 🌐 | 정본 상태 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A | 강남구청 민원여권과는 몇 시까지 해요? | `life.office_hours` | 생활·행정 |  |  | L2 담당 확인 |
| 2 | A | 역삼1동 주민센터 운영 시간은? | `life.office_hours` | 생활·행정 |  |  | L2 담당 확인 |
| 3 | A | 강남구청 주소가 어디예요? | `life.office_address` | 생활·행정 |  |  | L3 공식 |
| 4 | A | 강남구 보건소는 어디에 있어요? | `life.office_address` | 생활·행정 |  |  | L3 공식 |
| 5 | A | 강남구에는 행정동이 몇 개 있어요? | `life.admin_name` | 생활·행정 |  |  | L3 공식 |
| 6 | A | 압구정동은 강남구예요? | `life.admin_name` | 생활·행정 |  |  | L3 공식 |
| 7 | A | 강남구립 논현도서관은 무슨 요일에 쉬어요? | `life.library_closed` | 생활·행정 |  |  | 후보 |
| 8 | A | 개포하늘꿈도서관 휴관일은? | `life.library_closed` | 생활·행정 |  |  | 후보 |
| 9 | A | 선릉과 정릉 관람 시간과 쉬는 날은? | `tour.attraction_hours` | 관광·축제 |  | 🌐 | L2 담당 확인 |
| 10 | A | 봉은사는 몇 시까지 들어갈 수 있어요? | `tour.attraction_hours` | 관광·축제 |  | 🌐 | 후보 |
| 11 | A | 선릉과 정릉 입장료는 얼마예요? | `tour.attraction_fee` | 관광·축제 |  |  | L2 담당 확인 |
| 12 | A | 올해 강남페스티벌은 언제 열려요? | `tour.festival_dates` | 관광·축제 |  |  | 확인 필요 |
| 13 | A | 강남관광정보센터는 어디 있고 어떤 언어를 지원해요? | `tour.info_center` | 관광·축제 |  | 🌐 | 후보 |
| 14 | A | 강남구 마을버스 노선이 바뀐 곳이 있어요? | `traffic.bus_change` | 교통 |  |  | 확인 필요 |
| 15 | A | 강남역 버스 정류장 위치가 바뀌었나요? | `traffic.bus_change` | 교통 |  |  | 확인 필요 |
| 16 | A | 수서역에서는 어떤 기차를 탈 수 있어요? | `traffic.terminal` | 교통 |  |  | L2 담당 확인 |
| 17 | A | 강남구 공영주차장 요금은 얼마예요? | `traffic.public_parking` | 교통 |  |  | 후보 |
| 18 | A | 코엑스 근처 공영주차장은 어디예요? | `traffic.public_parking` | 교통 |  |  | 후보 |
| 19 | A | 강남구에 사는 장애인은 이동지원 차량을 어떻게 불러요? | `traffic.mobility_support` | 교통 | ⚠ |  | L2 담당 확인 |
| 20 | A | 강남구 보건소 진료 시간은? | `welfare.health_center_hours` | 복지 | ⚠ |  | L2 담당 확인 |
| 21 | A | 강남구 보건소는 토요일에도 해요? | `welfare.health_center_hours` | 복지 | ⚠ |  | 확인 필요 |
| 22 | A | 강남구 출산 지원금은 누가 받을 수 있어요? | `welfare.eligibility` | 복지 | ⚠ |  | 확인 필요 |
| 23 | A | 강남구에서 기초연금은 어디서 신청해요? | `welfare.apply_where` | 복지 |  |  | L2 담당 확인 |
| 24 | A | 강남구에서 아동수당은 어디서 신청해요? | `welfare.apply_where` | 복지 |  |  | L2 담당 확인 |
| 25 | A | 강남구 출산 지원금 신청 서류는? | `welfare.documents` | 복지 |  |  | 확인 필요 |
| 26 | A | 강남글로벌빌리지센터는 어디 있어요? | `foreign.support_center` | 외국인 정보 |  |  | 후보 |
| 27 | A | 역삼 글로벌빌리지센터는 몇 시까지 해요? | `foreign.support_center` | 외국인 정보 |  |  | 후보 |
| 28 | A | 강남글로벌빌리지센터는 어떤 언어로 상담해요? | `foreign.multilang_days` | 외국인 정보 |  |  | 후보 |
| 29 | A | 강남구에 사는 외국인은 건강보험 상담을 어디서 해요? | `foreign.health_insurance` | 외국인 정보 |  |  | 확인 필요 |
| 30 | A | 강남구에 사는 외국인의 외국인 등록 관할 사무소는? | `foreign.registration` | 외국인 정보 |  |  | 확인 필요 |
| 31 | A | 강남구 지진 대피 장소는 어떻게 찾아요? | `safety.shelter_lookup` | 재난·안전 | ⚠ |  | L3 공식 |
| 32 | A | 강남구 침수 때 대피 장소는 어디예요? | `safety.shelter_lookup` | 재난·안전 | ⚠ |  | L2 담당 확인 |
| 33 | A | 강남구 재난 문자는 어떻게 받아요? | `safety.alert_channel` | 재난·안전 | ⚠ |  | L3 공식 |
| 34 | A | 강남구에서 밤에 갈 수 있는 응급실은? | `safety.night_er` | 재난·안전 | ⚠ | 🌐 | L2 담당 확인 |
| 35 | A | 강남구에서 일요일에 문 연 약국은 어떻게 찾아요? | `safety.holiday_pharmacy` | 재난·안전 | ⚠ |  | L2 담당 확인 |
| 36 | A | 강남구 심야 약국이 있어요? | `safety.holiday_pharmacy` | 재난·안전 | ⚠ |  | 확인 필요 |
| 37 | B | 강남구 생활쓰레기는 무슨 요일에 내요? | `life.waste_day` | 생활·행정 |  |  | L2 담당 확인 |
| 38 | B | 강남구 음식물쓰레기는 어떻게 버려요? | `life.waste_day` | 생활·행정 |  |  | L2 담당 확인 |
| 39 | B | 강남구 대형폐기물은 어떻게 신고해요? | `life.waste_day` | 생활·행정 |  |  | L2 담당 확인 |
| 40 | B | 강남구청 무인민원발급기는 몇 시까지 돼요? | `life.kiosk` | 생활·행정 |  |  | 후보 |
| 41 | B | 강남역 근처 무인민원발급기는 어디 있어요? | `life.kiosk` | 생활·행정 |  |  | 후보 |
| 42 | B | 강남구청 대표 전화번호는? | `life.civil_contact` | 생활·행정 |  |  | L3 공식 |
| 43 | B | 강남구 민원 상담 전화는 몇 시까지 받아요? | `life.civil_contact` | 생활·행정 |  |  | 후보 |
| 44 | B | 강남구민체육관 운영 시간은? | `life.sports_facility` | 생활·행정 |  |  | 후보 |
| 45 | B | 대치유수지체육공원 이용 요금은? | `life.sports_facility` | 생활·행정 |  |  | 후보 |
| 46 | B | 강남구 발달장애인 지원센터는 어디예요? | `welfare.disability_desk` | 복지 | ⚠ |  | 후보 |
| 47 | B | 대치2동 주민센터 운영 시간은? | `life.office_hours` | 생활·행정 |  |  | L2 담당 확인 |
| 48 | B | 삼성1동 주민센터 운영 시간은? | `life.office_hours` | 생활·행정 |  |  | L2 담당 확인 |
| 49 | B | 압구정동 주민센터 주소는? | `life.office_address` | 생활·행정 |  |  | L3 공식 |
| 50 | B | 대치도서관 휴관일은? | `life.library_closed` | 생활·행정 |  |  | 후보 |
| 51 | B | 강남구립 역삼도서관 휴관일은? | `life.library_closed` | 생활·행정 |  |  | 후보 |
| 52 | B | 코엑스에서 휠체어를 빌릴 수 있어요? | `tour.accessibility` | 관광·축제 |  |  | 확인 필요 |
| 53 | B | 봉은사 템플스테이는 예약해야 해요? | `tour.reservation` | 관광·축제 |  |  | 후보 |
| 54 | B | 코엑스 별마당도서관 운영 시간은? | `tour.attraction_hours` | 관광·축제 |  | 🌐 | 후보 |
| 55 | B | 강남구 따릉이 대여소는 어떻게 찾아요? | `traffic.bike` | 교통 |  |  | L2 담당 확인 |
| 56 | B | 강남구 거주자우선주차는 어떻게 신청해요? | `traffic.public_parking` | 교통 |  |  | L2 담당 확인 |
| 57 | B | 강남역 심야버스 정류장은 어디예요? | `traffic.bus_change` | 교통 |  |  | 확인 필요 |
| 58 | B | 강남구에 있는 고속철도역은 어디예요? | `traffic.terminal` | 교통 |  |  | L3 공식 |
| 59 | B | 강남구 교통약자 무료 셔틀이 있어요? | `traffic.mobility_support` | 교통 | ⚠ |  | 확인 필요 |
| 60 | B | 강남구 출산 지원금은 얼마예요? | `welfare.amount` | 복지 | ⚠ |  | 확인 필요 |
| 61 | B | 기초연금 한 달 최대 금액은 얼마예요? | `welfare.amount` | 복지 | ⚠ |  | L3 공식 |
| 62 | B | 강남구 노인복지관은 어디에 있어요? | `welfare.senior_center` | 복지 |  |  | 후보 |
| 63 | B | 역삼1동 경로당은 어디예요? | `welfare.senior_center` | 복지 |  |  | L1 주민 확인 |
| 64 | B | 강남구 공동육아방 운영 시간은? | `welfare.childcare` | 복지 |  |  | 후보 |
| 65 | B | 강남구 우리동네키움센터는 어디에 있어요? | `welfare.childcare` | 복지 |  |  | 후보 |
| 66 | B | 강남구 장애인 복지 상담은 어디서 해요? | `welfare.disability_desk` | 복지 | ⚠ |  | 후보 |
| 67 | B | 강남구 긴급복지 지원은 어디서 신청해요? | `welfare.apply_where` | 복지 |  |  | L2 담당 확인 |
| 68 | B | 강남구 기초연금 신청 서류는? | `welfare.documents` | 복지 |  |  | L2 담당 확인 |
| 69 | B | 강남구 치매안심센터 운영 시간은? | `welfare.health_center_hours` | 복지 | ⚠ |  | 후보 |
| 70 | B | 강남구 어르신 무료 독감 접종 대상은? | `welfare.eligibility` | 복지 | ⚠ |  | 확인 필요 |
| 71 | B | 강남구 외국인 상담은 무슨 요일에 해요? | `foreign.multilang_days` | 외국인 정보 |  |  | 후보 |
| 72 | B | 강남구에서 외국인이 긴급할 때 통역은 어떻게 받아요? | `foreign.emergency_lang` | 외국인 정보 | ⚠ |  | L2 담당 확인 |
| 73 | B | 강남구 외국인 한국어 교실은 어디서 신청해요? | `foreign.support_center` | 외국인 정보 |  |  | 후보 |
| 74 | B | 역삼1동 민방위 대피시설은 어디예요? | `safety.civil_defense` | 재난·안전 | ⚠ |  | 후보 |
| 75 | B | 압구정동 민방위 대피시설은 어디예요? | `safety.civil_defense` | 재난·안전 | ⚠ |  | 후보 |
| 76 | B | 비 많이 올 때 양재천 산책로 통제는 어디서 확인해요? | `safety.hazard_notice` | 재난·안전 | ⚠ |  | 후보 |
| 77 | B | 탄천 주차장 침수 통제 소식은 어디서 받아요? | `safety.hazard_notice` | 재난·안전 | ⚠ |  | 후보 |
| 78 | B | 강남구 무더위쉼터는 어디예요? | `safety.shelter_lookup` | 재난·안전 | ⚠ |  | L2 담당 확인 |
| 79 | C | GTX-A는 수서역에서 어디까지 가요? | `traffic.terminal` | 교통 |  |  | L2 담당 확인 |
| 80 | C | 영동대로 공사 때문에 버스가 돌아가나요? | `traffic.bus_change` | 교통 |  |  | 확인 필요 |
| 81 | C | 삼성역 공사로 막힌 출구가 있어요? | `traffic.bus_change` | 교통 |  |  | 확인 필요 |
| 82 | C | 코엑스 아쿠아리움 운영 시간은? | `tour.attraction_hours` | 관광·축제 |  |  | 후보 |
| 83 | C | 영동대로 K-POP 콘서트는 올해도 열려요? | `tour.festival_dates` | 관광·축제 |  |  | 확인 필요 |
| 84 | C | 강남 의료관광 안내센터는 어디에 있어요? | `tour.info_center` | 관광·축제 |  | 🌐 | 확인 필요 |
| 85 | C | 외국인 환자는 강남에서 통역 지원을 어디서 받아요? | `foreign.support_center` | 외국인 정보 |  | 🌐 | 확인 필요 |
| 86 | C | 압구정 K-스타로드는 어디서 시작해요? | `tour.info_center` | 관광·축제 |  |  | 후보 |
| 87 | C | 폭우 때 강남역 지하상가 대피 안내는 어디서 봐요? | `safety.shelter_lookup` | 재난·안전 | ⚠ |  | 확인 필요 |
| 88 | C | 강남역 침수 예보는 어디서 받아요? | `safety.hazard_notice` | 재난·안전 | ⚠ |  | L2 담당 확인 |
| 89 | C | 탄천 공영주차장 요금은 얼마예요? | `traffic.public_parking` | 교통 |  |  | 후보 |
| 90 | C | 개포2동 주민센터는 지금 어디에 있어요? | `life.office_address` | 생활·행정 |  |  | 확인 필요 |
| 91 | C | 가로수길은 강남구예요, 서초구예요? | `life.admin_name` | 생활·행정 |  | 🌐 | L3 공식 |
| 92 | C | 강남고속버스터미널은 강남구에 있어요? | `life.admin_name` | 생활·행정 |  | 🌐 | L3 공식 |
| 93 | C | 양재역은 강남구예요? | `life.admin_name` | 생활·행정 |  |  | L3 공식 |
| 94 | C | 강남역에서 인천공항 가는 공항버스는 어디서 타요? | `traffic.airport_access` | 교통 |  | 🌐 | 후보 |
| 95 | C | 봉은사는 입장료가 있어요? | `tour.attraction_fee` | 관광·축제 |  |  | L2 담당 확인 |
| 96 | C | 선릉과 정릉 문화해설은 예약해야 해요? | `tour.reservation` | 관광·축제 |  |  | 후보 |
| 97 | C | 강남구 청년 지원 정책은 몇 살까지 받아요? | `welfare.eligibility` | 복지 | ⚠ |  | 확인 필요 |
| 98 | C | 강남구 산후조리 지원은 어디서 신청해요? | `welfare.apply_where` | 복지 |  |  | 확인 필요 |
| 99 | C | 강남구에서 전동킥보드는 어떤 경우에 견인돼요? | `traffic.pm_rule*` | 교통 |  |  | 확인 필요 |
| 100 | C | 강남구에 밤에 아이 진료하는 달빛어린이병원이 있어요? | `safety.night_er` | 재난·안전 | ⚠ |  | 확인 필요 |
| 101 | C | 역삼동 재활용은 무슨 요일에 내요? | `life.waste_day` | 생활·행정 |  |  | 후보 |
| 102 | C | 강남 의료관광 외국인 환자 긴급 통역 전화는? | `foreign.emergency_lang` | 외국인 정보 | ⚠ |  | 확인 필요 |
| 103 | D | 개포동 반려견 놀이터 운영 시간은? | `life.sports_facility` | 생활·행정 |  |  | 정본 공백 |
| 104 | D | 강남구 폐의약품 수거함은 어디에 있어요? | `life.drug_disposal*` | 생활·행정 |  |  | 정본 공백 |
| 105 | D | 대치역 근처 공영주차장 야간 요금은? | `traffic.public_parking` | 교통 |  |  | 후보 |
| 106 | D | 역삼1동 주민센터 요가 강좌는 언제 신청해요? | `life.sports_facility` | 생활·행정 |  |  | 정본 공백 |
| 107 | D | 강남구 어린이 무료 치과 검진은 어디서 해요? | `welfare.apply_where` | 복지 |  |  | 정본 공백 |
| 108 | D | 양재천 벚꽃길 차량 통제 기간은? | `tour.festival_dates` | 관광·축제 |  |  | 정본 공백 |
| 109 | D | 강남구 쓰레기 배출 영어 안내는 어디 있어요? | `foreign.emergency_lang` | 외국인 정보 | ⚠ |  | 정본 공백 |
| 110 | D | 삼성1동 무더위쉼터는 몇 시까지 열어요? | `safety.shelter_lookup` | 재난·안전 | ⚠ |  | L1 주민 확인 |
| 111 | D | 공공 와이파이 되는 강남구 공원은? | `life.wifi*` | 생활·행정 |  |  | 정본 공백 |
| 112 | D | 세곡동 마을버스 막차 시간은? | `traffic.bus_change` | 교통 |  |  | 정본 공백 |
| 113 | D | 강남구 청소년 상담센터는 어디예요? | `welfare.apply_where` | 복지 |  |  | 후보 |
| 114 | D | 논현동 공영주차장에 전기차 충전기가 있어요? | `traffic.public_parking` | 교통 |  |  | 정본 공백 |
| 115 | E | 강남구는 서울특별시의 자치구인가요? (카나리) | `life.admin_name` | 생활·행정 |  |  | L3 공식 |
| 116 | E | 선릉과 정릉은 세계유산인가요? (카나리) | `tour.attraction_hours` | 관광·축제 |  |  | L3 공식 |
| 117 | E | 코엑스는 강남구 어느 동에 있어요? (카나리) | `life.office_address` | 생활·행정 |  |  | L3 공식 |
| 118 | E | 2026년 7월 인천 중구는 어떻게 바뀌었나요? (최근 변경) | `life.admin_name` | 생활·행정 |  |  | L3 공식 |
| 119 | E | GTX-A 수서역은 언제 개통했어요? (최근 변경) | `traffic.terminal` | 교통 |  |  | L3 공식 |
| 120 | E | 강남구 행정동 수가 최근 바뀌었나요? (최근 변경) | `life.admin_name` | 생활·행정 |  |  | 확인 필요 |

## 제주특별자치도 (광역, 60문항)

칸: A 24 · B 15 · C 12 · D 6 · E 3 · 위험 속성 26.7% · 🌐 = 다국어 측정 대상 (영·일·번체·간체)

| # | 칸 | 질문 | 속성 | 영역 | ⚠ | 🌐 | 정본 상태 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A | 제주도청 민원실은 몇 시까지 해요? | `life.office_hours` | 생활·행정 |  |  | L2 담당 확인 |
| 2 | A | 제주도청 주소가 어디예요? | `life.office_address` | 생활·행정 |  |  | L3 공식 |
| 3 | A | 제주특별자치도에는 기초자치단체가 있어요? | `life.admin_name` | 생활·행정 |  |  | L3 공식 |
| 4 | A | 한라도서관은 무슨 요일에 쉬어요? | `life.library_closed` | 생활·행정 |  |  | L2 담당 확인 |
| 5 | A | 성산일출봉 관람 시간은? | `tour.attraction_hours` | 관광·축제 |  | 🌐 | L2 담당 확인 |
| 6 | A | 성산일출봉 입장료는 얼마예요? | `tour.attraction_fee` | 관광·축제 |  | 🌐 | L2 담당 확인 |
| 7 | A | 올해 제주들불축제는 열려요? | `tour.festival_dates` | 관광·축제 |  |  | 확인 필요 |
| 8 | A | 제주국제공항 관광안내센터는 어떤 언어를 지원해요? | `tour.info_center` | 관광·축제 |  |  | 후보 |
| 9 | A | 제주 버스 노선이 최근 바뀌었나요? | `traffic.bus_change` | 교통 |  |  | 확인 필요 |
| 10 | A | 제주버스터미널은 어디에 있어요? | `traffic.terminal` | 교통 |  |  | L3 공식 |
| 11 | A | 제주국제공항 주차장 요금은 얼마예요? | `traffic.public_parking` | 교통 |  |  | 후보 |
| 12 | A | 제주에서 장애인 콜택시는 어떻게 불러요? | `traffic.mobility_support` | 교통 | ⚠ |  | L2 담당 확인 |
| 13 | A | 제주 보건소는 토요일에도 진료해요? | `welfare.health_center_hours` | 복지 | ⚠ |  | 확인 필요 |
| 14 | A | 제주 청년 지원금은 몇 살까지 받을 수 있어요? | `welfare.eligibility` | 복지 | ⚠ |  | 확인 필요 |
| 15 | A | 제주에서 기초연금은 어디서 신청해요? | `welfare.apply_where` | 복지 |  |  | L2 담당 확인 |
| 16 | A | 제주 출산 지원 신청에 필요한 서류는? | `welfare.documents` | 복지 |  |  | 확인 필요 |
| 17 | A | 제주 외국인주민지원센터는 어디에 있어요? | `foreign.support_center` | 외국인 정보 |  |  | 후보 |
| 18 | A | 제주 외국인 상담은 어떤 언어로 해요? | `foreign.multilang_days` | 외국인 정보 |  |  | 후보 |
| 19 | A | 제주에 사는 외국인은 건강보험 안내를 어디서 받아요? | `foreign.health_insurance` | 외국인 정보 |  |  | 확인 필요 |
| 20 | A | 제주에서 외국인 등록은 어디서 해요? | `foreign.registration` | 외국인 정보 |  |  | L2 담당 확인 |
| 21 | A | 제주 지진해일 대피 장소는 어떻게 찾아요? | `safety.shelter_lookup` | 재난·안전 | ⚠ |  | L3 공식 |
| 22 | A | 제주 태풍 정보는 어디서 받아요? | `safety.alert_channel` | 재난·안전 | ⚠ |  | L3 공식 |
| 23 | A | 제주에서 밤에 문 연 응급실은 어떻게 찾아요? | `safety.night_er` | 재난·안전 | ⚠ | 🌐 | L2 담당 확인 |
| 24 | A | 제주에서 일요일에 문 연 약국은 어떻게 찾아요? | `safety.holiday_pharmacy` | 재난·안전 | ⚠ |  | L2 담당 확인 |
| 25 | B | 제주도 민원 콜센터 번호는? | `life.civil_contact` | 생활·행정 |  |  | L3 공식 |
| 26 | B | 제주국제공항에 무인민원발급기가 있어요? | `life.kiosk` | 생활·행정 |  |  | 확인 필요 |
| 27 | B | 제주종합경기장 수영장은 어떻게 이용해요? | `life.sports_facility` | 생활·행정 |  |  | 후보 |
| 28 | B | 제주 무장애 관광 정보는 어디서 봐요? | `tour.accessibility` | 관광·축제 |  |  | 후보 |
| 29 | B | 올해 탐라문화제는 언제예요? | `tour.festival_dates` | 관광·축제 |  |  | 확인 필요 |
| 30 | B | 제주돌문화공원은 무슨 요일에 쉬어요? | `tour.attraction_hours` | 관광·축제 |  |  | 후보 |
| 31 | B | 제주공항에서 서귀포 가는 버스는? | `traffic.airport_access` | 교통 |  | 🌐 | L2 담당 확인 |
| 32 | B | 제주항 연안여객터미널은 어디예요? | `traffic.terminal` | 교통 |  |  | L3 공식 |
| 33 | B | 제주 출산 지원금은 얼마예요? | `welfare.amount` | 복지 | ⚠ |  | 확인 필요 |
| 34 | B | 제주에서 아이돌봄 서비스는 어떻게 신청해요? | `welfare.childcare` | 복지 |  |  | L2 담당 확인 |
| 35 | B | 제주 장애인 복지 상담은 어디서 해요? | `welfare.disability_desk` | 복지 | ⚠ |  | 후보 |
| 36 | B | 제주 관광 통역 안내 전화는 몇 번이에요? | `foreign.tourist_hotline` | 외국인 정보 |  | 🌐 | L3 공식 |
| 37 | B | 외국인 관광객이 제주에서 긴급할 때 통역은? | `foreign.emergency_lang` | 외국인 정보 | ⚠ |  | L2 담당 확인 |
| 38 | B | 한라산 입산 통제는 어디서 확인해요? | `safety.hazard_notice` | 재난·안전 | ⚠ | 🌐 | L2 담당 확인 |
| 39 | B | 제주 기상 특보를 영어로 받을 수 있어요? | `safety.alert_channel` | 재난·안전 | ⚠ |  | 확인 필요 |
| 40 | C | 한라산 성판악·관음사 탐방은 예약해야 해요? | `tour.reservation` | 관광·축제 |  | 🌐 | L2 담당 확인 |
| 41 | C | 만장굴은 지금 관람할 수 있어요? | `tour.attraction_hours` | 관광·축제 |  | 🌐 | 확인 필요 |
| 42 | C | 제주–완도 여객선은 어디서 타요? | `traffic.ferry` | 교통 | ⚠ |  | L2 담당 확인 |
| 43 | C | 우도 가는 배는 어디서 타요? | `traffic.ferry` | 교통 | ⚠ | 🌐 | L2 담당 확인 |
| 44 | C | 제주4·3평화공원 관람료는? | `tour.attraction_fee` | 관광·축제 |  |  | L2 담당 확인 |
| 45 | C | 올해 제주왕벚꽃축제는 언제예요? | `tour.festival_dates` | 관광·축제 |  |  | 확인 필요 |
| 46 | C | 제주에서 차를 사면 차고지 증명이 필요해요? | `traffic.parking_rule*` | 교통 |  |  | L2 담당 확인 |
| 47 | C | 우도는 제주시예요, 서귀포시예요? | `life.admin_name` | 생활·행정 |  | 🌐 | L3 공식 |
| 48 | C | 제주 무사증 입국 대상이 아닌 나라는? | `foreign.registration` | 외국인 정보 |  |  | 확인 필요 |
| 49 | C | 제주 해녀 진료비 지원 대상은? | `welfare.eligibility` | 복지 | ⚠ |  | 확인 필요 |
| 50 | C | 제주 해수욕장 이안류 경보는 어디서 봐요? | `safety.hazard_notice` | 재난·안전 | ⚠ |  | L2 담당 확인 |
| 51 | C | 제주 공식 관광 정보 사이트는? | `tour.info_center` | 관광·축제 |  |  | L3 공식 |
| 52 | D | 제주공항 렌터카 반납은 어디서 해요? | `traffic.airport_access` | 교통 |  |  | 후보 |
| 53 | D | 제주 오름 중 탐방 예약이 필요한 곳은? | `tour.reservation` | 관광·축제 |  |  | 정본 공백 |
| 54 | D | 명절 연휴에 제주공항 셔틀버스가 늘어나요? | `traffic.airport_access` | 교통 |  |  | 정본 공백 |
| 55 | D | 제주 외국인 계절근로자 상담은 어디서 해요? | `foreign.support_center` | 외국인 정보 |  |  | 정본 공백 |
| 56 | D | 제주 감귤 따기 체험은 언제 할 수 있어요? | `tour.festival_dates` | 관광·축제 |  |  | 정본 공백 |
| 57 | D | 제주 해수욕장 개장 기간은? | `tour.attraction_hours` | 관광·축제 |  |  | 후보 |
| 58 | E | 제주특별자치도청은 제주시에 있어요? (카나리) | `life.office_address` | 생활·행정 |  |  | L3 공식 |
| 59 | E | 한라산 높이는? (카나리) | `tour.attraction_hours` | 관광·축제 |  |  | L3 공식 |
| 60 | E | 제주 버스 요금이 최근 바뀌었나요? (최근 변경) | `traffic.bus_change` | 교통 |  |  | 확인 필요 |

## 서귀포시 (기초(행정시), 계약 시연, 120문항)

칸: A 36 · B 42 · C 24 · D 12 · E 6 · 위험 속성 25.0% · 🌐 = 다국어 측정 대상 (영·일·번체·간체)

| # | 칸 | 질문 | 속성 | 영역 | ⚠ | 🌐 | 정본 상태 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A | 서귀포시청 민원실은 몇 시까지 해요? | `life.office_hours` | 생활·행정 |  |  | L2 담당 확인 |
| 2 | A | 동홍동 주민센터 운영 시간은? | `life.office_hours` | 생활·행정 |  |  | L2 담당 확인 |
| 3 | A | 서귀포시청 제1청사 주소는? | `life.office_address` | 생활·행정 |  |  | L3 공식 |
| 4 | A | 서귀포시청 제2청사는 어디예요? | `life.office_address` | 생활·행정 |  |  | L3 공식 |
| 5 | A | 서귀포시에는 읍면동이 몇 개 있어요? | `life.admin_name` | 생활·행정 |  |  | L3 공식 |
| 6 | A | 중문은 서귀포시예요? | `life.admin_name` | 생활·행정 |  |  | L3 공식 |
| 7 | A | 서귀포도서관은 무슨 요일에 쉬어요? | `life.library_closed` | 생활·행정 |  |  | 후보 |
| 8 | A | 삼매봉도서관 휴관일은? | `life.library_closed` | 생활·행정 |  |  | 후보 |
| 9 | A | 천지연폭포는 몇 시까지 볼 수 있어요? | `tour.attraction_hours` | 관광·축제 |  | 🌐 | L2 담당 확인 |
| 10 | A | 정방폭포 관람 시간은? | `tour.attraction_hours` | 관광·축제 |  | 🌐 | L2 담당 확인 |
| 11 | A | 천지연폭포 입장료는 얼마예요? | `tour.attraction_fee` | 관광·축제 |  | 🌐 | L2 담당 확인 |
| 12 | A | 중문 대포 주상절리대 입장료는? | `tour.attraction_fee` | 관광·축제 |  | 🌐 | L2 담당 확인 |
| 13 | A | 서귀포 칠십리 축제는 언제예요? | `tour.festival_dates` | 관광·축제 |  | 🌐 | L2 담당 확인 |
| 14 | A | 중문 관광안내소는 어디 있고 어떤 언어를 지원해요? | `tour.info_center` | 관광·축제 |  |  | 후보 |
| 15 | A | 서귀포 시내버스 노선이 바뀐 곳이 있어요? | `traffic.bus_change` | 교통 |  |  | 확인 필요 |
| 16 | A | 중문 관광단지 버스 정류장이 바뀌었나요? | `traffic.bus_change` | 교통 |  |  | 확인 필요 |
| 17 | A | 서귀포 버스터미널은 어디에 있어요? | `traffic.terminal` | 교통 |  |  | L3 공식 |
| 18 | A | 서귀포 매일올레시장 공영주차장 요금은? | `traffic.public_parking` | 교통 |  |  | 확인 필요 |
| 19 | A | 천지연폭포 주차는 무료예요? | `traffic.public_parking` | 교통 |  |  | 후보 |
| 20 | A | 서귀포에서 교통약자 이동지원 차량은 어떻게 불러요? | `traffic.mobility_support` | 교통 | ⚠ |  | L2 담당 확인 |
| 21 | A | 서귀포보건소 진료 시간은? | `welfare.health_center_hours` | 복지 | ⚠ |  | L2 담당 확인 |
| 22 | A | 서귀포 동부보건소는 토요일에도 해요? | `welfare.health_center_hours` | 복지 | ⚠ |  | 확인 필요 |
| 23 | A | 서귀포 출산 지원금은 누가 받을 수 있어요? | `welfare.eligibility` | 복지 | ⚠ |  | 확인 필요 |
| 24 | A | 서귀포에서 기초연금은 어디서 신청해요? | `welfare.apply_where` | 복지 |  |  | L2 담당 확인 |
| 25 | A | 서귀포에서 장애인 등록은 어디서 해요? | `welfare.apply_where` | 복지 |  |  | L2 담당 확인 |
| 26 | A | 서귀포 기초연금 신청 서류는? | `welfare.documents` | 복지 |  |  | L2 담당 확인 |
| 27 | A | 서귀포 외국인 지원 창구는 어디예요? | `foreign.support_center` | 외국인 정보 |  |  | 확인 필요 |
| 28 | A | 서귀포 다국어 상담은 무슨 요일에 해요? | `foreign.multilang_days` | 외국인 정보 |  |  | 확인 필요 |
| 29 | A | 서귀포에 사는 외국인은 건강보험 안내를 어디서 받아요? | `foreign.health_insurance` | 외국인 정보 |  |  | 확인 필요 |
| 30 | A | 서귀포에 사는 외국인의 외국인 등록 관할은? | `foreign.registration` | 외국인 정보 |  |  | L2 담당 확인 |
| 31 | A | 서귀포 태풍 대피소는 어디서 확인해요? | `safety.shelter_lookup` | 재난·안전 | ⚠ |  | L3 공식 |
| 32 | A | 서귀포 지진해일 대피 장소는? | `safety.shelter_lookup` | 재난·안전 | ⚠ |  | L3 공식 |
| 33 | A | 서귀포 재난 문자는 어떻게 받아요? | `safety.alert_channel` | 재난·안전 | ⚠ |  | L3 공식 |
| 34 | A | 서귀포에서 밤에 갈 수 있는 응급실은? | `safety.night_er` | 재난·안전 | ⚠ |  | L2 담당 확인 |
| 35 | A | 서귀포에서 일요일에 문 연 약국은 어떻게 찾아요? | `safety.holiday_pharmacy` | 재난·안전 | ⚠ |  | L2 담당 확인 |
| 36 | A | 중문 근처에서 밤에 진료받을 수 있는 곳은? | `safety.night_er` | 재난·안전 | ⚠ |  | 확인 필요 |
| 37 | B | 서귀포 클린하우스는 요일별로 뭘 버려요? | `life.waste_day` | 생활·행정 |  |  | L2 담당 확인 |
| 38 | B | 서귀포 음식물쓰레기 배출 시간은? | `life.waste_day` | 생활·행정 |  |  | L2 담당 확인 |
| 39 | B | 서귀포 대형폐기물은 어떻게 신고해요? | `life.waste_day` | 생활·행정 |  |  | L2 담당 확인 |
| 40 | B | 서귀포시청 무인민원발급기는 몇 시까지 돼요? | `life.kiosk` | 생활·행정 |  |  | 후보 |
| 41 | B | 서귀포시청 대표 전화번호는? | `life.civil_contact` | 생활·행정 |  |  | L3 공식 |
| 42 | B | 서귀포 국민체육센터 수영장 이용 시간은? | `life.sports_facility` | 생활·행정 |  |  | 후보 |
| 43 | B | 송산동 민방위 대피시설은 어디예요? | `safety.civil_defense` | 재난·안전 | ⚠ |  | 후보 |
| 44 | B | 중문동 주민센터 운영 시간은? | `life.office_hours` | 생활·행정 |  |  | L2 담당 확인 |
| 45 | B | 송산동 주민센터 운영 시간은? | `life.office_hours` | 생활·행정 |  |  | L2 담당 확인 |
| 46 | B | 서귀포보건소 주소는? | `life.office_address` | 생활·행정 |  |  | L3 공식 |
| 47 | B | 서귀포에서 받는 기초연금 한 달 최대 금액은? | `welfare.amount` | 복지 | ⚠ |  | L3 공식 |
| 48 | B | 서귀포 발달장애인 지원 창구는 어디예요? | `welfare.disability_desk` | 복지 | ⚠ |  | 후보 |
| 49 | B | 서귀포 향토오일시장 장날은? | `tour.market_days` | 관광·축제 |  |  | L2 담당 확인 |
| 50 | B | 서귀포 매일올레시장은 쉬는 날이 있어요? | `tour.market_days` | 관광·축제 |  |  | 정본 공백 |
| 51 | B | 천지연폭포는 휠체어로 갈 수 있어요? | `tour.accessibility` | 관광·축제 |  |  | 확인 필요 |
| 52 | B | 올레길 무장애 구간이 있어요? | `tour.accessibility` | 관광·축제 |  |  | 확인 필요 |
| 53 | B | 서귀포 자연휴양림은 예약해야 해요? | `tour.reservation` | 관광·축제 |  |  | L2 담당 확인 |
| 54 | B | 서귀포 치유의 숲은 예약해야 해요? | `tour.reservation` | 관광·축제 |  |  | L2 담당 확인 |
| 55 | B | 외돌개 산책로 낙석 통제는 어디서 확인해요? | `safety.hazard_notice` | 재난·안전 | ⚠ |  | 후보 |
| 56 | B | 이중섭미술관 휴관일은? | `tour.attraction_hours` | 관광·축제 |  |  | L2 담당 확인 |
| 57 | B | 이중섭미술관 관람료는? | `tour.attraction_fee` | 관광·축제 |  |  | L2 담당 확인 |
| 58 | B | 올해 최남단 방어축제는 언제예요? | `tour.festival_dates` | 관광·축제 |  |  | 확인 필요 |
| 59 | B | 가시리 유채꽃축제는 언제예요? | `tour.festival_dates` | 관광·축제 |  |  | 확인 필요 |
| 60 | B | 서귀포에 공공자전거가 있어요? | `traffic.bike` | 교통 |  |  | 확인 필요 |
| 61 | B | 중문 관광단지 공영주차장은 어디예요? | `traffic.public_parking` | 교통 |  |  | 후보 |
| 62 | B | 서귀포 중앙로터리 시외버스 정류장은 어디예요? | `traffic.terminal` | 교통 |  |  | L2 담당 확인 |
| 63 | B | 제주공항에서 중문 가는 공항버스는? | `traffic.airport_access` | 교통 |  | 🌐 | L2 담당 확인 |
| 64 | B | 가파도 가는 배는 어디서 타요? | `traffic.ferry` | 교통 | ⚠ | 🌐 | L2 담당 확인 |
| 65 | B | 마라도 가는 배는 몇 시에 있어요? | `traffic.ferry` | 교통 | ⚠ |  | 확인 필요 |
| 66 | B | 서귀포 출산 지원금은 얼마예요? | `welfare.amount` | 복지 | ⚠ |  | 확인 필요 |
| 67 | B | 서귀포 노인복지관은 어디에 있어요? | `welfare.senior_center` | 복지 |  |  | 후보 |
| 68 | B | 서귀포 공동육아나눔터는 어디예요? | `welfare.childcare` | 복지 |  |  | 후보 |
| 69 | B | 서귀포 장애인 복지 상담은 어디서 해요? | `welfare.disability_desk` | 복지 | ⚠ |  | 후보 |
| 70 | B | 서귀포 치매안심센터 운영 시간은? | `welfare.health_center_hours` | 복지 | ⚠ |  | 후보 |
| 71 | B | 서귀포 무료 독감 접종 대상은? | `welfare.eligibility` | 복지 | ⚠ |  | 확인 필요 |
| 72 | B | 서귀포 장애인 등록 서류는? | `welfare.documents` | 복지 |  |  | L2 담당 확인 |
| 73 | B | 서귀포 긴급복지 지원은 어디서 신청해요? | `welfare.apply_where` | 복지 |  |  | L2 담당 확인 |
| 74 | B | 서귀포에서 외국인 관광객 긴급 통역은 어떻게 받아요? | `foreign.emergency_lang` | 외국인 정보 | ⚠ | 🌐 | L2 담당 확인 |
| 75 | B | 서귀포 외국인 한국어 교실은 언제 해요? | `foreign.multilang_days` | 외국인 정보 |  |  | 확인 필요 |
| 76 | B | 중문에서 관광 통역 안내는 어떻게 받아요? | `foreign.tourist_hotline` | 외국인 정보 |  |  | L3 공식 |
| 77 | B | 동홍동 민방위 대피시설은 어디예요? | `safety.civil_defense` | 재난·안전 | ⚠ |  | 후보 |
| 78 | B | 서귀포 해안도로 월파 통제는 어디서 확인해요? | `safety.hazard_notice` | 재난·안전 | ⚠ |  | 후보 |
| 79 | C | 마라도 가는 배는 어디서 타요? | `traffic.ferry` | 교통 | ⚠ | 🌐 | L2 담당 확인 |
| 80 | C | 성산일출봉은 서귀포시예요? | `life.admin_name` | 생활·행정 |  |  | L3 공식 |
| 81 | C | 천지연폭포 야간 관람은 몇 시에 끝나요? | `tour.attraction_hours` | 관광·축제 |  |  | 확인 필요 |
| 82 | C | 서귀포 자연휴양림 캠핑장 예약은 언제 열려요? | `tour.reservation` | 관광·축제 |  |  | 확인 필요 |
| 83 | C | 중문 관광단지 안에서 응급 처치를 받을 곳이 있어요? | `safety.night_er` | 재난·안전 | ⚠ |  | 확인 필요 |
| 84 | C | 중문 관광단지 안내센터는 어떤 언어로 안내해요? | `tour.info_center` | 관광·축제 |  |  | 후보 |
| 85 | C | 서귀포 관광지 순환버스는 지금도 다녀요? | `traffic.bus_change` | 교통 |  |  | 확인 필요 |
| 86 | C | 쇠소깍 주차 요금은? | `traffic.public_parking` | 교통 |  |  | 후보 |
| 87 | C | 서귀포 농어업인 수당은 누가 받아요? | `welfare.eligibility` | 복지 | ⚠ |  | 확인 필요 |
| 88 | C | 중문 색달해수욕장 입수 통제는 어디서 확인해요? | `safety.hazard_notice` | 재난·안전 | ⚠ | 🌐 | L2 담당 확인 |
| 89 | C | 서귀포에서 밤에 아이 진료할 곳이 있어요? | `safety.night_er` | 재난·안전 | ⚠ |  | 확인 필요 |
| 90 | C | 서귀포 이주노동자 상담은 어디서 해요? | `foreign.support_center` | 외국인 정보 |  |  | 확인 필요 |
| 91 | C | 서귀포 겨울 감귤 축제는 언제예요? | `tour.festival_dates` | 관광·축제 |  |  | 확인 필요 |
| 92 | C | 여권은 서귀포시청 제1청사와 제2청사 중 어디서 만들어요? | `life.office_address` | 생활·행정 |  |  | L2 담당 확인 |
| 93 | C | 중문관광단지는 서귀포시 어느 동이에요? | `life.admin_name` | 생활·행정 |  |  | L3 공식 |
| 94 | C | 서귀포 혁신도시 환승 정류장은 어디예요? | `traffic.terminal` | 교통 |  |  | 후보 |
| 95 | C | 매일올레시장에 장애인 화장실이 있어요? | `tour.accessibility` | 관광·축제 |  |  | 확인 필요 |
| 96 | C | 서귀포 외국인 주민 출산 지원은 어디서 신청해요? | `welfare.apply_where` | 복지 |  |  | 확인 필요 |
| 97 | C | 가파도 청보리 축제 기간에 배가 늘어나요? | `traffic.ferry` | 교통 | ⚠ |  | 확인 필요 |
| 98 | C | 가파도 청보리 축제는 언제예요? | `tour.festival_dates` | 관광·축제 |  |  | 확인 필요 |
| 99 | C | 관광객은 서귀포에서 쓰레기를 어떻게 버려요? | `life.waste_day` | 생활·행정 |  |  | L2 담당 확인 |
| 100 | C | 서귀포 중국어 관광 안내는 무슨 요일에 해요? | `foreign.multilang_days` | 외국인 정보 |  |  | 확인 필요 |
| 101 | C | 눈 올 때 1100도로 통제는 어디서 확인해요? | `safety.hazard_notice` | 재난·안전 | ⚠ |  | L2 담당 확인 |
| 102 | C | 1100도로가 통제되면 버스는 어떻게 다녀요? | `traffic.bus_change` | 교통 |  |  | 확인 필요 |
| 103 | D | 서귀포 매일올레시장 휴무일은? | `tour.market_days` | 관광·축제 |  |  | 정본 공백 |
| 104 | D | 서귀포에서 반려견과 갈 수 있는 해수욕장은? | `tour.attraction_hours` | 관광·축제 |  |  | 정본 공백 |
| 105 | D | 서귀포 공영주차장에서 전기차 충전이 돼요? | `traffic.public_parking` | 교통 |  |  | 정본 공백 |
| 106 | D | 동홍동 클린하우스는 어디예요? | `life.waste_day` | 생활·행정 |  |  | L1 주민 확인 |
| 107 | D | 서귀포 노인 일자리는 언제 신청해요? | `welfare.apply_where` | 복지 |  |  | 정본 공백 |
| 108 | D | 서귀포 감귤 수확 체험은 언제 해요? | `tour.festival_dates` | 관광·축제 |  |  | 정본 공백 |
| 109 | D | 중문 해수욕장 개장 기간은? | `tour.attraction_hours` | 관광·축제 |  |  | 후보 |
| 110 | D | 서귀포 외국인 계절근로자 상담은 어디서 해요? | `foreign.support_center` | 외국인 정보 |  |  | 정본 공백 |
| 111 | D | 서귀포 청소년수련관 프로그램은 어떻게 신청해요? | `life.sports_facility` | 생활·행정 |  |  | 정본 공백 |
| 112 | D | 강정동 마을버스 막차는 몇 시예요? | `traffic.bus_change` | 교통 |  |  | 정본 공백 |
| 113 | D | 서귀포에 공공 산후조리원이 있어요? | `welfare.apply_where` | 복지 |  |  | 정본 공백 |
| 114 | D | 정방폭포에 장애인 주차 구역이 있어요? | `tour.accessibility` | 관광·축제 |  |  | 정본 공백 |
| 115 | E | 서귀포시는 제주특별자치도의 행정시인가요? (카나리) | `life.admin_name` | 생활·행정 |  |  | L3 공식 |
| 116 | E | 천지연폭포는 서귀포시에 있어요? (카나리) | `tour.attraction_hours` | 관광·축제 |  |  | L3 공식 |
| 117 | E | 마라도는 서귀포시 어느 읍에 속해요? (카나리) | `life.admin_name` | 생활·행정 |  |  | L3 공식 |
| 118 | E | 서귀포 버스 요금이 최근 바뀌었나요? (최근 변경) | `traffic.bus_change` | 교통 |  |  | 확인 필요 |
| 119 | E | 서귀포 클린하우스 요일별 배출 품목이 최근 바뀌었나요? (최근 변경) | `life.waste_day` | 생활·행정 |  |  | 확인 필요 |
| 120 | E | 올해 칠십리 축제 날짜가 예년과 달라졌나요? (최근 변경) | `tour.festival_dates` | 관광·축제 |  |  | L2 담당 확인 |
