// app/(public)/theme-lab/page.tsx
// Policy Theme Lab 메인 포털 (PRD v3.0)

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  MessageSquarePlus,
  MapPin,
  FileText,
  FlaskConical,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { SEED_THEMES } from '@/lib/theme-lab/seed-data';

export const metadata = {
  title: '정책테마랩 (Policy Theme Lab) | kplacelab',
  description: '주민의 실제 질문과 생활 맥락을 수집하여 AEO 진단 질문과 정책 테마를 발굴하는 순환 기획 플랫폼',
};

export default function ThemeLabHomePage() {
  const suwonThemes = SEED_THEMES.filter((t) => t.unitId === 'lg-41110');
  const jeungpyeongThemes = SEED_THEMES.filter((t) => t.unitId === 'lg-43745');

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* 상단 히어로 섹션 */}
        <div className="bg-navy-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Policy Theme Lab v3.0
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              무엇을 물어야 하는지 발견하고,<br />
              실제 주민 질문에서 정책 테마를 도출합니다
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              연구자가 임의로 만든 질문이나 AI가 상상한 정답만으로는 행정 사각지대를 밝힐 수 없습니다.
              kplacelab 정책테마랩은 주민의 실제 질문과 일상 불편을 수집하고,
              AI 응답과의 괴리에서 지자체의 진짜 정책 테마와 AEO 진단 질문을 발굴합니다.
            </p>

            {/* 빠른 액션 버튼 */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <Link
                href="/theme-lab/submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 text-navy-950 font-bold text-xs shadow-md hover:from-gold-300 hover:to-gold-400 transition-all"
              >
                <MessageSquarePlus className="w-4 h-4" />
                주민 질문·불편 남기기
              </Link>
              <Link
                href="/theme-lab/map"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/15 transition-all"
              >
                <MapPin className="w-4 h-4 text-gold-400" />
                질문 지도 & 빈칸 탐지
              </Link>
              <Link
                href="/theme-lab/themes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/15 transition-all"
              >
                <FileText className="w-4 h-4 text-gold-400" />
                정책 테마 브리프
              </Link>
            </div>
          </div>
        </div>

        {/* 4대 코어 프로세스 네비게이션 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/theme-lab/submit"
            className="group bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-gold-400/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-gold-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageSquarePlus className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-navy-950 group-hover:text-gold-600 transition-colors">
                1. 주민 질문 수집함
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                비로그인 접수. 질문·불편·비교·제안 4유형 수집 및 중립 맥락 보완 인터뷰
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-gold-600">
              <span>질문 접수하기</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/theme-lab/map"
            className="group bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-gold-400/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-navy-950 group-hover:text-gold-600 transition-colors">
                2. 질문 지도
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                7대 생활주제 × 6대 과업단계 매트릭스. 5가지 빈칸 검사로 정보 사각지대 탐색
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-blue-600">
              <span>지도 열람하기</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/theme-lab/themes"
            className="group bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-gold-400/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-navy-950 group-hover:text-gold-600 transition-colors">
                3. 정책 테마 브리프
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                질문 묶음에서 도출된 핵심 정책 과제. 공통 막힘, 원인 가설, 연구 질문 표준화
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <span>테마 브리프 보기</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/theme-lab/studio"
            className="group bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-gold-400/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FlaskConical className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-navy-950 group-hover:text-gold-600 transition-colors">
                4. 진단 질문 스튜디오
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                주민 질문을 PlaceLab 표준 진단 문항(T1~T4)으로 포맷팅 및 실측 세트 내보내기
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-purple-600">
              <span>스튜디오 열기</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* 실증 대상 지자체 요약 (수원시 vs 증평군) */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gold-500" />
                시범 실증 지역 핵심 정책 테마 (L2 v2.2 진단 기반)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                2026-09-07 실측 85문항 255회 결과를 바탕으로 자동 도출된 수원특례시와 증평군의 8대 정책 과제입니다.
              </p>
            </div>
            <Link
              href="/theme-lab/themes"
              className="text-xs font-semibold text-navy-900 hover:text-gold-600 flex items-center gap-1"
            >
              전체 8개 브리프 열람
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 수원특례시 카드 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-navy-100 text-navy-950 font-black text-xs">수원특례시</span>
                  <span className="text-xs text-slate-500">인구 120만 · 대도시 행정</span>
                </div>
                <span className="text-xs font-bold text-emerald-600">4개 테마 발굴</span>
              </div>

              <div className="space-y-3">
                {suwonThemes.map((t) => (
                  <Link
                    key={t.id}
                    href={`/theme-lab/themes/${t.id}`}
                    className="block p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100 border border-slate-200/60 transition-all group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 group-hover:text-gold-600 transition-colors">
                        {t.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-500 border">
                        {t.themeCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {t.coreQuestion}
                    </p>
                  </Link>
                ))}
              </div>

              <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>수원 핵심 시그널:</strong> 응답률은 93.3%로 높으나 종량제·출산축하금 등 사실 정확률이 53.3%에 머물고, 공식 suwon.go.kr 인용이 0건으로 단절됨.
                </span>
              </div>
            </div>

            {/* 증평군 카드 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-gold-100 text-gold-950 font-black text-xs">증평군</span>
                  <span className="text-xs text-slate-500">인구 3.8만 · 강소 농촌군</span>
                </div>
                <span className="text-xs font-bold text-emerald-600">4개 테마 발굴</span>
              </div>

              <div className="space-y-3">
                {jeungpyeongThemes.map((t) => (
                  <Link
                    key={t.id}
                    href={`/theme-lab/themes/${t.id}`}
                    className="block p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100 border border-slate-200/60 transition-all group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 group-hover:text-gold-600 transition-colors">
                        {t.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-500 border">
                        {t.themeCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {t.coreQuestion}
                    </p>
                  </Link>
                ))}
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>증평 핵심 시그널:</strong> jp.go.kr 공식 출처 인용은 100% 모범이나, 둘째 300만원 장려금이 50만원으로 6배 축소 전달되고 충북 살기좋은곳 추천에서 100% 누락.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PRD v3.0 순환 구조 안내 박스 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <h3 className="text-base font-bold text-navy-950 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-gold-500" />
            Policy Theme Lab과 PlaceLab의 순환 기획 파이프라인
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-navy-950 block">① 주민 질문 접수</span>
              <span className="text-slate-500 text-[11px]">일상 불편 및 비로그인 질문</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-navy-950 block">② 질문 지도 배치</span>
              <span className="text-slate-500 text-[11px]">주제×단계 매트릭스 빈칸 탐색</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-navy-950 block">③ 정책 테마 브리프</span>
              <span className="text-slate-500 text-[11px]">공통 막힘 및 원인 가설 수립</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-navy-950 block">④ PlaceLab 진단</span>
              <span className="text-slate-500 text-[11px]">T1~T4 다회차 AI 실측 실행</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-navy-950 block">⑤ 후속 질문 환류</span>
              <span className="text-slate-500 text-[11px]">오답·추천누락에서 재질문 도출</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
