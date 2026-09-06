'use client';

import React, { useState } from 'react';

interface VerdictDonutProps {
  data: {
    open: number;
    blocked: number;
    noFile: number;
    undetermined: number;
  };
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const VerdictDonut: React.FC<VerdictDonutProps> = ({
  data,
  size = 220,
  strokeWidth = 28,
  className = '',
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const total = data.open + data.blocked + data.noFile + data.undetermined;
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        표시할 데이터가 없습니다
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const segments = [
    { key: 'open', label: '개방', value: data.open, color: '#059669', bgClass: 'bg-emerald-500' },
    { key: 'blocked', label: '차단', value: data.blocked, color: '#e11d48', bgClass: 'bg-rose-600' },
    { key: 'noFile', label: '파일 없음', value: data.noFile, color: '#64748b', bgClass: 'bg-slate-500' },
    { key: 'undetermined', label: '판정 불가', value: data.undetermined, color: '#9333ea', bgClass: 'bg-purple-600' },
  ];

  let accumulatedPercent = 0;

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-6 ${className}`}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* 배경 원 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />

          {/* 세그먼트들 */}
          {segments.map((seg) => {
            if (seg.value === 0) return null;
            const percent = seg.value / total;
            const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
            const strokeDashoffset = -circumference * accumulatedPercent;
            accumulatedPercent += percent;

            const isHovered = hoveredSegment === seg.key;

            return (
              <circle
                key={seg.key}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredSegment(seg.key)}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            );
          })}
        </svg>

        {/* 중앙 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {hoveredSegment
              ? segments.find((s) => s.key === hoveredSegment)?.label
              : '전체 모집단'}
          </span>
          <span className="text-2xl font-black text-navy-950 tracking-tight font-sans">
            {hoveredSegment
              ? segments.find((s) => s.key === hoveredSegment)?.value
              : total}
          </span>
          <span className="text-[10px] text-slate-400">
            {hoveredSegment
              ? `${Math.round(((segments.find((s) => s.key === hoveredSegment)?.value || 0) / total) * 100)}%`
              : '개소'}
          </span>
        </div>
      </div>

      {/* 범례 */}
      <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5 w-full max-w-xs text-xs">
        {segments.map((seg) => {
          const percent = total > 0 ? ((seg.value / total) * 100).toFixed(1) : '0';
          const isHovered = hoveredSegment === seg.key;

          return (
            <div
              key={seg.key}
              onMouseEnter={() => setHoveredSegment(seg.key)}
              onMouseLeave={() => setHoveredSegment(null)}
              className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                isHovered ? 'bg-slate-100/90 font-semibold' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="text-slate-700">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-navy-900">{seg.value}곳</span>
                <span className="text-[11px] text-slate-400 w-11 text-right">{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
