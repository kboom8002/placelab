// app/(public)/method/page.tsx
// FR-8: 측정 방법론 전문 공개 (로그인 불필요)
import React from 'react';
import type { Metadata } from 'next';
import { CURRENT_METHOD_VERSION } from '@/lib/constants/measurement';
import {
  SCANNER_UA,
  SCAN_TIMEOUT_MS,
  SCAN_MIN_INTERVAL_MS,
  PROMOTION_REQUIRED_WEEKS,
} from '@/lib/constants/scanner';
import { SourceNote } from '@/components/ui/SourceNote';
import { BookOpen, CheckCircle2, ShieldCheck, Scale, AlertOctagon, Terminal, FileCode2, FileCheck2, Database, ShieldAlert, Cpu } from 'lucide-react';

export const metadata: Metadata = {
  title: '측정 방법론 명세서 — kplacelab',
  description: 'kplacelab의 4단계 레이어 구조, 5분 판정 규칙, Floor Risk 평가 철학, 예의 있는 수집기 사양 전문',
};

export default function MethodPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-16">
      {/* 1. 에디토리얼 헤더 */}
      <div className="space-y-4 border-b border-slate-200/80 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5 text-gold-400" />
          PUBLIC METHODOLOGY SPECIFICATION · {CURRENT_METHOD_VERSION}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-navy-950 tracking-tight leading-tight">
          kplacelab 측정 방법론 명세서
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
          kplacelab의 모든 측정 기준과 판정 규칙은 투명하게 전문 공개됩니다.
          수치를 발표하는 플랫폼의 정당성은 감추지 않는 원본 데이터와 반증 가능한 방법론에서 나옵니다.
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-mono pt-2">
          <span>제정: 2026-09-01</span>
          <span>·</span>
          <span>개정: 2026-09-05 (v1.0)</span>
          <span>·</span>
          <span className="text-navy-700 font-semibold">책임: kplacelab 연구팀</span>
        </div>
      </div>

      {/* 2. 4단계 측정 레이어 구조 */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-gold-600">01 / ARCHITECTURE</div>
          <h2 className="text-2xl font-bold text-navy-950 flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-navy-800" />
            4단계 측정 레이어 구조
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            측정 조건이 다른 데이터는 절대 같은 축에 놓지 않습니다 (INV-4). 자발적 표본으로 전국을 말하지 않습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Layer 1 · 기술 접근성
              </span>
              <span className="text-[11px] font-mono text-slate-400">무료 · 주간 전수</span>
            </div>
            <h3 className="font-bold text-navy-950 text-base">서버 자동 수집 기준선</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              243개 지자체 및 특별구역 공식 도메인의 robots.txt, Sitemap, 메인 헤더, TLS를 매주 서버가 자동 수집합니다.
              유일하게 표본 편향이 없는 전수 데이터입니다.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                Layer 2 · 셀프체크
              </span>
              <span className="text-[11px] font-mono text-slate-400">무료 · 자발적 참여</span>
            </div>
            <h3 className="font-bold text-navy-950 text-base">자발적 참여 표본</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              표준 20개 문항(지명 12 + 무지명 8)을 주민이나 담당 공무원이 직접 AI에 질문하고 채점 결과를 제출합니다.
              참여한 단위 수만을 분모로 삼으며 전국 통계로 호도하지 않습니다 (INV-4).
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                Layer 3 · 통제 측정
              </span>
              <span className="text-[11px] font-mono text-slate-400">유상 · 연구 통제</span>
            </div>
            <h3 className="font-bold text-navy-950 text-base">API 조건 고정 정밀 측정</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              상업용 AI API를 통해 조건(웹검색 차단, 언어, 모델 고정)을 엄격히 통제하고 문항당 5회 이상 반복 실행하여
              단일 평균 점수가 아닌 <strong>분포 구간과 Floor Risk</strong>를 산출합니다 (INV-9).
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full">
                Layer 4 · 진단 및 정비
              </span>
              <span className="text-[11px] font-mono text-slate-400">컨설팅 · 원인 규명</span>
            </div>
            <h3 className="font-bold text-navy-950 text-base">공식 정본(Canonical Source) 정비</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              공공 방화벽/WAF 오작동, 웹서버 비표준 응답, 공식 누리집 정본 신설 등 AI 응답 오류의 근본 원인을 해결하는
              현장 정비 프로그램입니다.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Layer 1 robots.txt 5분 판정 규칙 */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-gold-600">02 / VERDICT RULES</div>
          <h2 className="text-2xl font-bold text-navy-950 flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            Layer 1 robots.txt 5분 판정 규칙
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            판정 불가(undetermined)를 절대 차단이나 개방으로 뭉뚱그리지 않습니다 (INV-2). 장애를 정책적 의사결정으로 오도하지 않습니다.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-editorial">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-5">판정 분류</th>
                <th className="py-3.5 px-5">기술 판정 기준</th>
                <th className="py-3.5 px-5">의미 및 조치 방향</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-5 font-bold text-emerald-700 whitespace-nowrap">
                  개방 (open)
                </td>
                <td className="py-3.5 px-5 text-slate-700">
                  robots.txt 파일이 존재하며 주요 AI 검색 Agent 또는 전체(*) 대상 허용
                </td>
                <td className="py-3.5 px-5 text-slate-500">
                  AI 검색 에이전트가 공식 누리집의 행정정보를 정상적으로 수집 가능
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-5 font-bold text-rose-700 whitespace-nowrap">
                  전체 차단 (blocked_all)
                </td>
                <td className="py-3.5 px-5 text-slate-700">
                  <code>User-agent: * Disallow: /</code> 또는 주요 AI 봇 명시 차단
                </td>
                <td className="py-3.5 px-5 text-slate-500">
                  모든 AI 봇의 접근이 정책적/기술적으로 완전히 거부됨
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-5 font-bold text-orange-800 whitespace-nowrap">
                  선별 차단 (blocked_selective)
                </td>
                <td className="py-3.5 px-5 text-slate-700">
                  특정 AI 검색 로봇만 차단하거나 주요 민원·행정 경로를 선택 Disallow
                </td>
                <td className="py-3.5 px-5 text-slate-500">
                  특정 서비스에서 최신 행정 지원 정책이 누락될 위험 존재
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-5 font-bold text-slate-700 whitespace-nowrap">
                  파일 없음 (no_file)
                </td>
                <td className="py-3.5 px-5 text-slate-700">
                  HTTP 404 등 robots.txt 파일이 도메인 루트에 존재하지 않음
                </td>
                <td className="py-3.5 px-5 text-slate-500">
                  표준상 암묵적 수집 허용이나 명시적 규약 부재
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-5 font-bold text-purple-700 whitespace-nowrap">
                  판정 불가 (undetermined)
                </td>
                <td className="py-3.5 px-5 text-slate-700">
                  타임아웃(3초), 비정상 HTML 응답, DNS 실패, 문법 파싱 오류
                </td>
                <td className="py-3.5 px-5 text-slate-500">
                  서버 및 네트워크 장애 상태. 반드시 <code>undetermined_reason</code>을 동반 기록
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. 예의 있는 수집 규약 (Polite Crawler) */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-gold-600">03 / CRAWLER POLICY</div>
          <h2 className="text-2xl font-bold text-navy-950 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-navy-800" />
            예의 있는 수집 규약 (Polite Crawler)
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            차단을 우회하는 순간 이 제품의 정당성이 사라집니다 (INV-5). 기술 선택이 아니라 존립 조건입니다.
          </p>
        </div>

        <div className="bg-navy-950 text-slate-200 p-6 sm:p-7 rounded-2xl border border-white/10 shadow-xl space-y-4 font-mono text-xs">
          <div className="flex items-center gap-2 text-gold-400 font-sans font-bold text-sm border-b border-white/10 pb-3">
            <Terminal className="w-4 h-4" />
            KPlaceLabBot 수집기 절대 규약
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-slate-400">User-Agent 식별자</span>
              <div className="text-white font-bold p-2 bg-white/5 rounded-lg border border-white/5">
                {SCANNER_UA}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400">호스트당 최소 요청 간격</span>
              <div className="text-white font-bold p-2 bg-white/5 rounded-lg border border-white/5">
                {SCAN_MIN_INTERVAL_MS} ms (초당 0.2회 이하)
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400">단일 요청 타임아웃</span>
              <div className="text-white font-bold p-2 bg-white/5 rounded-lg border border-white/5">
                {SCAN_TIMEOUT_MS} ms (3초 초과 시 undetermined)
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400">공식 승격 요건 (INV-8)</span>
              <div className="text-white font-bold p-2 bg-white/5 rounded-lg border border-white/5">
                최근 {PROMOTION_REQUIRED_WEEKS}주 연속 동일 결과 확인
              </div>
            </div>
          </div>

          <div className="pt-2 text-slate-400 text-[11px] leading-relaxed border-t border-white/10">
            * 우회 수단(프록시 회전, IP 변조, 캡차 우회, 헤드리스 브라우저 가장 등) 일체 금지.
            도메인이 당사 수집기를 명시 차단할 경우 그 사실만 기록하고 추가 요청을 중단합니다.
          </div>
        </div>
      </section>

      {/* 5. Floor Risk 철학 */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-gold-600">04 / PHILOSOPHY</div>
          <h2 className="text-2xl font-bold text-navy-950 flex items-center gap-2.5">
            <AlertOctagon className="w-6 h-6 text-rose-600" />
            Floor Risk: 평균이 아니라 최악을 본다
          </h2>
        </div>

        <div className="p-6 sm:p-7 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-3">
          <h3 className="font-bold text-amber-950 text-base">
            &quot;정확도 평균 80%&quot;라는 숫자는 왜 공공 서비스에서 위험한가
          </h3>
          <p className="text-sm text-amber-900 leading-relaxed">
            5번 중 4번 맞추더라도, 1번 발생한 치명적 작화(존재하지 않는 1천만 원 출산지원금이나 폐지된 복지 제도를 실제로 있는 것처럼 답함)는
            주민 한 명을 관공서로 헛걸음하게 만들고 행정력을 낭비시킵니다.
          </p>
          <p className="text-sm text-amber-900 leading-relaxed">
            kplacelab은 부재(모른다고 답함)와 작화(거짓을 꾸며냄)를 결코 같은 무게로 평균 내지 않습니다.
            작화가 1회라도 발견되면 <strong>Floor Risk: Critical</strong>로 단독 표기하여 위험을 알립니다 (INV-9).
          </p>
        </div>
      </section>

      {/* 5. measurement-spec AI 프로빙 측정 규격 명세 */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-gold-600">05 / MEASUREMENT SPEC</div>
          <h2 className="text-2xl font-bold text-navy-950 flex items-center gap-2.5">
            <FileCheck2 className="w-6 h-6 text-navy-900" />
            AI 프로빙 다차원 측정 규격 (spec-v1.0)
          </h2>
          <p className="text-slate-600 text-sm">
            언어 모형의 자의적 점수 산출을 금지하고, 4칸 파이프라인과 규칙 원장 대조로 공표 산출물을 통제합니다.
          </p>
        </div>

        {/* 4칸 파이프라인 */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-navy-950 text-base flex items-center gap-2">
            <Cpu className="w-5 h-5 text-gold-600" />
            4칸 파이프라인 (The 4-Stage Engine)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-navy-900 block">1. 수집 (Collector)</span>
              <p className="text-slate-600">robots.txt 확인 필수, SCANNER_UA 고정, 응답 원문 무손실 보존</p>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-navy-900 block">2. 추출 (Extractor)</span>
              <p className="text-slate-600">진술값 및 사실관계 분리 (extracted_by: model, 판정 금지)</p>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-emerald-800 block">3. 판정 (Verifier)</span>
              <p className="text-slate-600">규칙 기반 원장 대조만 허용 (judged_by: rule 강제, LLM 개입 금지)</p>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-blue-800 block">4. 산출 (Output)</span>
              <p className="text-slate-600">5대 절 고정 순서 조립, 익명 손잡이 치환, 프록시 고지 필수</p>
            </div>
          </div>
        </div>

        {/* 5대 절 고정 산출물 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3">
          <h3 className="font-bold text-navy-950 text-base flex items-center gap-2">
            <Database className="w-5 h-5 text-gold-600" />
            5대 절 산출물 고정 순서 (순서 임의 변경 불가)
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-700">
            <li><strong>제1절 정본 부재 영역과 그 귀속:</strong> 공적 주체 어디에서도 발행하지 않은 정보 및 개선 권한 주체(ownership)</li>
            <li><strong>제2절 서술형 개체의 실재·등록 상태:</strong> 고유 시설·제도 명칭의 공적 발행 및 등록 여부</li>
            <li><strong>제3절 무응답 귀책 분포 (N1~N5):</strong> 단순 빈칸 합산 금지, 미응답의 구조적 원인 분류</li>
            <li><strong>제4절 공적 출처가 근거로 쓰인 정도:</strong> AI 답변이 공적 1차·2차 출처를 인용한 비율(%) 및 분포</li>
            <li><strong>제5절 여건 고정 후 잔여 폭:</strong> 인구·지역 등 불가항력 여건을 동류 집단(peer group)으로 고정한 뒤 남는 차이</li>
          </ol>
        </div>

        {/* N코드 & C코드 대조표 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
            <h4 className="font-bold text-rose-950 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" /> 무응답 귀책 분류 (Nonresponse Codes)
            </h4>
            <ul className="space-y-1 text-rose-900/90">
              <li>• <strong>N1 (기술 차단):</strong> robots.txt 또는 WAF 방화벽에 의한 기계 접근 차단</li>
              <li>• <strong>N2 (내용 부재):</strong> 조례·공고 등 공적 정보 자체가 웹에 존재하지 않음</li>
              <li>• <strong>N3 (형식 미비):</strong> PDF/이미지 등 비기계독식 첨부파일로 방치</li>
              <li>• <strong>N4 (경쟁 배제):</strong> 입찰·영업비밀·보안 등 법령상 비공개 사유</li>
              <li>• <strong>N5 (엔진 회피):</strong> AI 서비스 자체 정책 또는 회피로 인한 미응답</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
            <h4 className="font-bold text-blue-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" /> 부정합 판정 분류 (Mismatch Codes)
            </h4>
            <ul className="space-y-1 text-blue-900/90">
              <li>• <strong>C0 (대조 불가):</strong> 사실 원장 데이터 미등록 상태</li>
              <li>• <strong>C1 (수치 불일치):</strong> 금액·인원 등 구체적 수치 오답</li>
              <li>• <strong>C2 (출처 부적절):</strong> 사설 광고·블로그 등 비공인 출처 왜곡</li>
              <li>• <strong>C3 (시점 어긋남):</strong> 원장 기준년과 진술 시점의 괴리 (과거 정보 진술)</li>
              <li>• <strong>C4 (대상 혼동):</strong> 타 지자체 제도 또는 광역 정책과의 혼동</li>
            </ul>
          </div>
        </div>

        {/* 3대 공표 경로 보호 */}
        <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1.5 text-xs">
          <span className="font-bold text-gold-400 block">3대 공표 경로 보호 원칙 (INV-3 & INV-4)</span>
          <p className="text-slate-300">
            <strong>전국 공표문:</strong> 익명 손잡이(A군, B시) 자동 치환 및 사전 통지 게이트 통과 후 공표 · 
            <strong>기관별 통보서:</strong> 소관 기관만 실명 통보 · 
            <strong>익명 원자료:</strong> 동류 집단 표본 수 min_cell_size ≥ 5 미만 시 발행 거부(역추적 방지).
          </p>
        </div>
      </section>

      {/* 6. 인용 및 출처 */}
      <SourceNote
        date="2026-09-05"
        version={CURRENT_METHOD_VERSION}
        sourceText="kplacelab 연구 규약집 (docs/knowledge/K01~K16) 및 ADR 의사결정 기록"
      />
    </div>
  );
}
