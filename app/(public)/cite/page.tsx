// app/(public)/cite/page.tsx
// FR-9: 올바른 인용 가이드 및 금지 표현 명시
import React from 'react';
import { CURRENT_METHOD_VERSION } from '@/lib/constants/measurement';
import { Quote, AlertTriangle, CheckCircle, Copy } from 'lucide-react';

export default function CitePage() {
  const bibtex = `@misc{kplacelab2026,
  author = {kplacelab},
  title = {지자체 AI 응답 측정 및 기술 접근성 현황 대시보드},
  year = {2026},
  howpublished = {\\url{https://kplacelab.kr}},
  note = {방법론 ${CURRENT_METHOD_VERSION}}
}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          <Quote className="w-3.5 h-3.5" />
          인용 가이드라인
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          kplacelab 인용 및 보도 가이드
        </h1>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          언론인, 연구자, 지방의회 및 공공기관 담당자가 kplacelab의 데이터를 인용할 때 지켜야 할 원칙과 권장 서식입니다.
        </p>
      </div>

      {/* 권장 인용 문장 템플릿 */}
      <section className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          권장하는 올바른 인용 문장
        </h2>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200">
            <strong>Layer 1 (기술 접근성 인용 시):</strong>
            <p className="mt-1 text-emerald-900">
              &quot;2026-09-05 기준, kplacelab의 방법론 v1.0으로 측정한 결과, 전국 243개 자치단체 중 개방 N곳, 차단 N곳, 파일 없음 N곳, 판정 불가 N곳으로 나타났다.&quot;
            </p>
            <span className="text-xs text-emerald-700 mt-1 block">
              * 반드시 4가지 판정 수치를 모두 함께 표기해야 합니다.
            </span>
          </div>

          <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-200">
            <strong>Layer 2 (셀프체크 표본 인용 시):</strong>
            <p className="mt-1 text-blue-900">
              &quot;kplacelab 셀프체크에 참여한 N개 지자체 중 …&quot;
            </p>
            <span className="text-xs text-blue-700 mt-1 block">
              * 자발적 참여 표본에 대해 &apos;전국 평균&apos;이나 &apos;전국 N곳 중&apos;이라는 분모 표현은 금지됩니다.
            </span>
          </div>
        </div>
      </section>

      {/* 절대 금지 표현 (AGENTS.md 문구 규칙) */}
      <section className="p-6 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-rose-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          보도 및 인용 시 절대 금지하는 표현
        </h2>
        <ul className="list-disc list-inside text-sm text-rose-900 space-y-1.5 leading-relaxed">
          <li><strong>지자체 순위표 조성 금지:</strong> &quot;AI 응답률 1위 / 꼴찌 / 최하위 지자체&quot;</li>
          <li><strong>판정 불가 왜곡 금지:</strong> 일시적 서버 오류인 &apos;판정 불가&apos;를 &apos;차단당했다&apos;로 왜곡</li>
          <li><strong>두 모집단 합산 금지:</strong> 자치단체(243)와 특별구역(A형 6)을 합쳐 &quot;전국 249곳 중&quot;으로 표기</li>
          <li><strong>자발적 표본 일반화 금지:</strong> 셀프체크 결과를 &quot;지자체 전국 평균 오답률&quot;로 표기</li>
          <li><strong>특정 지자체 비난 보도:</strong> 개별 지자체는 모범 사례만 언급 가능하며 나쁜 사례로 지목 금지</li>
        </ul>
      </section>

      {/* BibTeX 서식 */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">학술 인용 서식 (BibTeX)</h2>
        <div className="relative">
          <pre className="p-4 rounded-xl bg-gray-900 text-gray-200 font-mono text-xs overflow-x-auto">
            {bibtex}
          </pre>
        </div>
      </section>
    </div>
  );
}
