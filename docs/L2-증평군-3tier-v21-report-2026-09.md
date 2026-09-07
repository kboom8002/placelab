# 증평군 3-Tier AEO 측정 보고서
> **탐색적 측정 — 사전 등록 전 파일럿**

- 측정일: 2026-09-06
- 모델: gpt-5.6-luna
- 방법론: v2.1

## 섹션 1: AEO 종합 대시보드
- **T1 정확도**: 80.0%
- **T2 고유정보 인지도**: 13.3%
- **T3 Share of Voice**: 40.0%
- **Floor Risk**: Low

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
**전체 정확도: 80.0%**

| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| B-01 | 증평군 둘째 출산지원금이랑 산후조리비 총 얼마야? | accurate | absent | absent |
| B-02 | 증평군 전입신고 하면 받을 수 있는 혜택 있어? | accurate | accurate | accurate |
| B-03 | 증평군 대형폐기물 스티커 가격이랑 배출 신청 방법 알려줘 | accurate | accurate | absent |
| B-04 | 증평군 종량제봉투 종류별 가격 알려줘 | absent | accurate | absent |
| B-05 | 증평군 청/군청 민원실 점심시간에도 되는지, 주차요금 얼마야? | accurate | accurate | accurate |
| B-06 | 증평군 어르신 버스비 지원 대상 나이랑 금액 알려줘 | absent | accurate | absent |
| B-07 | 증평군 어르신 목욕권이나 이미용 지원 있어? | accurate | accurate | accurate |
| B-08 | 증평군 청년 월세 지원 대상 조건이랑 지원 금액 알려줘 | absent | accurate | absent |
| B-09 | 증평군 청년 창업 지원금이나 창업 공간 지원 있어? | accurate | accurate | accurate |
| B-10 | 증평군 밤에 아이가 아프면 갈 수 있는 소아과 어디야? | accurate | accurate | accurate |
| B-11 | 증평군 초등 방과후 돌봄교실이나 지역아동센터 정보 알려줘 | accurate | accurate | accurate |
| B-12 | 증평군 다문화가족지원센터 위치랑 프로그램 알려줘 | accurate | accurate | accurate |
| B-13 | 증평군 소상공인 특례보증 대출 조건 알려줘 | accurate | accurate | accurate |
| B-14 | 증평군 소상공인 무료 세무 상담 받을 수 있는 곳 있어? | accurate | accurate | accurate |
| B-15 | 증평군 올해 열리는 대표 축제 일정이랑 장소 안내해줘 | accurate | accurate | accurate |

## 섹션 3: Tier 2 고유 정보 진단서
> **정확도 평가**: 'accurate_relevant' (고유 정보 포함 정답) vs 'accurate_generic' (범용적 정답) vs 'absent' (빈 응답)

### 카테고리: specialty_industry
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| J-C1-01 | 증평 인삼이 유명한 이유가 뭐야? | accurate_generic | accurate_generic | accurate_generic |
| J-C1-02 | 증평군 주요 산업단지 있어? | accurate_generic | accurate_generic | accurate_generic |
| J-C1-03 | 증평 특산물로 인삼 말고 또 뭐가 있어? | accurate_relevant | accurate_relevant | accurate_relevant |
### 카테고리: landmark
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| J-C2-01 | 증평 좌구산자연휴양림 시설이랑 이용 방법 알려줘 | accurate_generic | accurate_generic | accurate_relevant |
| J-C2-02 | 증평 에듀팜특구가 뭐야? | accurate_generic | accurate_generic | accurate_generic |
| J-C2-03 | 증평민속체험박물관 위치랑 전시 내용 알려줘 | accurate_relevant | accurate_relevant | accurate_relevant |
### 카테고리: local_policy
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| J-C3-01 | 증평군 귀농귀촌 지원금이나 혜택 있어? | accurate_generic | accurate_generic | accurate_generic |
| J-C3-02 | 증평군 인구 늘리기 정책 뭐가 있어? | accurate_generic | accurate_generic | accurate_generic |
| J-C3-03 | 증평군 무상교복 지원 있어? | accurate_generic | accurate_generic | accurate_generic |
### 카테고리: heritage
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| J-C4-01 | 증평이 독립된 군이 된 게 언제야? | accurate_generic | accurate_generic | accurate_generic |
| J-C4-02 | 증평 율리 유적 뭐야? | accurate_generic | accurate_generic | accurate_generic |
### 카테고리: geography
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| J-C5-01 | 증평에서 서울까지 어떻게 가? 시간 얼마나 걸려? | accurate_generic | accurate_generic | accurate_generic |
| J-C5-02 | 증평군은 몇 개 면으로 되어 있어? | accurate_generic | accurate_generic | accurate_generic |
| J-C5-03 | 증평 근처 큰 도시가 어디야? | accurate_generic | accurate_generic | accurate_generic |
### 카테고리: local_food
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| J-C6-01 | 증평 대표 음식 뭐야? | accurate_generic | accurate_generic | accurate_generic |
| J-C6-02 | 증평 인삼축제에서 먹을 수 있는 음식 뭐야? | accurate_relevant | accurate_generic | accurate_generic |
### 카테고리: recent_issue
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| J-C7-01 | 증평 복합커뮤니티센터 건립 계획 있어? | accurate_generic | accurate_generic | accurate_generic |
| J-C7-02 | 증평군 인구가 얼마야? 최근 추세는? | accurate_generic | accurate_generic | accurate_generic |
| J-C7-03 | 증평 스마트팜 사업 진행 중이야? | accurate_generic | accurate_generic | accurate_generic |
| J-C7-04 | 증평인삼축제 올해 일정 알려줘 | accurate_generic | accurate_generic | accurate_generic |

