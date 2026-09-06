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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80">
      <div className="flex flex-1 gap-1.5">
        <button
          type="button"
          onClick={() => onChange('local_gov')}
          className={`flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-2.5 py-3 px-5 rounded-xl font-bold text-sm transition-all duration-200 ${
            current === 'local_gov'
              ? 'bg-white text-navy-950 shadow-editorial border border-slate-200/60'
              : 'text-slate-600 hover:text-navy-900 hover:bg-white/50'
          }`}
        >
          <Building2 className={`w-4 h-4 ${current === 'local_gov' ? 'text-navy-700' : 'text-slate-400'}`} />
          <span>지방자치단체 전수</span>
          <span
            className={`ml-1 px-2.5 py-0.5 text-xs rounded-full font-semibold ${
              current === 'local_gov'
                ? 'bg-navy-900 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {localGovCount}곳
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChange('special_zone')}
          className={`flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-2.5 py-3 px-5 rounded-xl font-bold text-sm transition-all duration-200 ${
            current === 'special_zone'
              ? 'bg-white text-navy-950 shadow-editorial border border-slate-200/60'
              : 'text-slate-600 hover:text-navy-900 hover:bg-white/50'
          }`}
        >
          <ShieldAlert className={`w-4 h-4 ${current === 'special_zone' ? 'text-gold-600' : 'text-slate-400'}`} />
          <span>특별구역 (독립도메인 A형)</span>
          <span
            className={`ml-1 px-2.5 py-0.5 text-xs rounded-full font-semibold ${
              current === 'special_zone'
                ? 'bg-gold-500 text-navy-950'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {specialZoneCount}곳
          </span>
        </button>
      </div>

      <div className="hidden lg:flex items-center gap-2 pr-4 text-xs text-slate-500 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
        <span>INV-1: 두 모집단은 법률이 달라 절대 합산하지 않습니다</span>
      </div>
    </div>
  );
};
