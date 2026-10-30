# 속성 사전 v0.1 (6영역 42속성)

> 시드 원천: `supabase/seed/attributes.sql`. 새 속성은 ① 값 형식 ② 정본 출처 ③ 판정 가능성이 있어야 추가한다. 의견·추천·순위는 속성이 될 수 없다.

표기: 층 = 광(metro)·기(basic)·동(dong) · 코어 = 공통 코어(A칸) 대상 · ⚠ = 위험 가능 속성(`is_risk`)

## 생활·행정 (life, 8)

| 코드 | 속성 | 값 형식 | 변동성 | 층 | 코어 | ⚠ |
| --- | --- | --- | --- | --- | --- | --- |
| `life.office_hours` | 민원 창구 운영 시간 | 시간표 | 정기 (periodic) | 광·기·동 | ● |  |
| `life.office_address` | 청사·행정복지센터 소재지 | 주소 | 고정 (fixed) | 광·기·동 | ● |  |
| `life.admin_name` | 행정구역 명칭·소속 | 명칭+승계 | 제도 (institutional) | 광·기·동 | ● |  |
| `life.library_closed` | 공공도서관 휴관일 | 요일 규칙 | 정기 (periodic) | 기·동 | ● |  |
| `life.waste_day` | 생활쓰레기 배출 요일 | 요일+시간 | 정기 (periodic) | 기·동 |  |  |
| `life.kiosk` | 무인민원발급기 | 목록+시간 | 정기 (periodic) | 기·동 |  |  |
| `life.civil_contact` | 대표 민원 전화 | 연락처 | 고정 (fixed) | 광·기 |  |  |
| `life.sports_facility` | 공공체육시설 운영·요금 | 시간표+금액 | 정기 (periodic) | 기·동 |  |  |

## 관광·축제 (tour, 7)

| 코드 | 속성 | 값 형식 | 변동성 | 층 | 코어 | ⚠ |
| --- | --- | --- | --- | --- | --- | --- |
| `tour.attraction_hours` | 대표 관광지 운영 시간 | 시간표 | 정기 (periodic) | 광·기 | ● |  |
| `tour.attraction_fee` | 관광지 입장료 | 금액 | 정기 (periodic) | 광·기 | ● |  |
| `tour.festival_dates` | 축제·행사 일정·장소 | 날짜 구간+장소 | 행사 (event) | 광·기·동 | ● |  |
| `tour.info_center` | 관광안내소·지원 언어 | 주소+목록 | 고정 (fixed) | 광·기 | ● |  |
| `tour.market_days` | 전통시장 장날 | 날짜 규칙 | 정기 (periodic) | 기·동 |  |  |
| `tour.accessibility` | 관광지 무장애 정보 | 목록 | 정기 (periodic) | 광·기 |  |  |
| `tour.reservation` | 예약 필요 여부 | 예/아니오+경로 | 정기 (periodic) | 기 |  |  |

## 교통 (traffic, 7)

| 코드 | 속성 | 값 형식 | 변동성 | 층 | 코어 | ⚠ |
| --- | --- | --- | --- | --- | --- | --- |
| `traffic.bus_change` | 버스 노선·정류장 변경 | 날짜+내용 | 일시 (temporary) | 기·동 | ● |  |
| `traffic.terminal` | 터미널·역 위치 | 주소 | 고정 (fixed) | 광·기 | ● |  |
| `traffic.public_parking` | 공영주차장 위치·요금 | 주소+금액 | 정기 (periodic) | 기·동 | ● |  |
| `traffic.mobility_support` | 교통약자 이동지원 신청 | 절차+연락처 | 제도 (institutional) | 광·기 | ● | ⚠ |
| `traffic.ferry` | 여객선 출발지·운항 | 장소+시간표 | 정기 (periodic) | 광·기 |  | ⚠ |
| `traffic.airport_access` | 공항 접근 교통 | 목록 | 정기 (periodic) | 광 |  |  |
| `traffic.bike` | 공공자전거 | 예/아니오+위치 | 정기 (periodic) | 기 |  |  |

## 복지 (welfare, 8)

