# Part 2. 기능 명세 (Functional Specification)

이 문서는 **모두의 정답노트 (Jeongdap Note)** 의 모든 화면 라우트, API 엔드포인트, 도메인 모듈, CLI 스크립트, 데이터베이스 테이블 및 권한(RBAC) 정책의 정본 기능 명세입니다.

---

## 1. 역할(Role) 및 접근 권한 행렬 (`lib/auth/roles.ts`, `route-policy.ts`)

미들웨어([`middleware.ts`](../../middleware.ts))와 순수 정책 엔진([`lib/auth/route-policy.ts`](../../lib/auth/route-policy.ts))은 사용자의 `app_metadata.app_roles` 배열을 읽어 아래 행렬에 따라 인가(`allow` / `unauthenticated` / `forbidden`)합니다.

| 역할 그룹 | 세부 역할 코드 (`AppRole`) | `/ops`, `/review`, `/scans`, `/measure`, `/aeo`, `/api/admin/**`, `/api/measure/**` | `/portal`, `/dashboard`, `/api/portal/**` | `/kbrandlab/**` | 공개 화면 (`/`, `/maps`, `/weekly`, `/culture`, `/regions`, `/join`, `/crew` 등) |
|---|---|---|---|---|---|
| **슈퍼어드민·운영팀 (`OPS_ROLES`)** | `ops_admin`, `ops_approver`, `ops_editor`, `ops_measure`, `ops_analyst` | **허용 (`allow`)**<br/>(`ops_admin`은 전 경로 접근 가능) | **허용 (`allow`)** | `ops_admin` **허용** | 허용 |
| **지자체·공공기관 (`GOV_ROLES`)** | `gov_admin`, `gov_official`, `gov_editor`, `gov_viewer` | **차단 (`forbidden`)** | **허용 (`allow`)** | **차단 (`forbidden`)** | 허용 |
| **상업 실험실 (`LAB_ROLES`)** | `lab_org`, `lab_member` | **차단 (`forbidden` · A원칙 방화벽)** | **차단 (`forbidden` · A원칙 방화벽)** | **허용 (`allow`)** | 허용 |
| **일반 시민·비로그인** | `null` (또는 `citizen`, `minor`) | **차단 (`unauthenticated` / `forbidden`)** | **차단 (`unauthenticated` / `forbidden`)** | **차단** | 허용 (단, 시민 확인단 선발은 만 19세 이상만 가능) |

---

## 2. 웹 화면 라우트 전수 명세 (`app/**`)

### 2.1 모두의 정답노트 핵심 공개 화면 (로그인 불필요)

