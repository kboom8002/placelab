# Part 8 · 전체 서비스 아티팩트 전수 마스터 레퍼런스 (기능 명세 · 사용자 가이드 · 운영자 가이드 총괄표)

이 문서는 모노레포(`c:\Users\User\kplacelab`)에 구현된 **모든 서비스 아티팩트(웹 화면, API, 도메인 엔진, DB 마이그레이션, CLI 스크립트, 불변식 테스트)** 에 대해 각각의 **① 기능 명세 요약, ② 사용자 가이드 핵심 행동, ③ 운영자(`ops_admin`) 가이드 핵심 통제 포인트**를 한눈에 찾아볼 수 있도록 정리한 마스터 레퍼런스입니다.

---

## 1. 트랙 1 — 모두의 정답노트 (Jeongdap Note · 공익 측정 및 공표 본체)

> 상세 문서는 [Part 1 정신 모델](./01-mental-model.md), [Part 2 기능 명세](./02-functional-spec.md), [Part 3 E2E 튜토리얼](./03-e2e-tutorial.md), [Part 4 기능 가이드](./04-feature-guide.md)를 참조하십시오.

| 아티팩트 (경로 / 파일) | ① 기능 명세 (Functional Spec) | ② 사용자 가이드 (시민 · 지자체 담당자) | ③ 운영자 가이드 (`ops_admin`) |
|---|---|---|---|
| **공개 홈 (`/`)**<br>[app/(public)/page.tsx](../../app/%28public%29/page.tsx) | 광역 16 · 기초 227 모집단 분리 요약(`INV-1`), 공식 근거율·피해 위험 건수 2대 머리 지표(`INV-14`), 2027-03 이전 익명/측정전 보호 게이트(`INV-17`) | 상단 모집단 탭(광역 16 / 기초 227)을 전환하여 현황을 확인하고 지도·주간 기상도·지역 탐색으로 이동 | 공표 시점 게이트(`2027-03-01`) 이전에는 개별 지자체 실명 수치가 노출되지 않는지 상시 점검 |
| **전국 공식 근거 지도 (`/maps`)**<br>[app/(public)/maps/page.tsx](../../app/%28public%29/maps/page.tsx) | 3구간(`공식 근거 많음` / `보통` / `적음`) 고정 경계 지도 및 12분야 AI 추천 지도, 구간 안 가나다순 무순위 정렬(`INV-3`, `P-1`) | 내 지역이 속한 구간과 직전 회차 대비 구간 이동·정비 사건 등록 여부를 가나다순 목록에서 확인 | 구간 경계값(`band_boundaries`)이 사전 등록 동결값과 일치하는지, 점수·석차 노출이 없는지 검증 |
| **주간 질문 기상도 (`/weekly`)**<br>[app/(public)/weekly/page.tsx](../../app/%28public%29/weekly/page.tsx) | 월·수·금 90문항 + 화요일 243곳 지명 상시 관측, 최근 4주 12회 창 상태(`신규`·`안정`·`가끔`·`드묾`·`소멸`), 미등장 명단 비공개(`INV-15`) | 주간 생활행정·능동 질문에서 어떤 지역이 `안정`·`신규`로 등장하고 공식 문서를 인용하는지 확인 | `신규` 진입 및 `소멸` 이탈 지역은 자동 공표 전 반드시 사람 확인과 운영 승인을 거침(`ADR-0016`) |
| **내 지역 찾기 (`/regions`, `/regions/[code]`)**<br>[app/(public)/regions/page.tsx](../../app/%28public%29/regions/page.tsx) | 광역 16 · 기초 227(2026-07 인천 제물포·영종·검단 개편 반영) 검색 및 단위별 출처 4단(`s1~s4`)·공급 공백 이중 분모 리포트 | 우리 지자체 코드를 검색해 출처 4단(`검색에 뜸 → AI가 읽음 → 첫 근거가 됨 → 내용이 맞음`) 도달 현황 확인 | 동명이인 기초지자체(중구·서구·동구·남구·북구·강서구·고성군) 앞뒤 20자 광역 맥락 해소(`gazetteer-matcher.ts`) 점검 |
| **지역 문화 트랙 (`/culture`)**<br>[app/(public)/culture/page.tsx](../../app/%28public%29/culture/page.tsx) | 유산·음식·축제·자연·인물 200문항 다국어(한·영·일·중) 탐색적 관측 및 정체성 유형 리포트(`INV-11`) | 언어별 탭을 전환하여 우리 지역 문화 자원이 외국어 질문에서 어떻게 소개되는지 열람 | 1차 사전 등록 대상이 아닌 문화 트랙 결과에는 반드시 `[탐색적 관측]` 배지가 붙어 있는지 확인 |
| **시민 함께하기 & 확인단 (`/join`, `/crew`)**<br>[join/page.tsx](../../app/%28public%29/join/page.tsx), [crew/page.tsx](../../app/%28public%29/crew/page.tsx) | 시민 오답 신고·질문 제안(범위 제외 `INV-18` 자동 차단) 및 유급 시민 확인단(만 19세 이상, 2인 독립 합의 `H5`) 작업대 | `/join`에서 오답 제보·투표 참여, 확인단원은 `/crew`에서 정본 문장 대조 후 2인 독립 판정 제출 | 시민 신호가 공식 근거율 분모에 섞이지 않는지(`INV-4`), 확인단-운영팀 일치율($\ge 0.8$) 충족 여부 감시 |
| **지자체 무료 포털 (`/portal`, `/selfcheck`)**<br>[portal/page.tsx](../../app/%28org%29/portal/page.tsx), [selfcheck/page.tsx](../../app/%28public%29/selfcheck/page.tsx) | 방어 정비 사건 9종(`F~N`)·능동 알리기 사건 6종(`M~W`)·지역 정체성 선언표 자가 등록 및 +2주/+6주 무료 재측정 예약(`FR-86`, `FR-90`) | 지자체 담당자(`gov_*`)가 로그인 후 정비한 공식 URL을 등록하면 +2주/+6주 후 무료로 재측정 결과를 받아봄 | 등록된 사건의 페이지 단위 이중차분(DiD) 산출 시 최소 표본(사건 30건·기관 10곳) 게이트 준수 확인 |
| **정답노트 운영 콘솔 (`/ops`)**<br>[app/(admin)/ops/page.tsx](../../app/%28admin%29/ops/page.tsx) | 블록 중단 규칙 감시, 관찰 서비스(`ObservationServiceStat`) 분리 입력, 재난 문항 비공개(`INV-16`) 및 공표 승인 게이트 | 일반 사용자 접근 불가 (`ops_*` 전용, 비로그인 시 `/login` 리다이렉트) | `pnpm stage0:shadow` 결과 대조 후 사전등록·재난제외·중단규칙 3대 조건 통과 시에만 발행 승인 |

