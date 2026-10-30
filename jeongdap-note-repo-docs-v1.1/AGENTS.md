# AGENTS.md — 모두의 정답노트 (jeongdap-note)

> LLM 코딩 에이전트와 사람 개발자가 **가장 먼저 읽는 파일**. 이 파일의 규칙은 다른 어떤 문서보다 우선한다.

## 0. v1.1 변경 요약 (2026-10-09) — 이 절이 아래 모든 절보다 우선한다

- **자체 사업 측정(D103).** 지자체 계약·엠바고·사실 확인·사전 통지 전제는 폐기. 공개 문서만 읽어 측정·분석하고, 발행은 운영 승인만 거친다. §3 MUST 10은 "발행은 운영 승인 후"로 읽는다.
- **지표 둘.** 공식 근거율(자동)·피해 위험 건수(사람). 정답률·종합 점수·등급 없음. §3 MUST 1·2의 "AI 정답 지표"는 "공식 근거율"로, 95% 구간·단위 수·회차 표기는 유지.
- **밴드 지도 공개(D94).** 지역 순위는 여전히 금지(§3 MUST NOT 1). 대신 226 기초·16 광역을 고정 경계 3구간으로 공개하고 구간 안은 무순위.
- **측정 규모.** 기준 단위 5곳만 패널 550×9회, 전국은 코어 60×3회 자동 판정, 능동 측정은 비지명 관측 질문으로 매주. 전수 측정 금지.
- **정비 사건 등록부·알리기 사건 등록부가 포털의 핵심(D96·D107).** 정비·컨설팅 영업 금지(A 원칙).
- **서비스.** 정밀 측정은 OpenAI 단일(Responses API + web_search). 질문 원문 그대로, 시스템 프롬프트 없음. 기관 시스템 접속·전화·민원 없음.
- **행정구역.** 광역 16·기초 226(2026-07-01 전남광주통합특별시). 아래 "광역(16)·기초(약 227)"는 16·226으로 읽는다.
- 상세: `CHANGES-v1.1.md`, 정본: `docs/methodology/01_measurement-methodology-v1.0.md`, 실행: `measurement/README.md`.

## 1. 무엇을 만드는가 (한 문단)

**모두의 정답노트**는 국가·광역(16)·기초(약 227)·읍면동(약 3,500) 지역에 대해 *AI가 맞게 말하는지*를 사전 등록된 질문으로 측정하고(한국어 + 영어·일본어·중국어 번체·간체), 정본(확인된 사실)과 답안지로 판정하며, 시민·지자체·확인단·판정단·원어민 검수단이 함께 고치고, 결과를 AI와 사람이 모두 읽는 공개 페이지로 내는 웹 플랫폼이다. 스택은 **Next.js(App Router) + Supabase + 별도 워커**다.

## 2. 문서 읽는 순서

| 순서 | 파일 | 언제 |
| --- | --- | --- |
| 1 | `AGENTS.md` (이 파일) + `CHANGES-v1.1.md` | 항상 |
| 2 | `docs/knowledge/principles.md` | 항상 — 위반하면 안 되는 제품 원칙 |
| 3 | `docs/knowledge/glossary.md` | 도메인 용어가 낯설 때 |
| 4 | `docs/sdd/00-overview.md` | 전체 구조 파악 |
| 5 | 작업 영역의 SDD | 아래 표 |
| 6 | 관련 지식 소스 | 아래 표 |

| 작업 | SDD | 지식 소스 |
| --- | --- | --- |
| DB 스키마·마이그레이션 | `sdd/02-data-model.md`, `sdd/03-rls-and-auth.md` | `knowledge/region-registry.md`, `knowledge/attribute-dictionary.md` |
| 판정·통계·답안지 | `sdd/04-domain-logic.md` + `CHANGES-v1.1.md` §3 | `docs/methodology/01_measurement-methodology-v1.0.md`, `measurement/judge_auto.py` |
| 측정 워커·큐 | `sdd/05-workers-and-jobs.md` + `CHANGES-v1.1.md` §3 | `measurement/run_measure.py`, `measurement/observe_weekly.py` |
| 공개 페이지·컴포넌트 | `sdd/06-frontend.md` | `knowledge/design-system.md`, `knowledge/web-copy.md` |
| API·Server Actions | `sdd/07-api.md` | `knowledge/roles-and-permissions.md` |
| 다국어·현지화 | `sdd/04-domain-logic.md` §6, `sdd/06-frontend.md` §5 | `knowledge/multilingual-l10n.md` |
| 질문 세트·시드 | `sdd/02-data-model.md` §8 | `knowledge/question-composition.md`, `knowledge/data/*` |
| 테스트·CI·운영 | `sdd/08-testing-and-ops.md` | — |
| 왜 이렇게 했나 | — | `knowledge/decisions.md` (ADR-001~021), `docs/decisions/decision-log-excerpt-D72-D110.md` |

