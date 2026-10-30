// app/(public)/disclosure/page.tsx
// FR-90 & INV-14 & ADR-0021: 이해관계 공시 및 A원칙(측정·정비 분리) 선언문
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PRINCIPLE_A_DISCLOSURE, SCOPE_EXCLUSION_NOTICE } from '@/lib/jeongdap';
import { ShieldCheck, Scale, Lock, FileCheck2, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: '이해관계 공시 및 독립성 선언 (A원칙) — 모두의 정답노트',
  description:
    '측정 대상 지자체·공공기관에 정비·컨설팅 상품을 판매하거나 무상 제공하지 않는 A원칙(D76)과 데이터 방화벽, 공개경쟁 용역 공시 기준 (INV-14)',
};

export default function DisclosurePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-12">
      {/* 헤더 */}
      <div className="space-y-4 border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
          <Scale className="w-3.5 h-3.5 text-gold-400" />
          CONFLICT OF INTEREST DISCLOSURE · 이해관계 공시 (INV-14 · D76)
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-navy-950 tracking-tight">
          이해관계 공시 및 측정 독립성 선언 (A원칙)
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          측정 기관이 측정 대상에게 점수를 올려주는 유료 컨설팅이나 정비 상품을 팔면, 그 순간 측정의 공정성은 무너집니다.
          모두의 정답노트(Jeongdap Note)는 <strong>A원칙(측정과 정비의 완전 분리)</strong>을 헌법으로 삼습니다.
        </p>
      </div>

      {/* 핵심 선언 박스 */}
      <div className="p-6 sm:p-8 rounded-2xl bg-navy-950 text-white border border-gold-500/30 space-y-4 shadow-lg">
        <div className="text-xs font-mono text-gold-400 uppercase tracking-wider">
          PRINCIPLE A · OFFICIAL STATEMENT
        </div>
        <p className="text-base sm:text-lg font-bold leading-relaxed text-white">
          &ldquo;{PRINCIPLE_A_DISCLOSURE}&rdquo;
        </p>
      </div>

      {/* 4대 세부 규약 */}
      <section className="space-y-4">
        <h2 className="text-xl font-black text-navy-950">
          독립성 유지를 위한 4대 운영 규약
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-navy-950 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              1. 정비·컨설팅·VIP 상품 판매 및 무상 제공 금지
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              측정 대상인 243개 지방자치단체 및 특별구역에 &ldquo;AI 검색 최적화 정비&rdquo;, &ldquo;AEO 컨설팅&rdquo;, &ldquo;맞춤형 VIP 진단 보고서&rdquo;를 유상으로 판매하지 않으며, 영업 목적의 무상 정비 대행도 제공하지 않습니다.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-navy-950 text-sm">
              <Lock className="w-4 h-4 text-blue-600" />
              2. 측정 조직과 수익 조직 간 데이터 방화벽
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              공익 측정 파이프라인의 미공개 원시 데이터와 판정 대기열은 독립적으로 격리되며, 민간 브랜드 대상 별도 워크스페이스(K-Brand Lab 등)나 외부 사업에 영업 리드로 전용되지 않습니다.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-navy-950 text-sm">
              <FileCheck2 className="w-4 h-4 text-purple-600" />
              3. 공개경쟁 입찰·연구용역 참여 시 의무 공시
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              운영 주체가 나라장터 등 정부·지자체 공개경쟁 연구용역에 응찰하거나 수행하는 경우, 해당 기간과 과업 내역을 본 페이지에 즉시 등록하고 해당 지자체 상세 화면에 이해관계 배지를 의무 표기합니다. (계약 여부는 문항·판정 산식에 일체 영향을 주지 않습니다.)
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-navy-950 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              4. 측정 제외 영역 (INV-18)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {SCOPE_EXCLUSION_NOTICE}
            </p>
          </div>
        </div>
      </section>

      {/* 현재 등록된 이해관계 내역 */}
      <section className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-3">
        <h2 className="text-base font-black text-navy-950">
          현재 등록된 지자체 용역·후원 이해관계 내역 (2026-10 기준)
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          현재 기준(2026-10-17) 전국 243개 지방자치단체 및 특별구역과 체결된 유상 계약, 연구용역, 후원 내역은 <strong>0건</strong>입니다.
          1차 정밀 측정과 주간 상시 관측은 전액 자체 재원(민간 공익 자체 사업 · D103)으로 수행됩니다.
        </p>
        <div className="pt-2">
          <Link href="/evidence" className="text-xs font-bold text-navy-900 underline hover:text-gold-600">
            증거 대장(EVIDENCE.md) 및 정책 결정 로그 보기 →
          </Link>
        </div>
      </section>
    </div>
  );
}
