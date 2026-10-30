// app/(public)/regions/[unitId]/page.tsx
// §7.2 & §12 & INV-13~17: 지역별 상세 페이지 (2대 공개 지표 · 출처 4단 끊긴 단 · 주간 등장 카드 · 선언표 · 이해관계 공시)
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getUnitById } from '@/lib/db/units';
import {
  PANEL_5_UNITS,
  PUBLICATION_STATE_LABELS,
  UNMEASURED_REGION_NOTICE,
  JEONGDAP_METHOD_VERSION,
} from '@/lib/jeongdap';
import { JudgmentBadge } from '@/components/jeongdap/JudgmentBadge';
import { RoundStamp } from '@/components/jeongdap/RoundStamp';
import { ScopeNote } from '@/components/jeongdap/ScopeNote';
import { InterestDisclosure } from '@/components/jeongdap/InterestDisclosure';
import { MapPin, ShieldCheck, Clock, ArrowLeft, Wrench, Send } from 'lucide-react';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: { unitId: string };
}): Promise<Metadata> {
  const unit = await getUnitById(params.unitId);
  const name = unit?.name ?? params.unitId;
  return {
    title: `${name} AI 공식 근거율 · 피해 위험 진단 — 모두의 정답노트`,
    description: `${name}의 생성형 AI 공식 근거율(S3), 피해 위험 건수, 출처 4단 병목 및 주간 관측 현황`,
  };
}

export default async function RegionDetailPage({
  params,
}: {
  params: { unitId: string };
}) {
  const unit = await getUnitById(params.unitId);
  const panelEntry = PANEL_5_UNITS.find(
    (p) =>
      p.site_id.toLowerCase() === params.unitId.toLowerCase() ||
      `lg-${p.sgg_code}` === params.unitId ||
      (unit && unit.name.includes(p.name_ko.split(' ')[1]))
  );

  if (!unit && !panelEntry) {
    notFound();
  }

  const displayName = panelEntry?.name_ko ?? unit?.name ?? params.unitId;
  const displayHost = unit?.host ?? '공식 누리집 도메인 확인 중';
  const isPanelUnit = Boolean(panelEntry);

  const sampleStamp = {
    roundLabel: isPanelUnit ? '2026년 10월 1차 기준 패널 (측정 진행 중)' : '2027년 3월 전국 1차 코어 스캔 예정',
    measuredDates: isPanelUnit ? '2026-10-21 ~ 11-05 (9회 반복 블록)' : '측정 전 (2027-03 예정)',
    modelVersion: 'gpt-5',
    searchToolVersion: 'web_search:responses_v1',
    methodVersion: JEONGDAP_METHOD_VERSION,
    observationBasis: 'API 기준 관측' as const,
    locationSignal: false as const,
    preregId: 'prereg-2026-10-r1',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div>
        <Link
          href="/regions"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-950"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>내 지역 찾기로 돌아가기</span>
        </Link>
      </div>

      {/* 헤더 */}
      <div className="space-y-4 border-b border-slate-200 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5" />
            {unit?.unit_type === 'metro' ? '광역자치단체' : '기초자치단체'}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isPanelUnit
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            발행 상태: {isPanelUnit ? PUBLICATION_STATE_LABELS.measuring : PUBLICATION_STATE_LABELS.before_measurement}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-navy-950 tracking-tight">
          {displayName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-mono">
          공식 도메인: {displayHost} {panelEntry ? `· 기준 패널 ID: ${panelEntry.site_id} (${panelEntry.stratum})` : ''}
        </p>

        <RoundStamp stamp={sampleStamp} />
      </div>

      {/* 1. 2대 공개 머리 지표 (INV-13 · INV-14 · INV-17) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-navy-950">
            1. 2대 공개 머리 지표 (종합 점수·순위 미산출 · INV-3 · INV-14)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              지표 1 · 공식 근거율 (S3 첫 근거 비율)
            </span>
            <div className="text-2xl font-black text-navy-950 pt-1">
              {isPanelUnit ? '1차 패널 9회 블록 측정 중' : '측정 전 (2027-03 공개)'}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              공급 공백(공식 웹 문서 부재)과 해당 없음을 분모에서 분리한 뒤, 첫 번째 인용이 공식 도메인인 비율과 95% 신뢰구간을 표시합니다.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full">
              지표 2 · 피해 위험 건수 (재난·안전 제외 · INV-16)
            </span>
            <div className="text-2xl font-black text-navy-950 pt-1">
              {isPanelUnit ? '사람 2인 독립 판정 대기' : '측정 전 (2027-03 공개)'}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              고위험 문항(지원금·수수료·기한·자격)에서 공식 근거 없이 잘못된 수치·절차를 단정한 건수와 위약 오탐 건수를 집계합니다.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>{UNMEASURED_REGION_NOTICE}</span>
        </div>
      </section>

      {/* 2. 출처 4단 병목 구조 (끊긴 단 안내) */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
        <h2 className="text-lg font-black text-navy-950">
          2. 출처 4단 (검색에 뜸 → AI가 읽음 → 첫 근거가 됨 → 내용이 맞음)
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          측정 완료 시 아래 4단 범주와 공급 공백 건수가 문항 분야별로 분해되어 표시됩니다.
        </p>
        <div className="flex flex-wrap gap-2">
          <JudgmentBadge kind="s1_search" />
          <JudgmentBadge kind="s2_cited" />
          <JudgmentBadge kind="s3_first_official" />
          <JudgmentBadge kind="s4_match" />
          <JudgmentBadge kind="s4_mismatch" />
          <JudgmentBadge kind="supply_gap" />
          <JudgmentBadge kind="not_applicable" />
        </div>
      </section>

      {/* 3. 범위 및 원인 미확정 고지 + 이해관계 공시 */}
      <ScopeNote />
      <InterestDisclosure unitName={displayName} />

      {/* 4. 담당자 포털 및 시민 제보 연결 */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs">
        <Link
          href="/portal"
          className="inline-flex items-center gap-1.5 font-bold text-navy-900 hover:text-gold-600"
        >
          <Wrench className="w-4 h-4 text-emerald-600" />
          <span>지자체 담당자 무료 정비 사건 · 선언표 등록 (/portal) →</span>
        </Link>
        <Link
          href="/report"
          className="inline-flex items-center gap-1.5 font-bold text-rose-700 hover:text-rose-900"
        >
          <Send className="w-3.5 h-3.5" />
          <span>이 지역의 AI 오답 사례 제보하기 →</span>
        </Link>
      </div>
    </div>
  );
}
