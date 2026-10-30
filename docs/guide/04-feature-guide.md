# Part 4. 기능별 운영 가이드 & 트러블슈팅 (Feature Operational Guide)

이 문서는 슈퍼어드민(`ops_admin`)이 **모두의 정답노트** 의 개별 서브시스템을 정기 운영하거나 예외 상황(중단 규칙 발동, 원장 갱신, 동명 지명 추가, 불변식 테스트 실패 등)을 처리할 때 참조하는 기능별 실무 가이드입니다.

---

## 1. 정밀 측정 실행 및 0단계·분기 운영 가이드

### 1.1 Python 측정 패키지 실행 (`jeongdap-note-repo-docs-v1.1/measurement/`)
0단계(구로·수원·화성 등 기준 단위 패널) 및 초기 일괄 수집은 패치 완료된 Python 스크립트로 실행할 수 있습니다.

```powershell
# 1. 인스턴스 생성 검증 (2,545건)
python jeongdap-note-repo-docs-v1.1/measurement/generate_instances.py

# 2. 드라이런(API 호출 없이 요청 페이로드·비용 추정만 확인)
python jeongdap-note-repo-docs-v1.1/measurement/run_measure.py --dry-run --site GURO --reps 3

# 3. 실제 수집 실행 (OPENAI_API_KEY 환경변수 필요)
#    - instructions 없음(INV-13), include=["web_search_call.action.sources"] 자동 포함
python jeongdap-note-repo-docs-v1.1/measurement/run_measure.py --site GURO --reps 3 --out answers_guro_b1.jsonl

# 4. 출처 4단 + 공급 공백 + 위약 자동 판정 실행
python jeongdap-note-repo-docs-v1.1/measurement/judge_auto.py --answers answers_guro_b1.jsonl --out judged_guro_b1.csv
```

### 1.2 TypeScript 그림자 실행(Shadow Run) 및 12월 전환 기준
- 블록 1 수집 결과 중 구로구 표본(50문항 × 3회)을 TypeScript 판정기([`scripts/jeongdap/run-stage0-shadow.ts`](../../scripts/jeongdap/run-stage0-shadow.ts))로 교차 검증합니다.
- **전환 조건**: 출처 1~3단(`S1` 검색 등장 · `S2` 인용 · `S3` 첫 공식 인용) 일치율이 **98% 이상(`allThreeAgreement >= 0.98`)** 일 때 12월 주간 측정부터 TypeScript 워커로 전환합니다.
- **주의 (`INV-11`)**: 수집 도구를 Python에서 TS로 바꾸는 것은 도구 판본 갱신이며, 만약 판정 규칙 자체를 바꾸려면 반드시 **2차 사전 등록**을 먼저 발행해야 합니다.

### 1.3 5대 중단 규칙(Stopping Rules) 발동 시 슈퍼어드민 조치 매뉴얼

| 중단 신호 (`evaluateBlockStoppingRules`) | 발동 기준 | 슈퍼어드민 조치 방법 |
|---|---|---|
| `rerunRequiredForModelDrift = true` | 한 블록 실행 도중 응답 JSON의 `model` 판본 문자열이 변경됨 | 해당 블록의 부분 결과를 폐기하고 새 모델 판본으로 블록 전체를 재실행합니다. |
| `holdStage1 = true` | `web_search_call.action.sources` 가 비어 있는 응답이 전체의 **5% 초과** | OpenAI API 응답 구조 변화를 점검하고, 해당 회차의 **1단(검색에 뜸) 수치를 보류**한 채 2·3단(인용 기준)만 산출합니다. |
| `holdAppearance = true` | 위약(Placebo) 30문항 전체 거짓 양성률 **10% 이상** (또는 특정 유형 **5% 이상**) | 지명 사전·공식 도메인 매칭 규칙의 과잉 매칭 여부를 점검하고 해당 범주의 등장 해석을 보류합니다. |
| 측정 중 페이지 변경 감지 | 측정 전후 인용 페이지(`cited_pages`) 본문 SHA-256 해시 불일치 | 해당 문항을 해당 회차 주 결과 분모에서 제외하고 다음 회차에 재측정합니다. |
| `holdH5CrewComparison = true` | 활동 시민 확인단 인원이 **15명 미만** | 11/17 방법 검증 리포트에서 `H5`(시민 확인단-운영팀 일치율) 판정을 `정족수 미달 보류`로 표기합니다. |

---

## 2. 인용 페이지 확인 수집기 (`cited-page-fetcher.ts`) 운영 가이드

정밀 측정 후 24시간 이내에 AI가 인용한 공식 URL(`probe_citations`)의 실제 본문을 가져와 4단(`S4` 핵심 수치·요지 일치) 판정 및 본문 변경 감지에 사용합니다.

