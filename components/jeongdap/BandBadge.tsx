// components/jeongdap/BandBadge.tsx
// §12 & ADR-0017: 3구간 배지 (정본 이름 + 도형 + 경계값 + 구간 이동 화살표)
import React from 'react';
import { BAND_META, BandKey, BandMovement } from '@/lib/jeongdap';

export interface BandBadgeProps {
  band: BandKey;
  movement?: BandMovement;
  movementReason?: string;
}

const BAND_STYLES: Record<BandKey, string> = {
  high: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  mid: 'bg-amber-50 text-amber-900 border-amber-300',
  low: 'bg-rose-50 text-rose-900 border-rose-300',
};

const MOVEMENT_ARROWS: Record<BandMovement, { arrow: string; label: string }> = {
  up: { arrow: '↑', label: '구간 상승' },
  same: { arrow: '→', label: '구간 유지' },
  down: { arrow: '↓', label: '구간 하락' },
  initial: { arrow: 'NEW', label: '첫 배정' },
};

export const BandBadge: React.FC<BandBadgeProps> = ({
  band,
  movement = 'same',
  movementReason,
}) => {
  const meta = BAND_META[band];
  const move = MOVEMENT_ARROWS[movement];

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${BAND_STYLES[band]}`}
      >
        <span aria-hidden="true">{meta.shape}</span>
        <span>{meta.label_ko}</span>
        <span className="font-mono text-[11px] opacity-80" title={move.label}>
          {move.arrow}
        </span>
      </span>
      {movementReason && (
        <span className="text-[11px] text-slate-500">{movementReason}</span>
      )}
    </div>
  );
};
