// app/(public)/evidence/page.tsx
// FR-43: 증거 대장 (INV-12)
import React from 'react';
import type { Metadata } from 'next';
import { SourceNote } from '@/components/ui/SourceNote';
import { FileCheck2, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: '증거 대장 (Claims Registry) — kplacelab',
  description: 'kplacelab이 주장하는 모든 사실적 명제, 현재 근거, 반증 조건(Falsification) 등록부 (INV-12)',
};

type Status = '미검증' | '파일럿' | '검증됨';

interface Claim {
  id: string;
  title: string;
  status: Status;
  evidence: string;
  falsification: string;
  nextStep: string;
}

const claims: Claim[] = [
  {
    id: 'C-1',
    title: '공공 도메인의 상당수가 AI 수집기에 닫혀 있다',
    status: '파일럿',
    evidence: '2026-09-05 경제자유구역 9곳 예비 조사 — 정상 판정 3곳, 차단 1곳, 판정 불가 3곳 (K09)',
    falsification: '전수에서 blocked_* + undetermined 합계가 10% 미만',
    nextStep: 'T0 전수 스캔 (ADR-0008)',
  },
  {
    id: 'C-2',
    title: 'AI 응답 부정확이 실제 행정 문제를 만든다',
    status: '미검증',
    evidence: '없음',
    falsification: '오답률 상위 주제와 민원 발생 상위 주제 사이에 관련이 확인되지 않음',
    nextStep: '민원 통계를 대조할 지자체 1곳 확보 (FR-41)',
  },
  {
    id: 'C-3',
    title: '우리 문항은 지자체 간 차이를 잰다 (프롬프트 아티팩트가 아니다)',
    status: '미검증',
    evidence: '없음. v1.0 문항 20종은 강건성 검사를 받은 적이 없다',
    falsification: '20문항 중 절반 이상이 민감 문항',
    nextStep: '사전 등록 후 파일럿 (ADR-0009)',
  },
  {
    id: 'C-4',
    title: '정본 정비가 AI 응답을 개선한다',
    status: '미검증',
    evidence: '없음',
    falsification: '조치 단위의 변화가 대조군 평균 변화와 구분되지 않음',
    nextStep: 'P1 계약 1건에서 개입 전후 측정',
  },
  {
    id: 'C-5',
    title: '지자체는 이 측정에 예산을 쓴다',
    status: '파일럿',
    evidence: '증평군 시민AI기자단 확정 1건 — 다만 측정 상품이 아니라 P3 교육·운영 사업',
    falsification: '무료 이용은 발생하나 6개월간 유상 전환 0건',
    nextStep: 'T0 전수 공표 후 리드 추적',
  },
  {
    id: 'C-6',
    title: '우리 측정이 인용된다',
    status: '미검증',
    evidence: '없음',
    falsification: '첫 공표 후 3개월간 외부 인용 0건',
    nextStep: '인용 가이드(FR-9) 동시 배포, 인용 모니터링 가동',
  },
  {
    id: 'C-7',
    title: '방법론이 제3자 검증을 통과한다',
    status: '미검증',
    evidence: '없음. 학회·NIA 접촉 0건',
    falsification: '심사에서 방법론 결함이 지적되고 수정으로 해소되지 않음',
    nextStep: '사전 등록 공개 → 파일럿 결과 발표',
  },
  {
    id: 'C-8',
    title: 'Layer 1이 AI 응답 품질과 관련이 있다',
    status: '미검증',
    evidence: '없음',
    falsification: '두 값 사이에 관련이 확인되지 않음',
    nextStep: '참여 단위 50곳 확보 후',
  },
  {
    id: 'C-9',
    title: '인구감소지역이 AI 응답에서 더 불리하다',
    status: '미검증',
    evidence: '없음',
    falsification: '두 집단 사이에 차이가 확인되지 않거나 반대 방향',
    nextStep: 'T0 전수 스캔 후',
  },
  {
    id: 'C-10',
    title: '취약계층 관련 행정정보의 AI 응답 정확도가 다른 분야보다 낮다',
    status: '미검증',
    evidence: '없음',
    falsification: '두 집단 사이에 차이가 확인되지 않거나 반대 방향',
    nextStep: 'K16 태깅 완료 후 사전 등록',
  },
  {
    id: 'C-11',
    title: '또래 지원이 취약계층의 AI 정보 검증 행동을 늘린다',
    status: '미검증',
    evidence: '없음',
    falsification: '도움받은 집단과 대조군 사이에 차이가 확인되지 않음',
    nextStep: '효과 주장 전 측정 설계 검토 필수',
  },
];

