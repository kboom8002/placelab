// components/ui/VerdictBadge.tsx
import React from 'react';
import { RobotsVerdict, UndeterminedReason } from '@/lib/types/layers';

interface VerdictBadgeProps {
  verdict: RobotsVerdict | null | undefined;
  reason?: UndeterminedReason | null;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'dot' | 'minimal';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({
  verdict,
  reason,
  size = 'md',
  variant = 'badge',
}) => {
  if (!verdict) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        미측정
      </span>
    );
  }

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-xs sm:text-sm px-3 py-1',
    lg: 'text-sm sm:text-base px-3.5 py-1.5',
  };

  const getVerdictConfig = () => {
    switch (verdict) {
      case 'open':
        return {
          label: '개방',
          dot: 'bg-emerald-500',
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200/80',
        };
      case 'blocked_all':
        return {
          label: '전체 차단',
          dot: 'bg-rose-500',
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-200/80',
        };
      case 'blocked_selective':
        return {
          label: '선별 차단',
          dot: 'bg-amber-500',
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-200/80',
        };
      case 'no_file':
        return {
          label: '파일 없음',
          dot: 'bg-slate-400',
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          border: 'border-slate-200/80',
        };
      case 'undetermined':
        const reasonLabel =
          reason === 'timeout'
            ? '타임아웃'
            : reason === 'malformed'
            ? '비정상 응답'
            : reason === 'parse_fail'
            ? '파싱 실패'
            : reason === 'dns_fail'
            ? 'DNS 실패'
            : reason === 'shared_domain'
            ? '도메인 공유'
            : '사유 미상';
        return {
          label: `판정 불가 (${reasonLabel})`,
          dot: 'bg-purple-500',
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200/80',
        };
    }
  };

  const config = getVerdictConfig();

  if (variant === 'dot') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  }

  if (variant === 'minimal') {
    return (
      <span className={`font-semibold text-xs ${config.text}`}>
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border transition-all ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
