# ADR-0012 · OpenAI 웹검색 조건은 Responses API 로만 측정하고, 검증되지 않은 `on` 라벨을 정정한다

- 상태: **채택**
- 일자: 2026-10-06
- 관련: `ADR-0011` · `ADR-0007` · `ADR-0009` · `AGENTS.md` INV-7 · INV-11 · `spec/03` §2 · `K03` M-2.4 / M-2.7 · PRD FR-18 · FR-39 · FR-76 ~ FR-79
- 계기: 구로구(AG-0017) 200+ 문항 측정 계획 수립 중 저장소 점검

## 맥락

### 1. `web_search: 'on'` 라벨이 실제 호출과 일치한다는 근거가 없다

OpenAI 를 호출하는 기존 코드는 모두 `chat.completions.create` 를 쓰고, **검색 도구(`tools`)를 전달하지 않는다.**

| 코드 | 호출 방식 | 기록하는 라벨 |
|---|---|---|
| `scripts/measure-v2/measure-3tier.ts` | chat.completions, 도구 없음 | `web_search: 'on'` |
| `scripts/measure-v2/measure-person.ts` | chat.completions, 도구 없음 | `web_search: 'on'` |
| `scripts/measure-v2/quick-measure.ts` | chat.completions, 도구 없음 | `web_search: 'on (model default)'` |
| `scripts/measure-v2/measure-unit.ts` | chat.completions, 도구 없음 | `web_search: 'on (model default)'` |
| `lib/aeo/report-generator.ts` | (측정 결과를 받아 보고서 조립) | `web_search: 'on'` 고정 |
| `lib/measurement/collector.ts` | chat.completions, 도구 없음 | (라벨 없음, `citation_urls: []` 고정) |

저장된 관측에는 **검색 호출 여부를 확인할 메타데이터가 없다**(검색 호출 로그·출처 목록 미저장). 따라서 이 관측들이 실제로 검색을 했는지 여부를 **지금은 알 수 없다.** 그래서 이 ADR 은 "off 였다"고 단정하지 않는다. 확인할 수 없다는 것이 사실이다.

### 2. ADR-0011 의 근거는 영향을 받지 않는다

ADR-0011 의 계기가 된 수원시 off/on 비교(78pp)는 `Gemini 2.5 Pro` 의 Grounding off/on 비교이며 OpenAI 호출이 아니다(`docs/L2-suwon-grounding-comparison-2026-09.md`). 이 ADR 은 ADR-0011 의 결정(기본 조건 = 검색 on)을 바꾸지 않는다.

### 3. INV-7 과 INV-2 의 정신

INV-7 은 측정 조건 없는 관측을 허용하지 않는다. 조건을 **틀리게** 적은 관측은 조건이 없는 관측보다 나쁘다 — 비교 쿼리가 그 값을 믿고 `web_search = on` 표에 넣기 때문이다. INV-2 가 `undetermined` 를 `open` 이나 `blocked_*` 로 합치지 않는 것과 같은 이유로, **확인되지 않은 조건을 `on` 이나 `off` 로 합치지 않는다.**

## 결정

### D-1. OpenAI 웹검색 측정은 Responses API + `web_search` 도구로만 수행한다

- `chat.completions` 로 수집한 응답에는 `web_search: 'on'` 을 기록하지 않는다.
- 도구 정의: `{ type: "web_search", user_location: { type: "approximate", country: "KR", city: "Seoul" } }`
- `filters.allowed_domains` 를 **쓰지 않는다.** 출처 분포를 왜곡한다 (ADR-0011 D-2).
- `tool_choice` 는 `auto` 가 주 측정 조건이다. 실제 사용 환경에 가깝고, 검색이 실제로 발동했는지가 그 자체로 관측값이 되기 때문이다.
- `web_search_preview` (구형 도구) 는 쓰지 않는다. 필터·`external_web_access` 등 통제 수단이 없다.

