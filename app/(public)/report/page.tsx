// app/(public)/report/page.tsx
// FR-69: 시민 AI 오답 제보 시스템 (Floor Hunter)
// AGENTS.md 불변식 준수:
// - INV-6: AI 응답 원문 전문 저장·공개 금지 (2000자 요약 제한)
// - INV-7: 측정 조건(AI 서비스, 웹검색, 언어, 일자) 필수 기록
// - INV-4: Layer 2 자발적 관측 프로토콜

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Send,
  Upload,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Search,
  ChevronDown,
  ArrowRight,
  Info,
} from 'lucide-react';
import { REPORT_SYNDROME_LABELS, type ReportSyndrome } from '@/lib/types/citizen-report';
import type { Accuracy } from '@/lib/types/layers';

const MUNICIPALITIES = [
  { id: 'AG-0076', name: '수원시', region: '경기도' },
  { id: 'AG-0080', name: '화성시', region: '경기도' },
  { id: 'AG-0078', name: '성남시', region: '경기도' },
  { id: 'AG-0085', name: '용인시', region: '경기도' },
  { id: 'AG-0081', name: '고양시', region: '경기도' },
  { id: 'AG-41650', name: '포천시', region: '경기도' },
  { id: 'AG-50130', name: '서귀포시', region: '제주특별자치도' },
  { id: 'AG-50000', name: '제주시', region: '제주특별자치도' },
  { id: 'AG-0171', name: '증평군', region: '충청북도' },
  { id: 'AG-0023', name: '강남구', region: '서울특별시' },
  { id: 'AG-0001', name: '종로구', region: '서울특별시' },
  { id: 'AG-0107', name: '강릉시', region: '강원특별자치도' },
  { id: 'AG-0169', name: '청주시', region: '충청북도' },
  { id: 'AG-0176', name: '천안시', region: '충청남도' },
  { id: 'AG-0154', name: '전주시', region: '전북특별자치도' },
  { id: 'AG-0137', name: '포항시', region: '경상북도' },
  { id: 'AG-0220', name: '창원시', region: '경상남도' },
  { id: 'AG-0193', name: '목포시', region: '전라남도' },
];

