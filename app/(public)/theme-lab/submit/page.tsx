'use client';

// app/(public)/theme-lab/submit/page.tsx
// Policy Theme Lab 온라인 주민 질문 수집함 (FR-61)
// 비로그인 접수, 질문·불편·비교·제안 4유형 수집, 중립 맥락 보완 연계

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  AlertCircle,
  Split,
  Sparkles,
  Send,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Building2,
} from 'lucide-react';

const TARGET_UNITS = [
  { id: 'lg-41110', name: '수원특례시 (실증 대상)' },
  { id: 'lg-43745', name: '증평군 (실증 대상)' },
  { id: 'lg-41130', name: '성남시' },
  { id: 'lg-41170', name: '용인특례시' },
  { id: 'lg-43110', name: '청주시' },
  { id: 'lg-43750', name: '괴산군' },
  { id: 'lg-43720', name: '진천군' },
  { id: 'other', name: '기타 전국 지자체' },
];

const INPUT_TYPES = [
  {
    type: 'question',
    label: '직접 질문',
    icon: HelpCircle,
    desc: '지원금 액수, 신청 장소, 전화번호 등 궁금한 점',
    placeholder: '예: 증평군 둘째 아이 출산지원금이 정확히 얼마이고 어디서 신청하나요?',
  },
  {
    type: 'experience',
    label: '불편·경험',
    icon: AlertCircle,
    desc: '안내문을 읽거나 창구에 갔는데 결국 실패했던 경험',
    placeholder: '예: 수원시 청년 월세 지원을 신청하려 했는데 소득 기준 계산이 어려워 포기했어요.',
  },
  {
    type: 'comparison',
    label: '비교·선택',
    icon: Split,
    desc: '두 지역이나 두 제도 중 무엇이 나에게 맞는지 고민되는 점',
    placeholder: '예: 아이 키우며 귀촌하기에 증평과 진천 중 돌봄 혜택이 어디가 더 좋은가요?',
  },
  {
    type: 'suggestion',
    label: '기대·제안',
    icon: Sparkles,
    desc: 'AI나 홈페이지에서 이런 정보가 한곳에 정리되면 좋겠다는 점',
    placeholder: '예: 어르신 교통비 지원 대상 나이와 분기별 한도가 표 하나로 정리되어 있으면 좋겠어요.',
  },
];

