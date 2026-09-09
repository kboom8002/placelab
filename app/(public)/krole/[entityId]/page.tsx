// app/(public)/krole/[entityId]/page.tsx
// KRole 소비자 공개 뷰어 및 예약·구매 연계 화면 (PRD v3 §5.1, §10.1, §10.3, FR-15, FR-17)

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileText,
  ShoppingBag,
  MessageSquare,
  Sparkles,
  Layers,
} from 'lucide-react';

export const metadata = {
  title: '클린보틀 텀블러 정본 정보 | KRole',
  description: '공인 시험 성적서와 독립 검토로 검증된 한국 정품 브랜드 정보',
};

export default function KRolePublicEntityPage({ params }: { params: { entityId: string } }) {
  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* KRole 헤더 뱃지 */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
              K
            </span>
            <span className="font-black tracking-tight text-slate-900 text-sm">KRole Verified Entity</span>
          </div>
          <span className="text-xs text-slate-400">정본 고유 ID: {params.entityId}</span>
        </div>

        {/* 브랜드 및 제품 히어로 카드 */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> 독립 소셜 판정 검증 완료
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
            클린보틀 프리미엄 스테인리스 텀블러 (500ml)
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            포스코 정품 304 스테인리스 강판과 BPA Free 식품접촉 안심 실리콘을 사용하여 국내에서 정밀 가공된 보온·보냉 텀블러입니다.
          </p>

          {/* 구매 및 예약 연계 버튼 (FR-17) */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <a
              href="https://cleanbottle.example.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md"
            >
              <ShoppingBag className="w-4 h-4" /> 공식 스토어에서 정품 구매 (₩38,000)
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://cleanbottle.example.com/parts"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-1.5"
            >
              교체 부품·패킹 구매처
            </a>
          </div>
        </div>

        {/* 검증된 사실(Claim) vs 미확인 사항 투명 공개 (INV-04) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">검증된 공식 사실 (Verified Claims)</h2>
            <p className="text-xs text-slate-500">KRole은 마케팅 문구가 아닌 시험 성적서와 공인 문서 대조를 거친 사실만을 표기합니다.</p>
          </div>

          <div className="space-y-4">
            {/* 주장 1 */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 공인 안전성: 100% BPA Free 식품접촉 안심 재질
                </span>
                <span className="text-emerald-700 font-semibold">검증 완료</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                KOTITI 시험연구원 공인 시험 결과(2026-KT-8902), 본체 및 뚜껑 실리콘 패킹 전체에서 납·카드뮴·환경호르몬 불검출 기준을 충족하였습니다.
              </p>
            </div>

            {/* 주장 2 */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 식기세척기 안심 사용: 상단 랙 표준 코스 지원
                </span>
                <span className="text-emerald-700 font-semibold">검증 완료</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                분리 세척 기준 70도 이하 식기세척기 표준 코스 500회 세척 내구성 시험에서 외벽 코팅 박리나 실리콘 변형이 발생하지 않았습니다.
              </p>
            </div>

            {/* 미확인 사항 안내 (INV-04 투명성) */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" /> 소모품 당일 발송 운영 조건
                </span>
                <span className="text-amber-700 font-semibold">브랜드 진술 (추가 관찰 중)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                공식몰의 익일 발송 정책은 브랜드 운영 문서에 기초하고 있으나, 실제 배송 완료 데이터는 지속 검토 중입니다.
              </p>
            </div>
          </div>
        </div>

        {/* 소비자 피드백 (FR-16) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-3">
          <h3 className="text-sm font-bold text-slate-900">이 정보로 궁금증이 해결되셨나요?</h3>
          <p className="text-xs text-slate-500">소비자의 솔직한 질문과 피드백은 다음 정본 갱신과 품질 개선에 반영됩니다.</p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => alert('소중한 피드백 감사합니다!')}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
            >
              👍 충분히 도움됨
            </button>
            <button
              onClick={() => alert('추가 질문을 남겨주시면 연구팀이 검토합니다.')}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
            >
              💬 추가 질문이 있음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
