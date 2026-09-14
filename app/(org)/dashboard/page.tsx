'use client';

// app/(org)/dashboard/page.tsx
// FR-44: 기관 전용 진단 대시보드 (사전통지 및 판정 결과 열람)
// 불변식: 점수순 정렬 금지(INV-3), 타 기관과의 임의 서열화 금지

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  ExternalLink,
  Info,
  Calendar,
} from 'lucide-react';
import clsx from 'clsx';

export default function OrgDashboardPage() {
  const [selectedAgency, setSelectedAgency] = useState('수원특례시');

  // 모의 기관 진단 지표
  const agencyMetrics = {
    agencyHandle: 'AG-0023',
    agencyDisplay: selectedAgency,
    profileId: 'RP-2026Q3-A',
    observedWindow: '2026-09-08 ~ 2026-09-14',
    ledgerAsOf: '2026-09-14',
    notifiedAt: '2026-09-14T09:00:00Z',
    reviewClosedAt: '2026-09-28T18:00:00Z', // 사전통지 14일 열람 기간
    totalQuestions: 30,
    matchedCount: 22,
    mismatchCount: 4,
    notConfirmedCount: 4,
    canonAbsentCount: 2,
    publicSourceRate: 75,
  };

  const nonresponseDistribution = [
    { code: 'N1', label: '기술 차단', count: 1, desc: '선별 robots.txt 정책' },
    { code: 'N2', label: '내용 부재', count: 2, desc: '관련 공고 웹페이지 부재' },
    { code: 'N3', label: '형식 미비', count: 1, desc: 'PDF 첨부파일 텍스트화 미흡' },
    { code: 'N4', label: '경쟁 배제', count: 0, desc: '비공개 대상' },
    { code: 'N5', label: '엔진 회피', count: 0, desc: 'AI 모델 답변 거부' },
  ];

  const mismatchDistribution = [
    { code: 'C0', label: '원장 미대조', count: 1 },
    { code: 'C1', label: '수치 불일치', count: 1 },
    { code: 'C2', label: '사설 출처 왜곡', count: 1 },
    { code: 'C3', label: '시점 어긋남 (과거 정보)', count: 1 },
    { code: 'C4', label: '대상 혼동', count: 0 },
  ];

  const canonAbsentItems = [
    {
      id: 'COR-0007',
      title: '노인 보청기 지원 사업 신청 기준 및 지원금액',
      ownerRole: '본청 소관 (agency_hq)',
      tier: '직접 개선 가능 (direct)',
      prescription: '보건복지과 누리집 내 단독 질의응답 웹문서 발행 권고',
    },
    {
      id: 'COR-0019',
      title: '관내 공영주차장 주말 무료 개방 시간표',
      ownerRole: '도시공사 소관 (affiliate)',
      tier: '산하기관 협조 필요 (affiliate)',
      prescription: '도시공사 주차포털 API 또는 FAQ 텍스트 정본 배포',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#0a1628] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* 상단 브레드크럼 & 기관 선택 바 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-[#c9a84c]" />
            <div>
              <span className="text-xs text-gray-500 block">소관 기관 진단 뷰어</span>
              <span className="font-bold text-[#0a1628] text-base">{agencyMetrics.agencyDisplay} ({agencyMetrics.agencyHandle})</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">기관 전환:</span>
            {['수원특례시', '논산시', '완도군', '증평군'].map(city => (
              <button
                key={city}
                onClick={() => setSelectedAgency(city)}
                className={clsx(
                  "px-2.5 py-1 rounded-md transition-colors",
                  selectedAgency === city ? "bg-[#0a1628] text-white font-bold" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                )}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* 사전통지 상태 알림 배너 */}
        <div className="bg-navy-950 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#c9a84c]/20 text-[#c9a84c] text-xs font-bold">
              <Clock className="w-3.5 h-3.5" /> 사전 통지 열람 및 이의신청 기간
            </div>
            <h1 className="text-2xl font-bold">2026년 3분기 공식 통보서 (RP-2026Q3-A)</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              전국 공표문 발행 전, 소관 지자체에게 14일간 판정 결과와 정본 부재 내역을 사전 제공합니다 (INV-8).
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0 text-xs">
            <div className="bg-white/10 p-3 rounded-xl border border-white/15">
              <span className="text-slate-400 block">열람 마감일</span>
              <span className="font-mono font-bold text-white text-sm">2026-09-28 18:00</span>
            </div>
            <Link
              href="/corrections"
              className="bg-[#c9a84c] text-[#0a1628] hover:bg-[#b59539] font-bold px-4 py-3 rounded-xl transition-all shadow-sm flex items-center gap-1"
            >
              정정/소명 접수 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 1. 핵심 진단 지표 4단 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs text-gray-500 font-medium block mb-1">판정 일치율</span>
            <div className="text-2xl font-black text-emerald-700">
              {Math.round((agencyMetrics.matchedCount / agencyMetrics.totalQuestions) * 100)}%
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              {agencyMetrics.matchedCount}건 일치 / 총 {agencyMetrics.totalQuestions}문항
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs text-gray-500 font-medium block mb-1">정본 부재 (Absent)</span>
            <div className="text-2xl font-black text-amber-600">
              {agencyMetrics.canonAbsentCount}건
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              공적 발행 부재 확인 항목
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs text-gray-500 font-medium block mb-1">무응답 / 부정합</span>
            <div className="text-2xl font-black text-rose-600">
              {agencyMetrics.mismatchCount + agencyMetrics.notConfirmedCount}건
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              부정합 {agencyMetrics.mismatchCount}건 · 대조불가 {agencyMetrics.notConfirmedCount}건
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs text-gray-500 font-medium block mb-1">공적 출처 인용률</span>
            <div className="text-2xl font-black text-[#0a1628]">
              {agencyMetrics.publicSourceRate}%
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              공식 도메인 기반 AI 답변 비중
            </span>
          </div>
        </div>

        {/* 2. 귀책 및 부정합 코드 분포 분석 바 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* N1~N5 무응답 귀책 분포 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-[#0a1628] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                무응답 귀책 코드 분포 (N1~N5)
              </h2>
              <span className="text-xs text-gray-400">제3절 산출물</span>
            </div>
            <p className="text-xs text-gray-500">
              단순히 답변이 나오지 않은 빈칸을 합산하지 않고, 사유별로 분리 집계합니다.
            </p>
            <div className="space-y-3 pt-2">
              {nonresponseDistribution.map(item => (
                <div key={item.code} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-700">
                      <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-mono mr-1.5">{item.code}</span>
                      {item.label}
                    </span>
                    <span className="text-gray-500">{item.count}건 ({item.desc})</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all"
                      style={{ width: `${(item.count / 4) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* C0~C4 부정합 코드 분포 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-[#0a1628] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                부정합 코드 분포 (C0~C4)
              </h2>
              <span className="text-xs text-gray-400">규칙 판정 결과</span>
            </div>
            <p className="text-xs text-gray-500">
              원장 사실 기준(Ground Truth)과 불일치한 항목의 세부 오류 유형입니다.
            </p>
            <div className="space-y-3 pt-2">
              {mismatchDistribution.map(item => (
                <div key={item.code} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-700">
                      <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono mr-1.5">{item.code}</span>
                      {item.label}
                    </span>
                    <span className="text-gray-500">{item.count}건</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${(item.count / 4) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. 정본 부재 영역과 그 귀속 (제1절) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-[#0a1628] flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#c9a84c]" />
                제1절 정본 부재 영역 및 개선 권한 귀속 (Canon Absence)
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                AI가 답변할 수 없는 이유가 누리집의 미발행 때문인 경우, 개선할 권한을 가진 소관 주체를 명시합니다.
              </p>
            </div>
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold">
              {canonAbsentItems.length}건 식별됨
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {canonAbsentItems.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold bg-[#0a1628] text-white px-2 py-0.5 rounded">
                      {item.id}
                    </span>
                    <span className="font-bold text-gray-900 text-sm">{item.title}</span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white border border-amber-300 text-amber-900 font-semibold">
                    {item.tier}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-amber-200/60 text-gray-600">
                  <span><strong>소관 주체:</strong> {item.ownerRole}</span>
                  <span className="text-emerald-800 font-medium">💡 {item.prescription}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. 이의 제기 및 신규 측정 액션 바 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-gray-200">
          <div className="text-xs text-gray-500">
            * 본 진단서는 비공개 기관 통보서이며, 사실과 다른 판정이 있을 경우 사전 통지 기간 내 소명할 수 있습니다.
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/measure/spec-${encodeURIComponent(selectedAgency)}`}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-100 rounded-xl text-xs font-semibold transition-colors"
            >
              실시간 재진단 파이프라인
            </Link>
            <Link
              href="/corrections"
              className="px-4 py-2 bg-[#0a1628] text-white hover:bg-[#15243b] rounded-xl text-xs font-semibold transition-colors"
            >
              정정 신청 제출
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
