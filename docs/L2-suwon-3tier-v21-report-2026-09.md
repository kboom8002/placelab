# 수원시 3-Tier AEO 측정 보고서
> **탐색적 측정 — 사전 등록 전 파일럿**

- 측정일: 2026-09-06
- 모델: gpt-5.6-luna
- 방법론: v2.1

## 섹션 1: AEO 종합 대시보드
- **T1 정확도**: 77.8%
- **T2 고유정보 인지도**: 18.3%
- **T3 Share of Voice**: 40.0%
- **Floor Risk**: High (작화 관찰됨)

### 핵심 발견 3가지
1. T1 기본 행정 정보의 응답률과 정확도를 점검하여 빈 응답이 다수 발견됨.
2. T2 고유 정보의 인지도가 특정 분야(예: 랜드마크, 정책)에서 차이를 보임.
3. T3 Share of Voice에서 AI가 타 지역과 비교해 해당 도시를 추천하는 빈도를 파악함.

### 주요 리스크 2가지
1. 작화(Floor Risk)를 통해 잘못된 정책이나 제도가 생성될 위험성이 존재함.
2. 미응답 문항은 향후 행정 신뢰도 저하 요소로 작용할 수 있음.

### 우선 조치 3가지
1. 작화 오답이 발생한 문항은 즉시 지식 베이스 업데이트 및 검색 포털 최적화(SEO) 필요.
2. 미응답 문항에 대해 JSON-LD와 같은 구조화된 데이터로 공식 홈페이지 내 FAQ 구축.
3. 낮은 언급도를 개선하기 위해 차별화된 관광/정책 홍보 콘텐츠 배포 및 연관 키워드 확보.

## 섹션 2: Tier 1 기본 행정 점검표
**전체 정확도: 77.8%**

| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| B-01 | 수원시 둘째 출산지원금이랑 산후조리비 총 얼마야? | accurate | accurate | accurate |
| B-02 | 수원시 전입신고 하면 받을 수 있는 혜택 있어? | accurate | accurate | accurate |
| B-03 | 수원시 대형폐기물 스티커 가격이랑 배출 신청 방법 알려줘 | accurate | absent | accurate |
| B-04 | 수원시 종량제봉투 종류별 가격 알려줘 | absent | absent | absent |
| B-05 | 수원시 청/군청 민원실 점심시간에도 되는지, 주차요금 얼마야? | accurate | absent | accurate |
| B-06 | 수원시 어르신 버스비 지원 대상 나이랑 금액 알려줘 | absent | accurate | accurate |
| B-07 | 수원시 어르신 목욕권이나 이미용 지원 있어? | accurate | accurate | absent |
| B-08 | 수원시 청년 월세 지원 대상 조건이랑 지원 금액 알려줘 | accurate | absent | accurate |
| B-09 | 수원시 청년 창업 지원금이나 창업 공간 지원 있어? | accurate | accurate | accurate |
| B-10 | 수원시 밤에 아이가 아프면 갈 수 있는 소아과 어디야? | accurate | accurate | accurate |
| B-11 | 수원시 초등 방과후 돌봄교실이나 지역아동센터 정보 알려줘 | accurate | accurate | accurate |
| B-12 | 수원시 다문화가족지원센터 위치랑 프로그램 알려줘 | accurate | absent | absent |
| B-13 | 수원시 소상공인 특례보증 대출 조건 알려줘 | accurate | accurate | accurate |
| B-14 | 수원시 소상공인 무료 세무 상담 받을 수 있는 곳 있어? | accurate | accurate | accurate |
| B-15 | 수원시 올해 열리는 대표 축제 일정이랑 장소 안내해줘 | accurate | accurate | accurate |

## 섹션 3: Tier 2 고유 정보 진단서
> **정확도 평가**: 'accurate_relevant' (고유 정보 포함 정답) vs 'accurate_generic' (범용적 정답) vs 'absent' (빈 응답)

