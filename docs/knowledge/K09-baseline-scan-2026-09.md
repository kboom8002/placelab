# K09 · 예비 실측 2026-09-05

**신뢰 등급: 확인** (직접 관측) · **단, 단일 시점 1회 관측**

파생물: 스캐너 회귀 픽스처 (`SDD` §9.2)

---

## 1. 이 실측의 지위

이것은 **정식 판정이 아니다.** M-1.6의 2주 연속 규칙을 거치지 않았으므로, 공표에 쓸 수 없다.

목적은 하나였다 — **판정 규칙을 설계하기 위해 실제 상태를 본다.** 그리고 그 결과가 명세를 바꿨다.

---

## 2. 대상과 방법

| | |
|---|---|
| 대상 | 경제자유구역 9곳 (A형 6 + B형 3) |
| 조회 | 표준 HTTP GET, `/robots.txt` 및 홈 |
| 시점 | 2026-09-05 |
| 반복 | 1회 |

---

## 3. 결과

| 구역 | 호스트 | robots.txt | 판정 | 사유 |
|---|---|---|---|---|
| 인천 IFEZ | `www.ifez.go.kr` | `User-agent: *` / `Allow: /` + 3개 경로 `Disallow` | `open` | — |
| 부산진해 BJFEZ | `www.bjfez.go.kr` | `Disallow: /search/` · `Crawl-delay: 5` | `open` | — |
| 광양만권 GFEZ | `www.gfez.go.kr` | `User-agent: *` / `Allow:/` | `open` | — |
| 대구경북 DGFEZ | `www.dgfez.go.kr` | 404 | `no_file` | — |
| 전남광주 JGFEZ | `www.gjfez.go.kr` | 연결 시간 초과 | `undetermined` | `timeout` |
| 강원 GSFEZ | `gsfez.go.kr` | 존재하며 홈 접근까지 거부 | `blocked_all` | — |
| 경기 GGFEZ (B) | `ggfez.gg.go.kr` | **robots.txt 자리에 HTML 홈페이지 반환** | `undetermined` | `malformed` |
| 충북 CBFEZ (B) | `www.chungbuk.go.kr` | 조회·파싱 실패 | `undetermined` | `parse_fail` |
| 울산 UFEZ (B) | `www.ulsan.go.kr` | 시·도 도메인과 공유 | — | `shared_domain` |

### 요약

**9곳 중 정상 판정이 가능한 곳은 3곳이었다.** 나머지 6곳은 값이 나쁜 것이 아니라 *값을 읽을 수 없는* 상태다.

| 판정 | 곳 |
|---|---|
| `open` | 3 |
| `no_file` | 1 |
| `blocked_all` | 1 |
| `undetermined` | 3 |
| 측정 단위 아님 (B형) | 1 |

---

## 4. 이 실측이 명세를 바꾼 것

### ① 판정을 2분에서 4분으로

초기 명세는 `열림 / 닫힘` 2분이었다. 관측된 6개 상태 중 어느 것도 그 둘에 깨끗이 들어가지 않았다. → [ADR-0003](../adr/0003-four-way-verdict.md)

### ② `MALFORMED` 를 독립 코드로

`/robots.txt` 가 HTML을 반환하는 것은 **차단 의도가 아니라 설정 오류**다. 통보받은 기관이 예산 없이 당일 고칠 수 있다. 이 구분이 제품을 "지적하는 도구"에서 "고칠 수 있게 하는 도구"로 바꾼다.

### ③ B형 개념의 발견

울산·충북 경제자유구역은 시·도 도메인 위에 얹혀 있다. **구역 단독으로 `robots.txt` 를 가질 수 없다.** 여기서 "구역은 측정할 수 없고, 측정되는 것은 운영 주체의 누리집"이라는 원칙이 나왔고, A/B/C 3분류로 이어졌다. → `K02` §3.1

### ④ 승격 규칙의 필요

타임아웃이 예외가 아니라 상시 상태라면, 1회 관측으로 기관 상태를 단정할 수 없다. → [ADR-0004](../adr/0004-observation-vs-verdict.md)

### ⑤ 스캐너 실행 환경 제약

이 실측 과정에서, **프록시를 경유하는 환경에서는 TLS 인증서가 프록시의 것으로 관측되어 만료일이 무의미해진다**는 것을 확인했다. 스캐너는 직접 egress가 가능한 환경에서만 실행하고, 프록시 경유가 감지되면 `tls_ok` 를 판정하지 않는다. → `K03` M-1.5

---

## 5. 회귀 픽스처

`SDD` §9.2 의 테스트가 이 9건을 고정 입력으로 쓴다.

| 픽스처 | 원본 | 기대 판정 |
|---|---|---|
| `ifez_allow_with_paths` | IFEZ | `open` |
| `bjfez_crawl_delay` | BJFEZ | `open` |
| `gfez_allow_all` | GFEZ | `open` |
| `dgfez_404` | DGFEZ | `no_file` |
| `jgfez_timeout` | JGFEZ | `undetermined / timeout` |
| `gsfez_blocked` | GSFEZ | `blocked_all` |
| `ggfez_html_body` | GGFEZ | `undetermined / malformed` |
| `truncated_group` | CBFEZ | `undetermined / parse_fail` |
| `b_form_unit` | UFEZ | 스캔 잡이 생성되지 않음 |

**픽스처를 실제 사이트에서 다시 받아오지 않는다.** 저장된 응답 본문을 고정 입력으로 쓴다. 사이트가 바뀌어도 테스트는 판정 로직만 검증해야 한다.

---

## 6. 한계

1. **단일 시점 1회 관측이다.** 일시적 장애와 상시 상태를 구분하지 못한다.
2. **9곳은 표본이 아니다.** 경제자유구역 전수이지만 자치단체 243곳을 대표하지 않는다. 이 결과로 전국을 말하지 않는다.
3. **AI 수집기별 개별 판정을 하지 않았다.** 어느 구역도 AI 수집기를 개별 명시하지 않았으므로 `*` 그룹만으로 판정했다. 자치단체 전수에서는 개별 명시 사례가 나올 수 있다.
4. **JSON-LD·sitemap·hreflang은 수집하지 못했다.** robots 판정에서 막힌 곳이 많아 후속 조회로 진행하지 못했다.

---

## 7. 다음에 할 것

- [ ] 자치단체 243곳 전수 1회 예비 스캔 — 판정 분포와 실패율 확인
- [ ] 2주 연속 관측으로 승격 규칙 실효성 검증
- [ ] AI 수집기 개별 명시 사례 수집 — `blocked_selective` 판정이 실제로 발생하는지
- [ ] A형 6곳 재조회 — 이 결과가 재현되는지
