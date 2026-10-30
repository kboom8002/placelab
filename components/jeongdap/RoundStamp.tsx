// components/jeongdap/RoundStamp.tsx
// §12 & INV-7 & INV-13: 회차·측정일·모델 판본·방법론·API 기준·위치 신호 없음 필수 표기 컴포넌트
import React from 'react';
import { RoundStampData } from '@/lib/jeongdap';
import { Clock, ShieldCheck } from 'lucide-react';

export interface RoundStampProps {
  stamp: RoundStampData;
}

export const RoundStamp: React.FC<RoundStampProps> = ({ stamp }) => {
  return (
    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1 font-bold text-navy-950">
          <Clock className="w-3.5 h-3.5 text-gold-600" />
          회차: {stamp.roundLabel}
        </span>
        <span>·</span>
        <span>측정일: {stamp.measuredDates}</span>
        <span>·</span>
        <span>방법론: {stamp.methodVersion}</span>
        <span>·</span>
        <span className="font-mono">모델: {stamp.modelVersion}</span>
        <span>·</span>
        <span className="font-mono">검색도구: {stamp.searchToolVersion}</span>
      </div>
      <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>
          {stamp.locationSignal === false
            ? `${stamp.observationBasis} · 시스템 프롬프트 없음 · 위치 신호 없음 (INV-13)`
            : '위치 신호 포함'}
        </span>
      </div>
    </div>
  );
};
