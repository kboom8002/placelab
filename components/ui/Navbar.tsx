// components/ui/Navbar.tsx
import React from 'react';
import Link from 'next/link';
import { Activity, BookOpen, Quote, Bot, FileText, Send } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* 로고 */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-blue-700 transition-colors">
              K
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-gray-900 tracking-tight leading-none">
                kplacelab
              </span>
              <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase mt-0.5">
                지자체 AI 응답 측정소
              </span>
            </div>
          </Link>

          {/* 메인 네비게이션 */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-600">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-md hover:text-blue-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <Activity className="w-4 h-4" />
              전국 현황
            </Link>
            <Link
              href="/units"
              className="px-3 py-1.5 rounded-md hover:text-blue-600 hover:bg-gray-50 transition-colors"
            >
              단위 목록
            </Link>
            <Link
              href="/selfcheck"
              className="px-3 py-1.5 rounded-md hover:text-blue-600 hover:bg-gray-50 transition-colors"
            >
              셀프체크 프롬프트
            </Link>
            <Link
              href="/method"
              className="px-3 py-1.5 rounded-md hover:text-blue-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" />
              방법론 전문
            </Link>
            <Link
              href="/cite"
              className="px-3 py-1.5 rounded-md hover:text-blue-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <Quote className="w-4 h-4" />
              인용 가이드
            </Link>
            <Link
              href="/press"
              className="px-3 py-1.5 rounded-md hover:text-blue-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              보도 키트
            </Link>
            <Link
              href="/bot"
              className="px-3 py-1.5 rounded-md hover:text-blue-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4" />
              수집기 안내
            </Link>
          </nav>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-3">
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            결과 제출
          </Link>
        </div>
      </div>
    </header>
  );
};
