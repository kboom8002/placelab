'use client';

// app/(public)/theme-lab/map/page.tsx
// Policy Theme Lab 질문 지도 (FR-64)
// 7대 생활주제 × 6대 과업단계 매트릭스 및 5대 빈칸 탐지

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  ChevronRight,
  Filter,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { SEED_QUESTIONS } from '@/lib/theme-lab/seed-data';
import {
  THEME_LAB_TOPIC_LABELS,
  THEME_LAB_STAGE_LABELS,
} from '@/lib/constants/measurement';
import { LifeTopic, TaskStage, RefinedQuestion } from '@/lib/theme-lab/types';

const TOPICS: LifeTopic[] = [
  'housing',
  'care',
  'mobility',
  'work',
  'environment',
  'culture',
  'civic_admin',
];

const STAGES: TaskStage[] = [
  'discovery',
  'understanding',
  'comparison',
  'application',
  'use',
  'post_confirmation',
];

export default function ThemeLabMapPage() {
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedCell, setSelectedCell] = useState<{ topic: LifeTopic; stage: TaskStage } | null>(null);

  const filteredQuestions = SEED_QUESTIONS.filter((q) => {
    if (selectedUnit === 'all') return true;
    return q.unitId === selectedUnit;
  });

  // 셀별 질문 매핑
  const cellMap = new Map<string, RefinedQuestion[]>();
  TOPICS.forEach((t) => {
    STAGES.forEach((s) => {
      cellMap.set(`${t}:${s}`, []);
    });
  });

  filteredQuestions.forEach((q) => {
    const key = `${q.lifeTopic}:${q.taskStage}`;
    if (cellMap.has(key)) {
      cellMap.get(key)!.push(q);
    }
  });

  // 빈칸 검사 결과 (PRD §10)
  const emptyCellsCount = Array.from(cellMap.values()).filter((list) => list.length === 0).length;
  const totalCells = TOPICS.length * STAGES.length;

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 브레드크럼 & 헤더 */}
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Link href="/" className="hover:text-slate-800">kplacelab</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/theme-lab" className="hover:text-slate-800">정책테마랩</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="font-semibold text-navy-950">질문 지도 & 빈칸 탐지</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-950 flex items-center gap-2">
                <MapPin className="w-7 h-7 text-gold-500" />
                생활 질문 지도 (Question Map)
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
                주민 질문이 어느 생활주제와 과업 단계에 모여 있고, 어디가 비어 있는지(사각지대) 시각적으로 탐색합니다.
              </p>
            </div>

            {/* 지자체 필터 */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm shrink-0">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedUnit}
                onChange={(e) => {
                  setSelectedUnit(e.target.value);
                  setSelectedCell(null);
                }}
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none"
              >
                <option value="all">전체 실증 지역</option>
                <option value="lg-41110">수원특례시</option>
                <option value="lg-43745">증평군</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5대 빈칸 탐색 인사이트 배너 (PRD §10) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-gold-500" />
              질문 지도 빈칸(사각지대) 진단 현황
            </h3>
            <span className="text-xs text-slate-500">
              총 {totalCells}개 구간 중 <strong className="text-rose-600">{emptyCellsCount}개 구간 빈칸</strong> 발견
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="font-bold text-navy-950 block">검사 1 · 신청·이용 단계 질문 부재</span>
              <span className="text-slate-600 text-[11px]">발견/이해 질문은 많으나 실제 창구 신청 단계 질문 부족</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="font-bold text-navy-950 block">검사 2 · 비교·선택 기준 모호</span>
              <span className="text-slate-600 text-[11px]">인접 지역(용인/화성, 괴산/진천) 대비 차별화 정보 빈칸</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="font-bold text-navy-950 block">검사 3 · 사후확인·갱신 사각지대</span>
              <span className="text-slate-600 text-[11px]">자격 갱신이나 변동 시 절차에 대한 질문 거의 전무</span>
            </div>
          </div>
        </div>

        {/* 메인 매트릭스 그리드 (데스크톱/태블릿) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 w-32 bg-slate-50/50">생활 주제</th>
                {STAGES.map((s) => (
                  <th key={s} className="py-3 px-2 text-center">
                    {THEME_LAB_STAGE_LABELS[s].split(' ')[1]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {TOPICS.map((topic) => (
                <tr key={topic} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-3.5 px-3 font-bold text-slate-800 bg-slate-50/40">
                    {THEME_LAB_TOPIC_LABELS[topic]}
                  </td>
                  {STAGES.map((stage) => {
                    const key = `${topic}:${stage}`;
                    const qList = cellMap.get(key) || [];
                    const isSelected = selectedCell?.topic === topic && selectedCell?.stage === stage;
                    const hasQuestions = qList.length > 0;

                    return (
                      <td
                        key={stage}
                        onClick={() => setSelectedCell({ topic, stage })}
                        className={`py-3 px-2 text-center cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-navy-950 text-white font-bold rounded-lg shadow-inner ring-2 ring-gold-400'
                            : hasQuestions
                            ? 'bg-emerald-50/70 text-emerald-900 font-bold hover:bg-emerald-100'
                            : 'bg-slate-50/20 text-slate-400 hover:bg-slate-100/60'
                        }`}
                      >
                        {hasQuestions ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs">{qList.length}건</span>
                            <span className={`text-[9px] ${isSelected ? 'text-gold-300' : 'text-emerald-600'}`}>수집됨</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 선택된 셀 상세 뷰어 */}
        {selectedCell && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-semibold text-gold-600 uppercase tracking-wider">세부 질문 목록</span>
                <h3 className="text-base font-bold text-navy-950 mt-0.5">
                  {THEME_LAB_TOPIC_LABELS[selectedCell.topic]} × {THEME_LAB_STAGE_LABELS[selectedCell.stage]}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                닫기
              </button>
            </div>

            {(() => {
              const key = `${selectedCell.topic}:${selectedCell.stage}`;
              const list = cellMap.get(key) || [];

              if (list.length === 0) {
                return (
                  <div className="py-8 text-center space-y-2">
                    <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">
                      이 구간에는 아직 수집된 질문이 없습니다. (사각지대)
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      주민 질문함이나 현장 조사를 통해 이 단계의 질문을 수집하여 정책 빈칸을 채울 수 있습니다.
                    </p>
                    <Link
                      href="/theme-lab/submit"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-navy-950 text-gold-400 text-xs font-bold mt-2"
                    >
                      이 주제 질문 남기기
                    </Link>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {list.map((q) => (
                    <div key={q.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-white text-[10px] font-bold text-slate-600 border">
                            {q.unitId === 'lg-41110' ? '수원특례시' : '증평군'}
                          </span>
                          <span className="text-xs font-semibold text-slate-800">{q.refinedText}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                          <span>기능: {q.questionFunction}</span>
                          <span>어려움: {q.difficultyCandidate}</span>
                          <span>출처: {q.sourceType}</span>
                        </div>
                      </div>
                      <Link
                        href="/theme-lab/themes"
                        className="text-xs font-semibold text-navy-900 hover:text-gold-600 shrink-0 flex items-center gap-1"
                      >
                        테마 보기
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
