// app/(org)/kbrandlab/canonical/page.tsx
// 정본(Canonical) 및 주장(Claim) 검증 관리 화면 (PRD v3 §5.1, §6.3, FR-06, FR-07, FR-08)

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Database,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ExternalLink,
  ShieldCheck,
  Plus,
} from 'lucide-react';

interface ClaimItem {
  id: string;
  claimType: string;
  statement: string;
  targetCondition: string;
  knowledgeState: 'brand_reported' | 'supported' | 'contradicted' | 'insufficient';
  evidenceTitle: string;
  evidenceUrl: string;
  verifiedAt: string;
  adjudicationCaseId?: string;
}

const SAMPLE_CLAIMS: ClaimItem[] = [
  {
    id: 'c-01',
    claimType: 'performance_safety',
    statement: '본 텀블러 본체 및 실리콘 패킹은 KOTITI 시험연구원에서 공인한 100% BPA Free 식품접촉 안심 재질이다.',
    targetCondition: '2026년 이후 생산 전 라인업',
    knowledgeState: 'supported',
    evidenceTitle: 'KOTITI 시험성적서 (접수번호: 2026-KT-8902)',
    evidenceUrl: 'https://example.com/cert/kotiti-bpa-free.pdf',
    verifiedAt: '2026-08-20',
    adjudicationCaseId: 'case-101',
  },
  {
    id: 'c-02',
    claimType: 'experience_usability',
    statement: '본체와 뚜껑 분리 세척 시 식기세척기 표준 코스(70도 이하) 안심 사용이 가능하다.',
    targetCondition: '상단 랙 거치 조건',
    knowledgeState: 'supported',
    evidenceTitle: '자체 내열 및 코팅 박리 500회 세척 내구성 시험서',
    evidenceUrl: 'https://example.com/docs/dishwasher-test.pdf',
    verifiedAt: '2026-08-25',
    adjudicationCaseId: 'case-102',
  },
  {
    id: 'c-03',
    claimType: 'operational_terms',
    statement: '고무패킹 및 뚜껑 등 소모성 교체 부품은 공식 스토어에서 상시 구매 가능하며 주문 시 익일 발송된다.',
    targetCondition: '전국 배송 (도서산간 제외)',
    knowledgeState: 'brand_reported',
    evidenceTitle: '공식 온라인 스토어 소모품 카테고리 운영 정책',
    evidenceUrl: 'https://cleanbottle.example.com/parts',
    verifiedAt: '2026-09-01',
  },
  {
    id: 'c-04',
    claimType: 'product_spec_origin',
    statement: '스테인리스 스틸 원자재는 포스코 정품 POSCO 304(18-8) 강판만을 사용하여 100% 국내에서 성형·제작된다.',
    targetCondition: '메이드 인 코리아 각인 모델',
    knowledgeState: 'supported',
    evidenceTitle: '포스코 원자재 밀시트(Mill Sheet) 및 국내 공장 가공 증명',
    evidenceUrl: 'https://example.com/cert/posco-mill-sheet.pdf',
    verifiedAt: '2026-08-15',
    adjudicationCaseId: 'case-103',
  },
];

export default function CanonicalManagementPage() {
  const [claims, setClaims] = useState<ClaimItem[]>(SAMPLE_CLAIMS);

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between">
          <Link
            href="/kbrandlab"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> 대시보드로 돌아가기
          </Link>
          <div className="text-xs text-slate-500">
            정본 버전: <strong className="text-slate-900 font-bold">Revision 3 (Published)</strong>
          </div>
        </div>

        {/* 타이틀 카드 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-bold mb-2">
              <Database className="w-3.5 h-3.5" /> Entity Canonical Revision
            </div>
            <h1 className="text-2xl font-black text-slate-900">클린보틀 (CleanBottle) 정본 및 사실 주장</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              마케팅 문구가 아닌, 공인 시험 성적서 및 근거가 연결된 정본 주장을 관리하고 독립 2인 소셜 판정에 회부합니다.
            </p>
          </div>
          <Link
            href="/reviewer/adjudication"
            className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-all flex items-center gap-2 text-center justify-center"
          >
            <ShieldCheck className="w-4 h-4" /> 검토자 작업함 이동
          </Link>
        </div>

        {/* 주장 목록 */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">검증 대상 사실 주장 목록 ({claims.length}건)</h2>

          {claims.map((c) => {
            const stateColors = {
              supported: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              brand_reported: 'bg-amber-50 text-amber-700 border-amber-200',
              contradicted: 'bg-rose-50 text-rose-700 border-rose-200',
              insufficient: 'bg-slate-100 text-slate-600 border-slate-200',
            };

            const stateLabels = {
              supported: '검증 완료 (Supported)',
              brand_reported: '브랜드 진술 (Brand Reported)',
              contradicted: '반박됨 (Contradicted)',
              insufficient: '근거 불충분 (Insufficient)',
            };

            return (
              <div
                key={c.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                      {c.claimType}
                    </span>
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${stateColors[c.knowledgeState]}`}>
                      {stateLabels[c.knowledgeState]}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">확인일: {c.verifiedAt}</span>
                </div>

                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-900 leading-relaxed">
                    "{c.statement}"
                  </p>
                  <p className="text-xs text-slate-500">
                    <strong>적용 조건:</strong> {c.targetCondition}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>증거: <strong>{c.evidenceTitle}</strong></span>
                    <a
                      href={c.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      열기 <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {c.adjudicationCaseId ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 독립 2인 판정 완료 ({c.adjudicationCaseId})
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> 판정 검토 대기 중
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
