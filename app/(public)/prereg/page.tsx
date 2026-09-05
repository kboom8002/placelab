import React from 'react';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AlertCircle, Calendar, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';

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
    </div>
  );
}
