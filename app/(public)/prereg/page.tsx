import React from 'react';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  PlayCircle,
  Database,
  FileCheck2,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { getPopulationFrame, getRunProfileRegistry } from '@/lib/measurement/registries';
import { PANEL_5_UNITS, QUESTION_PANEL_COUNTS } from '@/lib/jeongdap';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '사전 등록 (Preregistrations) | 모두의 정답노트',
  description: '측정 결과를 공표하기 전 가설(H1~H5), 판정 기준, 반증 조건, 중단 규칙을 공개합니다. (INV-11)',
};

type PreregStatus = 'draft' | 'published' | 'running' | 'completed' | 'abandoned';

interface Preregistration {
  id: string;
  title: string;
  claim_id: string;
  hypothesis: string;
  method_version: string;
  method_summary: string;
  criteria: string;
  falsification: string;
  stop_rule: string;
  status: PreregStatus;
  published_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  outcome: string | null;
}

const jeongdapRound1Prereg: Preregistration = {
  id: 'prereg-2026-10-r1',
  title: '모두의 정답노트 1차 측정 사전 등록 — 5곳 기준 패널(550문항×9회) 및 주간 상시 관측',
  claim_id: 'C-12',
  hypothesis:
    'H1(반복 안정성): 9회 반복 블록 일치율 ≥ 0.80 · H2(출처 4단 병목): S2 < S1 및 S4 < S3 · H3(공급 공백 효과): 공급 공백 여부에 따른 S3 격차 ≥ 25%p · H4(위약 오탐): 공식 근거 없을 때 위약 오탐률 상승 · H5(정비 효과): 공식 문서 정비 후 +2주/+6주 S3 ≥ +20%p 상승',
  method_version: 'v1.0',
  method_summary:
    '기준 단위 5곳(구로구·수원시·화성시·청양군·완도군) 대상 패널 550문항(국가대표 100·생활행정 200·지역문화 200·위약 30·고정 20) × 3일 × 1일 3회(총 9회 반복), OpenAI Responses API(web_search, 시스템 프롬프트 없음) 및 정답 원장 대조',
  criteria:
    '출처 4단(S1 검색 후보 · S2 인용 · S3 첫 근거 · S4 내용 일치), 공급 공백·해당없음 분모 분리, 9회 중 최빈 판정 이탈 ≤ 2회 안정 기준, 사람 2인 독립 판정 κ ≥ 0.75',
  falsification:
    'H1: 9회 반복 블록 일치율 < 0.80 시 단일 시점 공표 보류 · H2: S1≈S2≈S3≈S4 동등 시 4단 분리 폐기 · H3: 공급 공백 S3 차이 < 10%p 시 이중 분모 폐기 · H4: 위약 오탐 총 0건 시 위약군 축소 · H5: 정비 사건 10건 이상 누적 후 S3 변화 < 5%p 시 정비 안내 효과 주장 철회',
  stop_rule:
    '5곳 기준 패널 9회 반복 수집 완료 및 사람 판정 대기열(고위험·보류·다름 후보·불안정) 전수 판정 완료 시점 (사람 판정자 간 κ < 0.70 또는 API 모델 예고 없는 교체 시 즉시 중단 및 재등록)',
  status: 'published',
  published_at: '2026-10-20T09:00:00+09:00',
  started_at: '2026-10-21T09:00:00+09:00',
  completed_at: null,
  outcome: null,
};

const fallbackData: Preregistration[] = [
  jeongdapRound1Prereg,
  {
    id: 'prereg-2026-c1',
    title: '전국 자치단체 및 특별구역 구 Layer 1 기술 접근성 기준선 측정 (보존 이력)',
    claim_id: 'C-1',
    hypothesis: '공공 도메인의 상당수가 AI 수집기에 닫혀 있거나 비정상 설정 상태이다',
    method_version: 'v1.0',
    method_summary: '243개 자치단체 및 A형 경제자유구역 대상 robots.txt 및 sitemap 주간 자동 스캔',
    criteria: 'open / blocked_all / blocked_selective / no_file / undetermined 5분 판정',
    falsification: '전수 조사 결과 blocked_* 및 undetermined 합계가 10% 미만일 때',
    stop_rule: '전수 도메인 스캔 2주 연속 완료 시점',
    status: 'published',
    published_at: '2026-09-05T09:00:00+09:00',
    started_at: '2026-09-06T09:00:00+09:00',
    completed_at: null,
    outcome: null,
  },
];

