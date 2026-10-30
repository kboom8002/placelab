# SDD 04 — 도메인 로직

> 위치: `apps/web/lib/domain/` 및 `packages/shared/domain/` (워커와 공유). **순수 함수 + 단위 테스트 필수.**

## 1. 판정 라벨
| 코드 | 한국어 | 정의 | 쉬운 말 |
| --- | --- | --- | --- |
| `ok` | 정확 | 확인된 정답과 같다 (필수 사실 포함, 틀린 사실 없음) | 맞아요 |
| `old` | 옛 정보 | 정본 이력의 이전 값과 같다 | 예전 이야기예요 |
| `nofact` | 없는 사실 | 어느 목록에도 없고 정답과 다르다 | 사실이 아니에요 |
| `mix` | 혼동 | 혼동 묶음의 다른 대상 값과 같거나 대상을 착각했다 | 다른 곳과 헷갈렸어요 |
| `unk` | 모름 | 모른다고 하거나, 필수 사실을 말하지 않았다(`reason='omitted'`) | AI가 몰라요 |
| `undecidable` | 판정 불가 | 정본 불확실·질문 모호 (분모에서 제외, 건수 공개) | — |
| `risk` (플래그) | 위험 | 따르면 안전·건강·이동에 문제 (라벨과 별개) | 조심하세요 |

## 2. 값 정규화 (`normalize(valueType, raw)`)
| value_type | 정규 형식 (jsonb) | 비교 규칙 |
| --- | --- | --- |
| `weekday_rule` | `{"closed":["MON"],"except":["HOLIDAY_NEXT"]}` | 요일 집합 일치 |
| `timetable` | `{"days":"MON-FRI","open":"09:00","close":"18:00","last_entry":"17:00"}` | 시각 ±0분, 요일 범위 일치 |
| `date_range` | `{"from":"2026-10-16","to":"2026-10-18"}` | 날짜 일치, 연도 누락 시 해당 연도 가정 금지(`unk`) |
| `date_rule` | `{"monthly_days":[1,6,11,16,21,26]}` | 집합 일치 (장날) |
| `money` | `{"amount":2000,"currency":"KRW","audience":"adult"}` | 금액 일치, 대상 구분 |
| `address` | `{"road":"중앙로 105","sigungu":"서귀포시"}` | 도로명+번호 또는 지역 수준 일치 (질문이 요구하는 수준) |
| `contact` | `{"phone":"1330"}` | 숫자만 비교 |
| `list` | `{"items":["운진항","송악산 선착장"]}` | 필수 항목 모두 포함 |
| `route` | `{"steps":[...]}` | 핵심 경유·주체 포함 |
| `condition` | `{"min_age":65,...}` | 핵심 조건 포함 |
| `name_succession` | `{"current":"영종구","previous":["인천 중구"]}` | 현재 이름 = ok, 이전 이름 = old |

다국어 비교: 값은 정규화 후 언어와 무관하게 비교한다. 장소 이름은 `entity_names`(공식·별칭·옛 표기·흔한 오기)로 대상을 식별한다(`entity_match`).

## 3. 답안지 생성 (`buildAnswerKey(question, asOf)`)
1. `facts`에서 `entity_id`·`attribute_code`가 같고 `asOf`에 유효한 확정 사실(`status='confirmed'`, `grade>=L2`, 측정 질문은 L1 단독 불가) → `correct`.
2. 같은 사실의 이전 버전 값들 → `old_values`.
3. 같은 `confusion_group_id`의 다른 대상의 같은 속성 값 → `confusion_values`.
4. 속성 사전의 값 형식별 허용 변형 생성기 + 운영자 추가 → `variants`.
5. 사실이 없거나 `conflict`면 답안지를 만들지 않는다 → 해당 질문은 측정 세트에 넣지 않는다.

## 4. 답 판정 (`judgeAnswer(answer, key)`)
```
1. 거절·모름 패턴(언어별 사전) 감지 → unk
2. 주장 추출: 규칙(정규식·날짜/시간 파서) 우선, 실패 시 모델 보조(구조화 출력 {entity_mention, attribute, value_text}, prompt_version 기록)
3. 대상 식별: entity_mention ↔ entity_names → entity_match(true/false)
   - 다른 대상(혼동 묶음)으로 식별 → mix
4. 값 정규화 → 비교 순서: correct/variants → ok | old_values → old | confusion_values → mix | 그 외 → nofact
5. 필수 사실 누락(주장 없음) → unk(reason='omitted')
6. 확신도 < 0.7 → 사람 판정 대기열
7. 위험 플래그: attribute.is_risk && label != ok → risk=true (사람 판정 전수)
```

