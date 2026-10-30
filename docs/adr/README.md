# 아키텍처 결정 기록 (ADR)

되돌리기 어려운 결정과 **그렇게 결정한 이유**를 남긴다. 코드는 무엇을 했는지 보여주지만, 무엇을 하지 *않기로* 했는지는 보여주지 않는다. 그것이 여기 있다.

| # | 결정 | 상태 |
|---|---|---|
| [0001](./0001-scanner-runtime.md) | Layer 1 스캐너를 Supabase Edge Functions + `pg_cron` + Postgres 큐로 돌린다 | 채택 (0023으로 동결·대체) |
| [0002](./0002-two-populations.md) | 자치단체와 특별구역 두 모집단을 합산하지 않는다 | 채택 (0022로 확장) |
| [0003](./0003-four-way-verdict.md) | robots 판정을 4분하고 "판정 불가"를 사유 코드와 함께 남긴다 | 채택 |
| [0004](./0004-observation-vs-verdict.md) | 관측과 판정을 분리하고 2주 연속 승격을 거친다 | 채택 (0024로 확장) |
| [0005](./0005-layer-separation.md) | 레이어별 데이터를 타입 수준에서 분리한다 | 채택 |
| [0006](./0006-distribution-over-score.md) | 점수가 아니라 분포를 재고, 평균이 아니라 Floor를 보고한다 | 채택 |
| [0007](./0007-questions-are-instruments.md) | 문항은 측정 도구다 — 강건성 검사를 통과해야 채택한다 | 채택 |
| [0008](./0008-moat-is-time.md) | 해자를 방법론이 아니라 시계열·관계·인용에 둔다 | 채택 |
| [0009](./0009-preregistration.md) | 측정 전에 사전 등록한다 | 채택 |
| [0010](./0010-diffusion-first.md) | 확산 표면을 1급 제품으로 두고, 시계를 셋으로 나눈다 | 채택 |
| [0011](./0011-grounding-first-source-analysis.md) | 측정 기본 조건을 검색 증강(on)으로 전환하고, 출처를 1급 측정 대상으로 둔다 | 채택 |
| [0012](./0012-openai-web-search-condition.md) | OpenAI 웹검색 조건은 Responses API 로만 측정하고, 검증되지 않은 on 라벨을 정정한다 | 채택 |
| [0013](./0013-minimize-managed-services.md) | 관리형 전용 기능 의존을 최소화한다 | 채택 |
| [0014](./0014-questions-from-facts.md) | 질문은 정본(확인된 사실)에서 생성하고 답안지를 동반한다 | 채택 |
| [0015](./0015-page-state-rules.md) | 화면 상태 규칙 (엠바고·기관 확인은 ADR-0016 으로 폐기) | 채택 (일부 대체) |
| [0016](./0016-self-run-measurement-no-agency-notice.md) | 자체 사업 측정 — 기관 통지·엠바고·사실 확인을 생략한다 | 채택 |
| [0017](./0017-two-public-metrics-no-composite.md) | 공개 지표는 둘(공식 근거율·피해 위험 건수)뿐이며 종합 점수는 두지 않는다 | 채택 |
| [0021](./0021-active-measurement-names-appearing-regions.md) | 능동 측정은 등장 지역 이름만 공개하고 미등장 명단·순위는 두지 않는다 | 채택 |
| [0022](./0022-single-unit-master.md) | 단위 마스터를 합집합 단일 체계로 통합하되 집계 시 모집단(`kind`/`population`)을 고정한다 | 채택 |
| [0023](./0023-retire-l1-robots-scan.md) | Layer 1 robots 주간 스캔을 단계적으로 폐지하고 데이터를 보존한다 | 채택 |
| [0024](./0024-stability-rules.md) | 안정성 규칙: 패널 9회 블록 안정성 + 상시 관측 4주 12회 창 상태를 병용한다 | 채택 |
| [0025](./0025-local-radar-smb-discovery-track.md) | 로컬레이다(LocalRadar): 소상공인 3대 상권 코호트(서귀포·강남·은평구) 탐색 스캔과 공익 방화벽을 분리한다 | 채택 |
| [0026](./0026-maps-subsystem-architecture.md) | MAPS 상용 서브시스템 아키텍처: 3-Lane 분리(`/studio`·`/workspace`·`/ops/maps`), 이원 시간(`as-of`) 6분류 판정, 간극 조회 시점 산출 | 채택 |
| [0027](./0027-maps-billing-isolation.md) | MAPS 결제·청구 격리(`MAPS-INV-05`) 및 가격 확정 상태(`price_status`) 게이트 | 채택 |

## 언제 ADR을 쓰나

- 스키마의 모양을 바꿀 때
- 배포 대상 서비스를 추가할 때
- `AGENTS.md` 의 불변식을 건드릴 때
- 측정 명세의 구조(버전 관리 방식, 승격 규칙)를 바꿀 때

## 형식

```
# ADR-000N · 한 줄 제목
- 상태: 제안 | 채택 | 폐기 | ADR-000M 으로 대체됨
- 일자
- 관련 문서

## 맥락      무엇이 문제였나. 사실과 제약
## 결정      무엇으로 정했나
## 근거      왜. 택하지 않은 대안과 그 이유
## 결과      좋아지는 것 / 감수하는 것
## 되돌리는 조건   (선택) 어떤 신호가 오면 재검토하나
```

**기존 ADR을 수정하지 않는다.** 결정이 바뀌면 새 ADR을 쓰고, 이전 것의 상태를 `폐기` 또는 `대체됨`으로 바꾼다.
