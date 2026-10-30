# 구로구(AG-0017) 문항·원장 작성 규칙

> 대상: 구로구 한국어 본측정 232문항 (내부 정밀 분석용, 2026-10-06 착수)
> 근거: `AGENTS.md` · `docs/measurement-spec/spec/02_질문필지_규격.md` · `spec/03` · `ADR-0012`
> 이 문서는 작성자(사람·에이전트)가 문항과 원장을 만들 때 지킬 규칙이다. **이 규칙을 어긴 항목은 반려한다.**

---

## 0. 가장 중요한 세 가지

1. **사실은 읽은 것만 쓴다.** 원장(`targetValue`)은 이번 작업 중 **실제로 열어 본 공식 페이지**에 적힌 값만 넣는다. 기억·추정·"보통 이렇다"는 금지. 확인하지 못했으면 `verification: "to_verify"`, `targetValue: null` 로 두고 그 문항은 `usable:false` 로 표시한다. **틀린 원장은 빈 원장보다 나쁘다** — 맞는 AI 답을 어긋남으로 판정한다.
2. **문항은 측정 도구다.** 사람이 실제로 입력할 법한 자연스러운 한국어로 쓰고, 한 문항은 **사실 하나**만 묻는다. 다른 문항과 사실 범위가 겹치면 안 된다(배타성).
3. **차단을 우회하지 않는다 (INV-5).** 일반 페이지 열람만 한다. 열리지 않거나 robots/접속 차단이면 그 사실을 기록하고 다른 공식 출처(서울시·법령정보센터·소관 기관)로 가거나 문항을 바꾼다. 우회·재시도 폭주 금지. 같은 도메인에 초당 1건을 넘기지 않는다. 검색 결과 페이지를 긁지 않는다(웹 검색 도구로 존재 여부를 **사람이 읽는 수준**으로 확인하는 것은 허용).

---

## 1. 산출 파일 (이 두 종류만 만든다)

| 종류 | 경로 | 비고 |
|---|---|---|
| 문항 | `docs/aeo-questions/guro/<모듈파일>.json` | 모듈당 1파일 |
| 원장 | `docs/ground-truth/guro/<모듈파일>.json` | 모듈당 1파일 |

**다른 파일을 수정하지 않는다.** 기존 문항·원장·스키마·코드를 건드리지 않는다. 파일은 UTF-8, 들여쓰기 2칸.

## 2. 문항 파일 형식

```json
{
  "set": "guro_resident_admin",
  "module": "A1",
  "agency_handle": "AG-0017",
  "revision": 1,
  "reference_date": "2026-10-06",
  "questions": [ { ... 문항 ... } ]
}
```

문항 한 건:

```json
{
  "id": "GUR-ADM-001",
  "revision": 1,
  "status": "active",
  "module": "A1",
  "audience": "resident",
  "named": true,
  "persona": "50대 전입자",
  "journey": "apply",
  "text": "구로구에서 인감증명서를 발급받으려면 어디로 가야 하나요?",
  "boundary": "발급 장소(동주민센터·구청)까지. 수수료·준비물은 묻지 않는다",
  "type": "value",
  "layers": ["access", "readability", "citation", "accuracy"],
  "ledger": "구로구청 누리집 '인감증명서 발급' 안내",
  "owner_role": "agency_hq",
  "difficulty": "D1",
  "sensitivity": "public",
  "source_basis": "인감증명법 · 구로구 민원 안내",
  "basis_verification": "confirmed",
  "volatility": "annual",
  "en_candidate": false,
  "usable": true,
  "note": ""
}
```

필드 규칙

| 필드 | 규칙 |
|---|---|
| `id` | 모듈 접두 + 3자리 일련. **접두는 영문 대문자 3~4자**(`GUR-ADM-001`). 한 번 붙이면 바꾸지 않는다 |
| `audience` | `resident`(대주민) · `external`(대외) · `probe`(검증용) |
| `named` | 문항에 "구로구"가 들어가면 `true`. **무지명(`false`)은 문장에 `구로`가 한 글자도 없어야 한다** |
| `journey` | `find`(찾기) · `apply`(신청) · `cost`(비용) · `eligibility`(자격) · `where`(장소·창구) · `when`(시기) · `docs`(서류) · `status`(현황) · `compare`(비교·추천) · `verify`(사실확인) 중 하나 |
| `type` | `value`(대조할 원장 있음) 또는 `descriptive`(서술형, 값 판정 안 함) |
| `layers` | 서술형은 `accuracy` 를 넣지 않는다 |
| `ledger` | 값형은 필수(원장 출처 이름). 서술형은 `null` |
| `owner_role` | `agency_hq`(구청 직접) · `affiliate`(구 산하·출연) · `upper_tier`(서울시·정부) · `institution` · `private` · `none` — **그 사실을 실제로 바꿀 수 있는 주체** |
| `difficulty` | D0 무료 도구로 확인 가능 · D1 공개 자료 대조 · D2 반복 관측 필요 · D3 원장 열람 필요 |
| `sensitivity` | 기본 `public`. 민감하면 `restricted`(공표 제외) |
| `volatility` | `static` · `annual` · `event`(바뀌면 재확인) |
| `en_candidate` | 외국인·해외 투자자·관광객이 영어로 물을 법하고 번역해도 같은 사실을 묻는 문항이면 `true` (대외 모듈만, 전체 약 40건 목표) |
| `usable` | 원장이 확인되어 측정에 쓸 수 있으면 `true` |

