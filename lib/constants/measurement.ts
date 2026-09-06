// lib/constants/measurement.ts
// 출처: K03 판정 기준, K07 공표 정책, AGENTS.md 문구 규칙

export const CURRENT_METHOD_VERSION = 'v1.0';

export const FORBIDDEN_WORDS = [
  '순위',
  '랭킹',
  '등급',
  '1위',
  '최하위',
  '베스트',
  '워스트',
  '노출 보장',
  '상위 노출',
  'AI 최적화 보장',
  '세계 최초',
  '세계 유일',
  '국내 유일',
  '독보적',
  '특허받은 방법론',
  '전국 평균',
  '차단당했다',
  '전국 249곳',
] as const;

export const B_FORM_DISCLAIMER =
  '이 값은 소관 시·도 도메인의 값입니다.' as const;

export const MEASUREMENT_LIMITATION_NOTE =
  '무엇이 막고 있는지는 이 측정으로 알 수 없습니다.' as const;

// K03 M-2 측정 상수 (source: docs/knowledge/K03-measurement-spec.md)
export const NAMED_QUESTION_COUNT = 12;
export const UNNAMED_QUESTION_COUNT = 8;
export const UNNAMED_SLOTS_PER_QUESTION = 5;
export const TOTAL_UNNAMED_SLOTS = 40;
export const MIN_REPEATS_LAYER2_UNNAMED = 3;
export const MIN_REPEATS_LAYER3 = 5;

// K03 M-1.4 JSON-LD 권장 타입
export const JSONLD_RECOMMENDED_TYPES = [
  'GovernmentOrganization',
  'GovernmentService',
  'Place',
  'Event',
  'FAQPage',
  'NewsArticle',
  'OpeningHoursSpecification',
  'ContactPoint',
] as const;

// K16 §3.3 보고 규칙 (source: docs/knowledge/K16-audience-equity.md)
export const AUDIENCE_COMPARISON_RULES = {
  NO_RANKING: true,
  NO_UNIT_NAMING: true,
  FLOOR_RISK_REQUIRED: true,
  PREREG_REQUIRED: true,
} as const;

// v2.0 측정 상수 (source: ADR-0011, K04 v2.0)
export const V2_METHOD_VERSION = 'v2.0';
export const V2_DEFAULT_MODEL = 'gpt-5luna';
export const V2_QUESTION_COUNT = 35;
export const V2_QUICK_REPS = 1;
export const V2_FULL_REPS = 5;
export const V2_SERVICES = ['chatgpt', 'gemini', 'perplexity'] as const;

