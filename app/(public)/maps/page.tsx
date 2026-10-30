// app/(public)/maps/page.tsx
// FR-83 & ADR-0017 & INV-3: 공식 근거 구간 지도 (3구간 가나다순) · AI 추천 지도 12분야
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BAND_META,
  ACTIVE_CATEGORIES_12,
  PANEL_5_UNITS,
  UNMEASURED_REGION_NOTICE,
} from '@/lib/jeongdap';
import { Map, ShieldCheck, Info, ArrowRight, Compass } from 'lucide-react';

export const metadata: Metadata = {
  title: '공식 근거 구간 지도 (3구간) & 12분야 추천 지도 — 모두의 정답노트',
  description:
    '1~243위 순위표 없이 「공식 근거 많음 · 보통 · 공식 근거 적음」 3구간과 구간 내 가나다순으로만 표기하는 공식 근거 구간 지도 및 12분야 AI 추천 지도 (ADR-0017)',
};

export default function MapsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* 헤더 */}
      <div className="space-y-4 border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
          <Map className="w-3.5 h-3.5 text-gold-400" />
          3-BAND OFFICIAL CITATION MAP · 순위 없는 3구간 지도 (ADR-0017)
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-navy-950 tracking-tight">
          공식 근거 구간 지도 & 12분야 AI 추천 지도
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          모두의 정답노트는 지자체를 1위부터 243위까지 줄 세우지 않습니다(INV-3).
          1차 측정 분포에서 한 번 못박은 고정 경계선에 따라 <strong>3개 구간(공식 근거 많음 · 보통 · 공식 근거 적음)</strong>으로만 나누고,
          같은 구간 안에서는 <strong>가나다순</strong>으로만 표기합니다.
        </p>
      </div>

      {/* 1. 공식 근거 3구간 정의 (색각 이상 친화: 색상 + 도형 + 한글 라벨) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gold-600">
              PART 1 · DEFENSIVE OFFICIAL CITATION BANDS
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-navy-950">
              공식 근거율(S3) 3구간 체계
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            색상 + 도형(●·▲·◆) + 한글 명칭 3중 인코딩 (색각 이상 접근성 준수)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(BAND_META).map((band) => (
            <div
              key={band.id}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-navy-950">
                  {band.shape} {band.label_ko}
                </span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  가나다순 표기
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{band.description}</p>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div>• 구간 이동 조건: 95% 신뢰구간 하한·상한이 고정 경계선을 넘을 때만 이동</div>
                <div>• 피해 위험 건수는 구간에 합산하지 않고 별도 배지로 병기 (INV-13)</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 측정 전 안내 및 5곳 기준 패널 표 */}
      <section className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <div className="font-bold text-navy-950">
              전국 243개 지자체 구간 지도 발행 일정 안내 (INV-17)
            </div>
            <p className="text-slate-600 leading-relaxed">
              {UNMEASURED_REGION_NOTICE} 현재는 1차 기준 패널 5곳({PANEL_5_UNITS.map((u) => u.name_ko).join(' · ')})의 550문항×9회 정밀 측정이 진행 중이며,
              1차 측정 완료와 동시에 고정 경계선(<code className="font-mono">band_boundaries</code>)이 확정·잠금됩니다.
            </p>
          </div>
        </div>
      </section>

      {/* 2. 능동 관측: 12분야 AI 추천 지도 */}
      <section className="space-y-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gold-600">
            PART 2 · ACTIVE AI RECOMMENDATION MAPS (12 CATEGORIES)
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-navy-950 flex items-center gap-2">
            <Compass className="w-6 h-6 text-navy-800" />
            12분야 AI 추천 지도 (무지명 질문 상시 관측)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            지역 이름을 넣지 않고 &quot;아이와 주말에 가볼 만한 곳&quot;, &quot;귀농 지원이 탄탄한 군&quot;처럼 물었을 때
            AI가 자발적으로 추천·언급하는 지역을 최근 4주 12회 창 상태(<strong>● 안정 · ◆ 신규</strong>)로 집계합니다.
            등장하지 않은 지역 목록은 절대 공개하지 않습니다(INV-15).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACTIVE_CATEGORIES_12.map((cat) => (
            <div
              key={cat.code}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-gold-400 transition-colors space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-gold-700 bg-amber-50 px-2.5 py-0.5 rounded-lg">
                  {cat.code}
                </span>
                <span className="text-[11px] text-slate-400">월·수·금 상시 관측</span>
              </div>
              <h3 className="text-base font-black text-navy-950">{cat.label_ko}</h3>
              <p className="text-xs text-slate-600">
                대표 질문 예: &ldquo;{cat.examples}&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>공개 대상: 안정(≥9/12) · 신규 등장 지역</span>
                <Link href="/weekly" className="text-navy-800 font-bold hover:text-gold-600 inline-flex items-center gap-0.5">
                  <span>주간 관측</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 하단 정책 예외 고지 (P-1) */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            본 화면의 3구간 실명 표기 및 능동 관측 등장 지역 실명 표기는 증거 대장 정책 예외(<strong>P-1 · ADR-0017 · ADR-0021</strong>)에 등록되어 있습니다.
          </span>
        </div>
        <Link href="/evidence" className="font-bold text-navy-900 underline hover:text-gold-600">
          증거 대장(EVIDENCE.md) 확인 →
        </Link>
      </div>
    </div>
  );
}