## 3. 문항을 쓰는 법

- **자연스러운 말.** "…알려주세요" "…어떻게 하나요?" "…언제까지인가요?" 처럼 실제 주민이 쓰는 문장. 행정 용어를 일부러 쉽게 풀지도, 어렵게 꼬지도 않는다.
- **한 문항 = 한 사실.** "수수료와 신청 방법"처럼 둘을 묻지 않는다. 필요하면 두 문항으로 나눈다.
- **경계 선언 필수.** `boundary` 에 "무엇은 묻지 않는지"를 쓴다.
- **정답이 하나로 떨어지는 값**을 우선한다. 의견·평가·추천을 묻지 않는다(무지명 모듈 제외).
- **시점에 민감한 값**은 `volatility: event/annual` 로 표시하고, 원장에 기준일을 적는다.
- **쓰지 않는 말**: 순위·랭킹·등급·1위·최하위·베스트·워스트, "최고", 노출 보장. 특정 정치인·단체장 성명·업적, 선거·공약, 개인정보.
- **앞말을 붙이지 않는다.** 문항 본문이 AI에게 보내는 전부다. "[구로구]" 같은 머리말 금지.
- 기관을 나쁘게 지목하는 문구 금지. 사실 확인형 질문도 중립적으로 쓴다.

## 4. 원장 파일 형식

```json
{
  "unitId": "guro",
  "unitName": "구로구",
  "agency_handle": "AG-0017",
  "upperTier": "서울특별시",
  "asOf": "2026-10-06",
  "entries": {
    "GUR-ADM-001": {
      "targetValue": "동주민센터 또는 구청 민원여권과에서 발급 (…페이지에 적힌 그대로 요약)",
      "acceptableVariants": ["동주민센터", "민원여권과"],
      "sourceAuthority": "구로구청 민원여권과",
      "ownerRole": "agency_hq",
      "tier": "direct",
      "sourceUrl": "https://www.guro.go.kr/...",
      "sourceType": "누리집",
      "fetchedOn": "2026-10-06",
      "asOfSource": "2026-09-30",
      "valueNature": "measured",
      "verification": "confirmed",
      "evidence_quote": "원문에서 근거가 된 짧은 구절(40자 이내)"
    }
  }
}
```

- `sourceType`: `조례` · `고시공고` · `예산서` · `누리집` · `통계` · `보도자료(기관)` · `법령`
- `asOfSource`: 페이지에 적힌 최종 수정일·게시일. 없으면 `null` 로 두고 `fetchedOn` 만 쓴다.
- `valueNature`: `measured`(실측·현행) · `estimated` · `planned`(계획치). 계획치를 실적처럼 쓰지 않는다.
- `acceptableVariants`: **AI 답에 실제로 나올 법한 핵심 토큰** 2~6개. 숫자는 쉼표 유무 두 가지, 명칭은 약칭 포함. `구로구`처럼 **누구나 쓸 말은 넣지 않는다**(판정이 헐거워진다).
- `tier`: `direct`(구청) · `affiliate` · `upper`(서울시·정부) · `none`.
- 확인 못 했으면 `"verification":"to_verify"`, `"targetValue":null`, `"acceptableVariants":[]`, 사유를 `"unverified_reason"` 에 적고 문항 `usable:false`.
- `evidence_quote` 는 원문 짧은 구절만. 긴 전문 복사 금지(저작권·INV-6 정신).

## 5. 출처 우선순위

1. 구로구청 누리집 (`guro.go.kr`) 및 구 산하·출연기관 공식 도메인
2. 서울특별시(`seoul.go.kr` 등) · 중앙부처·공공기관 (`go.kr`, `or.kr`)
3. 국가법령정보센터 / 자치법규정보시스템(조례)
4. 그 외는 원장 근거로 쓰지 않는다. 언론·블로그·위키는 **원장이 될 수 없다**(후보 발굴용으로만).

## 6. 완료 보고에 포함할 것

- 만든 파일 경로, 모듈별 문항 수, `value`/`descriptive` 개수
- `to_verify` 문항 목록(ID와 사유)
- 열람이 막혔거나 어려웠던 도메인
- 다른 모듈과 사실 범위가 겹칠 수 있다고 의심되는 문항 ID
- 사용자가 결정해야 할 것

파일 전문을 보고에 붙이지 않는다.