export default async function PreregistrationsPage() {
  const supabase = createClient();

  let preregistrations: Preregistration[] = [];
  try {
    const { data, error } = await supabase
      .from('preregistrations')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false });

    if (error) {
      preregistrations = fallbackData;
    } else if (data && data.length > 0) {
      const hasR1 = data.some((d: any) => d.id === jeongdapRound1Prereg.id || d.claim_id === 'C-12');
      preregistrations = hasR1
        ? (data as Preregistration[])
        : [jeongdapRound1Prereg, ...(data as Preregistration[])];
    } else {
      preregistrations = fallbackData;
    }
  } catch {
    preregistrations = fallbackData;
  }

  const getStatusBadge = (status: PreregStatus) => {
    switch (status) {
      case 'draft':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">작성 중</span>;
      case 'published':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">공개됨 (사전 등록 확정)</span>;
      case 'running':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">측정 진행 중</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">완료</span>;
      case 'abandoned':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">중단됨</span>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'yyyy-MM-dd HH:mm');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
          INV-11 PREREGISTRATION LEDGER · 사전 등록 원장
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy-950">
          측정 사전 등록 (Preregistrations)
        </h1>

        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">신뢰 원칙: 결과 공개 전 가설·반증 조건·중단 규칙 고정 (INV-11)</div>
            <p className="leading-relaxed">
              모두의 정답노트(Jeongdap Note)는 측정을 시작하기 전에 가설(H1~H5), 문항 구성, 판정 기준, <strong>반증 조건</strong>, 그리고 중단 규칙을 먼저 공개합니다.
              결과를 본 뒤에 유리한 숫자만 고르거나 반증 조건을 바꾸지 않으며, 가설이 기각되더라도 기각 사실 그대로 공표합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 1차 측정 고정 설계 요약 카드 */}
      <section className="bg-navy-950 text-white rounded-2xl p-6 sm:p-8 border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-mono text-gold-400 uppercase">ROUND 1 SPECIFICATION · 2026-10-20</span>
            <h2 className="text-xl font-black mt-0.5">1차 정밀 측정 고정 파라미터 요약</h2>
          </div>
          <span className="text-xs font-mono bg-gold-500/20 text-gold-300 px-3 py-1 rounded-full border border-gold-400/30">
            문항 {QUESTION_PANEL_COUNTS.total_panel}개 · 9회 반복 · 코어 {QUESTION_PANEL_COUNTS.core_60}개
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <span className="text-slate-400 font-semibold block">기준 단위 패널 (5곳)</span>
            <div className="text-white font-bold text-sm">
              {PANEL_5_UNITS.map((u) => u.name_ko).join(' · ')}
            </div>
            <p className="text-slate-400 text-[11px]">대도시 자치구 · 대도시 시 · 도농복합 · 내륙 군 · 도서 군 층화 표본</p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <span className="text-slate-400 font-semibold block">패널 550문항 구성</span>
            <div className="text-white font-bold text-sm">
              국가대표 {QUESTION_PANEL_COUNTS.national_rep} · 생활행정 {QUESTION_PANEL_COUNTS.living_admin} · 지역문화 {QUESTION_PANEL_COUNTS.local_culture}
            </div>
            <p className="text-slate-400 text-[11px]">
              + 위약(실재하지 않는 제도) {QUESTION_PANEL_COUNTS.placebo}문항 + 고정 비교 {QUESTION_PANEL_COUNTS.fixed}문항
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <span className="text-slate-400 font-semibold block">공표 약속 (D103 · ADR-0016)</span>
            <div className="text-white font-bold text-sm">
              가설 기각 여부와 무관하게 전문 공개
            </div>
            <p className="text-slate-400 text-[11px]">
              원시 집계·반증 결과·코드·정답 원장 URL을 재현 패키지로 공개 (AI 응답 원문 제외 · INV-6)
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {preregistrations.map((prereg) => (
          <div key={prereg.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  <span className="text-slate-400 mr-2">[{prereg.claim_id}]</span>
                  {prereg.title}
                </h2>
                <div className="text-xs text-slate-500 mt-1">ID: {prereg.id} • 방법론: {prereg.method_version}</div>
              </div>
              <div className="flex-shrink-0">{getStatusBadge(prereg.status)}</div>
            </div>

            <div className="p-5 space-y-6">
              <div className="flex flex-wrap gap-6 text-sm bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">사전 등록 공개일:</span>
                  <span className="font-medium">{formatDate(prereg.published_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">측정 시작일:</span>
                  <span className="font-medium">{formatDate(prereg.started_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">종료일:</span>
                  <span className="font-medium">{formatDate(prereg.completed_at)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                  <div>
                    <div className="font-semibold text-slate-900 mb-1">검증할 가설 (Hypotheses)</div>
                    <div className="text-slate-700 bg-slate-50 p-3 rounded leading-relaxed">{prereg.hypothesis}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 mb-1">측정 설계 요약</div>
                    <div className="text-slate-700 leading-relaxed">{prereg.method_summary}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="font-semibold text-slate-900 mb-1">판정 기준 (Criteria)</div>
                    <div className="text-slate-700 leading-relaxed">{prereg.criteria}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-rose-900 mb-1">반증 조건 (Falsification Conditions)</div>
                    <div className="text-rose-800 bg-rose-50 p-3 rounded border border-rose-100 leading-relaxed">
                      {prereg.falsification}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-sm">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-700">중단 및 종료 규칙 (Stopping Rule): </span>
                    <span className="text-slate-600">{prereg.stop_rule}</span>
                  </div>
                </div>
                {prereg.outcome && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-900">
                    <div className="font-bold mb-1">최종 결과</div>
                    <div>{prereg.outcome}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SSOT Registries 섹션 */}
      {(() => {
        let frameData: any = null;
        let profilesData: any = null;
        try {
          frameData = getPopulationFrame();
          profilesData = getRunProfileRegistry();
        } catch {}

        if (!frameData) return null;

        return (
          <section className="pt-8 border-t border-slate-200 space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-100 text-gold-800 text-xs font-bold uppercase">
                <Database className="w-3.5 h-3.5" />
                <span>SSOT Registries (INV-11 선행 등록부)</span>
              </div>
              <h2 className="text-2xl font-bold text-navy-950">
                측정 규격 등록부 (모집단 및 관측 프로필)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                측정 시작 전 사전에 고정된 전수 모집단 틀(Population Frame) 및 표준 관측 환경 정의입니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-navy-950 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    기초자치단체 전수 모집단 (spec/01)
                  </h3>
                  <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    rev.{frameData.revision}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block">등록 대상 기관</span>
                    <span className="font-bold text-slate-800 text-sm">{frameData.agency_count}개소 (전수)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">원장 기준일</span>
                    <span className="font-bold text-slate-800 text-sm font-mono">{frameData.reference_date}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                    근거: {frameData.source_authority} ({frameData.source_document})
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-navy-950 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#c9a84c]" />
                    표준 관측 프로필 (spec/02)
                  </h3>
                  <span className="font-mono bg-[#c9a84c]/20 text-[#0a1628] px-2 py-0.5 rounded font-bold">
                    RP-2026Q4-JEONGDAP
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block">수집 엔진/모형</span>
                    <span className="font-bold text-slate-800 text-sm font-mono">
                      {profilesData?.profiles?.[0]?.model_identifier || 'gpt-5 (web_search)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">반복 측정 회차</span>
                    <span className="font-bold text-slate-800 text-sm">
                      3일 × 1일 3회 = 9회 블록
                    </span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                    시스템 프롬프트 무주입 · 출처 4단(S1~S4) 자동 대조 및 사람 2인 검증
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}
    </div>
  );
}
