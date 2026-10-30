// components/jeongdap/ExploratoryBanner.tsx
// §12 & INV-11: 사전 등록 외 탐색적 측정(지역 문화 트랙 1차·0단계 그림자 실행) 고지 배너
import React from 'react';
import { CULTURE_TRACK_DISCLAIMER } from '@/lib/jeongdap';
import { AlertTriangle } from 'lucide-react';

export interface ExploratoryBannerProps {
  title?: string;
  description?: string;
}

export const ExploratoryBanner: React.FC<ExploratoryBannerProps> = ({
  title = '탐색적 민간 공익 측정 안내 (INV-11)',
  description = CULTURE_TRACK_DISCLAIMER,
}) => {
  return (
    <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <div className="font-bold">{title}</div>
        <p className="text-xs text-amber-900 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};