---

## 2. 트랙 2 — MAPS 스튜디오 (MAPS Studio · 엔터프라이즈/기관 상용 정본·간극 서브시스템)

> 상세 문서는 [Part 5 MAPS 스튜디오 통합 매뉴얼](./05-maps-studio-manual.md)을 참조하십시오.

| 아티팩트 (경로 / 파일) | ① 기능 명세 (Functional Spec) | ② 사용자 가이드 (고객사 · 구매 담당자) | ③ 운영자 가이드 (`ops_admin`) |
|---|---|---|---|
| **스토어프론트 (`/studio`)**<br>[app/(public)/studio/page.tsx](../../app/%28public%29/studio/page.tsx) | 4단계 파이프라인 소개, 비보증 고지(`MAPS-INV-06`), SKU 카탈로그(`confirmed` 정가 vs `assumption` `[가정]` 견적), A원칙 적격성 & 무료 점검, `[가상]` 샘플 리포트(`MAPS-INV-15`), 공개 방법론 요약(`MAPS-INV-19`) | • `무료 간극 점검` 탭에서 기관명·도메인 입력 후 즉시 적격 여부 및 3개 속성 맛보기 확인<br>• 지자체는 `/selfcheck`로 이동, 준공공 재단은 공시 문구 입력 후 이용<br>• `confirmed` 상품은 즉시 신청, `[가정]` 상품은 맞춤 견적 요청 | • 신규 SKU 출시 시 가격 검증 전까지 `price_status='assumption'` 유지(`INV-12`)<br>• 공개 방법론 탭에 내부 우선순위 가중치 계수가 노출되지 않는지 확인(`MAPS-INV-19`) |
| **고객사 워크스페이스 (`/workspace`)**<br>[app/(org)/workspace/page.tsx](../../app/%28org%29/workspace/page.tsx) | • 4대 헤드라인 지표 + `asserted`(무인용 단언) 분리(`MAPS-INV-02/20`)<br>• 관측 시점(`as-of`) 6분류 판정 & 1클릭 `[정본 고치기]`<br>• 이원 시간 정본 대장(과거·현행·미래 예고 `MAPS-INV-03`)<br>• `G1~G6` 간극 작업함(5요소 우선순위 `MAPS-INV-09` + 6단계 처방전 `P1~P6`)<br>• 5대 편향 렌즈 & Proof 대조군 DiD(`MAPS-INV-07`) | • 요금·시간 변경 시 `[정본 고치기]`로 효력 시작일(`valid_from`, 미래 날짜 예고 가능)과 함께 새 정본 버전 등록<br>• 간극 작업함의 `Stage 1~6` 처방 단계에 따라 HTML 표·JSON-LD·만료 배너를 자사 웹사이트에 반영<br>• 판정 오류 발견 시 `이의 신청` 접수 | • 테넌트별 정본 대장(`maps_fact_versions`)과 판정(`maps_judgments`)이 Append-Only로만 누적되는지 확인<br>• 메운 간극 1건당 원가(`costPerGapClosed`) 추이 모니터링 |
| **MAPS 운영 어드민 (`/ops/maps`)**<br>[app/(admin)/ops/maps/page.tsx](../../app/%28admin%29/ops/maps/page.tsx) | 카나리아 지문 드리프트 감시(`MAPS-INV-12`), 블라인드 판정 큐(`svc-A`/`svc-B`) & Krippendorff's $\alpha$ 게이트(`MAPS-INV-14`), 문항 동결(`private_control` 격리 `MAPS-INV-13`), 리포트 카피 린트(`MAPS-INV-18`) | 고객사 접근 불가 (`OPS_ROLES` 전용) | • 카나리아 드리프트($\ge 0.25$) 발생 시 Proof 시계열 구간 분리 확인<br>• $\alpha < 0.667$ 일 때 리포트 발행 중단 및 판정자 재교육<br>• 리포트 발행 전 `lintMapsCopy` 통과 여부 확인 |
| **MAPS 코어 엔진 (`lib/maps/core/**`)**<br>[index.ts](../../lib/maps/core/index.ts) | `factsAsOf`, `judgeObservationAsOf`, `resolveEntityMention`, `computeMapsMetrics`, `diagnoseCause6Stage`, `computeGapForProperty`, `estimateMapsEffect`, `computeKrippendorffAlpha`, `lintMapsCopy`, `checkMapsEligibility` | 워크스페이스 및 스토어프론트 화면을 통해 자동 호출됨 | `pnpm maps:audit` 및 `pnpm test:invariants` 로 20대 불변식(`MAPS-INV-01~20`)과 8대 골든 시나리오(`MG-1~MG-8`) 상시 검증 |
| **MAPS 결제 격리 모듈 (`lib/maps/billing/**`)**<br>[toss.ts](../../lib/maps/billing/toss.ts), [webhooks/toss/route.ts](../../app/api/studio/webhooks/toss/route.ts) | Toss 웹훅 HMAC-SHA256 서명 검증, `idempotencyKey` 기반 중복 웹훅 방지, `price_status='assumption'` 결제 주문 차단, 코어 엔진과 FK/import 0개(`MAPS-INV-05`) | 정가 확정 상품 결제 시 PG 영수증 및 주문 상태 자동 반영 | `TOSS_WEBHOOK_SECRET` 환경변수 관리 및 결제 데이터가 코어 판정 모듈로 유입되지 않는지 정적 테스트로 감시 |

