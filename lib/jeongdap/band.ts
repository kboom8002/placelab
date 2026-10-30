// lib/jeongdap/band.ts
// 출처:
// - docs/adr/0017-two-public-metrics-no-composite.md, 0018, 0021, 0022
// - docs/IMPLEMENTATION-PLAN-jeongdap-note.md §5 R4·R5, §10 band.ts
// - AGENTS.md v2.0 INV-1, INV-3, INV-17

import {
  BAND_LABELS,
  DEFAULT_BAND_THRESHOLDS,
  NAMED_UNIT_PUBLICATION_EARLIEST_DATE,
} from './constants';
import { BandKey, BandLabel, BandMovement, BandUnitEntry } from './types';

export interface BandThresholds {
  highMinRate: number;
  midMinRate: number;
}

export function assignBand(
  officialSourceRate: number,
  thresholds: BandThresholds = DEFAULT_BAND_THRESHOLDS
): { band: BandKey; bandLabel: BandLabel } {
  if (officialSourceRate >= thresholds.highMinRate) {
    return { band: 'high', bandLabel: BAND_LABELS.high };
  }
  if (officialSourceRate >= thresholds.midMinRate) {
    return { band: 'mid', bandLabel: BAND_LABELS.mid };
  }
  return { band: 'low', bandLabel: BAND_LABELS.low };
}

export function computeBandMovement(prevBand: BandKey | null, nextBand: BandKey): BandMovement {
  if (!prevBand) return 'initial';
  const order: Record<BandKey, number> = { low: 0, mid: 1, high: 2 };
  if (order[nextBand] > order[prevBand]) return 'up';
  if (order[nextBand] < order[prevBand]) return 'down';
  return 'same';
}

/**
 * INV-1 & INV-3:
 * 1) 모집단('metro' | 'basic')을 반드시 인자로 받아 분리한다.
 * 2) 구간 내부 정렬은 오직 가나다순(ko localeCompare)만 허용하며, 점수·근거율 순 정렬은 금지한다.
 */
export function groupAndSortBandEntries(
  entries: readonly BandUnitEntry[],
  population: 'metro' | 'basic'
): Record<BandKey, BandUnitEntry[]> {
  if (!population) {
    throw new Error('구간 지도 집계 시 모집단(population) 인자는 필수입니다 (INV-1)');
  }
  const filtered = entries.filter((e) => e.population === population);
  const sortAlphabetical = (a: BandUnitEntry, b: BandUnitEntry) =>
    a.name.localeCompare(b.name, 'ko-KR');

  return {
    high: filtered.filter((e) => e.band === 'high').sort(sortAlphabetical),
    mid: filtered.filter((e) => e.band === 'mid').sort(sortAlphabetical),
    low: filtered.filter((e) => e.band === 'low').sort(sortAlphabetical),
  };
}

/**
 * INV-17: 2027-03-01 이전에는 이름 붙은 단위 수치를 공개하지 않는다.
 */
export function canPublishNamedUnitMetrics(asOfDateIso: string): boolean {
  return asOfDateIso >= NAMED_UNIT_PUBLICATION_EARLIEST_DATE;
}
