// app/(public)/dashboard/reports/page.tsx
// FR-71: 시민 제보 현황 군집화 대시보드
// AGENTS.md 불변식 준수:
// - INV-1: 두 모집단(local_gov / special_zone) 합산 금지, 분리 탭 조회
// - INV-3: 점수/제보수로 정렬 금지, 행정구역 코드순 정렬
// - INV-4: 자발적 표본에 대해 "참여한 N곳 중..." 하드코딩 표기
// - INV-11: 탐색적 관측 및 자발적 표본 한계 명시

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  PlusCircle,
  ShieldAlert,
  HelpCircle,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import type { Population, Layer2ReportStat } from '@/lib/types/layers';
import {
  REPORT_SYNDROME_LABELS,
  type ReportCluster,
  type ReportSyndrome,
} from '@/lib/types/citizen-report';

export default function ReportsDashboardPage() {
  const [population, setPopulation] = useState<Population>('local_gov');
  const [loading, setLoading] = useState(true);
  const [stat, setStat] = useState<Layer2ReportStat | null>(null);
  const [clusters, setClusters] = useState<ReportCluster[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchAggregateData = async (pop: Population) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/report/aggregate?population=${pop}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setStat(data.stat);
        setClusters(data.clusters);
      } else {
        setError(data.error || '데이터를 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAggregateData(population);
  }, [population]);

  const syndromes: ReportSyndrome[] = [
    'confabulation',
    'stale_fact',
    'generic_drift',
    'cross_unit',
    'wrong_number',
    'other',
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10 animate-fade-in-up">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Layer 2 · 시민 크라우드소싱 조기 경보 대시보드
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            시민 제보 엣지 케이스 클러스터
          </h1>
          <p className="text-sm text-slate-600">
            현장 시민들이 발견한 AI의 환각·오답 제보를 지자체별·증상별로 군집화하여 표준 검증 프로브로 승격시킵니다.
          </p>
        </div>

        <Link
          href="/report"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-950 hover:bg-navy-900 text-gold-300 hover:text-gold-200 rounded-xl text-xs font-bold shadow-md transition-all shrink-0 hover:scale-105"
        >
          <PlusCircle className="w-4 h-4" />
          <span>오답 제보하기 (Floor Hunter)</span>
        </Link>
      </div>

      {/* INV-1 준수: 모집단 분리 토글 (합산 뷰 없음) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setPopulation('local_gov')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            population === 'local_gov'
              ? 'bg-navy-950 text-gold-300 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          자치단체 (기초·광역)
        </button>
        <button
          type="button"
          onClick={() => setPopulation('special_zone')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            population === 'special_zone'
              ? 'bg-navy-950 text-gold-300 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          특별구역 (경제자유구역청)
        </button>
      </div>

      {/* INV-4 규약 배너 */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed space-y-1 shadow-sm">
        <div className="font-bold text-navy-950 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-gold-600" />
          통계적 해석 주의사항 (AGENTS.md INV-4, K06 규약)
        </div>
        <p className="text-slate-600">
          본 화면의 통계는 자발적으로 참여한 시민의 제보로 산출된 <strong>Layer 2 데이터</strong>입니다.
          자기선택 편향(Self-selection bias)이 존재하므로 모든 수치는 반드시 <strong>"참여한 N곳 중..."</strong>으로만 표기하며, 전국을 대표하는 통계로 해석할 수 없습니다.
        </p>
      </div>

      {loading && (
        <div className="py-20 text-center text-slate-400 text-sm">
          시민 제보 데이터를 집계 중입니다...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold">
          {error}
        </div>
      )}

      {!loading && stat && (
        <div className="space-y-8">
          {/* 핵심 지표 카드 4종 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. 참여 단위 수 (INV-4: 분모는 '참여한 단위 수') */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                참여 단위 수
              </span>
              <div className="text-3xl font-extrabold text-navy-950">
                {stat.participatingUnits}
                <span className="text-xs text-slate-400 font-normal ml-1">곳</span>
              </div>
              <p className="text-[11px] text-slate-500">
                제보가 접수된 {population === 'local_gov' ? '자치단체' : '특별구역'}
              </p>
            </div>

            {/* 2. 총 제보 건수 */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                누적 오답 제보
              </span>
              <div className="text-3xl font-extrabold text-navy-950">
                {stat.totalReports}
                <span className="text-xs text-slate-400 font-normal ml-1">건</span>
              </div>
              <p className="text-[11px] text-slate-500">
                시민이 직접 관측한 누적 제보
              </p>
            </div>

            {/* 3. 작화(Floor Risk critical) 건수 */}
            <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                작화 (Critical Floor)
              </span>
              <div className="text-3xl font-extrabold text-rose-950">
                {stat.confabulationCount}
                <span className="text-xs text-rose-700 font-normal ml-1">건</span>
              </div>
              <p className="text-[11px] text-rose-800">
                {stat.totalReports > 0
                  ? `전체 제보의 ${Math.round((stat.confabulationCount / stat.totalReports) * 100)}%`
                  : '0%'}
              </p>
            </div>

            {/* 4. Layer 3 승격 건수 */}
            <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                승격 검증 프로브
              </span>
              <div className="text-3xl font-extrabold text-indigo-950">
                {stat.promotedCount}
                <span className="text-xs text-indigo-700 font-normal ml-1">건</span>
              </div>
              <p className="text-[11px] text-indigo-800">
                Layer 3 정밀 실측 프로브 전환
              </p>
            </div>
          </div>

          {/* 증상군 분포 바 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy-950">
              실패 증상군별 분포 (참여한 {stat.participatingUnits}곳 중)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {syndromes.map((syn) => {
                const count = stat.syndromeDistribution[syn] || 0;
                const meta = REPORT_SYNDROME_LABELS[syn];
                const pct =
                  stat.totalReports > 0 ? Math.round((count / stat.totalReports) * 100) : 0;

                return (
                  <div
                    key={syn}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-navy-950">
                      <span>{meta.label.split(' ')[0]}</span>
                      <span className="font-mono text-slate-500">
                        {count}건 ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-navy-950 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{meta.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 지자체별 제보 클러스터 목록 (INV-3 준수: 행정구역 코드순 정렬) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy-950">
                  단위별 엣지 케이스 제보 현황
                </h2>
                <p className="text-xs text-slate-500">
                  행정구역 코드순으로 정렬되어 있습니다. 점수나 제보 순위로 정렬하지 않습니다 (AGENTS.md INV-3).
                </p>
              </div>
              <span className="text-xs text-slate-400">
                참여한 {clusters.length}곳 표시
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">지자체명</th>
                      <th className="py-3 px-3 text-center">총 제보</th>
                      <th className="py-3 px-3 text-center">작화 발생</th>
                      <th className="py-3 px-3">주요 제보 질문</th>
                      <th className="py-3 px-3 text-center">승격 상태</th>
                      <th className="py-3 px-4 text-right">최근 제보</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clusters.map((c) => (
                      <tr key={c.unitId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-navy-950">
                          <div>{c.unitName}</div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {c.unitId}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-navy-950">
                          {c.totalReports}건
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {c.confabulationCount > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              {c.confabulationCount}건 (위험)
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 max-w-xs">
                          {c.topPrompts.length > 0 ? (
                            <div className="space-y-1">
                              {c.topPrompts.slice(0, 2).map((p, idx) => (
                                <div
                                  key={idx}
                                  className="text-[11px] text-slate-700 truncate"
                                  title={p.prompt}
                                >
                                  • {p.prompt}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {c.promotionEligible ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[10px] border border-indigo-200">
                              <Sparkles className="w-3 h-3" />
                              승격 적격
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">데이터 수집 중</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500 text-[11px]">
                          {c.latestReportDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
