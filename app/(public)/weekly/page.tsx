// app/(public)/weekly/page.tsx
// FR-84 & ADR-0021 & ADR-0024 & INV-15: 주간 질문 (방어판·능동판 격주) & 전국 관측 기상도
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  WEEKLY_OBSERVATION_COUNTS,
  WINDOW_STATE_META,
  ACTIVE_CATEGORIES_12,
} from '@/lib/jeongdap';
import { Calendar, CloudSun, ShieldCheck, ArrowRight, Compass, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: '주간 질문 & 전국 관측 기상도 — 모두의 정답노트',
  description:
    '매주 시민이 묻는 질문으로 측정하는 방어판·능동판 격주 리포트와 최근 4주 12회 창 상태(신규·안정·가끔·소멸·드묾) 기반 전국 관측 기상도',
};

export default function WeeklyPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* 헤더 */}
      <div className="space-y-4 border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5 text-gold-400" />
          WEEKLY OBSERVATION & WEATHER MAP · 주간 상시 관측 (FR-84)
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-navy-950 tracking-tight">
          이주의 질문 & 전국 관측 기상도
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          매주 월·수·금요일에는 시민 생활·여행·귀농·문화 무지명 질문({WEEKLY_OBSERVATION_COUNTS.mon_wed_fri_per_day}문항/일)을,
          화요일에는 전국 243개 지자체 지명 정체성 질문({WEEKLY_OBSERVATION_COUNTS.tue_identity_named}문항)을 관측합니다.
        </p>
      </div>

      {/* 1. 격주 발행 구조: 방어판 vs 능동판 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
              방어판 (짝수 주 발행)
            </span>
            <span className="text-xs font-mono text-slate-400">정답 대조 · 공식 근거율</span>
          </div>
          <h2 className="text-xl font-black text-navy-950">
            &ldquo;이 질문을 물었을 때 공식 문서로 답하는가&rdquo;
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            전입신고, 출산지원금, 대형폐기물 수수료, 야간 소아과 등 주민이 가장 자주 묻는 질문 1개를 골라
            AI가 공식 누리집 문서를 첫 근거(S3)로 인용하는지, 혹은 공식 문서 자체가 없는 공급 공백인지 비교합니다.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold">
              능동판 (홀수 주 발행)
            </span>
            <span className="text-xs font-mono text-slate-400">무지명 추천 · 4주 12회 창</span>
          </div>
          <h2 className="text-xl font-black text-navy-950">
            &ldquo;지역 이름을 빼고 물었을 때 어느 동네가 등장하는가&rdquo;
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {ACTIVE_CATEGORIES_12.length}개 분야 무지명 질문에 대해 최근 4주({WEEKLY_OBSERVATION_COUNTS.window_runs}회 관측) 동안
            <strong> ● 안정(9회 이상)</strong> 또는 <strong>◆ 신규(이번 2주 ≥2회 & 이전 2주 0회)</strong>로 등장한 지역만 가나다순으로 소개합니다(INV-15).
          </p>
        </div>
      </section>

      {/* 2. 최근 4주 12회 창 상태 판정 규칙 (observe_weekly.py 정합) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gold-600">
              4-WEEK 12-RUN WINDOW STATES (ADR-0024)
            </span>
            <h2 className="text-xl font-black text-navy-950 flex items-center gap-2 mt-0.5">
              <CloudSun className="w-5 h-5 text-amber-500" />
              주간 상시 관측 5상태 정의
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">
            화요일 지명 정체성 문항(ID-*)은 4주 창 집계에서 자동 분리됨
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">상태 기호·명칭</th>
                <th className="py-3 px-4">4주 12회 판정 규칙</th>
                <th className="py-3 px-4">공개 화면 표기 원칙 (INV-15)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.values(WINDOW_STATE_META).map((ws) => (
                <tr key={ws.state}>
                  <td className="py-3 px-4 font-bold text-navy-950 whitespace-nowrap">
                    {ws.shape} {ws.label}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-700">{ws.rule_summary}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {ws.public_list_allowed ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        공개 카드 등장 지역 목록에 표기 (가나다순)
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        공개 등장 목록에서 제외 (전국 익명 건수 또는 소관 지자체 카드에서만 안내)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. 다음 주 질문 제안 & 정책테마랩 연계 */}
      <section className="rounded-2xl bg-navy-950 text-white p-6 sm:p-8 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-gold-400 uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>CITIZEN QUESTION PROPOSAL · 정책테마랩 연계 (FR-92)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            다음 주에 AI에게 물어볼 질문을 제안해 주세요
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            시민이 제안한 생활·정책·문화 질문은 개인정보 검수(`approved=true`)를 거쳐 주간 상시 관측 후보군과 다음 분기 문항 판에 반영됩니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            href="/theme-lab"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 text-navy-950 font-black text-xs sm:text-sm hover:from-gold-300 hover:to-gold-400 transition-all"
          >
            <span>질문 제안하러 가기 (정책테마랩)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/join"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/15 transition-all"
          >
            <span>시민 참여 안내</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