export default function EvidencePage() {
  const unverifiedCount = claims.filter((c) => c.status === '미검증').length;
  const pilotCount = claims.filter((c) => c.status === '파일럿').length;
  const verifiedCount = claims.filter((c) => c.status === '검증됨').length;

  const getBadgeStyle = (status: Status) => {
    switch (status) {
      case '미검증':
        return 'bg-amber-50 text-amber-800 border-amber-200/80';
      case '파일럿':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case '검증됨':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-12">
      {/* 상단 헤더 */}
      <div className="space-y-4 border-b border-slate-200/80 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
          <FileCheck2 className="w-3.5 h-3.5 text-gold-400" />
          FALSIFIABLE CLAIMS REGISTRY · INV-12
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-navy-950 tracking-tight leading-tight">
          증거 대장 (Claims Registry)
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
          kplacelab의 모든 대외 주장, 연구 가설, 사업 제안의 사실 명제는 이 대장에 사전 등록되어 있어야 합니다.
          우리는 아직 증명되지 않은 것을 확정처럼 말하지 않으며, 반증 조건(Falsification)을 먼저 공개합니다.
        </p>

        {/* 상태 요약 칩 */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-100 text-slate-700">
            총 주장: <strong className="text-navy-950">{claims.length}</strong>건
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60">
            미검증: <strong>{unverifiedCount}</strong>건
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
            파일럿: <strong>{pilotCount}</strong>건
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            검증됨: <strong>{verifiedCount}</strong>건
          </span>
        </div>
      </div>

      {/* 불변식 안내 박스 */}
      <div className="p-5 rounded-2xl bg-slate-100/80 border border-slate-200 text-slate-800 text-xs sm:text-sm flex items-start gap-3.5 shadow-sm">
        <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-navy-950">INV-12: 대장에 없는 주장을 쓰지 않는다</div>
          <p className="text-slate-600 leading-relaxed text-xs">
            대장에 등록되지 않은 주장을 UI 문구, 보고서 템플릿, 언론 보도에 인용하는 것은 코드 리뷰 단계에서 반려됩니다.
            결과를 본 뒤 반증 조건을 수정하지 않으며, 수정 시에는 새로운 사전 등록 번호로 이력을 분리합니다.
          </p>
        </div>
      </div>

      {/* 11개 주장 카드 목록 */}
      <div className="space-y-5">
        {claims.map((claim) => (
          <div
            key={claim.id}
            className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-editorial hover:shadow-editorial-hover transition-all"
          >
            {/* 카드 헤더 */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-navy-950 text-white shadow-sm">
                  {claim.id}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-navy-950">{claim.title}</h2>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(
                  claim.status
                )}`}
              >
                {claim.status}
              </span>
            </div>

            {/* 카드 바디 */}
            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  현재 근거 (Evidence)
                </span>
                <p className="text-slate-700 leading-relaxed">{claim.evidence}</p>
              </div>

              {/* 반증 조건 박스 */}
              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/70 space-y-1">
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                  반증 조건 (Falsification Criteria)
                </span>
                <p className="text-rose-950 font-medium leading-relaxed">{claim.falsification}</p>
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  다음 단계 (Next Step)
                </span>
                <p className="text-navy-900 font-semibold">{claim.nextStep}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 하단 출처 표기 */}
      <SourceNote
        date="2026-09-05"
        sourceText="kplacelab EVIDENCE.md 원본 대장 및 ADR-0009 사전 등록 의사결정"
      />
    </div>
  );
}
