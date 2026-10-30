'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Download,
  ArrowRight,
  RefreshCcw,
  ShieldAlert,
  Server,
  Users,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  X,
  FileText,
  Share2,
  TrendingUp,
  Sparkles,
  PieChart,
  HelpCircle,
  Tag,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import type {
  AEODiagnosisReport,
  Verdict,
  Tier2Verdict,
  Tier2Category,
  Tier3QuestionType,
  FloorRisk
} from '@/lib/types/source-analysis';
import type { Output } from '@/lib/types/measurement-spec';
import { SpecOutputViewer } from '@/components/reports/SpecOutputViewer';

// 보고서 상세 뷰 모델. 실제 보고서 파일(docs/aeo-measurements/<id>-report.json)에
// 아래 상세 배열이 없으면 "준비 중" 상태를 보여준다 (예시 데이터를 대신 채우지 않는다).
type ReportView = AEODiagnosisReport & Partial<{
  tier1Details: {
    id: string;
    label: string;
    category: string;
    reps: Verdict[];
    groundTruth: string;
  }[];
  tier2Details: {
    id: string;
    category: Tier2Category;
    categoryName: string;
    body: string;
    groundTruth: string;
    verdict: Tier2Verdict;
    reps: Tier2Verdict[];
    aiSnippet: string;
  }[];
  tier3Details: {
    id: string;
    type: Tier3QuestionType;
    typeName: string;
    body: string;
    mentioned: boolean;
    sentiment: 'positive' | 'neutral' | 'negative' | 'none';
    aiQuote: string;
  }[];
}>;

const TABS = [
  { id: 'dashboard', label: '대시보드' },
  { id: 't1', label: 'T1 점검표' },
  { id: 't2', label: 'T2 진단서' },
  { id: 't3', label: 'T3 홍보력' },
  { id: 'prescriptions', label: '처방전' },
  { id: 'tracking', label: '추적' },
  { id: 'spec', label: '규격 산출물 (5대 절)' },
];

