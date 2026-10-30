// app/(org)/portal/page.tsx
// FR-87 & INV-4: 지자체 포털 (정비 사건 등록부 F·T·Q·D·U·A·S·L·N · 알리기 사건 M·E·P·G·R·W · 선언표 자가 등록)
import React from 'react';
import type { Metadata } from 'next';
import {
  REPAIR_EVENT_DEFENSE_CODES,
  REPAIR_EVENT_ACTIVE_CODES,
} from '@/lib/jeongdap';
import { PortalEventForm } from '@/components/jeongdap/PortalEventForm';
import { Wrench, Megaphone, FileCheck2, ShieldCheck, Info } from 'lucide-react';

export const metadata: Metadata = {
  title: '지자체 포털 (정비·알리기 사건 등록부 & 선언표) — 모두의 정답노트',
  description:
    '지자체 담당자가 공식 문서 정비(F·T·Q·D·U·A·S·L·N), 알리기 사건(M·E·P·G·R·W), 지역 정체성 선언표를 직접 등록하고 +2주/+6주 재측정을 요청하는 무료 공익 포털 (FR-87 · INV-4)',
};

export default function AgencyPortalPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* 헤더 */}
      <div className="space-y-4 border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
          <Wrench className="w-3.5 h-3.5 text-gold-400" />
          LOCAL GOVERNMENT PORTAL · 정비·알리기 사건 등록부 (FR-87)
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-navy-950 tracking-tight">
          지자체 무료 공익 포털: 정비·알리기 사건 등록부 & 선언표
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          모든 지자체 담당자는 비용 없이 공식 문서 정비 내역과 지역 정체성 선언표를 직접 등록하고,
          <strong> 등록 후 +2주 · +6주 자동 재측정</strong>을 통해 공식 근거율(S3) 변화를 확인할 수 있습니다(A원칙 · 유료 상품 없음).
        </p>
      </div>

      {/* INV-4 자발적 등록 분모 분리 안내 */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs sm:text-sm flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">자발적 등록 데이터 표기 원칙 (INV-4): </strong>
          지자체 포털에 자발적으로 등록된 선언표·정비 사건 통계는 항상 <strong>&ldquo;등록한 N곳 중 …&rdquo;</strong> 또는 <strong>&ldquo;참여한 N곳 중 …&rdquo;</strong>으로만 표기하며, 전국 전수 통계와 절대 혼합하지 않습니다.
        </div>
      </div>

      {/* 1. 방어 정비 사건 유형 코드 (9종: F·T·Q·D·U·A·S·L·N) */}
      <section className="space-y-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            DEFENSIVE REPAIR EVENTS · 9 TYPE CODES
          </span>
          <h2 className="text-xl font-black text-navy-950 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-600" />
            1. 방어(정답 대조) 정비 사건 유형 코드 (F·T·Q·D·U·A·S·L·N)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(REPAIR_EVENT_DEFENSE_CODES).map(([code, desc]) => (
            <div key={code} className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 font-mono font-black text-xs flex items-center justify-center shrink-0">
                {code}
              </span>
              <span className="text-xs text-slate-700 font-medium leading-relaxed">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 2. 능동 알리기 사건 유형 코드 (6종: M·E·P·G·R·W) */}
      <section className="space-y-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
            ACTIVE PUBLISH EVENTS · 6 TYPE CODES
          </span>
          <h2 className="text-xl font-black text-navy-950 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" />
            2. 능동(등장·정체성) 알리기 사건 유형 코드 (M·E·P·G·R·W)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(REPAIR_EVENT_ACTIVE_CODES).map(([code, desc]) => (
            <div key={code} className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 font-mono font-black text-xs flex items-center justify-center shrink-0">
                {code}
              </span>
              <span className="text-xs text-slate-700 font-medium leading-relaxed">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 지역 정체성 선언표 (5대 알릴 요소 + 공식 URL) */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
        <h2 className="text-lg font-black text-navy-950 flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-gold-600" />
          3. 우리 지역 정체성 선언표 (Declarations) 자가 등록
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          지자체가 주민과 방문객에게 알리고 싶은 대표 요소 5가지(대표 명소·축제·먹거리·정착 지원·핵심 상징)와 각각의 공식 누리집 URL을 등록하면,
          화요일 지명 정체성 관측(243문항)과 능동 관측에서 <strong>노력(선언) → 도달(공식 인용) → 결과(내용 일치)</strong> 3단계로 연결해 보여줍니다.
        </p>
        <div className="pt-2 flex items-center gap-2 text-xs text-emerald-800 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>정비·선언표 등록 및 +2주/+6주 재측정은 모든 지자체에 전액 무료로 제공됩니다 (A원칙).</span>
        </div>
      </section>

      {/* 정비·알리기 사건 등록 폼 */}
      <PortalEventForm />
    </div>
  );
}
