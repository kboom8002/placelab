# 지식 소스

이 디렉터리는 **코드가 참조하는 사실의 원본**이다.

판정 기준·문항·법령 근거·통계 규칙을 코드나 주석에 직접 적지 않는다. 여기를 갱신하고, 코드가 여기를 따르게 한다. 시드 CSV는 여기서 **파생**되며, 지식 문서를 고치지 않고 CSV만 고치는 것은 금지한다.

| 파일 | 내용 | 파생물 |
|---|---|---|
| [`K01-glossary.md`](./K01-glossary.md) | 용어 사전 — 이 제품이 쓰는 말의 정의 | UI 문구 · 도움말 |
| [`K02-units-taxonomy.md`](./K02-units-taxonomy.md) | 측정 단위 마스터 — 243곳 + 특별구역 A/B/C | `seed/units.csv` · `seed/unit_domains.csv` |
| [`K03-measurement-spec.md`](./K03-measurement-spec.md) | 측정 명세 v1.0 — 판정 규칙·경계값·AI 수집기 목록 | `seed/method_versions.csv` · `seed/ai_agents.json` |
| [`K04-question-sets.md`](./K04-question-sets.md) | 문항 원본 — 지명 12 + 무지명 8, 채점 지침 | `seed/questions.csv` |
| [`K05-legal-policy.md`](./K05-legal-policy.md) | 법령·제도 근거 — AI기본법, 평가 제도, 예산 일정 | 영업 자료 · UI 근거 문구 |
| [`K06-validity-statistics.md`](./K06-validity-statistics.md) | 타당도와 통계 규칙 — 무엇을 말할 수 있고 없는가 | 집계 로직 · 리포트 문안 |
| [`K07-publication-policy.md`](./K07-publication-policy.md) | 공개·정정·인용 정책과 문장 템플릿 | i18n 리소스 |
| [`K08-products-pricing.md`](./K08-products-pricing.md) | 유료 상품 P1~P4와 Layer 3 SaaS | 과금 · 전환 설계 |
| [`K09-baseline-scan-2026-09.md`](./K09-baseline-scan-2026-09.md) | 2026-09-05 예비 실측 원자료 | 스캐너 회귀 픽스처 |
| [`K10-psychometric-measurement.md`](./K10-psychometric-measurement.md) | 심리측정 기반 측정 설계 — 분포·Floor·증상군·강건성·페르소나 진단 | K03·K04·K06 개정 근거 |
| [`K11-prior-art-positioning.md`](./K11-prior-art-positioning.md) | 선행 연구와 포지셔닝 — 확인된 선행 6종, 금지 표현, 위험 | 영업·발표 문안 |
| [`K12-standards-track.md`](./K12-standards-track.md) | 표준화·대외 협력 트랙 — 학회·NIA·행안부·연세대 | 대외 활동 계획 |
| [`K13-diffusion-track.md`](./K13-diffusion-track.md) | 확산 트랙 — 개념 선점, 토픽 파이프라인, 채널, 금지 문구 | 칼럼·세미나·언론 협업 |
| [`K14-content-assets.md`](./K14-content-assets.md) | 기사화 자산 23종 인벤토리, 확장 방안, 12개월 발행 계획 | 발행물 기획 · FR 도출 |

## 갱신 규칙

1. **사실이 바뀌면 문서를 먼저 고친다.** 코드가 아니라.
2. **측정에 영향을 주는 변경은 `method_version` 을 올린다.** K03·K04가 여기 해당한다. 버전을 올리지 않고 문항이나 기준을 바꾸면 과거 데이터와의 비교 가능성이 조용히 깨진다.
3. **출처를 적는다.** 법령·통계·고시는 조회일과 함께 남긴다. 이 문서들은 "2026년 9월에 확인한 것"이지 영원한 사실이 아니다.
4. **틀린 것이 확인되면 지우지 말고 정정 기록을 남긴다.** 우리가 남에게 요구하는 것(FR-23 정정 절차)을 우리 문서에도 적용한다.

## 신뢰 등급

각 문서의 사실에는 등급을 붙인다.

| 등급 | 의미 |
|---|---|
| **확인** | 1차 출처(법령 원문·소관 부처 고시·직접 관측)로 확인함 |
| **인용** | 2차 출처(보도·연구자료)로만 확인함. 착수 전 1차 출처 재확인 필요 |
| **추정** | 근거는 있으나 확인되지 않음. 의사결정의 단독 근거로 쓰지 않음 |
