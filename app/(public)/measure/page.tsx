'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Zap,
  Microscope,
  Check,
  FileCheck2,
  ShieldCheck,
  Bot,
  Sparkles,
  Layers,
  AlertCircle,
  Clock,
} from 'lucide-react';
import clsx from 'clsx';

// 전국 226개 기초지자체 + 2개 행정시(제주시·서귀포시) 대표 목록
const ALL_UNITS = [
  { id: 'AG-0076', name: '수원시', region: '경기도', type: '시' },
  { id: 'AG-0080', name: '화성시', region: '경기도', type: '시' },
  { id: 'AG-0078', name: '성남시', region: '경기도', type: '시' },
  { id: 'AG-0085', name: '용인시', region: '경기도', type: '시' },
  { id: 'AG-0081', name: '고양시', region: '경기도', type: '시' },
  { id: 'AG-50130', name: '서귀포시', region: '제주특별자치도', type: '행정시' },
  { id: 'AG-50000', name: '제주시', region: '제주특별자치도', type: '행정시' },
  { id: 'AG-0171', name: '증평군', region: '충청북도', type: '군' },
  { id: 'AG-0023', name: '강남구', region: '서울특별시', type: '자치구' },
  { id: 'AG-0001', name: '종로구', region: '서울특별시', type: '자치구' },
  { id: 'AG-0025', name: '강동구', region: '서울특별시', type: '자치구' },
  { id: 'AG-0026', name: '부산 중구', region: '부산광역시', type: '자치구' },
  { id: 'AG-0042', name: '인천 중구', region: '인천광역시', type: '자치구' },
  { id: 'AG-0169', name: '청주시', region: '충청북도', type: '시' },
  { id: 'AG-0176', name: '천안시', region: '충청남도', type: '시' },
  { id: 'AG-0177', name: '공주시', region: '충청남도', type: '시' },
  { id: 'AG-0141', name: '논산시', region: '충청남도', type: '시' },
  { id: 'AG-0193', name: '목포시', region: '전라남도', type: '시' },
  { id: 'AG-0194', name: '여수시', region: '전라남도', type: '시' },
  { id: 'AG-0196', name: '광양시', region: '전라남도', type: '시' },
  { id: 'AG-0209', name: '완도군', region: '전라남도', type: '군' },
  { id: 'AG-0220', name: '창원시', region: '경상남도', type: '시' },
  { id: 'AG-0223', name: '진주시', region: '경상남도', type: '시' },
  { id: 'AG-0107', name: '강릉시', region: '강원특별자치도', type: '시' },
  { id: 'AG-0105', name: '춘천시', region: '강원특별자치도', type: '시' },
  { id: 'AG-0154', name: '전주시', region: '전북특별자치도', type: '시' },
  { id: 'AG-0155', name: '군산시', region: '전북특별자치도', type: '시' },
  { id: 'AG-0137', name: '포항시', region: '경상북도', type: '시' },
  { id: 'AG-0138', name: '경주시', region: '경상북도', type: '시' },
];

