// components/ui/VerdictBadge.tsx
import React from 'react';
import { RobotsVerdict, UndeterminedReason } from '@/lib/types/layers';
import { CheckCircle2, XCircle, AlertTriangle, FileQuestion, HelpCircle } from 'lucide-react';

interface VerdictBadgeProps {
  verdict: RobotsVerdict | null | undefined;
  reason?: UndeterminedReason | null;
  size?: 'sm' | 'md' | 'lg';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({
  verdict,
  reason,
  size = 'md',
}) => {
  if (!verdict) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
        미측정
      </span>
    );
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  switch (verdict) {
    case 'open':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses[size]}`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          개방
        </span>
      );
    case 'blocked_all':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses[size]}`}
        >
          <XCircle className="w-4 h-4 text-rose-500" />
          전체 차단
        </span>
      );
    case 'blocked_selective':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses[size]}`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          선별 차단
        </span>
      );
    case 'no_file':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses[size]}`}
        >
          <FileQuestion className="w-4 h-4 text-slate-500" />
          파일 없음
        </span>
      );
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

      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses[size]}`}
        >
          <HelpCircle className="w-4 h-4 text-purple-500" />
          판정 불가 ({reasonLabel})
        </span>
      );
  }
};
