// app/(public)/bot/page.tsx
// NFR-4: 수집기 안내 및 투명성 선언 페이지
import React from 'react';
import { SCANNER_UA, SCAN_TIMEOUT_MS, SCAN_MIN_INTERVAL_MS } from '@/lib/constants/scanner';
import { Bot, ShieldCheck, Mail, Globe, AlertCircle } from 'lucide-react';

export default function BotPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          <Bot className="w-3.5 h-3.5" />
          KPlaceLabBot 투명성 선언
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          kplacelab 수집기 안내
        </h1>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          공공 누리집 서버 관리자와 네트워크 보안 담당자를 위해 kplacelab 로봇의 수집 목적, 동작 규칙 및 연락 경로를 안내합니다.
        </p>
      </div>

      {/* 수집기 식별자 카드 */}
      <div className="bg-gray-900 text-gray-100 p-6 rounded-2xl space-y-4 font-mono text-xs sm:text-sm">
        <div className="text-gray-400 font-sans font-semibold text-xs uppercase tracking-wider">
          User-Agent 식별자
        </div>
        <div className="p-3 rounded-lg bg-gray-800 text-blue-300 select-all break-all border border-gray-700">
          {SCANNER_UA}
        </div>
        <div className="text-xs text-gray-400 font-sans space-y-1">
          <div>• 프로토콜: HTTPS / HTTP 1.1 및 HTTP/2</div>
          <div>• 최소 요청 간격: 동일 호스트 기준 최소 {SCAN_MIN_INTERVAL_MS / 1000}초 지연</div>
          <div>• 타임아웃: {SCAN_TIMEOUT_MS / 1000}초</div>
        </div>
      </div>

      {/* 수집 범위 및 원칙 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          수집 범위 및 예의 있는 수집(Polite Crawler) 원칙
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-gray-50 space-y-2">
            <h3 className="font-bold text-gray-900">가져가는 것 (최소 요청)</h3>
            <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
              <li><code>/robots.txt</code> 파일 존재 및 파싱 규칙</li>
              <li>루트 페이지(<code>/</code>) 헤더 및 JSON-LD 구조화 데이터</li>
              <li>robots.txt 내 선언된 Sitemap URL 유효성 확인</li>
              <li>TLS 인증서 만료일 및 정상 여부</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/50 space-y-2 border border-rose-100">
            <h3 className="font-bold text-rose-900">가져가지 않는 것 (절대 금지)</h3>
            <ul className="list-disc list-inside text-xs text-rose-800 space-y-1">
              <li><strong>본문 크롤링 절대 안 함:</strong> 하위 링크 순회 금지</li>
              <li><strong>부하 유발 금지:</strong> 도메인당 주 1회 단 몇 회의 요청만 수행</li>
              <li><strong>차단 우회 금지:</strong> IP 변경, 프록시, 캡차 우회 절대 안 함</li>
              <li><strong>개인정보 수집 안 함</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* 수집 거부 및 차단에 대한 정책 */}
      <div className="p-5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm space-y-2">
        <div className="font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          수집 거부를 원하시는 경우
        </div>
        <p className="text-xs text-blue-800 leading-relaxed">
          kplacelab은 표준 <code>robots.txt</code> 규약을 100% 준수합니다.
          별도의 수집 거부 폼을 신청하실 필요 없이, 귀 기관 누리집의 <code>robots.txt</code>에서
          <code>User-agent: KPlaceLabBot</code>에 대해 <code>Disallow: /</code>를 선언하시면
          저희 수집기는 그 즉시 요청을 중단하고 &apos;차단(blocked)&apos; 사실만을 객관적으로 기록합니다.
        </p>
      </div>

      {/* 담당자 연락처 */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
        <Mail className="w-4 h-4 text-gray-500" />
        <span>기술적 문의나 서버 방화벽 IP 확인이 필요하신 경우: <strong className="text-gray-900 font-mono">contact@kplacelab.kr</strong></span>
      </div>
    </div>
  );
}
