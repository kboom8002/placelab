'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Check, AlertTriangle, ExternalLink, FileText, ArrowRight, Activity } from 'lucide-react';
import clsx from 'clsx';

const SIMULATED_RESULTS = [
  { id: 'P1-01', persona: 'P1', category: '청년 기본소득', verdict: 'accurate', sources: ['suwon.go.kr', 'jobaba.net'], official: true },
  { id: 'P1-02', persona: 'P1', category: '청년 월세', verdict: 'accurate', sources: ['suwon.go.kr', 'bokjiro.go.kr'], official: true },
  { id: 'P2-01', persona: 'P2', category: '출산 지원', verdict: 'partial', sources: ['lifewithbaby.co.kr'], official: false },
  { id: 'P2-03', persona: 'P2', category: '야간 소아과', verdict: 'accurate', sources: ['suwon.go.kr', 'e-gen.or.kr'], official: true },
  { id: 'P3-01', persona: 'P3', category: '전입 혜택', verdict: 'accurate', sources: ['suwon.go.kr'], official: true },
  { id: 'P3-02', persona: 'P3', category: '대형폐기물', verdict: 'accurate', sources: ['waste.suwon.go.kr'], official: true },
  { id: 'P3-04', persona: 'P3', category: '민원·행정', verdict: 'partial', sources: ['suwon.go.kr', 'tistory.com'], official: true },
  { id: 'P4-01', persona: 'P4', category: '어르신 교통비', verdict: 'accurate', sources: ['suwon.go.kr'], official: true },
  { id: 'P4-05', persona: 'P4', category: '어르신 복지', verdict: 'confabulation', sources: ['blog.naver.com'], official: false },
  { id: 'P5-03', persona: 'P5', category: '다문화센터', verdict: 'accurate', sources: ['liveinkorea.kr'], official: false },
  { id: 'P6-01', persona: 'P6', category: '소상공인 대출', verdict: 'accurate', sources: ['suwon.go.kr', 'cgs.or.kr'], official: true },
  { id: 'P6-06', persona: 'P6', category: '축제', verdict: 'accurate', sources: ['swcf.or.kr', 'shfestival.com'], official: true },
];

const PERSONA_INFO: Record<string, { icon: string, label: string }> = {
  'P1': { icon: '👤', label: '청년' },
  'P2': { icon: '👨‍👩‍👧', label: '학부모' },
  'P3': { icon: '🏠', label: '전입자' },
  'P4': { icon: '👴', label: '어르신' },
  'P5': { icon: '🌏', label: '외국인' },
  'P6': { icon: '🏪', label: '소상공인' },
};

const VERDICT_STYLES: Record<string, { bg: string, text: string, border: string, label: string }> = {
  'accurate': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: '정확' },
  'partial': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: '부분정확' },
  'confabulation': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: '작화(Hallucination)' },
};

