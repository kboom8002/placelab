// app/(org)/kbrandlab/questions/page.tsx
// 소비자 질문 지도 및 과제 분류 관리 화면 (PRD v3 §5.1, §5.3, FR-02, FR-03, FR-04)

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  ArrowLeft,
  Filter,
  Plus,
  Sparkles,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Layers,
  Search,
} from 'lucide-react';
import { JourneyClassifier } from '@/lib/kbrandlab/questions/journey-classifier';
import { IssueClassifier } from '@/lib/kbrandlab/questions/issue-classifier';

interface QuestionItem {
  id: string;
  sourceType: 'consumer_actual' | 'researcher_derived' | 'ai_suggested';
  rawText: string;
  journey: string;
  issueType: string;
  observationsCount: number;
  channel: string;
  actionPlan: string;
}

const SAMPLE_QUESTIONS: QuestionItem[] = [
  {
    id: 'q-1',
    sourceType: 'consumer_actual',
    rawText: '출근길에 들고 다니면서 가방에 넣어도 절대 새지 않는 텀블러 있을까?',
    journey: 'need_discovery',
    issueType: 'info_gap',
    observationsCount: 24,
    channel: '고객지원 문의 / 상품 Q&A',
    actionPlan: '상세페이지 상단에 누수 방지 2중 실리콘 패킹 밀폐력 가이드 추가',
  },
  {
    id: 'q-2',
    sourceType: 'consumer_actual',
    rawText: '뚜껑 고무패킹이 헐거워져서 물이 샜어요. 패킹 부품만 따로 구매할 수 있나요?',
    journey: 'purchase_terms',
    issueType: 'purchase_barrier',
    observationsCount: 42,
    channel: '네이버 스마트스토어 Q&A',
    actionPlan: '소모품/패킹 전용 구매 링크 신설 및 AS 안내 페이지 연결',
  },
  {
    id: 'q-3',
    sourceType: 'consumer_actual',
    rawText: '텀블러 안쪽에 커피 냄새가 배어서 안 빠지는데 식기세척기에 넣고 돌려도 코팅 안 벗겨지나요?',
    journey: 'usage_troubleshooting',
    issueType: 'info_gap',
    observationsCount: 31,
    channel: '카카오톡 상담톡',
    actionPlan: '식기세척기 세척 온도 가이드 및 베이킹소다 세척법 FAQ 갱신',
  },
  {
    id: 'q-4',
    sourceType: 'consumer_actual',
    rawText: '식기세척기 안전 인증이나 BPA Free 공인 시험 성적서가 공식 사이트에 왜 없나요?',
    journey: 'category_exploration',
    issueType: 'verification_gap',
    observationsCount: 18,
    channel: '제품 리뷰',
    actionPlan: 'KOTITI 시험연구원 BPA Free 공인 성적서 스캔본 정본에 첨부 및 게시',
  },
  {
    id: 'q-5',
    sourceType: 'consumer_actual',
    rawText: '뚜껑을 꽉 닫아도 이동 중에 뚜껑이 열려요. 잠금장치 설계 불량 아닌가요?',
    journey: 'usage_troubleshooting',
    issueType: 'product_unfit',
    observationsCount: 15,
    channel: '1:1 고객센터',
    actionPlan: '원터치 락 버튼 2세대 금형 개선 과제로 R&D 전달',
  },
];

export default function QuestionsMapPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>(SAMPLE_QUESTIONS);
  const [selectedJourney, setSelectedJourney] = useState<string>('all');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [classifiedResult, setClassifiedResult] = useState<{
    journey: string;
    issue: string;
    action: string;
  } | null>(null);

  const handleTestClassify = (text: string) => {
    setNewQuestionText(text);
    if (!text.trim()) {
      setClassifiedResult(null);
      return;
    }
    const j = JourneyClassifier.classify(text);
    const i = IssueClassifier.classify(text);
    setClassifiedResult({
      journey: j.primaryJourney,
      issue: i.primaryIssueType,
      action: i.recommendedAction,
    });
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim() || !classifiedResult) return;
    const newQ: QuestionItem = {
      id: `q-${Date.now()}`,
      sourceType: 'consumer_actual',
      rawText: newQuestionText,
      journey: classifiedResult.journey,
      issueType: classifiedResult.issue,
      observationsCount: 1,
      channel: '실시간 연구자 입력',
      actionPlan: classifiedResult.action,
    };
    setQuestions([newQ, ...questions]);
    setNewQuestionText('');
    setClassifiedResult(null);
  };

  const filtered = selectedJourney === 'all'
    ? questions
    : questions.filter(q => q.journey === selectedJourney);

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between">
          <Link
            href="/kbrandlab"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> 대시보드로 돌아가기
          </Link>
          <div className="text-xs text-slate-500">
            총 고유 질문 <strong>{questions.length}건</strong> · 총 관찰 <strong>{questions.reduce((acc, q) => acc + q.observationsCount, 0)}회</strong>
          </div>
        </div>

        {/* 타이틀 헤더 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-2">
          <h1 className="text-2xl font-black text-slate-900">소비자 질문 지도 (Customer Question Map)</h1>
          <p className="text-sm text-slate-600">
            소비자가 제품과 브랜드에 대해 실제로 묻는 질문을 수집하고, 구매 여정 6단계와 해결 과제 5종으로 자동 분류합니다.
          </p>
        </div>

        {/* 신규 질문 등록 및 실시간 자동 분류기 (FR-04) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            신규 질문 수집 및 여정·과제 자동 분류
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="예: 식기세척기 돌려도 코팅 안 벗겨지나요? 공식 인증서가 있나요?"
              value={newQuestionText}
              onChange={(e) => handleTestClassify(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={handleAddQuestion}
              disabled={!newQuestionText.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs disabled:opacity-50 hover:bg-amber-400 transition-colors"
            >
              질문 등록 및 과제화
            </button>
          </div>

          {classifiedResult && (
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-4">
                <span className="text-slate-500">감지된 여정: <strong className="text-blue-700">{classifiedResult.journey}</strong></span>
                <span className="text-slate-500">과제 유형: <strong className="text-purple-700">{classifiedResult.issue}</strong></span>
              </div>
              <p className="text-slate-600 pt-1">
                <strong>추천 실행안:</strong> {classifiedResult.action}
              </p>
            </div>
          )}
        </div>

        {/* 여정 필터 탭 */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: 'all', label: '전체 질문' },
            { id: 'need_discovery', label: '① 필요·상황 발견' },
            { id: 'category_exploration', label: '② 제품군 탐색' },
            { id: 'brand_comparison', label: '③ 브랜드 비교' },
            { id: 'purchase_terms', label: '④ 구매조건 확인' },
            { id: 'usage_troubleshooting', label: '⑤ 사용·문제해결' },
            { id: 'repurchase_churn', label: '⑥ 재구매·이탈' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedJourney(tab.id)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                selectedJourney === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 질문 카드 목록 */}
        <div className="space-y-4">
          {filtered.map((q) => (
            <div
              key={q.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
                    {q.journey}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-[11px] font-bold">
                    {q.issueType}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px]">
                    관찰 {q.observationsCount}회
                  </span>
                </div>
                <span className="text-xs text-slate-400">출처: {q.channel}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900">
                "{q.rawText}"
              </h3>

              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
                <div>
                  <span className="text-slate-400 font-semibold mr-1">해결 실행안:</span>
                  <span>{q.actionPlan}</span>
                </div>
                <Link
                  href="/kbrandlab/canonical"
                  className="text-amber-600 font-bold hover:underline"
                >
                  정본 증거 대조 →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