| URL 경로 | 소스 파일 | 주요 기능 및 표시 데이터 | 관련 FR · 불변식 |
|---|---|---|---|
| `/` | [`app/(public)/page.tsx`](../../app/(public)/page.tsx) | 브랜드 홈: 「노트와 펜」 디자인 토큰(`--pen #127A4B`), 출처 4단 개요, 기준 단위 5곳 패널(550문항)·전국 243곳 코어 60문항 구조, A원칙 공시 요약 | `FR-80`, `INV-14`, `INV-17` |
| `/maps` | [`app/(public)/maps/page.tsx`](../../app/(public)/maps/page.tsx) | **전국 공식 근거 지도(3구간 가나다순)** & **전국 AI 기상도(`안정`·`신규`)** & **12개 생활·관광 영역 추천 지도**: 2027-03 이전 단위 실명 수치 비공개(`측정 전`) 배너 및 모집단 분리(`광역 16` · `기초 227`) 표시 | `FR-84`, `FR-86`, `INV-1`, `INV-3`, `INV-15`, `INV-17` |
| `/weekly` | [`app/(public)/weekly/page.tsx`](../../app/(public)/weekly/page.tsx) | **주간 질문 지도**: 화요일 발행 방어판(공식 근거 점검) / 능동판(지역 등장·정체성 점검) 격주 교대 및 월·수·금 상시 관측(회당 270호출) 운영 현황 | `FR-85`, `INV-15` |
| `/culture` | [`app/(public)/culture/page.tsx`](../../app/(public)/culture/page.tsx) | **지역 문화 트랙**: 16개 시·도 × 10 + 국가 대표 20 = 180항목 다국어(`ko`·`en`·`ja`·`zh-Hans`) 탐색적 측정 안내 (`ExploratoryBanner` 필수 표시) | `FR-88`, `INV-11` |
| `/regions` | [`app/(public)/regions/page.tsx`](../../app/(public)/regions/page.tsx) | **행정단위 마스터 사전**: 광역 16곳 · 기초 227곳(2026-07 인천 제물포구·영종구·검단구 신설 및 구 중구·동구 이력 보존 반영) 분리 탭, 기준 단위 5곳 하이라이트 | `FR-81`, `INV-1`, `INV-3` |
| `/regions/[unitId]` | [`app/(public)/regions/[unitId]/page.tsx`](../../app/(public)/regions/[unitId]/page.tsx) | **단위 상세 페이지**: 예) `/regions/GURO`, `/regions/28115`(인천 제물포구). 2027-03 이전 실명 수치 비공개 게이트(`INV-17`), 머리 지표 2종(`공식 근거율` · `피해 위험 건수`), 정본 원장 목록(재난 문항 제외 `INV-16`, 원문 미포함 `INV-6`) | `FR-81`, `FR-83`, `INV-6`, `INV-14`, `INV-16`, `INV-17` |
| `/join` | [`app/(public)/join/page.tsx`](../../app/(public)/join/page.tsx) | **함께하기 (시민 참여 3종)**: ① AI 오답 시민 신고판(범위 제외 3종 차단 안내), ② 다음 주 질문 시민 제안 및 후보 질문 공감 투표([`QuestionSuggestForm`](../../components/jeongdap/QuestionSuggestForm.tsx)), ③ 만 19세 이상 시민 확인단 지원 안내 | `FR-89`, `FR-92`, `INV-4`, `INV-18` |
| `/crew` | [`app/(public)/crew/page.tsx`](../../app/(public)/crew/page.tsx) | **시민 확인단 작업대**: 2% 표본 사람 검수, 연습 5문항 통과 규칙, 2인 독립 배정, 위약 10% 혼입, 시급 15,000원·월 15시간 상한 안내 및 판정 작업대(`/reviewer/adjudication`) 진입 | `FR-89`, `H5` |
| `/method` | [`app/(public)/method/page.tsx`](../../app/(public)/method/page.tsx) | **측정 방법론 v1.0**: 출처 4단(`S1~S4`), 공급 공백 이중 분모, 9회 블록 안정성, 4주 12회 창 상태, 페이지 단위 이중차분(DiD 30건·10곳 게이트) 정본 공개 | `FR-82`, `FR-83` |
| `/prereg` | [`app/(public)/prereg/page.tsx`](../../app/(public)/prereg/page.tsx) | **1차 사전 등록 (2026-10-20 동결본)**: 가설 `H1~H5`, 반증 조건, 5대 중단 규칙, 공표 약속, 동결 해시 매니페스트(`jeongdap-freeze-manifest-v1.0.json`) 공개 | `FR-90`, `INV-10`, `INV-11` |
| `/evidence` | [`app/(public)/evidence/page.tsx`](../../app/(public)/evidence/page.tsx) | **증거 대장**: `docs/EVIDENCE.md` 에 등록된 주장(`C-1`~`C-12`)과 검증 상태(`검증됨` / `파일럿 확인` / `사전 등록(검증 예정)`) 공개 | `INV-12` |
| `/disclosure` | [`app/(public)/disclosure/page.tsx`](../../app/(public)/disclosure/page.tsx) | **이해관계 공시 & 원본 기록 열람 요청**: A원칙(측정 대상 기관 유·무상 상품 미제공) 선언 및 학술·언론·기관용 원본 기록 검증 패킷 요청 안내 | `FR-91`, `INV-6`, `INV-17` |
| `/bot` | [`app/(public)/bot/page.tsx`](../../app/(public)/bot/page.tsx) | **수집 봇 안내**: `JeongdapNoteBot/1.0` 및 12주 전환기 `KPlaceLabBot/1.0` 병기, `robots.txt` 준수 및 1.5초 요청 간격(`INV-5`) 안내 | `FR-80`, `INV-5` |
| `/labs/tech-access` | [`app/(public)/labs/tech-access/page.tsx`](../../app/(public)/labs/tech-access/page.tsx) | **기술 접근성 보존 아카이브**: 주간 `robots.txt` 스캔 크론 동결(`ADR-0023`) 후 기존 Layer 1 판정 이력을 읽기 전용으로 보존 | `ADR-0023`, `INV-2` |

### 2.2 보호 화면 (포털 · 슈퍼어드민 운영 콘솔)

