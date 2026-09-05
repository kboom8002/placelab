// src/lib/types/layers.ts
// SDD 6.2 및 ADR-0005: 레이어별 데이터를 타입 수준에서 분리 (INV-4)

declare const brand: unique symbol;

export type Population = 'local_gov' | 'special_zone';

export type RobotsVerdict =
  | 'open'
  | 'blocked_all'
  | 'blocked_selective'
  | 'no_file'
  | 'undetermined';

export type UndeterminedReason =
  | 'timeout'
  | 'malformed'
  | 'parse_fail'
  | 'shared_domain'
  | 'dns_fail'
  | 'other';

export type FloorRisk = 'low' | 'moderate' | 'high' | 'critical';

export type Accuracy = 'accurate' | 'partial' | 'inaccurate' | 'absent';

export type Layer1Stat = {
  [brand]: 'layer1';
  population: Population; // 필수 — 기본값 없음 (INV-1)
  denominator: number; // 전수
  open: number;
  blockedAll: number;
  blockedSelective: number;
  noFile: number;
  undetermined: number;
};

export type Layer2Stat = {
  [brand]: 'layer2';
  participatingUnits: number; // 분모는 '참여한 단위 수' (INV-4)
  observationCount: number;
  methodVersion: string;
};

export type UnitWithVerdict = {
  unit_id: string;
  name: string;
  name_en: string | null;
  population: Population;
  unit_type: string;
  domain_form: 'A' | 'B' | 'C';
  parent_unit_id: string | null;
  sgg_code: string | null;
  is_depop_area: boolean;
  domain_id: number | null;
  host: string | null;
  domain_role: string | null;
  robots_verdict: RobotsVerdict | null;
  undetermined_reason: UndeterminedReason | null;
  confirmed_at: string | null;
  consecutive_weeks: number | null;
  published: boolean | null;
};

// K16 대상군 태그 (source: docs/knowledge/K16-audience-equity.md)
export type AudienceTag =
  | 'general' | 'older' | 'disability' | 'child_care'
  | 'low_income' | 'migrant' | 'youth' | 'small_business';

export const AUDIENCE_TAG_LABELS: Record<AudienceTag, string> = {
  general: '일반',
  older: '고령',
  disability: '장애',
  child_care: '양육',
  low_income: '저소득',
  migrant: '이주민',
  youth: '청년',
  small_business: '소상공인',
};

// K16 비교 결과 타입 (INV-9: floor_risk 필수)
export interface AudienceComparison {
  tagA: AudienceTag;
  tagB: AudienceTag;
  nA: number;
  nB: number;
  metric: string;
  valueA: number;
  valueB: number;
  floorRiskA: FloorRisk;
  floorRiskB: FloorRisk;
  intervalLow: number | null;
  intervalHigh: number | null;
  preregId: string;
}
