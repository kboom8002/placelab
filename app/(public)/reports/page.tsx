// app/(public)/reports/page.tsx
// K-Place Lab 지자체 AI 가시성 심화 진단 보고서 허브 (Layer 2 Reports Gallery)

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Database,
  Search,
  BookOpen,
} from 'lucide-react';
import { DIAGNOSTIC_REPORTS } from '@/lib/reports/diagnostic-reports';
import { ReportsGalleryClient } from '@/components/reports/ReportsGalleryClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '심화 진단 보고서 (Layer 2) — kplacelab',
  description:
    '논산시, 완도군, 여수시, 광양시, 목포시, 수원시, 화성시 등 주요 지자체의 생성형 AI 가시성, 음성 점유율(SoV), 공식 출처 통제율 심화 진단 보고서 라이브러리.',
};

export default function ReportsIndexPage() {
  const totalSlots = DIAGNOSTIC_REPORTS.reduce((acc, r) => acc + r.slots, 0);

  return (
    <div className="space-y-12 pb-16">
      {/* 1. 에디토리얼 히어로 섹션 */}
      <section className="relative bg-navy-950 text-white overflow-hidden border-b border-white/10 pt-16 pb-20 sm:pt-20 sm:pb-24">
        {/* 배경 광원 효과 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-navy-800/40 via-gold-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-gold-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>Layer 2 AI 가시성 심화 진단 아카이브</span>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
              지자체 AI 가시성
              <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-amber-200">
                심화 진단 보고서
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
              생성형 AI 검색 엔진(AEO/GEO)이 우리 지자체를 어떻게 추천하고 있으며,
              정보의 근거는 시청 공식 사이트인가 사설 블로그인가?
              실측 데이터에 기반한 도시별 종합 진단서와 원자료를 투명하게 공개합니다.
            </p>
          </div>

          {/* 3대 핵심 지표 요약 바 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10 max-w-3xl">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-400 font-medium">진단 지자체 및 전략</span>
              <span className="text-xl sm:text-2xl font-black text-gold-300 font-mono">
                {DIAGNOSTIC_REPORTS.length}건
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-400 font-medium">누적 실측 슬롯</span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono">
                {totalSlots.toLocaleString()}+
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-400 font-medium">평균 검색 그라운딩</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                100.0%
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-400 font-medium">인용 출처 분석</span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono">
                6,000+건
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 본문 컨테이너 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* 필수 면책 배너 (INV-11 & INV-3) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-xs sm:text-sm flex items-start gap-3.5 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <div className="font-bold text-amber-900 flex items-center gap-2">
              <span>보고서 해석 및 투명성 원칙</span>
              <span className="text-[11px] font-normal text-amber-700 font-mono">
                AGENTS.md INV-3, INV-4, INV-11
              </span>
            </div>
            <p className="text-amber-800 leading-relaxed text-xs sm:text-sm">
              본 진단 보고서의 모든 수치는 <strong>탐색적 측정 · 사전 등록 전 파일럿</strong> 관측치이며,
              특정 지자체를 서열화하거나 순위를 매기지 않습니다. 각 지자체의 측정 조건과 질문 세트는
              고유의 산업·관광 환경에 맞추어 설계되었으므로 단순 점수 비교가 불가하며,
              표본 분모는 <strong>&quot;참여한 각 지자체 실측 슬롯&quot;</strong>에 한정됩니다.
            </p>
          </div>
        </div>

        {/* 3. 리포트 갤러리 인터랙티브 컴포넌트 */}
        <ReportsGalleryClient reports={DIAGNOSTIC_REPORTS} />

        {/* 4. 지자체 실무 지원 섹션 */}
        <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <h3 className="text-xl font-black tracking-tight text-white">
              우리 지자체도 AI 가시성 심화 측정이 필요하신가요?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              K-Place Lab은 지자체 고유의 산업, 관광, 복지 팩트를 구조화하여 45~50개 맞춤형 프로브를 설계하고,
              사설 블로그에 종속된 디지털 정보주권을 회복하는 3단계 실천 로드맵을 제공합니다.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/reports/playbook-2026-09"
              className="px-5 py-3 rounded-xl bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold text-xs sm:text-sm transition-all shadow-md"
            >
              실전 매뉴얼 보기
            </Link>
            <Link
              href="/method"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm transition-all border border-white/10"
            >
              측정 방법론
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
