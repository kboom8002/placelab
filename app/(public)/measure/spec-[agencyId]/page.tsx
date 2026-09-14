'use client';

// app/(public)/measure/spec-[agencyId]/page.tsx
// measurement-spec 4칸 엔진 기반 공식 규격 진단 실행, SSE 실시간 스트리밍 및 VIP 보고서/5대절 산출물 뷰어

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
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
  Home,
  Bot,
  Copy,
  Download,
  Eye,
  FileText,
  Sparkles,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';
import { marked } from 'marked';
import type { Output } from '@/lib/types/measurement-spec';
import { SpecOutputViewer } from '@/components/reports/SpecOutputViewer';

interface ProgressData {
  phase: string;
  provider?: string;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  currentAttempt?: number;
  totalAttempts?: number;
  questionId?: string;
  questionText?: string;
  verdictResult?: 'match' | 'mismatch' | 'not_confirmed';
  detail?: string;
}

interface CompletedData {
  jobId: string;
  result: any;
  vipReport: string;
  techReport: string;
  summary?: any;
}

function SpecMeasurementContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawAgencyParam = (params.agencyId as string) || '';
  const agencyQuery = decodeURIComponent(rawAgencyParam);

  const jobIdFromQuery = searchParams.get('jobId');
  const isSimFromQuery = searchParams.get('sim') === 'true';

  const [phase, setPhase] = useState<'ready' | 'running' | 'complete' | 'error'>(
    jobIdFromQuery ? 'running' : 'ready'
  );
  const [activeTab, setActiveTab] = useState<'vip' | 'spec'>('vip');
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [completedResult, setCompletedResult] = useState<CompletedData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // 최근 판정 피드 목록
  const [recentLogs, setRecentLogs] = useState<Array<{
    id: string;
    text: string;
    verdict?: string;
    attempt: number;
    provider: string;
  }>>([]);

  const eventSourceRef = useRef<EventSource | null>(null);

  // SSE 스트림 연결 핸들러
  const connectSSE = (jobId: string) => {
    setPhase('running');
    setErrorMsg('');

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/measure/stream/${jobId}`);
    eventSourceRef.current = es;

    es.addEventListener('ready', (e) => {
      console.log('[SSE ready]', e.data);
    });

    es.addEventListener('progress', (e) => {
      try {
        const data: ProgressData = JSON.parse(e.data);
        setProgress(data);

        if (data.questionId && data.verdictResult) {
          setRecentLogs((prev) => [
            {
              id: data.questionId!,
              text: data.questionText || data.questionId!,
              verdict: data.verdictResult,
              attempt: data.currentAttempt || 1,
              provider: data.provider || 'AI',
            },
            ...prev.slice(0, 19), // 최근 20개 유지
          ]);
        }
      } catch (err) {
        console.error('SSE 파싱 에러:', err);
      }
    });

    es.addEventListener('complete', (e) => {
      try {
        const data: CompletedData = JSON.parse(e.data);
        setCompletedResult(data);
        setPhase('complete');
        es.close();
      } catch (err) {
        console.error('완료 데이터 파싱 실패:', err);
      }
    });

    es.addEventListener('error', (e: any) => {
      console.error('[SSE Error]', e);
      // 스트림이 정상 종료되었을 때도 error 이벤트가 발생할 수 있으므로 completed 상태가 아닐 때만 처리
      if (phase !== 'complete') {
        es.close();
        // 데이터 폴링 재시도 또는 에러 메시지
      }
    });
  };

  useEffect(() => {
    if (jobIdFromQuery) {
      connectSSE(jobIdFromQuery);
    } else if (isSimFromQuery) {
      handleRunSimulation();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [jobIdFromQuery, isSimFromQuery]);

  // 시뮬레이션 모드 실행
  const handleRunSimulation = async () => {
    setPhase('running');
    setErrorMsg('');
    setProgress({
      phase: 'collecting',
      detail: '규격 시뮬레이션 모의 파이프라인 가동 중...',
    });

    try {
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

      if (!response.ok) {
        throw new Error('시뮬레이션 진단 실패');
      }

      const data = await response.json();
      setCompletedResult({
        jobId: 'sim-' + Date.now(),
        result: {
          agency: data.agency,
          summaries: [{
            provider: 'openai',
            modelId: data.profile.model,
            output: data.output,
            totalQuestions: 30,
            matchCount: 20,
            mismatchCount: 5,
            notConfirmedCount: 5,
            publicSourceRate: 40,
          }],
        },
        vipReport: `# ${data.agency.display} AI 정보 접근성 모의 진단 보고서\n\n> 규격 시뮬레이션 모드로 생성된 보고서입니다.\n\n## 한눈에 보기\n- 정확도: 66.7% (20/30건)\n- 오류율: 16.7% (5건)\n- 공적 출처 인용률: 40%\n\n## 5대 절 공식 규격 산출물이 함께 도출되었습니다.`,
        techReport: `# ${data.agency.display} 기술 규격 보고서`,
      });
      setPhase('complete');
    } catch (err: any) {
      setErrorMsg(err.message || '오류 발생');
      setPhase('error');
    }
  };

  // 실측 즉시 시작 (준비 화면에서 클릭 시)
  const handleStartLive = async () => {
    setPhase('running');
    setErrorMsg('');

    try {
      const res = await fetch('/api/measure/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_handle: agencyQuery,
          providers: ['gemini'],
          repetitions: 3,
          channel: 'agency_notice',
          simulation: false,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || '실측 등록 실패');
      }

      connectSSE(data.job_id);
    } catch (err: any) {
      setErrorMsg(err.message || '실측 시작 실패');
      setPhase('error');
    }
  };

  const handleCopyMarkdown = () => {
    const text = activeTab === 'vip' ? completedResult?.vipReport : completedResult?.techReport;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const text = activeTab === 'vip' ? completedResult?.vipReport : completedResult?.techReport;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agencyQuery}-${activeTab === 'vip' ? 'VIP보고서' : '기술보고서'}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 진행률 백분율 계산
  const percent = progress?.totalQuestions
    ? Math.min(100, Math.round(((progress.currentQuestionIndex || 0) / progress.totalQuestions) * 100))
    : 10;

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
          <span className="text-[#0a1628] font-bold">{agencyQuery} 실측</span>
        </div>

        {/* 상단 헤더 배너 */}
        <div className="bg-[#0a1628] text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-[#c9a84c]/20 text-[#c9a84c]">
                <Sparkles className="w-6 h-6" />
              </span>
              <div>
                <span className="text-xs font-bold text-[#c9a84c] tracking-wider uppercase">
                  MEASUREMENT SPEC · v1.0 E2E PIPELINE
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {agencyQuery} AI 정보 접근성 실측
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-white/10 text-white/90 text-xs px-3 py-1.5 rounded-full border border-white/15 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>judged_by: rule</span>
              </span>
              <span className={clsx(
                "text-xs px-3 py-1.5 rounded-full font-bold",
                phase === 'running' ? "bg-amber-400 text-amber-950 animate-pulse" : "bg-[#c9a84c] text-[#0a1628]"
              )}>
                {phase === 'running' ? '실시간 측정 중' : phase === 'complete' ? '측정 완료' : '준비'}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
            Google Gemini Search Grounding 및 OpenAI 모델을 통하여 지자체의 생활행정·복지·관광 팩트를 
            실시간 질의하고, 사전 등록된 사실 원장(Ground Truth)과 엄격하게 규칙 대조합니다.
          </p>
        </div>

        {/* 1. 준비 상태 (ready) */}
        {phase === 'ready' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-[#c9a84c]/10 text-[#c9a84c] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">실측 파이프라인 가동 준비</h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-8">
              <strong>[{agencyQuery}]</strong>에 대한 실시간 Search Grounding 실측 또는 
              빠른 구조 검증 시뮬레이션을 선택하세요.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleStartLive}
                className="w-full sm:w-auto bg-[#c9a84c] text-[#0a1628] hover:bg-[#b59539] font-bold text-lg px-8 py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" /> Gemini 정규 실측 시작 (~2분)
              </button>

              <button
                onClick={handleRunSimulation}
                className="w-full sm:w-auto bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-base px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <FileCheck2 className="w-4 h-4" /> 규격 시뮬레이션 (~3초)
              </button>
            </div>
          </div>
        )}

        {/* 2. 실행 중 상태 (running) — 실시간 스트리밍 UI */}
        {phase === 'running' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-[#c9a84c] animate-spin" />
                <div>
                  <h2 className="text-lg font-bold">4칸 파이프라인 실시간 가동 중</h2>
                  <p className="text-xs text-gray-500">{progress?.detail || '수집·추출·판정 단계 순차 실행 중...'}</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-[#0a1628]">{percent}%</span>
            </div>

            {/* 게이지 바 */}
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-[#c9a84c] h-full transition-all duration-300 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>

            {/* 현재 진행 현황 카드 */}
            {progress?.questionId && (
              <div className="p-4 rounded-xl bg-[#f8f7f4] border border-gray-200 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#0a1628] bg-white px-2 py-0.5 rounded border border-gray-300">
                      {progress.questionId}
                    </span>
                    <span className="text-xs text-gray-500">
                      질문 {progress.currentQuestionIndex} / {progress.totalQuestions}
                    </span>
                    <span className="text-xs text-blue-600 font-semibold">
                      회차 {progress.currentAttempt} / {progress.totalAttempts}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{progress.questionText}</p>
                </div>

                {progress.verdictResult && (
                  <span className={clsx(
                    "text-xs px-2.5 py-1 rounded-full font-bold shrink-0",
                    progress.verdictResult === 'match'
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : progress.verdictResult === 'mismatch'
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-gray-100 text-gray-700 border border-gray-300"
                  )}>
                    {progress.verdictResult === 'match' ? '일치 (match)' : progress.verdictResult === 'mismatch' ? '부정합 (mismatch)' : '확인불가'}
                  </span>
                )}
              </div>
            )}

            {/* 실시간 관측 피드 로그 */}
            {recentLogs.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  최근 판정 완료 피드 (Live Feed)
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {recentLogs.map((log, i) => (
                    <div
                      key={i}
                      className="text-xs p-2 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="font-mono text-[11px] text-gray-500">{log.id}</span>
                        <span className="text-gray-700 truncate">{log.text}</span>
                      </div>
                      <span className={clsx(
                        "text-[10px] px-2 py-0.5 rounded font-bold shrink-0",
                        log.verdict === 'match' ? "text-emerald-700 bg-emerald-50" : log.verdict === 'mismatch' ? "text-rose-700 bg-rose-50" : "text-gray-600 bg-gray-100"
                      )}>
                        {log.verdict}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. 에러 상태 (error) */}
        {phase === 'error' && (
          <div className="bg-white rounded-2xl p-8 border border-red-200 shadow-sm text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">실측 중 오류 발생</h2>
            <p className="text-sm text-red-600 mb-6 max-w-md mx-auto">{errorMsg}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setPhase('ready')}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2.5 rounded-lg text-sm font-bold"
              >
                처음으로
              </button>
              <button
                onClick={handleStartLive}
                className="bg-[#0a1628] text-white hover:bg-black px-6 py-2.5 rounded-lg text-sm font-bold"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* 4. 완료 상태 (complete) — 결과 및 보고서 뷰어 */}
        {phase === 'complete' && completedResult && (
          <div className="space-y-6">
            {/* 상단 탭 및 액션 바 */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 border-b sm:border-0 pb-2 sm:pb-0 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('vip')}
                  className={clsx(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                    activeTab === 'vip'
                      ? "bg-[#0a1628] text-[#c9a84c] shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <FileText className="w-4 h-4" />
                  <span>VIP 도지사·시장 보고서</span>
                </button>

                <button
                  onClick={() => setActiveTab('spec')}
                  className={clsx(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                    activeTab === 'spec'
                      ? "bg-[#0a1628] text-[#c9a84c] shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <Database className="w-4 h-4" />
                  <span>5대 절 공식 규격 산출물</span>
                </button>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={handleCopyMarkdown}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title="마크다운 복사"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? '복사됨!' : '마크다운 복사'}</span>
                </button>

                <button
                  onClick={handleDownloadMarkdown}
                  className="p-2.5 bg-[#c9a84c] hover:bg-[#b59539] text-[#0a1628] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  title="파일 다운로드"
                >
                  <Download className="w-4 h-4" />
                  <span>다운로드 (.md)</span>
                </button>
              </div>
            </div>

            {/* 탭 1: VIP 일반인용 보고서 */}
            {activeTab === 'vip' && completedResult.vipReport && (
              <div className="bg-white rounded-2xl p-6 sm:p-10 border border-gray-200 shadow-sm prose max-w-none prose-slate prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:border-b prose-h2:pb-2 prose-h2:mt-8 prose-h3:text-xl prose-table:text-sm">
                <div
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(completedResult.vipReport) as string,
                  }}
                />
              </div>
            )}

            {/* 탭 2: 5대 절 공식 규격 산출물 */}
            {activeTab === 'spec' && completedResult.result?.summaries?.[0]?.output && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
                <SpecOutputViewer output={completedResult.result.summaries[0].output} />
              </div>
            )}

            {/* 하단 네비게이션 액션 */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
              <Link
                href="/measure"
                className="text-sm font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1.5"
              >
                ← 다른 지자체 측정하기
              </Link>
              <Link
                href="/reports"
                className="text-sm font-bold text-[#0a1628] bg-white border border-[#c9a84c] px-4 py-2 rounded-lg hover:bg-[#c9a84c]/10 flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>전국 진단 보고서 갤러리</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SpecMeasurementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center p-8 text-center text-gray-500">
          <div>
            <div className="w-8 h-8 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-bold text-sm text-[#0a1628]">측정 환경을 불러오는 중입니다...</p>
          </div>
        </div>
      }
    >
      <SpecMeasurementContent />
    </Suspense>
  );
}
