'use client';

import React, { useState } from 'react';
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
  ChevronRight,
  Check,
  X,
  FileText,
  Share2,
  AlertCircle
} from 'lucide-react';

const REPORT_DATA = {
  unit_name: '수원특례시',
  measured_on: '2026-09-06',
  mode: 'quick',
  method_version: 'v2.0',
  ai_service: 'ChatGPT (gpt-5luna)',
  web_search: 'on',
  total_questions: 12,
  results: [
    { id: 'P1-01', persona: 'P1', label: '청년 기본소득', verdict: 'accurate', official_cited: true, sources: ['suwon.go.kr', 'jobaba.net'] },
    { id: 'P1-02', persona: 'P1', label: '청년 월세', verdict: 'accurate', official_cited: true, sources: ['suwon.go.kr', 'bokjiro.go.kr'] },
    { id: 'P2-01', persona: 'P2', label: '출산 지원', verdict: 'partial', official_cited: false, sources: ['lifewithbaby.co.kr'] },
    { id: 'P2-03', persona: 'P2', label: '야간 소아과', verdict: 'accurate', official_cited: true, sources: ['suwon.go.kr', 'e-gen.or.kr'] },
    { id: 'P3-01', persona: 'P3', label: '전입 혜택', verdict: 'accurate', official_cited: true, sources: ['suwon.go.kr'] },
    { id: 'P3-02', persona: 'P3', label: '대형폐기물', verdict: 'accurate', official_cited: true, sources: ['waste.suwon.go.kr'] },
    { id: 'P3-04', persona: 'P3', label: '민원·행정', verdict: 'partial', official_cited: true, sources: ['suwon.go.kr', 'tistory.com'] },
    { id: 'P4-01', persona: 'P4', label: '어르신 교통비', verdict: 'accurate', official_cited: true, sources: ['suwon.go.kr'] },
    { id: 'P4-05', persona: 'P4', label: '어르신 복지', verdict: 'confabulation', official_cited: false, sources: ['blog.naver.com'], confab_detail: 'AI가 존재하지 않는 "목욕권 월 4회 지급" 제도를 만들어냈습니다.' },
    { id: 'P5-03', persona: 'P5', label: '다문화센터', verdict: 'accurate', official_cited: false, sources: ['liveinkorea.kr'] },
    { id: 'P6-01', persona: 'P6', label: '소상공인 대출', verdict: 'accurate', official_cited: true, sources: ['suwon.go.kr', 'cgs.or.kr'] },
    { id: 'P6-06', persona: 'P6', label: '축제', verdict: 'accurate', official_cited: true, sources: ['swcf.or.kr', 'shfestival.com'] },
  ],
  source_analysis: {
    official_rate: 0.75,
    institutional_rate: 0.17,
    user_generated_rate: 0.08,
    canonical_reach_rate: 0.67,
    citation_stability: 0.85,
  }
};

const TABS = [
  { id: 'diagnosis', label: '출처 진단서' },
  { id: 'supply', label: '공급 체인' },
  { id: 'impact', label: '시민 영향' },
  { id: 'benchmark', label: '벤치마크' }
];

