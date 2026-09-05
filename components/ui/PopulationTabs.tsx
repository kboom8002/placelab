// components/ui/PopulationTabs.tsx
// AGENTS.md INV-1: 두 모집단을 합산하지 않는다 (local_gov vs special_zone)

import React from 'react';
import { Population } from '@/lib/types/layers';
import { Building2, ShieldAlert } from 'lucide-react';

interface PopulationTabsProps {
  current: Population;
  onChange: (population: Population) => void;
  localGovCount?: number;
  specialZoneCount?: number;
}

export const PopulationTabs: React.FC<PopulationTabsProps> = ({
  current,
  onChange,
  localGovCount = 243,
  specialZoneCount = 6,
}) => {
  return (
    <div className="flex border-b border-gray-200">
      <button
        type="button"
        onClick={() => onChange('local_gov')}
        className={`flex items-center gap-2 py-3 px-5 border-b-2 font-medium text-sm transition-colors ${
          current === 'local_gov'
            ? 'border-blue-600 text-blue-600 bg-blue-50/50'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <Building2 className="w-4 h-4" />
        <span>지방자치단체 전수</span>
        <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
          {localGovCount}곳
        </span>
      </button>

      <button
        type="button"
        onClick={() => onChange('special_zone')}
        className={`flex items-center gap-2 py-3 px-5 border-b-2 font-medium text-sm transition-colors ${
          current === 'special_zone'
            ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <ShieldAlert className="w-4 h-4" />
        <span>특별구역 (독립 도메인 A형)</span>
        <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800">
          {specialZoneCount}곳
        </span>
      </button>
    </div>
  );
};
