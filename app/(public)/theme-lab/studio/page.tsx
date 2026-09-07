'use client';

// app/(public)/theme-lab/studio/page.tsx
// Policy Theme Lab 진단 질문 제작 스튜디오 (FR-66)
// 주민 질문/테마를 PlaceLab 표준 진단 문항(T1~T4)으로 가공 및 세트 내보내기

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FlaskConical,
  ChevronRight,
  Download,
  Building2,
  Sparkles,
  CheckCircle2,
  Copy,
  FileCode,
} from 'lucide-react';
import { SEED_THEMES } from '@/lib/theme-lab/seed-data';

export default function ThemeLabStudioPage() {
  const [selectedUnit, setSelectedUnit] = useState<'lg-41110' | 'lg-43745'>('lg-41110');
  const [copied, setCopied] = useState(false);

  const currentThemes = SEED_THEMES.filter((t) => t.unitId === selectedUnit);
  const allDiagnosticQuestions = currentThemes.flatMap((t) =>
    t.nextDiagnosticQuestions.map((dq) => ({
      ...dq,
      themeCode: t.themeCode,
      themeTitle: t.title,
      unitName: t.unitName,
    }))
  );

  const exportPayload = {
    unitId: selectedUnit,
    unitName: selectedUnit === 'lg-41110' ? '수원특례시' : '증평군',
    version: 'v2.2-themelab',
    generatedAt: new Date().toISOString(),
    source: 'Policy Theme Lab PRD v3.0 Studio',
    questions: allDiagnosticQuestions.map((q) => ({
      id: q.id,
      tier: q.tier,
      themeCode: q.themeCode,
      body: q.text,
      targetField: q.targetField,
      groundTruth: q.expectedGroundTruth || null,
      note: q.evaluationNote || null,
    })),
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${selectedUnit}-themelab-probes.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 브레드크럼 & 헤더 */}
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Link href="/" className="hover:text-slate-800">kplacelab</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/theme-lab" className="hover:text-slate-800">정책테마랩</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="font-semibold text-navy-950">진단 질문 제작 스튜디오</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-950 flex items-center gap-2">
                <FlaskConical className="w-7 h-7 text-purple-600" />
                진단 질문 제작 스튜디오 (Diagnostic Studio)
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
                발굴된 정책 테마를 PlaceLab의 정밀 AEO 진단 문항(T1~T4)으로 표준화하고 실측 세트를 출력합니다.
              </p>
            </div>

            {/* 지자체 탭 */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <button
                type="button"
                onClick={() => setSelectedUnit('lg-41110')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedUnit === 'lg-41110'
                    ? 'bg-navy-950 text-gold-400 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                수원특례시
              </button>
              <button
                type="button"
                onClick={() => setSelectedUnit('lg-43745')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedUnit === 'lg-43745'
                    ? 'bg-navy-950 text-gold-400 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                증평군
              </button>
            </div>
          </div>
        </div>

        {/* 내보내기 액션 카드 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">PlaceLab 파이프라인 연동</span>
            <h3 className="text-base font-bold text-navy-950 mt-0.5">
              {selectedUnit === 'lg-41110' ? '수원특례시' : '증평군'} 정책 테마 진단 세트 ({allDiagnosticQuestions.length}문항)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              버전이 고정된 JSON 파일로 내려받아 <code>measure-3tier.ts</code>에서 다회차 실측을 수행할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyJSON}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? '복사됨!' : 'JSON 복사'}
            </button>
            <button
              type="button"
              onClick={handleDownloadJSON}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-950 text-gold-400 text-xs font-bold hover:bg-navy-900 shadow"
            >
              <Download className="w-3.5 h-3.5" />
              세트 JSON 다운로드
            </button>
          </div>
        </div>

        {/* 질문 프리뷰 테이블 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-navy-950 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-slate-500" />
            승인 대기 및 실측 대상 표준 문항 리스트
          </h3>

          <div className="space-y-3">
            {allDiagnosticQuestions.map((q) => (
              <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-white text-navy-950 border">
                      {q.id}
                    </span>
                    <span className="text-xs font-bold text-purple-700 px-2 py-0.5 rounded bg-purple-50 border border-purple-200">
                      Tier: {q.tier}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      [{q.themeCode}] {q.themeTitle}
                    </span>
                  </div>

                  {q.expectedGroundTruth && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      정답 기준: {q.expectedGroundTruth}
                    </span>
                  )}
                </div>

                <p className="text-sm font-bold text-slate-900">
                  "{q.text}"
                </p>

                {q.evaluationNote && (
                  <p className="text-xs text-slate-500">
                    💡 판정 가이드: {q.evaluationNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
