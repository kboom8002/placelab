'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Download,
  Building2,
  Compass,
  Zap,
} from 'lucide-react';
import type { DiagnosticReportMeta } from '@/lib/reports/diagnostic-reports';

interface ReportsGalleryClientProps {
  reports: DiagnosticReportMeta[];
}

export const ReportsGalleryClient: React.FC<ReportsGalleryClientProps> = ({ reports }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: '전체 보기', count: reports.length },
    {
      id: 'industry_military',
      label: '국방·산업도시',
      count: reports.filter(r => r.category === 'industry_military').length,
    },
    {
      id: 'tourism_healing',
      label: '해양·생태·문화',
      count: reports.filter(r => r.category === 'tourism_healing').length,
    },
    {
      id: 'metropolitan_admin',
      label: '대도시·특례시',
      count: reports.filter(r => r.category === 'metropolitan_admin').length,
    },
    {
      id: 'strategy_playbook',
      label: '종합 전략·매뉴얼',
      count: reports.filter(r => r.category === 'strategy_playbook').length,
    },
  ];

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchCat = selectedCategory === 'all' || r.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.unitName.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q)) ||
        r.keyStrengths.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [reports, selectedCategory, searchQuery]);

  return (
    <div className="space-y-8">
      {/* 1. 컨트롤 패널 (검색 및 카테고리 탭) */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* 카테고리 탭 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map(c => {
            const active = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-navy-950 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                <span>{c.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    active ? 'bg-gold-500 text-navy-950 font-bold' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 검색 입력창 */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="지자체명, 키워드 검색 (예: 논산, 해양치유, 딸기)"
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 2. 카드 갤러리 그리드 */}
      {filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
          <p className="font-semibold text-base">검색 결과가 없습니다.</p>
          <p className="text-xs text-slate-400">다른 검색어나 카테고리를 선택해 보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReports.map(r => (
            <div
              key={r.slug}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group hover:border-gold-300/80"
            >
              {/* 카드 헤더 영역 */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy-900 px-2.5 py-0.5 rounded-md bg-slate-100">
                      {r.region}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{r.date}</span>
                  </div>
                  <span className="text-slate-500 text-[11px] font-medium bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                    {r.slots}슬롯 측정
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-navy-950 group-hover:text-gold-600 transition-colors leading-snug">
                    <Link href={`/reports/${r.slug}`}>{r.title}</Link>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                    {r.subtitle}
                  </p>
                </div>

                {/* 핵심 지표 배지 바 */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                  <div className="p-2.5 rounded-xl bg-slate-50/80 text-center">
                    <div className="text-[10px] text-slate-400 font-medium">비브랜드 SoV</div>
                    <div className="text-sm font-black text-navy-900 mt-0.5">{r.sovRate}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50/80 text-center">
                    <div className="text-[10px] text-slate-400 font-medium">출처 통제율</div>
                    <div
                      className={`text-sm font-black mt-0.5 ${
                        parseFloat(r.controllabilityRate) < 5
                          ? 'text-rose-600'
                          : parseFloat(r.controllabilityRate) > 15
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {r.controllabilityRate}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50/80 text-center">
                    <div className="text-[10px] text-slate-400 font-medium">검색 그라운딩</div>
                    <div className="text-sm font-black text-emerald-600 mt-0.5">{r.groundingRate}</div>
                  </div>
                </div>

                {/* 주요 강점 & AI 경고 */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-start gap-2 text-slate-700">
                    <span className="font-bold text-emerald-700 shrink-0">독점 자산:</span>
                    <span className="line-clamp-1">{r.keyStrengths}</span>
                  </div>
                  <div className="flex items-start gap-2 text-rose-900 bg-rose-50/70 p-2 rounded-lg border border-rose-100">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-1 font-medium">{r.negativeAlert}</span>
                  </div>
                </div>

                {/* 태그 목록 */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {r.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-normal"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 카드 액션 푸터 */}
              <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/reports/${r.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-950 hover:text-gold-600 transition-colors"
                >
                  <span>보고서 전문 열람</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center gap-3 text-xs">
                  {r.jsonPath && (
                    <a
                      href={`/api/reports/${r.slug}/download?format=json`}
                      download
                      className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors text-[11px]"
                      title="실측 원자료 JSON 다운로드"
                    >
                      <Download className="w-3 h-3" />
                      JSON
                    </a>
                  )}
                  <a
                    href={`/api/reports/${r.slug}/download?format=md`}
                    download
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors text-[11px]"
                    title="보고서 마크다운 파일 다운로드"
                  >
                    <Download className="w-3 h-3" />
                    MD
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