### D-2. 검색 조건 라벨은 세 값이다

| 값 | 뜻 | 부여 조건 |
|---|---|---|
| `on_verified` | 검색 도구를 전달했고, **회차별로** 검색 호출 여부가 기록됨 | Responses API + `web_search_call` 항목 또는 그 부재가 저장된 경우 |
| `off` | 검색 도구를 전달하지 않았음이 코드·로그로 확인됨 | 호출 파라미터가 저장된 경우 |
| `unverified` | 위 둘을 확인할 수 없음 | 과거 관측 전부 |

`on` 단독 값은 **신규 관측에 쓰지 않는다.** 과거 레코드의 `on` 은 읽을 때 `unverified` 로 해석한다 (`docs/measurement-spec/data/registries/condition_label_errata.json`).

### D-3. `on_verified` 안에서도 "검색이 켜져 있었다"와 "검색이 발동했다"를 구분한다

`tool_choice: auto` 에서 모델은 검색을 건너뛸 수 있다. 회차마다 다음을 **따로** 저장한다.

- `search_enabled` : 도구를 전달했는가 (조건)
- `search_triggered` : `web_search_call` 이 1회 이상 있었는가 (관측)
- `search_calls[]` : 질의(`query`)와 열람한 출처 목록(`sources`)
- `citation_urls` : 응답 본문에 붙은 `url_citation` 주석 — **본문 URL 과 합산하지 않는다** (spec/03 §4.2)

`search_triggered = false` 인 회차의 정확도 분포는 별도로 표기한다. 합쳐서 "검색 on 정확도"로 내지 않는다.

### D-4. 기존 기록은 수정하지 않고 정오표를 단다

- 과거 JSON·보고서 파일의 값은 고치지 않는다 (재현 자료).
- `condition_label_errata.json` 에 영향 파일·사유·정정 라벨·정정일을 기록하고, 해당 보고서 상단에 정오표 문구를 추가한다.
- 정오표 대상 관측은 `web_search = on` 표·집계에서 제외하거나 `unverified` 로 분리 표기한다. 신규 `on_verified` 관측과 같은 표에 넣지 않는다.
- `scripts/` 의 기존 OpenAI 스크립트는 라벨 문자열을 `unverified` 로 바꾸되 호출 로직은 건드리지 않는다.

### D-5. 모델과 판본

- 구로구 측정 모델은 **`gpt-6-luna`** 로 한다 (2026-10-06 사용자 지시로 '최신 모델' 방침을 대체). 식별자는 `docs/measurement-spec/data/registries/run_profile.json` 에 기록하고, **판본이 열린 뒤에는 바꾸지 않는다.** 지시의 사유(무료 사용자가 쓰는 모델)는 `EVIDENCE.md` 에 없는 주장이므로 공개 문서·보고서에 쓰지 않는다. 쓰려면 먼저 대장에 등록한다 (INV-12). 이 측정은 **API 의 `gpt-6-luna`** 이며 소비자 앱 화면과 같다고 말하지 않는다 (Layer 3).
- `gpt-6-luna` 는 스모크 테스트에서 계정 접근과 반환 `model` 문자열(`gpt-6-luna`)을 확인했다. 접근 불가해지면 새 판본을 열고 사유를 남긴다.
- 반환된 `model` 문자열을 회차별로 저장한다 (FR-18). 측정 창 중 반환 문자열이 바뀌면 중단 규칙에 따라 판본을 폐기한다.
- `method_version` 은 **`v2.3`** 으로 올린다. `v2.2`(`measure-3tier.ts`·제주 러너)는 검색 도구 없는 chat.completions 로 수집되었으므로 v2.3 과 **비교하지 않는다.** v2.2 이전 전부와도 기본적으로 비교하지 않는다 (INV-7).

### D-6. 언어 축

