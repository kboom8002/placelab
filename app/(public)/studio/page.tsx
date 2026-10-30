'use client';

// app/(public)/studio/page.tsx
// MAPS 스튜디오 (Multi-AI Presence & Alignment Studio) 스토어프론트
// 근거: ADR-0026, ADR-0027, FR-97, FR-103, INV-12, INV-17, MAPS-INV-05, MAPS-INV-06, MAPS-INV-10, MAPS-INV-15, MAPS-INV-17, MAPS-INV-19

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MAPS_FICTIONAL_SAMPLE_REPORT,
  MAPS_GAP_META,
  MAPS_METHOD_VERSION,
  MAPS_NON_GUARANTEE_DISCLAIMER,
  MAPS_SKU_CATALOG,
  MAPS_STAGE_PRESCRIPTION_META,
  MAPS_VERDICT_META,
  buildMapsWorkspaceSnapshot,
  checkMapsEligibility,
  type MapsOrgType,
} from '@/lib/maps/core';
import { validateOrderCreation } from '@/lib/maps/billing/toss';

export default function MapsStudioStorefrontPage() {
  const [activeTab, setActiveTab] = useState<
    'catalog' | 'freecheck' | 'sample' | 'method'
  >('catalog');

  // 무료 간극 점검 & A원칙 적격성 심사 상태
  const [orgName, setOrgName] = useState('서울미소안과의원');
  const [orgType, setOrgType] = useState<MapsOrgType>('hospital');
  const [domain, setDomain] = useState('seoulmisoeye.co.kr');
  const [sponsorDisclosure, setSponsorDisclosure] = useState('');
  const [orderNotice, setOrderNotice] = useState<string | null>(null);

  const eligibility = checkMapsEligibility({
    orgName,
    orgType,
    domain,
    sponsorDisclosure: sponsorDisclosure || null,
  });

  const sampleSnapshot = buildMapsWorkspaceSnapshot('ten-seoulmiso');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MAPS 스튜디오 (Multi-AI Presence & Alignment Studio)',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      '기업·병의원·대학·준공공기관·로컬 상권을 위한 이원 시간(as-of) 정본 대장 및 다중 AI 간극 진단·처방·전후 검증 스튜디오',
    softwareVersion: MAPS_METHOD_VERSION,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 상단 히어로 & 4단계 파이프라인 */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800 border border-indigo-200">
                MAPS Studio · 방법론 {MAPS_METHOD_VERSION} · 공익 방화벽(A원칙) 적용
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                MAPS 스튜디오 — 재기 · 맞추기 · 간극 짚기 · 메우기
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                귀사의 공식 정본(Canonical Facts)과 다중 AI 서비스의 응답 사이에 존재하는{' '}
                <strong>6대 간극(G1~G6)</strong>을 관측 시점 기준일(as-of)로 정밀 진단하고,{' '}
                <strong>6단계 원인 소거 처방전</strong>과 <strong>대조군 동반 전후 재측정(Proof)</strong>으로
                메워 나가는 엔터프라이즈·로컬 정본 스튜디오입니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/workspace"
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                고객사 워크스페이스 열기 (/workspace)
              </Link>
              <Link
                href="/kbrandlab/local"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                로컬레이다 상권 스캔 (/kbrandlab/local)
              </Link>
              <Link
                href="/ops/maps"
                className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-200"
              >
                운영 어드민 (/ops/maps)
              </Link>
            </div>
          </div>

          {/* 4단계 핵심 흐름 */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase text-indigo-700">
                Step 1 · 재기 (Measure)
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                관측 시점(as-of) 6분류 판정
              </div>
              <p className="mt-1 text-xs text-slate-600">
                정본 일치 · 구버전 지연 · 타 대상 혼동 · 무인용 단언 · 근거 없는 창작 · 정직한 모름을 분리 판정합니다.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase text-indigo-700">
                Step 2 · 맞추기 (Align)
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                이원 시간(Bitemporal) 정본 대장
              </div>
              <p className="mt-1 text-xs text-slate-600">
                효력 시작일(valid_from)과 미래 개정 예고를 함께 기록하여 요금·시간 변경 후 수렴 지연을 추적합니다.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase text-indigo-700">
                Step 3 · 간극 짚기 (Diagnose)
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                G1~G6 간극 & 6단계 소거 진단
              </div>
              <p className="mt-1 text-xs text-slate-600">
                정본 부재부터 이미지/PDF 파싱 장벽, 구버전 문서 충돌, 모델 잔상까지 원인을 단계별로 소거합니다.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase text-indigo-700">
                Step 4 · 메우기 & 증명 (Close & Proof)
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                구조화 배포 & 대조군 전후 검증
              </div>
              <p className="mt-1 text-xs text-slate-600">
                HTML 표·JSON-LD·만료 배너를 배포하고 비개입 대조군 대비 순변화(DiD)를 검증합니다.
              </p>
            </div>
          </div>

          {/* 의무 비보증 고지 배너 (MAPS-INV-06) */}
          <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">
            <strong>보증 한계 및 과금 범위 고지 (MAPS-INV-06):</strong>{' '}
            {MAPS_NON_GUARANTEE_DISCLAIMER}
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl gap-6 px-6">
          {[
            { id: 'catalog', label: '1. 상품 카탈로그 & 견적/결제 게이트' },
            { id: 'freecheck', label: '2. 무료 간극 점검 & A원칙 적격 심사' },
            { id: 'sample', label: '3. [가상] 샘플 리포트 열람' },
            { id: 'method', label: '4. 공개 방법론 & 5대 약속' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`border-b-2 py-3.5 text-sm font-semibold transition ${
                activeTab === t.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* 탭 1: 카탈로그 */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  MAPS 스튜디오 라인업 (가격 확정 상태 분리 표기 · INV-12 / MAPS-INV-10)
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  가격 검증이 완료된 상품(<strong>확정 정가</strong>)만 즉시 결제가 활성화되며,
                  시장 검증 중인 상품은 <strong>[가정]</strong> 배지와 함께 맞춤 견적 문의로만 접수합니다.
                </p>
              </div>
            </div>

            {orderNotice && (
              <div className="rounded-lg border border-indigo-300 bg-indigo-50 p-4 text-sm text-indigo-950">
                {orderNotice}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {MAPS_SKU_CATALOG.map((sku) => {
                const isConfirmed = sku.priceStatus === 'confirmed';
                return (
                  <div
                    key={sku.skuCode}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {sku.stageLabel}
                        </span>
                        {isConfirmed ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                            정가 확정 (즉시 신청 가능)
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-300">
                            [가정] 맞춤 견적 전용 (즉시 결제 차단)
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-900">
                        {sku.nameKo}
                      </h3>
                      <div className="mt-1 text-sm font-semibold text-indigo-700">
                        {sku.assumptionRangeLabel}
                      </div>

                      <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                        {sku.deliverables.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-indigo-600">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-4">
                      <p className="mb-3 text-[11px] text-slate-500">
                        {sku.nonGuaranteeNotice}
                      </p>
                      <div className="flex gap-2">
                        {isConfirmed ? (
                          <button
                            type="button"
                            onClick={() => {
                              const check = validateOrderCreation({
                                sku,
                                orderMode: 'pg_checkout',
                              });
                              setOrderNotice(
                                `[${sku.skuCode}] ${check.reasonKo} (결제 금액: ${check.amountKrw.toLocaleString()}원 · 판정 엔진과 완전 분리된 maps_billing_orders 레인에서 처리됩니다.)`
                              );
                            }}
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                          >
                            {sku.confirmedPriceKrw === 0
                              ? '무료 간극 점검 시작'
                              : `정가 결제 신청 (${sku.confirmedPriceKrw?.toLocaleString()}원)`}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const blockedCheck = validateOrderCreation({
                                sku,
                                orderMode: 'pg_checkout',
                              });
                              setOrderNotice(
                                `[가격 가정 게이트 작동 확인] ${blockedCheck.reasonKo}`
                              );
                            }}
                            className="w-full rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                          >
                            [가정] 맞춤 견적 요청 접수 (PG 즉시 결제 차단됨)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 탭 2: 무료 간극 점검 & A원칙 적격 심사 */}
        {activeTab === 'freecheck' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
              <h2 className="text-lg font-bold text-slate-900">
                A원칙 적격성 심사 & 무료 간극 점검
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                지방자치단체(광역 16 · 기초 227) 및 <code>.go.kr</code> 도메인은 A원칙(이해충돌 방지 ·{' '}
                <code>INV-17</code>)에 따라 상용 진단이 즉시 차단되며 공공 트랙(<code>/selfcheck</code>)으로 안내됩니다.
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    빠른 시나리오 프리셋
                  </label>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setOrgName('서울미소안과의원');
                        setOrgType('hospital');
                        setDomain('seoulmisoeye.co.kr');
                        setSponsorDisclosure('');
                      }}
                      className="rounded border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs hover:bg-slate-100"
                    >
                      민간 병의원 (승인)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOrgName('수원시청');
                        setOrgType('local_gov_blocked');
                        setDomain('suwon.go.kr');
                        setSponsorDisclosure('');
                      }}
                      className="rounded border border-red-300 bg-red-50 px-2.5 py-1 text-xs text-red-800 hover:bg-red-100"
                    >
                      기초지자체 수원시청 (A원칙 차단)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOrgName('강원문화관광재단');
                        setOrgType('foundation');
                        setDomain('gwcto.or.kr');
                        setSponsorDisclosure(
                          '2026년 강원문화관광재단 자체 예산 디지털 정본 정비 시범 과업'
                        );
                      }}
                      className="rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800 hover:bg-emerald-100"
                    >
                      출자·출연 재단 (공시 동반 승인)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    기관·기업명
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    조직 구분
                  </label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value as MapsOrgType)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="hospital">민간 병의원·의료기관 (hospital)</option>
                    <option value="enterprise">민간 기업·브랜드 (enterprise)</option>
                    <option value="university">대학·교육기관 (university)</option>
                    <option value="smb">로컬 소상공인·상권 매장 (smb)</option>
                    <option value="foundation">출자·출연 재단 (foundation · 공시 필수)</option>
                    <option value="public_corp">지방공기업·공사 (public_corp · 공시 필수)</option>
                    <option value="local_gov_blocked">지방자치단체 시청·군청·구청 (A원칙 차단 대상)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    공식 도메인
                  </label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                {(orgType === 'foundation' || orgType === 'public_corp') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      준공공 후원·용역 이해관계 공시 문구 (필수)
                    </label>
                    <input
                      type="text"
                      value={sponsorDisclosure}
                      onChange={(e) => setSponsorDisclosure(e.target.value)}
                      placeholder="예: 2026년 자체 디지털 정본 구축 시범 사업"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
              <div
                className={`rounded-lg border p-4 ${
                  eligibility.eligible
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                    : 'border-red-300 bg-red-50 text-red-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase">
                    판정 코드: {eligibility.reasonCode}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold">
                    {eligibility.eligible ? '적격 승인' : '상용 접수 차단 (INV-17)'}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium">{eligibility.messageKo}</p>
                {eligibility.redirectPath && (
                  <div className="mt-3">
                    <Link
                      href={eligibility.redirectPath}
                      className="inline-flex items-center rounded bg-red-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-900"
                    >
                      공공 무료 자가점검 트랙({eligibility.redirectPath})으로 이동 →
                    </Link>
                  </div>
                )}
              </div>

              {eligibility.eligible && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    무료 간극 점검 맛보기 결과 ({orgName} · {domain})
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">정본 일치율</div>
                      <div className="mt-1 text-lg font-bold text-emerald-700">
                        {(sampleSnapshot.metrics.factualRate.rate * 100).toFixed(1)}%
                      </div>
                      <div className="text-[11px] text-slate-500">
                        무인용 단언(asserted) 제외
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">공식 인용률</div>
                      <div className="mt-1 text-lg font-bold text-indigo-700">
                        {(sampleSnapshot.metrics.officialCitationRate.rate * 100).toFixed(1)}%
                      </div>
                      <div className="text-[11px] text-slate-500">
                        1차 정본 URL 인용
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">구버전 평균 지연</div>
                      <div className="mt-1 text-lg font-bold text-amber-700">
                        {sampleSnapshot.metrics.avgLagDays ?? 0}일
                      </div>
                      <div className="text-[11px] text-slate-500">
                        개정일(valid_from) 이후
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">피해 위험 비율</div>
                      <div className="mt-1 text-lg font-bold text-red-700">
                        {(sampleSnapshot.metrics.harmRiskRate.rate * 100).toFixed(1)}%
                      </div>
                      <div className="text-[11px] text-slate-500">
                        하한선 위반 {sampleSnapshot.metrics.limitViolationCount}건
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {sampleSnapshot.judgments.slice(0, 3).map((j) => {
                      const vMeta = MAPS_VERDICT_META[j.verdict];
                      return (
                        <div
                          key={j.judgmentId}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-900">
                              [{j.propKey}]
                            </span>{' '}
                            <span className="text-slate-600">{j.rationale}</span>
                          </div>
                          <span
                            className={`ml-2 shrink-0 rounded-full border px-2.5 py-0.5 font-semibold ${vMeta.badgeClass}`}
                          >
                            {vMeta.symbol} {vMeta.labelKo}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 탭 3: [가상] 샘플 리포트 (MAPS-INV-15) */}
        {activeTab === 'sample' && (
          <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="rounded-lg border border-indigo-300 bg-indigo-50 p-4 text-sm text-indigo-950">
              <div className="font-bold">{MAPS_FICTIONAL_SAMPLE_REPORT.badge}</div>
              <p className="mt-1 text-xs">{MAPS_FICTIONAL_SAMPLE_REPORT.disclaimer}</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {MAPS_FICTIONAL_SAMPLE_REPORT.entityName}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                측정 기간: {MAPS_FICTIONAL_SAMPLE_REPORT.periodLabel}
              </p>
              <p className="mt-3 text-sm text-slate-700">
                {MAPS_FICTIONAL_SAMPLE_REPORT.headlineSummary}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Object.entries(MAPS_VERDICT_META).map(([key, meta]) => (
                <div
                  key={key}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.badgeClass}`}
                  >
                    {meta.symbol} {meta.labelKo} ({key})
                  </span>
                  <p className="mt-2 text-xs text-slate-600">
                    {meta.descriptionKo}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 탭 4: 공개 방법론 & 5대 약속 (MAPS-INV-19: 내부 우선순위 가중치 비노출) */}
        {activeTab === 'method' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                6대 간극(G1~G6) 체계 및 우선순위 5요소 원칙
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                MAPS 스튜디오는 정본과 AI 답변의 어긋남을 6가지 간극으로 분류하고,{' '}
                <strong>질문 수요(demand) · 간극 크기(gap) · 피해 위험(harm) · 이행 가능성(feasibility) · 비용 효율(cost)</strong>의
                5가지 요소를 함께 표시하여 무엇부터 고쳐야 할지 안내합니다.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(MAPS_GAP_META).map(([key, g]) => (
                  <div
                    key={key}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3.5"
                  >
                    <div className="text-xs font-bold text-indigo-700">
                      {g.code} · {g.labelKo}
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{g.summaryKo}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                6단계 원인 소거 진단(Stage 1~6) 및 1:1 실행 처방
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {Object.entries(MAPS_STAGE_PRESCRIPTION_META).map(([key, st]) => (
                  <div
                    key={key}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="text-xs font-bold text-slate-900">
                      {st.stageLabelKo}
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{st.questionKo}</p>
                    <div className="mt-2 rounded bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-900">
                      처방({st.prescriptionCode}): {st.prescriptionTitleKo}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