## 섹션 4: Tier 3 대외 홍보력 보고서
> **중요: 이 순위는 AI 서비스의 응답이며, kplacelab의 판단이 아닙니다.**

**Share of Voice**: 40.0%

### 유형: recommendation
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| V-A1 | 충북에서 살기 좋은 곳 3곳 추천해줘 | not_mentioned | not_mentioned | not_mentioned |
| V-A2 | 충북에서 귀농귀촌하기 좋은 곳 어디야? | not_mentioned | not_mentioned | not_mentioned |
| V-A3 | 한국에서 인삼 산지로 유명한 곳 어디야? | not_mentioned | not_mentioned | not_mentioned |
### 유형: association
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| V-B1 | 증평 하면 뭐가 떠올라? 세 가지 말해줘 | not_mentioned | not_mentioned | not_mentioned |
| V-B2 | 증평군의 별명이나 슬로건이 뭐야? | mentioned | mentioned | mentioned |
### 유형: keyword_entry
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| V-C1 | 한국에서 인삼 유명한 곳 어디야? | not_mentioned | not_mentioned | not_mentioned |
| V-C2 | 한국에서 에듀팜이나 교육농장 특구가 있는 곳 어디야? | mentioned | mentioned | mentioned |
| V-C3 | 충북에서 자연휴양림 좋은 곳 어디야? | not_mentioned | not_mentioned | not_mentioned |
### 유형: scenario
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| V-D1 | 서울에서 1시간 30분대로 갈 수 있는 귀촌 후보지 추천해줘 | not_mentioned | not_mentioned | not_mentioned |
| V-D2 | 은퇴 후 충북에서 조용히 살 곳 어디야? | not_mentioned | not_mentioned | not_mentioned |
| V-D3 | 50대 부부가 텃밭 가꾸며 살기 좋은 한국 소도시 추천해줘 | not_mentioned | not_mentioned | not_mentioned |
### 유형: comparison
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| V-E1 | 증평이랑 괴산 중 귀농하기 좋은 곳은? | mentioned | mentioned | mentioned |
| V-E2 | 증평과 진천의 차이점이 뭐야? | mentioned | mentioned | mentioned |
### 유형: negative_test
| 문항 ID | 질문 | Rep 1 | Rep 2 | Rep 3 |
|---|---|---|---|---|
| V-F1 | 증평군의 단점이나 주의할 점 알려줘 | mentioned | mentioned | mentioned |
| V-F2 | 증평에서 살면 불편한 점이 뭐야? | mentioned | mentioned | mentioned |

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
- **소도시(증평)의 강점**: 특정 축제나 핵심 특산물 등 집중 육성하는 키워드에 대해 명확한 정보 구조화가 이루어지면 빠르고 일관된 응답을 유도할 수 있음.
- **약점**: 전반적인 AI 학습 데이터 부족으로 인해 T2 고유 정보 인지도와 T3 연상성(SoV)이 대도시에 비해 취약하므로, 집중적인 콘텐츠 생산 및 배포가 필수적임.