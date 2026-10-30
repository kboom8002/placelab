# SDD 07 — API 계약

## 1. Route Handlers
### `POST /api/check`
```jsonc
// request
{ "regionCode": "50130", "lang": "ko", "text": "대정 오일장은 매주 토요일에 열려요." }
// response 200
{ "sentences": [
  { "text": "대정 오일장은 매주 토요일에 열려요.",
    "label": "nofact", "reason": "정답·옛 값·혼동 값 어디에도 없음",
    "questionId": "…", "answerKey": { "correct": "1·6·11·16·21·26일", "evidence": "…", "asOf": "2026-09-28" } },
  { "text": "…", "label": null, "reason": "확인된 정답 없음" } ] }
```
- 비로그인 허용, **저장하지 않음**, 속도 제한(IP·세션).
- 결과에는 “공식 정답률과 별개” 안내 문구 포함(카피 사전).

### `POST /api/revalidate`
헤더 `x-signature: HMAC-SHA256(body, REVALIDATE_SECRET)`. 본문 `{ "tags": ["region:50130","round:2026-R2"] }` → 태그 재검증 → 204.

## 2. Server Actions (모두 서버에서 역할 재확인)
| 액션 | 입력 | 권한 | 효과 |
| --- | --- | --- | --- |
| `submitClaim` | regionCode, lang, questionText?, aiText, evidenceUrl? | citizen+ | claims insert, 알림 |
| `proposeQuestion` | regionCode, text, area | citizen+ | 의견 질문이면 거절 메시지, 아니면 proposals insert |
| `vote` | proposalId | citizen+ | 지역별 1인 1표 |
| `submitJudgment` | taskId, label, risk, reason | rater | judgments insert(human) |
| `adjudicate` | answerId, label, reason | ops_measure | judgments insert(adjudicated) |
| `submitL10nReview` | reviewId, decision(approve/fix), editedText?, reason | native_reviewer(언어) | 글자 혼용 실패 시 approve 거부 |
| `submitObjection` | publicationId, judgmentId, text | gov_official(지역) | objections insert, 재판정 대기 |
| `assignCorrection` | correctionId, dept, dueAt | gov_official(지역) | status=in_progress, 알림 |
| `setCorrectionStatus` | correctionId, status | gov_official(지역) | remeasure_scheduled 시 다음 회차 연결 |
| `proposeFact` | entityId, attribute, value, validFrom, evidence | gov_official·crew | 정본 후보(grade=candidate) |
| `supersedeFact` | factId, newValue, validFrom, evidence | ops_editor | DB 함수 `supersede_fact` |
| `freezeSet` | setId | ops_measure | 검증(SDD 04 §8) 통과 시 frozen, hash, preregistered_at |
| `startRound` | roundId | ops_measure | `enqueue_round` |
| `publish` | publicationId | ops_measure | stage=published, 웹훅 |

## 3. 오류 형식
`{ "error": { "code": "FROZEN_SET" | "FORBIDDEN" | "OPINION_QUESTION" | "SCRIPT_MIXING" | "RATE_LIMIT" | "VALIDATION", "message": "사용자용 한국어 문구" } }` — 문구는 `knowledge/web-copy.md` 마이크로카피.
