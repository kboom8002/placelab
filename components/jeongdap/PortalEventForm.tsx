'use client';

import React, { useState } from 'react';
import {
  REPAIR_EVENT_ACTIVE_CODES,
  REPAIR_EVENT_DEFENSE_CODES,
} from '@/lib/jeongdap';
import { Wrench, CheckCircle2, AlertCircle } from 'lucide-react';

export const PortalEventForm: React.FC = () => {
  const [unitId, setUnitId] = useState('lg-11530');
  const [eventTrack, setEventTrack] = useState<'defense' | 'active'>('defense');
  const [typeCode, setTypeCode] = useState('F');
  const [targetUrl, setTargetUrl] = useState('');
  const [resultMsg, setResultMsg] = useState<{
    ok: boolean;
    text: string;
    plus2Weeks?: string;
    plus6Weeks?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const codeOptions =
    eventTrack === 'defense' ? REPAIR_EVENT_DEFENSE_CODES : REPAIR_EVENT_ACTIVE_CODES;

  const handleTrackChange = (track: 'defense' | 'active') => {
    setEventTrack(track);
    setTypeCode(track === 'defense' ? 'F' : 'M');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResultMsg(null);
    try {
      const resp = await fetch('/api/portal/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, eventTrack, typeCode, targetUrl }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setResultMsg({ ok: false, text: data.error || '등록에 실패했습니다.' });
      } else {
        setResultMsg({
          ok: true,
          text: data.denominatorNotice,
          plus2Weeks: data.scheduledRemeasurements?.plus2Weeks,
          plus6Weeks: data.scheduledRemeasurements?.plus6Weeks,
        });
        setTargetUrl('');
      }
    } catch {
      setResultMsg({ ok: false, text: '네트워크 오류가 발생했습니다.' });
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
        <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-emerald-600" />
          정비 · 알리기 사건 등록 및 +2주/+6주 자동 재측정 예약
        </h3>
        <p className="text-xs text-slate-500">
          공식 누리집 문서를 신설·보강한 뒤 URL을 등록하면 +2주 및 +6주 시점에 동일 문항을 재측정하여 전후 변화를 기록합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">기관 코드</label>
          <input
            type="text"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
            required
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">사건 트랙</label>
          <select
            value={eventTrack}
            onChange={(e) => handleTrackChange(e.target.value as 'defense' | 'active')}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            <option value="defense">방어 정비 사건 (F·T·Q·D·U·A·S·L·N)</option>
            <option value="active">능동 알리기 사건 (M·E·P·G·R·W)</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">유형 코드</label>
          <select
            value={typeCode}
            onChange={(e) => setTypeCode(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            {Object.entries(codeOptions).map(([c, label]) => (
              <option key={c} value={c}>
                [{c}] {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          정비·개설한 공식 문서 URL
        </label>
        <input
          type="url"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          placeholder="https://www.guro.go.kr/www/contents.do?key=..."
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono"
          required
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-950 text-white text-xs font-bold hover:bg-navy-900 disabled:opacity-50"
        >
          <span>{submitting ? '등록 중...' : '사건 등록 및 재측정 예약'}</span>
        </button>

        {resultMsg && (
          <div
            className={`text-xs font-semibold flex items-center gap-1.5 ${
              resultMsg.ok ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {resultMsg.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>
              {resultMsg.text}
              {resultMsg.plus2Weeks
                ? ` (+2주 재측정: ${resultMsg.plus2Weeks} / +6주 재측정: ${resultMsg.plus6Weeks})`
                : ''}
            </span>
          </div>
        )}
      </div>
    </form>
  );
};