---

## 3. 트랙 3 — 로컬레이다 (LocalRadar · 소상공인 3대 상권 탐색 스캔)

> 상세 문서는 [Part 6 로컬레이다 통합 매뉴얼](./06-local-radar-manual.md)을 참조하십시오.

| 아티팩트 (경로 / 파일) | ① 기능 명세 (Functional Spec) | ② 사용자 가이드 (소상공인 사장님 · 상권 매니저) | ③ 운영자 가이드 (`ops_admin`) |
|---|---|---|---|
| **상권 탐색 스캔 대시보드 (`/kbrandlab/local`)**<br>[app/(org)/kbrandlab/local/page.tsx](../../app/%28org%29/kbrandlab/local/page.tsx) | 서귀포(`SEOGWIPO_STAY`)·강남(`GANGNAM_SMB`)·은평구(`EUNPYEONG_LOCAL`) 3대 코호트 다국어 공유 탐색 스캔, **가게 실명 가나다순 무순위 비교 표**(`INV-3`), 5대 헛걸음 위험 사실 점검 | 내 상권 탭을 선택해 가나다순 가게 목록에서 우리 매장의 등장 창 상태(`안정`·`신규`)와 5대 영업 사실(휴무일·가격·예약·주차·동반규정) 헛걸음 위험 경고를 확인 | `pnpm localradar:scan` 으로 3대 코호트 15개 매장 스캔 실행 및 점수 정렬 거부(`INV-3`) 작동 확인 |
| **10분 자가 정본 & JSON-LD 생성기 (`/kbrandlab/local/onboarding`)**<br>[app/(org)/kbrandlab/local/onboarding/page.tsx](../../app/%28org%29/kbrandlab/local/onboarding/page.tsx) | 소상공인 5대 고위험 영업 사실 자가 입력, 강남 뷰티·클리닉 의료법 준수 필터, Schema.org JSON-LD (`@graph`: 업종 엔티티 + `FAQPage`) 및 공식 안내표 HTML 즉시 생성(`FR-96`) | 5대 영업 사실을 입력하고 자동 생성된 JSON-LD 스크립트와 HTML 안내표를 복사해 매장 홈페이지·블로그 공지에 붙여넣기 | 의료기관(`isMedicalRegulated=true`) 매장의 치료 효과 보장·최상급 표현 차단 필터 정상 작동 확인 |

