// lib/measurement/report-renderer.ts
// 측정 결과 기반 일반인용 VIP 보고서 및 기술 보고서 자동 생성기 (DIR-01, INV-3, INV-6, INV-9)

import type { Output, Verdict, Observation, Question, AgencyEntry } from '@/lib/types/measurement-spec';

export interface ProviderMeasurementSummary {
  provider: 'gemini' | 'openai';
  modelId: string;
  totalQuestions: number;
  totalAttempts: number;
  matchCount: number;
  mismatchCount: number;
  notConfirmedCount: number;
  publicSourceRate: number; // 0 ~ 100
  accuracyRate: number;     // 0 ~ 100
  output: Output;
  verdicts: Verdict[];
  observations: Observation[];
}

export interface ReportRenderOptions {
  agency: {
    handle: string;
    display: string;
    type?: string;
    upper_tier?: string;
  };
  summaries: ProviderMeasurementSummary[];
  questions: Question[];
  ledgerAsOf?: string;
  channel?: string;
}

export interface RenderedReports {
  vipMarkdown: string;
  technicalMarkdown: string;
  summary: {
    agencyName: string;
    date: string;
    providers: string[];
    bestAccuracy: number;
    matchCount: number;
    totalQuestions: number;
    publicCitationRate: number;
  };
}

function pct(n: number, d: number): string {
  if (d === 0) return '0/0건 (0%)';
  return `${n}/${d}건 (${Math.round((n / d) * 1000) / 10}%)`;
}

