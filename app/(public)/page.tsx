// app/(public)/page.tsx
// FR-2, FR-0.6: 전국 현황 대시보드 (Server Component / ISR)
import React from 'react';
import { getUnitsByPopulation } from '@/lib/db/units';
import { CURRENT_METHOD_VERSION } from '@/lib/constants/measurement';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import Link from 'next/link';
import { BookOpen, Send, Sparkles, AlertCircle } from 'lucide-react';

export const revalidate = 3600; // SDD 6.1 ISR: 1시간 주기 갱신

export default async function HomePage() {
  const [localGovUnits, specialZoneUnits] = await Promise.all([
    getUnitsByPopulation('local_gov'),
    getUnitsByPopulation('special_zone'),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>2026-09-05 기준 · 방법론 {CURRENT_METHOD_VERSION} 적용</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            지자체 AI 기술 접근성 실태
          </h1>

          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            전국 243개 지방자치단체와 특별구역 누리집이 생성형 AI 검색 로봇(KPlaceLabBot, GPTBot 등)에게
            열려 있는지 매주 전수 측정합니다. 본 플랫폼은 순위나 등급을 매기지 않으며, 두 모집단을 임의 합산하지 않습니다.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/selfcheck"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Send className="w-4 h-4" />
              직접 우리 동네 테스트하기
            </Link>
            <Link
              href="/method"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg backdrop-blur-sm transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              측정 방법론 전문 보기
            </Link>
          </div>
        </div>
      </section>

      {/* 핵심 가설 및 신뢰 원칙 공지 */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold">측정의 한계와 투명성 안내</div>
          <p className="text-amber-800 leading-relaxed">
            무엇이 막고 있는지는 이 측정으로 알 수 없습니다. 서버 보안장비(WAF), 웹서버 설정, CMS 등의 상세 원인은 기관 심층 진단을 통해서만 파악됩니다.
            또한, 지자체 전수(243곳)와 특별구역(A형 6곳)은 근거 법률과 성격이 달라 절대 합산하지 않고 분리하여 제공합니다.
          </p>
        </div>
      </div>

      {/* 클라이언트 인터랙티브 대시보드 */}
      <DashboardClient
        initialLocalGovUnits={localGovUnits}
        initialSpecialZoneUnits={specialZoneUnits}
      />
    </div>
  );
}
