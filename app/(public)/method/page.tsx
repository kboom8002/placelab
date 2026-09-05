// app/(public)/method/page.tsx
// FR-8: 측정 방법론 전문 공개 (로그인 불필요)
import React from 'react';
import { CURRENT_METHOD_VERSION } from '@/lib/constants/measurement';
import { SCANNER_UA, SCAN_TIMEOUT_MS, SCAN_MIN_INTERVAL_MS, PROMOTION_REQUIRED_WEEKS } from '@/lib/constants/scanner';
import { BookOpen, CheckCircle, ShieldCheck, Scale, AlertOctagon } from 'lucide-react';

export default function MethodPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          공개 방법론 {CURRENT_METHOD_VERSION}
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          kplacelab 측정 방법론 명세서
        </h1>
        <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
          kplacelab의 모든 측정 기준과 판정 규칙은 투명하게 전문 공개됩니다. 방법론을 숨기는 것은 신뢰를 잃는 지름길입니다.
        </p>
      </div>

      {/* 1. 4단계 측정 레이어 */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Scale className="w-5 h-5 text-blue-600" />
          1. 4단계 측정 레이어 구조
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-gray-200 bg-white space-y-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Layer 1 · 기술 접근성 (무료 · 전수)</span>
            <h3 className="font-bold text-gray-900 text-base">서버 자동 수집 기준선</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              243개 지자체 및 특별구역 공식 도메인의 robots.txt, Sitemap, 메인 헤더, TLS를 매주 서버가 자동 수집합니다.
              유일하게 자기선택 편향이 없는 전수 데이터입니다.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-gray-200 bg-white space-y-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Layer 2 · 셀프체크 (무료 · 참여)</span>
            <h3 className="font-bold text-gray-900 text-base">자발적 참여 표본</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              표준 20개 문항(지명 12 + 무지명 8)을 주민이나 담당 공무원이 직접 AI에 질문하고 채점 결과를 제출합니다.
              자발적 표본이므로 절대 &apos;전국 통계&apos;로 일반화하지 않습니다.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-gray-200 bg-white space-y-2">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Layer 3 · 통제 측정 (기관 유상 SaaS)</span>
            <h3 className="font-bold text-gray-900 text-base">API 조건 고정 정밀 측정</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              상업용 AI API를 통해 조건(웹검색, 언어, 모델)을 통제하고 문항당 5회 이상 반복 실행하여 단일 점수가 아닌 <strong>구간 추정과 Floor Risk</strong>를 산출합니다.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-gray-200 bg-white space-y-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Layer 4 · 진단 및 정비 (컨설팅)</span>
            <h3 className="font-bold text-gray-900 text-base">사람 개입 공식 정본 정비</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              공공 방화벽/WAF, 웹서버 설정, 공식 누리집 정본(Canonical Source) 신설 등 AI 응답 부정확의 근본 원인을 해결하는 심층 정비 사업입니다.
            </p>
          </div>
        </div>
      </section>

      {/* 2. 4분 판정 규칙표 */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          2. Layer 1 robots.txt 4분 판정 규칙
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600 border-b border-gray-200">
              <tr>
                <th className="p-3">판정 분류</th>
                <th className="p-3">판정 기준</th>
                <th className="p-3">의미</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
              <tr>
                <td className="p-3 font-semibold text-emerald-700">개방 (open)</td>
                <td className="p-3 text-gray-600">robots.txt가 존재하며 주요 AI Agent 또는 * 수집 허용</td>
                <td className="p-3 text-gray-500">AI 검색 봇이 자유롭게 행정정보를 인덱싱 가능</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-rose-700">전체 차단 (blocked_all)</td>
                <td className="p-3 text-gray-600">User-agent: * Disallow: / 또는 주요 봇 전체 Disallow</td>
                <td className="p-3 text-gray-500">모든 AI 봇의 접근이 정책적으로 완전히 차단됨</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-amber-700">선별 차단 (blocked_selective)</td>
                <td className="p-3 text-gray-600">특정 AI 봇(예: GPTBot만) 차단하거나 일부 주요 경로 차단</td>
                <td className="p-3 text-gray-500">일부 AI 서비스에서 최신 정보 누락 가능성 존재</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700">파일 없음 (no_file)</td>
                <td className="p-3 text-gray-600">HTTP 404 등 robots.txt 파일이 아예 존재하지 않음</td>
                <td className="p-3 text-gray-500">기본적으로 봇이 허용되나 명시적 규칙 부재</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-purple-700">판정 불가 (undetermined)</td>
                <td className="p-3 text-gray-600">타임아웃, 비정상 HTML 응답, DNS 실패, 파싱 오류</td>
                <td className="p-3 text-gray-500">기술적 장애 상태 (절대 차단이나 개방으로 왜곡하지 않음)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. 예의 있는 수집 규약 */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          3. 예의 있는 수집 규약 (Polite Crawler)
        </h2>
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-xs sm:text-sm space-y-3 font-mono">
          <div><strong className="text-gray-900 font-sans">User-Agent:</strong> {SCANNER_UA}</div>
          <div><strong className="text-gray-900 font-sans">요청 간격:</strong> 동일 호스트 대상 최소 {SCAN_MIN_INTERVAL_MS}ms 지연</div>
          <div><strong className="text-gray-900 font-sans">타임아웃:</strong> {SCAN_TIMEOUT_MS}ms</div>
          <div><strong className="text-gray-900 font-sans">승격 주기:</strong> 최근 {PROMOTION_REQUIRED_WEEKS}주 연속 동일 관측치 확인 시에만 공식 판정으로 승격</div>
          <div><strong className="text-gray-900 font-sans">우회 금지 원칙:</strong> 프록시 회전, IP 변경, 캡차 우회 일체 금지. robots.txt 거부 시 즉시 요청 중단.</div>
        </div>
      </section>

      {/* 4. Floor Risk 철학 */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-rose-600" />
          4. Floor Risk: 평균이 아니라 최악을 본다
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          &quot;정확도 평균 80%&quot;라는 숫자는 위험합니다. 5번 중 1번 발생하는 치명적 오답(작화, 존재하지 않는 행정 지원금 안내)은 주민 한 명을 직접 헛걸음하게 만들기 때문입니다.
          kplacelab은 부재(모름)와 작화(거짓 지어냄)를 같은 무게로 평균 내지 않으며, 작화가 1회라도 발생하면 <strong>Floor Risk: Critical</strong>로 독립 보고합니다.
        </p>
      </section>
    </div>
  );
}
