// app/(public)/equity/page.tsx
// K16: 형평성 측정 — 대상군별 AI 응답 격차
import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, Scale, Users, ShieldAlert, ArrowRight } from 'lucide-react';
import { AUDIENCE_TAG_LABELS, AudienceTag } from '@/lib/types/layers';
import { createClient } from '@/lib/supabase/server';
import { SourceNote } from '@/components/ui/SourceNote';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '형평성 측정 (K16) — kplacelab',
  description: '취약계층 및 대상군별 AI 행정정보 응답 격차와 Floor Risk를 측정합니다. (C-10 연구 가설)',
};

export default async function EquityPage() {
  const questionMap: Record<string, string[]> = {
    youth: ['N04'],
    child_care: ['N05', 'N09'],
    older: ['N10'],
    small_business: ['N11'],
  };

  try {
    const supabase = createClient();
    const { data: questions } = await supabase
      .from('question_bank')
      .select('id, audience')
      .eq('method_version', 'v1.0');

    if (questions && questions.length > 0) {
      questions.forEach((q) => {
        if (Array.isArray(q.audience)) {
          q.audience.forEach((tag: string) => {
            if (!questionMap[tag]) questionMap[tag] = [];
            if (!questionMap[tag].includes(q.id)) questionMap[tag].push(q.id);
          });
        }
      });
    }
  } catch {
    // DB 연결 예외 시 기본 맵 유지
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-12">
      {/* 상단 헤더 */}
      <div className="space-y-4 border-b border-slate-200/80 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
          <Scale className="w-3.5 h-3.5 text-gold-400" />
          K16 · AUDIENCE EQUITY MEASUREMENT · CLAIM C-10
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-navy-950 tracking-tight leading-tight">
          형평성 측정 — 대상군별 AI 응답 격차
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
          청년, 양육 가구, 고령층, 소상공인 등 특정 대상군을 위한 행정정보가 생성형 AI에서 더 부정확하게 안내되거나
          작화(Floor Risk = critical)로 이어지는지 추적합니다.
        </p>
      </div>

      {/* 가설 미검증 원칙 배너 */}
      <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-xs sm:text-sm flex items-start gap-3.5 shadow-sm">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <div className="font-bold text-amber-900">
            가설 검증 단계 안내 (가설 C-10 미검증 상태)
          </div>
          <p className="text-amber-800 leading-relaxed text-xs sm:text-sm">
            본 페이지는 <strong>가설 C-10(&quot;취약계층 관련 행정정보의 AI 정확도가 낮다&quot;)</strong>의 검증 과정을 투명하게 공개합니다.
            아직 전국적 격차가 확인된 바 없으며, 사전 등록(INV-11) 없는 탐색적 비교는 공표하지 않습니다.
          </p>
          <div className="pt-1 flex items-center gap-3 font-semibold text-xs">
            <Link href="/evidence" className="text-navy-900 hover:underline inline-flex items-center gap-1">
              증거 대장 확인 <ArrowRight className="w-3 h-3" />
            </Link>
            <span className="text-amber-300">·</span>
            <Link href="/prereg" className="text-navy-900 hover:underline inline-flex items-center gap-1">
              사전 등록부 확인 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 8개 대상군 태그 그리드 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2">
            <Users className="w-5 h-5 text-navy-700" />
            대상군 분류 및 문항 태깅 체계
          </h2>
          <span className="text-xs text-slate-400 font-mono">v1.0 질문 체계</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {(Object.entries(AUDIENCE_TAG_LABELS) as [AudienceTag, string][]).map(([tag, label]) => {
            const hasQuestions = questionMap[tag] && questionMap[tag].length > 0;
            return (
              <div
                key={tag}
                className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-card hover:shadow-card-hover transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-navy-950">{label}</span>
                  <span className="font-mono text-[10px] text-slate-400">#{tag}</span>
                </div>
                <div className="text-xs text-slate-500">
                  연결 문항:{' '}
                  {hasQuestions ? (
                    <strong className="text-navy-700 font-mono">{questionMap[tag].join(', ')}</strong>
                  ) : (
                    <span className="text-slate-300">없음 (일반)</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 비교 결과 영역 */}
      <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-6 sm:p-8 text-center space-y-3">
        <h3 className="text-base font-bold text-navy-950">사전 등록된 비교 분석 결과</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          현재 등록된 공인 비교 분석 결과가 없습니다.
          AGENTS.md INV-11에 따라, 분석 가설과 판정 기준을 사전에 등록한 측정 결과만 본 영역에 승격됩니다.
        </p>
      </div>

      {/* K16 §5 연구 한계 명시 */}
      <div className="bg-rose-50/70 rounded-2xl border border-rose-200/70 p-6 sm:p-7 space-y-3">
        <h3 className="text-base font-bold text-rose-950 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          K16 측정 연구의 본질적 한계 (5대 원칙)
        </h3>
        <ul className="space-y-2 text-xs sm:text-sm text-rose-900 leading-relaxed list-disc list-inside">
          <li><strong>인과관계 미확정:</strong> 응답 정확도 차이가 확인되더라도 지자체의 정책 실패를 의미하지 않습니다.</li>
          <li><strong>인구통계학적 괴리:</strong> 문항 태깅 기준이 지자체별 실제 취약계층 비중과 일치하지 않을 수 있습니다.</li>
          <li><strong>모델 가변성:</strong> AI 서비스 업데이트에 따라 관측 결과가 수시로 변동될 수 있습니다.</li>
          <li><strong>문항 대표성 한계:</strong> 20문항 체계로 모든 복지·지원 제도의 품질을 전수 대변하지 못합니다.</li>
          <li><strong>편향 범위:</strong> 본 측정은 AI 편향성 전반이 아닌 정보 신뢰도와 Floor Risk만을 관측합니다.</li>
        </ul>
      </div>

      {/* 하단 출처 표기 */}
      <SourceNote
        date="2026-09-05"
        sourceText="docs/knowledge/K16-audience-equity.md 연구 명세서 및 C-10 사전 등록 규약"
      />
    </div>
  );
}
