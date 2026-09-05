// app/(public)/selfcheck/page.tsx
// FR-4: 브라우저 셀프체크 프롬프트 생성기 (지역명 클라이언트 실시간 치환)
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Sparkles, Send, HelpCircle, ShieldAlert } from 'lucide-react';

const STANDARD_QUESTIONS = [
  { id: 'N01', category: '폐기물', body: '{지역명} 대형폐기물 스티커 가격과 온라인 배출 신청 방법 알려줘' },
  { id: 'N02', category: '전입', body: '{지역명} 전입신고 후 받을 수 있는 전입지원 혜택이나 출산축하금이 있어?' },
  { id: 'N03', category: '환경', body: '{지역명} 종량제봉투 종류별 가격과 불연성 마대 파는 곳 어디야?' },
  { id: 'N04', category: '복지', body: '{지역명} 청년 기본소득이나 청년 월세 지원 대상 조건과 신청 기간 알려줘' },
  { id: 'N05', category: '출산', body: '{지역명} 둘째 아이 낳으면 나오는 출산지원금과 산후조리비 지원 내용 뭐야?' },
  { id: 'N06', category: '관광', body: '{지역명} 당일치기 여행 코스로 가볼 만한 대표 명소 3곳 추천해줘' },
  { id: 'N07', category: '축제', body: '{지역명} 올해 열리는 대표 축제 일정과 장소 안내해줘' },
  { id: 'N08', category: '문화', body: '{지역명} 시립/구립 도서관 열람실 휴관일과 대출 권수 어떻게 돼?' },
  { id: 'N09', category: '보건', body: '{지역명} 야간·휴일 영유아 진료 가능한 달빛어린이병원이나 소아과 있어?' },
  { id: 'N10', category: '노인복지', body: '{지역명} 65세 이상 어르신 교통비 지원이나 목욕권 지급 제도 있어?' },
  { id: 'N11', category: '경제', body: '{지역명} 소상공인 특례보증 대출 조건과 이자 지원 사업 신청 방법 알려줘' },
  { id: 'N12', category: '행정', body: '{지역명} 시청/구청 민원실 점심시간 휴무제 시행하는지, 주차요금 얼마야?' },
];

const UNNAMED_QUESTIONS = [
  { id: 'U01', category: '근거리 여행', body: '{상위광역}에서 당일치기로 갈 만한 곳 5곳을 추천해 주세요.' },
  { id: 'U02', category: '계절 여행', body: '가을에 가기 좋은 국내 여행지 5곳을 추천해 주세요.' },
  { id: 'U03', category: '자연 경관', body: '수도권에서 가까우면서 자연 경관이 좋은 곳 5곳을 추천해 주세요.' },
  { id: 'U04', category: '가족 여행', body: '아이와 함께 가기 좋은 {상위광역} 여행지 5곳을 추천해 주세요.' },
  { id: 'U05', category: '귀농·귀촌', body: '귀농이나 귀촌하기 좋은 지역 5곳을 추천해 주세요.' },
  { id: 'U06', category: '청년 창업', body: '청년 창업 지원이 잘 되어 있는 시·군 5곳을 추천해 주세요.' },
  { id: 'U07', category: '정주 여건', body: '조용하고 살기 좋은 중소도시 5곳을 추천해 주세요.' },
  { id: 'U08', category: '축제', body: '{상위광역}의 대표적인 축제 5개를 알려주세요.' },
];

export default function SelfCheckPage() {
  const [regionName, setRegionName] = useState('포천시');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const allText = STANDARD_QUESTIONS.map(
      (q, idx) => `${idx + 1}. ${q.body.replace(/\{지역명\}/g, regionName)}`
    ).join('\n\n');
    navigator.clipboard.writeText(allText);
    setCopiedId('ALL');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Layer 2 · 자발적 셀프체크
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
          우리 동네 AI 셀프체크 프롬프트 생성기
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          지자체명을 입력하면 표준 12개 지명 질문이 자동으로 치환됩니다. 복사하여 ChatGPT, Claude 등에 질문해 보세요.
        </p>
      </div>

      {/* 지자체명 입력 컨트롤 */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-auto flex-1">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            테스트할 지자체명 (시·군·구)
          </label>
          <input
            type="text"
            value={regionName}
            onChange={(e) => setRegionName(e.target.value)}
            placeholder="예: 포천시, 강남구, 순천시"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <button
          onClick={handleCopyAll}
          className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors mt-auto"
        >
          {copiedId === 'ALL' ? (
            <>
              <Check className="w-4 h-4 text-white" />
              전체 12문항 복사 완료!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              전체 문항 한 번에 복사
            </>
          )}
        </button>
      </div>

      {/* 테스트 가이드 */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs space-y-1">
        <div className="font-bold flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          공정한 측정을 위한 필수 조건 안내 (K03 명세)
        </div>
        <p className="text-blue-800 leading-relaxed">
          1. AI 서비스(ChatGPT 등)에서 <strong>웹 검색(Web Search) 옵션을 끄고(OFF)</strong> 테스트해 주세요.
          <br />
          2. 존재하지 않는 제도나 금액을 지어내는 현상(<strong>작화/할루시네이션</strong>)이 발생하는지 유의해서 관찰해 주세요.
        </p>
      </div>

      {/* 치환된 문항 목록 */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">
          지명 문항 (12문항 - {regionName} 치환 적용)
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {STANDARD_QUESTIONS.map((q, idx) => {
            const promptText = q.body.replace(/\{지역명\}/g, regionName);
            const isCopied = copiedId === q.id;

            return (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-white border border-gray-200 hover:border-blue-300 transition-colors flex items-start justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {q.id}
                    </span>
                    <span className="text-[11px] font-medium text-blue-600">
                      [{q.category}]
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 leading-relaxed">
                    {promptText}
                  </p>
                </div>

                <button
                  onClick={() => handleCopy(q.id, promptText)}
                  className={`shrink-0 p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                    isCopied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                  title="프롬프트 복사"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[11px]">복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">복사</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 무지명 문항 목록 */}
      <div className="space-y-3 mt-8">
        <h2 className="text-base font-bold text-gray-900">
          무지명 문항 (8문항)
        </h2>
        <p className="text-sm text-gray-600">
          AI에게 구체적인 지역명 5곳씩을 추천하고 추천 이유를 한 줄로 적어달라고 질문해 보세요.
        </p>

        <div className="grid grid-cols-1 gap-3">
          {UNNAMED_QUESTIONS.map((q, idx) => {
            const promptText = q.body;
            const isCopied = copiedId === q.id;

            return (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-white border border-gray-200 hover:border-indigo-300 transition-colors flex items-start justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {q.id}
                    </span>
                    <span className="text-[11px] font-medium text-indigo-600">
                      [{q.category}]
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 leading-relaxed">
                    {promptText}
                  </p>
                </div>

                <button
                  onClick={() => handleCopy(q.id, promptText)}
                  className={`shrink-0 p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                    isCopied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                  title="프롬프트 복사"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[11px]">복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">복사</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 결과 제출 링크 유도 */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold">테스트 결과를 제출하고 싶으신가요?</h3>
          <p className="text-xs text-blue-100 mt-1">
            정확도와 오류 유형을 제출해 주시면 데이터베이스에 안전하게 집계됩니다 (익명 가능).
          </p>
        </div>
        <Link
          href="/submit"
          className="px-4 py-2 bg-white text-blue-600 font-bold text-xs rounded-lg shadow-sm hover:bg-blue-50 transition-colors shrink-0"
        >
          채점 결과 제출하기 →
        </Link>
      </div>
    </div>
  );
}
