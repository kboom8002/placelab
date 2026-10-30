// app/(public)/bot/page.tsx
// NFR-4 & INV-5: 수집기 안내 및 투명성 선언 페이지 (JeongdapNoteBot / KPlaceLabBot 12주 병기)
import React from 'react';
import {
  SCANNER_UA,
  LEGACY_SCANNER_UA,
  SCAN_TIMEOUT_MS,
  SCAN_MIN_INTERVAL_MS,
  CITED_PAGE_MIN_INTERVAL_MS,
} from '@/lib/constants/scanner';
import { Bot, ShieldCheck, Mail, AlertCircle, Globe } from 'lucide-react';

export default function BotPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          <Bot className="w-3.5 h-3.5" />
          JeongdapNoteBot 투명성 선언 (INV-5)
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          모두의 정답노트 수집기 안내
        </h1>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          공공 누리집 서버 관리자와 네트워크 보안 담당자를 위해 「모두의 정답노트 (Jeongdap Note, 구 kplacelab)」의
          측정 방식, 인용 URL 검증 봇 식별자, 동작 규칙 및 연락 경로를 안내합니다.
        </p>
      </div>

      {/* 수집기 식별자 카드 (신·구 UA 12주 병기) */}
      <div className="bg-gray-900 text-gray-100 p-6 rounded-2xl space-y-5 font-mono text-xs sm:text-sm">
        <div className="space-y-2">
          <div className="text-emerald-400 font-sans font-semibold text-xs uppercase tracking-wider">
            현재 표준 User-Agent 식별자 (v1.0)
          </div>
          <div className="p-3 rounded-lg bg-gray-800 text-blue-300 select-all break-all border border-gray-700">
            {SCANNER_UA}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-gray-800">
          <div className="text-amber-300 font-sans font-semibold text-xs uppercase tracking-wider">
            구 식별자 (브랜드 전환 후 12주간 병기 안내)
          </div>
          <div className="p-3 rounded-lg bg-gray-800/70 text-gray-300 select-all break-all border border-gray-700">
            {LEGACY_SCANNER_UA}
          </div>
        </div>

        <div className="text-xs text-gray-400 font-sans space-y-1 pt-2 border-t border-gray-800">
          <div>• 프로토콜: HTTPS / HTTP 1.1 및 HTTP/2</div>
          <div>• 인용 페이지 확인 최소 간격: 동일 호스트 기준 최소 {CITED_PAGE_MIN_INTERVAL_MS / 1000}초 이상 지연</div>
          <div>• 기술 접근성 아카이브 점검 간격: 동일 호스트 기준 최소 {SCAN_MIN_INTERVAL_MS / 1000}초 이상 지연</div>
          <div>• 타임아웃: {SCAN_TIMEOUT_MS / 1000}초</div>
        </div>
      </div>

      {/* 측정 방식 안내: 정밀 측정 vs 인용 URL 검증 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          정밀 측정과 인용 URL 확인의 동작 구분
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          모두의 정답노트 방법론 v1.0은 기관 웹서버에 직접 대량 크롤링을 수행하지 않습니다.
          상용 AI 서비스(OpenAI Responses API + <code>web_search</code>)가 공개 웹을 읽고 생성한 답변과 인용 URL을 기록하며,
          인용된 공식 문서의 실제 존재 여부를 확인할 때만 위 <code>JeongdapNoteBot/1.0</code> 식별자로 단건 확인 요청을 보냅니다.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-gray-50 space-y-2">
            <h3 className="font-bold text-gray-900">수행하는 것 (최소 요청)</h3>
            <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
              <li><code>/robots.txt</code> 규칙 선행 확인 및 100% 준수</li>
              <li>AI 응답이 인용한 공식 URL의 HTTP 응답 상태 및 정본 대조</li>
              <li>동일 호스트 요청 간 최소 {CITED_PAGE_MIN_INTERVAL_MS / 1000}초 이상 간격 유지</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/50 space-y-2 border border-rose-100">
            <h3 className="font-bold text-rose-900">수행하지 않는 것 (절대 금지 · INV-5)</h3>
            <ul className="list-disc list-inside text-xs text-rose-800 space-y-1">
              <li><strong>하위 링크 무차별 크롤링 금지:</strong> 전체 게시판 순회 안 함</li>
              <li><strong>차단 우회 절대 금지:</strong> UA 위장, 프록시 회전, IP 변경, 캡차 우회 일체 금지</li>
              <li><strong>로그인·세션 접근 금지:</strong> 비공개 영역 및 개인정보 수집 안 함</li>
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
          모두의 정답노트는 표준 <code>robots.txt</code> 규약을 100% 준수합니다.
          귀 기관 누리집의 <code>robots.txt</code>에서 <code>User-agent: JeongdapNoteBot</code> (또는 <code>KPlaceLabBot</code>)에 대해
          <code>Disallow: /</code>를 선언하시면 저희 확인 봇은 그 즉시 요청을 중단합니다.
        </p>
      </div>

      {/* 담당자 연락처 */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
        <Mail className="w-4 h-4 text-gray-500" />
        <span>
          기술적 문의나 서버 방화벽 확인이 필요하신 경우:{' '}
          <strong className="text-gray-900 font-mono">contact@jeongdap.kr</strong> (구 <span className="font-mono">contact@kplacelab.kr</span> 수신 유지)
        </span>
      </div>
    </div>
  );
}