| URL 경로 | 소스 파일 | 필요 역할 | 주요 기능 |
|---|---|---|---|
| `/portal` | [`app/(org)/portal/page.tsx`](../../app/(org)/portal/page.tsx) | `GOV_ROLES` 또는 `OPS_ROLES` | **지자체·공공기관 포털**: 7단계 정비 흐름 안내, 정비 사건(`F·T·Q·D·U·A·S·L·N`)·알리기 사건(`M·E·P·G·R·W`)·공식 정보 선언표 자기 등록 폼([`PortalEventForm`](../../components/jeongdap/PortalEventForm.tsx)), +2주/+6주 자동 재측정 예약 |
| `/ops` | [`app/(admin)/ops/page.tsx`](../../app/(admin)/ops/page.tsx) | `OPS_ROLES` (`ops_admin` 등) | **측정 운영 콘솔**: ① 시드 동결 해시(`instances.jsonl`, `core_60`, `ledger.csv`) 무결성 모니터, ② 0단계 블록 실행 및 Python-TS 그림자 대조 상태, ③ 5대 중단 규칙 신호등, ④ 3대 공표 승인 게이트(사전 등록 + 운영 승인 + 재난 제외), ⑤ 관찰 측정 수동 입력 및 원본 기록 열람 감사 큐 |

---

## 3. API 엔드포인트 명세 (`app/api/**`)

| 메서드 · 경로 | 소스 파일 | 필수 파라미터 / 바디 | 정상 응답 | 에러 코드 (불변식 게이트) |
|---|---|---|---|---|
| `GET /api/regions` | [`app/api/regions/route.ts`](../../app/api/regions/route.ts) | Query: `population` (`metro` \| `basic` \| `special_zone` \| `local_gov`), 선택 `order` (`code` \| `sgg_code` \| `name`) | `200 OK` (`metro`: 16곳, `basic`: 227곳) | `400`: `population` 누락(`INV-1`) 또는 `order=score` 등 점수 정렬 시도(`INV-3`) |
| `GET /api/regions/[id]/metrics` | [`app/api/regions/[id]/metrics/route.ts`](../../app/api/regions/[id]/metrics/route.ts) | Path: `id` (예: `GURO`, `11017`) | 2027-03 이후 `200 OK` (`PublicMetricPair` + `RoundStamp`) | **2027-03 이전 `403 Forbidden`** (`status: "before_publication"`, `INV-17` 실명 수치 비공개 게이트) |
| `GET /api/maps/bands` | [`app/api/maps/bands/route.ts`](../../app/api/maps/bands/route.ts) | Query: `population` (`metro` \| `basic`) | 2027-03 이후 `200 OK` (3구간 내부 가나다순 목록) | `400`: `population` 누락(`INV-1`)<br/>**2027-03 이전 `403 Forbidden`** (`INV-17`) |
| `GET /api/maps/weather` | [`app/api/maps/weather/route.ts`](../../app/api/maps/weather/route.ts) | 없음 | `200 OK` (`allowedStates: ["안정", "신규"]`, `appearingUnits`) | 미등장 명단·점유율(SoV)·첫 셋 필드는 스키마에서 영구 배제(`INV-15`) |
| `GET /api/weekly/[week]` | [`app/api/weekly/[week]/route.ts`](../../app/api/weekly/[week]/route.ts) | Path: `week` (예: `2026-W49`), Query: `population` (`metro` \| `basic` \| `special_zone`) | `200 OK` (`editionKind: "defense" \| "active"`, `appearingUnits`) | `400`: `population` 누락(`INV-1`) |
| `GET /api/export/jeongdap` | [`app/api/export/jeongdap/route.ts`](../../app/api/export/jeongdap/route.ts) | Query: `population` (`metro` \| `basic` \| `special_zone`) | `200 OK` (`invariantsEnforced`, 원문·재난·미동결 제외 레코드) | `400`: `population` 누락(`INV-1`) |
| `POST /api/join/report` | [`app/api/join/report/route.ts`](../../app/api/join/report/route.ts) | JSON: `{ questionText, scopeCategory? }` | `201 Created` (`status: "pending_review"`, 연락처·주민번호 마스킹된 `sanitizedQuestion`) | `400`: 빈 질문<br/>**`422 Unprocessable Entity`**: `scopeCategory`가 `disaster_emergency` \| `government_stance` \| `private_business` 인 경우 즉시 차단(`INV-18`) |
| `POST /api/join/suggest` | [`app/api/join/suggest/route.ts`](../../app/api/join/suggest/route.ts) | JSON: `{ questionText, categoryCode?, scopeCategory? }` | `201 Created` (`status: "pending_review"`, 마스킹 적용) | `400`: 5자 미만 질문<br/>`422`: 범위 제외 대상(`INV-18`) |
| `POST /api/join/vote` | [`app/api/join/vote/route.ts`](../../app/api/join/vote/route.ts) | JSON: `{ candidateId }` | `201 Created` (`note`: 공식 지표 비합산 `INV-4` 고지) | `400`: `candidateId` 누락 |
| `POST /api/portal/events` | [`app/api/portal/events/route.ts`](../../app/api/portal/events/route.ts) | JSON: `{ unitId, eventTrack: "defense" \| "active" \| "declaration", typeCode, targetUrl, summary? }` | `201 Created` (`scheduledRemeasurements: { plus2Weeks, plus6Weeks }`, `denominatorNotice` `INV-4`) | `400`: 필수값 누락 또는 허용되지 않은 유형 코드(`F~N` / `M~W` 외) |
| `POST /api/records/request` | [`app/api/records/request/route.ts`](../../app/api/records/request/route.ts) | JSON: `{ instanceId, requesterRole, reason }` | `201 Created` (`status: "queued_for_ops_audit"`, `INV-6` 원문 직접 노출 금지 안내) | `400`: `instanceId` 또는 `reason` 누락 |

