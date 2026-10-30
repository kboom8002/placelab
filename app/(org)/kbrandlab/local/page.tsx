'use client';

// app/(org)/kbrandlab/local/page.tsx
// 로컬레이다 (LocalRadar · 소상공인 AI 로컬 탐색 스캔) 메인 대시보드
// 근거: ADR-0025, PRD FR-93 ~ FR-96
// 불변식 준수:
// - INV-3: 가게 실명 비교 표는 가나다순·매장 코드순만 허용하며 서열 어휘를 쓰지 않는다.
// - INV-6: 응답 원문 대신 raw_hash 와 최소 인용구만 표시한다.
// - INV-9: 공식·플레이스 근거율과 헛걸음 위험 건수 두 지표를 항상 함께 표시한다.
// - INV-17: 공익 측정(모두의 정답노트)과 테이블·브랜드를 분리하고 스폰서십 공시 원칙을 명시한다.

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Radar,
  Store,
  AlertTriangle,
  CheckCircle2,
  Globe2,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Search,
  FileCheck2,
  ArrowLeft,
  Info,
  Clock,
  MapPin,
} from 'lucide-react';
import {
  buildNamedShopCohortTable,
  evaluateShopAllFacts,
  extractNamedShopsFromDiscoveryResponse,
  HIGH_RISK_FACT_DEFINITIONS,
  LOCAL_COHORTS,
  LOCAL_DISCOVERY_PROBES,
  LOCAL_LANGUAGES,
  LOCAL_RADAR_BRAND_NAME,
  LOCAL_RADAR_BRAND_NAME_EN,
  LOCAL_RADAR_METHOD_VERSION,
  LOCAL_RADAR_SUBTITLE,
  LOCAL_SHOPS,
  type LocalCohortId,
  type LocalLanguage,
  type LocalWindowState,
} from '@/lib/kbrandlab/local';

const COHORT_ORDER: readonly LocalCohortId[] = [
  'SEOGWIPO_STAY',
  'GANGNAM_SMB',
  'EUNPYEONG_LOCAL',
];

function windowStateBadgeClass(state: LocalWindowState): string {
  switch (state) {
    case '안정':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    case '신규':
      return 'bg-blue-50 text-blue-800 border-blue-300';
    case '가끔':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case '드묾':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    case '소멸':
      return 'bg-rose-50 text-rose-800 border-rose-300';
    default:
      return 'bg-slate-50 text-slate-400 border-slate-200';
  }
}

function windowStateSymbol(state: LocalWindowState): string {
  switch (state) {
    case '안정':
      return '●';
    case '신규':
      return '★';
    case '가끔':
      return '◐';
    case '드묾':
      return '○';
    case '소멸':
      return '▽';
    default:
      return '—';
  }
}

const SAMPLE_SIMULATION_TEXTS: Record<
  LocalCohortId,
  { text: string; searchUrls: string[]; citedUrls: string[] }
> = {
  SEOGWIPO_STAY: {
    text: '서귀포에서 조용히 머물기 좋은 숙소로는 안덕면의 동백숲독채스테이가 있으며, 우천 시에도 실내 다도 체험이 가능한 남원읍 감귤꽃다락과 보목동 서귀포파도소리차방, 하효감귤베이커리, 법환바당식탁 등이 여행객에게 자주 언급됩니다.',
    searchUrls: [
      'https://camelliastay-jeju.kr/booking',
      'https://gamgyulattic.kr/info',
      'https://badangtable.kr/hours',
      'https://hahyobakery.kr/menu',
    ],
    citedUrls: [
      'https://camelliastay-jeju.kr/booking',
      'https://gamgyulattic.kr/info',
      'https://place.map.kakao.com/sgw-badangtable',
    ],
  },
  GANGNAM_SMB: {
    text: '강남권에서 다국어 예약과 안내를 지원하는 곳으로는 신사동 도산온더스킨의원, 압구정글로우메디의원(진료시간 및 비급여 표 공식 게시), 청담동 청담루미에르헤어살롱, 삼성코어필라테스랩, 역삼동 테헤란아로마스파가 있습니다.',
    searchUrls: [
      'https://dosanontheskin.kr/appointment',
      'https://glowmediclinic.kr/hours',
      'https://lumierecheongdam.kr/reserve',
      'https://corepilateslab.kr/info',
    ],
    citedUrls: [
      'https://dosanontheskin.kr/appointment',
      'https://lumierecheongdam.kr/reserve',
      'https://place.map.kakao.com/gnm-glowmedi',
    ],
  },
  EUNPYEONG_LOCAL: {
    text: '서울 은평구에서는 북한산 전망의 은평한옥마을소나무빵집과 진관동 구파발나무공방결, 갈현동 연서시장손두부공방, 응암동 불광천독립책방새벽, 증산골목화덕피자 등이 지역 주민과 방문객에게 널리 알려져 있습니다.',
    searchUrls: [
      'https://pinebakery-hanok.kr/info',
      'https://yeonseotofu.kr/menu',
      'https://woodgyeol-ep.kr/class',
      'https://dawnbookshop-ep.kr/hours',
    ],
    citedUrls: [
      'https://pinebakery-hanok.kr/info',
      'https://yeonseotofu.kr/menu',
      'https://place.map.kakao.com/epg-woodgyeol',
    ],
  },
};

