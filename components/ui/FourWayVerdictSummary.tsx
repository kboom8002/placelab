// components/ui/FourWayVerdictSummary.tsx
// AGENTS.md INV-2: 판정은 5분이며, "판정 불가"를 뭉뚱그리지 않는다.
// 공개 집계 문장은 다섯 값을 모두 낸다: 개방 N · 전체 차단 N · 선별 차단 N · 파일 없음 N · 판정 불가 N

import React from 'react';
import { VerdictBar } from '@/components/charts/VerdictBar';

interface FourWayVerdictSummaryProps {
  open: number;
  blockedAll: number;
  blockedSelective: number;
  noFile: number;
  undetermined: number;
  total?: number;
  className?: string;
}

export const FourWayVerdictSummary: React.FC<FourWayVerdictSummaryProps> = ({
  open,
  blockedAll,
  blockedSelective,
  noFile,
  undetermined,
  total,
  className = '',
}) => {
  const calculatedTotal = total ?? open + blockedAll + blockedSelective + noFile + undetermined;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-6 shadow-editorial space-y-5 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            전수 기술 판정 현황
          </span>
          <h3 className="text-lg font-bold text-navy-950">기술 접근성 종합 판정</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            총 <strong className="text-navy-950 font-bold">{calculatedTotal}</strong>개 단위
          </span>
        </div>
      </div>

      {/* AGENTS.md INV-2 불변식 준수 표준 텍스트 (모든 수치 병기) */}
      <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          공표 표준 집계식 (INV-2)
        </div>
        <div className="text-sm font-semibold text-slate-800 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            개방 <strong className="font-bold text-emerald-900">{open}</strong>
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200/60 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            전체 차단 <strong className="font-bold text-rose-900">{blockedAll}</strong>
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1 text-orange-800 bg-orange-50 border border-orange-200/60 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            선별 차단 <strong className="font-bold text-orange-950">{blockedSelective}</strong>
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            파일 없음 <strong className="font-bold text-slate-900">{noFile}</strong>
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1 text-purple-800 bg-purple-50 border border-purple-200/60 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            판정 불가 <strong className="font-bold text-purple-950">{undetermined}</strong>
          </span>
        </div>
      </div>

      {/* 인터랙티브 게이지 바 */}
      <VerdictBar
        data={{
          open,
          blocked: blockedAll + blockedSelective,
          noFile,
          undetermined,
        }}
        height={16}
        showLabels={true}
      />
    </div>
  );
};
