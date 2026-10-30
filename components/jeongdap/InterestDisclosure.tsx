// components/jeongdap/InterestDisclosure.tsx
// §12 & INV-17 & ADR-0021: 이해관계 공시(A원칙) 컴포넌트
import React from 'react';
import Link from 'next/link';
import { PRINCIPLE_A_DISCLOSURE } from '@/lib/jeongdap';
import { Scale } from 'lucide-react';

export interface InterestDisclosureProps {
  unitName?: string;
  hasPublicBidHistory?: boolean;
  bidSummary?: string;
}

export const InterestDisclosure: React.FC<InterestDisclosureProps> = ({
  unitName,
  hasPublicBidHistory = false,
  bidSummary,
}) => {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <Scale className="w-4 h-4 text-navy-800 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold text-navy-950">
            이해관계 공시 (A원칙 · D76)
            {unitName ? ` — ${unitName}` : ''}
          </div>
          <p className="leading-relaxed">{PRINCIPLE_A_DISCLOSURE}</p>
          {hasPublicBidHistory && bidSummary && (
            <p className="text-amber-800 font-semibold pt-1">
              • 공개경쟁 용역 이력 고지: {bidSummary}
            </p>
          )}
        </div>
      </div>
      <Link
        href="/disclosure"
        className="text-navy-900 font-bold underline hover:text-gold-600 shrink-0"
      >
        공시 전문 →
      </Link>
    </div>
  );
};