| 코드 | 속성 | 값 형식 | 변동성 | 층 | 코어 | ⚠ |
| --- | --- | --- | --- | --- | --- | --- |
| `welfare.health_center_hours` | 보건소·보건지소 진료 시간 | 시간표 | 정기 (periodic) | 기·동 | ● | ⚠ |
| `welfare.eligibility` | 복지 서비스 대상 기준 | 조건 | 제도 (institutional) | 광·기 | ● | ⚠ |
| `welfare.apply_where` | 신청처 | 기관 | 제도 (institutional) | 기·동 | ● |  |
| `welfare.documents` | 필요 서류 | 목록 | 제도 (institutional) | 기 | ● |  |
| `welfare.amount` | 지원 금액 | 금액 | 제도 (institutional) | 광·기 |  | ⚠ |
| `welfare.senior_center` | 경로당·노인복지관 | 주소 | 고정 (fixed) | 동 |  |  |
| `welfare.childcare` | 돌봄센터 운영 | 시간표 | 정기 (periodic) | 기·동 |  |  |
| `welfare.disability_desk` | 장애인 지원 창구 | 기관+연락처 | 제도 (institutional) | 기 |  | ⚠ |

## 외국인 정보 (foreign, 6)

| 코드 | 속성 | 값 형식 | 변동성 | 층 | 코어 | ⚠ |
| --- | --- | --- | --- | --- | --- | --- |
| `foreign.support_center` | 외국인주민지원센터 | 주소+시간표 | 정기 (periodic) | 광·기 | ● |  |
| `foreign.multilang_days` | 다국어 상담 요일·언어 | 요일+언어 | 정기 (periodic) | 광·기 | ● |  |
| `foreign.health_insurance` | 외국인 건강보험 안내 | 기관 | 제도 (institutional) | 광·기 | ● |  |
| `foreign.registration` | 외국인 등록 관할 | 기관+주소 | 제도 (institutional) | 광·기 | ● |  |
| `foreign.tourist_hotline` | 관광 통역 안내 전화 | 연락처 | 고정 (fixed) | 광 |  |  |
| `foreign.emergency_lang` | 다국어 긴급 안내 | 경로 | 제도 (institutional) | 광·기 |  | ⚠ |

## 재난·안전 (safety, 6)

| 코드 | 속성 | 값 형식 | 변동성 | 층 | 코어 | ⚠ |
| --- | --- | --- | --- | --- | --- | --- |
| `safety.shelter_lookup` | 대피소 확인 경로 | 경로 | 제도 (institutional) | 광·기·동 | ● | ⚠ |
| `safety.alert_channel` | 재난 안내 수신 채널 | 목록 | 제도 (institutional) | 광·기 | ● | ⚠ |
| `safety.night_er` | 야간·휴일 응급의료기관 | 기관+주소 | 정기 (periodic) | 기 | ● | ⚠ |
| `safety.holiday_pharmacy` | 휴일 약국 확인 경로 | 경로 | 일시 (temporary) | 기·동 | ● | ⚠ |
| `safety.civil_defense` | 민방위 대피시설 | 주소 | 고정 (fixed) | 동 |  | ⚠ |
| `safety.hazard_notice` | 산불·태풍 통제 공지 | 경로 | 일시 (temporary) | 광·기 |  | ⚠ |

## 공통 코어 24 / 동 코어 6

- 공통 코어: 영역마다 코어(●) 4개씩 = 24.
- 동 코어 6: `life.office_hours`, `life.admin_name`, `tour.festival_dates`, `traffic.bus_change`, `welfare.health_center_hours`, `safety.shelter_lookup`.

## 속성 후보 (사전 v0.2 검토)

| 코드 | 내용 | 출처 |
| --- | --- | --- |
| `traffic.transit_pass*` | 대중교통 정기권 요금·범위 (예: 기후동행카드) | 서울 C칸 |
| `traffic.pm_rule*` | 개인형 이동장치 규칙·견인 기준 | 강남 C칸 |
| `traffic.parking_rule*` | 차고지 증명 등 주차 제도 | 제주 C칸 |
| `life.drug_disposal*` | 폐의약품 수거함 | 강남 주민 제안 |
| `life.wifi*` | 공공 와이파이 | 강남 주민 제안 |
