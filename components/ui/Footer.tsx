// components/ui/Footer.tsx
import React from 'react';
import Link from 'next/link';
import { Bot, ShieldCheck, FileCheck2, Scale } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-400 text-xs border-t border-white/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* 상단 5컬럼 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* 브랜드 및 사명 */}
          <div className="space-y-4 md:col-span-2 pr-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 inline-flex items-center justify-center text-navy-950 text-xs font-black">
                정
              </span>
              <span className="tracking-tight">모두의 정답노트</span>
              <span className="text-xs font-normal text-slate-400">(Jeongdap Note)</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              AI가 우리 동네를 제대로 답하는가 — 전국 광역 16 · 기초 227개 지방자치단체와 특별구역에 대해 생성형 AI가 공식 출처를 첫 근거로 인용하고 정확히 답하는지 측정·공표하는 민간 공익 데이터 플랫폼입니다.
            </p>
            <div className="p-3 rounded-lg bg-navy-900/90 border border-white/10 text-[11px] text-slate-300 leading-normal space-y-1">
              <strong className="text-gold-400 font-semibold block">핵심 공표 원칙 (INV-1 · INV-3 · INV-13 · INV-14)</strong>
              <div>• 종합 점수·1~243위 순위표를 만들지 않으며, 공식 근거율과 피해 위험 건수 두 지표만 공표합니다.</div>
              <div>• 광역·기초·특별구역 모집단을 임의 합산하지 않으며, 측정 대상 기관에 정비·컨설팅 상품을 판매하지 않습니다(A원칙).</div>
            </div>
          </div>

          {/* 주요 화면 및 참여 */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3.5">
              측정 화면 및 참여
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/regions" className="hover:text-gold-300 transition-colors">
                  내 지역 찾기 (광역 16 · 기초 227)
                </Link>
              </li>
              <li>
                <Link href="/maps" className="hover:text-gold-300 transition-colors">
                  공식 근거 구간 지도 (3구간)
                </Link>
              </li>
              <li>
                <Link href="/weekly" className="hover:text-gold-300 transition-colors">
                  주간 질문 & 전국 관측 기상도
                </Link>
              </li>
              <li>
                <Link href="/culture" className="hover:text-gold-300 transition-colors">
                  지역 문화 트랙 (탐색적 공익 측정)
                </Link>
              </li>
              <li>
                <Link href="/join" className="hover:text-gold-300 transition-colors">
                  함께하기 (신고판 · 시민 확인단)
                </Link>
              </li>
              <li>
                <Link href="/corrections" className="hover:text-gold-300 transition-colors">
                  판정 정정 및 반론 신청
                </Link>
              </li>
            </ul>
          </div>

          {/* 방법론 및 공시 */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3.5">
              방법론 및 투명성 공시
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/method" className="hover:text-gold-300 transition-colors">
                  측정 방법론 전문 (v1.0)
                </Link>
              </li>
              <li>
                <Link href="/prereg" className="hover:text-gold-300 transition-colors">
                  1차 측정 사전 등록 (INV-11)
                </Link>
              </li>
              <li>
                <Link href="/evidence" className="hover:text-gold-300 transition-colors flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
                  증거 대장 (INV-12)
                </Link>
              </li>
              <li>
                <Link href="/disclosure" className="hover:text-gold-300 transition-colors">
                  이해관계 공시 (A원칙 · D76)
                </Link>
              </li>
              <li>
                <Link href="/cite" className="hover:text-gold-300 transition-colors">
                  인용 가이드
                </Link>
              </li>
              <li>
                <Link href="/press" className="hover:text-gold-300 transition-colors">
                  보도 키트 & 재현 패키지
                </Link>
              </li>
            </ul>
          </div>

          {/* 자가 준수 및 연구 랩 */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3.5">
              자가 준수 & 연구 랩
            </h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>자체 robots.txt 개방 & Sitemap</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>유효 JSON-LD 스키마 준수</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <Bot className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <Link href="/bot" className="hover:text-gold-300 transition-colors">
                  JeongdapNoteBot 수집 사양
                </Link>
              </li>
              <li>
                <Link href="/labs/tech-access" className="hover:text-gold-300 transition-colors">
                  기술 접근성 아카이브 (구 L1)
                </Link>
              </li>
              <li>
                <Link href="/theme-lab" className="hover:text-gold-300 transition-colors">
                  정책테마랩 (K-Policy Lab)
                </Link>
              </li>
              <li>
                <Link href="/equity" className="hover:text-gold-300 transition-colors flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-gold-400" />
                  형평성 측정 (K16)
                </Link>
              </li>
              <li className="pt-1 text-[11px] text-slate-400">
                문의: <span className="font-mono text-slate-300">contact@jeongdap.kr</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 카피라이트 및 정책 */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-400">
          <p>© 2026 모두의 정답노트 (Jeongdap Note · 구 kplacelab). 모든 측정 방법론과 사전 등록 기준은 전문 공개를 원칙으로 합니다.</p>
          <div className="flex items-center gap-4">
            <Link href="/robots.txt" className="hover:text-white transition-colors">
              robots.txt
            </Link>
            <span className="text-white/20">·</span>
            <Link href="/sitemap.xml" className="hover:text-white transition-colors">
              sitemap.xml
            </Link>
            <span className="text-white/20">·</span>
            <Link href="/disclosure" className="hover:text-white transition-colors">
              이해관계 공시
            </Link>
            <span className="text-white/20">·</span>
            <span className="text-slate-400 font-mono">방법론 v1.0 (2026-10)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
