'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Search,
  Sparkles,
  Save,
  ChevronDown,
  ChevronUp,
  Trash2,
  Check,
  X,
  Edit3,
  Plus,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Compass,
  FileText,
  Tag,
} from 'lucide-react';
import type { Tier2Question, Tier2Category, Tier3QuestionType } from '@/lib/types/source-analysis';
import { TIER3_TEMPLATES, generateTier3Questions, type Tier3Vars } from '@/lib/aeo/tier3-templates';

// ─── 유닛 정보 매핑 ───
const UNIT_NAMES: Record<string, { name: string; fullName: string; province: string; defaultUrl: string }> = {
  'lg-41110': { name: '수원', fullName: '수원특례시', province: '경기도', defaultUrl: 'https://www.suwon.go.kr' },
  'lg-41650': { name: '포천', fullName: '포천시', province: '경기도', defaultUrl: 'https://www.pocheon.go.kr' },
  'lg-26000': { name: '부산', fullName: '부산광역시', province: '부산광역시', defaultUrl: 'https://www.busan.go.kr' },
  'lg-43770': { name: '증평', fullName: '증평군', province: '충청북도', defaultUrl: 'https://www.jp.go.kr' },
  'lg-42150': { name: '강릉', fullName: '강릉시', province: '강원특별자치도', defaultUrl: 'https://www.gn.go.kr' },
  'sz-fez-ifez': { name: 'IFEZ', fullName: '인천경제자유구역', province: '인천광역시', defaultUrl: 'https://www.ifez.go.kr' },
};

// ─── Tier 1 고정 문항 정의 (K04 v2.1) ───
const TIER1_FIXED_ITEMS = [
  { id: 'B-01', category: '출산', template: '{unit} 둘째 출산지원금이랑 산후조리비 총 얼마야?' },
  { id: 'B-02', category: '전입', template: '{unit} 전입신고 하면 받을 수 있는 혜택 있어?' },
  { id: 'B-03', category: '폐기물', template: '{unit} 대형폐기물 스티커 가격이랑 배출 신청 방법 알려줘' },
  { id: 'B-04', category: '종량제', template: '{unit} 종량제봉투 종류별 가격 알려줘' },
  { id: 'B-05', category: '민원', template: '{unit} 청/군청 민원실 점심시간에 되는지, 주차요금 얼마야?' },
  { id: 'B-06', category: '교통비', template: '{unit} 어르신 버스비 지원 대상 나이랑 금액 알려줘' },
  { id: 'B-07', category: '목욕권', template: '{unit} 어르신 목욕권이나 이미용 지원 있어?' },
  { id: 'B-08', category: '월세', template: '{unit} 청년 월세 지원 대상 조건이랑 지원 금액 알려줘' },
  { id: 'B-09', category: '창업', template: '{unit} 청년 창업 지원금이나 창업 공간 지원 있어?' },
  { id: 'B-10', category: '야간진료', template: '{unit} 밤에 아이가 아프면 갈 수 있는 소아과 어디야?' },
  { id: 'B-11', category: '돌봄', template: '{unit} 초등 방과후 돌봄교실이나 지역아동센터 정보 알려줘' },
  { id: 'B-12', category: '다문화', template: '{unit} 다문화가족지원센터 위치랑 프로그램 알려줘' },
  { id: 'B-13', category: '소상공인', template: '{unit} 소상공인 특례보증 대출 조건 알려줘' },
  { id: 'B-14', category: '세무', template: '{unit} 소상공인 무료 세무 상담 받을 수 있는 곳 있어?' },
  { id: 'B-15', category: '축제', template: '{unit} 올해 열리는 대표 축제 일정이랑 장소 안내해줘' },
];

// ─── Tier 2 카테고리 정의 ───
const CATEGORIES: { key: Tier2Category | 'all'; label: string; desc: string }[] = [
  { key: 'all', label: '전체', desc: '모든 카테고리' },
  { key: 'specialty_industry', label: '특산·산업', desc: '지역 대표 특산물 및 주력 첨단 산업' },
  { key: 'landmark', label: '고유 시설·랜드마크', desc: '독점 복합시설 및 대표 명소' },
  { key: 'local_policy', label: '독자 정책·조례', desc: '해당 지자체 고유 복지/청년 조례' },
  { key: 'heritage', label: '역사·문화재', desc: '지정 문화유산, 위인, 향토사' },
  { key: 'geography', label: '지리·생활권', desc: '생활권 분할, 산천 지형, 광역 교통' },
  { key: 'local_food', label: '로컬 음식·명소', desc: '대표 먹거리 거리 및 향토 음식' },
  { key: 'recent_issue', label: '최근 이슈·사업', desc: '최신 도시재생, SOC 핵심 추진 사업' },
];

