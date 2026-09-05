// app/(public)/units/[unitId]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import { getUnitById } from '@/lib/db/units';
import { VerdictBadge } from '@/components/ui/VerdictBadge';
import { B_FORM_DISCLAIMER, MEASUREMENT_LIMITATION_NOTE, CURRENT_METHOD_VERSION } from '@/lib/constants/measurement';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, AlertTriangle, ShieldCheck, Share2, HelpCircle } from 'lucide-react';

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

      {/* 기관 설명 게재 및 정정 요청 섹션 (FR-22, FR-23) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          설명 게재권 및 정정 신청 (Trust Mechanism)
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          kplacelab은 실명 공공기관을 대상으로 측정 결과를 공표하므로, 해당 단위의 <strong>설명 게재권(FR-22)</strong>과 <strong>정정 요청권(FR-23)</strong>을 법적·절차적으로 보장합니다.
          기재된 도메인 오설정이나 일시적 서버 오류에 대해 언제든 정정을 신청하실 수 있습니다.
        </p>

        <div className="pt-2 flex flex-wrap gap-3">
          <Link
            href={`/submit?unitId=${unit.unit_id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            이 지자체 셀프체크 결과 제출하기
          </Link>
          <a
            href="mailto:contact@kplacelab.kr?subject=정정요청 및 소명"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors"
          >
            정정 요청 / 소명 게재 접수
          </a>
        </div>
      </div>
    </div>
  );
}
