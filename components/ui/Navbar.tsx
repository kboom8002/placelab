'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BookOpen,
  FileCheck2,
  FileText,
  Send,
  Scale,
  Menu,
  X,
  ChevronDown,
  Compass,
  MapPin,
  Map,
  Calendar,
  Landmark,
  Users,
  ShieldAlert,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [labsMenuOpen, setLabsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { href: '/', label: '홈', icon: Activity },
    { href: '/regions', label: '내 지역 찾기', icon: MapPin },
    { href: '/maps', label: '공식 근거 구간 지도', icon: Map },
    { href: '/weekly', label: '주간 질문', icon: Calendar },
    { href: '/culture', label: '지역 문화 트랙', icon: Landmark },
    { href: '/join', label: '함께하기', icon: Users },
  ];

  const moreLinks = [
    { href: '/method', label: '방법론 전문 (v1.0)', icon: BookOpen, desc: '출처 4단 · 공급 공백 · 안정성 규칙' },
    { href: '/prereg', label: '1차 측정 사전 등록 (INV-11)', icon: FileText, desc: 'H1~H5 가설 · 반증 조건 · 중단 규칙' },
    { href: '/evidence', label: '증거 대장 (INV-12)', icon: FileCheck2, desc: '주장 및 정책 예외(P-1) 등록부' },
    { href: '/disclosure', label: '이해관계 공시 (A원칙)', icon: ShieldAlert, desc: '측정 대상 정비 상품 판매·무상 제공 금지' },
    { href: '/cite', label: '인용 가이드', desc: '공공 인용 및 보도 표기 지침' },
    { href: '/press', label: '보도 키트', desc: '팩트시트 및 보도자료' },
    { href: '/bot', label: '수집기 안내', desc: 'JeongdapNoteBot / KPlaceLabBot 병기' },
  ];

  const labsLinks = [
    { href: '/labs/tech-access', label: '기술 접근성 아카이브 (구 L1)', icon: Activity, desc: '2026-09 기준 robots.txt 5분 판정 보존본' },
    { href: '/units', label: '단위 목록 (행정코드순)', desc: '광역 16 · 기초 227 · 특별구역 분리 조회' },
    { href: '/theme-lab', label: '정책테마랩 (K-Policy Lab)', icon: Compass, desc: '시민 질문 수집 및 주간 질문 제안 연계' },
    { href: '/equity', label: '형평성 측정 (K16)', icon: Scale, desc: '다국어·수혜 대상별 응답 격차 연구' },
    { href: '/selfcheck', label: '셀프체크 도구', desc: '표준 문항 직접 확인 도구' },
  ];

  return (
    <header className="sticky top-0 z-50 glass-nav border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* 브랜드 로고 */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-300 via-gold-500 to-gold-600 flex items-center justify-center text-navy-950 font-black text-base shadow-sm group-hover:scale-105 transition-all">
              정
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white group-hover:text-gold-300 transition-colors">
                모두의 정답노트
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider">
                AI가 우리 동네를 제대로 답하는가
              </span>
            </div>
          </Link>

          {/* 데스크톱 주 내비게이션 */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
                    active
                      ? 'bg-white/10 text-gold-400 font-semibold shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {link.label}
                </Link>
              );
            })}

            {/* 방법론·증거 드롭다운 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setMoreMenuOpen(!moreMenuOpen);
                  setLabsMenuOpen(false);
                }}
                onBlur={() => setTimeout(() => setMoreMenuOpen(false), 200)}
                className={`px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1 text-slate-300 hover:text-white hover:bg-white/5 ${
                  moreMenuOpen ? 'bg-white/10 text-white' : ''
                }`}
              >
                <span>방법론·공시</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-navy-900 border border-white/15 rounded-xl shadow-2xl p-2 z-50 animate-fade-in-up">
                  <div className="text-[11px] font-semibold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                    방법론 · 사전등록 · 이해관계 공시
                  </div>
                  <div className="space-y-0.5">
                    {moreLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                        onClick={() => setMoreMenuOpen(false)}
                      >
                        <div className="text-xs font-medium text-slate-100 flex items-center gap-1.5">
                          {item.icon && <item.icon className="w-3.5 h-3.5 text-gold-400" />}
                          {item.label}
                        </div>
                        {item.desc && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 연구 랩 · 아카이브 드롭다운 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setLabsMenuOpen(!labsMenuOpen);
                  setMoreMenuOpen(false);
                }}
                onBlur={() => setTimeout(() => setLabsMenuOpen(false), 200)}
                className={`px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1 text-slate-300 hover:text-white hover:bg-white/5 ${
                  labsMenuOpen ? 'bg-white/10 text-white' : ''
                }`}
              >
                <span>연구 랩</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${labsMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {labsMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-navy-900 border border-white/15 rounded-xl shadow-2xl p-2 z-50 animate-fade-in-up">
                  <div className="text-[11px] font-semibold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                    연계 연구 랩 & 보존 아카이브
                  </div>
                  <div className="space-y-0.5">
                    {labsLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                        onClick={() => setLabsMenuOpen(false)}
                      >
                        <div className="text-xs font-medium text-slate-100 flex items-center gap-1.5">
                          {item.icon && <item.icon className="w-3.5 h-3.5 text-gold-400" />}
                          {item.label}
                        </div>
                        {item.desc && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* 우측 액션 영역 */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/report"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-navy-950 bg-gradient-to-r from-gold-400 to-gold-500 rounded-lg shadow-sm hover:from-gold-300 hover:to-gold-400 transition-all hover:shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            AI 오답 신고
          </Link>

          {/* 모바일 햄버거 토글 */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            aria-label="메뉴 열기"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 모바일 드로어 메뉴 */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-navy-950 border-b border-white/10 px-4 py-4 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                  isActive(link.href)
                    ? 'bg-white/15 text-gold-400 font-semibold'
                    : 'text-slate-200 hover:bg-white/5'
                }`}
              >
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
              방법론 · 사전등록 · 공시
            </div>
            <div className="space-y-1 mt-1">
              {moreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/5"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
              연계 연구 랩 · 아카이브
            </div>
            <div className="space-y-1 mt-1">
              {labsLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/5"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
