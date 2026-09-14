// app/(admin)/admin/promotions/page.tsx
// FR-72: 관리자 승격 관리 및 Layer 3 검증 측정 실행 대시보드

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Flame,
  Play,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Info,
  Clock,
  Send,
} from 'lucide-react';
import type { PromotionQueueItem, PromotionCandidate } from '@/lib/types/citizen-report';
import { REPORT_SYNDROME_LABELS } from '@/lib/types/citizen-report';

export default function AdminPromotionsPage() {
  const [queue, setQueue] = useState<PromotionQueueItem[]>([]);
  const [pendingCandidates, setPendingCandidates] = useState<PromotionCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [simulation, setSimulation] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai'>('gemini');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promotions');
      const data = await res.json();
      if (res.ok && data.success) {
        setQueue(data.queue || []);
        setPendingCandidates(data.pendingCandidates || []);
      }
    } catch {
      alert('승격 큐 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 승격 큐 후보 등록
  const handleQueueCandidate = async (candidate: PromotionCandidate) => {
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'queue_candidate',
          candidate,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('승격 큐에 등록되었습니다.');
        fetchData();
      } else {
        alert(data.error || '등록 실패');
      }
    } catch {
      alert('오류 발생');
    }
  };

  // Layer 3 실측 검증 실행
  const handleExecutePromotion = async (queueId: string) => {
    setExecutingId(queueId);
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute_promotion',
          queueId,
          providers: [selectedProvider],
          simulation,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Layer 3 검증 측정이 시작되었습니다. (Job ID: ${data.measureJobId})`);
        fetchData();
      } else {
        alert(data.error || '측정 실행 실패');
      }
    } catch {
      alert('통신 오류 발생');
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-950 text-gold-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Layer 2 ➔ Layer 3 승격 엔진 (FR-72)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 mt-1">
            승격 큐 및 Layer 3 검증 러너
          </h1>
          <p className="text-xs text-slate-500">
            시민 제보에서 포착된 취약 엣지 케이스를 표준 3회 이상 반복 통제 측정으로 정밀 검증합니다.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* 실행 환경 옵션 바 */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-bold text-navy-950">검증 실행 환경:</span>
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
            <input
              type="radio"
              name="provider"
              checked={selectedProvider === 'gemini'}
              onChange={() => setSelectedProvider('gemini')}
            />
            Gemini Search Grounding
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
            <input
              type="radio"
              name="provider"
              checked={selectedProvider === 'openai'}
              onChange={() => setSelectedProvider('openai')}
            />
            OpenAI (ChatGPT)
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">모드:</span>
          <button
            type="button"
            onClick={() => setSimulation(!simulation)}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              simulation
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}
          >
            {simulation ? '시뮬레이션 모드 (API 과금 없음)' : '실제 API 호출 모드 (Live)'}
          </button>
        </div>
      </div>

      {/* 1. 자동 탐지된 신규 승격 후보 (Pending Candidates) */}
      {pendingCandidates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-600" />
            <h2 className="text-base font-bold text-navy-950">
              자동 탐지된 신규 승격 후보 ({pendingCandidates.length}건)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingCandidates.map((c, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-950">{c.unitName}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-900">
                    {c.triggerSyndrome}
                  </span>
                </div>
                <div className="text-xs text-slate-700 font-medium">
                  "{c.probePrompt}"
                </div>
                <div className="text-[11px] text-rose-800/80">{c.reason}</div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleQueueCandidate(c)}
                    className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    승격 큐로 등록
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. 등록된 승격 큐 목록 */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-navy-950">
          승격 큐 등록 항목 ({queue.length}건)
        </h2>

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">로딩 중...</div>
        ) : queue.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            승격 큐에 대기 중인 항목이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((item) => {
              const syndrome = REPORT_SYNDROME_LABELS[item.trigger_syndrome];

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-950 text-sm">{item.unit_id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        우선순위: {item.priority}
                      </span>
                      {syndrome && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {syndrome.label.split(' ')[0]}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        트리거 제보: {item.trigger_count}건
                      </span>
                    </div>

                    <div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          item.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'measuring'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {item.status === 'completed' && '✓ 검증 실측 완료'}
                        {item.status === 'measuring' && '⚙️ Layer 3 측정 진행 중'}
                        {item.status === 'qualified' && '승격 승인 대기'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-500">정제된 검증 프로브 프롬프트:</span>
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-900 font-semibold border border-slate-200/80">
                      {item.probe_prompt}
                    </div>
                  </div>

                  {item.admin_note && (
                    <div className="text-xs text-slate-500">
                      <strong>검증 사유:</strong> {item.admin_note}
                    </div>
                  )}

                  {/* 실행 액션 바 */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      큐 등록일시: {item.created_at.slice(0, 16).replace('T', ' ')}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.measure_job_id && (
                        <Link
                          href={`/measure/spec-${item.unit_id}?jobId=${item.measure_job_id}`}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1 text-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          측정 리포트 보기
                        </Link>
                      )}

                      {item.status !== 'measuring' && (
                        <button
                          onClick={() => handleExecutePromotion(item.id)}
                          disabled={executingId === item.id}
                          className="px-4 py-2 bg-navy-950 hover:bg-navy-900 text-gold-300 font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm hover:scale-105"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>
                            {item.status === 'completed'
                              ? 'Layer 3 재검증 실행'
                              : '승인 및 Layer 3 검증 실행'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