---

## 4. 도메인 엔진 모듈 명세 (`lib/jeongdap/*`)

| 파일명 | 주요 export 함수 / 상수 | 역할 및 구현 규칙 |
|---|---|---|
| [`constants.ts`](../../lib/jeongdap/constants.ts) | `JEONGDAP_POPULATIONS`, `PANEL_5_UNITS`, `REPAIR_EVENT_DEFENSE_CODES`, `REPAIR_EVENT_ACTIVE_CODES`, `OUT_OF_SCOPE_REPORT_CATEGORIES`, `canPublishNamedUnitMetrics()` | 정본 상수, 기준 단위 5곳, 정비·알리기 유형 코드, 2027-03 실명 수치 공개 시점 게이트 |
| [`types.ts`](../../lib/jeongdap/types.ts) | `PublicMetricPair`, `RoundStamp`, `SourceStageResult`, `WindowState` | 단일 점수 배제(`PublicMetricPair`), 회차 스탬프, 출처 4단 타입 정의 |
| [`official-domain.ts`](../../lib/jeongdap/official-domain.ts) | `classifyOfficialDomain()`, `isOfficialUrlForUnit()` | 공식 도메인 5대 범주(`*.go.kr`, `*.kr` 공공, `law.go.kr`, `elis.go.kr`, 단위 등록 공식 도메인) 통합 판별 |
| [`source-stages.ts`](../../lib/jeongdap/source-stages.ts) | `evaluateSourceStages()`, `computeOfficialSourceRate()`, `matchesNumberToken()`, `shouldHoldStage1ForMissingToolSources()` | 1단(`tool_sources`)·2단(`citations`)·3단(첫 인용)·4단(핵심 숫자·요지, 한 자리 숫자 단위 문맥 필수) 판정 및 공급 공백 분리 이중 분모 계산 |
| [`stability.ts`](../../lib/jeongdap/stability.ts) | `evaluateNineRunStability()` | 9회 반복 중 최빈 판정과 다른 횟수 ≤2회일 때 안정 판정 (`ADR-0024`) |
| [`window-state.ts`](../../lib/jeongdap/window-state.ts) | `computeFourWeekWindowState()`, `filterWeatherMapAppearingUnits()` | 최근 4주 12회 창 상태(`신규`·`안정`·`가끔`·`소멸`·`드묾`) 산출 및 기상도 `안정`·`신규` 필터링 (`INV-15`) |
| [`band.ts`](../../lib/jeongdap/band.ts) | `assignBand()`, `groupAndSortBandEntries()` | 고정 경계값 기준 3구간 배정 및 구간 내부 가나다순 정렬 (`INV-3`, `ADR-0018`) |
| [`gazetteer-match.ts`](../../lib/jeongdap/gazetteer-match.ts) | `extractGazetteerMentions()` | 긴 이름 우선 소비, 동명 지명(`서구`, `중구` 등) 앞 20자 시·도 문맥 확인, `전남광주` 소속 `광주 서구` 매칭 보정, 2026-07 인천 신설 3구 매칭 |
| [`cited-page-fetcher.ts`](../../lib/jeongdap/cited-page-fetcher.ts) | `isAllowedByRobotsTxt()`, `fetchCitedPageSafely()` | `SCANNER_UA` 고정, `robots.txt` 준수(`Disallow` 시 즉시 중단), 호스트당 최소 1.5초 간격, 본문 SHA-256 해시 기록 (`INV-5`) |
| [`shadow-runner.ts`](../../lib/jeongdap/shadow-runner.ts) | `evaluateBlockStoppingRules()`, `compareShadowStageAgreement()` | 1차 사전 등록 5대 중단 규칙(모델 변경·도구 목록 누락 >5%·위약 ≥10%·확인단 <15명) 및 Python-TS 1~3단 일치율 계산 |
| [`stats.ts`](../../lib/jeongdap/stats.ts) | `computeClusterBootstrapCI()`, `computeWilsonCI()` | 문항 군집 부트스트랩(Cluster Bootstrap) 95% 신뢰 구간 및 최소 셀 크기(10문항 × 3회차) 게이트 |
| [`agreement.ts`](../../lib/jeongdap/agreement.ts) | `computeInterRaterAgreement()`, `evaluateCrewVsOpsComparison()` | 다범주 Cohen's $\kappa$, 2인 단순 일치율(`H3`), 시민 확인단 vs 운영팀 판정 비교 및 정족수 15명 게이트(`H5`) |
| [`did.ts`](../../lib/jeongdap/did.ts) | `computePageLevelDiD()` | 정비·알리기 사건 전후 페이지 단위 이중차분(DiD) 추정 및 최소 표본 게이트(사건 30건 이상 · 기관 10곳 이상) |
| [`i18n.ts`](../../lib/jeongdap/i18n.ts) | `JEONGDAP_EASY_GLOSSARY`, `getTermExplanation()` | 5개 UI 로케일(`ko`, `ko-easy`, `en`, `ja`, `zh-Hans`) 및 핵심 용어 6종 쉬운 말 해설 사전 |

