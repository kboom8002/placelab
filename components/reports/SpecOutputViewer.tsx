'use client';
// components/reports/SpecOutputViewer.tsx
// docs/measurement-spec 규격 산출물(Output) 5대 절 렌더링 뷰어
// 절 순서는 규격이 강제하며 컴포넌트에서도 변경 불가:
// 1. 정본 부재 영역과 그 귀속  2. 서술형 개체의 실재·등록 상태
// 3. 무응답 귀책 분포  4. 공적 출처가 근거로 쓰인 정도
// 5. 여건 고정 후 잔여 폭

import React, { useState } from 'react';
import {
  AlertTriangle,
  FileSearch,
  ShieldAlert,
  ExternalLink,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import type { Output, OutputSection, SectionKind } from '@/lib/types/measurement-spec';

// ── 절 메타데이터 ────────────────────────────────────────────

interface SectionMeta {
  kind: SectionKind;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string; // tailwind bg color
}

const SECTION_META: SectionMeta[] = [
  {
    kind: 'canon_absence_and_ownership',
    title: '정본 부재 영역과 그 귀속',
    subtitle: '공적 주체 어디에서도 발행하지 않은 정보',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'bg-amber-50 border-amber-200',
  },
  {
    kind: 'entity_existence',
    title: '서술형 개체의 실재·등록 상태',
    subtitle: '관광지·시설·제도 등 고유명사의 공식 발행 여부',
    icon: <FileSearch className="h-5 w-5" />,
    color: 'bg-blue-50 border-blue-200',
  },
  {
    kind: 'nonresponse_distribution',
    title: '무응답 귀책 분포',
    subtitle: '답이 나오지 않은 이유의 분류 (N1~N5)',
    icon: <ShieldAlert className="h-5 w-5" />,
    color: 'bg-rose-50 border-rose-200',
  },
  {
    kind: 'public_source_citation',
    title: '공적 출처가 근거로 쓰인 정도',
    subtitle: 'AI 답변이 공적 출처를 인용한 비율',
    icon: <ExternalLink className="h-5 w-5" />,
    color: 'bg-emerald-50 border-emerald-200',
  },
  {
    kind: 'residual_spread',
    title: '여건 고정 후 잔여 폭',
    subtitle: '인구·지역 등 여건을 통제한 뒤 남는 차이',
    icon: <BarChart3 className="h-5 w-5" />,
    color: 'bg-violet-50 border-violet-200',
  },
];

// ── 무응답 귀책 코드 한글 레이블 ─────────────────────────────

const NONRESPONSE_LABELS: Record<string, string> = {
  N1: '기술 차단 — robots.txt 또는 방화벽에 의한 접근 불가',
  N2: '내용 부재 — 해당 정보가 어디에도 없음',
  N3: '형식 미비 — PDF/이미지 등 기계 판독 불가 형식',
  N4: '경쟁 배제 — 입찰/영업비밀 등 비공개 사유',
  N5: '엔진 회피 — AI 서비스가 응답을 거부함',
};

// ── 개별 절 렌더러 ───────────────────────────────────────────

function SectionCanonAbsence({ items }: { items: any[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">정본 부재 문항이 없습니다.</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((item: any, i: number) => (
        <div key={i} className="flex items-start gap-3 rounded-lg bg-amber-50/50 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <span className="font-medium text-gray-800">{item.question_id}</span>
            {item.ownership && (
              <span className="ml-2 text-xs text-gray-500">
                귀속: {item.ownership.owner_role} ({item.ownership.tier})
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionEntityExistence({ items }: { items: any[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">확인된 서술형 개체가 없습니다.</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((item: any, i: number) => (
        <div key={i} className="flex items-start gap-3 rounded-lg bg-blue-50/50 p-3 text-sm">
          <FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div>
            <span className="font-medium text-gray-800">{item.question_id}</span>
            {item.published_roles && (
              <span className="ml-2 text-xs text-gray-500">
                발행 주체: {item.published_roles.join(', ')}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionNonresponse({ items }: { items: any[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">무응답 문항이 없습니다.</p>;
  }

  // 귀책 코드별 분포 집계 (빈칸 수 합산 아님, 코드별 목록)
  const byCode: Record<string, any[]> = {};
  for (const item of items) {
    const code = item.nonresponse_code || 'N2';
    if (!byCode[code]) byCode[code] = [];
    byCode[code].push(item);
  }

  return (
    <div className="space-y-3">
      {Object.entries(byCode).map(([code, codeItems]) => (
        <div key={code} className="rounded-lg border border-rose-100 p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
              {code}
            </span>
            <span className="text-sm text-gray-600">
              {NONRESPONSE_LABELS[code] || code}
            </span>
            <span className="ml-auto text-xs text-gray-400">{codeItems.length}건</span>
          </div>
          <div className="space-y-1">
            {codeItems.map((item: any, i: number) => (
              <div key={i} className="text-xs text-gray-500">
                {item.question_id}
                {item.note && <span className="ml-1 text-gray-400">— {item.note}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionPublicSource({ items }: { items: any[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">공적 출처 데이터가 없습니다.</p>;
  }

  const withPublicSource = items.filter((item: any) => item.public_source_present);
  const rate = items.length > 0 ? Math.round((withPublicSource.length / items.length) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-600">공적 출처 인용률</span>
            <span className="font-medium text-gray-800">{rate}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${
                rate >= 60 ? 'bg-emerald-500' : rate >= 30 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${rate}%` }}
            />
          </div>
        </div>
        <div className="text-right text-xs text-gray-400">
          {withPublicSource.length} / {items.length} 문항
        </div>
      </div>
      <div className="text-xs text-gray-500">
        {items.map((item: any, i: number) => (
          <span key={i} className="mr-2 inline-block">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                item.public_source_present ? 'bg-emerald-400' : 'bg-gray-300'
              }`}
            />{' '}
            {item.question_id}
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionResidualSpread({ items }: { items: any[] }) {
  if (items.length === 0) {
    return (
      <div className="flex items-start gap-2 text-sm text-gray-500">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>동류 집단 비교를 위한 충분한 데이터가 아직 수집되지 않았습니다.</span>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((item: any, i: number) => (
        <div key={i} className="rounded-lg bg-violet-50/50 p-3 text-sm">
          <span className="font-medium text-gray-700">
            잔여 폭 지표: {item.spreadIndex || item.spread_index || '—'}
          </span>
          {item.peerGroupId && (
            <span className="ml-2 text-xs text-gray-500">
              동류 집단: {item.peerGroupId}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── 절 렌더 디스패치 ─────────────────────────────────────────

function renderSectionItems(kind: SectionKind, items: any[]) {
  switch (kind) {
    case 'canon_absence_and_ownership':
      return <SectionCanonAbsence items={items} />;
    case 'entity_existence':
      return <SectionEntityExistence items={items} />;
    case 'nonresponse_distribution':
      return <SectionNonresponse items={items} />;
    case 'public_source_citation':
      return <SectionPublicSource items={items} />;
    case 'residual_spread':
      return <SectionResidualSpread items={items} />;
    default:
      return <p className="text-sm text-gray-400">알 수 없는 절: {kind}</p>;
  }
}

// ── 메인 뷰어 컴포넌트 ──────────────────────────────────────

interface SpecOutputViewerProps {
  output: Output;
  className?: string;
}

export function SpecOutputViewer({ output, className }: SpecOutputViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0, 1, 2, 3, 4]) // 모두 펼침
  );

  const toggleSection = (order: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(order)) {
        next.delete(order);
      } else {
        next.add(order);
      }
      return next;
    });
  };

  // 절 순서 강제 (order 기준 정렬)
  const sortedSections = [...output.sections].sort((a, b) => a.order - b.order);

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* 산출물 헤더 */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">측정 규격 산출물</h2>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
            {output.channel === 'national_report'
              ? '전국 공표문'
              : output.channel === 'agency_notice'
                ? '기관별 통보서'
                : '익명 원자료'}
          </span>
        </div>

        {/* 메타 정보 */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 sm:grid-cols-4">
          <div>
            <span className="text-gray-400">관측 프로필</span>
            <div className="font-medium text-gray-700">{output.run_profile_id}</div>
          </div>
          <div>
            <span className="text-gray-400">관측 기간</span>
            <div className="font-medium text-gray-700">
              {output.observed_at.start.slice(0, 10)} ~ {output.observed_at.end.slice(0, 10)}
            </div>
          </div>
          <div>
            <span className="text-gray-400">원장 기준일</span>
            <div className="font-medium text-gray-700">{output.ledger_as_of}</div>
          </div>
          <div>
            <span className="text-gray-400">산출물 ID</span>
            <div className="font-medium text-gray-700">{output.output_id}</div>
          </div>
        </div>

        {/* 프록시 고지 */}
        <div className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
          <Info className="mr-1 inline-block h-3 w-3" />
          {output.proxy_notice}
        </div>
      </div>

      {/* 5대 절 */}
      {sortedSections.map((section) => {
        const meta = SECTION_META.find((m) => m.kind === section.kind);
        if (!meta) return null;

        const isExpanded = expandedSections.has(section.order);
        const itemCount = section.items?.length || 0;

        return (
          <div
            key={section.order}
            className={`overflow-hidden rounded-xl border shadow-sm ${meta.color}`}
          >
            <button
              onClick={() => toggleSection(section.order)}
              className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-600">
                {meta.icon}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">
                    제{section.order}절
                  </span>
                  <h3 className="font-semibold text-gray-800">{meta.title}</h3>
                </div>
                <p className="text-xs text-gray-500">{meta.subtitle}</p>
              </div>
              <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs text-gray-500">
                {itemCount}건
              </span>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-white/50 bg-white/30 p-4">
                {renderSectionItems(section.kind, section.items || [])}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default SpecOutputViewer;
