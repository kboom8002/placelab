// lib/maps/core/constants.ts
// MAPS 스튜디오 상수 및 임계값 정의
// 근거: ADR-0026, ADR-0027, docs/maps-concept-repo-v1.0.md
// 주의: AGENTS.md §4 금칙어('등급' 등)를 일절 사용하지 않고 '수준'·'분류'로 표기한다.

import type {
  MapsBiasLens,
  MapsDiagnosisStage,
  MapsGapType,
  MapsPrescriptionCode,
  MapsVerdict6Way,
} from './types';

export const MAPS_METHOD_VERSION = 'maps-v1.0.0';

/**
 * MAPS-INV-06 필수 비보증 고지문 (모든 상품 카드·견적·계약·리포트 하단 의무 표기)
 */
export const MAPS_NON_GUARANTEE_DISCLAIMER =
  '본 서비스는 제3자 AI 서비스의 답변 변경이나 특정 위치·순서 채택을 보증하지 않습니다. 과금 및 인도의 범위는 귀사 공식 정본 대장 구축, 기계 가독 구조화 배포, 그리고 통제된 조건에서의 전후 재측정 기록까지입니다.';

/**
 * 개체 해소(Entity Resolution) 이중 임계값 (MAPS §5.1)
 */
export const ENTITY_RESOLUTION_THRESHOLDS = {
  /** 최소 절대 유사도 임계값 τ */
  TAU_MIN_SCORE: 0.72,
  /** 1순위 후보와 2순위 후보 간 최소 격차 δ */
  DELTA_MIN_MARGIN: 0.15,
} as const;

/**
 * Krippendorff's α 판정자 간 일치도 게이트 임계값 (MAPS-INV-14)
 */
export const KRIPPENDORFF_THRESHOLDS = {
  /** 0.667 미만: 판정 지침 재작성 및 재교육 전까지 발행 차단 */
  MIN_TENTATIVE: 0.667,
  /** 0.800 이상: 확정 판정 채택 가능 */
  MIN_CONFIRMED: 0.8,
} as const;

/**
 * 카나리아 지문 드리프트(모델 업데이트 의심) 임계값 (MAPS-INV-12)
 */
export const CANARY_DRIFT_THRESHOLD = 0.25;

/**
 * 하한선 위반(Limit Violation) 피해 위험 임계값
 */
export const HARM_LIMIT_VIOLATION_THRESHOLD = 4.0;

/**
 * 6분류 판정 시각 인코딩 (MAPS-INV-16: 색각 이상 접근성을 위해 색상 + 기호 + 한국어 라벨 동시 표기)
 */
export const MAPS_VERDICT_META: Record<
  MapsVerdict6Way,
  {
    labelKo: string;
    symbol: string;
    badgeClass: string;
    descriptionKo: string;
  }
> = {
  correct: {
    labelKo: '정본 일치',
    symbol: '●',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    descriptionKo: '관측 시점 유효 정본과 값이 일치하며 공식·1차 출처가 인용됨',
  },
  outdated: {
    labelKo: '구버전 지연',
    symbol: '◷',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    descriptionKo: '관측 시점에는 만료된 과거 정본 버전의 값을 답함 (지연 일수 기록)',
  },
  confused: {
    labelKo: '타 대상 혼동',
    symbol: '⇄',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-300',
    descriptionKo: '동명이인·유사 기관 또는 다른 상품의 속성값을 섞어서 답함',
  },
  fabricated: {
    labelKo: '근거 없는 창작',
    symbol: '▲',
    badgeClass: 'bg-red-50 text-red-800 border-red-300',
    descriptionKo: '현재·과거 정본 및 인용 문서 어디에도 없는 수치나 사실을 만들어 냄',
  },
  asserted: {
    labelKo: '무인용 단언',
    symbol: '◇',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-300',
    descriptionKo: '값 자체는 정본과 같으나 공식·1차 출처 인용 없이 단언함 (정본 일치율 분자 제외)',
  },
  honest_unknown: {
    labelKo: '정직한 모름',
    symbol: '○',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    descriptionKo: '확인할 수 없거나 공식 안내를 직접 확인하라고 정직하게 유보함',
  },
};

