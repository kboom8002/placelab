# 모두의 정답노트 — 개발팀 전달 문서 세트 v1.1 (2026-10-09)

㈜디지털미디어네트워크 · 측정 체계 v1.0(D93–D110) 확정 이후의 **최종 레포 문서 세트**. 2026-10-04 기준 레포 문서(`AGENTS.md`, `docs/sdd`, `docs/knowledge`)를 바탕으로, 10/05–10/09에 확정된 방법론·측정 설계·데모·실행 패키지를 얹었다. **충돌하는 부분은 `CHANGES-v1.1.md`가 우선한다.**

## 읽는 순서

| 순서 | 파일 | 왜 |
| --- | --- | --- |
| 1 | `AGENTS.md` | 코딩 에이전트·개발자의 첫 파일. §0에 v1.1 변경 요약 |
| 2 | `CHANGES-v1.1.md` · `MANIFEST.md` | 10/04 문서와 달라진 것 — 무엇이 폐기되고 무엇이 대체했나 |
| 3 | `STATUS.md` | 지금 무엇이 ‘검토 전’이고 사람 손이 어디에 필요한가, 일정 |
| 4 | `docs/methodology/01_measurement-methodology-v1.0.md` | 측정 체계의 정본(13장). 다른 모든 문서가 이것을 전제로 한다 |
| 5 | `docs/methodology/03_goldilocks-measurement-and-publication.md` → `04_active-outcome-measurement-and-weekly-diagnosis.md` | 전국 측정의 규모·비용·공표 설계(방어 네 층 + 능동 E층 + 상시 관측) |
| 6 | `docs/methodology/02_first-round-preregistration.md` | 10/20 공개본·10/27 블록 1·11/17 집계의 실제 실행 계획 |
| 7 | `docs/product/05_demo-and-portal-redesign.md` | 포털 핵심 기능(정비 사건 등록부·밴드 지도·시민 확인단·신고판) 설계 → 구현 과제 |
| 8 | `measurement/README.md` | 파일럿 실행 패키지 v1.2(코드·데이터). 바로 돌릴 수 있는 상태 |
| 9 | `docs/sdd/*`, `docs/knowledge/*` | 10/04 기준 SDD·지식 소스. `CHANGES-v1.1.md`의 덮어쓰기 목록을 적용해 읽는다 |

## 폴더

> 모든 경로는 ASCII다. 한글 제목 대응은 `MANIFEST.md`.

```
AGENTS.md                      첫 파일 (§0 v1.1 변경 요약 추가)
CHANGES-v1.1.md                10/04 → 10/09 변경·폐기·대체 목록
STATUS.md                      검토 전 항목·사람 손·일정
docs/
  README.md                    문서 지도
  methodology/                 측정 체계 정본 4편 (Claude Docs에서 내보낸 markdown; 도식은 원본 링크 참조)
  product/                     데모·포털 수정 설계, 지역 문화 트랙 운영안, 초기 사업 전략 계획서
  sdd/                         SDD 00–08 (10/04 기준, 변경은 CHANGES 참조)
  knowledge/                   원칙·용어·사전·카피·ADR(ADR-016~021 추가)·데이터 시드
  decisions/                   결정 로그 발췌 D72–D110 (원본은 회사 지식 세트)
  background/                  K-컬처 정본 사업 배경(보완안 v2·수원 적합성·의원실 참고·figures·docx), 보류된 통지문, planning_docx
demo/
  jeongdap_v0.7/index.html     정답노트 데모 v0.7 (지역 문화 트랙·수원 사전 관측 반영) — 단일 HTML
  suwon/index.html             수원 전용 데모 (공개판/기관 확인판)
  legacy_build/                초기 데모 빌드 스크립트(10/04)
measurement/                   파일럿 실행 패키지 v1.2 — 생성기·측정기·판정기·상시 관측·지명 사전·선언표·원장 초안·워크북
data/legacy/                   10/04 질문 세트 초안 xlsx (워크북 v1.0으로 대체됨)
```

## 원본(살아 있는 문서) 링크

markdown 내보내기에서 도식(widget)은 자리 표시로 바뀌었다. 도식과 최신판은 아래 원본에서 본다.

| 문서 | 링크 |
| --- | --- |
| 측정·참여·공개 방법론 v1.0 | https://claude.ai/code/artifact/ed948cb0-080f-4cb8-b194-f5f86f2f6917 |
| 1차 측정 사전 등록안 | https://claude.ai/code/artifact/ad25f04c-922a-4e45-ad44-06dfca55c976 |
| 골디락스 측정·공표안 | https://claude.ai/code/artifact/42445bb2-acf2-458f-9372-7087df1aab8a |
| 능동 성과 측정안(상시 진단 포함) | https://claude.ai/code/artifact/817bd212-68ef-465c-b577-b59fd7973652 |
| 데모·포털 수정 설계 | https://claude.ai/code/artifact/c70a0470-8392-4bda-a3b4-da057fc5a7e8 |
| 지역 문화 트랙 운영안 | https://claude.ai/code/artifact/293d19af-de46-4224-9103-89a6faea5505 |
| 초기 사업 전략 계획서 | https://claude.ai/code/artifact/836926d1-bc4d-43b4-9cb4-8f09286b1689 |
| 데모 v0.7 (게시) | https://claude.ai/artifact/76myHKVLo6D1xmcFhH4keW |
| 수원 전용 데모 (게시) | https://claude.ai/artifact/PiyzLLeAKvMdXMj6q46GUx |

## 한 문단 요약

정답노트는 **공개 문서만 읽어 AI 답의 공식 근거를 재는 자체 사업**이다(D103). 지표는 둘 — 공식 근거율(자동)과 피해 위험 건수(사람). 전국 242단위(광역 16·기초 226)는 코어 60문항 × 3회 자동 판정으로 밴드 지도를 그리고(2027년 3월 첫 공개), 기준 단위 5곳(구로·수원·화성·증평·광주 서구)에서만 패널 550 × 9회로 사전 등록 실험을 한다. 능동 측정은 비지명 수요 질문 50 + 외국어 40 + 지명 한 줄 243을 매주 묻는 상시 관측으로 하고(주 $13), 등장한 지역은 이름을 공개하되 순위는 만들지 않는다. 분기 비용은 API 약 $2,050·사람 판정 약 6,000건이다.
## ZIP 수신 검증 (개발팀용)
압축 해제 후 아래가 맞으면 정상:
- docs/methodology/ 4파일, docs/product/ 3파일, docs/background/ 8파일 + figures/ 7 + planning_docx/ 4, docs/decisions/ 1파일
- measurement/probe-panel-question-workbook-v1.0.xlsx 존재
- 총 파일 수 94개(폴더 제외). 모든 경로는 ASCII.
확인 명령: `find . -type f | wc -l` → 94
