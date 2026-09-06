'use client';

import React, { useState } from 'react';

interface VerdictBarProps {
  data: {
    open: number;
    blocked: number;
    noFile: number;
    undetermined: number;
  };
  showLabels?: boolean;
  height?: number;
  className?: string;
}

export const VerdictBar: React.FC<VerdictBarProps> = ({
  data,
  showLabels = true,
  height = 14,
  className = '',
}) => {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const total = data.open + data.blocked + data.noFile + data.undetermined;
  if (total === 0) return null;

  const items = [
    { key: 'open', label: '개방', value: data.open, color: '#059669', bgClass: 'bg-emerald-500' },
    { key: 'blocked', label: '차단', value: data.blocked, color: '#e11d48', bgClass: 'bg-rose-600' },
    { key: 'noFile', label: '파일 없음', value: data.noFile, color: '#64748b', bgClass: 'bg-slate-500' },
    { key: 'undetermined', label: '판정 불가', value: data.undetermined, color: '#9333ea', bgClass: 'bg-purple-600' },
  ];

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* 인터랙티브 바 */}
      <div
        className="w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner relative"
        style={{ height }}
      >
        {items.map((item) => {
          if (item.value === 0) return null;
          const percent = (item.value / total) * 100;
          const isActive = activeKey === item.key;

          return (
            <div
              key={item.key}
              style={{
                width: `${percent}%`,
                backgroundColor: item.color,
                opacity: activeKey && !isActive ? 0.45 : 1,
              }}
              className="h-full transition-all duration-200 cursor-pointer first:rounded-l-full last:rounded-r-full"
              onMouseEnter={() => setActiveKey(item.key)}
              onMouseLeave={() => setActiveKey(null)}
              title={`${item.label}: ${item.value}곳 (${percent.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* 서브 라벨들 */}
      {showLabels && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pt-1">
          {items.map((item) => {
            const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
            const isActive = activeKey === item.key;

            return (
              <div
                key={item.key}
                onMouseEnter={() => setActiveKey(item.key)}
                onMouseLeave={() => setActiveKey(null)}
                className={`inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive ? 'font-bold text-navy-950 scale-105' : 'text-slate-600'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
                <span className="font-semibold text-navy-900">{item.value}</span>
                <span className="text-[11px] text-slate-400">({percent}%)</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