## 3. 절대 규칙 (MUST / MUST NOT)

### MUST NOT
1. **지역 간 순위**(1위·꼴찌·정렬된 순위표)를 만들지 않는다. 지역 목록은 공식 순서 또는 가나다순.
2. 판정자(`rater`) 화면·API에 **AI 서비스 실명**을 노출하지 않는다. `services.masked_label`만.
3. `judgments`를 **수정·삭제**하지 않는다. 조정은 새 행(`judge_type='adjudicated'`).
4. `frozen=true`인 질문 세트의 항목을 바꾸지 않는다.
5. 정본(`facts`)을 덮어쓰지 않는다. 변경은 새 사실 + 이전 사실의 `valid_to` 닫기.
6. **시민 신호**(신고·제안·투표)를 정답률·지표 계산에 섞지 않는다.
7. **AI가 현지화를 승인**하게 하지 않는다. 승인은 원어민 2인(`native1`, `native2`)만.
8. AI 서비스 키·Supabase service role 키를 클라이언트 번들에 넣지 않는다.
9. 운영 환경에 **예시 데이터**를 넣지 않는다(“예시” 배지는 데모·스테이징 전용).
10. 미성년 사용자에게 `crew`·`rater`·`native_reviewer` 역할을 주지 않는다.
11. 단체장·정당·정책 홍보 문구, 지자체 상징(계약 없는 지역)을 노출하지 않는다.

### MUST
1. 모든 비율에 **95% 신뢰 구간·분석 단위 수·회차**를 함께 표시한다.
2. 주 지표의 이름은 항상 **“AI 정답 지표 (API 기반 대리 지표)”**. 실사용 화면 일치도를 옆에 둔다.
3. 동(읍면동) 단위는 **비율 대신 건수**.
4. 새 테이블에는 **RLS 정책 + RLS 테스트**를 함께 추가한다.
5. 공개 페이지는 **서버 렌더링 HTML** + JSON-LD + hreflang + `lang` 속성.
6. 화면은 **상태 규칙**(측정 전·측정 중·엠바고·발행됨·정정됨)을 따른다 (`sdd/06-frontend.md` §3).
7. 한국어 UI 문구는 `knowledge/web-copy.md`를 따른다. 새 문구는 톤 가이드에 맞춘다.
8. 접근성 KWCAG 2.2 AA. 판정은 색 + 모양 + 글자.
9. 판정·현지화에 쓰는 모델과 프롬프트의 버전을 기록한다(`prompt_versions`).
10. 발행은 **엠바고 → 지자체 사실 확인 → 운영 승인 → 발행** 순서만.

## 4. 저장소 구조 (예정)

```
apps/web/                 Next.js (App Router)
  app/[locale]/(public)/  공개 사이트 (ko·en·ja·zh-hant·zh-hans)
  app/crew/               참여자 앱
  app/portal/[region]/    지자체 포털
  app/ops/                운영 콘솔
  app/api/                Route Handlers (check, revalidate)
  lib/domain/             판정·정규화·통계 (순수 함수, 단위 테스트 필수)
  lib/supabase/           server / client / admin 클라이언트
  components/ui|domain/   디자인 시스템·도메인 컴포넌트
  i18n/messages/          언어별 문자열
workers/measure-runner/   측정 호출 워커
workers/judge-l10n/       자동 판정·집계·현지화·리포트 워커
packages/adapters/        AI 서비스 어댑터 (공통 인터페이스)
packages/shared/          타입·스키마(zod)·상수
supabase/migrations/      SQL 마이그레이션
supabase/seed/            시드 (레지스트리·속성 사전·질문 세트·용어집)
docs/                     이 문서들
```

## 5. 명령어 (예정 — package.json 확정 시 갱신)

| 목적 | 명령 |
| --- | --- |
| 로컬 Supabase | `supabase start` · `supabase db reset` (마이그레이션 + 시드) |
| 타입 생성 | `supabase gen types typescript --local > packages/shared/db.types.ts` |
| 웹 개발 | `pnpm --filter web dev` |
| 워커 개발 | `pnpm --filter measure-runner dev` (가짜 어댑터 기본) |
| 검사 | `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm test:rls` · `pnpm test:e2e` |

## 6. 작업 방식

- 큰 변경은 먼저 관련 SDD 절을 읽고, 바뀌는 설계는 **SDD를 같은 PR에서 고친다**.
- 설계 결정이 바뀌면 `knowledge/decisions.md`에 ADR을 추가한다.
- 도메인 로직은 `lib/domain/`의 순수 함수로 두고 단위 테스트를 먼저 쓴다.
- 확실하지 않은 외부 사실(행정구역 수, 서비스 약관, 라이브러리 API)은 코드에 단정하지 말고 설정·시드로 분리한다.
