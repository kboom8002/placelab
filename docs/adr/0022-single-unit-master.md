# ADR-0022 · 단일 단위 마스터 (지역 레지스트리 + 기존 `units` 합집합)

- **상태**: 결정됨 (운영자, 2026-10-09) — 세부 설계는 구현 계획 Phase 2
- **대체**: `AGENTS.md` v1 INV-1(두 모집단 합산 금지)의 "모집단 둘" 전제. 아래 "유지되는 것" 참조.
- **관련**: ADR-0002(two-populations), `jeongdap-note-repo-docs-v1.1/CHANGES-v1.1.md` D110, `docs/knowledge/region-registry.md`

## 결정
`units`(자치단체 243 + 특별구역)와 v1.1 지역 레지스트리(국가·광역 16·기초 226·읍면동)를 **하나의 단위 마스터**로 합친다.

## 근거로 확인한 사실
- `measurement/gazetteer.csv` 는 242행(광역 16 + 기초 226). 전 행 `status = 확인 필요`이며 일부 `official_domain` 이 비어 있다.
- `CHANGES-v1.1.md` D110: 2026-07-01 전남광주통합특별시 출범으로 광역 17 → 16, 기초 226. `region-registry.md` 는 기초를 "약 227(추정)"으로 적고 있어 **원문끼리 불일치**한다. CHANGES-v1.1 이 우선한다고 명시되어 있으므로 226 을 따른다.
- `methodology/03` 일부 문장은 여전히 "243단위·17 광역"으로 적혀 있다(이전 값). 원문 정정 요청 대상이며 우리가 고치지 않는다.

## 설계 방향 (권장안 — Phase 2 에서 확정)
1. 단위 마스터에 `kind` 컬럼을 둔다: `national | metro | basic | emd | special_zone`. 기존 `units.population` 은 `kind` 로 대체한다. (기존 열을 지우지 않고 `active=false`·이력 유지 — `AGENTS.md` §5)
2. 집계·표시는 **항상 `kind` 를 고정**한다. 밴드 지도·분모는 `metro + basic`(현재 242)만 쓴다.
3. `special_zone`(현 6곳)은 v1.1 문서에 대응 개념이 없다. **권장: 마스터에는 유지하되 밴드 지도·전국 분모에서 제외**하고 별도 `kind` 로만 다룬다. (가정 — 운영자 확인 필요)
4. 읍면동은 건수만 표시한다(원문 MUST 3).

## 유지되는 것
"서로 다른 법적 성격의 단위를 합쳐 `전국 N곳`이라고 말하지 않는다"는 원칙은 유지한다. 합집합은 **저장 모델의 통합**이지 **집계의 합산**이 아니다. `getCoverage()` 류 함수가 `kind` 를 인자로 받고 기본값이 없어야 한다는 규칙도 그대로다.

## 영향
- `lib/db/units.ts`, `lib/types/layers.ts`, `lib/utils/coverage.ts`, 홈·단위 목록 페이지, `tests/invariants/inv-1-*`, `seed.sql`.
- 코드 영향 범위는 Phase 2 시작 시 grep 으로 재확인한다.