---

## 4. 트랙 4 — 통제 측정 파이프라인 · 위성 모듈 · 공통 보안 인프라

> 상세 문서는 [Part 7 통제 측정 및 위성 모듈 매뉴얼](./07-satellite-and-infra-manual.md)을 참조하십시오.

| 아티팩트 (경로 / 파일) | ① 기능 명세 (Functional Spec) | ② 사용자 가이드 | ③ 운영자 가이드 (`ops_admin`) |
|---|---|---|---|
| **통제 측정 & 심판소 (`/measure`, `/reviewer/adjudication`)**<br>[lib/measurement/**](../../lib/measurement/collector-websearch.ts) | OpenAI Responses API `web_search` 수집(`ADR-0012`), 추출·검증(`C1~C4`, `N1~N4`)·격자(`min_cell_size`)·5절 산출물 생성 | 내부 판정관이 `/reviewer/adjudication`에서 경합 관측 건의 부정합 코드와 귀책(`canon_absent`)을 최종 판정 | `pnpm lint:spec`, `pnpm sync:questions`, `pnpm verify:types` 로 규격 무결성 검증 |
| **K-Brand Lab (`/kbrandlab`)**<br>[app/(org)/kbrandlab/page.tsx](../../app/%28org%29/kbrandlab/page.tsx) | 소비자 구매 여정 × 브랜드 리스크 이슈 매트릭스 프로브 측정 및 출처 분석(`FR-76~80`) | 기업 브랜드 담당자가 여정 단계별 AI 오정보 위험과 인용 출처를 점검 | `pnpm test:kbrandlab` 으로 어댑터·분류기·지표 테스트 실행 |
| **Policy Theme Lab (`/theme-lab/**`)**<br>[app/(public)/theme-lab/page.tsx](../../app/%28public%29/theme-lab/page.tsx) | 시민 생활정책 질문 수집(`/submit`), 후속 맥락 생성, 테마 지형도(`/map`), 프로브 정제 스튜디오(`/studio`) (`FR-60~68`) | 시민이 평소 궁금했던 생활행정 질문을 제안하고 발굴된 정책 테마를 열람 | `/theme-lab/studio`에서 정본 확인 및 강건성 검사를 통과한 문항만 차기 측정 세트로 내보냄(`INV-10`) |
| **기술 접근성 보존 연구소 (`/labs/tech-access`)**<br>[app/(public)/labs/tech-access/page.tsx](../../app/%28public%29/labs/tech-access/page.tsx) | 동결된 Layer 1 `robots.txt` 4분류(`open`, `blocked_all`, `blocked_selective`, `no_file` + `undetermined`) 시계열 아카이브(`ADR-0023`) | 연구자·시민이 모집단별(`광역`·`기초`·`특별구역`) 과거 `robots.txt` 선언 추이를 열람 | 주간 크론 동결 상태 유지 및 Layer 1과 AI 응답 정확도 간 인과 단정 금지(`C-8`) 준수 |
| **단일 보호 경로 정책 & 자체 준수 인프라**<br>[route-policy.ts](../../lib/auth/route-policy.ts), [robots.ts](../../app/robots.ts), [sitemap.ts](../../app/sitemap.ts) | 모든 관리·조직 경로 역할 검증(`SEC-0`) 및 공개 페이지 JSON-LD·`robots.txt`·`sitemap.xml` 자체 준수(`AGENTS.md` §7) | 비인가 접근 시 `/login`으로 안전하게 안내됨 | 신규 라우트 추가 후 반드시 `pnpm test:invariants` 실행하여 `SEC-0` 및 `FR-5.4` 통과 확인 |
