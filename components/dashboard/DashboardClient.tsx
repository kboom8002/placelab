// components/dashboard/DashboardClient.tsx
'use client';

import React, { useState } from 'react';
import { Population, UnitWithVerdict } from '@/lib/types/layers';
import { PopulationTabs } from '@/components/ui/PopulationTabs';
import { FourWayVerdictSummary } from '@/components/ui/FourWayVerdictSummary';
import { UnitList } from '@/components/ui/UnitList';
import { DataCard } from '@/components/ui/DataCard';
import { VerdictDonut } from '@/components/charts/VerdictDonut';
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

  // INV-1: calculateCoverage는 반드시 population 인자를 받음
  const stats = calculateCoverage(currentUnits, population);

  const openRate = stats.total > 0 ? ((stats.open / stats.total) * 100).toFixed(1) : '0';
  const blockedTotal = stats.blockedAll + stats.blockedSelective;
  const blockedRate = stats.total > 0 ? ((blockedTotal / stats.total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* 1. 모집단 선택 탭 (AGENTS.md INV-1) */}
      <PopulationTabs
        current={population}
        onChange={setPopulation}
        localGovCount={243}
        specialZoneCount={6}
      />

      {/* 2. 핵심 지표 메트릭스 카드 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard
          label="AI 로봇 개방율"
          value={openRate}
          unit="%"
          subValue={`${stats.open}곳 개방`}
          description="KPlaceLabBot, GPTBot 등 AI 검색 크롤러 접근 허용"
          indicatorColor="emerald"
        />
        <DataCard
          label="차단 누리집 (전체/선별)"
          value={blockedTotal}
          unit="곳"
          subValue={`${blockedRate}%`}
          description={`전체 차단 ${stats.blockedAll}곳 · 선별 차단 ${stats.blockedSelective}곳`}
          indicatorColor="rose"
        />
        <DataCard
          label="robots.txt 파일 없음"
          value={stats.noFile}
          unit="곳"
          subValue={stats.total > 0 ? `${((stats.noFile / stats.total) * 100).toFixed(1)}%` : '0%'}
          description="크롤링 규약 파일 미배치 상태 (묵시적 허용 추정)"
          indicatorColor="slate"
        />
        <DataCard
          label="판정 불가 (응답장애)"
          value={stats.undetermined}
          unit="곳"
          subValue={stats.total > 0 ? `${((stats.undetermined / stats.total) * 100).toFixed(1)}%` : '0%'}
          description="타임아웃, DNS 실패 등 (절대 차단으로 분류하지 않음: INV-2)"
          indicatorColor="purple"
        />
      </div>

      {/* 3. 데이터 시각화 & 5분 판정 종합 요약 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 인터랙티브 도넛 차트 */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-editorial flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                판정 비율 분석
              </span>
              <span className="text-xs font-semibold text-navy-700 bg-navy-50 px-2.5 py-0.5 rounded-full">
                {population === 'local_gov' ? '자치단체 243' : '특별구역 6'}
              </span>
            </div>
            <VerdictDonut
              data={{
                open: stats.open,
                blocked: blockedTotal,
                noFile: stats.noFile,
                undetermined: stats.undetermined,
              }}
              size={200}
              className="py-2"
            />
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 leading-normal">
            * 2주 연속 동일 관측 결과일 때만 verdicts로 승격되어 확정 공표됩니다 (INV-8).
          </div>
        </div>

        {/* 5분 판정 종합 요약 패널 */}
        <div className="lg:col-span-7">
          <FourWayVerdictSummary
            open={stats.open}
            blockedAll={stats.blockedAll}
            blockedSelective={stats.blockedSelective}
            noFile={stats.noFile}
            undetermined={stats.undetermined}
            total={stats.total}
            className="h-full flex flex-col justify-between"
          />
        </div>
      </div>

      {/* 4. 단위 목록 (INV-3 정렬 준수) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-navy-950">
            {population === 'local_gov' ? '지방자치단체 전수 목록' : '특별구역 목록'}
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {currentUnits.length}개 대상 단위
          </span>
        </div>
        <UnitList units={currentUnits} />
      </div>
    </div>
  );
};
