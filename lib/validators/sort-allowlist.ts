// lib/validators/sort-allowlist.ts
// AGENTS.md INV-3: 점수로 정렬하지 않는다 (허용 목록 방식)

export const UNIT_SORT_ALLOWLIST = ['sgg_code', 'name', 'population', 'created_at'] as const;
export type UnitSortField = (typeof UNIT_SORT_ALLOWLIST)[number];

export function validateSortField(field: string | null | undefined): UnitSortField {
  if (!field) {
    return 'sgg_code'; // 기본 정렬: 행정구역 코드순
  }

  const normalized = field.trim().toLowerCase();
  if ((UNIT_SORT_ALLOWLIST as readonly string[]).includes(normalized)) {
    return normalized as UnitSortField;
  }

  // 허용되지 않은 정렬 필드(예: 점수, 랭킹 등)는 기본값으로 대체하거나 거부
  return 'sgg_code';
}
