# 파일럿 측정 실행 패키지 v1.0 — 모두의 정답노트

자체 사업 측정(D103). 기관 통지 없음, 공개 문서만 읽음. 방법론 v1.0 3장·11.2장과 1차 측정 사전 등록안을 그대로 코드로 옮겼다.

## 구성

| 파일 | 역할 |
| --- | --- |
| `probe-panel-question-workbook-v1.0.xlsx` | 템플릿 357·매개변수 사전·파일럿 채점표 (원본은 워크북, 여기서는 읽기만) |
| `sites.csv` | 파일럿 5곳: site_id·공식 도메인·유형 |
| `sampling_frame.csv` | 지자체별 표집값. `{동}` 8곳은 채워 둠(**확인 필요** — 공식 읍면동 목록으로 검증), `{도서관}` `{축제}` `{명소}` `{시장}` `{공영주차장}` `{보건지소}`는 **기입 필요** |
| `generate_instances.py` | 템플릿 × 지자체 × 매개변수 → `instances.jsonl`(3,267건) + `ledger_template.csv` + `summary.txt` |
| `run_measure.py` | OpenAI Responses API(web_search)로 질문, 원문·인용 URL 기록 → `runs/<run_id>/answers.jsonl` |
| `judge_auto.py` | 출처 4단(S1–S4)·공급 공백·안정성·피해 위험 신호 자동 판정 → `judgments.jsonl` `summary.csv` `human_queue.csv` |
| `schema.md` | 로그·판정 스키마 |
| `ledger.csv` | 정답 원장 — **구로구 고위험 180행 AI 조사 초안 기입**(ledger_author=‘AI 조사(검토 전)’, 공식 페이지 실제 열람 기준, 공급 공백 9·근거 미확인 5). 사람 2인 검토 후 ledger_author·second_author를 실명으로 바꾼다. 나머지 3,082행은 비어 있음 |
| `ledger_work/` | 조사 묶음별 원본 출력(A 교통·세금·민원, B 보건·의료, C 복지, D 재난·주거) |

## 실행 순서 (10/9–11)

```bash
pip install openpyxl openai
export OPENAI_API_KEY=...

# 0) 표집표 채우기 — sampling_frame.csv 의 '기입 필요' 행 (지자체 공식 목록에서, source_url 기록)
# 1) 인스턴스 생성
python generate_instances.py --xlsx probe-panel-question-workbook-v1.0.xlsx
# 2) 정답 원장 — ledger.csv 에 구로구 고위험 180행이 초안으로 들어 있음. 검토 후 나머지(구로 중·저위험, 타 4곳)를 채운다. 고위험은 2출처·2인
# 3) 측정: 3일 × 하루 3회. 같은 run_id 로 누적. 먼저 '확정' 상태만, 표집 기입이 끝나면 all
python run_measure.py --run-id pilot_2026-10 --day 1 --reps 3 --only-status 확정
python run_measure.py --run-id pilot_2026-10 --day 2 --reps 3 --only-status 확정
python run_measure.py --run-id pilot_2026-10 --day 3 --reps 3 --only-status 확정
# 4) 자동 판정 → 사람 판정 대기열
python judge_auto.py --run-id pilot_2026-10
# 5) human_queue.csv 의 judge_A/judge_B/final 을 채운 뒤, 워크북 '파일럿 채점표'에 템플릿 단위로 옮긴다
```

API 호출 없이 점검: `python run_measure.py --run-id dry --day 1 --dry-run --limit 40`

## 규모와 비용

- 인스턴스 3,267건(확정 2,545 · 확인 필요 442 · 기입 필요 280). 증평군은 읍면 2곳이라 591건.
- 9회 반복 시 29,403회(확정만 22,905회). 사전 등록안 단가($0.0244/회) 기준 약 $720(확정만 $560). 실제 단가는 모델·검색 과금에 따라 다르므로 첫날 100회로 실측 후 조정.

## 판정 규칙 요약 (자동이 하는 것 / 사람이 하는 것)

- 자동: S1 인용 있음 · S2 공식 도메인 인용 · S3 첫 인용이 공식 · S4 원장 숫자·핵심어 포함 여부(후보 판정만) · 공급 공백 분리 · 9회 중 변동 횟수 · 고위험 무근거 숫자 단정 신호
- 사람(전수, 3.4): S4 최종 맞음/다름, 고위험 2인, 공식 간 상충 표시. 대기열은 고위험 → 보류/다름 후보 → 불안정 순.
- 채점표 5기준(11.2)은 템플릿 단위다. 인스턴스 판정을 템플릿·지자체로 묶어 '정답 지자체 수'와 '해당 지자체 수'를 낸다.

## 하지 않는 것

- 기관 시스템 접속·전화·민원 없음. 모델이 공개 웹을 읽는 것만.
- 시스템 프롬프트·답변 유도 없음. 질문 원문 그대로.
- 지자체 이름 단위 결과는 내부 분석용. 공개는 집계·밴드만.

## 상시 관측 모듈 (D108 — 능동 성과 측정안 8장)

| 파일 | 역할 |
| --- | --- |
| `gazetteer.csv` | **16 광역 + 226 기초** 지명 사전(2026.7.1 전남광주통합특별시 출범 반영 — 광주광역시+전라남도, 기초 27곳 승계). 별칭·동명 해소 상태·공식 도메인. 상태 ‘확인 필요’ — 행안부 행정구역 현황으로 검증. `official_domain`은 파일럿 5곳만 기입 |
| `declarations.csv` | **기본 선언표 — 파일럿 5곳 60행**(알릴 25·낡은 14·도메인 28·읍면 2, 상태 ‘AI 조사(검토 전)’, 공식 페이지 실제 열람 기준). 지명 한 줄 답변에서 알릴·낡은 요소 등장을 자동 추적. 나머지 237곳은 같은 양식으로 추출 |
| `decl_work/` | 선언표 조사 원본 출력 |
| `observe_questions.csv` | 관측 질문 90 = 고정 40(앵커 25) + 계절(겨울) 10 + 외국어 40(영 20·중 10·일 10). 상태 ‘초안’ |
| `observe_weekly.py` | `ask`(월·수·금 관측 90, 화 지명 한 줄 243) → `extract`(지명 사전 매칭, 동명은 시·도 문맥 20자 안에서만) → `window`(4주 창 상태: 신규·안정·가끔·드묾·소멸) → `cards`(지자체 카드 242장 md + weather.csv, 선언표가 있는 단위는 정체성 섹션 포함) |

```bash
python observe_weekly.py ask --week 2026-W49 --day mon          # 월·수·금 반복
python observe_weekly.py ask --week 2026-W49 --day tue --identity
python observe_weekly.py extract --week 2026-W49
python observe_weekly.py window --week 2026-W49                  # 직전 4주 runs_weekly/ 를 읽는다
python observe_weekly.py cards --week 2026-W49
```
주 512회·약 $13. 사람은 states.csv 의 신규·소멸과 카드의 ‘낡은 요소 등장’만 확인(주 30건 안팎).
