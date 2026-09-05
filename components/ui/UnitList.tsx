// components/ui/UnitList.tsx
// AGENTS.md INV-3: 점수로 정렬하지 않는다 (행정구역 코드순 기본)
// B형 단위 소관 도메인 병기 규정 준수

import React, { useState } from 'react';
import Link from 'next/link';
import { UnitWithVerdict } from '@/lib/types/layers';
import { VerdictBadge } from './VerdictBadge';
import { Search, ExternalLink } from 'lucide-react';
import { B_FORM_DISCLAIMER } from '@/lib/constants/measurement';

interface UnitListProps {
  units: UnitWithVerdict[];
}

export const UnitList: React.FC<UnitListProps> = ({ units }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = units.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.host && u.host.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* 검색 바 */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="지자체명 또는 도메인 검색 (예: 포천시, seoul.go.kr)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          정렬: 행정구역 코드순 (순위·랭킹 없음)
        </div>
      </div>

      {/* 목록 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-100 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
            <tr>
              <th className="py-3 px-4">행정코드</th>
              <th className="py-3 px-4">단위 명칭</th>
              <th className="py-3 px-4">도메인</th>
              <th className="py-3 px-4">기술 접근성 판정</th>
              <th className="py-3 px-4 text-right">상세보기</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((unit) => (
                <tr key={unit.unit_id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-gray-400">
                    {unit.sgg_code || unit.unit_id}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    <Link
                      href={`/units/${unit.unit_id}`}
                      className="hover:text-blue-600 hover:underline"
                    >
                      {unit.name}
                    </Link>
                    {unit.is_depop_area && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-orange-100 text-orange-800 font-normal">
                        인구감소지역
                      </span>
                    )}
                    {unit.domain_form === 'B' && (
                      <div className="text-[11px] text-amber-600 font-normal mt-0.5">
                        ⚠️ {B_FORM_DISCLAIMER}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-gray-500">
                    {unit.host ? (
                      <a
                        href={`https://${unit.host}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-blue-600"
                      >
                        {unit.host}
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <VerdictBadge
                      verdict={unit.robots_verdict}
                      reason={unit.undetermined_reason}
                      size="sm"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/units/${unit.unit_id}`}
                      className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      결과 보기 →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
