// app/(public)/selfcheck/page.tsx
// FR-4: 브라우저 셀프체크 프롬프트 생성기 (지역명 클라이언트 실시간 치환)
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Sparkles, Send, HelpCircle, ArrowRight } from 'lucide-react';

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
  { id: 'U01', category: '근거리 여행', body: '수도권에서 당일치기로 힐링 여행 갈 만한 곳 5곳을 추천해 주세요.' },
  { id: 'U02', category: '계절 여행', body: '가을 단풍이나 축제로 가기 좋은 국내 여행지 5곳을 추천해 주세요.' },
  { id: 'U03', category: '자연 경관', body: '도심에서 멀지 않으면서 자연 경관이 수려한 소도시 5곳을 추천해 주세요.' },
  { id: 'U04', category: '가족 여행', body: '미취학 아동과 함께 가족 나들이 가기 좋은 여행지 5곳을 추천해 주세요.' },
  { id: 'U05', category: '귀농·귀촌', body: '지자체 지원 프로그램이 잘 갖추어진 귀농·귀촌 추천 지역 5곳을 알려주세요.' },
  { id: 'U06', category: '청년 창업', body: '청년 창업 및 거주 지원 조례가 잘 정비된 시·군 5곳을 추천해 주세요.' },
  { id: 'U07', category: '정주 여건', body: '조용하고 정주 여건이 우수한 강소 중소도시 5곳을 추천해 주세요.' },
  { id: 'U08', category: '지역 축제', body: '가족 단위 방문객 만족도가 높은 전국 대표 지자체 축제 5개를 알려주세요.' },
];

const QUICK_EXAMPLES = ['포천시', '강남구', '순천시', '증평군', '강릉시', '해남군'];

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* 헤더 */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          Layer 2 · 자발적 관측 프로토콜
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
          우리 동네 AI 셀프체크 프롬프트 생성기
        </h1>
        <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
          지자체명을 입력하면 표준 12개 질문이 자동으로 치환됩니다. 프롬프트를 복사하여 ChatGPT, Claude 등 생성형 AI에 묻고 답변의 정확성을 직접 확인해 보세요.
        </p>
      </div>

      {/* 지자체명 입력 컨트롤 카드 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-editorial space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="block text-xs font-bold text-navy-950 uppercase tracking-wider">
              테스트할 지자체명 (시·군·구)
            </label>
            <input
              type="text"
              value={regionName}
              onChange={(e) => setRegionName(e.target.value)}
              placeholder="예: 포천시, 강남구, 순천시"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-base font-semibold text-navy-950 focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 focus:outline-none transition-all"
            />
          </div>

          <button
            onClick={handleCopyAll}
            className="px-6 py-3 bg-navy-950 hover:bg-navy-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md shrink-0"
          >
            {copiedId === 'ALL' ? (
              <>
                <Check className="w-4 h-4 text-gold-400" />
                <span>12문항 전체 복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-gold-400" />
                <span>12문항 전체 복사</span>
              </>
            )}
          </button>
        </div>

        {/* 빠른 선택 칩 */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span className="font-medium text-slate-400">빠른 예시:</span>
          {QUICK_EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setRegionName(ex)}
              className={`px-2.5 py-1 rounded-lg border transition-all ${
                regionName === ex
                  ? 'bg-navy-900 text-white border-navy-900 font-semibold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* 가이드 배너 */}
      <div className="p-4 rounded-xl bg-navy-900 text-slate-200 text-xs leading-relaxed space-y-2 border border-white/10 shadow-sm">
        <div className="font-bold text-gold-400 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4" />
          공정한 관측을 위한 필수 준수 원칙 (K03 측정 규약)
        </div>
        <div className="grid sm:grid-cols-2 gap-2 text-slate-300">
          <div>
            1. AI 서비스에서 <strong>웹 검색(Web Search)을 끄고</strong> 진행해야 모델 고유 지식(Layer 2)을 측정할 수 있습니다.
          </div>
          <div>
            2. 없는 제도를 진짜처럼 꾸며내는 <strong>작화(Floor Risk = critical)</strong>가 있는지 각별히 확인하세요.
          </div>
        </div>
      </div>

      {/* 치환된 지명 문항 12종 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-navy-950">
            지명 문항 (12개 문항 · {regionName} 치환 적용)
          </h2>
          <span className="text-xs text-slate-400 font-mono">P01~P12</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {STANDARD_QUESTIONS.map((q) => {
            const promptText = q.body.replace(/\{지역명\}/g, regionName);
            const isCopied = copiedId === q.id;

            return (
              <div
                key={q.id}
                className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 hover:border-gold-400/80 transition-all flex items-start justify-between gap-4 shadow-sm hover:shadow-card-hover group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {q.id}
                    </span>
                    <span className="text-xs font-semibold text-gold-600">
                      [{q.category}]
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-navy-950 leading-relaxed">
                    {promptText}
                  </p>
                </div>

                <button
                  onClick={() => handleCopy(q.id, promptText)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    isCopied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-slate-50 hover:bg-navy-950 hover:text-white text-slate-700 border-slate-200'
                  }`}
                  title="프롬프트 복사"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>복사</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 무지명 문항 8종 */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-navy-950">무지명 문항 (8개 문항)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              지자체명을 명시하지 않고 질문했을 때 우리 지역이 추천 목록(5개 슬롯)에 포함되는지 관측합니다.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">U01~U08</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {UNNAMED_QUESTIONS.map((q) => {
            const promptText = q.body;
            const isCopied = copiedId === q.id;

            return (
              <div
                key={q.id}
                className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all flex items-start justify-between gap-4 shadow-sm group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {q.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      [{q.category}]
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
                    {promptText}
                  </p>
                </div>

                <button
                  onClick={() => handleCopy(q.id, promptText)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    isCopied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-slate-50 hover:bg-navy-950 hover:text-white text-slate-700 border-slate-200'
                  }`}
                  title="프롬프트 복사"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>복사</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 결과 제출 유도 카드 */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white flex flex-col sm:flex-row items-center justify-between gap-6 border border-white/10 shadow-xl">
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>관측 결과를 연구 데이터베이스에 기여하세요</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            AI 답변의 정확 여부와 작화 발생 여부를 제출하시면 전국 지자체 AI 접근성 연구 지표로 안전하게 집계됩니다.
          </p>
        </div>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-navy-950 font-bold text-xs rounded-xl shadow-md transition-all shrink-0 hover:scale-105"
        >
          <Send className="w-4 h-4" />
          관측 결과 제출하기
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
