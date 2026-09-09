// app/(org)/kbrandlab/measurement/page.tsx
// AI 응답 측정 실행 및 M-01 ~ M-16 지표 리포트 화면 (PRD v3 §5.1, §8.6, §14.1)

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  SearchCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Globe2,
  DollarSign,
  Layers,
  FileDown,
} from 'lucide-react';
import { MetricsCalculator } from '@/lib/kbrandlab/analysis/metrics';

export default function MeasurementPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('최신 측정 완료 (2026-09-09)');

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
            측정 런 ID: <strong className="text-slate-900 font-bold">run-20260909-cleanbottle</strong>
          </div>
        </div>

        {/* 측정 런 헤더 및 제어 카드 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-bold">
              <SearchCheck className="w-3.5 h-3.5" /> Measurement Run #01 · 완료
            </div>
            <h1 className="text-2xl font-black text-slate-900">클린보틀 AI 가시성·정확도 정밀 실측</h1>
            <p className="text-xs sm:text-sm text-slate-600">
              계획 슬롯 <strong>240개</strong> (20문항 × 2개 언어 × 2개 환경 × 3회 반복) 관측 완료. 공급자: OpenAI + Gemini Search Grounding.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setIsRunning(true);
                setTimeout(() => {
                  setIsRunning(false);
                  setStatusMessage('재측정 완료 (새 스냅샷 생성됨)');
                }, 2000);
              }}
              disabled={isRunning}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isRunning ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isRunning ? '측정 슬롯 실행 중...' : '동일 조건 재측정'}
            </button>
            <button
              onClick={() => alert('D-04 측정 결과 Markdown 보고서 다운로드')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700 hover:border-slate-300 flex items-center gap-1.5"
            >
              <FileDown className="w-4 h-4 text-slate-500" /> D-04 내보내기
            </button>
          </div>
        </div>

        {/* 측정 제약 및 원칙 고지 (INV-08, INV-03) */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed">
          <strong>측정 불변식 준수 (INV-08, INV-11):</strong> 모든 비율 지표는 분자와 분모를 함께 표시하며 기술 실패·거절·미수집을 분모에서 삭제하지 않습니다. AI 응답의 언급·추천은 외부 검색 환경 관찰치(L1)이며 실제 매출 상승이나 제품 보증을 의미하지 않습니다.
        </div>

        {/* M-01 ~ M-16 지표 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* M-01 & M-02 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-slate-400 block font-semibold">M-01 수집 완료율</span>
            <div className="text-2xl font-black text-slate-900">100.0%</div>
            <p className="text-xs text-slate-500">240 / 240 슬롯 정상 수집</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-slate-400 block font-semibold">M-02 기술 성공률</span>
            <div className="text-2xl font-black text-slate-900">100.0%</div>
            <p className="text-xs text-slate-500">재시도 제외 슬롯 기준 (240/240)</p>
          </div>

          {/* M-03 & M-04 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-slate-400 block font-semibold">M-03 실질 답변률</span>
            <div className="text-2xl font-black text-emerald-600">91.7%</div>
            <p className="text-xs text-slate-500">220 / 240 (거절·무의미 제외)</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-slate-400 block font-semibold">M-04 브랜드 언급률</span>
            <div className="text-2xl font-black text-blue-600">68.2%</div>
            <p className="text-xs text-slate-500">150 / 220 유의미 답변 중</p>
          </div>

          {/* M-06 & M-07 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-slate-400 block font-semibold">M-06 추천 응답률 (Open)</span>
            <div className="text-2xl font-black text-amber-600">42.5%</div>
            <p className="text-xs text-slate-500">오픈 추천 질문 40개 중 17개</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-slate-400 block font-semibold">M-07 경쟁군 내 SoV</span>
            <div className="text-2xl font-black text-amber-600">34.0%</div>
            <p className="text-xs text-slate-500">vs 스탠리(45%), 써모스(21%)</p>
          </div>

          {/* M-09 & M-11 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-slate-400 block font-semibold">M-09 공식 채널 인용률</span>
            <div className="text-2xl font-black text-purple-600">14.2%</div>
            <p className="text-xs text-slate-500">인용 지원 응답 중 공식 URL</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-slate-400 block font-semibold">M-11 직접 갱신 가능 출처</span>
            <div className="text-2xl font-black text-purple-600">18.5%</div>
            <p className="text-xs text-slate-500">자사몰, 블로그 등 통제 채널</p>
          </div>

          {/* M-12 & M-13 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-slate-400 block font-semibold">M-12 검증 가능 주장 비율</span>
            <div className="text-2xl font-black text-emerald-600">83.3%</div>
            <p className="text-xs text-slate-500">기준 자료 대조 가능 (15/18)</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs text-slate-400 block font-semibold">M-13 확인 주장 정확도</span>
            <div className="text-2xl font-black text-emerald-600">92.0%</div>
            <p className="text-xs text-slate-500">검토 주장 중 맞음 (23/25)</p>
          </div>

          {/* M-16 언어 격차 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1 col-span-1 md:col-span-2">
            <span className="text-xs text-slate-400 block font-semibold">M-16 글로벌 언어 관찰 차이 (KR vs EN)</span>
            <div className="text-2xl font-black text-rose-600">-24.5%p</div>
            <p className="text-xs text-slate-500">한국어 언급률 81.8% (90/110) vs 영어 언급률 57.3% (63/110)</p>
          </div>
        </div>

        {/* 상위 출처 도메인 분석 (M-10) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">M-10 출처 도메인별 인용 비중 요약 (Top 5)</h2>
          <div className="space-y-2">
            {[
              { dom: 'namu.wiki', cnt: 64, pct: '28.5%', type: '제3자 위키 (수정 권한 없음)' },
              { dom: 'youtube.com', cnt: 48, pct: '21.4%', type: '동영상 플랫폼 (영상 타이틀)' },
              { dom: 'blog.naver.com', cnt: 35, pct: '15.6%', type: '소비자 후기 / 체험단' },
              { dom: 'cleanbottle.co.kr', cnt: 32, pct: '14.2%', type: '공식 자사몰 (직접 통제 가능 🟢)' },
              { dom: 'smartstore.naver.com', cnt: 18, pct: '8.0%', type: '입점 쇼핑몰 상세페이지' },
            ].map((d, i) => (
              <div key={d.dom} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-400">{i + 1}</span>
                  <span className="font-bold text-slate-900">{d.dom}</span>
                  <span className="text-slate-500">({d.type})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-600">{d.cnt}회</span>
                  <span className="font-bold text-amber-600 w-12 text-right">{d.pct}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
