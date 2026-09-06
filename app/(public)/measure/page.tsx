'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Zap, Microscope, Check, Users, Settings } from 'lucide-react';
import clsx from 'clsx';

const EXAMPLE_UNITS = [
  { id: 'lg-41110', name: '수원특례시', population: 'local_gov', region: '경기도' },
  { id: 'lg-41130', name: '성남시', population: 'local_gov', region: '경기도' },
  { id: 'lg-41170', name: '용인특례시', population: 'local_gov', region: '경기도' },
  { id: 'lg-41190', name: '고양특례시', population: 'local_gov', region: '경기도' },
  { id: 'lg-26110', name: '부산 중구', population: 'local_gov', region: '부산광역시' },
  { id: 'lg-11680', name: '강남구', population: 'special_zone', region: '서울특별시' },
  { id: 'lg-11740', name: '강동구', population: 'special_zone', region: '서울특별시' },
  { id: 'lg-28110', name: '인천 중구', population: 'local_gov', region: '인천광역시' },
  { id: 'lg-43110', name: '청주시', population: 'local_gov', region: '충청북도' },
  { id: 'lg-44130', name: '천안시', population: 'local_gov', region: '충청남도' },
  { id: 'lg-46110', name: '목포시', population: 'local_gov', region: '전라남도' },
  { id: 'lg-48170', name: '창원특례시', population: 'local_gov', region: '경상남도' },
];

const PERSONAS = [
  { id: 'P1', label: '20대 청년' },
  { id: 'P2', label: '30대 학부모' },
  { id: 'P3', label: '50대 전입자' },
  { id: 'P4', label: '70대 어르신' },
  { id: 'P5', label: '외국인' },
  { id: 'P6', label: '소상공인' },
];

export default function MeasurePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<typeof EXAMPLE_UNITS[0] | null>(null);
  const [mode, setMode] = useState<'quick' | 'complete'>('quick');
  const [compare, setCompare] = useState(false);
  const [selectedPersonas, setSelectedPersonas] = useState<Set<string>>(new Set(PERSONAS.map(p => p.id)));
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredUnits = useMemo(() => {
    if (!search) return EXAMPLE_UNITS;
    return EXAMPLE_UNITS.filter(u => u.name.includes(search) || u.region.includes(search));
  }, [search]);

  const togglePersona = (id: string) => {
    const next = new Set(selectedPersonas);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPersonas(next);
  };

  const handleStart = () => {
    if (!selectedUnit) return;
    router.push(`/measure/demo-${selectedUnit.id}`);
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#0a1628] font-sans">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">AI 응답 품질 측정</h1>
          <p className="text-lg text-gray-600">지자체의 정책, 복지, 행정 정보가 AI를 통해 얼마나 정확하게 전달되는지 측정합니다.</p>
        </header>

        <div className="space-y-8">
          {/* Step 1 */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#0a1628] text-[#c9a84c] flex items-center justify-center font-bold">1</div>
              <h2 className="text-2xl font-bold">측정 대상 선택</h2>
            </div>
            
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="지자체 이름 검색 (예: 수원시, 강남구)"
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
                    filteredUnits.map(unit => (
                      <button
                        key={unit.id}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between"
                        onClick={() => {
                          setSelectedUnit(unit);
                          setSearch(unit.name);
                          setShowDropdown(false);
                        }}
                      >
                        <span className="font-medium">{unit.name}</span>
                        <span className="text-sm text-gray-500">{unit.region}</span>
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
                <span className="text-sm text-gray-500">선택됨:</span>
                <span className="font-bold text-[#0a1628] bg-white px-3 py-1 rounded-md border border-[#c9a84c] text-sm">
                  {selectedUnit.region} {selectedUnit.name}
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

          {/* Step 2 */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#0a1628] text-[#c9a84c] flex items-center justify-center font-bold">2</div>
              <h2 className="text-2xl font-bold">측정 모드</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => { setMode('quick'); setCompare(false); }}
                className={clsx(
                  "p-6 rounded-xl border-2 text-left transition-all",
                  mode === 'quick' ? "border-[#c9a84c] bg-[#c9a84c]/5" : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Zap className={clsx("w-6 h-6", mode === 'quick' ? "text-[#c9a84c]" : "text-gray-400")} />
                  <h3 className="text-xl font-bold">퀵 모드</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">빠른 현황 파악을 위한 기본 측정</p>
                <ul className="text-sm space-y-1 text-gray-500">
                  <li>• OpenAI 단일 모델</li>
                  <li>• 35문항 × 1회 측정</li>
                  <li>• 소요시간: ~2분</li>
                </ul>
              </button>

              <button
                onClick={() => setMode('complete')}
                className={clsx(
                  "p-6 rounded-xl border-2 text-left transition-all",
                  mode === 'complete' ? "border-[#c9a84c] bg-[#c9a84c]/5" : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Microscope className={clsx("w-6 h-6", mode === 'complete' ? "text-[#c9a84c]" : "text-gray-400")} />
                  <h3 className="text-xl font-bold">완전 모드</h3>
                  <span className="text-xs bg-[#0a1628] text-white px-2 py-1 rounded-full">탐색적</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">심층 분석 및 교차 검증을 위한 정밀 측정</p>
                <ul className="text-sm space-y-1 text-gray-500">
                  <li>• ChatGPT + Gemini + Perplexity</li>
                  <li>• 35문항 × 5회 반복 (Robustness)</li>
                  <li>• 소요시간: ~10분</li>
                </ul>
              </button>
            </div>
          </section>

          {/* Step 3 */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#0a1628] text-[#c9a84c] flex items-center justify-center font-bold">3</div>
              <h2 className="text-2xl font-bold">상세 옵션</h2>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <h3 className="font-bold text-lg">경쟁지역 비교</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={compare}
                      disabled={mode === 'quick'}
                      onChange={(e) => setCompare(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0a1628] peer-disabled:opacity-50"></div>
                  </label>
                </div>
                <p className="text-sm text-gray-500 ml-7">
                  {mode === 'quick' 
                    ? "완전 모드에서만 사용할 수 있습니다." 
                    : (compare ? "인구 유사 3곳이 익명으로 함께 측정됩니다." : "단일 지자체만 측정합니다.")}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <h3 className="font-bold text-lg">페르소나 필터</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 ml-7">
                  {PERSONAS.map(p => {
                    const isSelected = selectedPersonas.has(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePersona(p.id)}
                        className={clsx(
                          "flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-all",
                          isSelected ? "bg-[#0a1628] text-white border-[#0a1628]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        <div className={clsx(
                          "w-4 h-4 rounded-full flex items-center justify-center border",
                          isSelected ? "border-white bg-[#c9a84c]" : "border-gray-300"
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-[#0a1628]" />}
                        </div>
                        {p.id} {p.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Step 4 */}
          <div className="flex flex-col items-center mt-8">
            <button
              onClick={handleStart}
              disabled={!selectedUnit}
              className="bg-[#c9a84c] text-[#0a1628] hover:bg-[#b59539] disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl px-12 py-4 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              측정 시작
            </button>
            <p className="text-gray-500 text-sm mt-4">
              예상 소요시간: {mode === 'quick' ? '~2분' : '~10분'} (총 {mode === 'quick' ? '35' : '175'}회 쿼리 발생)
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
