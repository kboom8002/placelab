'use client';

// app/(admin)/correction-mgmt/page.tsx
// FR-47: 관리자용 정정 요청 처리 및 원장 갱신 관리
// 불변식: 제출자 개인정보 보호(이메일 비공개), 원장 기준일 이력 불변 관리

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Building2,
  AlertCircle,
  ArrowRight,
  Filter,
  Check,
  X,
} from 'lucide-react';
import clsx from 'clsx';

interface CorrectionRequest {
  id: string;
  agencyHandle: string;
  agencyName: string;
  questionId: string;
  currentVerdict: string;
  claimedVerdict: string;
  rationale: string;
  evidenceUrl: string;
  submitterRole: string;
  submittedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

const SAMPLE_CORRECTIONS: CorrectionRequest[] = [
  {
    id: 'CORR-2026-01',
    agencyHandle: 'AG-0023',
    agencyName: '수원특례시',
    questionId: 'COR-0005',
    currentVerdict: 'C1 (수치불일치)',
    claimedVerdict: '일치 (정확)',
    rationale: '2026년 7월 조례 개정으로 첫째·둘째 지원이 통합 축하금 10만원으로 공식 변경 공고되었습니다.',
    evidenceUrl: 'https://www.suwon.go.kr/news/notice/view.do?idx=20260715',
    submitterRole: '수원시청 홍보담당관',
    submittedAt: '2026-09-14 09:30',
    status: 'pending',
  },
  {
    id: 'CORR-2026-02',
    agencyHandle: 'AG-0045',
    agencyName: '논산시',
    questionId: 'COR-0012',
    currentVerdict: 'N1 (기술차단)',
    claimedVerdict: '개방 (open)',
    rationale: '시청 방화벽 설정 오류를 수정하여 KPlaceLabBot에 대한 robots.txt 접근 제한을 완전 해제하였습니다.',
    evidenceUrl: 'https://www.nonsan.go.kr/robots.txt',
    submitterRole: '논산시 자치행정과 정보통신팀',
    submittedAt: '2026-09-14 10:15',
    status: 'pending',
  },
  {
    id: 'CORR-2026-03',
    agencyHandle: 'AG-0089',
    agencyName: '증평군',
    questionId: 'COR-0010',
    currentVerdict: 'C4 (대상혼동)',
    claimedVerdict: '해당없음 (not_applicable)',
    rationale: '해당 사업은 인접 청주시의 조례이며 증평군은 조례 제정 이력이 없으므로 해당없음으로 정정을 요청합니다.',
    evidenceUrl: 'https://www.elis.go.kr',
    submitterRole: '증평군청 주민복지과',
    submittedAt: '2026-09-13 16:40',
    status: 'accepted',
  },
];

export default function AdminCorrectionMgmtPage() {
  const [requests, setRequests] = useState<CorrectionRequest[]>(SAMPLE_CORRECTIONS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  const handleUpdateStatus = (id: string, newStatus: 'accepted' | 'rejected') => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const filteredRequests = requests.filter(r => {
    if (activeFilter === 'all') return true;
    return r.status === activeFilter;
  });

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#0a1628] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* 헤더 바 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-navy-900 tracking-wider uppercase block mb-1">
              ADMIN CORRECTION MANAGEMENT
            </span>
            <h1 className="text-2xl font-bold text-gray-900">정정 및 소명 요청 관리</h1>
            <p className="text-xs text-gray-500 mt-1">
              사전 통지 기간 중 소관 기관이 제출한 사실 기준 갱신 증빙 검토 및 원장 반영 워크플로
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="p-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg font-bold">
              처리 대기: {requests.filter(r => r.status === 'pending').length}건
            </span>
          </div>
        </div>

        {/* 탭 필터 */}
        <div className="flex items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: '전체 요청' },
            { id: 'pending', label: '처리 대기' },
            { id: 'accepted', label: '수용 및 원장 반영' },
            { id: 'rejected', label: '반려' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={clsx(
                "px-3 py-1.5 rounded-lg font-medium transition-colors",
                activeFilter === tab.id
                  ? "bg-[#0a1628] text-white font-bold"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 요청 카드 목록 */}
        <div className="space-y-4">
          {filteredRequests.map(req => (
            <div
              key={req.id}
              className={clsx(
                "bg-white rounded-2xl border p-5 shadow-xs space-y-4 transition-all",
                req.status === 'accepted' ? "border-emerald-200 bg-emerald-50/20" :
                req.status === 'rejected' ? "border-gray-200 opacity-60" : "border-gray-300"
              )}
            >
              {/* 상단 라인 */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                    {req.id}
                  </span>
                  <span className="font-semibold text-gray-900 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#c9a84c]" /> {req.agencyName} ({req.agencyHandle})
                  </span>
                  <span className="text-gray-400 font-mono">[{req.questionId}]</span>
                  <span className="text-gray-500">• {req.submitterRole}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    "px-2 py-0.5 rounded text-[11px] font-bold",
                    req.status === 'accepted' ? "bg-emerald-100 text-emerald-800" :
                    req.status === 'rejected' ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-800"
                  )}>
                    {req.status === 'accepted' ? '수용 완료' : req.status === 'rejected' ? '반려됨' : '심사 대기'}
                  </span>
                  <span className="text-gray-400 font-mono text-[11px]">{req.submittedAt}</span>
                </div>
              </div>

              {/* 판정 변경 요청 대조 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block mb-1">현재 공표 판정</span>
                  <span className="font-bold text-rose-700">{req.currentVerdict}</span>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 block mb-1">소관 기관 정정 요청 판정</span>
                  <span className="font-bold text-emerald-900">{req.claimedVerdict}</span>
                </div>
              </div>

              {/* 사유 및 증빙 */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-gray-700 block mb-0.5">정정 사유 및 소명 내용:</span>
                  <p className="text-gray-800 leading-relaxed bg-[#f8f7f4] p-3 rounded-xl border border-gray-200">
                    {req.rationale}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-gray-500 font-medium">증빙 출처:</span>
                  <a
                    href={req.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-mono inline-flex items-center gap-1"
                  >
                    {req.evidenceUrl} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* 관리자 승인/반려 컨트롤 */}
              {req.status === 'pending' && (
                <div className="flex items-center justify-end gap-2 pt-3 border-t text-xs">
                  <button
                    onClick={() => handleUpdateStatus(req.id, 'rejected')}
                    className="px-3 py-1.5 border border-gray-300 hover:bg-gray-100 rounded-lg font-semibold text-gray-600 transition-colors"
                  >
                    소명 반려
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(req.id, 'accepted')}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" /> 수용 및 원장 사실 갱신 승인
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
