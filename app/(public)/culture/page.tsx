// app/(public)/culture/page.tsx
// FR-86: 지역 문화 트랙 공개 화면 (탐색적 민간 공익 측정 고정 문구 필수)
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CULTURE_TRACK_DISCLAIMER,
  QUESTION_PANEL_COUNTS,
  PANEL_5_UNITS,
} from '@/lib/jeongdap';
import { Landmark, ShieldAlert, BookOpen, Send, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: '지역 문화 트랙 — 모두의 정답노트',
  description:
    '유산·음식·축제·자연·인물·이야기 5대 분야 200문항을 통해 지역 문화 정본의 AI 인용과 공급 공백을 측정하는 탐색적 민간 공익 트랙 (FR-86)',
};

const CULTURE_SUBTRACKS = [
  {
    code: 'CL-HERITAGE',
    title: '국가유산 · 향토유산',
    count: 40,
    desc: '지정 명칭, 소재지, 관람 시간·휴관일, 해설 안내 등 공공 정본 대조',
    example: '수원 화성 행궁 야간 개장 기간과 입장료는 얼마인가요?',
  },
  {
    code: 'CL-FOOD',
    title: '향토 음식 · 특산물',
    count: 40,
    desc: '지리적 표시 등록 특산물, 전통 시장·먹거리 거리 등 공적 등록 사실 확인 (개별 상업 업소 순위 제외 · INV-18)',
    example: '완도군에서 지리적 표시제로 등록된 대표 수산물은 무엇인가요?',
  },
  {
    code: 'CL-FESTIVAL',
    title: '지역 대표 축제 · 행사',
    count: 40,
    desc: '공식 개최 기간, 주최 기관, 주요 프로그램, 우천·취소 안내 등 시점 민감 정보 검증',
    example: '올해 청양 고추·구기자 축제는 언제 어디서 열리나요?',
  },
  {
    code: 'CL-NATURE',
    title: '자연 · 생태 · 둘레길',
    count: 40,
    desc: '군립·도립공원, 갯벌·습지, 공식 걷기길 코스와 탐방 예약 기준 확인',
    example: '화성시 제부도 바닷길 통행 가능 시간표는 어디서 확인하나요?',
  },
  {
    code: 'CL-STORY',
    title: '역사 인물 · 지명 이야기',
    count: 40,
    desc: '시·군지(市郡誌), 디지털향토문화대전 등 공적 문헌에 기록된 역사 사실과 AI 작화 대조',
    example: '구로구 명칭의 유래와 관련된 공식 기록은 무엇인가요?',
  },
] as const;

export default function CultureTrackPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* 1. 필수 고정 고지 배너 (FR-86 / 06_local-culture-track-operations.md) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-3.5 shadow-sm">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm">
          <div className="font-black text-amber-950">
            지역 문화 트랙 필수 고지 (FR-86)
          </div>
          <p className="font-semibold text-amber-900">
            &ldquo;{CULTURE_TRACK_DISCLAIMER}&rdquo;
          </p>
          <p className="text-xs text-amber-800">
            특정 상업 음식점·숙박업소의 맛이나 평점 순위를 매기지 않으며(INV-18), 지자체·국가유산청·한국학중앙연구원 등 공적 정본이 AI 답변에 어떻게 인용되는지만 측정합니다.
          </p>
        </div>
      </div>

      {/* 2. 헤더 */}
      <div className="space-y-4 border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
          <Landmark className="w-3.5 h-3.5 text-gold-400" />
          LOCAL CULTURE TRACK · 지역 문화 {QUESTION_PANEL_COUNTS.local_culture}문항
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-navy-950 tracking-tight">
          지역 문화 트랙: 우리 동네 문화유산과 축제를 AI는 어떻게 답하는가
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          지역 문화 정보는 민원·복지 정보보다 공식 누리집에 기계가 읽을 수 있는 정본 문서가 없는 경우(<strong>공급 공백</strong>)가 많습니다.
          모두의 정답노트는 5곳 기준 패널({PANEL_5_UNITS.map((u) => u.name_ko).join(' · ')})의 550문항 중 <strong>{QUESTION_PANEL_COUNTS.local_culture}문항</strong>을 지역 문화 5대 분야에 배정하여 출처 4단(S1~S4)과 공급 공백을 분리 진단합니다.
        </p>
      </div>

      {/* 3. 5대 문화 세부 분야 */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-black text-navy-950">
          지역 문화 5대 측정 분야 (총 {QUESTION_PANEL_COUNTS.local_culture}문항)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CULTURE_SUBTRACKS.map((sub) => (
            <div
              key={sub.code}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-navy-800 bg-slate-100 px-2.5 py-0.5 rounded">
                    {sub.code}
                  </span>
                  <span className="text-xs font-bold text-gold-700">{sub.count}문항</span>
                </div>
                <h3 className="text-base font-black text-navy-950">{sub.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{sub.desc}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700 block mb-0.5">질문 예시:</span>
                &ldquo;{sub.example}&rdquo;
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 출처 4단 + 공급 공백 진단 구조 */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-navy-950 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          왜 지역 문화에서 「공급 공백」 분리가 중요한가
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          지역 축제 일정이 포스터 이미지(JPG) 한 장으로만 올라와 있거나 향토 유산 설명이 웹 문서로 존재하지 않으면,
          AI는 개인 블로그나 오래된 기사를 베껴 틀린 날짜·입장료를 답하게 됩니다.
          모두의 정답노트는 이를 AI 모델의 탓으로만 돌리지 않고, <strong>공식 웹 정본이 없는 「공급 공백」 건수</strong>를 따로 집계해 지자체와 지역 문화재단이 어떤 문서부터 텍스트로 열어야 하는지 알려줍니다.
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <Link
            href="/report"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-950 text-white text-xs font-bold hover:bg-navy-900 transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-gold-400" />
            우리 동네 축제·문화유산 AI 오답 제보하기
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/method"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-navy-950 text-xs font-bold hover:bg-slate-200 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            출처 4단 · 공급 공백 판정 기준 보기
          </Link>
        </div>
      </section>
    </div>
  );
}
