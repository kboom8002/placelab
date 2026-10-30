// app/(admin)/ops/page.tsx
// Phase 2 (11/10) & §11.1 & §12: 운영 콘솔 (/ops) — 동결 해시 · 중단 규칙 · 관찰 측정(서비스 A/B) · 3대 공표 게이트
import React from 'react';
import type { Metadata } from 'next';
import {
  evaluateBlockStoppingRules,
  H1_BLOCK_AGREEMENT_MIN,
  H3_AUTO_HUMAN_KAPPA_MIN,
  H5_CREW_OPS_AGREEMENT_MIN,
  H5_MIN_CREW_COUNT,
  PLACEBO_GLOBAL_STOP_RATE,
  TOOL_SOURCES_MISSING_HOLD_RATE,
  ObservationServiceStat,
} from '@/lib/jeongdap';
import { ShieldCheck, Lock, AlertOctagon, Database, Eye } from 'lucide-react';

export const metadata: Metadata = {
  title: '운영 콘솔 (/ops) — 모두의 정답노트',
  description:
    '문항 세트 동결 해시, 블록 중단 규칙 점검, 관찰 측정(서비스 A·B 비합산) 입력, 구간 경계 잠금 및 3대 공표 승인 콘솔',
};

const SAMPLE_OBSERVATION_STATS: ObservationServiceStat[] = [
  {
    maskedLabel: '서비스 A',
    sampleQuestionCount: 10,
    language: 'ko',
    stage3Count: 0,
    note: '정밀 측정과 합산하지 않습니다',
  },
  {
    maskedLabel: '서비스 B',
    sampleQuestionCount: 10,
    language: 'ko',
    stage3Count: 0,
    note: '정밀 측정과 합산하지 않습니다',
  },
];

export default function OpsConsolePage() {
  const sampleStopCheck = evaluateBlockStoppingRules({
    expectedModelVersion: 'gpt-5',
    observedModelVersions: ['gpt-5'],
    totalResponses: 2500,
    missingToolSourcesCount: 12,
    placeboFpRate: 0.03,
    activeCrewCount: 18,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="space-y-3 border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
          <Lock className="w-3.5 h-3.5 text-gold-400" />
          OPS GOVERNANCE CONSOLE · 운영 전용 (ops_admin / ops_analyst)
        </div>
        <h1 className="text-3xl font-black text-navy-950 tracking-tight">
          모두의 정답노트 운영·승인 콘솔 (/ops)
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          문항 동결 해시 확인, 1차 사전 등록 중단 규칙 실시간 감시, 관찰 측정(서비스 A·B) 분리 입력 및 3대 공표 게이트를 관리합니다.
        </p>
      </div>

      {/* 1. 사전 등록 중단 규칙 (P02 L141-149) 자동 감시 */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-navy-950 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-amber-600" />
            1. 블록 중단 규칙 (Stopping Rules) 실시간 감시
          </h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              sampleStopCheck.canProceedPrimary
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {sampleStopCheck.canProceedPrimary ? '정상 진행 가능' : '중단·재측정 필요'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 space-y-1">
            <span className="text-slate-500 font-semibold block">도구 반환 목록 누락 상한</span>
            <span className="font-mono font-bold text-sm text-navy-950">
              ≤ {TOOL_SOURCES_MISSING_HOLD_RATE * 100}%
            </span>
            <p className="text-slate-500">초과 시 1단(검색에 뜸) 판정 보류</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 space-y-1">
            <span className="text-slate-500 font-semibold block">위약 거짓 양성 중단선</span>
            <span className="font-mono font-bold text-sm text-navy-950">
              &lt; {PLACEBO_GLOBAL_STOP_RATE * 100}%
            </span>
            <p className="text-slate-500">10% 이상 시 등장 판정 전체 보류</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 space-y-1">
            <span className="text-slate-500 font-semibold block">블록 간 일치율 / 자동-사람 κ</span>
            <span className="font-mono font-bold text-sm text-navy-950">
              H1 ≥ {H1_BLOCK_AGREEMENT_MIN} / κ ≥ {H3_AUTO_HUMAN_KAPPA_MIN}
            </span>
            <p className="text-slate-500">미달 시 단일 시점 공표 보류</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 space-y-1">
            <span className="text-slate-500 font-semibold block">시민 확인단 최소 인원 (H5)</span>
            <span className="font-mono font-bold text-sm text-navy-950">
              ≥ {H5_MIN_CREW_COUNT}명 (합의 ≥ {H5_CREW_OPS_AGREEMENT_MIN})
            </span>
            <p className="text-slate-500">미달 시 H5 가설 검증 보류</p>
          </div>
        </div>
      </section>

      {/* 2. 관찰 측정 (서비스 A · 서비스 B) 분리 기록 (INV-4 · ADR-0019) */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
        <h2 className="text-lg font-black text-navy-950 flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-600" />
          2. 관찰 측정 (OpenAI 외 2개 서비스 소표본 · 정밀 측정과 비합산)
        </h2>
        <p className="text-xs text-slate-600">
          수원 10문항 × 한·영 × 2개 타 서비스 관찰 기록은 <code>ObservationServiceStat</code> 별도 타입으로 격리되며, OpenAI 정밀 측정 지표와 절대 합산하지 않습니다(INV-4).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {SAMPLE_OBSERVATION_STATS.map((s) => (
            <div key={s.maskedLabel} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-navy-950">{s.maskedLabel} ({s.language.toUpperCase()})</div>
              <div className="text-slate-600">표본 문항 수: {s.sampleQuestionCount}문항</div>
              <div className="text-amber-800 font-semibold">{s.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 3대 공표 승인 게이트 (ADR-0016 · INV-11 · INV-16) */}
      <section className="p-6 rounded-2xl bg-navy-950 text-white space-y-3">
        <h2 className="text-lg font-black flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          3. 자체 사업 3대 공표 승인 게이트 (ADR-0016)
        </h2>
        <ul className="space-y-1.5 text-xs text-slate-300">
          <li>✓ 게이트 1: 사전 등록 해시(<code>jeongdap-freeze-manifest-v1.0.json</code>) 일치 확인 (INV-11)</li>
          <li>✓ 게이트 2: 사람 판정 대기열(고위험 2인 독립 판정) 100% 완료 및 운영자 승인</li>
          <li>✓ 게이트 3: 재난·안전(<code>disaster=true</code>) 문항 공개 응답 제외 필터 통과 (INV-16)</li>
        </ul>
      </section>
    </div>
  );
}
