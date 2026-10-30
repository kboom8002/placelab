# ADR-0013 · 관리형 전용 기능 의존 최소화

- **상태**: 채택 초안 (운영자 검토 전)
- **출처**: `jeongdap-note-repo-docs-v1.1/docs/knowledge/decisions.md` ADR-013
- **번호 주의**: 이 저장소의 ADR-0001~0012 는 출처 문서의 ADR-001~012 와 **내용이 다르다.** 출처 번호와 혼동하지 않는다.

## 결정
특정 벤더의 관리형 전용 기능에 대한 의존을 최소화한다.

## 이유 (출처 원문)
공공 인증 클라우드로 이전할 가능성.

## 검토한 대안
관리형 기능을 적극 사용한다.

## 이 저장소에 미치는 영향 (검토 필요)
Supabase Edge Functions·pg_cron·pg_net 에 의존하는 현재 스캔 파이프라인(`supabase/functions/*`, `20260905000017_cron_schedules.sql`)이 이 결정과 충돌하는 범위는 아직 평가하지 않았다. 평가는 IMPLEMENTATION-PLAN 의 워커 분리 항목에서 한다.
