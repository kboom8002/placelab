// lib/validators/sort-allowlist.ts
// AGENTS.md INV-3: 점수로 정렬하지 않는다 (허용 목록 방식)

export const UNIT_SORT_ALLOWLIST = ['sgg_code', 'name', 'population'] as const;
export type UnitSortField = (typeof UNIT_SORT_ALLOWLIST)[number];

export function parseSort(field: string | null | undefined): UnitSortField {
  if (!field) {
    return 'sgg_code'; // 기본 정렬: 행정구역 코드순
  }

  const normalized = field.trim().toLowerCase();
  if ((UNIT_SORT_ALLOWLIST as readonly string[]).includes(normalized)) {
    return normalized as UnitSortField;
  }

  throw new Error('정렬할 수 없는 필드입니다. 이 서비스는 순위를 제공하지 않습니다.');
}