## 5. 집계·통계 (`aggregate`)
- **분석 단위** = 질문 × 서비스 (반복은 평균: 정확 비율).
- **정답률** = Σ단위 정확 비율 / 판정 가능 단위 수 (`undecidable` 제외).
- **신뢰 구간**: 질문 단위 군집 부트스트랩(B=2,000, 질문 재표집), 표본이 작으면 윌슨 구간 병기.
- **지역 집계**: 동 → 기초는 **건수**만 (`counts: {ok, wrong, risk}`), 기초 → 광역 → 국가는 질문 수 가중 평균. 같은 사실 질문은 한 번 측정해 여러 지역에 귀속.
- **개편 승계**: `region_successions`로 이전 구역 결과를 새 구역에 “개편 전 구역 기준” 표시와 함께 연결.
- **언어 격차** = 정답률(ko) − 정답률(lang), **같은 사실 ID 질문끼리만**.
- **명칭 정답률** = `entity_match=true` 비율.
- **검색 이득** = 정답률(search_on) − 정답률(search_off).
- **κ**: 사람–사람·사람–자동 Cohen 카파(라벨 6종), 목표 0.8.
- **변화 검정**: 공통 질문만, 짝지은 부트스트랩, 사전 등록 최소 변화 기준, 다중 비교는 거짓 발견률(BH).
- **개입 효과**(P3): 이중차분 (고친 사실 vs 비교 사실 × 전후).
- **금지**: 순위 계산·저장·노출.

## 6. 현지화 점검 (`checkLocalization(draft, ctx)`)
| 점검 | 방법 | 실패 시 |
| --- | --- | --- |
| 의미 보존 | 다른 모델로 역번역 → 원문과 의미 동등성 판정 | 원어민에게 표시 |
| 용어집 준수 | 대상의 `entity_names(official, lang)` 포함 여부 | 표시 |
| 글자 혼용 | zh_hant에 간체 전용 글자, zh_hans에 번체 전용 글자 (대응표) | **그대로 승인 불가** |
| 언어권 표현 | 번체에 본토 어휘·간체에 대만식 어휘 사전 (예: 搭公車↔坐公交) | 표시 |
| 유도 표현 | 정답 암시·선택지 하나만 제시 패턴 | 표시 |
| 길이·자연스러움 | 점수 | 참고 |

승인 규칙: `native1`·`native2` 모두 승인(또는 수정 후 승인) + 글자 혼용 실패 0 → `registered`. 수정 사유는 `reason`에 분류(용어집·자연스러움·지역 표현·의미 오류·글자 혼용).

## 7. 상태 기계
### 7.1 발행 (`publications.stage`)
`draft → embargo → fact_check → published → corrected`
- `embargo → fact_check`: 지자체 알림, `fact_check_due = now + 5영업일`
- `fact_check → published`: 이의 처리 완료 + `ops_measure` 승인. 선거 기간이면 지역 비교 발행 보류.
- `published → corrected`: 정정 공지 필수, 이전 값 보존.

### 7.2 정정 (`corrections.status`)
`pending_assign → in_progress → remeasure_scheduled → resolved`

### 7.3 정본 (`facts.status`)
`scheduled → confirmed → expired` / `conflict`(해결 시 새 사실로 `confirmed`)

### 7.4 현지화 (`l10n_stage`)
`ai_draft → ai_check → native1 → native2 → (adjudicated) → registered`

## 8. 질문 세트 검증 (`validateSet(set)`)
- 칸 배분: 광역 A24·B15·C12·D6·E3, 기초(계약) A36·B42·C24·D12·E6, 기초(기본) A24·C3·D3, 동 A6·B3·C3·D2·E1
- 위험 속성 비율 ≥ 25%
- 같은 사실(엔티티×속성)이 상위·하위 세트에 중복되면 경고 (한 층에서만 측정)
- D칸: 한 동·한 집단 비중 ≤ 50%, 정본 확정 질문만
- 다국어 대상(`is_tourist`)은 4개 언어 모두 `registered`여야 다국어 회차에 포함
- 의견·추천 질문 금지 (`isOpinionQuestion`: “가장·추천·맛있·좋은·최고” 등 언어별 사전)
