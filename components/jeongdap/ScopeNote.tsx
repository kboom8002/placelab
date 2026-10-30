// components/jeongdap/ScopeNote.tsx
// §12 & AGENTS.md §4 & INV-16: 재난·안전 제외 및 내부 원인 미확정 필수 표기 컴포넌트
import React from 'react';
import { Info } from 'lucide-react';

export const ScopeNote: React.FC = () => {
  return (
    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5 leading-relaxed">
      <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
      <div>
        <strong className="font-bold">측정 범위 및 원인 해석 안내 (AGENTS.md §4 · INV-16): </strong>
        무엇이 막고 있는지(또는 왜 틀렸는지의 AI 모델 내부 원인)는 이 외부 측정만으로 확정하지 않습니다.
        또한 <strong>재난·안전(대피소·응급의료·재난연락처) 문항은 주민 안전을 위해 공개 지표에서 제외</strong>하고 해당 기관에만 직접 전달합니다.
      </div>
    </div>
  );
};
