// components/ui/Footer.tsx
import React from 'react';
import Link from 'next/link';
import { Bot, ShieldCheck, FileCheck2, Scale, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-400 text-xs border-t border-white/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* 상단 4컬럼 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* 브랜드 및 사명 */}
          <div className="space-y-4 md:col-span-2 pr-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 inline-flex items-center justify-center text-navy-950 text-xs font-black">
                K
              </span>
              <span className="tracking-tight">kplacelab</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              전국 243개 지방자치단체와 특별구역의 생성형 AI 기술 접근성과 응답 신뢰도를 측정·공개하는 독립 데이터 플랫폼입니다.
            </p>
            <div className="p-3 rounded-lg bg-navy-900/90 border border-white/10 text-[11px] text-slate-300 leading-normal">
              <strong className="text-gold-400 font-semibold block mb-0.5">핵심 공표 원칙</strong>
              본 플랫폼은 순위나 등급을 매기지 않으며(INV-3), 자치단체 243곳과 특별구역을 합산하지 않습니다(INV-1).
            </div>
          </div>

          {/* 측정 및 참여 */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3.5">
              측정 및 참여
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/units" className="hover:text-gold-300 transition-colors">
                  단위 목록 (행정코드순)
                </Link>
              </li>
              <li>
                <Link href="/selfcheck" className="hover:text-gold-300 transition-colors">
                  셀프체크 프롬프트
                </Link>
              </li>
              <li>
                <Link href="/equity" className="hover:text-gold-300 transition-colors flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-gold-400" />
                  형평성 측정 (K16)
                </Link>
              </li>
              <li>
                <Link href="/submit" className="hover:text-gold-300 transition-colors">
                  관측 결과 제출
                </Link>
              </li>
              <li>
                <Link href="/corrections" className="hover:text-gold-300 transition-colors">
                  판정 정정 신청
                </Link>
              </li>
            </ul>
          </div>

          {/* 방법론 및 연구 */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3.5">
              방법론 및 검증
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/method" className="hover:text-gold-300 transition-colors">
                  측정 방법론 전문 (v1.0)
                </Link>
              </li>
              <li>
                <Link href="/evidence" className="hover:text-gold-300 transition-colors flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
                  증거 대장 (INV-12)
                </Link>
              </li>
              <li>
                <Link href="/prereg" className="hover:text-gold-300 transition-colors">
                  사전 등록 내역 (INV-11)
                </Link>
              </li>
              <li>
                <Link href="/cite" className="hover:text-gold-300 transition-colors">
                  인용 가이드
                </Link>
              </li>
              <li>
                <Link href="/press" className="hover:text-gold-300 transition-colors">
                  보도 키트 & 데이터셋
                </Link>
              </li>
            </ul>
          </div>

          {/* 자가 준수 및 규약 */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3.5">
              자가 준수 (AGENTS §7)
            </h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>kplacelab 자체 robots.txt 개방</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>유효 JSON-LD 스키마 준수</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <Bot className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <Link href="/bot" className="hover:text-gold-300 transition-colors">
                  KPlaceLabBot 수집 사양
                </Link>
              </li>
              <li className="pt-2 text-[11px] text-slate-400">
                연구 문의: <span className="font-mono text-slate-300">research@kplacelab.kr</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 카피라이트 및 정책 */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-400">
          <p>© 2026 kplacelab. 모든 측정 방법론과 기준은 전문 공개를 원칙으로 합니다.</p>
          <div className="flex items-center gap-4">
            <Link href="/robots.txt" className="hover:text-white transition-colors">
              robots.txt
            </Link>
            <span className="text-white/20">·</span>
            <Link href="/sitemap.xml" className="hover:text-white transition-colors">
              sitemap.xml
            </Link>
            <span className="text-white/20">·</span>
            <span className="text-slate-400 font-mono">v1.0 (2026-09-05)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
