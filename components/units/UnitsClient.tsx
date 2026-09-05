// components/units/UnitsClient.tsx
'use client';

import React, { useState } from 'react';
import { Population, UnitWithVerdict } from '@/lib/types/layers';
import { PopulationTabs } from '@/components/ui/PopulationTabs';
import { UnitList } from '@/components/ui/UnitList';

interface UnitsClientProps {
  initialLocalGovUnits: UnitWithVerdict[];
  initialSpecialZoneUnits: UnitWithVerdict[];
}

export const UnitsClient: React.FC<UnitsClientProps> = ({
  initialLocalGovUnits,
  initialSpecialZoneUnits,
}) => {
  const [population, setPopulation] = useState<Population>('local_gov');

  const currentUnits =
    population === 'local_gov' ? initialLocalGovUnits : initialSpecialZoneUnits;

  return (
    <div className="space-y-6">
      <PopulationTabs
        current={population}
        onChange={setPopulation}
      />

      <UnitList units={currentUnits} />
    </div>
  );
};
