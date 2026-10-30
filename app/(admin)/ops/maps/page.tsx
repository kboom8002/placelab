'use client';

// app/(admin)/ops/maps/page.tsx
// MAPS 운영 어드민 콘솔 (/ops/maps)
// 근거: ADR-0026, ADR-0027, FR-102 ~ FR-106, MAPS-INV-11, MAPS-INV-12, MAPS-INV-13, MAPS-INV-14, MAPS-INV-17, MAPS-INV-18

import React, { useState } from 'react';
import Link from 'next/link';
import {
  buildMapsWorkspaceSnapshot,
  detectModelUpdate,
  lintMapsCopy,
  MAPS_SEED_CANARY_BASELINE,
  MAPS_SEED_CANARY_CURRENT_STABLE,
  MAPS_SEED_TENANTS,
  MAPS_SKU_CATALOG,
} from '@/lib/maps/core';

export default function MapsAdminConsolePage() {
  const snapshot = buildMapsWorkspaceSnapshot('ten-seoulmiso');

  // 카나리아 드리프트 시뮬레이터 상태
  const [simulateDrift, setSimulateDrift] = useState(false);
  const canaryResult = detectModelUpdate(
    MAPS_SEED_CANARY_BASELINE,
    simulateDrift
      ? {
          engineId: 'eng-openai-ws',
          checkedAtIso: '2026-10-23T06:00:00Z',
          avgResponseLength: 1120,
          refusalRate: 0.42,
          citationCountMean: 0.8,
          anchorTokenHitRate: 0.45,
        }
      : MAPS_SEED_CANARY_CURRENT_STABLE
  );

  // 리포트 발행 금칙어 & 보증 문구 린트 게이트
  const [draftReportText, setDraftReportText] = useState(
    '[가상] 2026-10-23 기준 방법론 maps-v1.0.0으로 측정한 정본 일치율은 33.3% (95% 신뢰 구간 9.7–70.0%)이며, 대조군 대비 순변화(DiD)를 함께 보고합니다.'
  );
  const [isFictionalSample, setIsFictionalSample] = useState(true);
  const lintResult = lintMapsCopy(draftReportText, {
    isFictionalSample,
    hasValidControlGroup: true,
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <span className="rounded bg-indigo-500 px-2.5 py-0.5 text-xs font-bold">
              OPS ADMIN · /ops/maps
            </span>
            <h1 className="mt-1 text-2xl font-bold">
              MAPS 스튜디오 운영 어드민 콘솔
            </h1>
            <p className="mt-0.5 text-xs text-slate-300">
              수집 보관소·카나리아 드리프트 감시 · A원칙 테넌트 적격 감사 · 문항 동결(private_control 격리) · 블라인드 판정자 일치도(Krippendorff α) · 리포트 린트 게이트
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/studio"
              className="rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700"
            >
              스토어프론트 (/studio)
            </Link>
            <Link
              href="/workspace"
              className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              고객사 워크스페이스 (/workspace)
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* 1. 카나리아 지문 드리프트 감시 & 블라인드 판정자 일치도 게이트 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                1. 카나리아 지문 감시 (Model Update Drift · MAPS-INV-12)
              </h2>
              <button
                type="button"
                onClick={() => setSimulateDrift((v) => !v)}
                className="rounded border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                {simulateDrift ? '정상 지문으로 복귀' : '모델 업데이트 드리프트 시뮬레이션'}
              </button>
            </div>
            <div
              className={`mt-4 rounded-lg border p-4 text-xs ${
                canaryResult.modelUpdateSuspected
                  ? 'border-red-300 bg-red-50 text-red-950'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-950'
              }`}
            >
              <div className="font-bold">
                엔진: {canaryResult.engineId} · 드리프트 지수: {canaryResult.driftScore}
              </div>
              <p className="mt-1">{canaryResult.notes}</p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">
              2. 블라인드 판정 큐 & Krippendorff&apos;s α 게이트 (MAPS-INV-11 / MAPS-INV-14)
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              판정자에게는 AI 서비스 실명 대신 <code>svc-A</code>, <code>svc-B</code> 블라인드 라벨만 표시됩니다.
            </p>
            <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-xs text-indigo-950">
              <div className="flex items-center justify-between font-bold">
                <span>
                  현재 Krippendorff&apos;s α = {snapshot.raterAgreement.alpha} (상태:{' '}
                  {snapshot.raterAgreement.status})
                </span>
                <span>
                  발행 허용: {snapshot.raterAgreement.publishAllowed ? '허용' : '차단'}
                </span>
              </div>
              <p className="mt-1">{snapshot.raterAgreement.recommendationKo}</p>
            </div>
          </section>
        </div>

        {/* 3. 문항 세트 동결 & 비공개 대조군(private_control) 격리 (MAPS-INV-13) */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            3. 동결 문항 세트 & 비공개 대조군(private_control) 고객사 비노출 격리 (MAPS-INV-13)
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            동결(<code>frozen = true</code>)된 문항 세트는 DB 트리거로 수정·삭제가 차단되며,{' '}
            <code>split_group = &apos;private_control&apos;</code> 문항은 고객사 워크스페이스 RLS에서 원천 제외됩니다.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="font-bold text-slate-900">
                qset-hospital-v1 (동결 완료)
              </div>
              <div className="mt-1 font-mono text-[11px] text-slate-500">
                frozen_hash: sha256:7c88a190f2e1…
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="font-bold text-slate-900">
                customer_audit (고객사 공개 문항)
              </div>
              <div className="mt-1 text-slate-600">
                정본 대조 및 처방전 도출 대상 문항군
              </div>
            </div>
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3.5">
              <div className="font-bold text-amber-950">
                private_control (어드민 전용 비공개 대조군)
              </div>
              <div className="mt-1 text-amber-900">
                문항 과적합(게이밍) 방지를 위해 고객사에 비공개 (RLS 차단)
              </div>
            </div>
          </div>
        </section>

        {/* 4. 테넌트 적격성 감사 & SKU 가격 확정 상태(price_status) 관리 */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            4. 테넌트 A원칙 적격 현황 & SKU 가격 확정 상태(price_status) 게이트
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-700">등록 테넌트 감사</div>
              {MAPS_SEED_TENANTS.map((t) => (
                <div
                  key={t.tenantId}
                  className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <span className="font-bold text-slate-900">{t.name}</span>{' '}
                    <span className="text-slate-500">({t.orgType})</span>
                  </div>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
                    {t.eligibilityStatus}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-700">
                SKU 가격 확정 상태 (INV-12 / MAPS-INV-10)
              </div>
              {MAPS_SKU_CATALOG.map((sku) => (
                <div
                  key={sku.skuCode}
                  className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="font-semibold text-slate-900">
                    {sku.skuCode} · {sku.nameKo}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 font-bold ${
                      sku.priceStatus === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {sku.priceStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. 리포트 발행 금칙어 & 보증 표현 린트 게이트 (MAPS-INV-18) */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            5. 리포트 발행 전 카피 린트 게이트 (lintMapsCopy · MAPS-INV-15 / MAPS-INV-18)
          </h2>
          <div className="mt-3 space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isFictionalSample}
                onChange={(e) => setIsFictionalSample(e.target.checked)}
              />
              가상 샘플 리포트 여부 ([가상] 배지 필수 검증)
            </label>
            <textarea
              rows={3}
              value={draftReportText}
              onChange={(e) => setDraftReportText(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3 text-xs"
            />
            <div
              className={`rounded-lg border p-3.5 text-xs ${
                lintResult.passed
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                  : 'border-red-300 bg-red-50 text-red-950'
              }`}
            >
              <div className="font-bold">
                린트 판정: {lintResult.passed ? '통과 (발행 가능)' : '차단 (금칙어·표기 위반)'}
              </div>
              {lintResult.violations.length > 0 && (
                <ul className="mt-1.5 list-disc pl-4">
                  {lintResult.violations.map((v, idx) => (
                    <li key={idx}>
                      [{v.code}] {v.messageKo}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
