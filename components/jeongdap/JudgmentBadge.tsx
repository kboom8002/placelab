// components/jeongdap/JudgmentBadge.tsx
// §12: 출처 4단 범주 + 공급 공백 + 해당 없음 배지 (색 + 기호 + 글자 3중 인코딩)
import React from 'react';

export type JudgmentBadgeKind =
  | 's1_search'
  | 's2_cited'
  | 's3_first_official'
  | 's4_match'
  | 's4_partial'
  | 's4_mismatch'
  | 'supply_gap'
  | 'not_applicable'
  | 'unstable';

const BADGE_SPEC: Record<
  JudgmentBadgeKind,
  { symbol: string; label: string; className: string }
> = {
  s1_search: {
    symbol: '◎',
    label: '1단 검색에 뜸',
    className: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  s2_cited: {
    symbol: '◉',
    label: '2단 AI가 읽음',
    className: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  s3_first_official: {
    symbol: '●',
    label: '3단 첫 근거가 됨',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  },
  s4_match: {
    symbol: '✓',
    label: '4단 내용이 맞음',
    className: 'bg-emerald-100 text-emerald-900 border-emerald-400',
  },
  s4_partial: {
    symbol: '△',
    label: '4단 일부만 맞음',
    className: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  s4_mismatch: {
    symbol: '✕',
    label: '4단 내용이 다름',
    className: 'bg-rose-50 text-rose-800 border-rose-300',
  },
  supply_gap: {
    symbol: '□',
    label: '공급 공백 (분모 분리)',
    className: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  not_applicable: {
    symbol: '—',
    label: '해당 없음 (분모 제외)',
    className: 'bg-slate-50 text-slate-500 border-slate-200',
  },
  unstable: {
    symbol: '≈',
    label: '불안정 (판정 보류)',
    className: 'bg-orange-50 text-orange-800 border-orange-200',
  },
};

export interface JudgmentBadgeProps {
  kind: JudgmentBadgeKind;
  count?: number;
}

export const JudgmentBadge: React.FC<JudgmentBadgeProps> = ({ kind, count }) => {
  const spec = BADGE_SPEC[kind];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${spec.className}`}
    >
      <span aria-hidden="true" className="font-mono">
        {spec.symbol}
      </span>
      <span>{spec.label}</span>
      {typeof count === 'number' && (
        <span className="font-mono text-[11px] opacity-80">({count})</span>
      )}
    </span>
  );
};
