'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const QuestionSuggestForm: React.FC = () => {
  const [questionText, setQuestionText] = useState('');
  const [categoryCode, setCategoryCode] = useState('living_admin');
  const [scopeCategory, setScopeCategory] = useState('in_scope');
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    try {
      const resp = await fetch('/api/join/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText,
          categoryCode,
          scopeCategory: scopeCategory === 'in_scope' ? undefined : scopeCategory,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setStatusMsg({ ok: false, text: data.error || '접수에 실패했습니다.' });
      } else {
        setStatusMsg({ ok: true, text: data.message });
        setQuestionText('');
      }
    } catch {
      setStatusMsg({ ok: false, text: '네트워크 오류가 발생했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
    >
      <div className="space-y-1">
        <h3 className="text-base font-black text-navy-950">
          다음 주 측정 질문 바로 제안하기
        </h3>
        <p className="text-xs text-slate-500">
          주민번호·휴대전화번호 등 개인정보는 서버에서 자동 마스킹되며, 범위 제외 대상(INV-18)은 접수 단계에서 차단됩니다.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">질문 분야</label>
          <select
            value={categoryCode}
            onChange={(e) => setCategoryCode(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
          >
            <option value="living_admin">생활행정 · 민원 · 수수료</option>
            <option value="welfare">복지 · 출산 · 돌봄 지원</option>
            <option value="local_culture">지역 문화 · 유산 · 축제</option>
            <option value="active_recommend">무지명 추천 · 귀농 · 여행</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">범위 자가 확인 (INV-18)</label>
          <select
            value={scopeCategory}
            onChange={(e) => setScopeCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
          >
            <option value="in_scope">공공 행정·제도·문화 사실 질문 (측정 대상)</option>
            <option value="government_stance">정치적 입장·선출직 평가 (범위 제외)</option>
            <option value="disaster_emergency">실시간 재난·응급 경보 (범위 제외)</option>
            <option value="private_business">개별 영리 업소 홍보·분쟁 (범위 제외)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          AI에게 물어볼 질문 원문
        </label>
        <input
          type="text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="예: 구로구 대형폐기물 스티커 인터넷 신고 방법과 침대 매트리스 수수료는 얼마인가요?"
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm"
          required
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-950 text-white text-xs font-bold hover:bg-navy-900 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5 text-gold-400" />
          <span>{submitting ? '접수 중...' : '질문 제안 제출'}</span>
        </button>

        {statusMsg && (
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
              statusMsg.ok ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {statusMsg.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>
    </form>
  );
};
