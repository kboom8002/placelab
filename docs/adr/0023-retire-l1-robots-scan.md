# ADR-0023 · Layer 1 robots 기술 접근성 스캔 폐지

- **상태**: 결정됨 (운영자, 2026-10-09) — 단계적 폐지, 데이터는 삭제하지 않고 보존
- **대체**: ADR-0001(scanner-runtime), ADR-0003(four-way-verdict), ADR-0004(observation-vs-verdict)의 *적용 범위*. 문서는 이력으로 남긴다.
- **관련**: `AGENTS.md` v1 INV-2·INV-5·INV-8, ADR-0016

## 결정
robots.txt·기술 접근성(L1) 주간 스캔과 그 판정·승격 파이프라인을 폐지한다. v1.1 정밀 측정(OpenAI Responses API + web_search, 질문 원문, 시스템 프롬프트 없음)이 측정의 중심이 된다.

## 이유
v1.1 문서에 L1 스캔에 해당하는 측정이 없다. 공개 지표는 공식 근거율·피해 위험 건수 둘뿐이다(ADR-0017).

## 폐지 순서 (되돌릴 수 있는 것부터)
| 단계 | 작업 | 되돌리기 |
|---|---|---|
| 1 동결 | `weekly-scan-enqueue` cron 해제(가드된 새 마이그레이션). `verdict-promote` 는 **cron 을 등록하지 않는다** | `cron.schedule` 재등록 |
| 2 비노출 | 공개 L1 화면(홈 대시보드·`/units`·`/units/[id]`의 판정·`/export/layer1`·OG)을 내리고 안내로 대체 | 라우트 복원(git) |
| 3 보존 | `tech_scans`·`verdicts`·`verdict_changelog` 는 **삭제하지 않는다**. 읽기 전용 이력 | — |
| 4 코드 정리 | edge function 3종(`scan-enqueue`·`scan-worker`·`verdict-promote`), `robots-parser`, 관련 상수·테스트 제거 | git |

## 폐기되는 불변식
- **INV-2** (robots 4+1 판정): 대상 소멸.
- **INV-8** (2주 연속 → 승격): 대상 소멸. 후속 규칙은 ADR-0024.

## 유지되는 것
- **INV-5의 원칙**(UA 위장·차단 우회 금지)은 어떤 수집에도 적용한다. 스캐너가 없어져도 향후 공개 문서를 읽는 모든 수집기에 유지한다. `SCANNER_UA` 상수는 이름·값 변경 예정(결정됨)이며 사용처가 없어지면 상수 자체를 정리한다.
- **AGENTS.md §7 자체 준수**(우리 `robots.txt` 개방·`Sitemap:`·JSON-LD)는 스캔과 무관하게 유지한다. `self-compliance` 테스트도 유지한다.

## 열린 점
- 공개 보고서 3건(`/reports/*`)과 기존 L1 수치가 이미 외부에 공표됐는지 확인되지 않았다. 공표된 수치를 내릴 때의 정정·안내 문구는 `K07-publication-policy` 를 확인한 뒤 정한다.
- 홈 화면이 L1 대시보드에 의존하므로 단계 2 전에 대체 홈이 필요하다(Phase 1 IA 작업).