- **절대 준수 사항 (`INV-5`)**:
  1. User-Agent는 반드시 `SCANNER_UA` (`JeongdapNoteBot/1.0 (+https://jeongdap.kr/bot; contact@jeongdap.kr)`) 만 사용합니다.
  2. 대상 호스트의 `/robots.txt` 를 먼저 확인([`isAllowedByRobotsTxt`](../../lib/jeongdap/cited-page-fetcher.ts))하여 `Disallow` 인 경우 본문 요청을 보내지 않고 `robotsAllowed: false` 만 기록합니다.
  3. 동일 호스트 요청 간 최소 간격 **1,500ms (1.5초)** 를 강제합니다.
  4. 수집된 본문은 SHA-256 해시(`contentHash`)로 기록하여 측정 도중 페이지가 수정되었는지 검증합니다.

---

## 3. 주간 상시 관측 & 지명 사전(`gazetteer.csv`) 유지보수 가이드

### 3.1 주간 관측 스케줄
- **월·수·금 (능동 상시 관측)**: 지역명을 넣지 않은 개방형 질문(생활·관광 12개 영역 50문항 + 계절·테마 40문항 중 주간 배치 = 회당 270호출)을 투입하여 어느 지자체가 자연 등장하는지 관측합니다.
- **화요일 (주간 질문 발행)**:
  - **짝수 주 (방어판)**: 전국 공통 생활행정 질문 1건에 대한 공식 근거 점검
  - **홀수 주 (능동판)**: 전국 243개 지자체 지명 정체성 및 추천 근거 점검

### 3.2 동명 지명 및 행정구역 개편 관리 (`lib/jeongdap/gazetteer-match.ts`)
- **동명 기초지자체 (`중구`, `동구`, `서구`, `남구`, `북구`, `강서구`, `고성군`)**:
  - 짧은 이름(`서구`) 단독 등장 시 앞 **20자(`GAZETTEER_CONTEXT_CHARS = 20`)** 이내에 소속 시·도명(`서울`, `인천`, `대전`, `대구`, `부산`, `광주`/`전남광주`)이 있을 때만 해당 지자체로 매칭합니다.
  - 긴 이름(`광주 서구`, `인천광역시 서구`)이 먼저 매칭된 문자 구간(`consumedSpans`)은 소비 처리되어 다른 도시의 동명 구가 중복 매칭되지 않습니다.
- **2026-07 인천 행정체제 개편 반영 (`ADR-0022`)**:
  - 신설 3구: **인천광역시 제물포구(`28115`)**, **인천광역시 영종구(`28116`)**, **인천광역시 검단구(`28265`)** (`active = true`)
  - 구 인천 중구·동구는 삭제하지 않고 `active = false` 및 `reorgNote` 로 이력을 보존합니다 (`AGENTS.md` §5 삭제 금지 원칙).

---

## 4. 기관 포털 사건 등록부 & 이중차분(DiD) 효과 추정 가이드

### 4.1 정비·알리기 사건 유형 코드 레퍼런스 (`constants.ts`)

**방어 트랙 — 정비 사건 9종 (`REPAIR_EVENT_DEFENSE_CODES`)**:
- `F`: 본문 형식 (표·목록·기계 가독 구조화)
- `T`: 제목·첫 문단 핵심 요약 배치
- `Q`: 자주 묻는 질문(FAQ) 요약 추가
- `D`: 중복·상충 문서 정합화
- `U`: 오래된 수치·기한·연락처 갱신
- `A`: 고정 주소(퍼머링크) 부여
- `S`: 사이트 기술 접근성(`robots.txt`·사이트맵) 개선
- `L`: 외부 안내·산하 기관 협조 요청
- `N`: 공급 공백 항목 신규 문서 작성

**능동 트랙 — 알리기 사건 6종 (`REPAIR_EVENT_ACTIVE_CODES`)**:
- `M`: 지역 핵심 소개 메시지 정리
- `E`: 축제·행사 공식 안내 페이지 개설
- `P`: 주요 정책·지원 사업 전용 페이지 개설
- `G`: 다국어(영·일·중) 공식 안내 추가
- `R`: 공공 포털·관광 데이터 등재
- `W`: 공개 지식베이스·위키 근거 연결

### 4.2 페이지 단위 이중차분(`computePageLevelDiD`) 공표 게이트
- 정비 사건 등록 후 **+2주** 및 **+6주** 시점에 동일 문항과 대조군(같은 회차·영역·기능의 미정비 문항)을 함께 재측정합니다.
- **최소 표본 게이트 (`DID_MIN_TREATED_EVENTS = 30`, `DID_MIN_TREATED_UNITS = 10`)**:
  - 누적 처치 사건이 **30건 이상**이고 참여 기관이 **10곳 이상**일 때만 `publicationStatus = 'confirmed_did'` 로 인과 효과 추정치를 공표합니다.
  - 그 전에는 화면과 리포트에서 자동으로 `exploratory_insufficient_sample`(탐색적 전후 변화 기록)으로만 표기됩니다.

