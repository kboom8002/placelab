# ADR-0026 · MAPS 상용 서브시스템 아키텍처 (3-Lane 분리 및 6분류 기준일 판정)

- **상태**: 승인 (2026-10-23)
- **관련 요구사항**: `FR-97` ~ `FR-106`
- **관련 불변식**: `INV-3`, `INV-6`, `INV-7`, `INV-9`, `INV-11`, `INV-12`, `INV-14`, `INV-17`, `MAPS-INV-01` ~ `MAPS-INV-20`

---

## 1. 배경

공공 공표 트랙인 **모두의 정답노트**(광역 16 · 기초 227 · 특별구역 공익 측정)와 별개로, 민간 기업·병원·대학·로컬 상권·준공공 출자출연기관이 자사 정본(canonical facts)과 AI 답변 사이의 간극(Gap)을 스스로 재고·맞추고·메우고·전후 효과를 증명하는 상용 서브시스템 **MAPS 스튜디오 (Multi-AI Presence & Alignment Studio)** 를 동일 모노레포 내에 구축한다.

이때 공공 공표 트랙의 독립성(`INV-17` A원칙)과 방법론 엄밀성을 훼손하지 않으면서, 시간축 변화(`outdated`·지연 일수)와 인용 부재 단언(`asserted` / `MAPS-INV-20`), 간극 우선순위(`G1~G6` 5요소 분해)를 정밀하게 다루는 아키텍처가 필요하다.

---

## 2. 결정

### 2.1 라우트 및 브랜드 격리 (D1)
1. 모두의 정답노트가 이미 사용 중인 `/maps`(전국 공식 근거 지도 등)와 충돌하지 않도록 MAPS 서브시스템의 경로를 다음과 같이 분리한다.
   - **스토어프론트**: `/studio` (카탈로그, A원칙 적격성·무료 간극 점검, 샘플 리포트 `[가상]`, 방법론 공개 요약, 약관·보증 한계)
   - **고객사 워크스페이스**: `/workspace` (정본 이원 시간 대장, 6분류 판정·`[정본 고치기]`, `G1~G6` 간극 작업함·6단계 처방전, Proof 전후 대조 리포트, 이의 신청)
   - **운영 어드민 콘솔**: `/ops/maps` (수집 보관소·카나리아 감시, 테넌트 적격성·SKU `price_status` 관리, 문항 세트 동결·비공개 대조군, 블라인드 판정 큐·Krippendorff $\alpha$, 리포트 금칙어 발행 게이트)
2. 상용 브랜드명에는 공공 공표 브랜드인 `"정답노트"`를 쓰지 않고 **「MAPS 스튜디오 (MAPS Studio)」** (`재기 · 맞추기 · 간극 짚기 · 메우기`)를 사용한다.

### 2.2 3-Lane 모듈 및 스키마 분리
1. 코드베이스는 `lib/maps/core` (순수 판정·간극·효과 추정 엔진), `lib/maps/billing` (결제·주문·견적 격리), `app/(public)/studio` · `app/(org)/workspace` · `app/(admin)/ops/maps` 로 나눈다.
2. 데이터베이스 테이블은 `maps_*` (코어 측정·정본·판정·간극·리포트)와 `maps_billing_*` (상품·주문·결제·구독·청구서)로 분리하며, 기존 공공 테이블(`units`, `probe_runs`, `probe_judgments` 등)을 수정하지 않는다.

### 2.3 이원 시간(`as-of`) 정본 대장 및 6분류 판정 (`MAPS-INV-03`, `MAPS-INV-04`, `MAPS-INV-20`)
1. `maps_fact_versions` 는 `valid_from`, `valid_to`(사실 효력 기간)와 `recorded_at`, `superseded_at`(시스템 기록 시점)의 이원 시간(bitemporal) 구조를 가지며 UPDATE/DELETE가 금지된 append-only 테이블로 운용한다.
2. 모든 판정(`judgeObservationAsOf`)은 관측 시점 `observed_at` 에 유효했던 정본(`factsAsOf`)만을 기준으로 삼는다. 정본이 나중에 바뀌어도 과거 관측에 소급 적용하지 않는다.
3. 판정 분류는 `correct`(일치), `outdated`(구버전 — 과거 정본과 일치), `confused`(혼동 — 타 대상 속성과 일치), `fabricated`(창작 — 근거 없는 수치·사실), `asserted`(단언 — 값은 맞으나 공식·1차 인용 없음, `MAPS-INV-20`에 따라 `factualRate` 분자에서 제외), `honest_unknown`(정직한 모름) 6분류로 산출한다.
4. `maps_judgments` 역시 append-only 로 운용하며 재판정이나 이의 인용 시 `supersedes_judgment_id` 로 연결된 새 행을 추가한다.

### 2.4 간극(`G1~G6`) 조회 시점 산출 및 5요소 우선순위 분해 (`INV-9`, `MAPS-INV-09`)
1. 반복 관측(`maps_observations`)은 `(run_id, question_id, rep)` 단위로 개별 보존하며 문항당 1행으로 뭉치지 않는다(`INV-9`).
2. 6대 간극(`G1` 존재, `G2` 사실, `G3` 시간, `G4` 출처, `G5` 맥락·비교, `G6` 엔진 편차)과 5대 편향 렌즈는 원시 관측·판정으로부터 조회 시점에 계산한다.
3. 간극 우선순위(`priority`)는 반드시 `demand`, `gap`, `harm`, `feasibility`, `cost` 5개 구성요소와 함께 반환하며(`MAPS-INV-09`), 외부 공개 페이지(`/studio/method`)에는 개념만 설명하고 내부 가중치 산식은 노출하지 않는다(`MAPS-INV-19`).

### 2.5 이해충돌 방지 게이트 (`INV-17`, `MAPS-INV-17`)
1. 지방자치단체(`metro` 광역 16 · `basic` 기초 227)의 유상 구매·컨설팅·무상 진단은 접수 및 무료 점검 단계(`checkMapsEligibility`)에서 즉시 차단하고 공공 트랙(`/selfcheck`, `/units`)으로 안내한다.
2. 지방공기업(`public_corp`) 및 출자·출연기관(`foundation`)은 후원·용역 이해관계 공시(`sponsor_disclosure`)가 입력된 경우에만 허용한다.

---

## 3. 결과

- 공공 측정 트랙과 상용 B2B 스튜디오가 법적·윤리적·데이터적으로 명확히 분리되면서도 Responses API 웹 검색 수집기, 불변식 검증 체계, 디자인 토큰을 안전하게 공유한다.
