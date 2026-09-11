// app/(public)/page.tsx
// FR-2, FR-0.6: 전국 현황 대시보드 (Server Component / ISR)
import React from 'react';
import { getUnitsByPopulation } from '@/lib/db/units';
import { CURRENT_METHOD_VERSION } from '@/lib/constants/measurement';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { SourceNote } from '@/components/ui/SourceNote';
import Link from 'next/link';
import { BookOpen, Send, Sparkles, AlertCircle, ArrowRight, ShieldCheck, FileText, ChevronRight } from 'lucide-react';
import { DIAGNOSTIC_REPORTS } from '@/lib/reports/diagnostic-reports';

export const revalidate = 3600; // SDD 6.1 ISR: 1시간 주기 갱신

export default async function HomePage() {
  const [localGovUnits, specialZoneUnits] = await Promise.all([
    getUnitsByPopulation('local_gov'),
    getUnitsByPopulation('special_zone'),
  ]);

  return (
    <div className="space-y-12 pb-16">
      {/* 1. 글로벌 SOTA 에디토리얼 히어로 섹션 */}
      <section className="relative bg-navy-950 text-white overflow-hidden border-b border-white/10 pt-16 pb-20 sm:pt-20 sm:pb-24">
        {/* 은은한 배경 광원 효과 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-navy-800/40 via-gold-500/5 to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* 상단 태그 */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-gold-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>2026-09-05 기준 · 방법론 {CURRENT_METHOD_VERSION} 적용 · 주간 전수 관측</span>
          </div>

          {/* 메인 타이틀 */}
          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
              지자체 AI 기술 접근성
              <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-amber-200">
                주간 독립 측정 현황
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
              전국 243개 지방자치단체와 특별구역 누리집이 생성형 AI 검색 로봇에게 열려 있는지 매주 독립 측정합니다.
              본 플랫폼은 순위나 등급을 매기지 않으며, 법률 근거가 다른 두 모집단을 임의 합산하지 않습니다.
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/selfcheck"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-navy-950 text-sm font-bold rounded-xl shadow-lg hover:shadow-gold-500/20 transition-all hover:scale-[1.02]"
            >
              <Send className="w-4 h-4" />
              우리 동네 AI 답변 셀프체크
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 text-gold-300 text-sm font-semibold rounded-xl border border-gold-400/30 backdrop-blur-sm transition-all"
            >
              <FileText className="w-4 h-4 text-gold-400" />
              지자체 AI 심화 진단 보고서 ({DIAGNOSTIC_REPORTS.length}건)
            </Link>
            <Link
              href="/method"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-xl border border-white/10 backdrop-blur-sm transition-all"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              측정 방법론 전문 보기
            </Link>
          </div>

          {/* 3대 핵심 신뢰 지표 요약 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-3xl">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>전수 조사</strong> · 243개 지자체 전수</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>INV-3 준수</strong> · 순위·등급 일체 배제</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>INV-11 준수</strong> · 사전 등록 연구 공표</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 대시보드 본문 컨테이너 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Layer 2 심화 진단 보고서 하이라이트 섹션 (INV-4: L1과 분리) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-navy-100 text-navy-900 text-xs font-bold mb-1">
                <FileText className="w-3.5 h-3.5 text-navy-700" />
                <span>Layer 2 AI 가시성 심화 진단 (실측 기반)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
                주요 지자체 AI 검색 영향력 심화 진단 보고서
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                생성형 AI 검색(ChatGPT, Perplexity 등)이 각 지자체를 추천하는 음성 점유율(SoV)과 공식 출처 통제율을 다차원 프로빙으로 실측한 종합 보고서입니다.
              </p>
            </div>
            <Link
              href="/reports"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-navy-950 hover:text-gold-600 transition-colors shrink-0 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
            >
              <span>{DIAGNOSTIC_REPORTS.length}건 전체 보기</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {DIAGNOSTIC_REPORTS.slice(0, 4).map((report) => (
              <Link
                key={report.slug}
                href={`/reports/${report.slug}`}
                className="group flex flex-col justify-between p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-gold-400 hover:shadow-lg transition-all space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="font-semibold text-slate-600">{report.region}</span>
                    <span>{report.date}</span>
                  </div>

                  <h3 className="text-base font-black text-navy-950 group-hover:text-gold-600 transition-colors leading-snug">
                    {report.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {report.keyStrengths}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">음성 점유율(SoV)</span>
                    <span className="font-mono font-bold text-navy-950">{report.sovRate}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">공식 출처 통제율</span>
                    <span className="font-mono font-bold text-navy-950">{report.controllabilityRate}</span>
                  </div>
                  <div className="flex items-center justify-end text-[11px] font-bold text-gold-600 group-hover:translate-x-0.5 transition-transform pt-1">
                    <span>보고서 및 원자료 열람</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 투명성 및 한계 안내 배너 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-xs sm:text-sm flex items-start gap-3.5 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <div className="font-bold text-amber-900 flex items-center gap-2">
              <span>측정의 한계와 투명성 원칙</span>
              <span className="text-[11px] font-normal text-amber-700 font-mono">AGENTS.md INV-1 & INV-2</span>
            </div>
            <p className="text-amber-800 leading-relaxed text-xs sm:text-sm">
              무엇이 막고 있는지는 이 1차 측정으로 알 수 없습니다. 보안장비(WAF), 웹서버 설정, CMS 등 상세 원인은 기관 심층 진단(Layer 4)의 영역입니다.
              또한 지방자치단체 전수(243곳)와 특별구역(독립 도메인 A형 6곳)은 근거 법률과 조직 성격이 달라 절대 합산하지 않고 독립하여 제공합니다.
            </p>
          </div>
        </div>

        {/* 전국 현황 헤더 (Layer 1) */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-1">
            <span>Layer 1 기술 접근성 전수 관측</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
            전국 243개 지자체 및 6개 특별구역 기술 접근성 현황
          </h2>
        </div>

        {/* 클라이언트 인터랙티브 대시보드 */}
        <DashboardClient
          initialLocalGovUnits={localGovUnits}
          initialSpecialZoneUnits={specialZoneUnits}
        />

        {/* 하단 학술 출처 표기 */}
        <SourceNote
          date="2026-09-05"
          version={CURRENT_METHOD_VERSION}
          sourceText="KPlaceLabBot 전국 누리집 주간 전수 스캔 및 행정안전부 주민등록 인구통계"
        />
      </div>
    </div>
  );
}
