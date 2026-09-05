import React from 'react';
import { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: '증거 대장 | K-PlaceLab',
  description: 'K-PlaceLab이 주장하는 사실과 증명 상태를 공개합니다. (INV-12)',
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
];

export default function EvidencePage() {
  const getBadgeColor = (status: Status) => {
    switch (status) {
      case '미검증':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case '파일럿':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case '검증됨':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">증거 대장 (Claims Registry)</h1>
        
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">투명성 원칙 (INV-12)</div>
            <p className="leading-relaxed">
              공개 문서, 영업 자료, 발표에 쓰이는 모든 사실적 주장은 이 대장에 등록되어야 합니다. 
              우리는 아직 증명하지 못한 것의 목록을 공개하며, 이를 투명하게 추적합니다.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {claims.map((claim) => (
          <div key={claim.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">
                <span className="text-slate-400 mr-2">{claim.id}</span>
                {claim.title}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeColor(claim.status)}`}>
                {claim.status}
              </span>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <div className="font-semibold text-slate-900 mb-1">현재 근거</div>
                <div className="text-slate-700">{claim.evidence}</div>
              </div>
              <div className="bg-rose-50 rounded-lg p-3 border border-rose-100">
                <div className="font-semibold text-rose-900 mb-1">반증 조건 (Falsification)</div>
                <div className="text-rose-800">{claim.falsification}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-900 mb-1">다음 단계</div>
                <div className="text-slate-700">{claim.nextStep}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
