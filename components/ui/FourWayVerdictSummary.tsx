// components/ui/FourWayVerdictSummary.tsx
// AGENTS.md INV-2: 판정은 5분이며, "판정 불가"를 뭉뚱그리지 않는다.
// 공개 집계 문장은 다섯 값을 모두 낸다: 개방 N · 전체 차단 N · 선별 차단 N · 파일 없음 N · 판정 불가 N

import React from 'react';

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
  return (
    <div className={`flex flex-col gap-3 p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <span className="text-sm font-semibold text-gray-700">기술 접근성 종합 판정</span>
        {total !== undefined && (
          <span className="text-xs text-gray-500">
            총 <span className="font-semibold text-gray-800">{total}</span>개 대상
          </span>
        )}
      </div>

      {/* 불변식 준수 필수 문구: 개방 N · 전체 차단 N · 선별 차단 N · 파일 없음 N · 판정 불가 N */}
      <div className="text-base font-medium text-gray-800 flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          개방 <strong className="font-bold">{open}</strong>
        </span>
        <span className="text-gray-400">·</span>
        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md text-sm">
          <span className="w-2 h-2 rounded-full bg-rose-600"></span>
          전체 차단 <strong className="font-bold">{blockedAll}</strong>
        </span>
        <span className="text-gray-400">·</span>
        <span className="inline-flex items-center gap-1 text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md text-sm">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          선별 차단 <strong className="font-bold">{blockedSelective}</strong>
        </span>
        <span className="text-gray-400">·</span>
        <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-sm">
          <span className="w-2 h-2 rounded-full bg-slate-500"></span>
          파일 없음 <strong className="font-bold">{noFile}</strong>
        </span>
        <span className="text-gray-400">·</span>
        <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md text-sm">
          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          판정 불가 <strong className="font-bold">{undetermined}</strong>
        </span>
      </div>

      {/* 시각적 비율 게이지 바 */}
      {total && total > 0 ? (
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${(open / total) * 100}%` }}
            className="bg-emerald-500 h-full transition-all"
            title={`개방: ${open}`}
          />
          <div
            style={{ width: `${(blockedAll / total) * 100}%` }}
            className="bg-rose-600 h-full transition-all"
            title={`전체 차단: ${blockedAll}`}
          />
          <div
            style={{ width: `${(blockedSelective / total) * 100}%` }}
            className="bg-orange-500 h-full transition-all"
            title={`선별 차단: ${blockedSelective}`}
          />
          <div
            style={{ width: `${(noFile / total) * 100}%` }}
            className="bg-slate-400 h-full transition-all"
            title={`파일 없음: ${noFile}`}
          />
          <div
            style={{ width: `${(undetermined / total) * 100}%` }}
            className="bg-purple-500 h-full transition-all"
            title={`판정 불가: ${undetermined}`}
          />
        </div>
      ) : null}
    </div>
  );
};
