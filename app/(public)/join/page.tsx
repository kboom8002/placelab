// app/(public)/join/page.tsx
// FR-85 & FR-92 & INV-18: 함께하기 (AI 오답 신고판 · 다음 주 질문 제안 · 시민 확인단 안내 및 범위 제외 고지)
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CITIZEN_VERIFIER_POLICY, SCOPE_EXCLUSION_NOTICE } from '@/lib/jeongdap';
import { QuestionSuggestForm } from '@/components/jeongdap/QuestionSuggestForm';
import { Users, Send, Compass, UserCheck, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: '함께하기 (신고판 · 질문 제안 · 시민 확인단) — 모두의 정답노트',
  description:
    'AI 오답 신고판, 다음 주 질문 제안, 그리고 2% 표본을 검증하는 유급 시민 확인단 참여 안내 (FR-85 · INV-18)',
};

export default function JoinPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* 헤더 */}
      <div className="space-y-4 border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
          <Users className="w-3.5 h-3.5 text-gold-400" />
          CITIZEN PARTICIPATION & VERIFIER CREW · 함께하기 (FR-85)
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-navy-950 tracking-tight">
          시민과 함께 만드는 모두의 정답노트
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          AI가 우리 동네 민원·복지·문화 정보를 틀리게 답한 사례를 제보하거나, 다음 주에 물어볼 질문을 제안하고,
          공식 문서와 AI 답변을 대조하는 시민 확인단으로 참여할 수 있습니다.
        </p>
      </div>

      {/* 3대 참여 경로 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. AI 오답 신고판 */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-navy-950">1. AI 오답 신고판</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              ChatGPT 등 생성형 AI에 우리 지역 정보를 물었을 때 지원금 액수, 신청 자격, 연락처, 축제 날짜를 틀리게 답한 화면을 제보해 주세요.
              검수를 거쳐 재측정 대기열과 정본 대조에 반영됩니다.
            </p>
          </div>
          <Link
            href="/report"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-navy-950 text-white text-xs sm:text-sm font-bold hover:bg-navy-900 transition-colors"
          >
            <span>오답 사례 신고하기</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 2. 다음 주 질문 제안 */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-navy-950">2. 다음 주 질문 제안</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              주민이나 방문객이 실제로 궁금해하는 생활행정·복지·문화 질문을 제안해 주세요.
              개인정보 비식별 검수(<code>approved=true</code>)를 통과한 질문은 주간 상시 관측과 차기 문항 판 후보로 등록됩니다.
            </p>
          </div>
          <Link
            href="/theme-lab"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gold-500 text-navy-950 text-xs sm:text-sm font-black hover:bg-gold-400 transition-colors"
          >
            <span>질문 제안하기 (정책테마랩)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3. 시민 확인단 (유급 2% 표본 검수) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-navy-950">3. 시민 확인단 (유급 검증)</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              전체 측정 문항의 {CITIZEN_VERIFIER_POLICY.sample_ratio * 100}% 표본 및 고위험·보류 문항에 대해
              지자체 공식 문서 URL과 AI 답변이 일치하는지 2인 독립 교차 검증을 수행합니다.
            </p>
          </div>
          <Link
            href="/corrections"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-navy-950 text-xs sm:text-sm font-bold hover:bg-slate-200 transition-colors"
          >
            <span>정정·검증 문의 및 신청</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 온라인 질문 제안 폼 */}
      <QuestionSuggestForm />

      {/* 시민 확인단 운영 기준 (roles-and-permissions.md 정합) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-navy-950 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          시민 확인단 운영 및 이해충돌 방지 규칙
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 space-y-1">
            <span className="text-slate-500 font-semibold block">연령 및 자격 제한</span>
            <span className="text-sm font-black text-navy-950">
              만 {CITIZEN_VERIFIER_POLICY.min_age}세 이상 성인만 참여 가능
            </span>
            <p className="text-slate-500">미성년자 가입·참여 제한 (근로·수당 지급 기준 준수)</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 space-y-1">
            <span className="text-slate-500 font-semibold block">보상 기준 및 상한</span>
            <span className="text-sm font-black text-navy-950">
              시급 {CITIZEN_VERIFIER_POLICY.hourly_wage_krw.toLocaleString('ko-KR')}원 (월 최대 {CITIZEN_VERIFIER_POLICY.max_monthly_hours}시간)
            </span>
            <p className="text-slate-500">건당 속도 경쟁 방지 및 정밀 대조 품질 유지</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 space-y-1">
            <span className="text-slate-500 font-semibold block">이해충돌 배제 (COI)</span>
            <span className="text-sm font-black text-navy-950">거주·소속 지자체 배정 제외</span>
            <p className="text-slate-500">본인 거주지 또는 재직 기관 문항은 채점 배정에서 자동 제외</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 space-y-1">
            <span className="text-slate-500 font-semibold block">품질 게이트</span>
            <span className="text-sm font-black text-navy-950">2인 독립 판정 (κ ≥ 0.75)</span>
            <p className="text-slate-500">판정 불일치 시 운영팀 3차 확정 판정으로 이관</p>
          </div>
        </div>
      </section>

      {/* INV-18 범위 제외 고지 */}
      <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 text-rose-950 text-xs sm:text-sm flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-rose-900">
            측정 및 제보 범위 제외 안내 (INV-18)
          </div>
          <p className="text-rose-800 leading-relaxed">
            {SCOPE_EXCLUSION_NOTICE} 해당 주제의 제보나 질문 제안은 검수 단계에서 자동 반려됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
