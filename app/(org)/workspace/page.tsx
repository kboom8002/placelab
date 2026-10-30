'use client';

// app/(org)/workspace/page.tsx
// MAPS 고객사 워크스페이스 (/workspace)
// 근거: ADR-0026, FR-98 ~ FR-102, MAPS-INV-02, MAPS-INV-03, MAPS-INV-04, MAPS-INV-07, MAPS-INV-08, MAPS-INV-09, MAPS-INV-11, MAPS-INV-16, MAPS-INV-20

import React, { useState } from 'react';
import Link from 'next/link';
import {
  appendFactVersionRevision,
  buildMapsWorkspaceSnapshot,
  MAPS_BIAS_LENS_META,
  MAPS_GAP_META,
  MAPS_STAGE_PRESCRIPTION_META,
  MAPS_VERDICT_META,
  type MapsFactVersion,
} from '@/lib/maps/core';

export default function MapsClientWorkspacePage() {
  const [selectedTenantId, setSelectedTenantId] = useState('ten-seoulmiso');
  const baseSnapshot = buildMapsWorkspaceSnapshot(selectedTenantId);

  const [ledger, setLedger] = useState<MapsFactVersion[]>([
    ...baseSnapshot.factVersions,
  ]);
  const [editingPropKey, setEditingPropKey] = useState<string | null>(null);
  const [newValueRaw, setNewValueRaw] = useState('75,000원 (2026-11-01 개정 예고)');
  const [newEffectiveFrom, setNewEffectiveFrom] = useState(
    '2026-11-01T00:00:00Z'
  );
  const [revisionToast, setRevisionToast] = useState<string | null>(null);
  const [objectionToast, setObjectionToast] = useState<string | null>(null);

  const handleOneClickFactFix = (propKey: string) => {
    setEditingPropKey(propKey);
    setRevisionToast(null);
  };

  const handleAppendFactVersion = () => {
    const targetPrev =
      ledger.find(
        (f) => f.propKey === (editingPropKey ?? 'prop-exam-fee') && f.validTo === null
      ) ?? ledger[1];

    const updated = appendFactVersionRevision(ledger, {
      newFactVersionId: `fv-rev-${ledger.length + 1}`,
      previousFact: targetPrev,
      newValueNorm: newValueRaw,
      newValueRaw,
      effectiveFromIso: newEffectiveFrom,
      recordedAtIso: '2026-10-23T05:00:00Z',
      sourceUrl: targetPrev.sourceUrl,
      confirmLevel: 'owner_signed',
      confirmedBy: '원무팀장 김정훈',
    });

    setLedger(updated);
    setEditingPropKey(null);
    setRevisionToast(
      `무변이(Append-Only · MAPS-INV-03) 개정 완료: 기존 버전(${targetPrev.factVersionId})을 덮어쓰지 않고 새 정본 버전을 추가했습니다. 과거 관측 판정은 당시 기준일(as-of)로 보존됩니다.`
    );
  };

  const { metrics, gapTasks, biasLenses, costEfficiency, proofEffect } =
    baseSnapshot;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 상단 바 */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">
                MAPS Workspace
              </span>
              <span className="text-xs text-slate-500">
                {metrics.measuredRoundStamp}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {baseSnapshot.tenant.name} — 정본 대장 · 6분류 판정 · 간극 작업함
            </h1>
            {baseSnapshot.tenant.sponsorDisclosure && (
              <p className="mt-1 rounded bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900 border border-emerald-200">
                이해관계 공시: {baseSnapshot.tenant.sponsorDisclosure}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
            >
              <option value="ten-seoulmiso">서울미소안과의원 (병의원)</option>
              <option value="ten-hanbitbio">한빛바이오텍 (민간 기업)</option>
              <option value="ten-gwfound">강원문화관광재단 (준공공 · 공시 완료)</option>
            </select>
            <Link
              href="/studio"
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              스토어프론트 (/studio)
            </Link>
            <Link
              href="/ops/maps"
              className="rounded-lg border border-slate-300 bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-200"
            >
              운영 어드민 (/ops/maps)
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {/* 1. 4대 헤드라인 지표 + 무인용 단언 분리 (MAPS-INV-02, MAPS-INV-20) */}
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              1. 4대 헤드라인 지표 (단일 합산 점수 없음 · Wilson 95% 신뢰 구간 · 반복 노이즈 마루 σ_rep ={' '}
              {metrics.repeatNoiseFloor})
            </h2>
            <span className="text-xs text-slate-500">
              MAPS-INV-20: 공식 인용 없는 단언(asserted)은 정본 일치율 분자에서 제외됩니다.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">
                존재율 (Presence)
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {(metrics.presenceRate.rate * 100).toFixed(1)}%
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                95% CI {(metrics.presenceRate.ci95Low * 100).toFixed(1)}–
                {(metrics.presenceRate.ci95High * 100).toFixed(1)}% (n=
                {metrics.presenceRate.denominator})
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-emerald-800">
                정본 일치율 (Factual + 공식 인용)
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-700">
                {(metrics.factualRate.rate * 100).toFixed(1)}%
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                95% CI {(metrics.factualRate.ci95Low * 100).toFixed(1)}–
                {(metrics.factualRate.ci95High * 100).toFixed(1)}% (correct만 산입)
              </div>
            </div>

            <div className="rounded-xl border border-sky-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-sky-800">
                무인용 단언 비율 (Asserted 분리)
              </div>
              <div className="mt-1 text-2xl font-bold text-sky-700">
                {(metrics.assertedRate.rate * 100).toFixed(1)}%
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                값은 맞으나 공식 인용 부재 ({metrics.assertedRate.numerator}건)
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-amber-800">
                구버전 지연 (Outdated Lag)
              </div>
              <div className="mt-1 text-2xl font-bold text-amber-700">
                평균 {metrics.avgLagDays ?? 0}일
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                구버전 응답 비율 {(metrics.outdatedRate.rate * 100).toFixed(1)}%
              </div>
            </div>

            <div className="rounded-xl border border-red-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-red-800">
                피해 위험 비율 (Harm Risk)
              </div>
              <div className="mt-1 text-2xl font-bold text-red-700">
                {(metrics.harmRiskRate.rate * 100).toFixed(1)}%
              </div>
              <div className="mt-1 text-[11px] text-red-700 font-medium">
                고위험 하한선 위반 {metrics.limitViolationCount}건
              </div>
            </div>
          </div>
        </section>

        {/* 2. 관측 시점(as-of) 6분류 판정 & 1클릭 [정본 고치기] */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                2. 관측 시점(as-of) 6분류 판정 내역 & 1클릭 [정본 고치기]
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                응답 원문 전문은 비공개 보관소(<code>raw_ref</code>)에 격리되며 화면에는 정본 대조 판정과 해시만 표시됩니다(INV-6).
                AI 엔진명은 편향 방지를 위해 <code>svc-A</code>, <code>svc-B</code> 로 블라인드 표기됩니다(MAPS-INV-11).
              </p>
            </div>
          </div>

          {revisionToast && (
            <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs font-medium text-emerald-950">
              {revisionToast}
            </div>
          )}

          {objectionToast && (
            <div className="mt-4 rounded-lg border border-indigo-300 bg-indigo-50 p-3 text-xs font-medium text-indigo-950">
              {objectionToast}
            </div>
          )}

          {editingPropKey && (
            <div className="mt-4 rounded-lg border border-indigo-300 bg-indigo-50 p-4">
              <div className="text-xs font-bold text-indigo-950">
                [정본 고치기 · 미래 예고 등록] 대상 속성: {editingPropKey}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">
                    신규 정본 값 (value_raw)
                  </label>
                  <input
                    type="text"
                    value={newValueRaw}
                    onChange={(e) => setNewValueRaw(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">
                    효력 시작일 (valid_from · 미래 예고 가능)
                  </label>
                  <input
                    type="text"
                    value={newEffectiveFrom}
                    onChange={(e) => setNewEffectiveFrom(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={handleAppendFactVersion}
                    className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Append-Only 새 정본 버전 등록
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPropKey(null)}
                    className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2.5">관측 ID (엔진·언어)</th>
                  <th className="px-3 py-2.5">속성 · 기준 정본 버전</th>
                  <th className="px-3 py-2.5">6분류 판정 (색상+기호+라벨)</th>
                  <th className="px-3 py-2.5">판정 근거 및 지연 일수</th>
                  <th className="px-3 py-2.5">조치</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {baseSnapshot.judgments.map((j) => {
                  const obs = baseSnapshot.observations.find(
                    (o) => o.observationId === j.observationId
                  );
                  const meta = MAPS_VERDICT_META[j.verdict];
                  return (
                    <tr key={j.judgmentId} className="hover:bg-slate-50">
                      <td className="px-3 py-3 font-mono text-[11px]">
                        <div className="font-semibold text-slate-900">
                          {j.observationId} ({obs?.maskedEngineLabel} · {obs?.lang})
                        </div>
                        <div className="text-slate-400">{obs?.rawHash.slice(0, 22)}…</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-900">
                          {j.propKey}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          as-of: {j.asOfFactVersionId ?? '없음'} · 인용: {j.citationClass}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold ${meta.badgeClass}`}
                        >
                          {meta.symbol} {meta.labelKo}
                        </span>
                        {j.limitViolation && (
                          <span className="ml-1.5 inline-flex rounded bg-red-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            하한선 위반
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {j.rationale}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOneClickFactFix(j.propKey)}
                            className="rounded border border-indigo-300 bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-800 hover:bg-indigo-100"
                          >
                            [정본 고치기]
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setObjectionToast(
                                `판정(${j.judgmentId})에 대한 이의 신청이 접수되었습니다. 기존 판정 행을 덮어쓰지 않고 재심 후 supersedes_judgment_id로 새 판정이 추가됩니다(MAPS-INV-04).`
                              )
                            }
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-700 hover:bg-slate-100"
                          >
                            이의 신청
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. 이원 시간(Bitemporal) 정본 대장 & 미래 예고된 변화 */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            3. 이원 시간(Bitemporal) 정본 대장 — 과거 만료 · 현행 유효 · 미래 예고(valid_from &gt; now)
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            모든 정본 버전은 삭제나 덮어쓰기 없이 추가(Append-Only)되며, 확인 수준(<code>confirm_level</code>)과 공식 근거 URL을 동반합니다.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {ledger.map((fv) => {
              const isFuture = Date.parse(fv.validFrom) > Date.parse('2026-10-23T12:00:00Z');
              const isExpired =
                fv.validTo !== null &&
                Date.parse(fv.validTo) <= Date.parse('2026-10-23T12:00:00Z');
              return (
                <div
                  key={fv.factVersionId}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800">
                      {fv.factVersionId} · {fv.propKey}
                    </span>
                    {isFuture ? (
                      <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 font-semibold text-indigo-800">
                        예고된 변화 (미래 효력)
                      </span>
                    ) : isExpired ? (
                      <span className="rounded-full bg-slate-200 px-2.5 py-0.5 font-semibold text-slate-700">
                        기간 만료 (구버전 대조용 보존)
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-800">
                        현행 유효 정본
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-900">
                    {fv.valueRaw}
                  </div>
                  <div className="mt-1 text-slate-600">
                    유효 기간(Valid): {fv.validFrom.slice(0, 10)} ~{' '}
                    {fv.validTo ? fv.validTo.slice(0, 10) : '현재'}
                  </div>
                  <div className="mt-0.5 text-slate-500">
                    확인 수준: {fv.confirmLevel} ({fv.confirmedBy ?? '시스템'}) · 출처:{' '}
                    <code>{fv.sourceUrl}</code>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. G1~G6 간극 작업함 & 6단계 소거 처방전 + 5요소 우선순위 (MAPS-INV-09) */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                4. G1~G6 간극 작업함 & 6단계 원인 소거 처방전 (5대 우선순위 요소 분해 표기 · MAPS-INV-09)
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                메운 간극 1건당 평균 소요: <strong>{costEfficiency.minutesPerGapClosed}분</strong> ·
                메운 간극 1건당 평균 원가: <strong>{costEfficiency.costPerGapClosedKrw?.toLocaleString()}원</strong>
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {gapTasks.map((task) => {
              const gMeta = MAPS_GAP_META[task.gapType];
              const sMeta = MAPS_STAGE_PRESCRIPTION_META[task.diagnosisStage];
              const comp = task.priorityComponents;
              return (
                <div
                  key={task.gapTaskId}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-900">
                        {gMeta.code} · {gMeta.labelKo}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {task.propLabel} ({task.propKey})
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      우선순위 결합값: {task.priority.toFixed(3)} (영향 엔진:{' '}
                      {task.affectedEngineLabels.join(', ')})
                    </span>
                  </div>

                  {/* MAPS-INV-09: 5대 우선순위 구성요소 명시 */}
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                    <span className="rounded bg-slate-100 px-2 py-0.5">
                      수요(demand): {comp.demand}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5">
                      간극(gap): {comp.gap}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5">
                      피해위험(harm): {comp.harm}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5">
                      이행성(feasibility): {comp.feasibility}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5">
                      비용효율(cost): {comp.cost}
                    </span>
                  </div>

                  <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs">
                    <div className="font-bold text-slate-800">
                      소거 진단: {sMeta.stageLabelKo} → 처방({task.prescriptionCode}):{' '}
                      {task.prescriptionTitle}
                    </div>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-slate-600">
                      {task.prescriptionSteps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. 5대 편향 렌즈 & Proof 대조군 전후 검증 (MAPS-INV-07) */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">
              5. 5대 편향 렌즈 (L1~L5)
            </h2>
            <div className="mt-4 space-y-2.5">
              {biasLenses.map((b) => (
                <div
                  key={b.lens}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs"
                >
                  <div className="font-bold text-slate-900">
                    {MAPS_BIAS_LENS_META[b.lens].labelKo}
                  </div>
                  <div className="mt-0.5 text-slate-600">{b.summaryTextKo}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">
              6. Proof · 대조군 동반 개입 전후 효과 검증 (DiD · MAPS-INV-07)
            </h2>
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-950">
              <div className="font-bold">
                상태: {proofEffect.status} · 카나리아 드리프트:{' '}
                {proofEffect.modelUpdateDetected ? '감지됨(구간 분리)' : '안정'}
              </div>
              <p className="mt-1.5">{proofEffect.interpretationKo}</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
              <div className="rounded border border-slate-200 p-3">
                <div className="text-slate-500">개입군 전→후</div>
                <div className="mt-1 font-bold text-slate-900">
                  {(proofEffect.treatedPreRate * 100).toFixed(0)}% →{' '}
                  {(proofEffect.treatedPostRate * 100).toFixed(0)}%
                </div>
              </div>
              <div className="rounded border border-slate-200 p-3">
                <div className="text-slate-500">비개입 대조군 전→후</div>
                <div className="mt-1 font-bold text-slate-900">
                  {((proofEffect.controlPreRate ?? 0) * 100).toFixed(0)}% →{' '}
                  {((proofEffect.controlPostRate ?? 0) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="rounded border border-indigo-200 bg-indigo-50 p-3">
                <div className="text-indigo-800">대조군 차감 순변화(DiD)</div>
                <div className="mt-1 font-bold text-indigo-900">
                  +{((proofEffect.didNetEffect ?? 0) * 100).toFixed(1)}%p
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