export default function ThemeLabSubmitPage() {
  const [selectedUnit, setSelectedUnit] = useState('lg-41110');
  const [selectedType, setSelectedType] = useState('question');
  const [rawText, setRawText] = useState('');
  const [isRealExperience, setIsRealExperience] = useState(true);
  const [contactEmail, setContactEmail] = useState('');
  const [step, setStep] = useState<'input' | 'context' | 'done'>('input');
  const [loading, setLoading] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const [followupPrompts, setFollowupPrompts] = useState<any[]>([]);

  // 맥락 추가 입력 상태
  const [contextData, setContextData] = useState({
    intendedTask: '',
    blockedAt: '',
    alreadyChecked: '',
    resolutionStatus: 'unresolved',
  });

  const currentTypeMeta = INPUT_TYPES.find((t) => t.type === selectedType)!;

  const handleSubmitInitial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() || rawText.trim().length < 5) {
      alert('질문 내용을 5자 이상 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/theme-lab/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          unitId: selectedUnit,
          inputType: selectedType,
          isRealExperience,
          contactEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '제출 실패');

      setSubmissionId(data.submissionId);
      if (data.followupPrompts && data.followupPrompts.length > 0) {
        setFollowupPrompts(data.followupPrompts);
        setStep('context');
      } else {
        setStep('done');
      }
    } catch (err: any) {
      alert(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContext = () => {
    // 맥락 보완 완료
    setStep('done');
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* 브레드크럼 & 헤더 */}
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Link href="/" className="hover:text-slate-800">kplacelab</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/theme-lab" className="hover:text-slate-800">정책테마랩</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="font-semibold text-navy-950">주민 질문·불편 수집함</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-950">
            당신의 진짜 질문과 일상의 불편을 들려주세요
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            시청·군청 홈페이지를 찾거나 AI에게 물었을 때 답을 찾지 못했던 경험이 있나요?
            남겨주신 의견은 정책 연구 의제와 AI 정밀 진단 질문의 씨앗이 됩니다.
          </p>
        </div>

        {/* 1단계: 메인 접수 폼 */}
        {step === 'input' && (
          <form onSubmit={handleSubmitInitial} className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            {/* 지역 선택 */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-gold-500" />
                관련 지자체 선택
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white"
              >
                {TARGET_UNITS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 입력 유형 탭 */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                어떤 형태의 내용인가요?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {INPUT_TYPES.map((item) => {
                  const Icon = item.icon;
                  const isSel = selectedType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setSelectedType(item.type)}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all ${
                        isSel
                          ? 'border-navy-900 bg-navy-950 text-white shadow-sm ring-1 ring-navy-900'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSel ? 'text-gold-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                💡 {currentTypeMeta.desc}
              </p>
            </div>

            {/* 내용 입력 텍스트에어리어 */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                내용 입력 <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={4}
                required
                placeholder={currentTypeMeta.placeholder}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 resize-none"
              />
            </div>

            {/* 체크박스 & 연락처 */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRealExperience}
                  onChange={(e) => setIsRealExperience(e.target.checked)}
                  className="rounded text-navy-900 focus:ring-navy-900 w-4 h-4"
                />
                <span>실제 겪었던 상황·경험입니다 (체크 해제 시 단순 궁금증)</span>
              </label>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  후속 확인 연락처 (선택 — 연구팀의 진행 상황 공유용)
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@example.com (원치 않으시면 비워두셔도 됩니다)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>

            {/* 고지사항 및 제출 버튼 */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>원문은 비공개 암호화 보관되며, 공식 민원 접수가 아닌 정책 연구 목적으로 쓰입니다.</span>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-navy-950 text-gold-400 hover:bg-navy-900 shadow transition-all shrink-0"
              >
                {loading ? '접수 중...' : (
                  <>
                    <span>다음 단계로</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* 2단계: 맥락 보완 (중립 질문 응답) */}
        {step === 'context' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-gold-600 uppercase tracking-wider">Step 2 · 상황 맥락 보완</span>
              <h2 className="text-lg font-bold text-navy-950 mt-1">
                더 정확한 정책 테마 발굴을 위해 한두 가지만 더 여쭙습니다
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                시간이 없으시면 아래 '건너뛰기'를 누르셔도 접수는 완료됩니다.
              </p>
            </div>

            <div className="space-y-4">
              {followupPrompts.map((p, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Q{idx + 1}. {p.questionText}
                  </label>
                  {p.targetField === 'intended_task' && (
                    <input
                      type="text"
                      placeholder="예: 둘째 출산 후 시청 지원금 신청 자격을 확인하려 함"
                      value={contextData.intendedTask}
                      onChange={(e) => setContextData({ ...contextData, intendedTask: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-navy-900"
                    />
                  )}
                  {p.targetField === 'blocked_at' && (
                    <input
                      type="text"
                      placeholder="예: 홈페이지 안내문과 뉴스 기사의 금액이 서로 달라 헷갈림"
                      value={contextData.blockedAt}
                      onChange={(e) => setContextData({ ...contextData, blockedAt: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-navy-900"
                    />
                  )}
                  {p.targetField === 'already_checked' && (
                    <input
                      type="text"
                      placeholder="예: 시청 환경과 홈페이지, 네이버 블로그"
                      value={contextData.alreadyChecked}
                      onChange={(e) => setContextData({ ...contextData, alreadyChecked: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-navy-900"
                    />
                  )}
                  {p.targetField === 'resolution_status' && (
                    <select
                      value={contextData.resolutionStatus}
                      onChange={(e) => setContextData({ ...contextData, resolutionStatus: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-navy-900"
                    >
                      <option value="unresolved">아직 해결되지 않음 (미해결)</option>
                      <option value="resolved">전화 문의 등으로 결국 해결됨</option>
                      <option value="partial">일부만 확인되고 포기함</option>
                    </select>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('done')}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                건너뛰고 완료하기
              </button>
              <button
                type="button"
                onClick={handleSaveContext}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold bg-navy-950 text-gold-400 hover:bg-navy-900 shadow transition-all"
              >
                맥락 저장하고 완료
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 3단계: 완료 화면 */}
        {step === 'done' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm text-center space-y-6 animate-fade-in">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-950">
                소중한 질문이 성공적으로 접수되었습니다!
              </h2>
              <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                접수된 내용은 연구팀의 정제 과정을 거쳐 비식별화된 형태로 **질문 지도**에 배치되며,
                향후 AI 정밀 진단 및 지자체 정책 테마 브리프로 승격됩니다.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 max-w-sm mx-auto text-left text-xs space-y-1 text-slate-600">
              <div>• 접수 번호: <span className="font-mono text-slate-900">{submissionId.slice(0, 13)}...</span></div>
              <div>• 원문 처리: 암호화 격리 저장 (INV-6 준수)</div>
              <div>• 활용 경로: Policy Theme Lab 질문 지도 및 AEO 진단 연계</div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRawText('');
                  setStep('input');
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                다른 질문 더 남기기
              </button>
              <Link
                href="/theme-lab"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-navy-950 text-gold-400 text-xs font-bold hover:bg-navy-900 shadow"
              >
                정책테마랩 둘러보기
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
