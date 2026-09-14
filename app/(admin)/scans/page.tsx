'use client';

// app/(admin)/scans/page.tsx
// FR-46: 기술 스캔(robots.txt) 모니터링 및 2주 승격 대시보드
// 불변식: 2주 연속 동일 결과 승격(INV-8), 판정 4분 분리(INV-2), Polite Crawler 준수(INV-5)

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ShieldCheck,
  AlertOctagon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  ExternalLink,
  Search,
} from 'lucide-react';
import clsx from 'clsx';

interface ScanHistoryItem {
  id: string;
  agencyHandle: string;
  agencyName: string;
  domain: string;
  verdict: 'open' | 'blocked_all' | 'blocked_selective' | 'no_file' | 'undetermined';
  undeterminedReason?: string;
  consecutiveWeeks: number;
  promotedToVerdict: boolean;
  lastScannedAt: string;
  rawHash: string;
}

const SAMPLE_SCANS: ScanHistoryItem[] = [
  {
    id: 'SCN-101',
    agencyHandle: 'AG-0001',
    agencyName: '종로구',
    domain: 'www.jongno.go.kr',
    verdict: 'open',
    consecutiveWeeks: 5,
    promotedToVerdict: true,
    lastScannedAt: '2026-09-14 04:12',
    rawHash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65d',
  },
  {
    id: 'SCN-102',
    agencyHandle: 'AG-0023',
    agencyName: '수원특례시',
    domain: 'www.suwon.go.kr',
    verdict: 'blocked_selective',
    consecutiveWeeks: 4,
    promotedToVerdict: true,
    lastScannedAt: '2026-09-14 04:15',
    rawHash: 'sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
  },
  {
    id: 'SCN-103',
    agencyHandle: 'AG-0045',
    agencyName: '논산시',
    domain: 'www.nonsan.go.kr',
    verdict: 'open',
    consecutiveWeeks: 3,
    promotedToVerdict: true,
    lastScannedAt: '2026-09-14 04:18',
    rawHash: 'sha256:8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
  },
  {
    id: 'SCN-104',
    agencyHandle: 'AG-0089',
    agencyName: '증평군',
    domain: 'www.jp.go.kr',
    verdict: 'open',
    consecutiveWeeks: 6,
    promotedToVerdict: true,
    lastScannedAt: '2026-09-14 04:22',
    rawHash: 'sha256:4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
  },
  {
    id: 'SCN-105',
    agencyHandle: 'AG-0199',
    agencyName: 'A군 (임의단위)',
    domain: 'www.sample-county.go.kr',
    verdict: 'undetermined',
    undeterminedReason: 'WAF 403 차단 응답 (HTTP 403 Forbidden)',
    consecutiveWeeks: 1,
    promotedToVerdict: false, // 2주 미충족으로 미승격
    lastScannedAt: '2026-09-14 04:25',
    rawHash: 'sha256:9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c',
  },
];

export default function AdminScansPage() {
  const [scans, setScans] = useState<ScanHistoryItem[]>(SAMPLE_SCANS);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredScans = scans.filter(s =>
    s.agencyName.includes(searchTerm) || s.domain.includes(searchTerm) || s.agencyHandle.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#0a1628] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* 상단 헤더 바 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-navy-900 tracking-wider uppercase block mb-1">
              TECHNICAL SCAN MONITOR (LAYER 1)
            </span>
            <h1 className="text-2xl font-bold text-gray-900">기술 스캔(robots.txt) 모니터링</h1>
            <p className="text-xs text-gray-500 mt-1">
              주간 전수 도메인 스캔 이력 및 2주 연속 동일 결과 판정 승격(INV-8) 현황
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> KPlaceLabBot 가동 정상
            </span>
          </div>
        </div>

        {/* 지표 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-gray-200">
            <span className="text-xs text-gray-400 block mb-1">스캔 완료 도메인</span>
            <span className="text-xl font-bold text-gray-900">243곳 / 243곳</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-gray-200">
            <span className="text-xs text-gray-400 block mb-1">개방 (open)</span>
            <span className="text-xl font-bold text-emerald-700">188곳 (77.4%)</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-gray-200">
            <span className="text-xs text-gray-400 block mb-1">차단 (blocked_*)</span>
            <span className="text-xl font-bold text-rose-700">42곳 (17.3%)</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-gray-200">
            <span className="text-xs text-gray-400 block mb-1">판정 불가 (undetermined)</span>
            <span className="text-xl font-bold text-amber-700">13곳 (5.3%)</span>
          </div>
        </div>

        {/* 규약 준수 상태 알림 바 */}
        <div className="p-4 rounded-xl bg-slate-900 text-white text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-gold-400">
            <Terminal className="w-4 h-4" /> Polite Crawler 준수 규약
          </div>
          <p className="text-slate-300">
            단일 식별자 <code>KPlaceLabBot/1.0</code> 고정 사용 · 최소 요청 간격 5,000ms 준수 · 단일 타임아웃 3,000ms · 
            단발 관측은 공표하지 않으며 <strong>2주 연속 동일 결과일 때만 verdicts로 승격</strong> (INV-8).
          </p>
        </div>

        {/* 스캔 이력 테이블 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
            <h2 className="font-bold text-sm text-gray-900">최근 스캔 관측 로그</h2>
            <div className="relative w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="지자체명, 도메인 검색..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">식별자</th>
                  <th className="py-3 px-4">지자체명</th>
                  <th className="py-3 px-4">도메인</th>
                  <th className="py-3 px-4">판정 결과</th>
                  <th className="py-3 px-4">연속 주수</th>
                  <th className="py-3 px-4">공식 승격 여부 (INV-8)</th>
                  <th className="py-3 px-4">스캔 일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredScans.map(scan => (
                  <tr key={scan.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-gray-600">{scan.agencyHandle}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{scan.agencyName}</td>
                    <td className="py-3 px-4 text-gray-500 font-mono">{scan.domain}</td>
                    <td className="py-3 px-4">
                      <span className={clsx(
                        "px-2 py-0.5 rounded text-[11px] font-bold font-mono",
                        scan.verdict === 'open' ? "bg-emerald-100 text-emerald-800" :
                        scan.verdict.startsWith('blocked') ? "bg-rose-100 text-rose-800" :
                        "bg-amber-100 text-amber-800"
                      )}>
                        {scan.verdict}
                      </span>
                      {scan.undeterminedReason && (
                        <span className="block text-[10px] text-amber-800 mt-0.5">
                          {scan.undeterminedReason}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">{scan.consecutiveWeeks}주</td>
                    <td className="py-3 px-4">
                      {scan.promotedToVerdict ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 승격 완료 (verdicts)
                        </span>
                      ) : (
                        <span className="text-gray-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> 2주 관측 대기 중
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-400 font-mono">{scan.lastScannedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
