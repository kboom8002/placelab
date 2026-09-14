'use client';

// app/(admin)/review/page.tsx
// FR-45: 관리자용 판정 리뷰 큐 (C0 대조불가, C1~C4 부정합, Unstable 관측 검토)
// 불변식: AI 응답 원문 비공개(INV-6, 최소 인용구만), 점수로 정렬 금지(INV-3)

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Filter,
  FileCheck2,
  HelpCircle,
  Eye,
  Check,
  X,
  Building2,
} from 'lucide-react';
import clsx from 'clsx';

interface ReviewQueueItem {
  id: string;
  agencyHandle: string;
  agencyName: string;
  questionId: string;
  questionText: string;
  code: 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'UNSTABLE';
  observedValue: string;
  ledgerValue?: string;
  temporalNote?: string;
  status: 'pending' | 'reviewed' | 'disputed';
  observedAt: string;
}

const SAMPLE_REVIEW_ITEMS: ReviewQueueItem[] = [
  {
    id: 'REV-01',
    agencyHandle: 'AG-0023',
    agencyName: '수원특례시',
    questionId: 'COR-0005',
    questionText: '둘째 아이 출산 시 지급되는 출산지원금 총액',
    code: 'C1',
    observedValue: '1,000,000원 지급으로 진술',
    ledgerValue: '둘째아 지원금 없음 (첫째·둘째 출산축하용품 10만원 상당 지원)',
    status: 'pending',
    observedAt: '2026-09-14 10:20',
  },
  {
    id: 'REV-02',
    agencyHandle: 'AG-0045',
    agencyName: '논산시',
    questionId: 'COR-0007',
    questionText: '노인 일자리 사업 접수 시작일',
    code: 'C3',
    observedValue: '2024년 12월 4일 시작으로 진술',
    ledgerValue: '2025년 12월 1일 접수 시작 (2026년도 사업 기준)',
    temporalNote: '원장 기준일(2026) 대비 과거년도(2024) 공고를 진술하는 시점 어긋남 감지',
    status: 'pending',
    observedAt: '2026-09-14 11:05',
  },
  {
    id: 'REV-03',
    agencyHandle: 'AG-0089',
    agencyName: '증평군',
    questionId: 'COR-0010',
    questionText: '65세 이상 어르신 목욕권 또는 이·미용권 지급 제도',
    code: 'UNSTABLE',
    observedValue: '1회차 "지급 없음" vs 2회차 "분기별 4매 지급" 회차 간 모순 발생',
    ledgerValue: '증평군 어르신 목욕권 지원 조례 없음 (미운영)',
    status: 'pending',
    observedAt: '2026-09-14 11:30',
  },
  {
    id: 'REV-04',
    agencyHandle: 'AG-0112',
    agencyName: '완도군',
    questionId: 'COR-0014',
    questionText: '소상공인 특례보증 이자차액보전 지원 비율',
    code: 'C0',
    observedValue: '연 2.5%p 이자 지원으로 진술',
    ledgerValue: '원장 미등록 (조례 개정 진행 중으로 공식 기준값 미기재)',
    status: 'pending',
    observedAt: '2026-09-14 11:45',
  },
];

export default function AdminReviewPage() {
  const [items, setItems] = useState<ReviewQueueItem[]>(SAMPLE_REVIEW_ITEMS);
  const [filterCode, setFilterCode] = useState<string>('all');

  const handleAction = (id: string, newStatus: 'reviewed' | 'disputed') => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  const filteredItems = items.filter(item => {
    if (filterCode === 'all') return true;
    return item.code === filterCode;
  });

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#0a1628] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* 헤더 바 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-rose-600 tracking-wider uppercase block mb-1">
              ADMIN ADJUDICATION QUEUE
            </span>
            <h1 className="text-2xl font-bold text-gray-900">제출물 및 판정 이상 검토 큐</h1>
            <p className="text-xs text-gray-500 mt-1">
              규칙 원장 대조 과정에서 도출된 C0~C4 부정합 코드 및 반복 간 회차 불안정(Unstable) 관측 검토
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="p-2 rounded-lg bg-gray-100 text-gray-700 font-medium">
              대기 중: <strong className="text-rose-600">{items.filter(i => i.status === 'pending').length}</strong>건
            </span>
            <span className="p-2 rounded-lg bg-gray-100 text-gray-700 font-medium">
              검토 완료: <strong className="text-emerald-600">{items.filter(i => i.status === 'reviewed').length}</strong>건
            </span>
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: '전체 보기' },
            { id: 'C1', label: 'C1 수치불일치' },
            { id: 'C3', label: 'C3 시점어긋남' },
            { id: 'UNSTABLE', label: '회차간 불안정' },
            { id: 'C0', label: 'C0 원장미대조' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterCode(f.id)}
              className={clsx(
                "px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0",
                filterCode === f.id
                  ? "bg-[#0a1628] text-white font-bold"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 큐 리스트 */}
        <div className="space-y-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={clsx(
                "bg-white rounded-2xl border p-5 transition-all shadow-xs space-y-4",
                item.status === 'reviewed' ? "opacity-60 border-gray-200" : "border-gray-300"
              )}
            >
              {/* 상단 메타 */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    {item.id}
                  </span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#c9a84c]" /> {item.agencyName} ({item.agencyHandle})
                  </span>
                  <span className="text-gray-400 font-mono">[{item.questionId}]</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    "px-2 py-0.5 rounded text-[11px] font-bold font-mono",
                    item.code === 'C3' ? "bg-amber-100 text-amber-800" :
                    item.code === 'C1' ? "bg-rose-100 text-rose-800" :
                    item.code === 'UNSTABLE' ? "bg-purple-100 text-purple-800" :
                    "bg-blue-100 text-blue-800"
                  )}>
                    {item.code}
                  </span>
                  <span className="text-gray-400 font-mono text-[11px]">{item.observedAt}</span>
                </div>
              </div>

              {/* 질문 내용 */}
              <div>
                <span className="text-[11px] text-gray-400 block mb-0.5">문항</span>
                <p className="font-bold text-sm text-gray-900">{item.questionText}</p>
              </div>

              {/* 진술 대조 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 space-y-1">
                  <span className="text-rose-700 font-bold block">AI 모델 관측 진술</span>
                  <p className="text-gray-800 font-medium leading-relaxed">{item.observedValue}</p>
                  {item.temporalNote && (
                    <p className="text-[11px] text-rose-600 pt-1 border-t border-rose-100">
                      ⚠️ {item.temporalNote}
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                  <span className="text-emerald-800 font-bold block">원장 사실 기준 (Ground Truth)</span>
                  <p className="text-gray-800 font-medium leading-relaxed">
                    {item.ledgerValue || '원장에 등록된 기준값 없음'}
                  </p>
                </div>
              </div>

              {/* 액션 컨트롤 */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <span className={clsx(
                  "font-bold",
                  item.status === 'reviewed' ? "text-emerald-600" :
                  item.status === 'disputed' ? "text-amber-600" : "text-gray-400"
                )}>
                  상태: {item.status === 'reviewed' ? '✅ 검토 및 확인 완료' : item.status === 'disputed' ? '⚠️ 재확인 대기' : '대기 중'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(item.id, 'disputed')}
                    className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  >
                    재확인 필요
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'reviewed')}
                    className="px-3 py-1.5 bg-[#0a1628] text-white hover:bg-navy-900 rounded-lg font-bold transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> 이상 없음 확인
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
