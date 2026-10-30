'use client';

// app/(org)/kbrandlab/local/onboarding/page.tsx
// 로컬레이다 (LocalRadar) 소상공인 10분 자가 정본 온보딩 & Schema.org JSON-LD 정본 카드 생성기
// 근거: ADR-0025, PRD FR-96, 의료법 제56조 객관 운영 정본 검증 게이트

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Code2,
  FileCheck2,
  ShieldCheck,
  Store,
  Sparkles,
} from 'lucide-react';
import {
  evaluateShopAllFacts,
  generateShopJsonLd,
  HIGH_RISK_FACT_DEFINITIONS,
  LOCAL_COHORTS,
  LOCAL_RADAR_BRAND_NAME,
  LOCAL_SHOPS,
  validateShopCanonicalFacts,
  type HighRiskFactKey,
  type LocalCohortId,
  type LocalShop,
} from '@/lib/kbrandlab/local';

export default function LocalRadarOnboardingPage() {
  const [selectedCohortId, setSelectedCohortId] = useState<LocalCohortId>('EUNPYEONG_LOCAL');
  const cohortShops = useMemo(
    () => LOCAL_SHOPS.filter((s) => s.cohortId === selectedCohortId),
    [selectedCohortId],
  );
  const [selectedShopId, setSelectedShopId] = useState<string>('shop-epg-04');

  const baseShop = useMemo(
    () => cohortShops.find((s) => s.shopId === selectedShopId) ?? cohortShops[0],
    [cohortShops, selectedShopId],
  );

  const [factOverrides, setFactOverrides] = useState<Record<string, string>>({});

  const effectiveShop: LocalShop = useMemo(() => {
    return {
      ...baseShop,
      facts: baseShop.facts.map((f) => ({
        ...f,
        canonicalValue: factOverrides[`${baseShop.shopId}:${f.factKey}`] ?? f.canonicalValue,
      })),
    };
  }, [baseShop, factOverrides]);

  const validation = useMemo(
    () => validateShopCanonicalFacts(effectiveShop),
    [effectiveShop],
  );

  const jsonLdString = useMemo(() => {
    if (!validation.valid) return '';
    try {
      return JSON.stringify(generateShopJsonLd(effectiveShop), null, 2);
    } catch (e) {
      return e instanceof Error ? e.message : '';
    }
  }, [effectiveShop, validation]);

  const evaluations = useMemo(
    () => evaluateShopAllFacts(effectiveShop),
    [effectiveShop],
  );

  const handleCohortChange = (cid: LocalCohortId) => {
    setSelectedCohortId(cid);
    const first = LOCAL_SHOPS.find((s) => s.cohortId === cid);
    if (first) setSelectedShopId(first.shopId);
  };

  const handleFactChange = (factKey: HighRiskFactKey, value: string) => {
    setFactOverrides((prev) => ({
      ...prev,
      [`${baseShop.shopId}:${factKey}`]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/kbrandlab/local"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            {LOCAL_RADAR_BRAND_NAME} 코호트 대시보드로 돌아가기
          </Link>
          <span className="text-xs font-mono text-slate-500">
            FR-96 · 10분 자가 정본 온보딩 & JSON-LD 정본 스니펫
          </span>
        </div>

        {/* 상단 헤더 */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl border border-white/10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            {LOCAL_RADAR_BRAND_NAME} 10분 자가 정본 온보딩 (Ground Truth Self-Registration)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            점주가 직접 5대 영업 정본을 확인·등록하면<br />
            AI 웹검색이 읽는 구조화 정본 카드(Schema.org JSON-LD)가 즉시 생성됩니다
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            운영팀이 골목상권 매장의 휴무일과 가격을 일일이 수작업 조사하는 병목을 없애기 위해, 점주가 10분 만에 고위험 영업 사실 5항목을 입력·서명하고 14일 무료 체험 스캔으로 전환하는 셀프 온보딩 워크플로우입니다.
          </p>

          {/* 코호트 & 매장 선택 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10">
            {(['SEOGWIPO_STAY', 'GANGNAM_SMB', 'EUNPYEONG_LOCAL'] as const).map((cid) => {
              const c = LOCAL_COHORTS[cid];
              const active = cid === selectedCohortId;
              return (
                <button
                  key={cid}
                  type="button"
                  onClick={() => handleCohortChange(cid)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    active
                      ? 'bg-emerald-500/20 border-emerald-400 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xs font-bold text-emerald-300">{c.regionLabel}</div>
                  <div className="text-sm font-bold mt-0.5">{c.name}</div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {cohortShops.map((shop) => (
              <button
                key={shop.shopId}
                type="button"
                onClick={() => setSelectedShopId(shop.shopId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  shop.shopId === baseShop.shopId
                    ? 'bg-white text-slate-900 border-white'
                    : 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/20'
                }`}
              >
                {shop.shopCode} · {shop.shopName}
              </button>
            ))}
          </div>
        </div>

        {/* 정본 입력 폼 & JSON-LD 미리보기 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 좌측: 5대 고위험 영업 사실 자가 입력 폼 */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <Store className="w-4 h-4" />
                  {effectiveShop.neighborhood} · {effectiveShop.category}
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">
                  「{effectiveShop.shopName}」 5대 영업 정본 편집
                </h2>
              </div>
              {effectiveShop.isMedicalRegulated && (
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                  의료법 제56조 준수 게이트 활성
                </span>
              )}
            </div>

            {/* 검증 상태 배너 */}
            {validation.valid ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                정본 규칙 및 금지어·법무 검사를 모두 통과했습니다.
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  정본 검증 오류 ({validation.violations.length}건)
                </div>
                <ul className="list-disc list-inside space-y-0.5">
                  {validation.violations.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              {effectiveShop.facts.map((fact) => {
                const def = HIGH_RISK_FACT_DEFINITIONS.find((d) => d.key === fact.factKey);
                return (
                  <div key={fact.factKey} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label
                        htmlFor={`fact-${fact.factKey}`}
                        className="font-bold text-slate-800"
                      >
                        {fact.factLabel}
                      </label>
                      <span className="text-[11px] text-slate-400">
                        확인일: {fact.ownerVerifiedAt}
                      </span>
                    </div>
                    {def && (
                      <p className="text-[11px] text-slate-500">{def.description}</p>
                    )}
                    <textarea
                      id={`fact-${fact.factKey}`}
                      rows={2}
                      value={fact.canonicalValue}
                      onChange={(e) => handleFactChange(fact.factKey, e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 우측: 생성된 Schema.org JSON-LD 정본 스니펫 & 즉시 스캔 요약 */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                    <Code2 className="w-4 h-4" />
                    AI 수집기용 구조화 정본 (Schema.org JSON-LD)
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">
                    매장 누리집 / KRole-Local 삽입용 JSON-LD
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                  {effectiveShop.isMedicalRegulated
                    ? 'MedicalClinic + FAQPage'
                    : 'LocalBusiness + FAQPage'}
                </span>
              </div>

              <pre className="bg-slate-950 text-emerald-300 rounded-2xl p-4 text-[11px] font-mono overflow-x-auto max-h-[360px] leading-relaxed">
                {validation.valid
                  ? jsonLdString
                  : '// 정본 검증 오류를 해결하면 JSON-LD가 생성됩니다.'}
              </pre>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                    <FileCheck2 className="w-4 h-4" />
                    1회 무료 헛걸음 위험 스캔 진단 요약
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">
                    「{effectiveShop.shopName}」 5항목 출처 단계 요약
                  </h3>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {evaluations.map((ev) => (
                  <div
                    key={ev.factKey}
                    className="py-2.5 flex items-center justify-between gap-2"
                  >
                    <span className="font-bold text-slate-800">{ev.factLabel}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">
                        S1:{ev.s1InSearch ? '✓' : '✕'} · S2:{ev.s2Cited ? '✓' : '✕'} · S4:{ev.s4Verdict}
                      </span>
                      {ev.walkAwayRisk ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                          헛걸음 위험
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          정상
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
