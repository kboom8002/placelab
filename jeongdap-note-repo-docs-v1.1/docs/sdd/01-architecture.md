# SDD 01 — 아키텍처

## 1. 구성도
```
[시민·방문객·AI 크롤러] [참여자] [지자체] [운영]
            │               │        │      │
            ▼               ▼        ▼      ▼
      ┌───────────────── Next.js (App Router) ─────────────────┐
      │ (public)/[locale]  ISR + tag revalidate                │
      │ /crew  /portal/[region]  /ops   (dynamic, auth)        │
      │ /api/check  /api/revalidate   Server Actions           │
      └───────────────┬───────────────────────────▲────────────┘
                      │ supabase-js (anon/user JWT)│ revalidate webhook
                      ▼                            │
      ┌──────────────────── Supabase (서울 리전) ───┴────────────┐
      │ Auth │ Postgres+RLS │ Storage │ Realtime │ Queues(pgmq) │
      │ pg_cron │ Vault │ Edge Functions (webhook, notify)       │
      └───────────────┬──────────────────────────────────────────┘
                      │ pgmq read/ack (service role, 워커만)
          ┌───────────┴─────────────┐
          ▼                         ▼
   measure-runner             judge-l10n
   (AI 서비스 어댑터)          (판정·집계·리포트·현지화)
          │
          ▼
   외부 AI 서비스 API
```

## 2. 배포
| 대상 | 관리형 (기본) | 공공 요건 시 |
| --- | --- | --- |
| 웹 | 관리형 Next.js 호스팅 (서울 엣지) | 인증 클라우드의 Node 서버/컨테이너 |
| DB·Auth·Storage | Supabase 관리형 (서울 리전) | 자체 호스팅 Supabase (인증 클라우드) |
| 워커 | 컨테이너 (서울) | 동일 |
| 원칙 | 관리형 전용 기능 의존 최소화 → 같은 코드로 이전 가능 | |

## 3. 데이터 흐름 (주요 시퀀스)

### 3.1 회차 실행
1. 운영: 질문 세트 고정(`frozen`, `hash`) → 회차 생성(`rounds`).
2. DB 함수 `enqueue_round(round_id)`: `run_jobs` 생성(질문 텍스트 × 서비스 × 모드 × 반복) → `pgmq.send('measure.call', …)`.
3. measure-runner: 메시지 읽기 → 어댑터 호출 → `answers` 저장 → `pgmq.send('judge.auto', {answer_id})` → ack.
4. judge-l10n: 자동 판정 → `judgments` 저장 → 표본·위험·낮은 확신도는 `judge.assign`.
5. 사람 판정·조정 완료 → `aggregate.round` → `scorecards` 계산 → `publications.stage='embargo'`.

### 3.2 발행
엠바고 → 지자체 사실 확인(기한) → 이의 재판정 → 운영 승인 → `publications.stage='published'` → DB 웹훅 → `/api/revalidate` → `revalidateTag('round:{id}')`, `revalidateTag('region:{code}')` → `report.render`.

### 3.3 정본 변경
정본 편집(새 사실 + 이전 사실 닫기) → `answer_keys` 재생성 트리거 → DB 웹훅 `fact.published` → 지역 페이지 재검증 → (연동 시) AIHompy 동기화.

### 3.4 AI 답 확인 (시민)
`POST /api/check` → 지역 답안지 로드 → 문장 분리 → 주장 추출(규칙 우선, 모델 보조 선택) → 대조 → 결과 반환(저장하지 않음). 신고는 별도 Server Action.

### 3.5 현지화
질문 생성 → `l10n.draft` → AI 초안 2표현 → `l10n.check` → 점검 결과 → 원어민 1차 → 2차(배경이 다른 검수자) → 조정 → `registered` → 질문 세트에 포함 가능.

## 4. 비기능 목표
LCP p75 2.5초, 재검증 p95 60초, 공개 99.9%, 회차 72시간 내 완료, 서울 리전, KWCAG 2.2 AA. 상세는 PRD §7.