---

## 5. 데이터베이스 마이그레이션 명세 (`supabase/migrations/`)

기존 마이그레이션(`20260905*` ~ `20260915*`)은 불변 원칙에 따라 그대로 보존하며, 아래 2개 신규 마이그레이션으로 전환을 완성합니다.

1. [`20261017000001_freeze_l1_scan_cron.sql`](../../supabase/migrations/20261017000001_freeze_l1_scan_cron.sql)
   - `ADR-0023`에 따라 기존 Layer 1 주간 `robots.txt` 스캔 크론(`weekly-scan-enqueue`, `scan-worker-tick`, `weekly-verdict-promote`)을 해제(`cron.unschedule`)하고 `tech_scans`·`verdicts`를 읽기 전용 보존 아카이브로 동결합니다.
2. [`20261017000002_jeongdap_phase1_core.sql`](../../supabase/migrations/20261017000002_jeongdap_phase1_core.sql)
   - **단위 마스터 확장 (`units`)**: `unit_kind`(`national`, `metro`, `basic`, `emd`, `special_zone`), `active`, `valid_from`, `valid_to`, 별칭 테이블(`unit_aliases`), 2026-07 인천 개편(제물포구 `28115`, 영종구 `28116`, 검단구 `28265` 추가 및 구 중구·동구 `active=false`).
   - **정본 원장 및 문항 동결**: `attribute_defs`, `facts`(이력 보존 `valid_from`~`valid_to`), `probe_templates`, `probe_sets`(`frozen_hash` 동결 후 수정 차단 트리거 `trg_prevent_frozen_probe_set_mutation`), `probe_instances`.
   - **관측·출처 4단·창 상태·사건 등록부**: `probe_runs`(`has_instructions = false AND location_signal = false` CHECK 제약 `INV-13`), `probe_answers`(원문 비공개 `raw_storage_key` + `raw_hash` `INV-6`), `probe_tool_results`, `probe_citations`, `cited_pages`, `probe_judgments`(append-only 수정·삭제 차단 트리거 `trg_prevent_probe_judgments_mutation`), `observe_questions`, `observe_runs`, `observe_mentions`, `observe_window_states`, `repair_events`, `publish_events`, `unit_declarations`, `band_boundaries`, `publications`, `jeongdap_audit_log`.