export default function MeasurementReportPage({ params }: { params: { measurementId: string } }) {
  const [activeTab, setActiveTab] = useState('diagnosis');

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'accurate':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" />정확</span>;
      case 'partial':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"><AlertTriangle className="w-3 h-3 mr-1" />부분정확</span>;
      case 'inaccurate':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200"><X className="w-3 h-3 mr-1" />부정확</span>;
      case 'confabulation':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse"><AlertOctagon className="w-3 h-3 mr-1" />작화 (환각)</span>;
      default:
        return null;
    }
  };

  const accuracyRate = Math.round((REPORT_DATA.results.filter(r => r.verdict === 'accurate').length / REPORT_DATA.total_questions) * 100);
  const confabCount = REPORT_DATA.results.filter(r => r.verdict === 'confabulation').length;
  
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 pt-12 pb-8 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#0a1628] text-white">
                  {REPORT_DATA.mode === 'quick' ? 'Quick Mode' : 'Full Mode'}
                </span>
                <span className="text-sm text-slate-500 font-medium">측정일: {REPORT_DATA.measured_on}</span>
              </div>
              <h1 className="text-4xl font-bold text-[#0a1628] mb-2">{REPORT_DATA.unit_name} 측정 보고서</h1>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1.5"><Server className="w-4 h-4" /> {REPORT_DATA.ai_service}</span>
                <span className="flex items-center gap-1.5"><Search className="w-4 h-4" /> Web Search: {REPORT_DATA.web_search}</span>
                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> Method: {REPORT_DATA.method_version}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => alert('PDF 내보내기는 준비 중입니다')}
                className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium bg-white hover:bg-slate-50 transition-colors text-slate-700 shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF로 내보내기
              </button>
              <Link 
                href="/measure"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium bg-[#0a1628] text-white hover:bg-slate-800 transition-colors shadow-sm"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                새 측정 시작
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <nav className="flex space-x-8 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#c9a84c] text-[#0a1628]'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
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
        
        {/* Tab 1: 출처 진단서 */}
        {activeTab === 'diagnosis' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-sm font-medium text-slate-500 mb-1">전체 정확도</div>
                <div className="text-3xl font-bold text-[#0a1628] mb-3">{accuracyRate}%</div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0a1628] rounded-full" style={{ width: `${accuracyRate}%` }}></div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-sm font-medium text-slate-500 mb-1">공식 출처 인용률</div>
                <div className="text-3xl font-bold text-[#0a1628] mb-3">{REPORT_DATA.source_analysis.official_rate * 100}%</div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#c9a84c] rounded-full" style={{ width: `${REPORT_DATA.source_analysis.official_rate * 100}%` }}></div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-start">
                <div className="text-sm font-medium text-slate-500 mb-2">Floor Risk (심각한 오류)</div>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                  <ShieldAlert className="w-4 h-4 mr-1.5" /> Low Risk
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-start">
                <div className="text-sm font-medium text-slate-500 mb-2">작화 (Confabulation) 건수</div>
                {confabCount > 0 ? (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 animate-pulse">
                    <AlertOctagon className="w-4 h-4 mr-1.5" /> {confabCount}건 발생
                  </div>
                ) : (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> 0건 (안전)
                  </div>
                )}
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-bold text-[#0a1628]">세부 문항별 진단 결과</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-medium">문항 ID</th>
                      <th className="px-6 py-4 font-medium">페르소나</th>
                      <th className="px-6 py-4 font-medium">주제</th>
                      <th className="px-6 py-4 font-medium">판정</th>
                      <th className="px-6 py-4 font-medium">공식 인용</th>
                      <th className="px-6 py-4 font-medium">주요 출처</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {REPORT_DATA.results.map((result) => (
                      <tr key={result.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{result.id}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-700 text-xs font-bold">
                            {result.persona}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">{result.label}</td>
                        <td className="px-6 py-4">
                          {getVerdictBadge(result.verdict)}
                        </td>
                        <td className="px-6 py-4">
                          {result.official_cited ? (
                            <Check className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <X className="w-5 h-5 text-slate-300" />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {result.sources.map((src, i) => (
                              <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                                src.includes('.go.kr') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                src.includes('.or.kr') || src.includes('.net') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-slate-50 text-slate-600 border-slate-200'
                              }`}>
                                {src}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 공급 체인 */}
        {activeTab === 'supply' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-xl font-bold text-[#0a1628] mb-2">정보 공급 체인 매핑</h2>
              <p className="text-slate-500 mb-10 text-sm">AI가 생성한 응답의 정보 출처가 어느 계층에 분포되어 있는지 시각화합니다.</p>
              
              {/* CSS based diagram */}
              <div className="relative flex flex-col md:flex-row items-stretch justify-between min-h-[400px] gap-8">
                
                {/* Column 1: User */}
                <div className="flex flex-col justify-center items-center relative z-10 w-full md:w-48">
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 text-center shadow-sm w-full">
                    <Users className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <div className="font-bold text-slate-800">주민 질문</div>
                    <div className="text-xs text-slate-500 mt-1">총 {REPORT_DATA.total_questions}개 문항</div>
                  </div>
                </div>

                {/* Connecting lines logic is hard purely with flex, we'll use a simplified horizontal flow */}
                <div className="hidden md:flex flex-col justify-center text-slate-300">
                  <ArrowRight className="w-8 h-8" />
                </div>

                {/* Column 2: Search / Engine */}
                <div className="flex flex-col justify-center items-center relative z-10 w-full md:w-48">
                  <div className="bg-[#0a1628] border-2 border-[#0a1628] rounded-2xl p-6 text-center shadow-lg w-full transform hover:scale-105 transition-transform">
                    <Server className="w-8 h-8 text-[#c9a84c] mx-auto mb-3" />
                    <div className="font-bold text-white">검색 엔진 & AI</div>
                    <div className="text-xs text-slate-300 mt-1">{REPORT_DATA.ai_service}</div>
                  </div>
                </div>

                <div className="hidden md:flex flex-col justify-center text-slate-300">
                  <ArrowRight className="w-8 h-8" />
                </div>

                {/* Column 3: Sources (Tiered) */}
                <div className="flex flex-col justify-center gap-6 relative z-10 w-full md:w-64">
                  {/* Tier 1 */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm w-full relative">
                    <div className="text-xs font-bold text-emerald-800 mb-2 flex justify-between">
                      <span>1차 공식 출처</span>
                      <span className="bg-emerald-200 text-emerald-900 px-1.5 rounded">{REPORT_DATA.source_analysis.official_rate * 100}%</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xs bg-white border border-emerald-100 rounded px-2 py-1 flex justify-between items-center text-emerald-700">suwon.go.kr <span className="text-[10px] text-emerald-500">6건</span></div>
                      <div className="text-xs bg-white border border-emerald-100 rounded px-2 py-1 flex justify-between items-center text-emerald-700">waste.suwon.go.kr <span className="text-[10px] text-emerald-500">1건</span></div>
                    </div>
                  </div>
                  
                  {/* Tier 2 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm w-full relative">
                    <div className="text-xs font-bold text-blue-800 mb-2 flex justify-between">
                      <span>2차 기관 출처</span>
                      <span className="bg-blue-200 text-blue-900 px-1.5 rounded">{REPORT_DATA.source_analysis.institutional_rate * 100}%</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xs bg-white border border-blue-100 rounded px-2 py-1 flex justify-between items-center text-blue-700">bokjiro.go.kr <span className="text-[10px] text-blue-500">1건</span></div>
                      <div className="text-xs bg-white border border-blue-100 rounded px-2 py-1 flex justify-between items-center text-blue-700">jobaba.net <span className="text-[10px] text-blue-500">1건</span></div>
                    </div>
                  </div>

                  {/* Tier 3 */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm w-full relative">
                    <div className="text-xs font-bold text-amber-800 mb-2 flex justify-between">
                      <span>3차 민간/블로그</span>
                      <span className="bg-amber-200 text-amber-900 px-1.5 rounded">{REPORT_DATA.source_analysis.user_generated_rate * 100}%</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xs bg-white border border-amber-100 rounded px-2 py-1 flex justify-between items-center text-amber-700">blog.naver.com <span className="text-[10px] text-amber-500">1건</span></div>
                      <div className="text-xs bg-white border border-amber-100 rounded px-2 py-1 flex justify-between items-center text-amber-700">tistory.com <span className="text-[10px] text-amber-500">1건</span></div>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex flex-col justify-center text-slate-300">
                  <ArrowRight className="w-8 h-8" />
                </div>

                {/* Column 4: Final Output */}
                <div className="flex flex-col justify-center items-center relative z-10 w-full md:w-48">
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 text-center shadow-sm w-full">
                    <div className="text-sm font-bold text-slate-800 mb-3">AI 응답 품질</div>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-600 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> 정확</span>
                        <span className="font-bold text-slate-700">8건</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-amber-600 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> 부분정확</span>
                        <span className="font-bold text-slate-700">2건</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-red-600 font-bold flex items-center"><AlertOctagon className="w-3 h-3 mr-1"/> 작화</span>
                        <span className="font-bold text-slate-700">1건</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: 시민 영향 */}
        {activeTab === 'impact' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-[#0a1628] mb-2">시민 영향 위험 분석</h2>
            <p className="text-slate-500 mb-6 text-sm">정보 오류나 작화가 실제 주민의 행동이나 행정 신뢰도에 미칠 수 있는 영향을 평가합니다.</p>
            
            {confabCount === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center text-emerald-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">안전: 심각한 오류가 발견되지 않았습니다.</h3>
                <p className="text-sm text-emerald-700/80">현재 측정된 표본에서 주민에게 심각한 혼란을 초래할 수 있는 작화(환각)나 허위 제도가 발견되지 않았습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {REPORT_DATA.results.filter(r => r.verdict === 'confabulation').map(item => (
                  <div key={item.id} className="bg-white border-2 border-red-500 rounded-xl shadow-md overflow-hidden">
                    <div className="bg-red-500 text-white px-4 py-2 flex items-center gap-2 font-bold text-sm">
                      <AlertOctagon className="w-4 h-4" />
                      CRITICAL RISK 발견
                    </div>
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0">
                          {item.id.split('-')[0]}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{item.id} · {item.label}</h3>
                          <div className="text-sm text-slate-500 mt-1">이 문항에서 치명적인 정보 생성 오류가 발생했습니다.</div>
                        </div>
                      </div>

                      <div className="space-y-4 bg-slate-50 rounded-lg p-4 border border-slate-200 mb-6">
                        <div className="flex items-start gap-3">
                          <span className="text-xl">🤖</span>
                          <div>
                            <div className="text-xs font-bold text-slate-500 mb-0.5">AI 작화 (환각) 내용</div>
                            <div className="text-sm font-medium text-red-700">"{item.confab_detail || '존재하지 않는 제도를 만들어냈습니다.'}"</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-xl">✅</span>
                          <div>
                            <div className="text-xs font-bold text-slate-500 mb-0.5">실제 사실 (Ground Truth)</div>
                            <div className="text-sm font-medium text-emerald-700">수원시는 해당 제도를 운영하지 않습니다.</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="border border-slate-100 rounded-lg p-3">
                          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> 영향 대상</div>
                          <div className="text-sm font-bold text-slate-800">70대 이상 어르신</div>
                        </div>
                        <div className="border border-slate-100 rounded-lg p-3">
                          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5" /> 예상 행동</div>
                          <div className="text-sm font-bold text-slate-800">주민센터 방문 및 문의</div>
                        </div>
                        <div className="border border-red-100 bg-red-50 rounded-lg p-3">
                          <div className="text-xs text-red-600 mb-1 flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> 최종 결과</div>
                          <div className="text-sm font-bold text-red-800">행정 불신 및 민원 증가</div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                          <span className="font-semibold text-slate-900">완화 여부:</span> Web Search (Grounding) 활성화 시에도 오류가 유지되었습니다.
                        </div>
                        <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                          미해소
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: 벤치마크 */}
        {activeTab === 'benchmark' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
              <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-[#0a1628] mb-2">경쟁지역 비교는 비활성화되어 있습니다</h2>
              <p className="text-slate-500 mb-8 max-w-lg mx-auto">
                현재 측정은 Quick Mode로 진행되었습니다. 완전(Full) 모드에서 '경쟁지역 비교' 옵션을 켜면 인구 규모와 예산이 유사한 익명의 도시 3곳과의 AI 응답 품질 비교 지표를 확인할 수 있습니다.
              </p>
              
              {/* Mock Preview */}
              <div className="max-w-2xl mx-auto opacity-40 select-none pointer-events-none relative">
                <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <span className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg shadow-lg">PREVIEW</span>
                </div>
                <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
                  <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
                    <div className="w-16 h-40 bg-[#c9a84c] rounded-t-sm relative group">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-700">83%</div>
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-600 whitespace-nowrap">수원시 (우리)</div>
                    </div>
                    <div className="w-16 h-32 bg-slate-300 rounded-t-sm relative">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-500">71%</div>
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-500 whitespace-nowrap">도시 A</div>
                    </div>
                    <div className="w-16 h-36 bg-slate-300 rounded-t-sm relative">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-500">75%</div>
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-500 whitespace-nowrap">도시 B</div>
                    </div>
                    <div className="w-16 h-28 bg-slate-300 rounded-t-sm relative">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-500">62%</div>
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-500 whitespace-nowrap">도시 C</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Notes */}
        <div className="mt-16 bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">이 보고서는 시뮬레이션 데이터입니다.</p>
            <p className="text-blue-700/80">실제 측정은 API 키 설정 후 활성화됩니다. 또한 이 측정은 탐색적(exploratory)이며 사전 등록을 거치지 않았습니다. (INV-10, INV-11)</p>
          </div>
        </div>

      </main>
    </div>
  );
}
