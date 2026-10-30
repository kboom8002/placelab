// app/(public)/labs/tech-access/page.tsx
// ADR-0023: 구 Layer 1 기술 접근성(robots.txt 5분 판정) 보존 아카이브 대시보드
import React from 'react';
import type { Metadata } from 'next';
import { getUnitsByPopulation } from '@/lib/db/units';
import { CURRENT_METHOD_VERSION } from '@/lib/constants/measurement';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { SourceNote } from '@/components/ui/SourceNote';
import { Archive, AlertCircle } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '기술 접근성 아카이브 (구 Layer 1) — 모두의 정답노트 연구 랩',
  description:
    '2026-09 기준 전국 243개 지방자치단체 및 6개 특별구역 누리집의 robots.txt 5분 판정 보존 아카이브 (ADR-0023)',
};

export default async function TechAccessArchivePage() {
  const [localGovUnits, specialZoneUnits] = await Promise.all([
    getUnitsByPopulation('local_gov'),
    getUnitsByPopulation('special_zone'),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="space-y-4 border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-gold-300 text-xs font-semibold">
          <Archive className="w-3.5 h-3.5" />
          HISTORICAL ARCHIVE · 구 Layer 1 기술 접근성 보존본 (ADR-0023)
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-navy-950 tracking-tight">
          전국 지자체 · 특별구역 기술 접근성(robots.txt) 아카이브
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          본 화면은 2026년 9월 수행된 전국 243개 지방자치단체 및 6개 특별구역 공식 도메인의 <code>robots.txt</code> 5분 판정(개방 · 전체 차단 · 선별 차단 · 파일 없음 · 판정 불가) 기록을 연구 재현용으로 보존한 아카이브입니다.
        </p>
      </div>

      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm flex items-start gap-3.5">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-amber-900">
            주간 자동 스캔 동결 안내 (ADR-0023)
          </div>
          <p className="text-amber-800 leading-relaxed">
            모두의 정답노트 v1.0 전환에 따라 주간 <code>robots.txt</code> 자동 스캔 크론은 동결되었으며,
            현재 주력 측정은 실제 AI 응답의 출처 4단(S1~S4)과 공식 근거율을 직접 측정합니다.
          </p>
        </div>
      </div>

      <DashboardClient
        initialLocalGovUnits={localGovUnits}
        initialSpecialZoneUnits={specialZoneUnits}
      />

      <SourceNote
        date="2026-09-05"
        version={CURRENT_METHOD_VERSION}
        sourceText="구 Layer 1 기술 접근성 보존 아카이브 (tech_scans / verdicts 읽기 전용 보존 · ADR-0023)"
      />
    </div>
  );
}
