# ADR-0008 · 해자를 방법론이 아니라 시계열·관계·인용에 둔다

- 상태: **채택**
- 일자: 2026-09-05
- 관련: `K11` · `K12` · `EVIDENCE.md` C-6 · FR-8
- 계기: 2026-09-05 루브릭 평가 — 차별성 22/30, 그중 **복제 저항성 2/5 · 표준 선점 2/5**

## 맥락

루브릭에서 차별성 6개 항목 중 앞의 넷은 4~5점이었고, **해자에 해당하는 뒤의 둘이 최하점**이었다. 구성요소별 복제 소요 시간을 따져 보면 이유가 명확하다.

| 구성요소 | 복제 소요 |
|---|---|
| Layer 1 스캐너 | 주말 |
| 문항 세트 20종 | 며칠 |
| 4분 판정 · 증상군 · Floor Risk | 1~2주 |
| 강건성 검사 데이터 | 1~2개월 |
| 자유 질문 코퍼스 | 6개월+ |
| **주간 시계열** | **복제 불가** |
| **기관 관계 · 통지 이력** | **복제 불가** |
| **인용되는 지위** | **복제 불가** |

그리고 우리는 **방법론을 스스로 전면 공개한다**(FR-8). 이것은 LC-7 방어의 핵심이고 언론이 인용할 수 있게 만드는 조건이므로 포기할 수 없다.

> **FR-8은 신뢰의 조건이자 해자의 파괴자다.** 이 긴장을 인정하지 않고 "우리 방법론이 차별점"이라고 계획하면, 6개월 뒤 같은 방법론을 쓰는 후발 주자 앞에서 할 말이 없어진다.

## 결정

**해자를 방법론에 두지 않는다. 복제 불가능한 셋에 둔다 — 시계열, 기관 관계, 인용 지위.**

셋 다 **시간이 만든다.** 따라서 이 사업의 유일한 전략 변수는 **속도**이며, 그 결과 다음이 따라온다.

### 1. T0 를 제품의 1급 마일스톤으로 둔다

`T0` = **자치단체 243곳 첫 전수 스캔 개시일**

- 지나간 시점은 살 수 없다. **시작하지 않은 시계열은 존재하지 않는다.**
- T0 를 늦추는 결정은 ADR 없이 하지 않는다.
- 기능 완성도가 T0 를 늦추게 두지 않는다. **판정 규칙표와 단위 마스터가 확정되면 T0 를 친다.** 대시보드·기관 계정·리포트는 그 뒤에 붙는다.
- 공개(published)는 사전 통지 이후이지만, **수집은 그보다 먼저 시작한다.**

### 2. 사전 통지 이력을 1급 데이터로 저장한다

지금까지 사전 통지(FR-24)는 절차로만 기술되어 있고 저장 대상이 아니었다. **통지 이력은 신뢰의 물증이며 복제 불가능한 자산**이므로 테이블을 만든다.

```sql
create type notice_kind    as enum ('pre_publication','status_change','correction_reply','remeasure');
create type notice_channel as enum ('email','official_letter','phone','portal');

create table notifications (
  id          bigint generated always as identity primary key,
  unit_id     text          not null references units(id),
  kind        notice_kind   not null,
  channel     notice_channel not null,
  sent_at     timestamptz   not null default now(),
  recipient   text,
  subject     text          not null,
  body_hash   text          not null,
  responded   boolean       not null default false,
  responded_at timestamptz,
  note        text,

  constraint notifications_response_needs_time
    check (not responded or responded_at is not null)
);

create index notifications_unit_idx on notifications (unit_id, sent_at desc);
```

`body_hash` 를 남기는 이유는 **무엇을 통지했는지 사후에 다툴 수 없게** 하기 위해서다. 정정 분쟁에서 이 해시가 우리를 방어한다.

### 3. 인용을 추적한다

`EVIDENCE.md` C-6("우리 측정이 인용된다")은 해자의 핵심 주장인데 측정 수단이 없었다.

```sql
create type citation_kind as enum ('press','assembly','research','government','other');

create table citations (
  id          bigint generated always as identity primary key,
  kind        citation_kind not null,
  source      text          not null,
  url         text,
  cited_on    date          not null,
  unit_id     text          references units(id),
  quote       text,
  accurate    boolean,
  note        text,
  created_at  timestamptz   not null default now()
);

create index citations_date_idx on citations (cited_on desc);
```

`accurate` 는 인용이 `K07` 인용 가이드를 따랐는지다. **틀린 인용의 비율이 우리 문안이 실패한 정도**이므로 지표로 관리한다.

### 4. 방법론 공개를 늦추지 않되, 사전 등록으로 날짜를 남긴다

공개를 늦춰 해자를 만들려는 유혹을 명시적으로 거절한다. 대신 [ADR-0009](./0009-preregistration.md)의 사전 등록이 **누가 언제 무엇을 먼저 정했는지**에 공개 기록을 남긴다. 법적 권리가 아니라 선행성의 증거다.

## 근거

복제 소요 시간 분석은 냉정한 결론 하나로 수렴한다 — **우리가 지킬 수 있는 것은 전부 시간이 만드는 것들이다.** 그렇다면 자원 배분의 우선순위가 뒤집힌다.

기능을 더 만드는 것보다 **먼저 재기 시작하는 것**이 가치가 크다. 대시보드가 예쁜 것보다 **T0 가 한 달 빠른 것**이 가치가 크다. 상품을 더 정교하게 만드는 것보다 **243곳에 통지 공문을 보낸 이력**이 가치가 크다.

이것은 "빨리 대충 만들자"가 아니다. 강건성 검사(ADR-0007)와 승격 규칙(ADR-0004)은 여전히 T0 의 선행 조건이다 — **검사되지 않은 문항으로 시작한 시계열은 자산이 아니라 부채**이기 때문이다. 속도는 *품질 게이트 이후의 모든 단계*에 적용된다.

## 결과

**좋아지는 것**

- 로드맵의 우선순위 판단 기준이 하나로 정리된다: **T0 를 앞당기는가, 늦추는가.**
- 통지·인용이 데이터가 되어 해자의 성장을 측정할 수 있게 된다.
- 방법론 공개에 대한 내부 불안이 해소된다. 공개해도 잃을 것이 없다는 것이 근거와 함께 문서화되었다.

**나빠지는 것 / 감수하는 것**

- **T0 시점의 제품은 초라할 것이다.** 공개 조회와 스캔만 있고 대시보드도 기관 계정도 없다. 이것을 받아들인다.
- 통지·인용 테이블은 **사람이 채워야 한다.** 자동화되지 않는 운영 부담이 생긴다.
- 인용 추적은 누락이 불가피하다. **하한값으로만 보고**하고 "확인된 인용 N건"으로 쓴다.

## 되돌리는 조건

- 방법론 공개가 실제 피해(예: 후발 주자가 우리 방법론으로 우리보다 먼저 공표)를 낳으면 FR-8 의 **범위**를 재검토한다. 다만 전면 비공개로 돌아가는 것은 LC-7 방어를 포기하는 것이므로, 그 경우 대체 방어책을 담은 새 ADR이 필요하다.
