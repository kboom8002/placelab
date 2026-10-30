# SDD 00 — 개요

## 1. 목적과 범위
이 SDD는 PRD v0.2의 요구사항을 구현 가능한 설계로 옮긴다. 범위: 공개 사이트(18화면), 참여자 앱(9), 지자체 포털(12), 운영 콘솔(10), 측정·판정·현지화·집계 워커, Supabase 스키마·RLS.

## 2. 시스템 한 장 요약

| 구성 | 역할 |
| --- | --- |
| Next.js 웹 | 공개 페이지 SSR/ISR(5개 언어), 참여자 앱·포털·콘솔, Route Handlers, Server Actions |
| Supabase | Auth, Postgres(+RLS, pg_trgm), Storage, Realtime, Queues(pgmq), pg_cron, Vault, Edge Functions(웹훅·알림) |
| measure-runner | AI 서비스 어댑터로 질문 호출, 원문·인용·비용 저장 |
| judge-l10n | 자동 판정, 사람 판정 배정, 집계, 리포트 생성, AI 현지화 초안·점검 |
| 외부 AI 서비스 | 기본 패널(서비스 A·B·C) + 언어 시장 패널(검토) |

## 3. 핵심 도메인 흐름
1. **정본 → 답안지 → 질문**: 사실(`facts`)에서 답안지(`answer_keys`)가 생기고, 질문(`questions`)은 사실에 묶인다.
2. **질문 세트 고정 → 회차 → 측정 → 판정 → 집계 → 엠바고 → 사실 확인 → 발행**.
3. **신고·제안 → 확인 → 정본·질문 세트 개선** (지표에는 섞지 않음).
4. **현지화**: AI 초안 → AI 점검 → 원어민 1차 → 원어민 2차 → 조정 → 사전 등록.
5. **정정**: 오답 → 분류(정본·수집·출처·다국어) → 배정 → 처리 → 재측정.

## 4. 단계 (PRD §8)
P0 출범(10/20) · P1 시범 회차(10/27–29, 결과 화면·포털 v1) · P2 대한민국 영역(11월) · P3 계약 이행(12월–2027 1분기) · P4 확장.

## 5. 용어
도메인 용어는 `../knowledge/glossary.md`. 코드 식별자는 영어, UI는 한국어(공개 페이지는 5개 언어).

| 한국어 | 코드 |
| --- | --- |
| 정본 | fact |
| 답안지 | answer_key |
| 질문 칸 A–E | slot |
| 회차 | round |
| 판정 | judgment |
| 성적표 | scorecard |
| 정정 | correction |
| 발표 전 사실 확인 | fact_check (objection) |
| 명칭 용어집 | entity_names |
| 현지화 검수 | l10n_review |
