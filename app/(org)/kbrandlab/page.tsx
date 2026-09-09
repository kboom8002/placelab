// app/(org)/kbrandlab/page.tsx
// K-Brand Lab 프로젝트 메인 대시보드 (PRD v3.0, §5.1)

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  FileCheck2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Globe2,
  Database,
  SearchCheck,
  Building2,
  Layers,
} from 'lucide-react';

export const metadata = {
  title: 'K-Brand Lab 프로젝트 대시보드 | kplacelab',
  description: '소비자 질문 기반 브랜드 연구, 정본 관리, AI 응답 측정 종합 플랫폼',
};

export default function KBrandLabDashboardPage() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* 상단 프로젝트 헤더 */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              K-Brand Lab v3.0 · 실증 파일럿
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              소비자 질문에서 발견하고,<br />
              정본으로 검증하며, AI 가시성을 측정합니다
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              K-Brand Lab은 브랜드의 단순 AI 노출량이 아니라, 소비자가 겪는 진짜 정보 공백·구매 장벽·품질 문제를 질문에서 발견하고,
              검증된 정본(Canonical)과 독립 소셜 판정을 통해 AI 검색 세계와 실제 구매 여정을 연결합니다.
            </p>

            {/* 프로젝트 메타 요약 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10 text-xs">
              <div>
                <span className="text-slate-400 block">대상 브랜드</span>
                <span className="text-white font-bold text-sm">클린보틀 (텀블러)</span>
              </div>
              <div>
                <span className="text-slate-400 block">목표 시장 / 언어</span>
                <span className="text-white font-bold text-sm">KR / 글로벌 (KO, EN)</span>
              </div>
              <div>
                <span className="text-slate-400 block">수집 질문 / 관찰</span>
                <span className="text-amber-300 font-bold text-sm">120건 / 480회</span>
              </div>
              <div>
                <span className="text-slate-400 block">예산 통제 (잔여)</span>
                <span className="text-emerald-400 font-bold text-sm">$84.50 / $100.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4대 핵심 워크플로우 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. 질문 지도 & 과제 */}
          <Link
            href="/kbrandlab/questions"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg group-hover:text-amber-600 transition-colors">
                1. 소비자 질문 지도
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                6단계 구매 여정별 실제 소비자 질문과 5대 브랜드 과제(정보공백·검증공백·구매장벽)를 분석·분류합니다.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>질문 120건 관리</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 2. 정본 & 주장 검증 */}
          <Link
            href="/kbrandlab/canonical"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg group-hover:text-amber-600 transition-colors">
                2. 정본 및 주장 관리
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                공식 스펙, 시험 성적서, 다국어 설명을 정본(Canonical)으로 묶고 독립 2인 검토와 연결합니다.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-purple-600">
              <span>주장 18건 검증</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 3. AI 측정 & 지표 */}
          <Link
            href="/kbrandlab/measurement"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <SearchCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg group-hover:text-amber-600 transition-colors">
                3. AI 실측 및 M-01~16
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                OpenAI 및 Gemini Search Grounding을 통해 브랜드 언급률, 추천 SoV, 출처 지배력을 정밀 측정합니다.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-amber-600">
              <span>최신 런 결과 보기</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 4. KRole 공개 뷰어 */}
          <Link
            href="/krole/cleanbottle-tumbler"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg group-hover:text-amber-600 transition-colors">
                4. KRole 소비자 공개
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                검증된 사실과 미확인 사항을 투명하게 공개하고 실제 예약·구매 링크와 연계된 소비자 페이지입니다.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-emerald-600">
              <span>소비자 화면 열람</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* 핵심 실측 지표 요약 바 (§8.6) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">최신 AI 응답 측정 핵심 지표 요약</h2>
              <p className="text-xs text-slate-500">2026-09-09 기준 · 20문항 × 2언어 × 2환경 × 3회 = 240 슬롯 관측</p>
            </div>
            <Link
              href="/kbrandlab/measurement"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              전체 16개 지표 보기 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <span className="text-xs text-slate-500 block">M-01 수집 완료율</span>
              <span className="text-xl font-black text-slate-900">100%</span>
              <span className="text-[10px] text-slate-400 block">(240/240)</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <span className="text-xs text-slate-500 block">M-04 브랜드 언급률</span>
              <span className="text-xl font-black text-blue-600">68.2%</span>
              <span className="text-[10px] text-slate-400 block">(150/220)</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <span className="text-xs text-slate-500 block">M-06 추천 점유율 (Open)</span>
              <span className="text-xl font-black text-amber-600">42.5%</span>
              <span className="text-[10px] text-slate-400 block">(경쟁군 대비)</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <span className="text-xs text-slate-500 block">M-13 확인 주장 정확도</span>
              <span className="text-xl font-black text-emerald-600">92.0%</span>
              <span className="text-[10px] text-slate-400 block">(맞음/평가대상)</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <span className="text-xs text-slate-500 block">M-16 글로벌 언어 격차</span>
              <span className="text-xl font-black text-purple-600">-24.5%p</span>
              <span className="text-[10px] text-slate-400 block">(KR 82% vs EN 57%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
