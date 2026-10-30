// app/(public)/regions/page.tsx
// FR-83 & INV-1 & INV-17: 내 지역 찾기 (광역 16 · 기초 227 분리 표시 및 2027-03 이전 「측정 전」 정직 표기)
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getUnitsByPopulation } from '@/lib/db/units';
import {
  PANEL_5_UNITS,
  POPULATION_COUNTS,
  UNMEASURED_REGION_NOTICE,
  PUBLICATION_STATE_LABELS,
} from '@/lib/jeongdap';
import { MapPin, ShieldCheck, Clock, ArrowRight, Info } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '내 지역 찾기 (광역 16 · 기초 227) — 모두의 정답노트',
  description:
    '전국 광역자치단체 16곳과 기초자치단체 227곳의 AI 공식 근거율·피해 위험 측정 현황 및 5곳 기준 패널 안내 (INV-1 · INV-17)',
};

export default async function RegionsPage() {
  const [localGovUnits, specialZoneUnits] = await Promise.all([
    getUnitsByPopulation('local_gov'),
    getUnitsByPopulation('special_zone'),
  ]);

  const metroUnits = localGovUnits.filter((u) => u.unit_type === 'metro');
  const basicUnits = localGovUnits.filter((u) => u.unit_type === 'basic');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* 헤더 */}
      <div className="space-y-4 border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
          <MapPin className="w-3.5 h-3.5 text-gold-400" />
          REGION DIRECTORY · 광역 {POPULATION_COUNTS.metro} · 기초 {POPULATION_COUNTS.basic_2026_07} 분리 조회 (INV-1)
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-navy-950 tracking-tight">
          내 지역 찾기
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          광역자치단체({POPULATION_COUNTS.metro}곳), 기초자치단체({POPULATION_COUNTS.basic_2026_07}곳 · 2026-07 인천 행정체제 개편 기준, 2025 원장 {POPULATION_COUNTS.basic_2025_gazetteer}곳),
          특별구역({specialZoneUnits.length}곳)은 법적 권한과 행정 소관이 달라 합산하지 않고 분리해 표시합니다.
        </p>
      </div>

      {/* INV-17 측정 전 정직 표기 안내 배너 */}
      <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-xs sm:text-sm flex items-start gap-3.5">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-blue-900">
            발행 상태 안내: {PUBLICATION_STATE_LABELS.before_measurement} / 1차 기준 패널 5곳 선행 측정 (INV-17)
          </div>
          <p className="text-blue-800 leading-relaxed">
            {UNMEASURED_REGION_NOTICE} 단, <strong>주간 상시 관측(월·수·금 270문항 + 화요일 지명 243문항)</strong>은 전국 전수 지자체를 대상으로 매주 실행됩니다.
          </p>
        </div>
      </div>

      {/* 1. 1차 정밀 측정 기준 단위 패널 (5곳) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gold-600">
              BASELINE PANEL · 550 QUESTIONS × 9 RUNS
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-navy-950">
              1차 정밀 측정 기준 단위 패널 (5곳)
            </h2>
          </div>
          <Link
            href="/prereg"
            className="text-xs font-bold text-navy-800 hover:text-gold-600 inline-flex items-center gap-1"
          >
            <span>사전 등록 명세(H1~H5) 보기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PANEL_5_UNITS.map((unit) => (
            <Link
              key={unit.site_id}
              href={`/regions/lg-${unit.sgg_code}`}
              className="p-5 rounded-2xl bg-white border-2 border-gold-400/70 hover:border-gold-500 shadow-sm space-y-3 flex flex-col justify-between transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{unit.site_id}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-sans font-bold">
                    패널 550문항
                  </span>
                </div>
                <h3 className="text-base font-black text-navy-950">{unit.name_ko}</h3>
                <p className="text-xs text-slate-500">{unit.stratum}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">공식 근거율(S3)</span>
                  <span className="font-mono font-semibold text-slate-700">1차 측정 중</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">피해 위험 건수</span>
                  <span className="font-mono font-semibold text-slate-700">판정 대기</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. 광역자치단체 16곳 (가나다/행정코드순) */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-navy-950">
            광역자치단체 ({metroUnits.length || POPULATION_COUNTS.metro}곳 · 별도 모집단)
          </h2>
          <span className="text-xs font-mono text-slate-500">행정구역 코드순 정렬 (INV-3)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {metroUnits.map((u) => (
            <Link
              key={u.unit_id}
              href={`/regions/${u.unit_id}`}
              className="p-3 rounded-xl bg-white border border-slate-200 hover:border-gold-400 transition-colors space-y-1"
            >
              <div className="text-xs font-bold text-navy-950 truncate">{u.name}</div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>측정 전 (2027-03)</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. 기초자치단체 (시·군·자치구) */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 className="text-lg sm:text-xl font-black text-navy-950">
            기초자치단체 ({basicUnits.length || POPULATION_COUNTS.basic_2026_07}곳 · 시·군·자치구)
          </h2>
          <span className="text-xs text-slate-500">
            2026-07 인천 행정체제 개편(제물포·영종·검단구) 반영 기준 227곳 · 2027-03 전수 코어 60문항 측정 예정
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {basicUnits.map((u) => {
            const isPanel = PANEL_5_UNITS.some((p) => u.name.includes(p.name_ko.split(' ')[1]));
            return (
              <Link
                key={u.unit_id}
                href={`/regions/${u.unit_id}`}
                className={`p-2.5 rounded-xl border transition-colors space-y-1 ${
                  isPanel
                    ? 'bg-amber-50/60 border-gold-400'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-navy-950 truncate">{u.name}</div>
                <div className="text-[10px] font-medium text-slate-500">
                  {isPanel ? '1차 패널 측정 중' : '측정 전 (2027-03)'}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. 특별구역 (경제자유구역 등 별도 모집단) */}
      <section className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>특별구역 별도 모집단 ({specialZoneUnits.length}곳 · INV-1 분리)</span>
          </div>
          <p className="text-xs text-slate-600">
            경제자유구역청 등 특별지방행정기관·조합은 일반 자치단체(광역·기초)와 합산하지 않고 별도 탭에서 제공합니다.
          </p>
        </div>
        <Link
          href="/units"
          className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-navy-950 hover:bg-slate-100 shrink-0"
        >
          단위 상세 목록 보기 →
        </Link>
      </section>
    </div>
  );
}