export interface Tier2Candidate {
  id: string;
  category: string;
  body: string;
  ground_truth_candidate: string;
  source_url?: string;
  status?: 'pending' | 'accepted' | 'rejected';
}

export default function TierQuestionsEditorPage() {
  const params = useParams();
  const rawUnitId = Array.isArray(params?.unitId) ? params.unitId[0] : (params?.unitId as string);
  const unitId = rawUnitId || 'lg-41110';

  const unitMeta = UNIT_NAMES[unitId] || {
    name: unitId,
    fullName: unitId,
    province: '경기도',
    defaultUrl: 'https://www.suwon.go.kr',
  };

  // ─── Collapsible 섹션 상태 ───
  const [tier1Open, setTier1Open] = useState(false);
  const [tier2Open, setTier2Open] = useState(true);
  const [tier3Open, setTier3Open] = useState(false);

  // ─── Tier 2 데이터 상태 ───
  const [questions, setQuestions] = useState<Tier2Question[]>([]);
  const [candidates, setCandidates] = useState<Tier2Candidate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Tier2Category | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // ─── 신규 질문 추가 폼 상태 ───
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    category: 'specialty_industry' as Tier2Category,
    body: '',
    ground_truth: '',
    ground_truth_source: unitMeta.defaultUrl,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });

  // ─── 후보 인라인 편집 상태 ───
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [candidateEditForm, setCandidateEditForm] = useState<{
    category: Tier2Category;
    body: string;
    ground_truth: string;
    source_url: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>({
    category: 'specialty_industry',
    body: '',
    ground_truth: '',
    source_url: '',
    difficulty: 'medium',
  });

  // ─── Tier 3 변수 상태 ───
  const [tier3Vars, setTier3Vars] = useState<Tier3Vars>({
    unit: unitMeta.name,
    province: unitMeta.province,
    keywords: ['수원화성', '수원갈비', '삼성전자'],
    competitors: ['용인시', '성남시'],
    characteristic: '역사 관광',
    travel_time: '1시간',
    trip_type: '주말 가족 나들이 코스',
    situation: '전세 만기인데 아이 키우기 좋은 곳',
    target_audience: 'IT 개발자',
    purpose: '출퇴근하며 살기',
    criteria: '가족 주거 환경',
  });

  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [newCompetitorInput, setNewCompetitorInput] = useState('');

  // ─── 초기 데이터 로딩 ───
  useEffect(() => {
    fetchQuestions();
  }, [unitId]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/aeo/tier2-questions?unit_id=${unitId}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setCandidates(data.candidates || []);
      } else {
        showToast('질문 데이터를 불러오지 못했습니다. 기본 템플릿으로 표시합니다.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('서버 연결 실패', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── [💾 저장] 전체 변경사항 저장 ───
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/aeo/tier2-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_all',
          unit_id: unitId,
          questions,
          candidates,
        }),
      });
      if (res.ok) {
        showToast('모든 질문 및 후보 목록이 안전하게 저장되었습니다.', 'success');
      } else {
        showToast('저장 중 오류가 발생했습니다.', 'error');
      }
    } catch (err: any) {
      showToast('네트워크 오류: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── [🔍 크롤링 시작] ───
  const handleStartCrawl = async () => {
    setCrawling(true);
    showToast(`지자체 공식 사이트(${unitMeta.defaultUrl}) 크롤링을 시작합니다. (INV-5 준수)`, 'info');
    try {
      const res = await fetch('/api/aeo/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          base_url: unitMeta.defaultUrl,
          max_pages: 30,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`크롤링 완료: 총 ${data.crawled_count}개 페이지의 코퍼스가 구축되었습니다.`, 'success');
      } else {
        showToast(`크롤링 실패: ${data.message || data.error}`, 'error');
      }
    } catch (err: any) {
      showToast('크롤링 요청 중 오류: ' + err.message, 'error');
    } finally {
      setCrawling(false);
    }
  };

  // ─── [🤖 질문 자동 생성] ───
  const handleGenerateQuestions = async () => {
    setGenerating(true);
    showToast(`${unitMeta.fullName}의 공식 코퍼스를 기반으로 AI 질문 후보 50개를 생성합니다...`, 'info');
    try {
      const res = await fetch('/api/aeo/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          unit_name: unitMeta.fullName,
          target_count: 50,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCandidates(data.candidates || []);
        showToast(`새로운 질문 후보 ${data.generated_count}개가 추가되었습니다. 후보 목록을 검수해주세요.`, 'success');
      } else {
        showToast(`생성 실패: ${data.message || data.error}`, 'error');
      }
    } catch (err: any) {
      showToast('질문 생성 요청 중 오류: ' + err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // ─── Tier 2 개별 질문 수정 ───
  const handleUpdateQuestion = (id: string, field: keyof Tier2Question, value: any) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  // ─── Tier 2 개별 질문 삭제 ───
  const handleDeleteQuestion = (id: string) => {
    if (confirm('이 질문을 삭제하시겠습니까?')) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      showToast('질문이 목록에서 제거되었습니다. (저장 버튼을 눌러 확정하세요)', 'info');
    }
  };

  // ─── 직접 질문 추가 ───
  const handleAddQuestion = () => {
    if (!newQuestion.body.trim()) {
      alert('질문 내용을 입력해주세요.');
      return;
    }
    const q: Tier2Question = {
      id: `T2-${Date.now().toString(36).slice(-4)}`,
      category: newQuestion.category,
      body: newQuestion.body.trim(),
      ground_truth: newQuestion.ground_truth.trim(),
      ground_truth_source: newQuestion.ground_truth_source.trim(),
      difficulty: newQuestion.difficulty,
    };
    setQuestions((prev) => [q, ...prev]);
    setNewQuestion({
      category: 'specialty_industry',
      body: '',
      ground_truth: '',
      ground_truth_source: unitMeta.defaultUrl,
      difficulty: 'medium',
    });
    setShowAddForm(false);
    showToast('새 질문이 추가되었습니다.', 'success');
  };

  // ─── 후보 승인 ───
  const handleApproveCandidate = (cand: Tier2Candidate) => {
    const q: Tier2Question = {
      id: `T2-${Date.now().toString(36).slice(-4)}`,
      category: (cand.category as Tier2Category) || 'specialty_industry',
      body: cand.body,
      ground_truth: cand.ground_truth_candidate,
      ground_truth_source: cand.source_url || unitMeta.defaultUrl,
      difficulty: 'medium',
    };
    setQuestions((prev) => [...prev, q]);
    setCandidates((prev) => prev.filter((c) => c.id !== cand.id));
    showToast('후보 문항이 확정 질문으로 승인되었습니다.', 'success');
  };

  // ─── 후보 거부 ───
  const handleRejectCandidate = (candidateId: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    showToast('후보 문항이 거부되었습니다.', 'info');
  };

  // ─── 후보 편집 후 승인 ───
  const startEditCandidate = (cand: Tier2Candidate) => {
    setEditingCandidateId(cand.id);
    setCandidateEditForm({
      category: (cand.category as Tier2Category) || 'specialty_industry',
      body: cand.body,
      ground_truth: cand.ground_truth_candidate,
      source_url: cand.source_url || unitMeta.defaultUrl,
      difficulty: 'medium',
    });
  };

  const saveAndApproveCandidate = (candidateId: string) => {
    const q: Tier2Question = {
      id: `T2-${Date.now().toString(36).slice(-4)}`,
      category: candidateEditForm.category,
      body: candidateEditForm.body,
      ground_truth: candidateEditForm.ground_truth,
      ground_truth_source: candidateEditForm.source_url,
      difficulty: candidateEditForm.difficulty,
    };
    setQuestions((prev) => [...prev, q]);
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    setEditingCandidateId(null);
    showToast('수정된 내용으로 승인되어 질문 목록에 등록되었습니다.', 'success');
  };

  // ─── 필터링된 Tier 2 질문 ───
  const filteredQuestions = useMemo(() => {
    if (selectedCategory === 'all') return questions;
    return questions.filter((q) => q.category === selectedCategory);
  }, [questions, selectedCategory]);

  // ─── Tier 3 실시간 생성 ───
  const generatedTier3 = useMemo(() => {
    return generateTier3Questions(tier3Vars);
  }, [tier3Vars]);

  return (
    <div className="min-h-screen bg-[#0a1628] text-slate-100 font-sans pb-24">
      {/* ─── 상단 헤더 바 ─── */}
      <div className="sticky top-0 z-30 bg-[#0a1628]/95 backdrop-blur-md border-b border-[#1e3557] px-4 lg:px-8 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/units/${unitId}`}
              className="p-2 rounded-lg bg-[#0f1d35] hover:bg-[#192d4f] text-slate-400 hover:text-white transition"
              title="지자체 상세로 돌아가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono">
                  {unitId}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-900/40 text-[#c9a84c] border border-[#c9a84c]/30">
                  3-Tier AEO System
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span className="text-[#c9a84c]">{unitMeta.fullName}</span> AEO 질문 관리
              </h1>
            </div>
          </div>

          {/* 액션 버튼 그룹 */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleStartCrawl}
              disabled={crawling}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-[#0f1d35] hover:bg-[#162744] text-slate-200 border border-[#1e3557] hover:border-slate-500 transition shadow-sm disabled:opacity-50"
            >
              {crawling ? <Loader2 className="w-4 h-4 animate-spin text-[#c9a84c]" /> : <Search className="w-4 h-4 text-blue-400" />}
              <span>크롤링 시작</span>
            </button>

            <button
              onClick={handleGenerateQuestions}
              disabled={generating}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-[#14233e] hover:bg-[#1c3053] text-[#c9a84c] border border-[#c9a84c]/50 hover:border-[#c9a84c] transition shadow-sm disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin text-[#c9a84c]" /> : <Sparkles className="w-4 h-4 text-[#c9a84c]" />}
              <span>질문 자동 생성</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#c9a84c] hover:bg-[#b58e39] text-[#0a1628] transition shadow-md hover:shadow-gold/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin text-[#0a1628]" /> : <Save className="w-4 h-4 text-[#0a1628]" />}
              <span>저장</span>
            </button>
          </div>
        </div>
      </div>

      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border ${
              toastMessage.type === 'success'
                ? 'bg-[#0e271e] text-emerald-300 border-emerald-500/40'
                : toastMessage.type === 'error'
                ? 'bg-[#311116] text-rose-300 border-rose-500/40'
                : 'bg-[#0f1d35] text-amber-200 border-[#c9a84c]/50'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
            {toastMessage.type === 'info' && <HelpCircle className="w-5 h-5 text-[#c9a84c] flex-shrink-0" />}
            <span className="text-sm font-medium">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* ─── 본문 영역 ─── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-8 space-y-6">

        {/* 안내 카드 */}
        <div className="bg-[#0f1d35]/60 border border-[#1e3557] rounded-xl p-5 backdrop-blur flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Layers className="w-6 h-6 text-[#c9a84c] mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-white">3-Tier AEO 질문 아키텍처 (K04 v2.1)</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                전국 공통 행정(Tier 1 15개) · 지자체 고유 지식(Tier 2 20개) · 대외 추천 점유율(Tier 3 15개)로 구성됩니다.
                지자체 특성에 맞는 고유 질문을 검수한 뒤 저장하세요.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end md:self-auto text-xs">
            <div className="px-3 py-1.5 rounded-md bg-[#0a1628] border border-[#1e3557] text-slate-300">
              <span className="text-slate-400 mr-1.5">T1 확정:</span>
              <span className="text-white font-bold">15문항</span>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-[#0a1628] border border-[#1e3557] text-slate-300">
              <span className="text-slate-400 mr-1.5">T2 확정:</span>
              <span className="text-[#c9a84c] font-bold">{questions.length} / 20</span>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-[#0a1628] border border-[#1e3557] text-slate-300">
              <span className="text-slate-400 mr-1.5">T2 후보:</span>
              <span className="text-blue-400 font-bold">{candidates.length}건</span>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-[#0a1628] border border-[#1e3557] text-slate-300">
              <span className="text-slate-400 mr-1.5">T3 템플릿:</span>
              <span className="text-white font-bold">15문항</span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* Tier 1 : 기본 행정 (읽기 전용 Collapsible) */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="bg-[#0f1d35] border border-[#1e3557] rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setTier1Open(!tier1Open)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#142644] transition text-left"
          >
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 text-xs font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">
                Tier 1
              </span>
              <div>
                <h3 className="text-base font-semibold text-white">
                  기본 행정 질문 (Baseline)
                </h3>
                <p className="text-xs text-slate-400">
                  전 지자체 공통 15문항 · 읽기 전용 (출산, 전입, 폐기물, 복지, 축제 등)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 rounded bg-slate-900/60 text-slate-400 border border-slate-800">
                15문항 고정
              </span>
              {tier1Open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </button>

          {tier1Open && (
            <div className="p-6 border-t border-[#1e3557] bg-[#0a1628]/40 space-y-3">
              <div className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-slate-800/80 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>
                  Tier 1 문항은 지자체 간 공정 비교를 위해 고정되어 있으며 임의 수정이 불가합니다. 
                  측정 시 {'{unit}'} 자리에 지자체명('{unitMeta.name}')이 자동 대입됩니다.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {TIER1_FIXED_ITEMS.map((item) => {
                  const resolvedText = item.template.replace(/\{unit\}/g, unitMeta.name);
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-lg bg-[#0f1d35] border border-[#1e3557] flex flex-col justify-between hover:border-slate-600 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-slate-400 bg-[#0a1628] px-2 py-0.5 rounded">
                          {item.id}
                        </span>
                        <span className="text-xs text-blue-300 font-medium">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed font-normal">
                        {resolvedText}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* Tier 2 : 지자체 고유 정보 (편집 가능 Collapsible) */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="bg-[#0f1d35] border border-[#1e3557] rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#1e3557]">
            <button
              onClick={() => setTier2Open(!tier2Open)}
              className="flex items-center gap-3 text-left focus:outline-none"
            >
              <span className="px-2.5 py-1 text-xs font-bold rounded bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40">
                Tier 2
              </span>
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  지자체 고유 정보 질문 (Local Knowledge)
                  <span className="text-xs font-normal text-slate-400">
                    ({questions.length} / 목표 20문항)
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  7개 카테고리별 질문 및 사실 확인 정답(Ground Truth) 편집
                </p>
              </div>
              {tier2Open ? <ChevronUp className="w-5 h-5 text-slate-400 ml-2" /> : <ChevronDown className="w-5 h-5 text-slate-400 ml-2" />}
            </button>

            {/* 신규 질문 직접 추가 버튼 */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1a2f52] hover:bg-[#223d6a] text-blue-200 border border-blue-500/30 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 질문 직접 추가</span>
            </button>
          </div>

          {tier2Open && (
            <div className="p-6 space-y-6">

              {/* ─── 새 질문 추가 폼 (토글) ─── */}
              {showAddForm && (
                <div className="p-5 rounded-xl bg-[#0a1628] border border-[#c9a84c]/40 shadow-inner space-y-4 animate-fade-in-up">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#c9a84c] flex items-center gap-2">
                      <Plus className="w-4 h-4" /> 새 Tier 2 질문 직접 등록
                    </h4>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">카테고리</label>
                      <select
                        value={newQuestion.category}
                        onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value as Tier2Category })}
                        className="w-full bg-[#0f1d35] border border-[#1e3557] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#c9a84c]"
                      >
                        {CATEGORIES.filter((c) => c.key !== 'all').map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">난이도</label>
                      <select
                        value={newQuestion.difficulty}
                        onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value as any })}
                        className="w-full bg-[#0f1d35] border border-[#1e3557] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#c9a84c]"
                      >
                        <option value="easy">쉬움 (Easy)</option>
                        <option value="medium">보통 (Medium)</option>
                        <option value="hard">어려움 (Hard)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">출처 URL</label>
                      <input
                        type="url"
                        value={newQuestion.ground_truth_source}
                        onChange={(e) => setNewQuestion({ ...newQuestion, ground_truth_source: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-[#0f1d35] border border-[#1e3557] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#c9a84c]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">질문 본문 (시민 발화 형태)</label>
                    <input
                      type="text"
                      value={newQuestion.body}
                      onChange={(e) => setNewQuestion({ ...newQuestion, body: e.target.value })}
                      placeholder={`${unitMeta.name}의 독자적인 혜택이나 특산물 관련 질문을 입력하세요`}
                      className="w-full bg-[#0f1d35] border border-[#1e3557] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">정답 기준 (Ground Truth 사실 내용)</label>
                    <textarea
                      rows={2}
                      value={newQuestion.ground_truth}
                      onChange={(e) => setNewQuestion({ ...newQuestion, ground_truth: e.target.value })}
                      placeholder="공식 웹사이트 및 조례 기준 명확하고 객관적인 정답 사실을 기재하세요"
                      className="w-full bg-[#0f1d35] border border-[#1e3557] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#c9a84c]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleAddQuestion}
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#c9a84c] hover:bg-[#b58e39] text-[#0a1628]"
                    >
                      목록에 추가
                    </button>
                  </div>
                </div>
              )}

              {/* ─── 카테고리 필터 탭 ─── */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#1e3557] scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.key;
                  const count =
                    cat.key === 'all'
                      ? questions.length
                      : questions.filter((q) => q.category === cat.key).length;

                  return (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                        isSelected
                          ? 'bg-[#c9a84c] text-[#0a1628] font-bold shadow'
                          : 'bg-[#0a1628] text-slate-400 hover:text-slate-200 hover:bg-[#14233e] border border-[#1e3557]'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-[#0a1628] text-[#c9a84c]' : 'bg-[#0f1d35] text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ─── 확정 질문 목록 ─── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    확정된 문항 목록 ({filteredQuestions.length}건)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    내용을 직접 수정한 뒤 상단의 [💾 저장] 버튼을 누르면 확정됩니다.
                  </span>
                </div>

                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#c9a84c]" />
                    <span className="text-xs">데이터를 불러오는 중입니다...</span>
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-[#0a1628]/60 border border-dashed border-[#1e3557] text-slate-400">
                    <p className="text-sm">선택한 카테고리에 등록된 질문이 없습니다.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      하단의 [후보 질문]에서 승인하거나 상단의 [새 질문 직접 추가]를 이용하세요.
                    </p>
                  </div>
                ) : (
                  filteredQuestions.map((q) => {
                    const catInfo = CATEGORIES.find((c) => c.key === q.category);
                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl bg-[#0a1628] border border-[#1e3557] hover:border-slate-600 transition space-y-3"
                      >
                        {/* 카드 헤더 */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0f1d35] text-[#c9a84c] border border-[#c9a84c]/20">
                              {q.id}
                            </span>
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40">
                              {catInfo?.label || q.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-slate-500">난이도:</span>
                              <select
                                value={q.difficulty || 'medium'}
                                onChange={(e) => handleUpdateQuestion(q.id, 'difficulty', e.target.value)}
                                className="bg-[#0f1d35] border border-[#1e3557] text-xs rounded px-2 py-0.5 text-slate-200 focus:outline-none"
                              >
                                <option value="easy">쉬움</option>
                                <option value="medium">보통</option>
                                <option value="hard">어려움</option>
                              </select>
                            </div>

                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition"
                              title="질문 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* 질문 본문 편집 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            질문 본문
                          </label>
                          <textarea
                            rows={2}
                            value={q.body}
                            onChange={(e) => handleUpdateQuestion(q.id, 'body', e.target.value)}
                            className="w-full bg-[#0f1d35] border border-[#1e3557] rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-[#c9a84c] transition"
                          />
                        </div>

                        {/* 정답 (Ground Truth) 편집 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            검증 정답 (Ground Truth)
                          </label>
                          <textarea
                            rows={2}
                            value={q.ground_truth}
                            onChange={(e) => handleUpdateQuestion(q.id, 'ground_truth', e.target.value)}
                            className="w-full bg-[#0f1d35] border border-[#1e3557] rounded-lg p-2.5 text-xs text-amber-200/90 focus:outline-none focus:border-[#c9a84c] transition"
                          />
                        </div>

                        {/* 출처 URL */}
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-slate-400 whitespace-nowrap">출처 URL:</label>
                          <input
                            type="text"
                            value={q.ground_truth_source || ''}
                            onChange={(e) => handleUpdateQuestion(q.id, 'ground_truth_source', e.target.value)}
                            placeholder="https://..."
                            className="flex-1 bg-[#0f1d35] border border-[#1e3557] rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-[#c9a84c]"
                          />
                          {q.ground_truth_source && (
                            <a
                              href={q.ground_truth_source}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded bg-[#0f1d35] hover:bg-[#162744] text-slate-400 hover:text-white"
                              title="출처 열기"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ─── 후보 (Candidates) 서브 섹션 ─── */}
              <div className="pt-6 border-t border-[#1e3557]/80">
                <div className="p-5 rounded-xl bg-[#0a1628]/80 border border-[#c9a84c]/30 shadow-md space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#c9a84c]" />
                      <h4 className="text-sm font-bold text-white">
                        AI 생성 질문 후보 (Candidates)
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40 font-mono">
                        {candidates.length}건 대기
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      검수 후 [승인] 시 위의 확정 질문 목록으로 이동합니다.
                    </span>
                  </div>

                  {candidates.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      대기 중인 질문 후보가 없습니다. 상단의 [🤖 질문 자동 생성] 버튼을 눌러 후보를 생성하세요.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {candidates.map((cand) => {
                        const isEditing = editingCandidateId === cand.id;
                        const catInfo = CATEGORIES.find((c) => c.key === cand.category);

                        return (
                          <div
                            key={cand.id}
                            className="p-4 rounded-lg bg-[#0f1d35] border border-[#1e3557] hover:border-slate-600 transition space-y-2.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                                  {catInfo?.label || cand.category}
                                </span>
                                {cand.source_url && (
                                  <a
                                    href={cand.source_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 truncate max-w-xs"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>출처 확인</span>
                                  </a>
                                )}
                              </div>

                              {/* 액션 버튼들 */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleApproveCandidate(cand)}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 transition"
                                  title="즉시 승인"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>승인</span>
                                </button>

                                <button
                                  onClick={() => (isEditing ? setEditingCandidateId(null) : startEditCandidate(cand))}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-[#0a1628] hover:bg-[#14233e] text-slate-300 border border-slate-700 transition"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>{isEditing ? '닫기' : '편집 후 승인'}</span>
                                </button>

                                <button
                                  onClick={() => handleRejectCandidate(cand.id)}
                                  className="p-1 text-slate-500 hover:text-rose-400 transition"
                                  title="후보 거부"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* 후보 본문 (읽기 or 인라인 편집) */}
                            {isEditing ? (
                              <div className="space-y-3 pt-2 border-t border-slate-800">
                                <div>
                                  <label className="block text-[11px] text-slate-400 mb-1">질문 수정</label>
                                  <input
                                    type="text"
                                    value={candidateEditForm.body}
                                    onChange={(e) => setCandidateEditForm({ ...candidateEditForm, body: e.target.value })}
                                    className="w-full bg-[#0a1628] border border-[#c9a84c]/50 rounded p-2 text-xs text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] text-slate-400 mb-1">정답 수정</label>
                                  <textarea
                                    rows={2}
                                    value={candidateEditForm.ground_truth}
                                    onChange={(e) => setCandidateEditForm({ ...candidateEditForm, ground_truth: e.target.value })}
                                    className="w-full bg-[#0a1628] border border-[#c9a84c]/50 rounded p-2 text-xs text-amber-200"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingCandidateId(null)}
                                    className="px-2.5 py-1 text-xs text-slate-400"
                                  >
                                    취소
                                  </button>
                                  <button
                                    onClick={() => saveAndApproveCandidate(cand.id)}
                                    className="px-3 py-1 text-xs font-semibold rounded bg-[#c9a84c] text-[#0a1628]"
                                  >
                                    수정본으로 승인
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm text-slate-200 font-medium leading-relaxed">
                                  {cand.body}
                                </p>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed bg-[#0a1628]/60 p-2 rounded border border-slate-800/80">
                                  <span className="text-[#c9a84c] font-semibold mr-1">GT:</span>
                                  {cand.ground_truth_candidate}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* Tier 3 : 대외 홍보력 (템플릿 기반 Collapsible) */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="bg-[#0f1d35] border border-[#1e3557] rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setTier3Open(!tier3Open)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#142644] transition text-left"
          >
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 text-xs font-bold rounded bg-purple-950 text-purple-300 border border-purple-800">
                Tier 3
              </span>
              <div>
                <h3 className="text-base font-semibold text-white">
                  대외 홍보력 질문 템플릿 (Share of Voice)
                </h3>
                <p className="text-xs text-slate-400">
                  경쟁 도시 및 키워드 설정 기반 15개 템플릿 자동 조합
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50">
                15문항 템플릿
              </span>
              {tier3Open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </button>

          {tier3Open && (
            <div className="p-6 border-t border-[#1e3557] space-y-6">

              {/* ─── 변수 설정 패널 ─── */}
              <div className="p-5 rounded-xl bg-[#0a1628] border border-[#1e3557] space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-[#c9a84c]" />
                  대외 비교 및 연상 변수 설정
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 경쟁도시 설정 칩 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">
                      경쟁 지자체 설정 (Comparison)
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-[#0f1d35] border border-[#1e3557] min-h-[42px]">
                      {tier3Vars.competitors.map((comp, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-950 text-blue-200 text-xs border border-blue-800"
                        >
                          {comp}
                          <button
                            onClick={() =>
                              setTier3Vars({
                                ...tier3Vars,
                                competitors: tier3Vars.competitors.filter((_, i) => i !== idx),
                              })
                            }
                            className="text-blue-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newCompetitorInput}
                          onChange={(e) => setNewCompetitorInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newCompetitorInput.trim()) {
                              e.preventDefault();
                              setTier3Vars({
                                ...tier3Vars,
                                competitors: [...tier3Vars.competitors, newCompetitorInput.trim()],
                              });
                              setNewCompetitorInput('');
                            }
                          }}
                          placeholder="새 경쟁도시 입력 후 Enter"
                          className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none px-1 py-0.5 w-36"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 대표 키워드 설정 칩 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">
                      대표 키워드 설정 (Keyword Entry)
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-[#0f1d35] border border-[#1e3557] min-h-[42px]">
                      {tier3Vars.keywords.map((kw, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-950 text-[#c9a84c] text-xs border border-amber-800"
                        >
                          {kw}
                          <button
                            onClick={() =>
                              setTier3Vars({
                                ...tier3Vars,
                                keywords: tier3Vars.keywords.filter((_, i) => i !== idx),
                              })
                            }
                            className="text-amber-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newKeywordInput}
                          onChange={(e) => setNewKeywordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newKeywordInput.trim()) {
                              e.preventDefault();
                              setTier3Vars({
                                ...tier3Vars,
                                keywords: [...tier3Vars.keywords, newKeywordInput.trim()],
                              });
                              setNewKeywordInput('');
                            }
                          }}
                          placeholder="새 키워드 입력 후 Enter"
                          className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none px-1 py-0.5 w-36"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 기타 시나리오 변수 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">상위 광역 지자체</label>
                    <input
                      type="text"
                      value={tier3Vars.province}
                      onChange={(e) => setTier3Vars({ ...tier3Vars, province: e.target.value })}
                      className="w-full bg-[#0f1d35] border border-[#1e3557] rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">특성 (A2)</label>
                    <input
                      type="text"
                      value={tier3Vars.characteristic}
                      onChange={(e) => setTier3Vars({ ...tier3Vars, characteristic: e.target.value })}
                      className="w-full bg-[#0f1d35] border border-[#1e3557] rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">이동 시간 (D1)</label>
                    <input
                      type="text"
                      value={tier3Vars.travel_time}
                      onChange={(e) => setTier3Vars({ ...tier3Vars, travel_time: e.target.value })}
                      className="w-full bg-[#0f1d35] border border-[#1e3557] rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">비교 기준 (E1)</label>
                    <input
                      type="text"
                      value={tier3Vars.criteria}
                      onChange={(e) => setTier3Vars({ ...tier3Vars, criteria: e.target.value })}
                      className="w-full bg-[#0f1d35] border border-[#1e3557] rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* ─── Tier 3 조합 결과 미리보기 (15개) ─── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>자동 생성된 Tier 3 질문 목록 (15문항)</span>
                  <span className="text-purple-300 font-mono">SoV(Share of Voice) 측정 대상</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {generatedTier3.map((q) => {
                    const typeLabelMap: Record<Tier3QuestionType, string> = {
                      recommendation: 'T3-A 추천 경쟁',
                      association: 'T3-B 연상 테스트',
                      keyword_entry: 'T3-C 키워드 진입',
                      scenario: 'T3-D 시나리오',
                      comparison: 'T3-E 비교 질문',
                      negative_test: 'T3-F 부정 테스트',
                    };

                    return (
                      <div
                        key={q.id}
                        className="p-3.5 rounded-lg bg-[#0a1628] border border-[#1e3557] flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                            {q.id}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {typeLabelMap[q.type] || q.type}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed font-normal">
                          {q.body}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
