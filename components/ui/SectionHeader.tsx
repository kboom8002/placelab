import React from 'react';

interface SectionHeaderProps {
  category?: string;
  title: string;
  description?: string;
  badge?: string;
  align?: 'left' | 'center';
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  category,
  title,
  description,
  badge,
  align = 'left',
  className = '',
}) => {
  const isCenter = align === 'center';

  return (
    <div className={`space-y-2.5 ${isCenter ? 'text-center mx-auto max-w-3xl' : ''} ${className}`}>
      <div className={`flex items-center gap-2.5 ${isCenter ? 'justify-center' : ''}`}>
        {category && (
          <span className="text-xs font-bold uppercase tracking-wider text-gold-600 bg-gold-50 border border-gold-200/60 px-2.5 py-0.5 rounded-full">
            {category}
          </span>
        )}
        {badge && (
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-950 flex items-center gap-3">
        {title}
      </h2>

      {description && (
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          {description}
        </p>
      )}

      <div className={`w-12 h-0.5 bg-gold-500/80 rounded-full mt-3 ${isCenter ? 'mx-auto' : ''}`} />
    </div>
  );
};