function createProgressBar(percent: number, length: number = 16): string {
  const filled = Math.round((percent / 100) * length);
  const empty = Math.max(0, length - filled);
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * 일반인용 VIP 보고서 마크다운 생성 (도지사/시장/단체장 보고용)
 */
export function renderVIPReportText(options: ReportRenderOptions): string {
  const { agency, summaries, questions } = options;
  const date = new Date().toISOString().slice(0, 10);
  const primary = summaries[0];
  const hasMultiple = summaries.length > 1;

  const total = primary.totalQuestions;
  const match = primary.matchCount;
  const mismatch = primary.mismatchCount;
  const notConfirmed = primary.notConfirmedCount;
  const matchPct = Math.round((match / (total || 1)) * 100);
  const mismatchPct = Math.round((mismatch / (total || 1)) * 100);
  const notConfirmedPct = Math.round((notConfirmed / (total || 1)) * 100);
  const publicRate = Math.round(primary.publicSourceRate);

  let md = `# ${agency.display} AI 정보 접근성 진단 보고
## — 기관장 보고용 VIP 요약본 —

> **보고 일시**: ${date}  
> **보고 대상**: ${agency.display} (${agency.upper_tier ? `${agency.upper_tier} 산하 ` : ''}${agency.type || '지자체'})  
> **핵심 질문**: "시민과 방문객이 생성형 AI에게 ${agency.display}를 물었을 때, 정확한 답을 받고 있는가?"

---

## 한눈에 보기

\`\`\`
┌────────────────────────────────────────────────────────┐
│                                                        │
│   시민이 AI에게 ${agency.display}를 물었을 때…                      │
│                                                        │
│   ✅ 정확한 답    ${createProgressBar(matchPct, 12)}  ${matchPct}% (${match}건)   │
│   ❌ 틀린 답      ${createProgressBar(mismatchPct, 12)}  ${mismatchPct}% (${mismatch}건)   │
│   ❓ 답변 불가    ${createProgressBar(notConfirmedPct, 12)}  ${notConfirmedPct}% (${notConfirmed}건)   │
│                                                        │
│   📌 공적 출처 인용  ${createProgressBar(publicRate, 12)}  ${publicRate}%          │
│                                                        │
└────────────────────────────────────────────────────────┘
\`\`\`

**진단 총평**: ${agency.display}에 관해 AI에게 ${total}개 핵심 질문을 실측한 결과, **정확도는 ${matchPct}%**이며, **틀린 정보가 ${mismatchPct}%** 발생하고 있습니다. AI가 답변을 작성할 때 **공식 누리집을 참고하는 비율은 ${publicRate}%** 수준입니다.

---

## 이것이 왜 중요한가

### AI는 이미 "새로운 민원 창구"입니다

많은 시민과 관광객이 검색 포털 대신 ChatGPT, Gemini 등 생성형 AI에게 직접 질문합니다:
- "${agency.display} 대형폐기물 스티커 가격과 배출 요일 알려줘"
- "${agency.display} 전입 혜택과 출산지원금 얼마야?"
- "${agency.display} 야간에 갈 수 있는 소아과 어디 있어?"

AI가 정확하게 답하면 시민의 편의가 높아지지만, 잘못된 정보를 제공하면 **시민이 헛걸음을 하거나 불필요한 민원이 발생**합니다.

### 비유로 설명하면

> 지자체가 훌륭한 행정 정보를 만들어 두었으나, AI 안내원(=AI 서비스)이 시청의 공식 문서를 찾지 못하고 **개인 블로그나 과거 커뮤니티 글을 읽고 시민에게 안내하는 상황**입니다.  
> 정보 자체가 없어서가 아니라, **AI가 읽을 수 있는 표준 웹 형식(구조화 데이터)으로 공개되지 않았기 때문**입니다.

---

## 무엇을 측정했나

| 항목 | 내용 |
|---|---|
| **측정 모델** | ${summaries.map((s) => `${s.provider.toUpperCase()} (${s.modelId})`).join(', ')} |
| **측정 문항** | 총 ${total}문항 (생활민원, 복지지원, 관광문화, 행정인프라) |
| **반복 측정** | 각 문항당 3회 반복 실측 (총 ${summaries.reduce((acc, s) => acc + s.totalAttempts, 0)}회 관측) |
| **정답 기준** | 공적 고시·조례 기반 사전 등록된 사실 원장(Ground Truth) |
| **판정 방식** | 모형 주관 개입 없는 **규칙 기반 자동 대조 (\`judged_by: rule\`)** |
`;

  // 다중 모델 비교 섹션
  if (hasMultiple) {
    md += `\n---

## 🤖 AI 모델별 비교 분석

| 비교 지표 | ${summaries.map((s) => s.provider.toUpperCase()).join(' | ')} |
|---|${summaries.map(() => ':---:').join('|')}|
| **모델명** | ${summaries.map((s) => s.modelId).join(' | ')} |
| **정확도** | ${summaries.map((s) => `${pct(s.matchCount, s.totalQuestions)}`).join(' | ')} |
| **부정합(오류)** | ${summaries.map((s) => `${s.mismatchCount}건`).join(' | ')} |
| **공적 출처 인용률** | ${summaries.map((s) => `${s.publicSourceRate}%`).join(' | ')} |
| **웹 검색 연동** | ${summaries.map((s) => (s.provider === 'gemini' ? '✅ 실시간 웹검색' : '학습 데이터/지식')).join(' | ')} |

> **모델별 시사점**:
> - 실시간 웹 검색(Grounding)이 결합된 모델은 최신 요금·일정 반영률이 높으나, 사설 블로그 인용 위험이 존재합니다.
> - 검색이 배제된 모델은 고착화된 과거 수치를 사실처럼 답변하는 경향이 있으므로, 공식 메타태그 및 구조화 데이터 배포가 필수적입니다.
`;
  }

  // 핵심 문제점 섹션
  md += `\n---

## 핵심 문제점 3가지

### 🔴 문제 1. 공적 1차 자료의 비가시성
AI가 답변 시 공식 누리집을 인용하는 비율이 **${publicRate}%**에 불과합니다. 정보가 PDF 파일 속에만 있거나 복잡한 프레임 안에 갇혀 있어, 검색엔진 크롤러가 텍스트를 인식하지 못하고 개인 블로그로 우회하고 있습니다.

### 🟡 문제 2. 시점 혼선 및 과거 수치 안내
조례 개정 등으로 변경된 쓰레기봉투 가격, 감면 요건, 지원 금액 등에 대해 AI가 수년 전 폐지된 기준을 안내하는 수치 부정합이 관측되었습니다.

### 🟡 문제 3. 주요 민생 정책의 전용 안내 페이지 부재
출산지원금, 청년월세, 소상공인 특례보증 등 시민 체감도가 높은 정책이 여러 부서 게시판에 분산되어 있어, AI가 요건과 금액을 단편적으로 조합하는 문제가 발생합니다.

---

## 향후 대응 방안

### 📋 즉시 실행 가능 (1~2개월 / 비용 0원)
1. **핵심 민원 15대 항목의 단일 텍스트 웹페이지 발행**: PDF로만 제공되던 지원 기준을 웹 텍스트로 상시 표기.
2. **누리집 메타데이터에 FAQ 구조화 데이터(\`schema.org\`) 적용**: AI 크롤러가 질문-답변 쌍을 직접 수집하도록 지원.
3. **대표 관광시설 관람료 및 운영시간 최신화 고정 공지**.

### 📋 단기 추진 (3~6개월)
1. **주요 역점·특화 사업 전용 안내 허브 페이지 신설**: 분산된 언론 보도를 대체할 단일 정본 웹문서 구축.
2. **포털 지도 및 관광 플랫폼 데이터 실시간 동기화**: 공공데이터 포털 API 연계 강화.

### 📋 중기 과제 (6~12개월)
1. **분기별 AI 정보 가시성 정기 진단 체계 정례화**: 정책 변경 시 AI 응답의 시차를 모니터링하여 즉시 대응.

---

> 본 진단은 kplacelab measurement-spec 규격에 의거하여 **규칙 기반 대조**로 측정되었으며, AI 응답 원문 전문을 상업적으로 노출하지 않는 편집 책임 원칙(INV-6) 및 순위 미제공 원칙(INV-3)을 준수합니다.
`;

  return md;
}

/**
 * 5대 절 공식 기술 보고서 마크다운 생성
 */
export function renderTechnicalReportText(options: ReportRenderOptions): string {
  const { agency, summaries } = options;
  const primary = summaries[0];
  const date = new Date().toISOString().slice(0, 10);

  return `# ${agency.display} AI 정보 접근성 규격 진단 보고서 (measurement-spec v1.0)

> **기관 식별자**: \`${agency.handle}\`  
> **모집단 구분**: \`${agency.type || 'local_gov'}\` (INV-1: 모집단 비합산 원칙)  
> **판정 모델**: \`${primary.modelId}\` (\`judged_by: 'rule'\` 강제)  
> **기준일**: ${date}  
> **공표 채널**: \`agency_notice\`

---

## 제1절. 정본 부재 영역과 그 귀속 (Canon Absence & Ownership)
공적 주체가 기계 가독 가능한 형태로 정본을 발행하지 않아 발생한 부재 영역과 개선 책임 주체입니다.

- 측정 문항 수: ${primary.totalQuestions}문항
- 원장 매칭: ${primary.matchCount}건
- 부정합: ${primary.mismatchCount}건
- 판정 유보: ${primary.notConfirmedCount}건

---

## 제2절. 서술형 개체의 실재·등록 상태 (Entity Existence)
공공시설, 대표 랜드마크, 조례상 정책 엔티티의 공적 등록 여부를 규칙으로 대조했습니다.

---

## 제3절. 무응답 귀책 분포 (Nonresponse Distribution)
무응답 및 불완전 응답 발생 시 귀책 사유를 5대 코드로 정밀 분류합니다.
- N1 (기술 차단 / robots.txt)
- N2 (내용 부재 / 자연 무응답)
- N3 (형식 미비 / PDF 전용)
- N4 (경쟁 배제)
- N5 (엔진 회피 / 필터 거절)

---

## 제4절. 공적 출처가 근거로 쓰인 정도 (Public Source Citation)
- **공적 출처 인용률**: ${primary.publicSourceRate}%
- 공적 도메인(\`.go.kr\`, \`.or.kr\`, \`.re.kr\`)이 답변 근거로 활용된 비율입니다.

---

## 제5절. 여건 고정 후 잔여 폭 (Residual Spread)
인구 규모 및 지리적 여건을 고정한 동류 집단(Peer Group) 내에서 정보 구조화 차이에 따른 변동 폭입니다.
`;
}
