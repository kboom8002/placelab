# K-Brand Lab 단계 0: 기존 자산 및 실측 원자료 정합성 점검 보고서

> **기준 문서**: [K_Brand_Lab_PRD_v3_KO.md](../../K_Brand_Lab_PRD_v3_KO.md) §17.1, §17.2, §18.2  
> **작성일**: 2026-09-09  
> **목적**: 기존 스크립트·데이터베이스·실측 원자료의 정합성을 검수하고, PRD v3 규격에 맞춘 재사용 가능 여부와 수정 사항을 확정함.

---

## 1. 기존 측정 스크립트 11종 검수 결과 (§17.1)

PRD v3 §17.1에 명시된 기준(사용 API, 검색 설정, 응답 스키마, 권한, 비용, 오류 기록, 세션 초기화)에 따른 검수 판정표입니다.

| # | 스크립트 경로 | 대상 및 역할 | 검수 결과 | 필수 수정 및 K-Brand Lab 전이 방안 |
|---|---|---|:---:|---|
| 1 | `scripts/measure-v2/test-gemini.ts` | Gemini OpenAI-compatible API 연결 테스트 | **조건부 통과** | OpenAI 호환 엔드포인트 대신 `@google/genai` v2.21 네이티브 SDK로 단일화 필요 |
| 2 | `scripts/measure-v2/quick-measure.ts` | 35문항 1회 퀵 측정 CLI | **통과** | 5개 단위 병렬 배치(`Promise.all`) + 1,000ms 딜레이 패턴을 공통 실행기로 추출 |
| 3 | `scripts/measure-v2/measure-unit.ts` | 지자체 범용 반복 측정 CLI | **통과** | 회차(`reps`) 반복 간 2,000ms 딜레이 및 SHA-256 응답 해시 로직 재사용 |
| 4 | `scripts/measure-v2/measure-3tier.ts` | 3-Tier (T1~T4) 종합 진단 | **통과 (우수)** | **PRD v3 Slot/Attempt 분리 엔진의 원형**. T1~T4 다단계 프로브 로더 및 지연시간(`latencyMs`), 해시(`responseHash`), 인용 URL 정규화 로직 100% 재사용 |
| 5 | `scripts/measure-v2/generate-vip-report.ts` | VIP 진단 리포트 자동 생성기 | **조건부 통과** | Floor Risk 및 마크다운 렌더러는 우수하나, PRD v3 납품물(D-01~D-08) 및 M-01~M-16 지표 체계로 렌더러 교체 필요 |
| 6 | `scripts/measure-v2/measure-jeju.ts` | 제주 5대 축 멀티 도메인 측정 | **통과** | 축(Axis)별 파일 분리 로드 및 메타데이터 보존 구조 재사용 |
| 7 | `scripts/measure-v2/measure-jeju-en.ts` | 글로벌 가시성 영문 측정 CLI | **통과** | 영문 시스템 프롬프트 및 영문 인용 URL 추출 패턴 재사용 |
| 8 | `scripts/measure-v2/measure-jeju-en-deep.ts` | 해외 투자유치/럭셔리 심화 영문 | **통과** | B2B/투자유치 심화 질문 세트 구성 패턴 재사용 |
| 9 | `scripts/measure-v2/measure-person.ts` | 멀티 프로바이더 분기 측정 CLI | **조건부 통과** | OpenAI와 Gemini 분기 로직을 단일 스크립트 if/else가 아닌 `ProviderAdapter` 인터페이스로 분리 필요 |
| 10 | `scripts/measure-v2/measure-person-gemini.ts` | Google GenAI SDK + Search Grounding | **통과 (핵심)** | **Gemini Search Grounding 어댑터의 완성형 코드**. `groundingMetadata.groundingChunks` 및 `webSearchQueries` 캡처 로직 핵심 재사용 |
| 11 | `scripts/measure-v2/measure-person-gemini-deep.ts` | 출처 지배력/프레이밍/SoV 심화 실측 | **통과 (핵심)** | 서치 쿼리 전수 캡처 및 도메인 빈도 집계 로직 재사용 |

---

## 2. 실측 원자료 정합성 재집계 (§17.1, §18.2)

PRD v3 §18.2의 지적 사항:
> *"과거 실측 총량 1,230회·1,395회 혼재 → 계획 문항 수, 실제 질문 텍스트 수, 언어별 변형 수, 슬롯 수, 시도 수, 수집 성공 수, 분석 포함 수, 출처 단위 수로 다시 집계한다."*

### A. 제주특별자치도 실측 데이터 전수 재집계
- **원자료 파일**:
  - `docs/aeo-measurements/m-20260908-jeju-all.json` (KR 기본)
  - `docs/aeo-measurements/m-20260908-jeju-en.json` (EN 1차)
  - `docs/aeo-measurements/m-20260908-jeju-en-deep.json` (EN 심화)