- 기본 `ko`. 영어(`en`)는 **대외 문항 중 번역 동등성 검수를 통과한 부분집합**에 한정한다.
- 영어 문항은 한국어 문항의 번역이다. 새 사실을 묻지 않는다. 별도 지번을 쓰지 않고 `lang` 속성으로 구분하며 같은 원장을 쓴다.
- 중국어·일본어는 이번 범위가 아니다.
- 한 번에 한 축만 바꾼다 (K03 M-2.7): 영어 측정은 한국어 기본 조건 대비 `language` 축 하나만 다르다.

### D-7. 구로구 측정의 용도

- **내부용**: 전체 문항·원문·원장 대조 결과. `response_record` 는 비공개 저장소.
- **구로구 전달용**: `agency_notice` 경로. `FR-24`(사전 통지)·`FR-22`(설명 게재권)를 지킨다. 개별 지자체를 나쁜 사례로 지목하는 비교 문구를 쓰지 않는다 (K13 §3).
- 공개 리포트는 이번 범위가 아니다. 공개하려면 별도 승격 결정과 사전 등록 갱신이 필요하다.

## 근거

- 조건 라벨이 틀린 채 쌓인 관측은 시계열이 늘수록 정정 비용이 커진다. 지금이 가장 싸다.
- "발동했는지"를 저장하지 않으면, 검색이 켜진 조건에서 일부 회차가 사실상 검색 없이 답한 경우 정확도 평균이 두 모집단을 섞는다 — INV-9 가 경계하는 평균의 함정과 같은 구조다.
- 도메인 필터를 쓰지 않는 이유: 구청 도메인만 허용하면 정확도는 올라가지만, 사용자가 실제로 접하는 출처 경쟁(타 지자체·블로그·언론)이 사라져 측정 대상이 달라진다.

## 결과

**좋아지는 것**

- OpenAI 관측에 검색 조건·발동·출처가 회차 단위로 남는다.
- 과거 `on` 라벨의 신뢰 범위가 문서로 정리된다.
- Gemini 측정(Grounding)과 같은 출처 분석 6축을 OpenAI 에도 적용할 수 있다.

**감수하는 것**

- 과거 OpenAI 관측은 `unverified` 로 격하되어 `on` 비교표에서 빠진다. 점검 결과 범위는 두 종류다 (상세: `condition_label_errata.json`).
  - **`on` 라벨이 붙은 8건**: `m-20260906-41110`, `m-20260906-43745`, `m-20260907-41110`, `m-20260907-43745`, `m-20260908-41590`, `pm-20260908-김민석`, `L2-suwon-quick-v2-raw`, `L2-증평군-quick-v2-raw`
  - **조건 라벨이 아예 없는 OpenAI 산출물**: `m-20260908-jeju`, `m-20260908-jeju-en`, `m-20260908-jeju-en-deep`, 논산 능동적 발전 탐색(`nonsan-responses-cache`, `OUT-NONSAN-DEV-2026Q3`) — INV-7 결손(조건 미기록)이며 같은 처리를 한다.
  - **Gemini 러너는 대상이 아니다.** `scripts/` 전수 점검에서 `googleSearch` 도구를 코드로 전달하는 러너만 `google_search_grounding` 라벨을 쓴다: 광양·목포·논산·완도·여수 deep, 김민석 gemini(-deep), 동작 총선, 영등포·서귀포 능동적 발전 탐색, 수원 e2e. 단 `measure-person.ts` 는 `--provider gemini` 일 때 도구 없이 OpenAI 호환 엔드포인트를 호출하므로, 그 경로의 산출물이 있으면 같은 정오표 대상이다(현재 저장된 `pm-20260908-김민석.json` 은 `chatgpt` 로 기록되어 있다).
- 검색 호출은 토큰 외 도구 호출 비용이 붙는다. 예산 상한을 사전 등록에 넣는다.
- `search_triggered=false` 회차가 많으면 그 문항의 `on` 표본이 줄어든다.

## 되돌리는 조건