---

## 5. 트러블슈팅 & 자주 겪는 불변식 오류 해결 치트시트

| 증상 / 테스트 실패 메시지 | 원인 | 즉시 해결 방법 |
|---|---|---|
| `SEC-0` 실패: `정책에 없는 보호 대상 경로: /...` | `app/(admin)` 또는 `app/(org)` 아래에 새 `page.tsx`나 `/api/admin|aeo|measure|portal` 아래에 새 `route.ts`를 만들고 [`lib/auth/route-policy.ts`](../../lib/auth/route-policy.ts) 에 등록하지 않음 | `lib/auth/route-policy.ts` 의 `ROUTE_POLICIES` 배열에 해당 경로와 허용 역할(`OPS_ROLES` 등)을 추가합니다. |
| `INV-1` 실패 또는 API `400` (`population 파라미터가 필수입니다`) | 집계 함수나 API 호출 시 `population` 인자를 생략했거나 허용 목록(`metro`, `basic`, `special_zone`, `local_gov`) 외 값을 전달함 | 항상 모집단(`population=basic` 또는 `population=metro`)을 명시해 호출합니다. |
| `INV-3` 실패 또는 문구 린트 오류 | UI 컴포넌트나 마크다운에 금칙어(`순위`, `랭킹`, `1위`, `최하위`, `꼴찌`, `종합 점수`, `공식 측정`, `정부 인증` 등)가 포함됨 | [`lib/constants/measurement.ts`](../../lib/constants/measurement.ts) 의 `FORBIDDEN_WORDS` 목록을 확인하고 무순위·객관 표기(`공식 근거 많음 / 보통 / 공식 근거 적음`, `가나다순`)로 교체합니다. |
| `INV-10` / 동결 매니페스트 해시 불일치 | `jeongdap-note-repo-docs-v1.1/measurement/` 아래의 시드 CSV/JSONL 파일을 수정한 뒤 동결 매니페스트를 갱신하지 않음 | 의도된 정본 갱신이라면 `method_version` 과 함께 `npx tsx scripts/jeongdap/import-seed-data.ts` 를 실행하여 `docs/jeongdap-freeze-manifest-v1.0.json` 을 갱신합니다. |
| `/ops` 또는 `/portal` 접속 시 `/login` 으로 리다이렉트됨 | 현재 로그인한 Supabase 사용자의 `raw_app_meta_data.app_roles` 에 `ops_admin`(또는 `gov_editor`)이 없음 | [`03-e2e-tutorial.md` Step 0-1](./03-e2e-tutorial.md) 의 SQL 명령으로 `raw_app_meta_data` 에 `{"app_roles": ["ops_admin"]}` 을 부여한 뒤 재로그인합니다. |

---

## 6. 로컬레이다 (`LocalRadar` · 소상공인 AI 로컬 탐색 스캔) 기능 가이드 (`ADR-0025`)

- **브랜드 및 방화벽 원칙 (`FR-93`, `INV-17`)**:
  - 상업 소상공인 트랙은 **「로컬레이다 (LocalRadar)」** 브랜드와 `kbl_local_*` 전용 테이블을 사용하며, 공익 측정(`probe_*`, `observe_*`) 데이터를 참조하거나 합산하지 않습니다.
  - 향후 공기업(JDC 등)·지역관광재단·상권활성화재단의 상권 코호트 스폰서십이 가능하며(`allowFuturePublicCorpSponsor: true`), 후원 참여 시 이해관계 공시(`/disclosure`)에 투명하게 병기합니다.
- **2계층 스캔 구조 (`FR-94`~`FR-96`)**:
  - **Layer A (상권 코호트 공유 탐색 스캔)**: **서귀포(`SEOGWIPO_STAY`) · 강남(`GANGNAM_SMB`) · 은평구(`EUNPYEONG_LOCAL`)** 권역별 소비자 탐색 질문을 4개 국어(`ko`, `en`, `ja`, `zh-Hans`)로 공유 실행해 코호트 내 **가게 실명**의 4주 12회 창 상태(`안정`·`신규`·`가끔`·`드묾`·`소멸`)를 가나다순 무순위로 산출합니다.
  - **Layer B (개별 매장 헛걸음 위험 5항목 정본 스캔)**: 점주가 10분 자가 온보딩(`/kbrandlab/local/onboarding`)으로 등록한 5대 고위험 영업 사실(영업시간·휴무, 가격, 예약, 주차, 반려동물·아동·다국어)을 대조하고 `Schema.org JSON-LD` 정본 카드를 생성합니다.

