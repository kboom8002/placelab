'use client';

// app/(public)/measure/spec-[agencyId]/page.tsx
// measurement-spec 4칸 엔진 기반 공식 규격 진단 실행 및 5대 절 산출물 뷰어 페이지
// 파이프라인: collector → extractor → verifier(rule-only) → grid-analyzer → output-generator

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Layers,
  Database,
  ShieldCheck,
  Building2,
  BarChart,
  Home,
} from 'lucide-react';
import clsx from 'clsx';
import type { Output } from '@/lib/types/measurement-spec';
import { SpecOutputViewer } from '@/components/reports/SpecOutputViewer';

interface PipelineStages {
  questions_loaded: number;
  observations_created: number;
  verdicts_created: number;
  grid_rows: number;
  canon_absent_count: number;
}

interface SpecApiResponse {
  simulation: boolean;
  agency: {
    handle: string;
    display: string;
    type: string;
  };
  profile: {
    id: string;
    model: string;
  };
  pipeline_stages: PipelineStages;
  output: Output;
  method_version: string;
  measured_at: string;
}

export default function SpecMeasurementPage() {
  const params = useParams();
  const router = useRouter();

  // params.agencyId는 URL 인코딩되어 있을 수 있음
  const rawAgencyParam = (params.agencyId as string) || '';
  const agencyQuery = decodeURIComponent(rawAgencyParam);

  const [phase, setPhase] = useState<'ready' | 'running' | 'complete' | 'error'>('ready');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [result, setResult] = useState<SpecApiResponse | null>(null);

  const STEPS = [
    { name: '1. 수집 (Collector)', desc: 'robots.txt 접근성 검사 및 원문 무손실 보존' },
    { name: '2. 추출 (Extractor)', desc: '언어 모형 기반 진술 및 사실관계 추출' },
    { name: '3. 판정 (Verifier)', desc: '규칙 원장 대조만 허용 (judged_by: rule 강제)' },
    { name: '4. 격자 및 산출물 (Grid & Output)', desc: '정본 부재 귀속 및 5대 절 고정 산출물 조립' },
  ];

  const handleRunSpec = async () => {
    setPhase('running');
    setCurrentStep(0);
    setErrorMsg('');

    try {
      // 4단계 시각화 딜레이 효과
      const stepTimer = setInterval(() => {
        setCurrentStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 400);

      const response = await fetch('/api/measure/spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_handle: agencyQuery,
          run_profile_id: 'RP-2026Q3-A',
          channel: 'agency_notice',
          ledger_as_of: new Date().toISOString().slice(0, 10),
          simulation: true,
        }),
      });

      clearInterval(stepTimer);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `측정 실패 (HTTP ${response.status})`);
      }

      const data: SpecApiResponse = await response.json();
      setCurrentStep(3);
      setResult(data);
      setPhase('complete');
    } catch (err: any) {
      setErrorMsg(err.message || '측정 중 예기치 않은 오류가 발생했습니다.');
      setPhase('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#0a1628] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* 브레드크럼 */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-900 flex items-center gap-1">
            <Home className="w-3.5 h-3.5" /> 홈
          </Link>
          <span>/</span>
          <Link href="/measure" className="hover:text-gray-900">
            AI 측정
          </Link>
          <span>/</span>
          <span className="text-[#0a1628] font-bold">규격 진단 ({agencyQuery})</span>
        </div>

        {/* 상단 헤더 배너 */}
        <div className="bg-[#0a1628] text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-[#c9a84c]/20 text-[#c9a84c]">
                <FileCheck2 className="w-6 h-6" />
              </span>
              <div>
                <span className="text-xs font-bold text-[#c9a84c] tracking-wider uppercase">
                  MEASUREMENT SPEC · v1.0
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {result?.agency.display || agencyQuery} 규격 진단
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-white/10 text-white/90 text-xs px-3 py-1.5 rounded-full border border-white/15">
                프로필: RP-2026Q3-A
              </span>
              <span className="bg-[#c9a84c] text-[#0a1628] text-xs px-3 py-1.5 rounded-full font-bold">
                시뮬레이션 모드
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
            언어 모델의 자의적 평가를 금지하고, 
            <strong> 엄격한 사실 기준(Ground Truth)과 규칙 기반 대조(judged_by: rule)</strong>를 
            통해 5대 절 고정 산출물을 도출하는 공식 측정 체계입니다.
          </p>
        </div>

        {/* Phase 1: 준비 (ready) */}
        {phase === 'ready' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-[#c9a84c]/10 text-[#c9a84c] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">4칸 파이프라인 진단 시작 준비 완료</h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-8">
              선택한 기관 <strong className="text-[#0a1628]">[{agencyQuery}]</strong>에 대한 
              SSOT 문항 로드 및 4칸 파이프라인 시뮬레이션 진단을 실행합니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8 text-left">
              <div className="p-4 rounded-xl bg-[#f8f7f4] border border-gray-200">
                <span className="text-xs text-gray-400 block mb-1">대상 기관</span>
                <span className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#c9a84c]" /> {agencyQuery}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#f8f7f4] border border-gray-200">
                <span className="text-xs text-gray-400 block mb-1">판정 방식</span>
                <span className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> 규칙 원장 대조
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#f8f7f4] border border-gray-200">
                <span className="text-xs text-gray-400 block mb-1">산출물 규격</span>
                <span className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-600" /> 5대 절 고정 산출
                </span>
              </div>
            </div>

            <button
              onClick={handleRunSpec}
              className="bg-[#c9a84c] text-[#0a1628] hover:bg-[#b59539] font-bold text-lg px-10 py-3.5 rounded-xl shadow-md transition-all inline-flex items-center gap-2"
            >
              <FileCheck2 className="w-5 h-5" /> 규격 진단 파이프라인 가동
            </button>
          </div>
        )}

        {/* Phase 2: 실행 중 (running) */}
        {phase === 'running' && (
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-center">
              4칸 파이프라인 순차 가동 중...
            </h2>

            <div className="space-y-4 max-w-xl mx-auto mb-8">
              {STEPS.map((step, idx) => {
                const isDone = idx < currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div
                    key={idx}
                    className={clsx(
                      'p-4 rounded-xl border transition-all flex items-center gap-4',
                      isDone
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : isCurrent
                        ? 'bg-[#c9a84c]/10 border-[#c9a84c] text-[#0a1628]'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                    )}
                  >
                    <div className="shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-6 h-6 text-[#c9a84c] animate-spin" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{step.name}</div>
                      <div className="text-xs opacity-75">{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Phase 3: 완료 (complete) */}
        {phase === 'complete' && result && (
          <div className="space-y-8">
            {/* 파이프라인 단계 요약 뱃지 바 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b pb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  파이프라인 단계별 처리 결과
                </span>
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 전 과정 검증 완료
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-gray-50">
                  <span className="text-[11px] text-gray-400 block">코어 문항 로드</span>
                  <span className="font-bold text-gray-800 text-base">
                    {result.pipeline_stages.questions_loaded}건
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50">
                  <span className="text-[11px] text-gray-400 block">관측 레코드</span>
                  <span className="font-bold text-gray-800 text-base">
                    {result.pipeline_stages.observations_created}건
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50">
                  <span className="text-[11px] text-gray-400 block">규칙 판정(Rule)</span>
                  <span className="font-bold text-emerald-700 text-base">
                    {result.pipeline_stages.verdicts_created}건
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50">
                  <span className="text-[11px] text-gray-400 block">격자 행(Grid)</span>
                  <span className="font-bold text-gray-800 text-base">
                    {result.pipeline_stages.grid_rows}건
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50">
                  <span className="text-[11px] text-amber-700 block">정본 부재(Absent)</span>
                  <span className="font-bold text-amber-900 text-base">
                    {result.pipeline_stages.canon_absent_count}건
                  </span>
                </div>
              </div>
            </div>

            {/* 5대 절 렌더러 컴포넌트 마운트 */}
            <SpecOutputViewer output={result.output} />

            {/* 하단 액션 버튼 */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setPhase('ready')}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> 재진단 실행
              </button>
              <div className="flex items-center gap-3">
                <Link
                  href="/measure"
                  className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-xl text-sm font-semibold transition-colors"
                >
                  다른 지자체 선택
                </Link>
                <Link
                  href="/reports"
                  className="px-5 py-2.5 bg-[#0a1628] text-white hover:bg-[#15243b] rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
                >
                  <BarChart className="w-4 h-4" /> 진단 보고서 갤러리 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Phase 4: 오류 (error) */}
        {phase === 'error' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-rose-200 shadow-sm text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-rose-900 mb-2">규격 진단 실행 실패</h2>
            <p className="text-sm text-rose-700 max-w-md mx-auto mb-6 bg-rose-50 p-3 rounded-lg">
              {errorMsg}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleRunSpec}
                className="px-6 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors"
              >
                다시 시도
              </button>
              <Link
                href="/measure"
                className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                측정 첫 화면으로
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