| 구분 | KR 기본 (5대 축) | EN 1차 (글로벌 비교) | EN 심화 (고급관광/투자) | 제주 전체 합계 |
|---|:---:|:---:|:---:|:---:|
| **고유 질문 수 (텍스트)** | 90문항 | 35문항 | 45문항 | **170문항** |
| **언어** | 한국어 (KR) | 영어 (EN) | 영어 (EN) | 2개 언어 |
| **반복 회차 (Reps)** | 3회 | 3회 | 3회 | 3회 |
| **계획 슬롯 수 (`N_plan`)** | 270 | 105 | 135 | **510 슬롯** |
| **실제 시도 수 (`Attempts`)** | 270 | 105 | 135 | **510 회** |
| **수집 성공 수 (`N_cap`)** | 270 (100%) | 105 (100%) | 135 (100%) | **510 건 (100%)** |
| **기술 실패 수 (`failed`)** | 0 | 0 | 0 | **0 건** |
| **인용 출처 총 건수** | 321건 | 107건 | 135건 | **563 건** |
| **고유 출처 도메인 수** | 82종 | 44종 | 48종 | **118 종 (중복제거)** |

### B. 김민석 당대표 실측 데이터 전수 재집계
- **원자료 파일**:
  - `docs/person-measurements/pm-20260908-김민석.json` (OpenAI 1차)
  - `docs/person-measurements/pm-20260908-김민석-gemini.json` (Gemini 기본 1차)
  - `docs/person-measurements/pm-20260908-김민석-gemini-deep.json` (Gemini 심화 2차)

| 구분 | OpenAI 1차 (기본) | Gemini 1차 (기본) | Gemini 2차 (심화) | 김민석 전체 합계 |
|---|:---:|:---:|:---:|:---:|
| **고유 질문 수 (텍스트)** | 120문항 | 120문항 | 55문항 | **175문항 (고유)** |
| **모델 / 환경** | `gpt-5.6-luna` | `gemini-3.5-flash-lite` | `gemini-3.5-flash-lite` | 2종 모델 |
| **Search Grounding** | OFF (순수 LLM) | ON (Google Search) | ON (Google Search) | Grounding 비교 |
| **반복 회차 (Reps)** | 3회 | 3회 | 3회 | 3회 |
| **계획 슬롯 수 (`N_plan`)** | 360 | 360 | 165 | **885 슬롯** |
| **실제 시도 수 (`Attempts`)** | 360 | 360 | 165 | **885 회** |
| **수집 성공 수 (`N_cap`)** | 360 (100%) | 360 (100%) | 165 (100%) | **885 건 (100%)** |
| **기술 실패 수 (`failed`)** | 0 | 0 | 0 | **0 건** |
| **그라운딩 출처 총 건수** | N/A (미사용) | 1,261건 | 662건 | **1,923 건** |
| **고유 출처 도메인 수** | N/A | 191종 | 127종 | **318 종 (중복제거)** |

### C. 총량 오해 해소 및 정정 공식 표기
- **혼재 원인 규명**:
  - "1,230회": 제주 510회 + 김민석 720회 (OpenAI 360 + Gemini 1차 360) = 1,230회
  - "1,395회": 제주 510회 + 김민석 전체 885회 (OpenAI 360 + Gemini 1차 360 + Gemini 2차 165) = 1,395회
- **PRD v3 정식 표기**:
  - 전체 누적 실행 슬롯: **1,395 슬롯** (제주 510 + 김민석 885)
  - 전체 수집 성공률: **100% (1,395/1,395)**
  - 서치 그라운딩 출처 분석량: **총 2,486건 (제주 인용 563 + 김민석 그라운딩 1,923)**
  - 이 데이터는 확증된 사실(L1) 관측치이며, 브랜드용 일반화가 아닌 **기존 시험 관측치**로만 기술함.

---

## 3. 첫 고객·제품군·시장·언어 후보 선정 가이드 (§2.1, §15.1)

PRD v3 §2.1 및 §15.1에 따른 초기 실증(MVP) 대상 선정 체크리스트:
1. **반복 고객 질문과 갱신할 실제 정보 존재 여부**:
   - 후보 A: 글로벌 텀블러/주방용품 브랜드 (식품접촉안전, 세척, 보온력, 교체부품)
   - 후보 B: K-뷰티 스킨케어 브랜드 (원료 원산지, 비건/EWG 인증, 피부타입별 사용법, 수출국 규제)
   - 후보 C: 전통문화 체험 공방/POI (예약 경로, 원데이클래스 언어 지원, 현장 주차, 환불 조건)
2. **권한 및 협력 체계**:
   - 담당자가 정본(Canonical) 작성 및 사실 확인(Claim verification)에 직접 참여 가능해야 함.
   - 비공개 내부 FAQ/상담 데이터를 동의 하에 연구 목적(L1)으로 제공할 수 있어야 함.
3. **초기 측정 규모 고정**:
   - 20문항 (개발용 14 + 평가용 6)
   - 2개 언어 (한국어 + 영어)
   - 2개 환경 (OpenAI + Gemini Search Grounding)
   - 3회 반복
   - 시점당 240 슬롯 (기준 2시점 + 개선 후 2시점 = 총 960 슬롯 계획)

---

## 4. 환경 설정 점검 결과 (§17.2)

- `OPENAI_API_KEY`: 정상 구성됨 (GPT-4o, gpt-5.6-luna 호출 검증 완료)
- `GEMINI_API_KEY`: 정상 구성됨 (`@google/genai` v2.21 + Google Search Grounding 호출 검증 완료)
- `NEXT_PUBLIC_SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: 정상 구성됨
- 검수 결론: **외부 공급자 연동 및 DB 마이그레이션 실행 환경 100% 준비 완료**.