/**
 * 6대 간극(G1~G6) 메타데이터
 */
export const MAPS_GAP_META: Record<
  MapsGapType,
  { code: string; labelKo: string; summaryKo: string }
> = {
  G1_presence: {
    code: 'G1',
    labelKo: '존재 간극',
    summaryKo: '질문 영역에서 대상이나 핵심 속성이 아예 언급되지 않거나 누락됨',
  },
  G2_fact: {
    code: 'G2',
    labelKo: '사실 간극',
    summaryKo: '요금·자격·연락처 등 핵심 사실이 정본과 다르게 왜곡·창작·혼동됨',
  },
  G3_time: {
    code: 'G3',
    labelKo: '시간 간극',
    summaryKo: '정본이 개정되었으나 AI가 이전 버전(구버전) 정보를 계속 답함',
  },
  G4_source: {
    code: 'G4',
    labelKo: '출처 간극',
    summaryKo: '공식 정본 URL 대신 오래된 블로그·2차 요약본을 근거로 삼거나 인용이 없음',
  },
  G5_context: {
    code: 'G5',
    labelKo: '맥락·비교 간극',
    summaryKo: '필수 적용 조건·예외 조항이 빠지거나 비교 질문에서 조건이 왜곡됨',
  },
  G6_engine: {
    code: 'G6',
    labelKo: '엔진 편차 간극',
    summaryKo: '동일 질문에 대해 AI 서비스별로 답변 정합성이나 인용 출처가 크게 갈림',
  },
};

/**
 * 6단계 원인 소거 진단 및 1:1 처방 매핑 (MAPS §7)
 */
export const MAPS_STAGE_PRESCRIPTION_META: Record<
  MapsDiagnosisStage,
  {
    stageOrder: number;
    stageLabelKo: string;
    questionKo: string;
    prescriptionCode: MapsPrescriptionCode;
    prescriptionTitleKo: string;
    defaultSteps: string[];
    defaultFeasibility: number;
    defaultCostEfficiency: number;
  }
