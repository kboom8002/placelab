import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { AUDIENCE_TAG_LABELS, AudienceTag } from '@/lib/types/layers';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '형평성 측정 | K Place Lab',
  description: '대상군별 AI 응답 격차 형평성 측정을 수행합니다.',
};

export default async function EquityPage() {
  const supabase = await createClient();
  const { data: questions } = await supabase
    .from('question_bank')
    .select('id, audience')
    .eq('method_version', 'v1.0');

  const questionMap: Record<string, string[]> = {};
  if (questions) {
    questions.forEach(q => {
      q.audience.forEach((tag: string) => {
        if (!questionMap[tag]) questionMap[tag] = [];
        questionMap[tag].push(q.id);
      });
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">형평성 측정 — 대상군별 AI 응답 격차</h1>
        
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">이 페이지는 가설(C-10)의 검증 상황을 보여줍니다. 격차가 있다는 것은 아직 확인되지 않았습니다.</div>
            <p className="leading-relaxed">
              자세한 내용은 <Link href="/evidence" className="underline font-medium">증거 대장(EVIDENCE)</Link> 및 <Link href="/prereg" className="underline font-medium">사전 등록</Link>을 확인하세요.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <h2 className="text-xl font-bold">대상군 분류 및 문항 태깅</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.entries(AUDIENCE_TAG_LABELS) as [AudienceTag, string][]).map(([tag, label]) => (
            <div key={tag} className="p-4 border border-slate-200 rounded-lg">
              <div className="font-semibold text-slate-900">{label} ({tag})</div>
              <div className="text-sm text-slate-500 mt-2">
                연결된 문항: {questionMap[tag]?.length ? questionMap[tag].join(', ') : '없음'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">비교 결과</h2>
        <div className="text-slate-600 text-sm">
          아직 사전 등록된 비교 결과가 없습니다. 비교는 사전 등록 후에만 수행됩니다.
        </div>
      </div>

      <div className="bg-rose-50 rounded-xl border border-rose-200 p-6 space-y-4">
        <h2 className="text-xl font-bold text-rose-900">한계</h2>
        <ul className="list-disc list-inside space-y-2 text-rose-800 text-sm">
          <li>응답 정확도 차이가 확인되더라도 인과관계를 입증하는 것은 아닙니다.</li>
          <li>특정 대상군을 정의하는 기준과 실제 인구 통계학적 분류가 완벽히 일치하지 않을 수 있습니다.</li>
          <li>측정 시점의 생성형 AI 모델 버전에 따라 결과가 달라질 수 있습니다.</li>
          <li>제한된 문항 수(v1.0 기준)로 인해 모든 지자체의 특성을 일반화하기 어렵습니다.</li>
          <li>이 측정은 AI 편향성 전반을 다루지 않으며, 오직 대상군별 응답의 Floor Risk 차이만을 관측합니다.</li>
        </ul>
      </div>
    </div>
  );
}
