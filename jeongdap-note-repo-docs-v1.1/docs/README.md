# docs — 문서 지도

| 폴더 | 내용 |
| --- | --- |
| `methodology/` | **측정 체계 정본(v1.1 추가)**: 방법론 v1.0 · 사전 등록안 · 골디락스안 · 능동 성과 측정안(상시 진단) |
| `product/` | 데모·포털 수정 설계 · 지역 문화 트랙 운영안 · 초기 사업 전략 계획서 |
| `decisions/` | 결정 로그 발췌 D72–D110 |
| `background/` | K-컬처 정본 사업 배경 자료·도식·보류 통지문·초기 기획 docx |
| `sdd/` | 소프트웨어 설계 문서(SDD): 구현의 기준 |
| `knowledge/` | 도메인 지식 소스: 용어·원칙·방법론·사전·카피·결정 기록 |
| `knowledge/data/` | 시드로 옮길 수 있는 데이터(질문 세트·다국어 질문·명칭 용어집·레지스트리) |

## SDD
- `00-overview.md` 범위·용어 연결·컴포넌트 요약
- `01-architecture.md` 구성·배포·데이터 흐름·시퀀스
- `02-data-model.md` 스키마(DDL)·제약·트리거·인덱스·시드
- `03-rls-and-auth.md` 역할·클레임·헬퍼 함수·정책
- `04-domain-logic.md` 정규화·답안지 대조·판정·통계·상태 기계·현지화 점검
- `05-workers-and-jobs.md` 큐·페이로드·어댑터·재시도·비용
- `06-frontend.md` 라우트·렌더링·상태 규칙·다국어·SEO·컴포넌트
- `07-api.md` Route Handlers·Server Actions·웹훅 계약
- `08-testing-and-ops.md` 테스트·CI·환경·관측

## 지식 소스
- `principles.md` · `glossary.md` · `measurement-methodology.md` · `question-composition.md` · `attribute-dictionary.md` · `region-registry.md` · `multilingual-l10n.md` · `design-system.md` · `web-copy.md` · `roles-and-permissions.md` · `products-catalog.md` · `decisions.md`

## 출처 문서 (기획)
PRD v0.2, 지역 브랜드 모두의 정답노트 설계서 v0.4, 측정 방법론, 측정 질문 구성 방법론과 속성 사전, 지자체 상품 카탈로그와 플랫폼 스펙, 데모 v0.5.

## v1.1 (2026-10-09)
- `measurement-methodology.md`는 `methodology/01_measurement-methodology-v1.0.md`로 대체. `decisions.md`에 ADR-016~021. 충돌 해소는 루트 `CHANGES-v1.1.md`.