export default function MeasurementExecutionPage() {
  const params = useParams();
  const router = useRouter();
  
  const measurementId = params.measurementId as string;
  const unitId = measurementId.replace('demo-', '');
  // For demo, just extract the unit id from url
  const unitName = '수원특례시'; // Hardcoded for demo, normally fetched from API using unitId
  
  const [progress, setProgress] = useState(0);
  const [visibleResults, setVisibleResults] = useState<typeof SIMULATED_RESULTS>([]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let currentIdx = 0;
    const totalItems = SIMULATED_RESULTS.length;
    
    // Simulate progressive loading over ~5 seconds (total)
    const interval = setInterval(() => {
      if (currentIdx < totalItems) {
        setVisibleResults(prev => [...prev, SIMULATED_RESULTS[currentIdx]]);
        setProgress(((currentIdx + 1) / totalItems) * 100);
        currentIdx++;
      } else {
        clearInterval(interval);
        setIsFinished(true);
      }
    }, 400); // 400ms per item -> 4.8s total

    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    let accurate = 0;
    let partial = 0;
    let confabulation = 0;
    let officialDocs = 0;

    SIMULATED_RESULTS.forEach(r => {
      if (r.verdict === 'accurate') accurate++;
      if (r.verdict === 'partial') partial++;
      if (r.verdict === 'confabulation') confabulation++;
      if (r.official) officialDocs++;
    });

    const officialRate = Math.round((officialDocs / SIMULATED_RESULTS.length) * 100);
    const hasFloorRisk = confabulation > 0;

    return { accurate, partial, confabulation, officialRate, hasFloorRisk };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#0a1628] font-sans pb-24">
      {/* Header Sticky */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#c9a84c]" />
                {unitName} AI 응답 품질 측정 중
              </h1>
              <p className="text-sm text-gray-500">진행률: {Math.round(progress)}%</p>
            </div>
            {isFinished && (
              <span className="bg-[#0a1628] text-[#c9a84c] px-3 py-1 text-sm rounded-full font-bold">
                측정 완료
              </span>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-[#c9a84c] h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Confabulation Alert */}
        {visibleResults.some(r => r.verdict === 'confabulation') && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="bg-rose-100 p-2 rounded-full">
              <AlertTriangle className="w-6 h-6 text-rose-600 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-rose-800 text-lg">치명적 오류(Hallucination) 감지</h3>
              <p className="text-rose-700 text-sm mt-1">
                AI가 존재하지 않거나 잘못된 정보를 생성한 사례가 발견되었습니다. 지자체 신뢰도에 악영향을 줄 수 있는 바닥 위험(Floor Risk)입니다.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {visibleResults.map((result, idx) => {
            const style = VERDICT_STYLES[result.verdict];
            const pInfo = PERSONA_INFO[result.persona];

            return (
              <div 
                key={result.id + idx} 
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 sm:items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center text-xl" title={pInfo.label}>
                    {pInfo.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{result.id}</span>
                      <span className="font-bold text-lg">{result.category}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        출처: {result.sources.join(', ')}
                        {result.official ? (
                          <span className="inline-flex items-center text-emerald-600 ml-1" title="공식 출처 인용"><Check className="w-3 h-3" /></span>
                        ) : null}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={clsx("px-4 py-2 rounded-lg border font-bold text-sm text-center shrink-0 w-32", style.bg, style.text, style.border)}>
                  {style.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Finished State Summary */}
        {isFinished && (
          <div className="mt-12 p-8 bg-white border border-gray-200 rounded-2xl shadow-sm text-center animate-in fade-in zoom-in-95 duration-500">
            <h2 className="text-2xl font-bold mb-6">측정 결과 요약</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl font-black text-emerald-600 mb-1">{stats.accurate}</div>
                <div className="text-sm text-gray-600 font-medium">정확</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl font-black text-amber-600 mb-1">{stats.partial}</div>
                <div className="text-sm text-gray-600 font-medium">부분정확</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl font-black text-rose-600 mb-1">{stats.confabulation}</div>
                <div className="text-sm text-gray-600 font-medium">작화 (위험)</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl font-black text-blue-600 mb-1">{stats.officialRate}%</div>
                <div className="text-sm text-gray-600 font-medium">공식출처 인용률</div>
              </div>
            </div>

            {stats.hasFloorRisk && (
              <div className="inline-block mb-8 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-sm font-bold flex items-center justify-center gap-2 w-fit mx-auto">
                <AlertTriangle className="w-4 h-4" />
                바닥 위험(Floor Risk) 존재 - 개선 시급
              </div>
            )}

            <button
              onClick={() => router.push(`${window.location.pathname}/report`)}
              className="bg-[#c9a84c] text-[#0a1628] hover:bg-[#b59539] font-bold text-lg px-8 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <FileText className="w-5 h-5" />
              상세 보고서 보기
            </button>
            <p className="text-xs text-gray-400 mt-4">
              * 이 결과는 시뮬레이션 데이터입니다. 실제 측정은 API 키 설정 후 활성화됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
