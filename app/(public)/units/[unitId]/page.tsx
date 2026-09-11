// app/(public)/units/[unitId]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import { getUnitById } from '@/lib/db/units';
import { createClient } from '@/lib/supabase/server';
import { VerdictBadge } from '@/components/ui/VerdictBadge';
import { B_FORM_DISCLAIMER, MEASUREMENT_LIMITATION_NOTE, CURRENT_METHOD_VERSION } from '@/lib/constants/measurement';
import { getReportByUnitId } from '@/lib/reports/diagnostic-reports';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, AlertTriangle, ShieldCheck, Share2, HelpCircle, Sparkles, ArrowRight } from 'lucide-react';

export const revalidate = 3600;

interface UnitDetailPageProps {
  params: {
    unitId: string;
  };
}

export default async function UnitDetailPage({ params }: UnitDetailPageProps) {
  const unit = await getUnitById(params.unitId);

  if (!unit) {
    notFound();
  }

  const l2Report = getReportByUnitId(unit.unit_id);
  const supabase = createClient();

  let scans: any[] = [];
  if (unit.domain_id) {
    const { data: scansData } = await supabase
      .from('tech_scans')
      .select('scanned_at, robots_verdict, undetermined_reason, is_latest')
      .eq('domain_id', unit.domain_id)
      .order('scanned_at', { ascending: false })
      .limit(12);
    if (scansData) {
      scans = scansData;
    }
  }

  let statements: any[] = [];
  const { data: statementsData } = await supabase
    .from('statements')
    .select('content, published_at')
    .eq('unit_id', unit.unit_id)
    .eq('published', true)
    .order('published_at', { ascending: false });
  if (statementsData) {
    statements = statementsData;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* 뒤로가기 */}
      <Link
        href="/units"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        단위 목록으로 돌아가기
      </Link>

      {/* 단위 헤더 카드 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                {unit.sgg_code || unit.unit_id}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                {unit.population === 'local_gov' ? '지방자치단체' : '특별구역'}
              </span>
              {unit.is_depop_area && (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-orange-50 text-orange-700">
                  인구감소지역
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
              {unit.name}
            </h1>
            {unit.name_en && (
              <div className="text-sm text-gray-500 mt-0.5 font-mono">
                {unit.name_en}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <VerdictBadge
              verdict={unit.robots_verdict}
              reason={unit.undetermined_reason}
              size="lg"
            />
            {unit.confirmed_at && (
              <span className="text-[11px] text-gray-400">
                측정 확정: {new Date(unit.confirmed_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* B형 단위 소관 시·도 도메인 면책 공지 */}
        {unit.domain_form === 'B' && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">{B_FORM_DISCLAIMER}</span>
              <p className="text-xs text-amber-800 mt-1">
                본 구역은 자체 독립 도메인을 갖지 않고 상위 광역자치단체 도메인의 서브경로를 사용합니다.
                따라서 기술 접근성은 상위 시·도 웹서버의 정책에 종속됩니다.
              </p>
            </div>
          </div>
        )}

        {/* 도메인 및 측정 세부사항 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div className="p-4 rounded-lg bg-gray-50 space-y-1">
            <div className="text-xs text-gray-500 font-medium">대상 누리집 도메인</div>
            <div className="text-sm font-mono text-gray-900 flex items-center gap-1.5">
              {unit.host ? (
                <a
                  href={`https://${unit.host}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-600 underline inline-flex items-center gap-1"
                >
                  {unit.host}
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              ) : (
                '자체 도메인 없음'
              )}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 space-y-1">
            <div className="text-xs text-gray-500 font-medium">측정 방법론 버전</div>
            <div className="text-sm font-semibold text-gray-900">
              방법론 {CURRENT_METHOD_VERSION} (주간 2회 연속 승격 규칙 준수)
            </div>
          </div>
        </div>

        {/* 측정 한계 고지 */}
        <div className="text-xs text-gray-500 bg-slate-50 p-3 rounded-lg flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-gray-400 shrink-0" />
          <span>{MEASUREMENT_LIMITATION_NOTE} 자세한 원인 규명은 기관 맞춤 진단(Layer 4)이 요구됩니다.</span>
        </div>
      </div>

      {/* Layer 2 심화 진단 보고서 연동 배너 */}
      {l2Report && (
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900 text-white border border-gold-400/30 shadow-lg space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/20 border border-gold-400/30 text-gold-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              Layer 2 AI 가시성 심화 진단 완료
            </div>
            <span className="text-xs text-slate-400 font-mono">{l2Report.date} 측정</span>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-white tracking-tight">
              {l2Report.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {l2Report.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-[11px] text-slate-400 font-medium">비브랜드 SoV</div>
              <div className="text-base sm:text-lg font-black text-gold-400 font-mono mt-0.5">{l2Report.sovRate}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-[11px] text-slate-400 font-medium">공식 출처 통제율</div>
              <div className="text-base sm:text-lg font-black text-white font-mono mt-0.5">{l2Report.controllabilityRate}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-[11px] text-slate-400 font-medium">실측 슬롯</div>
              <div className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-0.5">{l2Report.slots}슬롯 전수</div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/10">
            <div className="text-xs text-slate-300 flex items-center gap-1.5">
              <span className="text-rose-400 font-bold shrink-0">AI 지적 위험:</span>
              <span className="line-clamp-1 text-slate-200">{l2Report.negativeAlert}</span>
            </div>
            <Link
              href={`/reports/${l2Report.slug}`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-navy-950 font-bold text-xs transition-all shadow-md shrink-0"
            >
              <span>진단 보고서 전문 보기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 주간 스캔 이력 (FR-3) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900">최근 스캔 이력 (12주)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="text-xs text-gray-700 bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3">주차 (스캔일)</th>
                <th className="px-4 py-3">판정</th>
                <th className="px-4 py-3">사유</th>
              </tr>
            </thead>
            <tbody>
              {scans.length > 0 ? (
                scans.map((scan, i) => (
                  <tr key={i} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3">{new Date(scan.scanned_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <VerdictBadge verdict={scan.robots_verdict} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-xs">{scan.undetermined_reason || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    스캔 이력이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 기관 설명 게재 (FR-22) */}
      {statements.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">기관 설명 / 소명 (FR-22)</h2>
          <div className="space-y-4">
            {statements.map((stmt, i) => (
              <blockquote key={i} className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50/50 text-sm text-gray-800 whitespace-pre-wrap rounded-r-lg">
                <div className="text-xs text-gray-500 mb-2">{new Date(stmt.published_at).toLocaleDateString()}</div>
                {stmt.content}
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {/* 정정 요청 섹션 (FR-23) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          정정 신청 (Trust Mechanism)
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          kplacelab은 실명 공공기관을 대상으로 측정 결과를 공표하므로, 해당 단위의 <strong>정정 요청권(FR-23)</strong>을 법적·절차적으로 보장합니다.
          기재된 도메인 오설정이나 일시적 서버 오류에 대해 언제든 정정을 신청하실 수 있습니다.
        </p>

        <div className="pt-2 flex flex-wrap gap-3">
          <Link
            href={`/submit?unitId=${unit.unit_id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            이 지자체 셀프체크 결과 제출하기
          </Link>
          <Link
            href={`/corrections?unit=${unit.unit_id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors"
          >
            이 판정에 이의가 있으시면 정정을 요청할 수 있습니다.
          </Link>
        </div>
      </div>
    </div>
  );
}