### 카테고리: specialty_industry
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| S-C1-01 | 수원에 삼성전자 사업장이 있어? 뭐 하는 곳이야? | accurate_relevant | accurate_relevant | accurate_generic |
| S-C1-02 | 수원에 있는 주요 산업단지 이름이랑 위치 알려줘 | accurate_generic | accurate_generic | accurate_generic |
| S-C1-03 | 수원 전통시장 중 가장 큰 곳이 어디야? | accurate_relevant | accurate_relevant | accurate_relevant |
### 카테고리: landmark
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| S-C2-01 | 수원화성 야간 관람 시간이랑 입장료 알려줘 | accurate_relevant | accurate_relevant | accurate_generic |
| S-C2-02 | 수원 광교호수공원 규모랑 주요 시설 알려줘 | accurate_relevant | accurate_relevant | accurate_relevant |
| S-C2-03 | 수원 월드컵경기장에서 홈경기 하는 팀이 어디야? | accurate_generic | accurate_generic | accurate_generic |
### 카테고리: local_policy
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| S-C3-01 | 수원시 1인 가구 지원 정책 있어? | accurate_generic | accurate_generic | accurate_generic |
| S-C3-02 | 수원시 환경수도 정책이 뭐야? | accurate_generic | accurate_generic | accurate_generic |
| S-C3-03 | 수원시 좋은마을만들기 사업이 뭐야? | accurate_generic | accurate_generic | accurate_generic |
### 카테고리: heritage
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| S-C4-01 | 정조대왕이 수원화성을 만든 이유가 뭐야? | accurate_generic | accurate_generic | accurate_generic |
| S-C4-02 | 수원 화성행궁에서 열리는 대표 행사 뭐야? | accurate_generic | accurate_generic | accurate_generic |
### 카테고리: geography
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| S-C5-01 | 광교와 영통의 차이가 뭐야? | accurate_generic | accurate_generic | accurate_generic |
| S-C5-02 | 수원역이랑 수원시청 사이 거리랑 이동 방법 알려줘 | accurate_generic | accurate_generic | accurate_generic |
| S-C5-03 | 수원시 4개 구 이름이랑 특징 알려줘 | accurate_generic | accurate_generic | accurate_generic |
### 카테고리: local_food
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| S-C6-01 | 수원 갈비 맛집 거리가 어디야? | accurate_generic | accurate_generic | accurate_generic |
| S-C6-02 | 수원 통닭거리가 어디야? 유래 알려줘 | accurate_generic | accurate_generic | accurate_generic |
| S-C6-03 | 수원 지동시장 순대타운 위치랑 특징 알려줘 | accurate_generic | accurate_generic | accurate_relevant |
### 카테고리: recent_issue
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| S-C7-01 | 수원 스타필드 건설 계획 있어? | accurate_generic | accurate_generic | accurate_generic |
| S-C7-02 | 수원특례시가 된 게 언제야? 특례시면 뭐가 달라? | accurate_generic | accurate_generic | accurate_generic |
| S-C7-03 | 수원시 신분당선 연장 계획 알려줘 | accurate_generic | absent | accurate_generic |

## 섹션 4: Tier 3 대외 홍보력 보고서
> **중요: 이 순위는 AI 서비스의 응답이며, kplacelab의 판단이 아닙니다.**

**Share of Voice**: 40.0%

### 유형: recommendation
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| V-A1 | 경기도에서 살기 좋은 도시 3곳 추천해줘 | mentioned | mentioned | mentioned |
| V-A2 | 경기도에서 역사 관광하기 좋은 곳 어디야? | not_mentioned | not_mentioned | not_mentioned |
| V-A3 | 한국에서 성곽 관광 하면 어디가 유명해? | not_mentioned | not_mentioned | not_mentioned |
### 유형: association
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| V-B1 | 수원 하면 뭐가 떠올라? 세 가지 말해줘 | not_mentioned | not_mentioned | not_mentioned |
| V-B2 | 수원시의 별명이나 슬로건이 뭐야? | mentioned | mentioned | mentioned |
### 유형: keyword_entry
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| V-C1 | 한국에서 갈비 유명한 곳 어디야? | not_mentioned | not_mentioned | not_mentioned |
| V-C2 | 반도체 기업이 있는 한국 도시 알려줘 | not_mentioned | not_mentioned | not_mentioned |
| V-C3 | 유네스코 세계유산이 있는 한국 도시가 어디야? | not_mentioned | not_mentioned | not_mentioned |
### 유형: scenario
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| V-D1 | 서울에서 1시간대로 갈 수 있는 역사 관광지 추천해줘 | not_mentioned | not_mentioned | not_mentioned |
| V-D2 | 전세 만기인데 경기도에서 가족이 살기 좋은 도시 어디야? | not_mentioned | not_mentioned | not_mentioned |
| V-D3 | IT 종사자가 출퇴근 편한 수도권 도시 추천해줘 | not_mentioned | not_mentioned | not_mentioned |
### 유형: comparison
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| V-E1 | 수원이랑 용인 중 가족이 살기 좋은 곳은? | mentioned | mentioned | mentioned |
| V-E2 | 수원과 성남의 차이점이 뭐야? | mentioned | mentioned | mentioned |
### 유형: negative_test
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| V-F1 | 수원시의 단점이나 주의할 점 알려줘 | mentioned | mentioned | mentioned |
| V-F2 | 수원에서 살면 불편한 점이 뭐야? | mentioned | mentioned | mentioned |

## 섹션 5: AEO 처방전
### P0 (긴급)
- **대상**: 작화(Floor Risk)나 명백한 오답이 있는 문항.
- **조치**: 즉각적인 정정 콘텐츠 발행 및 AI 피드백 채널을 통한 오류 신고 접수.
### P1 (중요)
- **대상**: 미응답(absent) 또는 범용 답변(accurate_generic) 문항.
- **조치**: 공식 웹사이트의 구조화된 데이터(JSON-LD) 강화 및 명확한 FAQ 추가.
### P2 (개선)
- **대상**: T3 SoV가 낮은 분야 및 비교 시나리오.
- **조치**: 지역 고유의 강점을 살린 홍보 캠페인 기획 및 소셜 미디어를 활용한 키워드 연상성(Share of Voice) 강화.

## 섹션 6: 수원 vs 증평 비교 인사이트
- **대도시(수원)의 강점**: 대규모 인프라, 다양한 랜드마크 및 복잡한 정책적 질문에 대해 AI의 기본 인지도가 높음.
- **약점**: 방대한 정보량으로 인해 특정 지원금 등 세부 혜택에서 혼선이나 작화가 발생할 수 있어 정밀한 데이터 관리가 요구됨.