export default function FloorHunterReportPage() {
  const today = new Date().toISOString().split('T')[0];

  // 1. 대상 지자체
  const [search, setSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(MUNICIPALITIES[0]);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  // 2. 측정 조건 (INV-7 필수)
  const [aiService, setAiService] = useState('ChatGPT (OpenAI)');
  const [modelVersion, setModelVersion] = useState('GPT-4o');
  const [webSearch, setWebSearch] = useState(false);
  const [language, setLanguage] = useState('ko');
  const [measuredOn, setMeasuredOn] = useState(today);

  // 3. 제보 내용 (INV-6 2000자 제한)
  const [promptUsed, setPromptUsed] = useState('');
  const [aiResponseSummary, setAiResponseSummary] = useState('');
  const [verdictSelf, setVerdictSelf] = useState<Accuracy>('inaccurate');
  const [isConfabulation, setIsConfabulation] = useState(false);
  const [syndromeSelf, setSyndromeSelf] = useState<ReportSyndrome>('confabulation');
  const [evidenceNote, setEvidenceNote] = useState('');

  // 4. 스크린샷 및 제보자
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitterType, setSubmitterType] = useState('resident');
  const [anonymous, setAnonymous] = useState(true);
  const [submitterEmail, setSubmitterEmail] = useState('');

  // UI 상태
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const filteredUnits = useMemo(() => {
    if (!search) return MUNICIPALITIES;
    return MUNICIPALITIES.filter(
      (m) => m.name.includes(search) || m.region.includes(search)
    );
  }, [search]);

  // 스크린샷 업로드 핸들러
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/report/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setScreenshotUrl(data.url);
      } else {
        alert(data.error || '이미지 업로드에 실패했습니다.');
      }
    } catch {
      alert('이미지 업로드 중 네트워크 오류가 발생했습니다.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!promptUsed.trim()) {
      setSubmitError('사용하신 프롬프트 질문을 입력해 주세요.');
      return;
    }

    if (!aiResponseSummary.trim()) {
      setSubmitError('AI 응답의 핵심 요약을 입력해 주세요.');
      return;
    }

    if (aiResponseSummary.length > 2000) {
      setSubmitError('AI 응답 요약은 2000자를 초과할 수 없습니다 (INV-6 준수).');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: selectedUnit.id,
          promptUsed,
          aiResponseSummary,
          aiService,
          modelVersion: modelVersion || undefined,
          webSearch,
          language,
          measuredOn,
          verdictSelf,
          isConfabulation,
          syndromeSelf,
          evidenceNote: evidenceNote || undefined,
          screenshotUrl: screenshotUrl || undefined,
          submitterType,
          anonymous,
          submitterEmail: submitterEmail || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSubmitError(json.error || '제보 제출에 실패했습니다.');
      } else {
        setSubmitSuccess(
          json.autoQualified
            ? '제보가 성공적으로 등록되었으며, 중요 결함으로 식별되어 Layer 3 검증 큐에 자동 후보로 승격되었습니다!'
            : '제보가 성공적으로 등록되었습니다. 관리자 검수 후 군집 대시보드에 반영됩니다.'
        );
        // 입력 필드 초기화
        setPromptUsed('');
        setAiResponseSummary('');
        setEvidenceNote('');
        setScreenshotUrl('');
      }
    } catch {
      setSubmitError('네트워크 통신 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-fade-in-up">
      {/* 상단 안내 배너 */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 text-rose-300 text-xs font-semibold border border-rose-800/60">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          Layer 2 · 시민 크라우드소싱 조기 경보 센서
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
          Floor Hunter — AI 행정 오답·작화 제보
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          시민이 일상에서 발견한 AI의 오답, 옛날 정보, 그럴듯하게 지어낸 가짜 제도(작화)를 제보받습니다.
          접수된 제보는 군집 분석을 거쳐 <strong>공식 검증 프로브(Layer 3)</strong>로 승격되어 정밀 실측에 투입됩니다.
        </p>
      </div>

      {/* 완료 알림 */}
      {submitSuccess && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm flex items-start gap-3.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-bold text-base">{submitSuccess}</p>
            <div className="flex gap-3">
              <Link
                href="/dashboard/reports"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 underline hover:text-emerald-950"
              >
                시민 제보 현황 대시보드 보기 <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 에러 알림 */}
      {submitError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="font-medium">{submitError}</p>
        </div>
      )}

      {/* 메인 폼 카드 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-editorial p-6 sm:p-8 space-y-8">
        {/* 1. 대상 지자체 선택 */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-navy-950 uppercase tracking-wider">
            1. 대상 지자체 (시·군·구) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUnitDropdown(!showUnitDropdown)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-center justify-between transition-all"
            >
              <div>
                <span className="font-bold text-navy-950 text-base">{selectedUnit.name}</span>
                <span className="text-xs text-slate-500 ml-2">({selectedUnit.region})</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {showUnitDropdown && (
              <div className="absolute z-20 top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl p-3 space-y-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="지자체명 검색..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full text-xs bg-transparent focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredUnits.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedUnit(u);
                        setShowUnitDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs rounded-lg hover:bg-slate-100 flex items-center justify-between"
                    >
                      <span className="font-semibold text-navy-950">{u.name}</span>
                      <span className="text-slate-400">{u.region}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. 측정 조건 (INV-7 필수) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
            <Sparkles className="w-3.5 h-3.5 text-gold-500" />
            2. 측정 환경 조건 (AGENTS.md INV-7 필수 메타데이터)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                사용 AI 서비스 <span className="text-rose-500">*</span>
              </label>
              <select
                value={aiService}
                onChange={(e) => setAiService(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
              >
                <option value="ChatGPT (OpenAI)">ChatGPT (OpenAI)</option>
                <option value="Gemini (Google)">Gemini (Google)</option>
                <option value="Claude (Anthropic)">Claude (Anthropic)</option>
                <option value="Perplexity">Perplexity</option>
                <option value="Clova X (Naver)">Clova X (Naver)</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                세부 모델 버전 (선택)
              </label>
              <input
                type="text"
                value={modelVersion}
                onChange={(e) => setModelVersion(e.target.value)}
                placeholder="예: GPT-4o, Gemini 2.5 Flash, 3.5 Sonnet"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                웹 검색 사용 여부 <span className="text-rose-500">*</span>
              </label>
              <select
                value={webSearch ? 'true' : 'false'}
                onChange={(e) => setWebSearch(e.target.value === 'true')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
              >
                <option value="false">웹 검색 끔 (OFF · 표준 권장)</option>
                <option value="true">웹 검색 켬 (ON · 실시간 검색 연동)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                관측 일자 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={measuredOn}
                onChange={(e) => setMeasuredOn(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
          </div>
        </div>

        {/* 3. 프롬프트 및 응답 요약 (INV-6 준수) */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy-950 uppercase tracking-wider mb-1">
              3. 입력한 프롬프트 질문 <span className="text-rose-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">
              실제 AI에게 질문하셨던 문장을 그대로 적어주세요.
            </p>
            <textarea
              rows={2}
              value={promptUsed}
              onChange={(e) => setPromptUsed(e.target.value)}
              placeholder="예: 수원시 둘째 아이 낳으면 지원금 얼마 나오고 산후조리비 지원되나요?"
              className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-navy-900/10 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-navy-950 uppercase tracking-wider">
                4. AI 응답 내용 요약 (핵심 오답 위주) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {aiResponseSummary.length} / 2000자
              </span>
            </div>
            <div className="p-3 mb-2 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>원문 전문 붙여넣기 금지 (AGENTS.md INV-6 준수):</strong> 편집 책임과 허위 정보 확산 방지를 위해 AI의 긴 원문 전문 대신, <strong>무엇이 어떻게 틀렸는지 핵심 요약 위주</strong>로 작성해 주세요.
              </div>
            </div>
            <textarea
              rows={4}
              value={aiResponseSummary}
              onChange={(e) => setAiResponseSummary(e.target.value)}
              maxLength={2000}
              placeholder="예: AI가 수원시에서 '수원맘 새출발 바우처 300만원'을 지급한다고 안내함. 또한 첫째도 100만원 지원된다고 설명했으나 실제와 다름."
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-900/10 focus:outline-none"
            />
          </div>
        </div>

        {/* 4. 판정 및 증상 분류 */}
        <div className="space-y-4 pt-2">
          <label className="block text-xs font-bold text-navy-950 uppercase tracking-wider">
            5. 결함 성격 판정 및 증상군 분류
          </label>

          {/* 작화 체크박스 강조 */}
          <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="confab"
              checked={isConfabulation}
              onChange={(e) => {
                setIsConfabulation(e.target.checked);
                if (e.target.checked) {
                  setVerdictSelf('inaccurate');
                  setSyndromeSelf('confabulation');
                }
              }}
              className="mt-1 w-4 h-4 text-rose-600 rounded border-rose-300 focus:ring-rose-500"
            />
            <label htmlFor="confab" className="cursor-pointer">
              <span className="font-bold text-sm text-rose-950 block">
                ⚠️ 환각/작화(Confabulation) 발생 — Floor Risk: critical
              </span>
              <span className="text-xs text-rose-800/90 leading-relaxed block mt-0.5">
                실제 지자체에는 존재하지 않는 허위 제도, 가공의 바우처, 가짜 기한을 진짜처럼 지어내어 주민에게 헛걸음과 혼란을 유발하는 치명적 오류인 경우 체크해 주세요.
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                자가 정확도 판정 (4단계)
              </label>
              <select
                value={verdictSelf}
                onChange={(e) => setVerdictSelf(e.target.value as Accuracy)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
              >
                <option value="inaccurate">부정확 (핵심 사실이 틀림)</option>
                <option value="partial">부분정확 (방향은 맞으나 세부/금액 오류)</option>
                <option value="absent">부재 (엉뚱한 일반론만 말하거나 모름)</option>
                <option value="accurate">정확 (참고용/정상 답변 제보)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                실패 증상군 분류 (K03 규약)
              </label>
              <select
                value={syndromeSelf}
                onChange={(e) => setSyndromeSelf(e.target.value as ReportSyndrome)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
              >
                {Object.entries(REPORT_SYNDROME_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              왜 틀렸다고 판단하셨나요? (근거 및 사실 확인 내용)
            </label>
            <input
              type="text"
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              placeholder="예: 시청 누리집 2026년 공고문 확인 결과 둘째 지원금은 100만원임."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* 5. 스크린샷 증빙 (선택) */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-navy-950 uppercase tracking-wider">
            6. 증빙 스크린샷 첨부 (선택)
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all">
              <Upload className="w-4 h-4" />
              <span>{uploadingImage ? '업로드 중...' : '이미지 파일 선택'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>
            {screenshotUrl && (
              <span className="text-xs text-emerald-700 font-medium">
                ✓ 첨부 완료 ({screenshotUrl.slice(0, 30)}...)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            * 캡처 화면에 본인의 이메일이나 프로필 사진 등 개인정보(PII)가 노출되지 않도록 주의해 주세요.
          </p>
        </div>

        {/* 6. 제보자 옵션 */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-navy-900"
              />
              <span>익명으로 제보 (권장)</span>
            </label>

            <select
              value={submitterType}
              onChange={(e) => setSubmitterType(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
            >
              <option value="resident">지역 주민</option>
              <option value="official">지자체 공무원</option>
              <option value="researcher">연구자/전문가</option>
              <option value="press">언론인</option>
              <option value="unknown">일반 시민</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              이메일 (검증 승격 알림 희망 시에만 입력 · 소속 증명으로 쓰이지 않음)
            </label>
            <input
              type="email"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-4 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
            submitting
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-navy-950 hover:bg-navy-900 text-gold-300 hover:text-gold-200 cursor-pointer hover:shadow-xl hover:scale-[1.01]'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? '제보 등록 처리 중...' : 'Floor Hunter 오답 제보 접수하기'}</span>
        </button>
      </form>
    </div>
  );
}
