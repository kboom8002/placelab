# SDD 05 — 워커·작업

## 1. 큐 (Supabase Queues / pgmq)
| 큐 | 생산자 | 소비자 | 페이로드 |
| --- | --- | --- | --- |
| `measure.call` | `enqueue_round()` | measure-runner | `{run_job_id}` |
| `judge.auto` | measure-runner | judge-l10n | `{answer_id}` |
| `judge.assign` | judge-l10n | judge-l10n | `{answer_id, reason:'sample'|'low_conf'|'risk'}` |
| `aggregate.round` | 운영 액션 | judge-l10n | `{round_id}` |
| `report.render` | 발행 승인 | judge-l10n | `{round_id, region_code?}` |
| `l10n.draft` | 질문·정본 문장 생성 | judge-l10n | `{target, target_id, lang}` |
| `l10n.check` | l10n.draft 완료 | judge-l10n | `{review_id}` |

규칙: 처리 성공 시 ack, 실패 시 지수 백오프 재시도(최대 5), 초과 시 `*.dlq`. 모든 처리는 **멱등**(`run_jobs.idem_key`, `answers.job_id unique`).

## 2. measure-runner
```ts
export interface AiServiceAdapter {
  id: string;                         // services.id
  supports: { searchToggle: boolean; locale: boolean };
  ask(input: {
    prompt: string; lang: 'ko'|'en'|'ja'|'zh_hant'|'zh_hans';
    mode: 'search_off'|'search_on'; locale: 'KR'; sessionId: string;
  }): Promise<{ text: string; citations?: {url:string;title?:string}[];
                modelId: string; latencyMs: number; usage?: {in:number; out:number}; costUsd?: number }>;
}
```
- **새 세션**마다 독립 호출, 시스템 지시문은 최소·공개(“질문 언어로 답하세요” 수준).
- 서비스별 **토큰 버킷**(RPM·TPM) + 동시성 상한. 비용 상한 80% 경보, 100% 일시 중지.
- 지원하지 않는 모드(`searchToggle=false`)는 작업 생성 단계에서 제외하고 기록.
- 모델 식별자가 바뀌면 `model_versions` 기록, 카나리 결과로 `canary_shift`.
- 가짜 어댑터(`FakeAdapter`)를 기본으로 두고 실서비스는 환경 변수로 활성.
- 약관 확인(`service_terms`) 없는 서비스는 활성 불가.

## 3. judge-l10n
- `judge.auto`: `buildAnswerKey` → `judgeAnswer` → `judgments` insert(`judge_type='auto'`). 표본 20%·확신도<0.7·위험은 `judge.assign`.
- `judge.assign`: 판정자 2인 배정(같은 언어 가능자, 서비스명 가림), 마감.
- 조정: 불일치 시 조정자 작업 생성 → `judge_type='adjudicated'`.
- `aggregate.round`: SDD 04 §5 → `scorecards` upsert → `publications`(없으면 생성, `embargo`).
- `report.render`: 웹 데이터 스냅숏·PDF·CSV → Storage → `report_files`.
- `l10n.draft`/`l10n.check`: SDD 04 §6. 결과는 `l10n_reviews`에 `ai_draft`/`ai_check`로만 기록(함수 `insert_l10n_ai`).

## 4. 크론 (pg_cron)
| 이름 | 주기 | 내용 |
| --- | --- | --- |
| `fact_recheck_due` | 매일 06:00 | 재확인 임박 정본 → 미션·포털 알림 |
| `fact_scheduled_activate` | 매시간 | 예고된 변화 발효 → 답안지 재생성 → 웹훅 |
| `embargo_deadline` | 매시간 | 사실 확인 기한 임박 알림 |
| `queue_health` | 5분 | 대기열 길이·DLQ 경보 |

## 5. 웹훅
| 이벤트 | 대상 | 동작 |
| --- | --- | --- |
| `fact.published` | `/api/revalidate` | `region:{code}` 재검증, AIHompy 동기화(연동 시) |
| `publication.published` | `/api/revalidate` | `round:{id}`, 관련 `region:*` 재검증, `report.render` |
| `claim.status_changed` | Edge Function | 신고자 알림 |
| `correction.assigned` | Edge Function | 담당자 알림 |

웹훅 요청은 HMAC 서명 헤더로 검증한다.

## 6. 비용 추정 식
`회차 호출 수 = Σ지역 (질문 수 × 언어 수 × 표현 수) × 서비스 수 × 모드 수 × 반복 수`
광역 16 × 60 × 1 × 1 × 3 × 2 × 2 ≈ 11,520 (한국어, 표현 1개). 다국어·표현 2개를 더하면 수만 건. 단가는 서비스별 설정.
