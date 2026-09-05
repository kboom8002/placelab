// lib/utils/coverage.ts
// AGENTS.md INV-1: 두 모집단을 합산하지 않는 집계 (순수 유틸 함수)
import { UnitWithVerdict, Population } from '@/lib/types/layers';

export function calculateCoverage(units: UnitWithVerdict[], population: Population) {
  const filtered = units.filter((u) => u.population === population);
  let open = 0;
  let blocked = 0;
  let noFile = 0;
  let undetermined = 0;

  for (const u of filtered) {
    if (u.robots_verdict === 'open') open++;
    else if (u.robots_verdict === 'blocked_all' || u.robots_verdict === 'blocked_selective') blocked++;
    else if (u.robots_verdict === 'no_file') noFile++;
    else if (u.robots_verdict === 'undetermined') undetermined++;
  }

  return {
    population,
    total: filtered.length,
    open,
    blocked,
    noFile,
    undetermined,
  };
}