- 스모크 테스트에서 Responses API 가 `web_search_call` 항목을 반환하지 않는다면(필드 구조 상이), D-3 의 저장 항목을 실제 응답 구조에 맞춰 새 ADR 로 고친다. 이 경우에도 `unverified` 라벨은 유지한다.
- D-2 의 세 값 체계는 되돌리지 않는다. 단순화하려면 `unverified` 를 `on` 에 합치지 않는 방식으로만 바꾼다.

## 스모크 테스트 결과 (2026-10-06, 관측 아님)

scripts/measure-v2/smoke-openai-websearch.ts 로 2회 호출한 결과. 저장하지 않았고 어떤 수치에도 쓰지 않는다. 구조 확인용이다.

| 항목 | 결과 |
|---|---|
| 모델 접근 | gpt-6-astra 접근 가능. 반환 model 문자열도 gpt-6-astra (스냅샷 접미사 없음) |
| include: ['web_search_call.action.sources'] | 수락됨. ction 키는 	ype, queries, query, sources — 질의가 queries(배열)와 query(단수) 두 형태로 올 수 있어 수집기는 둘 다 읽는다 |
| 발동 | 2회 모두 검색 발동 (호출 3회·2회). 	ool_choice=auto 에서 미발동 사례는 이 표본에서 확인하지 못함 — 본측정에서 비율로 확인한다 |
| url_citation | 응답마다 1~3건. 본문에도 URL 이 별도로 있어 ody_urls 와 citation_urls 를 분리 저장해야 한다 |
| 호출당 규모 | 입력 약 12,000~17,000 토큰, 출력 약 350 토큰, 지연 약 14초. 비용은 입력(검색 결과 맥락)이 지배한다 |
| 관찰 | 모델이 스스로 site.guro.go.kr ... 형태의 질의를 만든다. 도메인 필터를 우리가 주지 않아도 모델이 공식 도메인으로 좁히는 경우가 있다. 이는 **모델의 행동**이며 측정 대상이다 (필터를 주면 이 행동이 가려진다) |

**미확정**: max_calls / max_search_calls 상한 숫자. 호출당 토큰은 위와 같이 실측했으나 단가는 이 문서에서 확정하지 않는다. 사전 등록에 숫자로 게시하기 전에 계정의 실제 단가로 산정한다.

### gpt-6-luna 스모크 (2026-10-06, 관측 아님, 2회)

| 항목 | 결과 |
|---|---|
| 반환 model | gpt-6-luna |
| 검색 발동 | 2회 모두 발동. 검색 액션(search) 각 1회, 그 외 open_page 1회 |
| 입력/출력 토큰 | 8,418 / 241 · 16,004 / 356 (평균 약 12,200 / 300) |
| 지연 | 약 6초 (gpt-6-astra 약 14초) |
| 질의 | 이 모델도 site:guro.go.kr ... 형태 질의를 스스로 만들었다 |

표본이 2건이라 평균은 예산 산정의 **출발점**일 뿐이다. 파일럿(30문항×3회)의 실측 토큰·검색 액션 수로 사전 등록의 상한을 확정한다.

**단가 확인 (2026-10-06, 사용자 제공 모델 페이지)**: gpt-6-luna 입력 $0.1 / MTok, 출력 $0.5 / MTok. easoning.effort 허용값은 none·low·medium·high·xhigh·max 이며, 판본 초안의 low 는 유효하다. 웹검색 도구 호출료(사용자 제공, 2026-10-06): 일반 `web_search` 1,000회당 $10 (회당 $0.01), 이미지 웹검색 1,000회당 $10, `web_search_preview` 추론 모델 $10 / 비추론 모델 $25 (1,000회당). 이 측정은 일반 `web_search` 를 쓰므로 회당 $0.01 을 적용한다. 과금 대상은 `search` 액션이며 `open_page`·`find_in_page` 는 문서상 과금 대상이 아니다.
