// lib/aeo/types/ground-truth.ts
// Ground Truth 데이터베이스 스키마
// 출처: K03 §M-2, K04 v2.1 §4.1
// 불변식: INV-7 (측정 조건 필수), INV-10 (강건성 검사)

/** GT 엔트리 값 유형 */
export type GTValueType = 'numeric' | 'name' | 'date' | 'url' | 'text' | 'procedure';

/** GT 갱신 주기 */
export type GTUpdateFrequency = 'annual' | 'quarterly' | 'monthly' | 'event' | 'unknown';

/** GT 상태 */
export type GTStatus = 'active' | 'expired' | 'unverified';

/** Ground Truth 엔트리 — 하나의 검증 가능한 사실 */
export interface GroundTruthEntry {
  id: string;                    // "GT-41110-B01-birth-amount"
  unitId: string;                // "lg-41110"
  questionId: string;            // "V1-B01-01" (T1-V 프로브 연결)
  category: string;              // "birth", "waste_bag", ...

  // 정답
  value: string;                 // "590원"
  valueType: GTValueType;
  acceptableVariants: string[];  // ["590", "오백구십"]

  // 출처
  sourceUrl: string;             // 확인한 공식 URL
  sourceOrg: string;             // "수원시청"
  verifiedAt: string;            // ISO date "2026-09-07"
  verifiedBy: 'human' | 'crawler';

  // 유효 기간
  validFrom: string;             // "2026-01-01"
  validUntil: string;            // "2026-12-31"
  updateFrequency: GTUpdateFrequency;

  // 상태
  status: GTStatus;
}

/** GT 데이터베이스 (단위별) */
export interface GroundTruthDatabase {
  unitId: string;
  unitName: string;
  entries: GroundTruthEntry[];
  lastUpdated: string;
}
