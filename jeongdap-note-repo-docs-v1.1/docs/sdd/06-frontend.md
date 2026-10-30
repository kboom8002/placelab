# SDD 06 — 프런트엔드 (Next.js App Router)

> 라이브러리 API(캐시·재검증·i18n)는 사용하는 Next.js 버전 문서로 확인하고 맞춘다. 이 문서는 **동작 요구**를 정의한다.

## 1. 라우트
```
app/
  [locale]/(public)/                 locale ∈ ko | en | ja | zh-hant | zh-hans (ko 기본, 쉬운 말은 ?easy=1 또는 설정)
    page.tsx                         P1 홈(국가)
    find/page.tsx                    P2 지역 찾기 (?q=)
    r/[...slug]/page.tsx             P3–P5 지역 페이지 (?tab=sum|set|ml|area|cases|kids|join|fix)
    q/[questionId]/page.tsx          P6 질문 상세 (모달 라우트 겸용)
    check/page.tsx                   P9 AI 답 확인
    done/page.tsx                    P10 신고 완료·정답 카드
    propose/page.tsx                 P11 질문 제안·투표
    cases/page.tsx                   P12 정정 사례
    report/[round]/page.tsx          P13 리포트
    method/page.tsx                  P14 방법
    join/page.tsx                    P15 참여하기
    visit/[...region]/page.tsx       P16 방문객 페이지 (locale ≠ ko)
    prereg/[round]/page.tsx          P17 사전 등록 공개
    data/page.tsx                    P18 데이터 내려받기
  crew/(app)/...                     C1–C9 (한국어)
  portal/[region]/...                G1–G12 (한국어)
  ops/...                            O1–O10 (한국어)
  api/check/route.ts                 POST
  api/revalidate/route.ts            POST (HMAC)
```

## 2. 렌더링·캐시
| 화면 | 방식 | 태그 |
| --- | --- | --- |
| 공개 지역·홈·리포트·방문객 | 정적 생성 + 태그 재검증 | `region:{code}`, `round:{id}`, `set:{id}`, `gloss:{region}` |
| AI 답 확인·제안 | 페이지는 정적, 동작은 클라이언트 + Route Handler/Server Action | — |
| crew·portal·ops | 동적 (세션) | — |
- 공개 페이지의 핵심 사실·결과는 **서버 HTML에 포함**(클라이언트 전용 렌더링 금지).
- 재검증 후 사이트맵 `lastmod` 갱신.

## 3. 화면 상태 규칙
| 상태 | 판단 | UI |
| --- | --- | --- |
| `not_measured` | 지역 세트·회차 없음 | 결과 자리에 “측정 예정” + 회차 일정, 질문 세트·참여는 정상 |
| `measuring` | 회차 진행 중 | “측정 중 (진행률)” |
| `embargo` | 발행 전 | 공개: “발표 준비 중” / 해당 지자체 포털: 결과 노출 |
| `published` | 발행됨 | 결과 + 메타 띠 |
| `corrected` | 정정됨 | 정정 공지 + 이전 값 링크 |
| `example` | 데모·스테이징 | 모든 수치에 “예시” 배지 (운영 금지, 빌드 플래그로 차단) |

측정 메타 띠(모든 지역 페이지): 회차·측정일, 질문 수, 정본 포괄도, “AI 정답 지표 = API 기반 대리 지표”, 실사용 화면 일치도, 판정 일치도 κ. 시범·측정 전에는 일치도 대신 “측정 후 공개”.

## 4. 컴포넌트 (components/domain)
| 컴포넌트 | 규칙 |
| --- | --- |
| `JudgmentBadge` | 색 + 기호(✓ ⟲ ✕ ⇄ ?) + 글자, 쉬운 말 전환, title에 정의 |
| `RiskBadge` | ! + “위험”, 판정 배지와 별개 |
| `SlotBadge` | A 공통 코어 · B 층별 기본 · C 지역 특화 · D 주민 제안 · E 통제 |
| `RateBar` | 값·95% 구간·▲개선 폭·분석 단위 수, 정렬 금지 |
| `MetaStrip` | §3 메타 띠 |
| `ReorgNotice` | 개편 안내 띠(유효 구간·승계 링크) |
| `QuestionRow` | 접힘/펼침, 하위 탭(결과·서비스별·언어별·답안지·정본 이력) |
| `AnswerCard` | 정답 카드: AI 답(취소선) → 확인된 정답(손글씨 장식 + 일반 글꼴 병기) |
| `SetTable` | 질문 세트 필터(칸·영역·위험·다국어), 정본 상태 배지 |
| `LangTable` | 언어 × 서비스·영역 표 |
| `CorrectionCard` | 분류·부서·기한·상태·재측정 |
| `CoBrandHeader` | 계약 지역만 |
| `EasyToggle` | 쉬운 말 모드 |

## 5. 다국어
- 공개·방문객 페이지 5개 locale, `<html lang>`: ko, en, ja, **zh-Hant**, **zh-Hans**.
- UI 문자열: `i18n/messages/{ko,en,ja,zh-hant,zh-hans}.json`. 도메인 데이터(질문·정본 문장·명칭)는 DB에서.
- hreflang: 각 공개 페이지에 5개 대체 + `x-default`(ko).
- 글꼴 대체: 한국어 Noto Sans KR, 일본어 Noto Sans JP, 번체 Noto Sans TC, 간체 Noto Sans SC (필요 언어만 로드).
- 방문객 페이지는 `registered` 상태의 문장만 렌더.

## 6. SEO·AI 가독성
- JSON-LD: 국가·광역·기초 = `AdministrativeArea`/`GovernmentOrganization`, 시설 = `Place`·`TouristAttraction`·`Library` 등, 행사 = `Event`, 복지 = `GovernmentService`. 값은 정본과 같아야 한다(빌드 테스트로 대조).
- 사이트맵: 언어별, `lastmod` = 정본·결과 게시 시각.
- 옛 이름 URL(개편 전 slug)은 새 지역으로 **영구 리다이렉트**.

## 7. 디자인 시스템
토큰·컴포넌트·카피는 `knowledge/design-system.md`, `knowledge/web-copy.md`. Tailwind 등 유틸리티를 쓰더라도 색은 토큰 변수로만.

## 8. 접근성
KWCAG 2.2 AA, 키보드 조작, 포커스 표시, 판정은 색에만 의존하지 않음, 차트에는 표 대안, 쉬운 말 모드 글자 19px.
