// app/(public)/crew/page.tsx
// Phase 2 (10/24): 시민 확인단 작업대 안내 및 판정 대기열 연결 (/crew)
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CITIZEN_VERIFIER_POLICY,
  H3_AUTO_HUMAN_KAPPA_MIN,
  H5_CREW_OPS_AGREEMENT_MIN,
  H5_MIN_CREW_COUNT,
} from '@/lib/jeongdap';
import { JudgmentBadge } from '@/components/jeongdap/JudgmentBadge';
import { UserCheck, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: '시민 확인단 작업대 (/crew) — 모두의 정답노트',
  description:
    '모두의 정답노트 시민 확인단 교육·연습 5문항, 2인 독립 판정 규칙, 위약 10% 혼합 및 이해충돌 배제 작업대',
};

export default function CrewWorkbenchPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="space-y-4 border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
          <UserCheck className="w-3.5 h-3.5 text-gold-400" />
          CITIZEN VERIFIER WORKBENCH · 시민 확인단 작업대 (FR-85)
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-navy-950 tracking-tight">
          시민 확인단 판정 작업대
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          기계 1차 판정이 「다름 후보」·「보류」로 분류한 문항 전수와 「맞음 후보」 표본을 지자체 공식 문서 URL과 직접 대조합니다.
        </p>
      </div>

      {/* 판정 범주 표준 배지 안내 */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
        <h2 className="text-base font-black text-navy-950">
          표준 판정 배지 (색상 + 기호 + 한글 3중 인코딩)
        </h2>
        <div className="flex flex-wrap gap-2">
          <JudgmentBadge kind="s1_search" />
          <JudgmentBadge kind="s2_cited" />
          <JudgmentBadge kind="s3_first_official" />
          <JudgmentBadge kind="s4_match" />
          <JudgmentBadge kind="s4_partial" />
          <JudgmentBadge kind="s4_mismatch" />
          <JudgmentBadge kind="supply_gap" />
          <JudgmentBadge kind="not_applicable" />
          <JudgmentBadge kind="unstable" />
        </div>
      </section>

      {/* 작업 규칙 4원칙 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-navy-950 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            1. 교육·연습 5건 통과 후 실전 배정
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            모든 확인단원(만 {CITIZEN_VERIFIER_POLICY.min_age}세 이상 성인)은 정답이 알려진 연습 5문항을 먼저 채점하여 기준을 숙지한 뒤 실전 큐를 배정받습니다.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-navy-950 text-sm">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            2. 2인 독립 배정 및 위약 10% 블라인드 혼합
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            각 문항은 서로 다른 확인단원 2명에게 독립 배정되며(목표 일치도 κ ≥ {H3_AUTO_HUMAN_KAPPA_MIN}, 운영팀 합의 일치율 ≥ {H5_CREW_OPS_AGREEMENT_MIN}), 주의력 점검용 위약 문항 10%가 무작위로 섞여 있습니다.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-navy-950 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            3. 거주·소속 지자체 자동 배제 (이해충돌 방지)
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            본인이 거주하거나 재직 중인 시·군·구의 문항은 작업 큐에서 자동으로 제외됩니다.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-navy-950 text-sm">
            <UserCheck className="w-4 h-4 text-purple-600" />
            4. H5 정족수 게이트 ({H5_MIN_CREW_COUNT}명 이상)
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            사전 등록 중단 규칙에 따라 활동 확인단이 {H5_MIN_CREW_COUNT}명 미만일 경우 H5(시민 확인단-운영팀 일치율) 가설 판정을 보류합니다.
          </p>
        </div>
      </section>

      <div className="p-6 rounded-2xl bg-navy-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-black">판정 작업대(Adjudication Queue) 열기</div>
          <p className="text-xs text-slate-300">
            승인된 확인단원 및 검수자는 판정 작업대에서 대기 문항을 대조·판정할 수 있습니다.
          </p>
        </div>
        <Link
          href="/reviewer/adjudication"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gold-500 text-navy-950 text-xs font-black hover:bg-gold-400 shrink-0"
        >
          <span>판정 큐로 이동</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