export default function LocalRadarDashboardPage() {
  const [selectedCohortId, setSelectedCohortId] = useState<LocalCohortId>('SEOGWIPO_STAY');
  const [sortBy, setSortBy] = useState<'name' | 'code'>('name');
  const [selectedLang, setSelectedLang] = useState<LocalLanguage>('ko');
  const [selectedShopId, setSelectedShopId] = useState<string>('shop-sgw-03');
  const [simResponseText, setSimResponseText] = useState<string>(
    SAMPLE_SIMULATION_TEXTS.SEOGWIPO_STAY.text,
  );

  const cohort = LOCAL_COHORTS[selectedCohortId];

  const namedShopRows = useMemo(
    () =>
      buildNamedShopCohortTable({
        cohortId: selectedCohortId,
        sortBy,
      }),
    [selectedCohortId, sortBy],
  );

  const cohortShops = useMemo(
    () => LOCAL_SHOPS.filter((s) => s.cohortId === selectedCohortId),
    [selectedCohortId],
  );

  const activeShop = useMemo(
    () =>
      cohortShops.find((s) => s.shopId === selectedShopId) ?? cohortShops[0],
    [cohortShops, selectedShopId],
  );

  const activeShopEvaluations = useMemo(
    () => evaluateShopAllFacts(activeShop),
    [activeShop],
  );

  const cohortProbes = useMemo(
    () => LOCAL_DISCOVERY_PROBES.filter((p) => p.cohortId === selectedCohortId),
    [selectedCohortId],
  );

  const liveSimMatches = useMemo(() => {
    const sample = SAMPLE_SIMULATION_TEXTS[selectedCohortId];
    return extractNamedShopsFromDiscoveryResponse({
      cohortId: selectedCohortId,
      responseText: simResponseText,
      searchUrls: sample.searchUrls,
      citedUrls: sample.citedUrls,
    });
  }, [selectedCohortId, simResponseText]);

  const handleCohortChange = (nextCohortId: LocalCohortId) => {
    setSelectedCohortId(nextCohortId);
    const firstShop = LOCAL_SHOPS.find((s) => s.cohortId === nextCohortId);
    if (firstShop) setSelectedShopId(firstShop.shopId);
    setSimResponseText(SAMPLE_SIMULATION_TEXTS[nextCohortId].text);
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between">
          <Link
            href="/kbrandlab"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            K-Brand Lab 프로젝트 홈으로 돌아가기
          </Link>
          <span className="text-xs font-mono text-slate-500">
            2026-10-17 기준, 방법론 {LOCAL_RADAR_METHOD_VERSION} 으로 측정
          </span>
        </div>

        {/* 헤더 배너 */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl border border-white/10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                <Radar className="w-3.5 h-3.5" />
                {LOCAL_RADAR_BRAND_NAME} ({LOCAL_RADAR_BRAND_NAME_EN}) · {LOCAL_RADAR_SUBTITLE}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                우리 동네 소비자의 AI 로컬 탐색 질문에서<br />
                가게 실명 등장 상태와 헛걸음 위험 5항목을 스캔합니다
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                상권 코호트 공유 탐색 스캔(Layer A)으로 4개 국어 AI 로컬 탐색 질문에서의 <strong>가게 실명 등장 추이(4주 12회 창 상태)</strong>를 확인하고,
                매장 영업 정본 스캔(Layer B)으로 <strong>영업시간·휴무·가격·예약·주차 오답으로 인한 손님 헛걸음 위험</strong>을 잡아냅니다.
              </p>
            </div>

            {/* 요금 및 단위 경제학 박스 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 min-w-[260px] space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>권역 코호트 구독 (Basic)</span>
                <span className="font-bold text-white text-sm">
                  월 {cohort.monthlyPriceKrw.toLocaleString()}원
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>정본 20항목 정밀팩 (Pro)</span>
                <span className="font-bold text-amber-300 text-sm">
                  월 {cohort.precisionPackPriceKrw.toLocaleString()}원
                </span>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400 space-y-1">
                <div>· 코호트 1:N 공유 스캔으로 매장당 API 원가 $0.65/월</div>
                <div>· 향후 공기업·지역재단 상권 스폰서십 연계 가능 (공시 의무)</div>
              </div>
              <div className="pt-2">
                <Link
                  href="/kbrandlab/local/onboarding"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-colors"
                >
                  <span>10분 자가 정본 등록 & JSON-LD 생성 →</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 3대 상권 코호트 선택 탭 (서귀포 · 강남 · 은평구) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-7 pt-6 border-t border-white/10">
            {COHORT_ORDER.map((cid) => {
              const item = LOCAL_COHORTS[cid];
              const isSelected = cid === selectedCohortId;
              return (
                <button
                  key={cid}
                  type="button"
                  onClick={() => handleCohortChange(cid)}
                  className={`text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-300">
                      {item.regionLabel}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-slate-200">
                      등록 5곳
                    </span>
                  </div>
                  <div className="font-bold text-base mt-1">{item.name}</div>
                  <div className="text-xs text-slate-300 mt-1">{item.sectorLabel}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 방화벽 및 스폰서십·법무 공시 안내 바 */}
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">[상업 트랙 방화벽 및 공시 원칙 · ADR-0025]</span>{' '}
              {cohort.disclosureNote} 무엇이 막고 있는지(또는 왜 틀렸는지의 내부 원인)는 이 측정으로 확정하지 않으며, 재난·안전 문항은 공개 지표에서 제외합니다.
            </div>
          </div>
          <Link
            href="/disclosure"
            className="shrink-0 font-bold text-amber-800 underline hover:text-amber-950"
          >
            이해관계 공시 보기 →
          </Link>
        </div>

        {/* 섹션 1: 코호트 내 가게 실명 탐색 스캔 비교표 (Layer A — 가게 이름까지 표시, 무순위 가나다순) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <Store className="w-4 h-4" />
                Layer A · 상권 코호트 공유 탐색 스캔 (등록한 {namedShopRows.length}곳 중)
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {cohort.name} — 가게 실명별 4개 국어 등장 창 상태 & 정본 대조 현황
              </h2>
              <p className="text-xs text-slate-500">
                소비자 로컬 탐색 질문에 대해 코호트 내 각 가게 실명이 최근 4주(12회) 동안 등장한 상태와 고위험 영업 사실 5항목 대조 결과입니다. 서열을 매기지 않고 가나다순·매장 코드순으로만 표시합니다.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500 font-medium">정렬 기준:</span>
              <button
                type="button"
                onClick={() => setSortBy('name')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  sortBy === 'name'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                가나다순 (기본)
              </button>
              <button
                type="button"
                onClick={() => setSortBy('code')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  sortBy === 'code'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                매장 코드순
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs">
                  <th className="py-3.5 px-4 font-bold">가게 실명 (행정동 · 업종)</th>
                  <th className="py-3.5 px-3 font-bold text-center">한국어 (KO)</th>
                  <th className="py-3.5 px-3 font-bold text-center">English (EN)</th>
                  <th className="py-3.5 px-3 font-bold text-center">日本語 (JA)</th>
                  <th className="py-3.5 px-3 font-bold text-center">简体中文 (ZH)</th>
                  <th className="py-3.5 px-3 font-bold text-center">출처 4단 도달</th>
                  <th className="py-3.5 px-3 font-bold text-center">공식·플레이스 근거율</th>
                  <th className="py-3.5 px-3 font-bold text-center">헛걸음 위험 건수</th>
                  <th className="py-3.5 px-3 font-bold text-center">예약·길찾기 연결</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {namedShopRows.map((row) => {
                  const isSelected = row.shopId === activeShop.shopId;
                  return (
                    <tr
                      key={row.shopId}
                      onClick={() => setSelectedShopId(row.shopId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-400">
                            {row.shopCode}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            {row.shopName}
                          </span>
                          {row.isMedicalRegulated && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                              의료법 준수 트랙
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {row.neighborhood} · {row.category}
                        </div>
                      </td>

                      {(['ko', 'en', 'ja', 'zh-Hans'] as const).map((lang) => {
                        const st = row.windowStateByLang[lang];
                        return (
                          <td key={lang} className="py-4 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${windowStateBadgeClass(
                                st,
                              )}`}
                            >
                              <span>{windowStateSymbol(st)}</span>
                              <span>{st}</span>
                            </span>
                          </td>
                        );
                      })}

                      <td className="py-4 px-3 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono text-xs font-bold">
                          {row.highestStageReached === 'S4'
                            ? '4단 (내용이 맞음)'
                            : row.highestStageReached === 'S3'
                              ? '3단 (첫 근거가 됨)'
                              : row.highestStageReached === 'S2'
                                ? '2단 (AI가 읽음)'
                                : row.highestStageReached === 'S1'
                                  ? '1단 (검색에 뜸)'
                                  : '미도달'}
                        </span>
                      </td>

                      <td className="py-4 px-3 text-center">
                        <span className="font-bold text-slate-900">
                          {row.officialOrPlaceCitationRatePct}%
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          ({row.totalHighRiskFacts}항목 기준)
                        </span>
                      </td>

                      <td className="py-4 px-3 text-center">
                        {row.walkAwayRiskCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-300 text-xs font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            위험 {row.walkAwayRiskCount}건 / {row.totalHighRiskFacts}항목
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            0건 / {row.totalHighRiskFacts}항목
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-3 text-center">
                        {row.bookingConnected ? (
                          <span className="text-xs font-bold text-emerald-700">
                            ● 예약·플레이스 연결
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">
                            ○ 링크 미연결
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
            <div>
              <strong>4주 12회 창 상태 기준 (ADR-0024):</strong>{' '}
              <span className="mr-2">● 안정(12회 중 9회 이상 등장)</span>
              <span className="mr-2">★ 신규(전반 6회 0회 → 후반 6회 3회 이상)</span>
              <span className="mr-2">◐ 가끔(4~8회 등장)</span>
              <span className="mr-2">○ 드묾(1~3회 등장)</span>
              <span>▽ 소멸(전반 3회 이상 → 후반 0회)</span>
            </div>
            <div className="text-slate-500">
              행(가게 실명)을 클릭하면 아래 Layer B 매장별 5대 영업 정본 스캔 상세가 전환됩니다.
            </div>
          </div>
        </div>

        {/* 섹션 2: Layer B 개별 매장 헛걸음 위험 5항목 정본 스캔 상세 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700">
                <FileCheck2 className="w-4 h-4" />
                Layer B · 매장별 고위험 영업 사실 5항목 정본 스캔 (1:1 Precision)
              </div>
              <h2 className="text-xl font-black text-slate-900">
                「{activeShop.shopName}」 ({activeShop.neighborhood}) — 손님 헛걸음 위험 5항목 진단
              </h2>
              <p className="text-xs text-slate-500">
                정본 도메인: <code className="font-mono text-slate-700">{activeShop.canonicalDomain}</code> ·
                플레이스: <code className="font-mono text-slate-700">{activeShop.placeUrl}</code>
              </p>
            </div>

            {/* 코호트 내 매장 빠른 전환 버튼 */}
            <div className="flex flex-wrap gap-1.5">
              {cohortShops.map((shop) => (
                <button
                  key={shop.shopId}
                  type="button"
                  onClick={() => setSelectedShopId(shop.shopId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    shop.shopId === activeShop.shopId
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {shop.shopName}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {activeShopEvaluations.map((ev) => (
              <div
                key={ev.factKey}
                className={`rounded-2xl border p-5 space-y-3 ${
                  ev.walkAwayRisk
                    ? 'bg-rose-50/40 border-rose-300'
                    : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800">
                      {ev.factLabel}
                    </span>
                    {ev.walkAwayRisk ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                        ▲ 손님 헛걸음 위험 감지 (구버전 블로그/외부 출처 오안내)
                      </span>
                    ) : ev.s4Verdict === 'matched' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        ● 정본 일치 (헛걸음 위험 없음)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                        <Info className="w-3.5 h-3.5 text-amber-700" />
                        ◆ 공식 근거 미인용 (공급 공백 · 정본 페이지 보강 권장)
                      </span>
                    )}
                  </div>

                  {/* 출처 4단 파이프라인 표시 */}
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        ev.s1InSearch
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      1단 검색에 뜸 {ev.s1InSearch ? '✓' : '✕'}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        ev.s2Cited
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      2단 AI가 읽음 {ev.s2Cited ? '✓' : '✕'}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        ev.s3FirstCited
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      3단 첫 근거가 됨 {ev.s3FirstCited ? '✓' : '✕'}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        ev.s4Verdict === 'matched'
                          ? 'bg-emerald-600 text-white'
                          : ev.s4Verdict === 'wrong'
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-white'
                      }`}
                    >
                      4단 내용이 맞음 ({ev.s4Verdict})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-white rounded-xl p-3.5 border border-slate-200">
                    <span className="font-bold text-slate-500 block mb-1">
                      점주 확인 정본 (Ground Truth)
                    </span>
                    <p className="text-slate-900 font-medium">{ev.canonicalValue}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3.5 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-500">
                        최소 인용구 요약 (INV-6 원문 미노출)
                      </span>
                      <code className="text-[10px] font-mono text-slate-400">
                        {ev.rawHash}
                      </code>
                    </div>
                    <p className="text-slate-700">{ev.minimalQuote}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 섹션 3: 코호트 공유 소비자 탐색 질문 (4개 국어) & 실시간 가게 실명 스캔 시뮬레이터 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 좌측: 4개 국어 공유 소비자 탐색 질문 */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-purple-700 flex items-center gap-1">
                  <Globe2 className="w-4 h-4" />
                  다국어 소비자 로컬 탐색 질문 세트
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  {cohort.regionLabel} 공유 탐색 프로브
                </h3>
              </div>

              <div className="flex gap-1">
                {LOCAL_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setSelectedLang(l.code)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      selectedLang === l.code
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {l.code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {cohortProbes.map((probe) => (
                <div
                  key={probe.probeId}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-700">
                      {probe.intentCategory}
                    </span>
                    <span className="font-mono text-slate-400">{probe.probeId}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    “{probe.questions[selectedLang]}”
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 우측: 실시간 가게 실명 탐색 스캔 시뮬레이터 */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                <Search className="w-4 h-4" />
                가게 실명 추출 엔진 (shop-matcher.ts) 즉시 검증
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                AI 탐색 응답 → 코호트 내 가게 실명 & 출처 단계 자동 추출
              </h3>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="sim-response-textarea"
                className="block text-xs font-bold text-slate-700"
              >
                시뮬레이션 AI 로컬 탐색 응답 텍스트 (수정하여 즉시 테스트 가능)
              </label>
              <textarea
                id="sim-response-textarea"
                rows={4}
                value={simResponseText}
                onChange={(e) => setSimResponseText(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 p-3.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  추출된 코호트 가게 실명 ({liveSimMatches.length}곳 · 가나다순 무순위)
                </span>
                <span className="text-slate-400">±20자 지역 문맥 동명이인 검증 적용</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {liveSimMatches.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 text-center">
                    응답에 등장한 코호트 등록 매장이 없습니다.
                  </div>
                ) : (
                  liveSimMatches.map((m) => (
                    <div
                      key={m.shopId}
                      className="p-3 bg-slate-50/70 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono text-slate-400 mr-2">
                          {m.shopCode}
                        </span>
                        <span className="font-bold text-slate-900">
                          {m.shopName}
                        </span>
                        <span className="text-slate-500 ml-2">
                          (매칭어: “{m.matchedTerm}”)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold ${
                            m.s1InSearch
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          S1 {m.s1InSearch ? '✓' : '✕'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-semibold ${
                            m.s2Cited
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          S2 {m.s2Cited ? '✓' : '✕'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-semibold ${
                            m.s3FirstCited
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          S3 {m.s3FirstCited ? '✓' : '✕'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
