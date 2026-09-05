// components/dashboard/DashboardClient.tsx
'use client';

import React, { useState } from 'react';
import { Population, UnitWithVerdict } from '@/lib/types/layers';
import { PopulationTabs } from '@/components/ui/PopulationTabs';
import { FourWayVerdictSummary } from '@/components/ui/FourWayVerdictSummary';
import { UnitList } from '@/components/ui/UnitList';
import { calculateCoverage } from '@/lib/utils/coverage';

interface DashboardClientProps {
  initialLocalGovUnits: UnitWithVerdict[];
  initialSpecialZoneUnits: UnitWithVerdict[];
}

export const DashboardClient: React.FC<DashboardClientProps> = ({
  initialLocalGovUnits,
  initialSpecialZoneUnits,
}) => {
  const [population, setPopulation] = useState<Population>('local_gov');

  const currentUnits =
    population === 'local_gov' ? initialLocalGovUnits : initialSpecialZoneUnits;

  const stats = calculateCoverage(currentUnits, population);

  return (
    <div className="space-y-4">
      {/* 모집단 선택 탭 (INV-1 강제) */}
      <PopulationTabs
        current={population}
        onChange={setPopulation}
        localGovCount={243}
        specialZoneCount={6}
      />

      {/* 5분 판정 집계 요약 (INV-2 강제) */}
      <FourWayVerdictSummary
        open={stats.open}
        blockedAll={stats.blockedAll}
        blockedSelective={stats.blockedSelective}
        noFile={stats.noFile}
        undetermined={stats.undetermined}
        total={stats.total}
      />

      {/* 단위 목록 (INV-3 정렬 준수) */}
      <UnitList units={currentUnits} />
    </div>
  );
};
