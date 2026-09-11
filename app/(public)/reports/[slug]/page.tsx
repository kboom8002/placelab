// app/(public)/reports/[slug]/page.tsx
// K-Place Lab 지자체 AI 가시성 심화 진단 보고서 전문 웹 뷰어

import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import {
  ArrowLeft,
  Download,
  Calendar,
  Layers,
  ShieldCheck,
  AlertCircle,
  FileText,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Building,
} from 'lucide-react';
import {
  DIAGNOSTIC_REPORTS,
  getReportBySlug,
  DiagnosticReportMeta,
} from '@/lib/reports/diagnostic-reports';

export const revalidate = 3600;

interface ReportDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  return DIAGNOSTIC_REPORTS.map(r => ({
    slug: r.slug,
  }));
}

export async function generateMetadata({ params }: ReportDetailPageProps): Promise<Metadata> {
  const report = getReportBySlug(params.slug);
  if (!report) return { title: '보고서를 찾을 수 없습니다' };

  return {
    title: `${report.title} — kplacelab`,
    description: report.subtitle,
  };
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const report = getReportBySlug(params.slug);
  if (!report) {
    notFound();
  }

  const fullPath = path.resolve(process.cwd(), report.reportPath);
  if (!fs.existsSync(fullPath)) {
    notFound();
  }

  const rawMarkdown = fs.readFileSync(fullPath, 'utf-8');
  const htmlContent = marked.parse(rawMarkdown) as string;

  const relatedReports = DIAGNOSTIC_REPORTS.filter(r => r.slug !== report.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-slate-900 pb-20">
      {/* 상단 네비게이션 브레드크럼 */}
      <div className="bg-white border-b border-slate-200/80 sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 overflow-hidden">
            <Link href="/" className="hover:text-slate-900 transition-colors shrink-0">
              홈
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300" />
            <Link href="/reports" className="hover:text-slate-900 transition-colors shrink-0">
              심화 진단 보고서
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300" />
            <span className="font-bold text-navy-950 truncate">{report.unitName}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/api/reports/${report.slug}/download?format=md`}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>MD 다운로드</span>
            </a>
            {report.jsonPath && (
              <a
                href={`/api/reports/${report.slug}/download?format=json`}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-gold-300 font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>원자료 JSON</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* 뒤로 가기 링크 */}
        <Link
          href="/reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>전체 보고서 목록으로 돌아가기</span>
        </Link>

        {/* 보고서 메타데이터 카드 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-navy-950 bg-gold-400/20 text-navy-900 px-2.5 py-0.5 rounded-md">
                {report.region}
              </span>
              <span className="text-slate-500 font-mono flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {report.date} 기준 측정
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-mono">Google Gemini + Search Grounding</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-navy-950 tracking-tight leading-tight">
              {report.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              {report.subtitle}
            </p>
          </div>

          {/* 4대 핵심 지표 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <div className="p-3.5 rounded-xl bg-slate-50 text-center">
              <div className="text-[11px] text-slate-400 font-medium">비브랜드 SoV</div>
              <div className="text-lg sm:text-xl font-black text-navy-950 mt-0.5 font-mono">
                {report.sovRate}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 text-center">
              <div className="text-[11px] text-slate-400 font-medium">공식 출처 통제율</div>
              <div
                className={`text-lg sm:text-xl font-black mt-0.5 font-mono ${
                  parseFloat(report.controllabilityRate) < 5
                    ? 'text-rose-600'
                    : parseFloat(report.controllabilityRate) > 15
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              >
                {report.controllabilityRate}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 text-center">
              <div className="text-[11px] text-slate-400 font-medium">검색 그라운딩률</div>
              <div className="text-lg sm:text-xl font-black text-emerald-600 mt-0.5 font-mono">
                {report.groundingRate}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 text-center">
              <div className="text-[11px] text-slate-400 font-medium">실측 슬롯 수</div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 font-mono">
                {report.slots}회
              </div>
            </div>
          </div>

          {/* 주요 태그 */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {report.tags.map(t => (
              <span
                key={t}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* 투명성 및 한계 안내 배너 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-xs sm:text-sm flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-900">
              탐색적 측정 및 사전 등록 전 파일럿 면책 (AGENTS.md INV-11)
            </div>
            <p className="text-amber-800 leading-relaxed">
              본 보고서는 사전 등록 전 파일럿 관측 결과입니다. 수치를 타 지자체와 단순 비교하거나 서열화할 수 없으며,
              본 측정만으로 인공지능 모델이 특정 답변을 내놓는 기술적 내부 원인을 단정하지 않습니다.
            </p>
          </div>
        </div>

        {/* 보고서 본문 렌더링 컨테이너 */}
        <article className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-12 shadow-sm">
          <div
            className="prose max-w-none text-slate-800 leading-relaxed
              [&>h1]:text-2xl [&>h1]:sm:text-3xl [&>h1]:font-black [&>h1]:text-navy-950 [&>h1]:mt-10 [&>h1]:mb-4 [&>h1]:pb-3 [&>h1]:border-b [&>h1]:border-slate-200
              [&>h2]:text-xl [&>h2]:sm:text-2xl [&>h2]:font-bold [&>h2]:text-navy-950 [&>h2]:mt-8 [&>h2]:mb-3
              [&>h3]:text-lg [&>h3]:sm:text-xl [&>h3]:font-bold [&>h3]:text-navy-900 [&>h3]:mt-6 [&>h3]:mb-2
              [&>p]:my-3.5 [&>p]:leading-relaxed [&>p]:text-sm [&>p]:sm:text-base
              [&>ul]:my-3.5 [&>ul]:pl-5 [&>ul]:list-disc [&>ul>li]:my-1 [&>ul>li]:text-sm [&>ul>li]:sm:text-base
              [&>ol]:my-3.5 [&>ol]:pl-5 [&>ol]:list-decimal [&>ol>li]:my-1
              [&>blockquote]:my-5 [&>blockquote]:p-4 [&>blockquote]:bg-slate-50 [&>blockquote]:border-l-4 [&>blockquote]:border-gold-500 [&>blockquote]:rounded-r-xl [&>blockquote]:text-slate-700 [&>blockquote]:italic
              [&>table]:w-full [&>table]:my-6 [&>table]:border-collapse [&>table]:text-xs [&>table]:sm:text-sm
              [&>table_th]:bg-slate-100 [&>table_th]:p-2.5 [&>table_th]:text-left [&>table_th]:font-bold [&>table_th]:border [&>table_th]:border-slate-200
              [&>table_td]:p-2.5 [&>table_td]:border [&>table_td]:border-slate-200 [&>table_td]:text-slate-700
              [&>pre]:my-5 [&>pre]:p-4 [&>pre]:bg-slate-900 [&>pre]:text-slate-100 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>pre]:text-xs
              [&>hr]:my-8 [&>hr]:border-slate-200"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </article>

        {/* 연관 다른 지자체 보고서 추천 */}
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-navy-950">다른 지자체 진단 보고서 살펴보기</h3>
            <Link
              href="/reports"
              className="text-xs font-semibold text-gold-600 hover:text-gold-700 inline-flex items-center gap-1"
            >
              전체 보기 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedReports.map(rel => (
              <Link
                key={rel.slug}
                href={`/reports/${rel.slug}`}
                className="p-4 rounded-xl bg-white border border-slate-200/90 hover:border-gold-400 hover:shadow-sm transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-navy-900">{rel.region}</span>
                  <span>{rel.slots}슬롯</span>
                </div>
                <h4 className="font-bold text-sm text-navy-950 group-hover:text-gold-600 transition-colors line-clamp-1">
                  {rel.title}
                </h4>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-500">SoV {rel.sovRate}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500">통제 {rel.controllabilityRate}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
