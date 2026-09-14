// app/(admin)/admin/reports/page.tsx
// FR-70: 관리자 시민 제보 검수 큐 (PII 검수, 중복 병합, 승격 자격 부여)

'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import type { CitizenReport, PromotionStatus } from '@/lib/types/citizen-report';
import { REPORT_SYNDROME_LABELS } from '@/lib/types/citizen-report';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url =
        statusFilter === 'all'
          ? '/api/admin/reports'
          : `/api/admin/reports?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setReports(data.reports);
      }
    } catch {
      alert('제보 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleUpdateStatus = async (
    id: string,
    patch: Partial<{ status: PromotionStatus; piiChecked: boolean; adminNote: string }>
  ) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...data.report } : r))
        );
      } else {
        alert(data.error || '상태 변경에 실패했습니다.');
      }
    } catch {
      alert('통신 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-gold-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            관리자 콘솔 · FR-70 검수 큐
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 mt-1">
            시민 제보 검수 및 PII 관리
          </h1>
          <p className="text-xs text-slate-500">
            접수된 시민 제보의 개인정보(PII) 노출 여부와 타당성을 검토하고, 작화 및 중대 오류를 승격 큐로 연결합니다.
          </p>
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* 상태 필터 탭 */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {['all', 'pending', 'qualified', 'completed', 'rejected'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === st
                ? 'bg-navy-950 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st === 'all' && '전체'}
            {st === 'pending' && '검토 대기 (Pending)'}
            {st === 'qualified' && '승격 적격 (Qualified)'}
            {st === 'completed' && '검증 완료 (Completed)'}
            {st === 'rejected' && '반려됨 (Rejected)'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          제보 목록을 불러오는 중...
        </div>
      ) : reports.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          해당 상태의 제보 내역이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => {
            const syndrome = r.syndrome_self ? REPORT_SYNDROME_LABELS[r.syndrome_self] : null;

            return (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy-950 text-sm">{r.unit_id}</span>
                    {r.is_confabulation && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        작화 (Critical Floor)
                      </span>
                    )}
                    {syndrome && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {syndrome.label.split(' ')[0]}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-400">
                      [{r.ai_service} / {r.model_version || '기본'}]
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.status === 'qualified'
                          ? 'bg-indigo-100 text-indigo-800'
                          : r.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'rejected'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      상태: {r.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {r.created_at.slice(0, 10)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 block">시민 프롬프트:</span>
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-800 font-medium">
                      {r.prompt_used}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 block">AI 응답 요약:</span>
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-800">
                      {r.ai_response_summary}
                    </div>
                  </div>
                </div>

                {r.evidence_note && (
                  <div className="p-2.5 bg-amber-50/60 rounded-lg text-xs text-amber-900">
                    <span className="font-bold mr-1">제보자 소명/근거:</span>
                    {r.evidence_note}
                  </div>
                )}

                {r.screenshot_url && (
                  <div className="text-xs">
                    <a
                      href={r.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      첨부 스크린샷 보기
                    </a>
                  </div>
                )}

                {/* 검수 컨트롤 */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.pii_checked
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {r.pii_checked ? 'PII 검수 완료' : 'PII 미검수 (공개 불가)'}
                    </span>
                    {!r.pii_checked && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(r.id, { piiChecked: true })
                        }
                        disabled={actionLoading === r.id}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-all"
                      >
                        PII 정상 확인
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {r.status !== 'qualified' && r.status !== 'completed' && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(r.id, {
                            status: 'qualified',
                            piiChecked: true,
                          })
                        }
                        disabled={actionLoading === r.id}
                        className="px-3 py-1.5 bg-navy-950 hover:bg-navy-900 text-gold-300 rounded-lg font-bold transition-all"
                      >
                        승격 큐 등록 (Qualified)
                      </button>
                    )}

                    {r.status !== 'rejected' && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(r.id, { status: 'rejected' })
                        }
                        disabled={actionLoading === r.id}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-lg transition-all"
                      >
                        반려
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
  );
}
