// app/(public)/units/page.tsx
// FR-1: 단위 목록 페이지 (Server Component / ISR)
import React from 'react';
import { getUnitsByPopulation } from '@/lib/db/units';
import { UnitsClient } from '@/components/units/UnitsClient';

export const revalidate = 3600; // 1시간 주기 ISR

export default async function UnitsPage() {
  const [localGovUnits, specialZoneUnits] = await Promise.all([
    getUnitsByPopulation('local_gov'),
    getUnitsByPopulation('special_zone'),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fade-in-up">
      <div className="space-y-2 border-b border-slate-200/80 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
          UNIT DIRECTORY · K02 TAXONOMY
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
          측정 대상 단위 마스터 목록
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          전국 243개 지방자치단체와 특별구역(경제자유구역청) 공식 도메인의 최신 AI 로봇 접근성 판정 현황입니다.
          점수나 순위로 정렬하지 않으며, 행정표준코드(법정동 코드) 순서대로 정렬됩니다 (INV-3).
        </p>
      </div>

      <UnitsClient
        initialLocalGovUnits={localGovUnits}
        initialSpecialZoneUnits={specialZoneUnits}
      />
    </div>
  );
}
