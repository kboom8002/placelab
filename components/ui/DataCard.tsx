import React from 'react';

interface DataCardProps {
  label: string;
  value: number | string;
  unit?: string;
  subValue?: string;
  description?: string;
  indicatorColor?: 'emerald' | 'rose' | 'orange' | 'slate' | 'purple' | 'gold' | 'navy';
  href?: string;
  className?: string;
}

const colorMap = {
  emerald: {
    dot: 'bg-emerald-500',
    border: 'hover:border-emerald-300',
    bg: 'bg-emerald-50/50',
    text: 'text-emerald-700',
  },
  rose: {
    dot: 'bg-rose-500',
    border: 'hover:border-rose-300',
    bg: 'bg-rose-50/50',
    text: 'text-rose-700',
  },
  orange: {
    dot: 'bg-orange-500',
    border: 'hover:border-orange-300',
    bg: 'bg-orange-50/50',
    text: 'text-orange-700',
  },
  slate: {
    dot: 'bg-slate-400',
    border: 'hover:border-slate-300',
    bg: 'bg-slate-50/50',
    text: 'text-slate-700',
  },
  purple: {
    dot: 'bg-purple-500',
    border: 'hover:border-purple-300',
    bg: 'bg-purple-50/50',
    text: 'text-purple-700',
  },
  gold: {
    dot: 'bg-gold-500',
    border: 'hover:border-gold-300',
    bg: 'bg-gold-50/50',
    text: 'text-gold-800',
  },
  navy: {
    dot: 'bg-navy-600',
    border: 'hover:border-navy-300',
    bg: 'bg-navy-50/50',
    text: 'text-navy-900',
  },
};

export const DataCard: React.FC<DataCardProps> = ({
  label,
  value,
  unit,
  subValue,
  description,
  indicatorColor = 'navy',
  className = '',
}) => {
  const styles = colorMap[indicatorColor];

  return (
    <div
      className={`relative bg-white rounded-xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group ${styles.border} ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-500 tracking-tight flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
            {label}
          </span>
          {subValue && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.bg} ${styles.text}`}>
              {subValue}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight font-sans">
            {value}
          </span>
          {unit && <span className="text-sm font-semibold text-slate-500">{unit}</span>}
        </div>
      </div>

      {description && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
          {description}
        </div>
      )}
    </div>
  );
};
