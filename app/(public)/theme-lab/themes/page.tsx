// app/(public)/theme-lab/themes/page.tsx
// Policy Theme Lab 정책 테마 목록 (FR-65)

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  ChevronRight,
  ArrowRight,
  Building2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { SEED_THEMES } from '@/lib/theme-lab/seed-data';

export const metadata = {
  title: '정책 테마 브리프 목록 | kplacelab 정책테마랩',
  description: '주민 질문과 AI 응답 분석에서 도출된 지자체별 핵심 정책 테마 브리프',
};

export default function ThemeLabThemesPage() {
  const suwonThemes = SEED_THEMES.filter((t) => t.unitId === 'lg-41110');
  const jeungpyeongThemes = SEED_THEMES.filter((t) => t.unitId === 'lg-43745');

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 헤더 */}
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Link href="/" className="hover:text-slate-800">kplacelab</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/theme-lab" className="hover:text-slate-800">정책테마랩</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="font-semibold text-navy-950">정책 테마 브리프</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-950 flex items-center gap-2">
            <FileText className="w-7 h-7 text-gold-500" />
            정책 테마 브리프 대장 (Policy Theme Briefs)
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
            질문 묶음과 AI 진단 실측의 오답·누락 패턴에서 발견된 실증 지자체의 8대 핵심 정책 테마입니다.
          </p>
        </div>

        {/* 수원특례시 테마 섹션 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-navy-100 text-navy-950 text-xs font-black">수원특례시</span>
              <span>생활행정 수치 왜곡 및 공식 도메인 인용 단절 대응</span>
            </h2>
            <span className="text-xs text-slate-500">4개 테마</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suwonThemes.map((t) => (
              <Link
                key={t.id}
                href={`/theme-lab/themes/${t.id}`}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-gold-400/70 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                      {t.themeCode}
                    </span>
                    <span className="text-[11px] font-medium text-emerald-600">
                      진단 질문 {t.nextDiagnosticQuestions.length}개
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-navy-950 group-hover:text-gold-600 transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {t.coreQuestion}
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px] truncate max-w-[200px]">
                    대상: {t.targetAudience}
                  </span>
                  <span className="text-gold-600 font-semibold flex items-center gap-1 shrink-0">
                    브리프 전문
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 증평군 테마 섹션 */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-gold-100 text-gold-950 text-xs font-black">증평군</span>
              <span>출산장려금 1/6 축소 왜곡 및 충북 추천 누락 극복</span>
            </h2>
            <span className="text-xs text-slate-500">4개 테마</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jeungpyeongThemes.map((t) => (
              <Link
                key={t.id}
                href={`/theme-lab/themes/${t.id}`}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-gold-400/70 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                      {t.themeCode}
                    </span>
                    <span className="text-[11px] font-medium text-emerald-600">
                      진단 질문 {t.nextDiagnosticQuestions.length}개
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-navy-950 group-hover:text-gold-600 transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {t.coreQuestion}
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px] truncate max-w-[200px]">
                    대상: {t.targetAudience}
                  </span>
                  <span className="text-gold-600 font-semibold flex items-center gap-1 shrink-0">
                    브리프 전문
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
