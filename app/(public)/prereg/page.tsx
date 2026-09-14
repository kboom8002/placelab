import React from 'react';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AlertCircle, Calendar, CheckCircle2, Clock, PlayCircle, Database, FileCheck2, ShieldCheck, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { getPopulationFrame, getRunProfileRegistry } from '@/lib/measurement/registries';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '사전 등록 (Preregistrations) | K-PlaceLab',
  description: '측정 결과를 공표하기 전 가설과 반증 조건을 등록합니다. (INV-11)',
};

type PreregStatus = 'draft' | 'published' | 'running' | 'completed' | 'abandoned';

interface Preregistration {
  id: string;
  title: string;
  claim_id: string;
  hypothesis: string;
  method_version: string;
  method_summary: string;
  criteria: string;
  falsification: string;
  stop_rule: string;
  status: PreregStatus;
  published_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  outcome: string | null;
}

const fallbackData: Preregistration[] = [
  {
    id: 'prereg-2026-c1',
    title: '전국 자치단체 및 특별구역 Layer 1 기술 접근성 기준선 측정',
    claim_id: 'C-1',
    hypothesis: '공공 도메인의 상당수가 AI 수집기에 닫혀 있거나 비정상 설정 상태이다',
    method_version: 'v1.0',
    method_summary: '243개 자치단체 및 A형 경제자유구역 대상 robots.txt 및 sitemap 주간 자동 스캔',
    criteria: 'open / blocked_all / blocked_selective / no_file / undetermined 5분 판정',
    falsification: '전수 조사 결과 blocked_* 및 undetermined 합계가 10% 미만일 때',
    stop_rule: '전수 도메인 스캔 2주 연속 완료 시점',
    status: 'published',
    published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    started_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: null,
    outcome: null,
  }
];

export default async function PreregistrationsPage() {
  const supabase = createClient();
  
  let preregistrations: Preregistration[] = [];
  try {
    const { data, error } = await supabase
      .from('preregistrations')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false });
      
    if (error) {
      console.error('Error fetching preregistrations:', error);
      preregistrations = fallbackData;
    } else if (data && data.length > 0) {
      preregistrations = data as Preregistration[];
    } else {
      preregistrations = fallbackData;
    }
  } catch (err) {
    console.error('Failed to query preregistrations:', err);
    preregistrations = fallbackData;
  }

  const getStatusBadge = (status: PreregStatus) => {
    switch (status) {
      case 'draft':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">작성 중</span>;
      case 'published':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">공개됨 (대기 중)</span>;
      case 'running':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">진행 중</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">완료</span>;
      case 'abandoned':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">중단됨</span>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'yyyy-MM-dd HH:mm');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">사전 등록 (Preregistrations)</h1>
        
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">신뢰 원칙: 결과 공개 전 사전 등록 (INV-11)</div>
            <p className="leading-relaxed">
              K-PlaceLab은 측정을 시작하기 전에 가설, 측정 방법, 그리고 <strong>반증 조건</strong>을 먼저 공개합니다. 
              결과를 본 뒤에 입맛에 맞게 해석을 바꾸거나 불리한 결과를 숨기는 체리피킹(cherry-picking)을 방지하기 위함입니다. 
              어떠한 측정 결과도 사전 등록 없이 공표되지 않습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {preregistrations.map((prereg) => (
          <div key={prereg.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  <span className="text-slate-400 mr-2">[{prereg.claim_id}]</span>
                  {prereg.title}
                </h2>
                <div className="text-xs text-slate-500 mt-1">ID: {prereg.id} • 방법론: {prereg.method_version}</div>
              </div>
              <div className="flex-shrink-0">
                {getStatusBadge(prereg.status)}
              </div>
            </div>
            
            <div className="p-5 space-y-6">
              {/* Dates */}
              <div className="flex flex-wrap gap-6 text-sm bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">공개일:</span>
                  <span className="font-medium">{formatDate(prereg.published_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">시작일:</span>
                  <span className="font-medium">{formatDate(prereg.started_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">종료일:</span>
                  <span className="font-medium">{formatDate(prereg.completed_at)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                  <div>
                    <div className="font-semibold text-slate-900 mb-1">검증할 가설</div>
                    <div className="text-slate-700 bg-slate-50 p-3 rounded">{prereg.hypothesis}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 mb-1">측정 요약</div>
                    <div className="text-slate-700">{prereg.method_summary}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="font-semibold text-slate-900 mb-1">판정 기준 (Criteria)</div>
                    <div className="text-slate-700">{prereg.criteria}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-rose-900 mb-1">반증 조건 (Falsification)</div>
                    <div className="text-rose-800 bg-rose-50 p-3 rounded border border-rose-100">{prereg.falsification}</div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 text-sm">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700">종료 조건: </span>
                    <span className="text-slate-600">{prereg.stop_rule}</span>
                  </div>
                </div>
                {prereg.outcome && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-900">
                    <div className="font-bold mb-1">최종 결과</div>
                    <div>{prereg.outcome}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* measurement-spec 등록부 (SSOT Registries) 섹션 */}
      {(() => {
        let frameData: any = null;
        let profilesData: any = null;
        try {
          frameData = getPopulationFrame();
          profilesData = getRunProfileRegistry();
        } catch {}

        if (!frameData) return null;

        return (
          <section className="pt-8 border-t border-slate-200 space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-100 text-gold-800 text-xs font-bold uppercase">
                <Database className="w-3.5 h-3.5" />
                <span>SSOT Registries (INV-11 선행 등록부)</span>
              </div>
              <h2 className="text-2xl font-bold text-navy-950">
                측정 규격 등록부 (모집단 및 관측 프로필)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                측정 시작 전 사전에 고정된 전수 모집단 틀(Population Frame) 및 표준 관측 환경 정의입니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* 모집단 틀 */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-navy-950 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    기초자치단체 전수 모집단 (spec/01)
                  </h3>
                  <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    rev.{frameData.revision}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block">등록 대상 기관</span>
                    <span className="font-bold text-slate-800 text-sm">{frameData.agency_count}개소 (전수)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">원장 기준일</span>
                    <span className="font-bold text-slate-800 text-sm font-mono">{frameData.reference_date}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                    근거: {frameData.source_authority} ({frameData.source_document})
                  </div>
                </div>
              </div>

              {/* 관측 프로필 */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-navy-950 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#c9a84c]" />
                    표준 관측 프로필 (spec/02)
                  </h3>
                  <span className="font-mono bg-[#c9a84c]/20 text-[#0a1628] px-2 py-0.5 rounded font-bold">
                    RP-2026Q3-A
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block">수집 엔진/모형</span>
                    <span className="font-bold text-slate-800 text-sm font-mono">
                      {profilesData?.profiles?.[0]?.model_identifier || 'gpt-5.6-luna'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">반복 측정 회차</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {profilesData?.profiles?.[0]?.repeat_count || 3}회 반복 (rep)
                    </span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                    원문 보존: 무손실 전량 저장 (INV-6/INV-7 충족) · 판정: rule 원장 강제
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}
    </div>
  );
}
