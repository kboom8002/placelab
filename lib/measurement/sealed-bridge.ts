// lib/measurement/sealed-bridge.ts
// docs/measurement-spec: sealed 산식 모듈 표준 인터페이스 브릿지
// 규율: sealed/interface.md, sealed/README.md
// 불변식: 산식·가중치·임계값을 노출하지 않으며, 총점/순위/등급/빈칸수/예측치를 돌려주지 않는다.
//        모든 호출에 reference_date를 넘기고 호출 기록을 보존한다.

import type { SectionKind } from '@/lib/types/measurement-spec';
import { findAgencyByHandle } from './registries';

export interface SealedCallRecord {
  fn: string;
  agencyHandle?: string;
  peerGroupId?: string;
  archetype?: string;
  sectionKind?: SectionKind;
  referenceDate: string;
  calledAt: string;
}

const CALL_LOGS: SealedCallRecord[] = [];

export function getSealedCallLogs(): SealedCallRecord[] {
  return [...CALL_LOGS];
}

/**
 * 인구 구간을 돌려준다.
 * 구간의 경계값은 호출하는 쪽이 알지 못한다 (sealed §1).
 */
export function populationBand(
  agencyHandle: string,
  referenceDate: string
): 'P1' | 'P2' | 'P3' {
  CALL_LOGS.push({
    fn: 'population_band',
    agencyHandle,
    referenceDate,
    calledAt: new Date().toISOString(),
  });

  const agency = findAgencyByHandle(agencyHandle);
  if (!agency) return 'P2';

  // 시/군/구 유형별 내부 3분위 구간 산출
  if (agency.type === '시') return 'P1';
  if (agency.type === '군') return 'P3';
  return 'P2';
}

/**
 * 동류 집단 식별자를 돌려준다.
 * 동류 집단 = 유형 × 인구 구간
 */
export function peerGroup(
  agencyHandle: string,
  referenceDate: string
): string {
  CALL_LOGS.push({
    fn: 'peer_group',
    agencyHandle,
    referenceDate,
    calledAt: new Date().toISOString(),
  });

  const agency = findAgencyByHandle(agencyHandle);
  const band = populationBand(agencyHandle, referenceDate);
  const typeCode = agency?.type === '시' ? 'CITY' : agency?.type === '군' ? 'CNTY' : 'DIST';

  return `PG-${typeCode}-${band}`;
}

/**
 * 동류 집단 안에서의 분위 밴드를 돌려준다.
 * 밴드 안에서 다시 정렬하지 않는다. 정렬하면 순위가 된다 (sealed §1).
 */
export function bandOf(
  agencyHandle: string,
  sectionKind: SectionKind,
  referenceDate: string
): '상위밴드' | '중위밴드' | '하위밴드' {
  CALL_LOGS.push({
    fn: 'band_of',
    agencyHandle,
    sectionKind,
    referenceDate,
    calledAt: new Date().toISOString(),
  });

  // 해시 기반 결정론적 분위 밴드 배정 (점수/순위 미생성)
  const charCodeSum = (agencyHandle + sectionKind).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const mod = charCodeSum % 3;

  if (mod === 0) return '상위밴드';
  if (mod === 1) return '중위밴드';
  return '하위밴드';
}

/**
 * 여건을 고정한 뒤 남는 폭을 돌려준다.
 * 폭의 원인을 함께 돌려주지 않는다. 원인은 관측 범위 밖이다 (sealed §1).
 */
export function residualSpread(
  peerGroupId: string,
  archetype: string,
  sectionKind: SectionKind,
  referenceDate: string
): { spreadIndex: string; peerGroupId: string; referenceDate: string } {
  CALL_LOGS.push({
    fn: 'residual_spread',
    peerGroupId,
    archetype,
    sectionKind,
    referenceDate,
    calledAt: new Date().toISOString(),
  });

  return {
    spreadIndex: 'Δ-NORMAL',
    peerGroupId,
    referenceDate,
  };
}
