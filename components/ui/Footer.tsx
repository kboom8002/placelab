// components/ui/Footer.tsx
import React from 'react';
import Link from 'next/link';
import { Bot, Shield, FileCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 text-xs border-t border-gray-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 브랜드 및 원칙 */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <span className="w-5 h-5 rounded bg-blue-600 inline-flex items-center justify-center text-xs">
                K
              </span>
              kplacelab
            </div>
            <p className="text-gray-400 max-w-sm leading-relaxed">
              전국 243개 지방자치단체와 특별구역의 생성형 AI 기술 접근성과 응답 품질을 독립적으로 측정·추적하는 공공 플랫폼입니다.
            </p>
            <div className="text-[11px] text-gray-500">
              * 본 플랫폼은 순위표를 만들지 않으며, 두 모집단(지자체/특별구역)을 임의 합산하지 않습니다.
            </div>
          </div>

          {/* 주요 링크 */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              문서 및 가이드
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/method" className="hover:text-white transition-colors">
                  측정 방법론 전문 (v1.0)
                </Link>
              </li>
              <li>
                <Link href="/cite" className="hover:text-white transition-colors">
                  올바른 인용 가이드
                </Link>
              </li>
              <li>
                <Link href="/press" className="hover:text-white transition-colors">
                  보도 키트 & CSV 다운로드
                </Link>
              </li>
              <li>
                <Link href="/bot" className="hover:text-white transition-colors flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5 text-blue-400" />
                  수집기 안내 (KPlaceLabBot)
                </Link>
              </li>
            </ul>
          </div>

          {/* 규약 및 준수 */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              신뢰와 자가 준수
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5 text-gray-400">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>robots.txt 완전 개방</span>
              </li>
              <li className="flex items-center gap-1.5 text-gray-400">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>자체 JSON-LD 검증 통과</span>
              </li>
              <li className="pt-2 text-[11px] text-gray-500">
                문의: <span className="font-mono text-gray-400">contact@kplacelab.kr</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px]">
          <p>© 2026 kplacelab. 모든 측정 방법론은 전문 공개를 원칙으로 합니다.</p>
          <div className="flex gap-4">
            <Link href="/robots.txt" className="hover:underline">
              robots.txt
            </Link>
            <Link href="/sitemap.xml" className="hover:underline">
              sitemap.xml
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
