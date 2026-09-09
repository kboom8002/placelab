// app/(reviewer)/review/page.tsx
// 독립 소셜 판정 검토자 작업함 (PRD v3 §7.1, §7.2, INV-06, AC-08, AC-09)

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Lock,
  ArrowLeft,
} from 'lucide-react';

interface AssignedCase {
  caseId: string;
  claimId: string;
  claimStatement: string;
  targetCondition: string;
  evidenceTitle: string;
  evidenceUrl: string;
  authorId: string;
  deadline: string;
}

const SAMPLE_ASSIGNED_CASE: AssignedCase = {
  caseId: 'case-2026-089',
  claimId: 'c-01',
  claimStatement: '본 텀블러 본체 및 실리콘 패킹은 KOTITI 시험연구원에서 공인한 100% BPA Free 식품접촉 안심 재질이다.',
  targetCondition: '2026년 이후 생산 전 라인업',
  evidenceTitle: 'KOTITI 시험성적서 (접수번호: 2026-KT-8902)',
  evidenceUrl: 'https://example.com/cert/kotiti-bpa-free.pdf',
  authorId: 'author-brand-cleanbottle',
  deadline: '2026-09-12 18:00 UTC',
};

export default function ReviewerWorkspacePage() {
  const [conflictDeclared, setConflictDeclared] = useState(false);
  const [verdict, setVerdict] = useState<'supported' | 'contradicted' | 'insufficient' | null>(null);
  const [rationale, setRationale] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 현재 검토자 (가상 세션)
  const currentReviewerId = 'reviewer-univ-student-42';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conflictDeclared) {
      alert('이해관계 여부를 반드시 확인 및 신고해야 합니다 (INV-06).');
      return;
    }
    if (!verdict) {
      alert('판정 결과를 선택해 주세요.');
      return;
    }
    if (!rationale.trim()) {
      alert('판정 근거를 구체적으로 작성해 주세요.');
      return;
    }
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between">
          <Link
            href="/kbrandlab"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> K-Brand Lab 홈
          </Link>
          <div className="text-xs text-slate-500">
            검토자 ID: <strong className="text-slate-900 font-bold">{currentReviewerId}</strong>
          </div>
        </div>

        {/* 안내 카드 (INV-06, AC-09) */}
        <div className="bg-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-purple-200 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> 독립 소셜 판정 작업함 (Social Adjudication)
            </div>
            <h1 className="text-2xl font-black text-white">배정된 브랜드 사실 주장 독립 검토</h1>
            <p className="text-xs sm:text-sm text-purple-200 leading-relaxed">
              <strong>블라인드 독립 검토 원칙 (AC-09, INV-06):</strong> 다른 검토자의 의견이나 브랜드가 희망하는 결론은 최초 제출 전까지 완전히 비공개됩니다. 객관적 근거에 입각하여 독립적으로 판단하세요.
            </p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">독립 판정 응답이 안전하게 제출되었습니다</h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              제2검토자의 응답이 완료된 후 합의 또는 조정 단계로 진행됩니다. 제출된 판정 기록은 변경할 수 없으며 수정 시 이력으로 보존됩니다.
            </p>
            <Link
              href="/kbrandlab/canonical"
              className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
            >
              정본 대시보드로 이동
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 검토 대상 주장 카드 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-100 pb-3">
                <span>케이스 번호: <strong>{SAMPLE_ASSIGNED_CASE.caseId}</strong></span>
                <span>제출 마감: <strong>{SAMPLE_ASSIGNED_CASE.deadline}</strong></span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-purple-600 block">검증 대상 사실 주장</span>
                <p className="text-base font-bold text-slate-900 leading-relaxed bg-slate-50 p-4 rounded-xl">
                  "{SAMPLE_ASSIGNED_CASE.claimStatement}"
                </p>
                <p className="text-xs text-slate-500">
                  <strong>적용 조건:</strong> {SAMPLE_ASSIGNED_CASE.targetCondition}
                </p>
              </div>

              {/* 증거 자료 열람 */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-700 block mb-1">제공된 공인 증거 자료</span>
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-slate-900">{SAMPLE_ASSIGNED_CASE.evidenceTitle}</span>
                  </div>
                  <a
                    href={SAMPLE_ASSIGNED_CASE.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1 font-bold"
                  >
                    증거 원본 대조 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* 이해관계 신고 (INV-06) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                이해관계 부존재 확인 및 신고 (INV-06)
              </h2>
              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conflictDeclared}
                  onChange={(e) => setConflictDeclared(e.target.checked)}
                  className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                />
                <span>
                  본인은 대상 브랜드·제조사와의 고용, 협찬, 가족 관계, 자문 등 평가의 공정성을 해칠 수 있는 이해관계가 없음을 확인합니다. (해당 주장의 작성자가 아님을 서약함)
                </span>
              </label>
            </div>

            {/* 판정 선택 및 근거 작성 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">독립 검토 판정 결과</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${
                  verdict === 'supported' ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="verdict"
                    value="supported"
                    checked={verdict === 'supported'}
                    onChange={() => setVerdict('supported')}
                    className="sr-only"
                  />
                  🟢 지지됨 (Supported)<br />
                  <span className="text-[11px] text-slate-500 block mt-1">제시된 증거가 주장을 충분히 입증함</span>
                </label>

                <label className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${
                  verdict === 'contradicted' ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="verdict"
                    value="contradicted"
                    checked={verdict === 'contradicted'}
                    onChange={() => setVerdict('contradicted')}
                    className="sr-only"
                  />
                  🔴 반박됨 (Contradicted)<br />
                  <span className="text-[11px] text-slate-500 block mt-1">증거 내용과 주장이 상충되거나 허위임</span>
                </label>

                <label className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${
                  verdict === 'insufficient' ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="verdict"
                    value="insufficient"
                    checked={verdict === 'insufficient'}
                    onChange={() => setVerdict('insufficient')}
                    className="sr-only"
                  />
                  🟡 근거 불충분 (Insufficient)<br />
                  <span className="text-[11px] text-slate-500 block mt-1">자료 누락 또는 검증 불가</span>
                </label>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-slate-700 block">
                  판정 근거 및 검토 의견 (구체적 시험 항목 및 페이지 명시)
                </label>
                <textarea
                  rows={4}
                  placeholder="예: KOTITI 시험성적서 3페이지의 유해원소 용출 시험 결과, 납·카드뮴·비스페놀A 모두 '불검출' 기준을 충족함을 확인하였습니다."
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-all shadow-md"
                >
                  독립 판정 의견 최종 제출
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
