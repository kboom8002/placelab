import React from 'react';
import { CURRENT_METHOD_VERSION } from '@/lib/constants/measurement';
import { Info } from 'lucide-react';

interface SourceNoteProps {
  date?: string;
  version?: string;
  sourceText?: string;
  className?: string;
}

export const SourceNote: React.FC<SourceNoteProps> = ({
  date = '2026-09-05',
  version = CURRENT_METHOD_VERSION,
  sourceText = 'KPlaceLabBot 전수 기술 스캔 및 자치단체 공개 데이터',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-lg text-xs text-slate-500 ${className}`}
    >
      <div className="flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          <strong className="font-semibold text-slate-700">출처:</strong> {sourceText}
        </span>
      </div>

      <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
        <span>기준: {date}</span>
        <span className="text-slate-300">|</span>
        <span className="text-navy-700 font-medium">방법론 {version}</span>
      </div>
    </div>
  );
};