export default function MeasurePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<typeof ALL_UNITS[0] | null>(ALL_UNITS[0]); // 기본 수원시
  const [executionType, setExecutionType] = useState<'live' | 'simulation'>('live');
  const [selectedProviders, setSelectedProviders] = useState<{ gemini: boolean; openai: boolean }>({
    gemini: true,
    openai: false,
  });
  const [repetitions, setRepetitions] = useState<number>(3);
  const [questionSet, setQuestionSet] = useState<'core' | 'custom'>('core');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const filteredUnits = useMemo(() => {
    if (!search) return ALL_UNITS;
    const s = search.toLowerCase();
    return ALL_UNITS.filter((u) => u.name.includes(s) || u.region.includes(s));
  }, [search]);

  const toggleProvider = (provider: 'gemini' | 'openai') => {
    setSelectedProviders((prev) => {
      const next = { ...prev, [provider]: !prev[provider] };
      // 최소 하나는 선택되어야 함
      if (!next.gemini && !next.openai) {
        return prev;
      }
      return next;
    });
  };

  const activeProviderCount = (selectedProviders.gemini ? 1 : 0) + (selectedProviders.openai ? 1 : 0);

  // 예상 소요 시간 및 쿼리 계산
  const estimatedSeconds = useMemo(() => {
    if (executionType === 'simulation') return 3;
    const qCount = 30;
    const calls = qCount * repetitions * activeProviderCount;
    return Math.round((calls * 1.2)); // 대략 회당 1.2초
  }, [executionType, repetitions, activeProviderCount]);

  const handleStart = async () => {
    if (!selectedUnit) return;
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (executionType === 'simulation') {
        // 시뮬레이션 모드: 기존 페이지로 이동
        router.push(`/measure/spec-${encodeURIComponent(selectedUnit.name)}?sim=true`);
        return;
      }

      // 실측 모드: /api/measure/run POST 호출하여 잡 등록
      const providers: ('gemini' | 'openai')[] = [];
      if (selectedProviders.gemini) providers.push('gemini');
      if (selectedProviders.openai) providers.push('openai');

      const res = await fetch('/api/measure/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_handle: selectedUnit.id,
          agency_name: selectedUnit.name,
          providers,
          models: {
            gemini: 'gemini-2.5-flash',
            openai: 'gpt-5.6-luna',
          },
          question_set: questionSet,
          repetitions,
          channel: 'agency_notice',
          simulation: false,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || '측정 작업 등록에 실패했습니다.');
      }

      // 스트리밍 뷰어 페이지로 라우팅
      router.push(`/measure/spec-${encodeURIComponent(selectedUnit.name)}?jobId=${data.job_id}`);
    } catch (err: any) {
      console.error('측정 시작 실패:', err);
      setSubmitError(err.message || '측정 시작 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#0a1628] font-sans">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 bg-[#0a1628] text-[#c9a84c] text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>최신 AI Search Grounding 실측 지원</span>
          </div>
          <h1 className="text-4xl font-bold mb-3 tracking-tight">AI 정보 접근성 정규 실측</h1>
          <p className="text-lg text-gray-600">
            OpenAI 및 Google Gemini 최신 모델을 선택하여 지자체의 행정·복지·관광 정보 전달력을 실측하고, 
            기관장 및 일반인을 위한 종합 진단 보고서를 도출합니다.
          </p>
        </header>

        {submitError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">실측 등록 실패</p>
              <p className="text-sm mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Step 1: 대상 선택 */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#0a1628] text-[#c9a84c] flex items-center justify-center font-bold">1</div>
              <div>
                <h2 className="text-xl font-bold">측정 대상 지자체</h2>
                <p className="text-xs text-gray-500 mt-0.5">전국 226개 기초단체 및 특별자치도 행정시를 검색하세요</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="지자체 이름 검색 (예: 수원시, 서귀포시, 화성시, 강남구)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent transition-all"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
              </div>

              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredUnits.length > 0 ? (
                    filteredUnits.map((unit) => (
                      <button
                        key={unit.id}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                        onClick={() => {
                          setSelectedUnit(unit);
                          setSearch(unit.name);
                          setShowDropdown(false);
                        }}
                      >
                        <span className="font-medium">{unit.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">[{unit.type}]</span>
                          <span className="text-sm text-gray-500">{unit.region}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500">검색 결과가 없습니다.</div>
                  )}
                </div>
              )}
            </div>

            {selectedUnit && (
              <div className="mt-4 flex items-center gap-2 bg-[#f8f7f4] p-3 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-500">선택 기관:</span>
                <span className="font-bold text-[#0a1628] bg-white px-3 py-1 rounded-md border border-[#c9a84c] text-sm flex items-center gap-2">
                  <span>{selectedUnit.region} {selectedUnit.name}</span>
                  <span className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{selectedUnit.id}</span>
                </span>
                <button 
                  onClick={() => { setSelectedUnit(null); setSearch(''); }}
                  className="ml-auto text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  변경
                </button>
              </div>
            )}
          </section>

          {/* Step 2: 실행 방식 */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#0a1628] text-[#c9a84c] flex items-center justify-center font-bold">2</div>
              <div>
                <h2 className="text-xl font-bold">측정 모드 선택</h2>
                <p className="text-xs text-gray-500 mt-0.5">실제 AI 호출 실측 또는 파이프라인 규격 시뮬레이션을 선택하세요</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setExecutionType('live')}
                className={clsx(
                  "p-6 rounded-xl border-2 text-left transition-all relative overflow-hidden",
                  executionType === 'live' ? "border-[#c9a84c] bg-[#c9a84c]/10 shadow-sm" : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="absolute top-3 right-3">
                  <span className="text-[11px] bg-[#0a1628] text-[#c9a84c] px-2 py-0.5 rounded-full font-bold">
                    실제 측정 권장
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <Zap className={clsx("w-6 h-6", executionType === 'live' ? "text-[#c9a84c]" : "text-gray-400")} />
                  <h3 className="text-lg font-bold">정규 실측 (Live)</h3>
                </div>
                <p className="text-gray-600 text-xs mb-3">Google Gemini & OpenAI 실제 API 호출로 실시간 검색 측정</p>
                <ul className="text-xs space-y-1 text-gray-500">
                  <li>• Search Grounding 실시간 검색 연동</li>
                  <li>• 사실 원장(Ground Truth)과 규칙 대조</li>
                  <li>• 일반인용 VIP 보고서 및 5대 절 산출물 생성</li>
                </ul>
              </button>

              <button
                onClick={() => setExecutionType('simulation')}
                className={clsx(
                  "p-6 rounded-xl border-2 text-left transition-all",
                  executionType === 'simulation' ? "border-[#c9a84c] bg-[#c9a84c]/10" : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileCheck2 className={clsx("w-6 h-6", executionType === 'simulation' ? "text-[#c9a84c]" : "text-gray-400")} />
                  <h3 className="text-lg font-bold">규격 시뮬레이션 (Demo)</h3>
                </div>
                <p className="text-gray-600 text-xs mb-3">API 키 없이 4칸 파이프라인의 격자 및 산출물 구조를 즉시 검증</p>
                <ul className="text-xs space-y-1 text-gray-500">
                  <li>• 모의 응답 데이터 기반 즉시 생성 (~3초)</li>
                  <li>• 5대 절 산출물 및 N/C 코드 체계 확인</li>
                  <li>• 무료 테스트 및 시연용</li>
                </ul>
              </button>
            </div>
          </section>

          {/* Step 3: 실측 옵션 (모델 & 회차) */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#0a1628] text-[#c9a84c] flex items-center justify-center font-bold">3</div>
              <div>
                <h2 className="text-xl font-bold">AI 모델 및 실측 옵션</h2>
                <p className="text-xs text-gray-500 mt-0.5">하나 또는 두 모델을 모두 선택하여 교차 비교할 수 있습니다</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* 모델 선택 */}
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-3">측정 대상 AI 모델 (복수 선택 가능)</label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => toggleProvider('gemini')}
                    className={clsx(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3",
                      selectedProviders.gemini ? "border-[#0a1628] bg-blue-50/50" : "border-gray-200 opacity-60 hover:opacity-80"
                    )}
                  >
                    <div className={clsx(
                      "w-5 h-5 rounded mt-0.5 flex items-center justify-center border",
                      selectedProviders.gemini ? "bg-[#0a1628] border-[#0a1628] text-white" : "border-gray-300"
                    )}>
                      {selectedProviders.gemini && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">Google Gemini</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">실시간 검색</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">모델: gemini-2.5-flash (Google Search Grounding 탑재)</p>
                      <p className="text-[11px] text-gray-400 mt-1">포털 및 공식 누리집 실시간 크롤링 반영률 측정</p>
                    </div>
                  </div>

                  <div
                    onClick={() => toggleProvider('openai')}
                    className={clsx(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3",
                      selectedProviders.openai ? "border-[#0a1628] bg-emerald-50/50" : "border-gray-200 opacity-60 hover:opacity-80"
                    )}
                  >
                    <div className={clsx(
                      "w-5 h-5 rounded mt-0.5 flex items-center justify-center border",
                      selectedProviders.openai ? "bg-[#0a1628] border-[#0a1628] text-white" : "border-gray-300"
                    )}>
                      {selectedProviders.openai && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">OpenAI ChatGPT</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">행정 지식</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">모델: gpt-5.6-luna (공식 지자체 조례·정보 질의)</p>
                      <p className="text-[11px] text-gray-400 mt-1">학습 기반 기본 지식의 왜곡 및 고착 여부 측정</p>
                    </div>
                  </div>
                </div>

                {selectedProviders.gemini && selectedProviders.openai && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-600" />
                    <span><strong>다중 모델 비교 모드 활성화:</strong> Gemini와 ChatGPT의 정확도, 인용률, 안정성을 한 표에서 비교 분석하는 섹션이 보고서에 자동 추가됩니다.</span>
                  </div>
                )}
              </div>

              {/* 회차 선택 */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-gray-700 block">반복 측정 회차 (Robustness)</label>
                    <p className="text-xs text-gray-500 mt-0.5">AI 응답의 일관성 및 환각(Hallucination) 감지를 위한 반복 질의 수</p>
                  </div>
                  <div className="flex gap-2">
                    {[1, 3, 5].map((rep) => (
                      <button
                        key={rep}
                        type="button"
                        onClick={() => setRepetitions(rep)}
                        className={clsx(
                          "px-4 py-2 rounded-lg text-xs font-bold border transition-all",
                          repetitions === rep
                            ? "bg-[#0a1628] text-[#c9a84c] border-[#0a1628]"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        {rep}회 반복
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 문항 세트 */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-gray-700 block">문항 세트</label>
                    <p className="text-xs text-gray-500 mt-0.5">전국 공통 핵심 행정·복지·관광 30문항 (SSOT)</p>
                  </div>
                  <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200">
                    코어 공통 30문항 고정
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 시작 버튼 */}
          <div className="flex flex-col items-center mt-8">
            <button
              onClick={handleStart}
              disabled={!selectedUnit || isSubmitting}
              className="bg-[#c9a84c] text-[#0a1628] hover:bg-[#b59539] disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl px-12 py-4 rounded-xl shadow-md transition-all flex items-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin" />
                  <span>실측 세션 초기화 중...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>{executionType === 'live' ? 'AI 정규 실측 시작' : '규격 시뮬레이션 실행'}</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 text-gray-500 text-sm mt-4">
              <Clock className="w-4 h-4" />
              <span>
                {executionType === 'simulation'
                  ? '예상 소요시간: 약 3초 · 모의 5대 절 산출물 파이프라인 즉시 가동'
                  : `예상 소요시간: 약 ${Math.max(1, Math.round(estimatedSeconds / 60))}분 (총 ${30 * repetitions * activeProviderCount}회 실시간 질의)`}
              </span>
            </div>

            <p className="text-[11px] text-gray-400 mt-2 text-center">
              * 본 플랫폼은 행정구역 순위를 매기지 않으며(INV-3), 판정은 모형 개입 없이 오직 규칙(judged_by: rule)으로만 수행됩니다.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
