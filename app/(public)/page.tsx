// app/(public)/page.tsx
// 모두의 정답노트 (Jeongdap Note) 메인 홈 (Server Component / ISR)
import React from 'react';
import { getUnitsByPopulation } from '@/lib/db/units';
import { CURRENT_METHOD_VERSION } from '@/lib/constants/measurement';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { SourceNote } from '@/components/ui/SourceNote';
import Link from 'next/link';
import {
  BookOpen,
  Send,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  FileCheck2,
  MapPin,
  Map,
  Calendar,
  Landmark,
  Users,
} from 'lucide-react';

export const revalidate = 3600;

export default async function HomePage() {
  const [localGovUnits, specialZoneUnits] = await Promise.all([
    getUnitsByPopulation('local_gov'),
    getUnitsByPopulation('special_zone'),
  ]);

  return (
    <div className="space-y-12 pb-16">
      {/* 1. 모두의 정답노트 히어로 섹션 */}
      <section className="relative bg-navy-950 text-white overflow-hidden border-b border-white/10 pt-16 pb-20 sm:pt-20 sm:pb-24">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-navy-800/40 via-gold-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-gold-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>방법론 {CURRENT_METHOD_VERSION} 사전 등록 공개 · 민간 공익 자체 측정 (D103)</span>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
              모두의 정답노트
              <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-amber-200">
                AI가 우리 동네를 제대로 답하는가
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
              생성형 AI에게 우리 지역 민원·복지·생활행정·문화를 물었을 때, 공식 문서를 첫 근거로 삼아 정확히 답하는지 측정합니다.
              본 플랫폼은 종합 점수나 순위를 매기지 않으며(INV-3 · INV-13), 광역(16)·기초(227)·특별구역 모집단을 임의 합산하지 않습니다(INV-1).
            </p>
          </div>

          {/* 주요 이동 버튼 */}
          <div className="pt-2 flex flex-wrap items-center gap-3.5">
            <Link
              href="/regions"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-navy-950 text-sm font-bold rounded-xl shadow-lg hover:shadow-gold-500/20 transition-all hover:scale-[1.02]"
            >
              <MapPin className="w-4 h-4" />
              내 지역 찾기 (광역 16 · 기초 227)
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/prereg"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 text-gold-300 text-sm font-semibold rounded-xl border border-gold-400/30 backdrop-blur-sm transition-all"
            >
              <FileText className="w-4 h-4 text-gold-400" />
              1차 측정 사전 등록서 (H1~H5)
            </Link>
            <Link
              href="/method"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-xl border border-white/10 backdrop-blur-sm transition-all"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              측정 방법론 v1.0 전문
            </Link>
            <Link
              href="/report"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-slate-200 text-sm font-semibold rounded-xl border border-white/10 backdrop-blur-sm transition-all"
            >
              <Send className="w-4 h-4 text-gold-400" />
              AI 오답 신고판
            </Link>
          </div>

          {/* 4대 핵심 신뢰 원칙 요약 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-white/10 max-w-5xl">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>2대 공표 지표</strong> · 공식 근거율(S3) & 피해 위험 건수</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>순위·종합점수 배제</strong> · 3구간 가나다순 표기 (INV-3)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>사전 등록 공표</strong> · 가설·반증 조건 선행 고정 (INV-11)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>A원칙 독립성</strong> · 측정 대상 정비 상품 판매 금지 (INV-14)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 모두의 정답노트 핵심 화면 안내 그리드 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-navy-100 text-navy-900 text-xs font-bold mb-1">
                <FileCheck2 className="w-3.5 h-3.5 text-navy-700" />
                <span>모두의 정답노트 v1.0 핵심 구성</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
                방어(정답 대조)와 능동(등장·정체성 관측)의 결합
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                5곳 기준 패널(구로구·수원시·화성시·청양군·완도군) 550문항×9회 정밀 측정과 주간 270+243문항 상시 관측으로 운영됩니다.
              </p>
            </div>
            <Link
              href="/disclosure"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-navy-950 hover:text-gold-600 transition-colors shrink-0 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
            >
              <span>이해관계 공시 (A원칙) 보기</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/regions"
              className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-gold-400 hover:shadow-lg transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <MapPin className="w-3.5 h-3.5 text-gold-600" />
                  내 지역 찾기
                </span>
                <span className="text-[11px] font-mono text-slate-400">광역 16 · 기초 227</span>
              </div>
              <h3 className="text-base font-black text-navy-950 group-hover:text-gold-600 transition-colors">
                지역별 공식 근거율 · 피해 위험 · 주간 등장 상태
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                5곳 기준 패널 정밀 측정과 전국 전수 코어 60문항(2027-03 예정, 이전까지 「측정 전」 명시 · INV-17)을 지역별로 투명하게 안내합니다.
              </p>
            </Link>

            <Link
              href="/maps"
              className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-gold-400 hover:shadow-lg transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <Map className="w-3.5 h-3.5 text-gold-600" />
                  공식 근거 구간 지도
                </span>
                <span className="text-[11px] font-mono text-slate-400">3구간 · 가나다순</span>
              </div>
              <h3 className="text-base font-black text-navy-950 group-hover:text-gold-600 transition-colors">
                공식 근거 많음 · 보통 · 공식 근거 적음 (3구간)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                1~243위 순위표 없이 고정 경계선 기준 3구간과 구간 내 가나다순 표기로만 공개하며, 색각 이상 친화 도형(●·▲·◆)을 병기합니다.
              </p>
            </Link>

            <Link
              href="/weekly"
              className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-gold-400 hover:shadow-lg transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 text-gold-600" />
                  주간 질문 & 기상도
                </span>
                <span className="text-[11px] font-mono text-slate-400">방어판·능동판 격주</span>
              </div>
              <h3 className="text-base font-black text-navy-950 group-hover:text-gold-600 transition-colors">
                매주 시민이 묻는 질문과 4주 12회 창 상태
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                월·수·금 무지명 관측과 화요일 지명 관측을 통해 「안정·신규」 등장 지역을 기록하며, 미등장 지역 목록은 공개하지 않습니다(INV-15).
              </p>
            </Link>

            <Link
              href="/culture"
              className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-gold-400 hover:shadow-lg transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <Landmark className="w-3.5 h-3.5 text-gold-600" />
                  지역 문화 트랙
                </span>
                <span className="text-[11px] font-mono text-slate-400">200문항 · 5분야</span>
              </div>
              <h3 className="text-base font-black text-navy-950 group-hover:text-gold-600 transition-colors">
                유산 · 음식 · 축제 · 자연 · 인물·이야기 정본 측정
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                지역 문화 정본이 AI 답변에 첫 근거로 쓰이는지, 혹은 온라인 공식 문서 자체가 없는 공급 공백인지 분리해 진단합니다.
              </p>
            </Link>

            <Link
              href="/join"
              className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-gold-400 hover:shadow-lg transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <Users className="w-3.5 h-3.5 text-gold-600" />
                  함께하기
                </span>
                <span className="text-[11px] font-mono text-slate-400">신고 · 제안 · 확인단</span>
              </div>
              <h3 className="text-base font-black text-navy-950 group-hover:text-gold-600 transition-colors">
                AI 오답 신고판 · 다음 주 질문 제안 · 시민 확인단
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                시민이 겪은 AI 오답을 제보하고 다음 주 질문을 제안합니다. 2% 표본을 검증하는 유급 시민 확인단(시급 1.5만 원, 만 19세 이상)을 운영합니다.
              </p>
            </Link>

            <Link
              href="/prereg"
              className="group p-5 rounded-2xl bg-navy-950 text-white border border-gold-500/30 hover:border-gold-400 hover:shadow-lg transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-300 bg-gold-500/20 px-2.5 py-1 rounded-lg">
                  <FileText className="w-3.5 h-3.5 text-gold-400" />
                  1차 측정 사전 등록 (INV-11)
                </span>
                <span className="text-[11px] font-mono text-gold-300">2026-10 공개</span>
              </div>
              <h3 className="text-base font-black text-white group-hover:text-gold-300 transition-colors">
                가설 H1~H5 · 반증 조건 · 중단 규칙 전문 공개
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                측정 시작 전에 문항 550개, 9회 반복 안정성 기준, 3구간 경계선 산출 방식과 반증 조건을 먼저 못박고 결과를 그대로 공표합니다.
              </p>
            </Link>
          </div>
        </section>

        {/* 투명성 및 모집단 분리 안내 배너 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-xs sm:text-sm flex items-start gap-3.5 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <div className="font-bold text-amber-900 flex items-center gap-2">
              <span>모집단 분리 원칙 및 구 Layer 1 기술 접근성 아카이브 안내</span>
              <span className="text-[11px] font-normal text-amber-700 font-mono">AGENTS.md INV-1 · ADR-0022 · ADR-0023</span>
            </div>
            <p className="text-amber-800 leading-relaxed text-xs sm:text-sm">
              지방자치단체(광역 16 · 기초 227)와 특별구역(독립 도메인 A형 6곳)은 근거 법률과 조직 성격이 달라 합산하지 않고 독립하여 제공합니다.
              아래 기술 접근성(<code>robots.txt</code>) 대시보드는 2026-09 기준 보존 데이터이며,{' '}
              <Link href="/labs/tech-access" className="underline font-semibold hover:text-amber-950">
                기술 접근성 아카이브(/labs/tech-access)
              </Link>
              에서도 열람하실 수 있습니다.
            </p>
          </div>
        </div>

        {/* 보존된 기술 접근성 대시보드 (구 Layer 1) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-1">
              <span>기술 접근성 보존 데이터 (구 Layer 1 · ADR-0023)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
              전국 자치단체 및 특별구역 robots.txt 기술 접근성 아카이브
            </h2>
          </div>
          <Link
            href="/labs/tech-access"
            className="text-xs font-bold text-navy-800 hover:text-gold-600 underline"
          >
            아카이브 전용 화면으로 보기 →
          </Link>
        </div>

        <DashboardClient
          initialLocalGovUnits={localGovUnits}
          initialSpecialZoneUnits={specialZoneUnits}
        />

        <SourceNote
          date="2026-10-17"
          version={CURRENT_METHOD_VERSION}
          sourceText="모두의 정답노트(Jeongdap Note) 측정 방법론 v1.0 사전 등록 및 기술 접근성 아카이브"
        />
      </div>
    </div>
  );
}