> = {
  S1_existence: {
    stageOrder: 1,
    stageLabelKo: '1단계 · 공식 웹 정본 부재',
    questionKo: '공식 도메인에 해당 사실이 명시된 웹페이지가 존재하는가?',
    prescriptionCode: 'P1_publish_canonical',
    prescriptionTitleKo: '공식 팩트 페이지 신설 및 고유 URL 부여',
    defaultSteps: [
      '공식 도메인 하위에 해당 속성(요금·시간·자격)을 텍스트로 명시한 정본 페이지 발행',
      '정본 대장(Fact Ledger)에 공식 URL과 기준일(valid_from) 등록',
    ],
    defaultFeasibility: 0.92,
    defaultCostEfficiency: 0.85,
  },
  S2_crawl_access: {
    stageOrder: 2,
    stageLabelKo: '2단계 · 수집 접근성 차단',
    questionKo: 'robots.txt·방화벽·렌더링 제약 없이 수집기가 접근 가능한가?',
    prescriptionCode: 'P2_open_robots_sitemap',
    prescriptionTitleKo: 'robots.txt 개방 선언 및 Sitemap 정본 URL 등록',
    defaultSteps: [
      'robots.txt에서 주요 검색·AI 수집기 허용 여부 점검 및 Sitemap 경로 명시',
      '정본 페이지가 로그인·세션·자바스크립트 실행 없이 서버 응답(SSR/정적 HTML)으로 읽히는지 확인',
    ],
    defaultFeasibility: 0.9,
    defaultCostEfficiency: 0.9,
  },
  S3_indexing_discoverability: {
    stageOrder: 3,
    stageLabelKo: '3단계 · 검색 발견성 부족',
    questionKo: 'AI 웹 검색 도구의 후보 결과(1단)에 공식 페이지가 포착되는가?',
    prescriptionCode: 'P3_ia_deeplink_anchor',
    prescriptionTitleKo: '내부 링크·질문형 제목·고유 앵커 구조 개선',
    defaultSteps: [
      '메인·상위 안내 페이지에서 정본 상세 페이지로 직접 연결되는 텍스트 링크 추가',
      '소비자·민원인이 실제로 묻는 표현을 H1/H2 제목 및 메타 설명에 반영',
    ],
    defaultFeasibility: 0.82,
    defaultCostEfficiency: 0.8,
  },
  S4_parseability: {
    stageOrder: 4,
    stageLabelKo: '4단계 · 기계 가독성 저하 (이미지·PDF·복잡 표)',
    questionKo: '문서를 열었을 때 통이미지 포스터나 스캔 PDF가 아닌 구조화 텍스트인가?',
    prescriptionCode: 'P4_html_table_jsonld',
    prescriptionTitleKo: '시맨틱 HTML 표 변환 및 Schema.org JSON-LD 삽입',
    defaultSteps: [
      '통이미지 안내문·복잡한 병합 셀 표를 표준 HTML <table> 및 <dl> 목록으로 재작성',
      '페이지 헤드에 정본 대장과 동기화된 JSON-LD 구조화 데이터를 삽입',
    ],
    defaultFeasibility: 0.88,
    defaultCostEfficiency: 0.84,
  },
  S5_conflict_recency: {
    stageOrder: 5,
    stageLabelKo: '5단계 · 구버전 문서 경합·개정일 불명',
    questionKo: '웹상에 이전 연도 공지나 외부 블로그 요약본이 최신 정본보다 더 강하게 노출되는가?',
    prescriptionCode: 'P5_retire_old_date_pin',
    prescriptionTitleKo: '구버전 공지 만료 표기·리다이렉트 및 상단 기준일 고정',
    defaultSteps: [
      '과거 연도/구버전 안내 페이지 상단에 [개정 만료] 배너와 최신 정본 URL 링크(canonical) 삽입',
      '현행 정본 페이지 최상단에 "시행일(valid_from) 및 최종 확인일"을 명시',
    ],
    defaultFeasibility: 0.78,
    defaultCostEfficiency: 0.76,
  },
  S6_model_internal: {
    stageOrder: 6,
    stageLabelKo: '6단계 · 모델 내부 사전학습 잔상',
    questionKo: '1~5단계가 모두 정상이고 최신 문서를 읽었음에도 특정 모델이 오답을 고집하는가?',
    prescriptionCode: 'P6_official_objection_pack',
    prescriptionTitleKo: '오답 반박 Q&A 섹션 신설 및 플랫폼 피드백 증빙 제출',
    defaultSteps: [
      '공식 FAQ에 흔한 오해("구 요금 A원이 아니라 2026-10-01부터 B원입니다")를 명시적으로 대조 서술',
      'MAPS 증빙 패킷(관측 해시·정본 URL)을 첨부하여 해당 AI 서비스 공식 피드백 채널에 정정 요청 제출',
    ],
    defaultFeasibility: 0.55,
    defaultCostEfficiency: 0.65,
  },
};

export const MAPS_BIAS_LENS_META: Record<
  MapsBiasLens,
  { labelKo: string; descriptionKo: string }
> = {
  L1_channel: {
    labelKo: 'L1 채널 렌즈',
    descriptionKo: '웹 검색 증강(on) 조건과 사전학습 단독(off) 조건 간 정합성 차이',
  },
  L2_language: {
    labelKo: 'L2 언어 렌즈',
    descriptionKo: '한국어 질문과 영어·다국어 질문 간 사실 일치율 및 공식 인용 격차',
  },
  L3_query_frame: {
    labelKo: 'L3 질문 틀 렌즈',
    descriptionKo: '중립 질문 대비 잘못된 전제·비판적 전제 질문에서의 동조(아부) 오류율',
  },
  L4_engine: {
    labelKo: 'L4 엔진 렌즈',
    descriptionKo: '블라인드 처리된 측정 대상 AI 서비스(svc-A, svc-B 등) 간 편차',
  },
  L5_time_lag: {
    labelKo: 'L5 시간 지연 렌즈',
    descriptionKo: '정본 개정일(valid_from) 이후 AI 답변이 최신값으로 수렴하기까지 걸린 지연 일수',
  },
};