export default function MeasurementReportPage({ params }: { params: { measurementId: string } }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    specialty_industry: true,
    landmark: true,
  });

  const [report, setReport] = useState<ReportView | null>(null);
  const [specOutput, setSpecOutput] = useState<Output | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not_ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/measure/report/${encodeURIComponent(params.measurementId)}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.report) {
          setReport(data.report as ReportView);
          setSpecOutput((data.spec_output as Output | undefined) ?? null);
          setStatus('ready');
        } else if (res.status === 404 || res.status === 409 || (res.ok && !data.report)) {
          setStatus('not_ready');
        } else {
          setStatus('error');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [params.measurementId]);

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // ── 판정 배지 헬퍼 ──
  const getVerdictBadge = (verdict: Verdict | Tier2Verdict | string) => {
    switch (verdict) {
      case 'accurate':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> 정확
          </span>
        );
      case 'accurate_relevant':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-[#c9a84c]/20 text-[#8c6d1f] border border-[#c9a84c]/40 shadow-xs">
            <Sparkles className="w-3 h-3 mr-1 text-[#c9a84c]" /> 고유정확
          </span>
        );
      case 'accurate_generic':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            범용안내
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> 부분
          </span>
        );
      case 'wrong':
      case 'inaccurate':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <X className="w-3 h-3 mr-1" /> 오답
          </span>
        );
      case 'confabulation':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
            <AlertOctagon className="w-3 h-3 mr-1" /> 작화 (환각)
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
            미응답
          </span>
        );
      default:
        return null;
    }
  };

  const getFloorRiskBadge = (risk: FloorRisk) => {
    switch (risk) {
      case 'critical':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
            <AlertOctagon className="w-3.5 h-3.5 mr-1" /> Critical Risk
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> High Risk
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            Moderate
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Low Risk
          </span>
        );
    }
  };

  if (status === 'loading') {
    return <div className="p-8 text-center text-slate-500">보고서를 불러오는 중입니다…</div>;
  }
  if (
    status !== 'ready' || !report ||
    !report.tier1Details || !report.tier2Details || !report.tier3Details
  ) {
    return (
      <div className="max-w-xl mx-auto p-10 text-center space-y-3">
        <h1 className="text-xl font-bold text-[#0a1628]">
          {status === 'error' ? '보고서를 불러오지 못했습니다' : '아직 공개된 보고서가 없습니다'}
        </h1>
        <p className="text-sm text-slate-500">
          {status === 'error'
            ? '잠시 후 다시 시도해 주세요.'
            : '이 측정은 아직 완료되지 않았거나 보고서가 생성되지 않았습니다. 예시 데이터는 표시하지 않습니다.'}
        </p>
        <Link href="/measure" className="inline-block text-sm font-semibold underline">측정 화면으로</Link>
      </div>
    );
  }

  const t1Acc = Math.round(report.tier1.accuracy_rate * 100);
  const t2Rel = Math.round(report.tier2.accuracy_relevant_rate * 100);
  const t3Sov = Math.round(report.tier3.share_of_voice.sov_rate * 100);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 pt-10 pb-6 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#0a1628] text-white">
                  3-Tier AEO 진단
                </span>
                <span className="text-sm text-slate-500 font-medium">측정일: {report.measured_on}</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0a1628] mb-2 tracking-tight">
                {report.unit_name} AEO 심층 진단 보고서
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-600">
                <span className="flex items-center gap-1.5"><Server className="w-4 h-4 text-[#c9a84c]" /> AI 모델: ChatGPT (gpt-5.6-luna)</span>
                <span className="flex items-center gap-1.5"><Search className="w-4 h-4 text-emerald-600" /> 웹 검색 (Grounding): {report.web_search}</span>
                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-blue-600" /> 방법론 버전: {report.method_version}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => alert('PDF 내보내기는 준비 중입니다')}
                className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium bg-white hover:bg-slate-50 transition-colors text-slate-700 shadow-xs"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF 다운로드
              </button>
              <Link
                href="/measure"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-semibold bg-[#0a1628] text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                <RefreshCcw className="w-4 h-4 mr-2 text-[#c9a84c]" />
                새 측정 시작
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <nav className="flex space-x-6 lg:space-x-8 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#c9a84c] text-[#0a1628]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 lg:px-12 pt-8">
        {/* ══════════════════════════════════════════════════════
            1. 대시보드 탭
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tier 1 기본 행정 정확도</div>
                <div className="text-3xl font-extrabold text-[#0a1628] mb-2">{t1Acc}%</div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0a1628] rounded-full" style={{ width: `${t1Acc}%` }}></div>
                </div>
                <div className="text-xs text-slate-500 mt-2">15개 공통 문항 × 3회 반복</div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tier 2 고유 정보 관련성</div>
                <div className="text-3xl font-extrabold text-[#c9a84c] mb-2">{t2Rel}%</div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#c9a84c] rounded-full" style={{ width: `${t2Rel}%` }}></div>
                </div>
                <div className="text-xs text-slate-500 mt-2">고유 정보 정확 인지 비율</div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tier 3 대외 점유율 (SoV)</div>
                <div className="text-3xl font-extrabold text-blue-600 mb-2">{t3Sov}%</div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${t3Sov}%` }}></div>
                </div>
                <div className="text-xs text-slate-500 mt-2">대외 추천·키워드 언급 점유율</div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">종합 Floor Risk</div>
                  <div className="mt-2">{getFloorRiskBadge(report.tier1.floor_risk)}</div>
                </div>
                <div className="text-xs text-red-600 mt-3 font-medium">
                  {report.tier1.confabulation_count > 0 ? `작화(환각) ${report.tier1.confabulation_count}건 감지됨` : '최악 응답 안전'}
                </div>
              </div>
            </div>

            {/* Findings, Risks, Actions 3-Column Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Key Findings */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🔑</span>
                  <h3 className="font-bold text-[#0a1628]">핵심 발견 (Key Findings)</h3>
                </div>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 shrink-0"></span>
                    <span><strong>특산물 인지 탁월:</strong> '증평 인삼', '좌구산천문대' 등 대표 자원은 AI가 정확히 인지하여 높은 점수를 기록했습니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 shrink-0"></span>
                    <span><strong>고유 정책 범용 drift:</strong> 고유 지원금 질문에 대해 60%의 응답이 "군청에 문의하세요" 수준의 범용 안내에 그쳤습니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 shrink-0"></span>
                    <span><strong>비교 우위 취약:</strong> 서울 출발 1시간 30분대 힐링 후보지 질문 시 괴산·제천 등에 밀려 언급 빈도가 22%에 머물렀습니다.</span>
                  </li>
                </ul>
              </div>

              {/* Major Risks */}
              <div className="bg-white p-6 rounded-xl border border-red-200 bg-red-50/20 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">⚠️</span>
                  <h3 className="font-bold text-red-900">주요 리스크 (Major Risks)</h3>
                </div>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                    <span><strong>어르신 복지 작화 (Critical):</strong> 증평군에 없는 "목욕권 월 4회 지급"을 생성하여 노인 주민의 헛걸음 민원 유발 위험이 높습니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                    <span><strong>타 지자체 오답 교차:</strong> 스마트팜 육성지구 공모 결과에 대해 인접 지자체 선정 사실과 혼동하여 오답을 제공했습니다.</span>
                  </li>
                </ul>
              </div>

              {/* Priority Actions */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">💡</span>
                  <h3 className="font-bold text-[#0a1628]">우선 조치 과제</h3>
                </div>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0a1628] mt-2 shrink-0"></span>
                    <span><strong>비존재 복지 긴급 명시:</strong> 군청 누리집에 어르신 목욕권 지원 비존재 안내 FAQ를 게시하여 AI 크롤러에 정본을 제공합니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0a1628] mt-2 shrink-0"></span>
                    <span><strong>GovernmentService JSON-LD 도입:</strong> 출산, 전입, 귀농 지원 정책 페이지에 Schema.org 마크업을 구축합니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0a1628] mt-2 shrink-0"></span>
                    <span><strong>휴양·관광 키워드 연계:</strong> 벨포레·좌구산을 서울권 당일치기 테마 콘텐츠와 결합하여 대외 검색 노출을 강화합니다.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            2. T1 점검표 탭
        ══════════════════════════════════════════════════════ */}
        {activeTab === 't1' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#0a1628] mb-1">Tier 1 · 기본 행정 점검표 (15문항)</h2>
                <p className="text-xs md:text-sm text-slate-500">
                  전국 지자체 공통 15개 필수 행정 질문에 대해 3회 반복 측정한 결과입니다. (INV-9 준수)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">정확도:</span>
                <span className="text-xl font-extrabold text-[#0a1628]">{t1Acc}%</span>
                <span className="ml-3">{getFloorRiskBadge(report.tier1.floor_risk)}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">문항 ID</th>
                      <th className="px-5 py-3.5">분야</th>
                      <th className="px-5 py-3.5">질문 내용</th>
                      <th className="px-5 py-3.5 text-center">1회차</th>
                      <th className="px-5 py-3.5 text-center">2회차</th>
                      <th className="px-5 py-3.5 text-center">3회차</th>
                      <th className="px-5 py-3.5">사실 기준 (Ground Truth)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.tier1Details.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs font-bold text-[#0a1628]">{q.id}</td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium">
                            {q.category}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-900">{q.label}</td>
                        <td className="px-5 py-4 text-center">{getVerdictBadge(q.reps[0])}</td>
                        <td className="px-5 py-4 text-center">{getVerdictBadge(q.reps[1])}</td>
                        <td className="px-5 py-4 text-center">{getVerdictBadge(q.reps[2])}</td>
                        <td className="px-5 py-4 text-xs text-slate-600 max-w-xs truncate" title={q.groundTruth}>
                          {q.groundTruth}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            3. T2 진단서 탭
        ══════════════════════════════════════════════════════ */}
        {activeTab === 't2' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#0a1628] mb-1">Tier 2 · 고유 정보 진단서 (7개 카테고리)</h2>
                <p className="text-xs md:text-sm text-slate-500">
                  사전 조사를 통해 확정된 증평군만의 고유 지식(Local Knowledge) 20문항에 대한 AI 인지도입니다.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-500">고유정확도</div>
                  <div className="text-xl font-extrabold text-[#c9a84c]">{t2Rel}%</div>
                </div>
                <div className="text-right border-l border-slate-200 pl-3">
                  <div className="text-xs text-slate-500">범용안내율</div>
                  <div className="text-xl font-extrabold text-slate-600">{Math.round(report.tier2.accuracy_generic_rate * 100)}%</div>
                </div>
              </div>
            </div>

            {/* Category Accordions */}
            <div className="space-y-4">
              {report.tier2.category_scores.map((catScore) => {
                const categoryNames: Record<Tier2Category, string> = {
                  specialty_industry: '특산·산업 (C1)',
                  landmark: '고유 시설·랜드마크 (C2)',
                  local_policy: '독자 정책·조례 (C3)',
                  heritage: '역사·문화재 (C4)',
                  geography: '지리·생활권 (C5)',
                  local_food: '로컬 음식·명소 (C6)',
                  recent_issue: '최근 이슈·사업 (C7)',
                };

                const catQuestions = (report.tier2Details ?? []).filter(q => q.category === catScore.category);
                const isOpen = openCategories[catScore.category] ?? false;

                return (
                  <div key={catScore.category} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <button
                      onClick={() => toggleCategory(catScore.category)}
                      className="w-full px-6 py-4.5 bg-slate-50/50 hover:bg-slate-100/50 flex items-center justify-between transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-base text-[#0a1628]">{categoryNames[catScore.category]}</span>
                        <span className="text-xs text-slate-500 font-normal">({catQuestions.length}문항)</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">정확도:</span>
                          <span className="font-bold text-slate-900">{Math.round(catScore.accuracy_rate * 100)}%</span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-500">고유관련성:</span>
                          <span className="font-bold text-[#c9a84c]">{Math.round(catScore.relevance_rate * 100)}%</span>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="p-6 border-t border-slate-100 divide-y divide-slate-100">
                        {catQuestions.map((q) => (
                          <div key={q.id} className="py-4 first:pt-0 last:pb-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                              <div className="flex items-start gap-2.5">
                                <span className="font-mono text-xs font-bold text-slate-400 mt-0.5">{q.id}</span>
                                <span className="font-semibold text-sm text-slate-900">{q.body}</span>
                              </div>
                              <div className="shrink-0">{getVerdictBadge(q.verdict)}</div>
                            </div>
                            <div className="pl-6 space-y-1.5 text-xs">
                              <div className="flex items-start gap-2 text-slate-600">
                                <span className="font-semibold text-emerald-700 shrink-0">사실 (GT):</span>
                                <span>{q.groundTruth}</span>
                              </div>
                              <div className="flex items-start gap-2 text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                                <span className="font-semibold text-[#0a1628] not-italic shrink-0">AI 응답 발췌:</span>
                                <span>"{q.aiSnippet}"</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            4. T3 홍보력 탭
        ══════════════════════════════════════════════════════ */}
        {activeTab === 't3' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* SoV Banner */}
            <div className="bg-gradient-to-br from-[#0a1628] to-slate-900 text-white p-8 rounded-2xl shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="text-xs uppercase font-semibold text-[#c9a84c] tracking-widest mb-1">
                    Share of Voice (대외 언급 점유율)
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-extrabold mb-2">
                    AI 대외 추천 질문 중 {report.unit_name} 언급률
                  </h2>
                  <p className="text-xs text-slate-300 max-w-xl">
                    비지정 추천 및 키워드 진입 질문(총 {report.tier3.share_of_voice.total_responses}회 응답)에서 본 지자체가 추천 후보군으로 제시된 비율입니다.
                  </p>
                </div>
                <div className="flex items-baseline gap-2 bg-white/10 px-6 py-4 rounded-xl border border-white/10 backdrop-blur-xs">
                  <span className="text-5xl font-black text-[#c9a84c]">{t3Sov}%</span>
                  <span className="text-sm text-slate-300">({report.tier3.share_of_voice.target_mentions}/{report.tier3.share_of_voice.total_responses}회)</span>
                </div>
              </div>

              {/* Context Breakdown Bar */}
              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">긍정적 추천</div>
                  <div className="text-lg font-bold text-emerald-400">{report.tier3.share_of_voice.context_breakdown.positive}회</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">중립적 언급</div>
                  <div className="text-lg font-bold text-slate-200">{report.tier3.share_of_voice.context_breakdown.neutral}회</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">부정적 언급</div>
                  <div className="text-lg font-bold text-rose-400">{report.tier3.share_of_voice.context_breakdown.negative}회</div>
                </div>
              </div>
            </div>

            {/* Competitor Comparison & Word Cloud */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Competitor SoV */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="font-bold text-base text-[#0a1628] mb-1">인접·경쟁 지자체 상대적 언급 비교</h3>
                <p className="text-xs text-slate-500 mb-6">동일 대외 추천 질문에서 타 지자체가 함께 언급된 점유율입니다.</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[#0a1628] font-bold">증평군 (우리 도시)</span>
                      <span className="text-[#c9a84c]">{t3Sov}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#c9a84c] rounded-full" style={{ width: `${t3Sov}%` }}></div>
                    </div>
                  </div>

                  {report.tier3.share_of_voice.competitor_sov.map((comp) => {
                    const compRate = Math.round(comp.sov_rate * 100);
                    return (
                      <div key={comp.unit_name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600">{comp.unit_name}</span>
                          <span className="text-slate-700 font-medium">{compRate}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-400 rounded-full" style={{ width: `${compRate}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Association Word Cloud */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base text-[#0a1628] mb-1">AI 브랜드 연상어 클라우드</h3>
                  <p className="text-xs text-slate-500 mb-6">"증평군 하면 떠오르는 세 가지" 응답에서 AI가 자주 추출한 대표 키워드입니다.</p>

                  <div className="flex flex-wrap gap-2.5 items-center justify-center p-4 bg-slate-50/70 rounded-xl min-h-[180px]">
                    {report.tier3.association_words.map((word, idx) => {
                      const sizes = ['text-2xl font-extrabold text-[#0a1628]', 'text-xl font-bold text-[#c9a84c]', 'text-lg font-bold text-blue-700', 'text-base font-semibold text-slate-700', 'text-sm font-medium text-slate-500'];
                      const sizeClass = sizes[idx % sizes.length];
                      return (
                        <span key={word} className={`px-2 py-1 rounded hover:scale-105 transition-transform ${sizeClass}`}>
                          #{word}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 text-[11px] text-slate-400 text-center">
                  V-B1 질문 응답 텍스트 기반 명사 추출 결과
                </div>
              </div>
            </div>

            {/* 6 Question Types Breakdown */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-base text-[#0a1628] mb-4">6대 대외 질문 유형별 언급률</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {report.tier3.type_scores.map((tScore) => {
                  const typeLabels: Record<Tier3QuestionType, string> = {
                    recommendation: 'T3-A 추천 경쟁',
                    association: 'T3-B 연상 테스트',
                    keyword_entry: 'T3-C 키워드 진입',
                    scenario: 'T3-D 시나리오',
                    comparison: 'T3-E 비교 질문',
                    negative_test: 'T3-F 부정 테스트',
                  };
                  return (
                    <div key={tScore.type} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-center">
                      <div className="text-xs font-semibold text-slate-600 mb-1">{typeLabels[tScore.type]}</div>
                      <div className="text-xl font-extrabold text-[#0a1628]">{Math.round(tScore.mention_rate * 100)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Response Quotes with Disclaimer (INV-3, INV-6 compliant) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-[#0a1628]">주요 AI 대외 추천 답변 발췌</h3>
                <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 font-medium">
                  ※ AI 서비스의 응답 원문 요약이며, kplacelab의 판단이나 순위가 아닙니다 (INV-3)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.tier3Details.slice(0, 6).map((item) => (
                  <div key={item.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0a1628]">{item.id} · {item.typeName}</span>
                      {item.mentioned ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          언급됨 ({item.sentiment})
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                          미언급
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-slate-800">Q. {item.body}</div>
                    <div className="text-xs text-slate-600 italic bg-white p-2.5 rounded border border-slate-100">
                      {item.aiQuote}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            5. 처방전 탭
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-xl font-bold text-[#0a1628] mb-1">AEO 개선 처방전 (Action Items)</h2>
              <p className="text-xs md:text-sm text-slate-500">
                진단 결과에 따라 긴급 대응이 필요한 P0(작화/위험)부터 P1(고유정보 보강), P2(대외 홍보력 확대)까지 체계적 조치 과제를 제시합니다.
              </p>
            </div>

            <div className="space-y-4">
              {report.prescriptions.map((item, idx) => {
                const badgeClasses = {
                  P0: 'bg-red-100 text-red-800 border-red-300',
                  P1: 'bg-amber-100 text-amber-800 border-amber-300',
                  P2: 'bg-blue-100 text-blue-800 border-blue-300',
                };
                const borderClasses = {
                  P0: 'border-l-4 border-l-red-500',
                  P1: 'border-l-4 border-l-amber-500',
                  P2: 'border-l-4 border-l-blue-500',
                };

                return (
                  <div
                    key={idx}
                    className={`bg-white p-6 rounded-xl border border-slate-200 shadow-xs ${borderClasses[item.priority]} space-y-2.5`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-black border ${badgeClasses[item.priority]}`}>
                          {item.priority}
                        </span>
                        <h3 className="font-bold text-base text-[#0a1628]">{item.action}</h3>
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        근거: {item.source_question_id}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 pl-1">
                      {item.rationale}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            6. 추적 탭
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'tracking' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-12 text-center">
              <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-[#0a1628] mb-2">월별 변화 추적 (Monthly Tracking)</h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">
                이전 측정 데이터가 없습니다. 다음 측정 후 비교 데이터가 표시됩니다.
              </p>

              {/* Informational Preview Box */}
              <div className="max-w-xl mx-auto bg-slate-50 border border-slate-200 rounded-xl p-6 text-left">
                <div className="flex items-center gap-2 mb-3 font-semibold text-sm text-[#0a1628]">
                  <Sparkles className="w-4 h-4 text-[#c9a84c]" />
                  <span>처방전 이행 후 기대 추적 지표</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-white rounded border border-slate-200">
                    <div className="text-xs text-slate-500">T1 정확도 추이</div>
                    <div className="text-lg font-bold text-[#0a1628] mt-1">+5.2%p</div>
                  </div>
                  <div className="p-3 bg-white rounded border border-slate-200">
                    <div className="text-xs text-slate-500">T2 고유 정보 관련성</div>
                    <div className="text-lg font-bold text-[#c9a84c] mt-1">+12.0%p</div>
                  </div>
                  <div className="p-3 bg-white rounded border border-slate-200">
                    <div className="text-xs text-slate-500">T3 SoV 상승률</div>
                    <div className="text-lg font-bold text-blue-600 mt-1">+8.5%p</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-4 text-center">
                  정기 재측정(매월 1회) 시 처방전 적용 전후의 AI 인지도 변화 곡선이 기록됩니다.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: 규격 산출물 (5대 절) */}
        {activeTab === 'spec' && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900">
              <FileCheck2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <div className="text-xs sm:text-sm space-y-1">
                <p className="font-bold">measurement-spec 규격 산출물 (5대 절 고정 렌더링)</p>
                <p className="text-amber-800/90">
                  이 탭은 docs/measurement-spec 규격에 따라 자동 도출된 5대 절(정본 부재, 개체 실재, 무응답 귀책 N1~N5, 공적 출처 인용률, 여건 고정 잔여 폭)을 고정 순서로 표출합니다.
                </p>
              </div>
            </div>
            {specOutput ? <SpecOutputViewer output={specOutput} /> : (<p className="text-sm text-slate-500">이 측정에는 규격 산출물이 아직 없습니다.</p>)}
          </div>
        )}

        {/* Footer Notes (INV-10, INV-11) */}
        <div className="mt-12 bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-900">
          <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
          <div className="space-y-0.5 text-xs text-blue-800">
            <p className="font-semibold">측정 방법론 및 신뢰성 공지</p>
            <p className="text-blue-700/90">
              본 진단은 ADR-0011 및 K04 v2.1 아키텍처에 따라 생성된 3-Tier 관측 데이터입니다. (INV-7 필수 조건 기록, INV-9 회차별 독립 관측, INV-3 자체 순위 금지 및 AI 원문 인용 규칙 준수)
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
