// app/(public)/submit/page.tsx
// FR-5, FR-6, FR-7: 셀프체크 결과 제출 폼
'use client';

import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';

export default function SubmitPage() {
  const [unitId, setUnitId] = useState('lg-41650'); // 기본값: 포천시
  const [aiService, setAiService] = useState('ChatGPT (OpenAI)');
  const [modelVersion, setModelVersion] = useState('GPT-4o');
  const [webSearch, setWebSearch] = useState(false);
  const [language, setLanguage] = useState('ko');
  const [submitterType, setSubmitterType] = useState('resident');
  const [anonymous, setAnonymous] = useState(true);
  const [submitterEmail, setSubmitterEmail] = useState('');

  // 12개 지명 문항 4단계 채점
  const [accurate, setAccurate] = useState(6);
  const [partial, setPartial] = useState(3);
  const [inaccurate, setInaccurate] = useState(2);
  const [absent, setAbsent] = useState(1);

  // 무지명 8문항 결과
  const [unnamedAppearances, setUnnamedAppearances] = useState(0);
  const [unnamedSlots, setUnnamedSlots] = useState(40);

  // 자유 질문
  const [freeformQuestion, setFreeformQuestion] = useState('');
  const [note, setNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const total = accurate + partial + inaccurate + absent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResultMessage(null);

    if (total !== 12) {
      setErrorMessage(`지명 문항 합계가 정확히 12여야 합니다. (현재: ${total})`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          aiService,
          modelVersion,
          webSearch,
          language,
          submitterType,
          anonymous,
          submitterEmail,
          namedAccurate: accurate,
          namedPartial: partial,
          namedInaccurate: inaccurate,
          namedAbsent: absent,
          unnamedAppearances,
          unnamedSlots,
          freeformQuestion,
          note,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setResultMessage(json.message || '결과가 성공적으로 제출되었습니다.');
      } else {
        setErrorMessage(json.error || '제출에 실패했습니다.');
      }
    } catch {
      setErrorMessage('네트워크 통신 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          <Send className="w-3.5 h-3.5" />
          Layer 2 셀프체크 결과 등록
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
          셀프체크 측정 결과 제출
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          실제 AI 서비스에 12개 표준 질문을 던져보고 얻으신 결과를 정직하게 기록해 주세요.
        </p>
      </div>

      {resultMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">제출 완료</div>
            <p className="text-xs text-emerald-800 mt-0.5">{resultMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">입력 오류</div>
            <p className="text-xs text-rose-800 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* 대상 단위 선택 */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            테스트한 대상 지자체
          </label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="lg-41650">포천시 (경기도)</option>
            <option value="lg-11000">서울특별시</option>
            <option value="lg-26000">부산광역시</option>
            <option value="lg-43770">증평군 (충청북도)</option>
            <option value="lg-42150">강릉시 (강원특별자치도)</option>
            <option value="sz-fez-ifez">인천경제자유구역 (IFEZ)</option>
            <option value="sz-fez-bjfez">부산진해경제자유구역 (BJFEZ)</option>
          </select>
        </div>

        {/* 측정 조건 (INV-7 강제: 조건 없는 관측은 존재 불가) */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
            <Sparkles className="w-3.5 h-3.5" />
            측정 조건 필수 입력 (AGENTS.md INV-7 준수)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                사용 AI 서비스
              </label>
              <input
                type="text"
                required
                value={aiService}
                onChange={(e) => setAiService(e.target.value)}
                placeholder="예: ChatGPT, Claude, Gemini"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                모델 버전 (선택)
              </label>
              <input
                type="text"
                value={modelVersion}
                onChange={(e) => setModelVersion(e.target.value)}
                placeholder="예: GPT-4o, Claude 3.5 Sonnet"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                웹 검색 활성화 여부
              </label>
              <select
                value={webSearch ? 'true' : 'false'}
                onChange={(e) => setWebSearch(e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="false">웹 검색 끔 (OFF - 표준 권장)</option>
                <option value="true">웹 검색 켬 (ON)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                질문 언어
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="ko">한국어 (ko)</option>
                <option value="en">영어 (en)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 12문항 채점 결과 */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              지명 12개 질문 채점 결과
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                total === 12
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              합계: {total} / 12
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <label className="block text-xs font-semibold text-emerald-800 mb-1">
                정확 (accurate)
              </label>
              <input
                type="number"
                min="0"
                max="12"
                value={accurate}
                onChange={(e) => setAccurate(Number(e.target.value))}
                className="w-full text-center font-bold text-lg text-emerald-900 bg-white border border-emerald-300 rounded-lg py-1"
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <label className="block text-xs font-semibold text-blue-800 mb-1">
                부분정확 (partial)
              </label>
              <input
                type="number"
                min="0"
                max="12"
                value={partial}
                onChange={(e) => setPartial(Number(e.target.value))}
                className="w-full text-center font-bold text-lg text-blue-900 bg-white border border-blue-300 rounded-lg py-1"
              />
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <label className="block text-xs font-semibold text-rose-800 mb-1">
                부정확/작화
              </label>
              <input
                type="number"
                min="0"
                max="12"
                value={inaccurate}
                onChange={(e) => setInaccurate(Number(e.target.value))}
                className="w-full text-center font-bold text-lg text-rose-900 bg-white border border-rose-300 rounded-lg py-1"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                부재/모름
              </label>
              <input
                type="number"
                min="0"
                max="12"
                value={absent}
                onChange={(e) => setAbsent(Number(e.target.value))}
                className="w-full text-center font-bold text-lg text-slate-900 bg-white border border-slate-300 rounded-lg py-1"
              />
            </div>
          </div>
        </div>

        {/* 무지명 문항 결과 */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              무지명 8문항 결과
            </span>
          </div>
          <p className="text-xs text-gray-600">
            무지명 8문항에서 AI가 추천한 5개 지역 중 해당 지자체가 등장한 횟수를 입력하세요.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                등장 횟수 (unnamed_appearances)
              </label>
              <input
                type="number"
                min="0"
                max={unnamedSlots}
                value={unnamedAppearances}
                onChange={(e) => setUnnamedAppearances(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                총 추천 슬롯 수 (unnamed_slots)
              </label>
              <input
                type="number"
                min="0"
                max="40"
                value={unnamedSlots}
                onChange={(e) => setUnnamedSlots(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* 자유 질문 수집 (FR-7) */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <label className="block text-xs font-bold text-gray-700">
            추가로 직접 해보신 자유 질문이 있나요? (선택 · FR-7 코퍼스 자산화)
          </label>
          <textarea
            rows={2}
            value={freeformQuestion}
            onChange={(e) => setFreeformQuestion(e.target.value)}
            placeholder="예: 포천시 반려견 동반 가능한 공공 글램핑장이 어디인지 물어봤더니..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <span className="text-[11px] text-gray-400 block">
            * 입력하신 질문은 개인정보 필터링 및 관리자 검수(FR-25) 후에만 연구용 코퍼스로 채택됩니다.
          </span>
        </div>

        {/* 제출자 옵션 */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>익명으로 제출 (권장)</span>
            </label>

            <select
              value={submitterType}
              onChange={(e) => setSubmitterType(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded-md text-xs bg-white"
            >
              <option value="resident">지역 주민</option>
              <option value="official">지자체 공무원</option>
              <option value="researcher">연구자/전문가</option>
              <option value="press">기자/언론</option>
              <option value="unknown">기타</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              이메일 (알림 희망 시에만 입력 · 소속 증명으로 쓰이지 않음)
            </label>
            <input
              type="email"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || total !== 12}
          className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-sm transition-all flex items-center justify-center gap-2 ${
            total === 12 && !submitting
              ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {submitting ? '제출 처리 중...' : '측정 결과 제출하기'}
        </button>
      </form>
    </div>
  );
}
