// components/ui/UnitList.tsx
// AGENTS.md INV-3: 점수로 정렬하지 않는다 (행정구역 코드순 기본)
// B형 단위 소관 도메인 병기 규정 준수

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { UnitWithVerdict, RobotsVerdict } from '@/lib/types/layers';
import { VerdictBadge } from './VerdictBadge';
import { Search, ExternalLink, ArrowUpRight, Filter } from 'lucide-react';
import { B_FORM_DISCLAIMER } from '@/lib/constants/measurement';

interface UnitListProps {
  units: UnitWithVerdict[];
}

export const UnitList: React.FC<UnitListProps> = ({ units }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVerdict, setSelectedVerdict] = useState<string>('all');

  const filtered = useMemo(() => {
    return units.filter((u) => {
      const matchText =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.host && u.host.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.sgg_code && u.sgg_code.includes(searchTerm));

      if (!matchText) return false;

      if (selectedVerdict === 'all') return true;
      if (selectedVerdict === 'open') return u.robots_verdict === 'open';
      if (selectedVerdict === 'blocked')
        return u.robots_verdict === 'blocked_all' || u.robots_verdict === 'blocked_selective';
      if (selectedVerdict === 'no_file') return u.robots_verdict === 'no_file';
      if (selectedVerdict === 'undetermined') return u.robots_verdict === 'undetermined';

      return true;
    });
  }, [units, searchTerm, selectedVerdict]);

  const filterOptions = [
    { key: 'all', label: '전체' },
    { key: 'open', label: '개방' },
    { key: 'blocked', label: '차단' },
    { key: 'no_file', label: '파일 없음' },
    { key: 'undetermined', label: '판정 불가' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-editorial">
      {/* 상단 컨트롤 바 */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* 검색 인풋 */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="지자체명, 도메인, 행정코드 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              지우기
            </button>
          )}
        </div>

        {/* 필터 탭 */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            상태:
          </span>
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSelectedVerdict(opt.key)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedVerdict === opt.key
                  ? 'bg-navy-950 text-white shadow-sm font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 헤더 메타정보 */}
      <div className="px-5 py-2.5 bg-slate-50/30 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>
          조회 결과: <strong className="text-navy-950 font-bold">{filtered.length}</strong>개 단위
        </span>
        <span className="text-slate-400">
          정렬 기준: 행정표준코드(법정동/기관코드) 오름차순 (INV-3 점수 정렬 금지)
        </span>
      </div>

      {/* 테이블 그리드 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200/60">
            <tr>
              <th className="py-3.5 px-5 w-28">행정코드</th>
              <th className="py-3.5 px-5">단위 명칭</th>
              <th className="py-3.5 px-5">공식 도메인</th>
              <th className="py-3.5 px-5">기술 접근성 판정</th>
              <th className="py-3.5 px-5 text-right w-24">기록</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                  조건에 일치하는 대상 단위를 찾을 수 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((unit) => (
                <tr
                  key={unit.unit_id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="py-3.5 px-5 font-mono text-xs text-slate-400">
                    {unit.sgg_code || unit.unit_id}
                  </td>
                  <td className="py-3.5 px-5 font-medium text-navy-950">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/units/${unit.unit_id}`}
                        className="font-bold text-navy-950 hover:text-navy-700 hover:underline"
                      >
                        {unit.name}
                      </Link>
                      {unit.is_depop_area && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded font-medium bg-amber-100/70 text-amber-900 border border-amber-200/50">
                          인구감소
                        </span>
                      )}
                    </div>
                    {unit.domain_form === 'B' && (
                      <div className="text-[11px] text-amber-700 font-normal mt-0.5">
                        ⚠️ {B_FORM_DISCLAIMER}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-xs font-mono text-slate-500">
                    {unit.host ? (
                      <a
                        href={`https://${unit.host}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-navy-950 hover:underline"
                      >
                        {unit.host}
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5">
                    <VerdictBadge
                      verdict={unit.robots_verdict}
                      reason={unit.undetermined_reason}
                      size="sm"
                    />
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <Link
                      href={`/units/${unit.unit_id}`}
                      className="inline-flex items-center gap-0.5 text-xs font-semibold text-navy-600 hover:text-gold-600 group-hover:translate-x-0.5 transition-all"
                    >
                      상세
                      <ArrowUpRight className="w-3 h-3" />
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
