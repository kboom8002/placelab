// app/(public)/press/page.tsx
// FR-49: 언론용 보도 키트 및 데이터 다운로드
import React from 'react';
import Link from 'next/link';
import { Download, FileText, CheckCircle2, Shield } from 'lucide-react';
import { CURRENT_METHOD_VERSION } from '@/lib/constants/measurement';

export default function PressKitPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          <FileText className="w-3.5 h-3.5" />
          언론 및 연구 지원
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          kplacelab 보도 키트 (Press Kit)
        </h1>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          언론 취재 및 학술 조사를 위해 사전 승격·검증된 공식 데이터와 인용 가이드를 제공합니다.
        </p>
      </div>

      {/* 데이터 다운로드 섹션 */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-600" />
          공식 공개 데이터 다운로드 (FR-10)
        </h2>
        <p className="text-sm text-gray-600">
          최근 2회 연속 동일 판정을 받아 공식 승격된 243개 자치단체 및 특별구역의 Layer 1 기술 접근성 데이터입니다.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href="/api/export/layer1?format=csv"
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Layer 1 전수 데이터 CSV 내려받기
          </a>
          <a
            href="/api/export/layer1?format=json"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors"
          >
            JSON 포맷으로 보기
          </a>
        </div>
      </section>

      {/* 표준 보도 가이드라인 */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          기사 작성 시 체크리스트
        </h2>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>판정 수치를 인용할 때는 <strong>개방·차단·파일 없음·판정 불가</strong> 4가지 수치를 모두 명시했습니까?</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>자치단체(243곳)와 경제자유구역(A형 6곳)을 임의로 합산하지 않았습니까?</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>순위표나 등급(1위, 최하위 등)을 작성하지 않고 사실 상태만 서술했습니까?</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>방법론 버전(v1.0)과 측정 기준일자를 명시했습니까?</span>
          </div>
        </div>

        <div className="pt-2">
          <Link href="/cite" className="text-xs text-blue-600 hover:underline font-medium">
            → 인용 가이드 상세 규정 확인하기
          </Link>
        </div>
      </section>
    </div>
  );
}
