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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">측정 대상 단위 목록</h1>
        <p className="text-sm text-gray-500 mt-1">
          전국 243개 자치단체 및 경제자유구역 도메인의 최신 AI 기술 접근성 판정 현황입니다.
        </p>
      </div>

      <UnitsClient
        initialLocalGovUnits={localGovUnits}
        initialSpecialZoneUnits={specialZoneUnits}
      />
    </div>
  );
}
