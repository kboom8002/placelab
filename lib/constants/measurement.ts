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
] as const;

export const B_FORM_DISCLAIMER =
  '이 값은 소관 시·도 도메인의 값입니다.' as const;

export const MEASUREMENT_LIMITATION_NOTE =
  '무엇이 막고 있는지는 이 측정으로 알 수 없습니다.' as const;
