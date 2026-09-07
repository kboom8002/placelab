// app/(public)/theme-lab/themes/[themeId]/page.tsx
// Policy Theme Lab 정책 테마 브리프 상세 (PRD v3.0 §13 표준)

import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  FileText,
  ChevronRight,
  ArrowLeft,
  Building2,
  AlertTriangle,
  HelpCircle,
  FlaskConical,
  MessageSquare,
  Download,
  Share2,
} from 'lucide-react';
import { SEED_THEMES } from '@/lib/theme-lab/seed-data';

interface Props {
  params: Promise<{ themeId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { themeId } = await params;
  const theme = SEED_THEMES.find((t) => t.id === themeId);
  if (!theme) return { title: '테마를 찾을 수 없음' };
  return {
    title: `${theme.title} (${theme.themeCode}) | kplacelab 정책테마랩`,
    description: theme.coreQuestion,
  };
}

export default async function ThemeDetailPage({ params }: Props) {
  const { themeId } = await params;
  const theme = SEED_THEMES.find((t) => t.id === themeId);

  if (!theme) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 브레드크럼 & 뒤로가기 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-800">kplacelab</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/theme-lab" className="hover:text-slate-800">정책테마랩</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/theme-lab/themes" className="hover:text-slate-800">정책 테마</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="font-semibold text-navy-950">{theme.themeCode}</span>
          </div>

          <Link
            href="/theme-lab/themes"
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-navy-950 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            목록으로
          </Link>
        </div>

        {/* 테마 헤더 카드 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-navy-100 text-navy-950 text-xs font-black">
                {theme.unitName}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-bold text-slate-600 border">
                {theme.themeCode}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              상태: {theme.status === 'research_ready' ? '연구 준비 완료' : '맥락 보완 중'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-navy-950 leading-snug">
            {theme.title}
          </h1>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs sm:text-sm text-slate-800">
            <span className="font-bold text-gold-700 block mb-1 text-xs">📌 핵심 질문</span>
            {theme.coreQuestion}
          </div>
        </div>

        {/* PRD §13 세부 섹션 그리드 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-xs sm:text-sm leading-relaxed">
          {/* 대상과 상황 */}
          <div className="border-b border-slate-100 pb-5 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500">
              1. 대상과 상황 (누가 언제 어떤 일을 하려는가)
            </h3>
            <p className="text-slate-700 font-medium">{theme.targetAudience}</p>
          </div>

          {/* 관찰된 패턴 및 보고서 단서 */}
          <div className="border-b border-slate-100 pb-5 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500">
              2. 관찰된 패턴 및 PlaceLab 진단 단서
            </h3>
            <p className="text-slate-700">{theme.observedPatterns}</p>
          </div>

          {/* 미확인 원인 가설 */}
          <div className="border-b border-slate-100 pb-5 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500">
              3. 아직 확인되지 않은 문제와 원인 가설 (INV-12)
            </h3>
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-950">
              {theme.unconfirmedCauses}
            </div>
            <p className="text-[11px] text-slate-400">
              * 위 원인은 추정 가설이며, 실제 홈페이지 기술 감사 및 담당 부서 사실 확인을 통해 검증되어야 합니다.
            </p>
          </div>

          {/* 기존 안내·제도와 대안 */}
          {theme.existingSolutions && (
            <div className="border-b border-slate-100 pb-5 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500">
                4. 기존 지자체 대응 및 안내 현황
              </h3>
              <p className="text-slate-700">{theme.existingSolutions}</p>
            </div>
          )}

          {/* 다음 PlaceLab 진단 질문 (3~5개) */}
          <div className="border-b border-slate-100 pb-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500">
                <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
                5. 다음 PlaceLab AEO 진단 표준 문항 ({theme.nextDiagnosticQuestions.length}개)
              </h3>
              <Link
                href="/theme-lab/studio"
                className="text-[11px] font-semibold text-purple-600 hover:underline"
              >
                스튜디오에서 측정 세트 내보내기 →
              </Link>
            </div>

            <div className="space-y-2.5">
              {theme.nextDiagnosticQuestions.map((dq) => (
                <div key={dq.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-600 border">
                      {dq.id} · {dq.tier}
                    </span>
                    {dq.expectedGroundTruth && (
                      <span className="text-[11px] text-emerald-700 font-semibold">
                        정답 기준: {dq.expectedGroundTruth}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">
                    "{dq.text}"
                  </p>
                  {dq.evaluationNote && (
                    <p className="text-[11px] text-slate-500">
                      평가 유의점: {dq.evaluationNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 다음 주민·현장 확인 질문 */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              6. 다음 현장 조사 및 주민 인터뷰 확인 질문
            </h3>

            <div className="space-y-2">
              {theme.nextCitizenQuestions.map((cq, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs text-blue-950 flex items-start gap-2">
                  <span className="font-bold text-blue-700 shrink-0">Q{idx + 1}.</span>
                  <span>{cq}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
