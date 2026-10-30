// app/(public)/method/page.tsx
// FR-8 & FR-80~84: 모두의 정답노트 측정 방법론 v1.0 전문 공개 (로그인 불필요)
import React from 'react';
import type { Metadata } from 'next';
import { CURRENT_METHOD_VERSION } from '@/lib/constants/measurement';
import {
  SCANNER_UA,
  LEGACY_SCANNER_UA,
  SCAN_TIMEOUT_MS,
  CITED_PAGE_MIN_INTERVAL_MS,
} from '@/lib/constants/scanner';
import {
  BAND_META,
  WINDOW_STATE_META,
  STABILITY_TOTAL_RUNS,
  STABILITY_MAX_DIFF_FROM_MODE,
} from '@/lib/jeongdap';
import { SourceNote } from '@/components/ui/SourceNote';
import {
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  Scale,
  AlertOctagon,
  Terminal,
  Database,
} from 'lucide-react';

export const metadata: Metadata = {
  title: '측정 방법론 명세서 v1.0 — 모두의 정답노트',
  description:
    '모두의 정답노트(Jeongdap Note)의 출처 4단(S1~S4), 공급 공백 이중 분모, 2대 공개 지표(공식 근거율·피해 위험), 9회 반복 안정성 및 4주 12회 창 상태 규칙 전문',
};

export default function MethodPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-16">
      {/* 1. 헤더 */}
      <div className="space-y-4 border-b border-slate-200/80 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-gold-400 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5 text-gold-400" />
          PUBLIC METHODOLOGY SPECIFICATION · {CURRENT_METHOD_VERSION}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-navy-950 tracking-tight leading-tight">
          모두의 정답노트 측정 방법론 명세서
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
          모두의 정답노트(Jeongdap Note)의 모든 측정 기준과 판정 규칙은 로그인 없이 투명하게 전문 공개됩니다.
          종합 점수나 순위를 매기지 않으며, 공식 문서 정본(Canonical Fact)과 AI 응답 인용·내용을 대조합니다.
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-mono pt-2">
          <span>제정: 2026-09-01</span>
          <span>·</span>
          <span>개정: 2026-10-17 (방법론 v1.0 · 자체 사업 D103 반영)</span>
          <span>·</span>
          <span className="text-navy-700 font-semibold">책임: 모두의 정답노트 연구팀</span>
        </div>
      </div>

      {/* 2. 출처 4단 (S1~S4) 및 공급 공백 분리 */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-gold-600">01 / SOURCE 4-STAGE & SUPPLY GAP</div>
          <h2 className="text-2xl font-bold text-navy-950 flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-navy-800" />
            출처 4단 (S1~S4) 판정 및 공급 공백 이중 분모
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            AI가 오답을 내는 원인이 「검색 노출 실패」인지, 「공식 문서 미선택」인지, 「내용 왜곡」인지, 혹은 지자체가 웹에 공식 문서를 올리지 않은 「공급 공백」인지 4단계로 분리합니다.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-editorial">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-5">단계</th>
                <th className="py-3.5 px-5">명칭</th>
                <th className="py-3.5 px-5">기계 및 사람 판정 기준</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              <tr>
                <td className="py-3.5 px-5 font-mono font-bold text-navy-900">S1</td>
                <td className="py-3.5 px-5 font-bold text-slate-800">검색 후보에 뜸</td>
                <td className="py-3.5 px-5 text-slate-600">
                  <code>web_search_call.action.sources</code> 검색 후보 목록에 해당 지자체·국가 공식 도메인(<code>*.go.kr</code>, <code>*.korea.kr</code>, <code>*.or.kr</code>, 기관 공식 누리집)이 1개 이상 등장
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-mono font-bold text-blue-700">S2</td>
                <td className="py-3.5 px-5 font-bold text-blue-800">AI가 읽고 인용함</td>
                <td className="py-3.5 px-5 text-slate-600">
                  최종 답변의 <code>url_citation</code> 인용 목록 안에 공식 도메인이 1개 이상 포함됨 (네이버 블로그·카페·나무위키·위키백과·브런치·티스토리 제외)
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-mono font-bold text-emerald-700">S3</td>
                <td className="py-3.5 px-5 font-bold text-emerald-800">첫 근거가 됨 (공식 근거율)</td>
                <td className="py-3.5 px-5 text-slate-600">
                  최종 답변의 <strong>첫 번째 인용(<code>citations[0]</code>)</strong>이 공식 도메인임. 헤드라인 「공식 근거율」의 분자
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-mono font-bold text-purple-700">S4</td>
                <td className="py-3.5 px-5 font-bold text-purple-800">내용이 맞음</td>
                <td className="py-3.5 px-5 text-slate-600">
                  정답 원장(Ledger)의 핵심 숫자·날짜·요지와 일치하는지 대조 (기계 1차: 맞음 후보 / 다름 후보 / 보류 → 사람 전수 확정: 맞음 / 일부만 맞음 / 틀림 / 대조 불가)
                </td>
              </tr>
              <tr className="bg-amber-50/50">
                <td className="py-3.5 px-5 font-mono font-bold text-amber-800">분모 분리</td>
                <td className="py-3.5 px-5 font-bold text-amber-900">공급 공백 · 해당없음</td>
                <td className="py-3.5 px-5 text-amber-900">
                  지자체 공식 웹에 문서 자체가 없는 <strong>공급 공백(Supply Gap)</strong>과 법제상 소관이 아닌 <strong>해당없음(Not Applicable)</strong>은 공식 근거율 분모에서 제외하고 별도 건수로 병기합니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. 2대 공개 지표와 3구간 밴드 지도 */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-gold-600">02 / TWO PUBLIC METRICS & 3-BAND MAP</div>
          <h2 className="text-2xl font-bold text-navy-950 flex items-center gap-2.5">
            <AlertOctagon className="w-6 h-6 text-rose-600" />
            2대 공개 지표와 3구간 가나다순 표기 (INV-3 · INV-13)
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            모두의 정답노트는 가중합 종합 점수나 1~243위 순위표를 절대 만들지 않습니다(ADR-0017).
            모든 화면은 <strong>① 공식 근거율(S3 비율)</strong>과 <strong>② 피해 위험 건수</strong> 두 지표만 나란히 제시합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.values(BAND_META).map((band) => (
            <div key={band.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-navy-950">
                  {band.shape} {band.label_ko}
                </span>
                <span className="text-[11px] font-mono text-slate-400">{band.id}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{band.description}</p>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                구간 내부 정렬: <strong>가나다순 고정</strong> (순위 번호 미부여)
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 안정성 규칙: 9회 반복 블록 & 4주 12회 창 상태 */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-gold-600">03 / STABILITY RULES (ADR-0024)</div>
          <h2 className="text-2xl font-bold text-navy-950 flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            측정 대상별 이원 안정성 규칙 (단발 관측 공표 금지 · INV-8)
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            AI 응답은 실행할 때마다 흔들립니다. 단 1회 질문한 결과로 지자체를 평가하지 않으며, 측정 트랙에 따라 다음 두 가지 안정성 규칙을 강제합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
              트랙 A · 기준 단위 정밀 측정 (5곳 패널)
            </span>
            <h3 className="text-base font-bold text-navy-950">
              3일 × 하루 3회 = {STABILITY_TOTAL_RUNS}회 반복 블록 안정성
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              동일 문항을 아침·점심·저녁 3회씩 3일간 총 {STABILITY_TOTAL_RUNS}회 질문합니다.
              {STABILITY_TOTAL_RUNS}회 중 최빈 판정(다수결)과 다른 횟수가 <strong>{STABILITY_MAX_DIFF_FROM_MODE}회 이하(≥7/{STABILITY_TOTAL_RUNS} 일치)</strong>일 때만 안정 판정으로 인정하며,
              3회 이상 흔들리는 문항은 「불안정(판정 보류)」으로 분류하고 사람 판정 대기열로 보냅니다.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              트랙 B · 주간 상시 관측 (전국 기상도)
            </span>
            <h3 className="text-base font-bold text-navy-950">
              최근 4주 12회 창 상태 (Window State)
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {Object.values(WINDOW_STATE_META).map((ws) => (
                <li key={ws.state}>
                  • <strong>{ws.shape} {ws.label} ({ws.rule_summary}):</strong>{' '}
                  {ws.public_list_allowed ? '공개 카드에 등장 지역으로 표기' : '공개 등장 목록에서 제외 (INV-15)'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5. 자체 사업 공표 게이트 (ADR-0016) */}
      <section className="space-y-4">
        <div className="space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-gold-600">04 / PUBLICATION GATE (ADR-0016)</div>
          <h2 className="text-2xl font-bold text-navy-950 flex items-center gap-2.5">
            <Database className="w-6 h-6 text-navy-800" />
            민간 공익 자체 사업 공표 게이트 및 상시 반론권
          </h2>
        </div>

        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <p>
            모두의 정답노트는 지자체 위탁이나 사전 승인에 의존하지 않는 <strong>민간 공익 자체 사업(D103)</strong>입니다.
            따라서 구 설계의 「기관 14일 사전 통지 및 엠바고 게이트」를 두지 않으며, 다음 3대 공표 게이트를 통과한 즉시 공개합니다:
          </p>
          <ol className="list-decimal list-inside space-y-1 font-medium text-navy-950">
            <li>사전 등록 완료 여부 (<code>INV-11</code>: 가설·반증 조건·중단 규칙 선행 공개)</li>
            <li>사람 검증 및 운영자 승인 완료 여부 (고위험 문항 2인 독립 판정)</li>
            <li>재난·안전 비공개 예외 해당 여부 (<code>INV-16</code>: 대피소·응급의료·재난연락처 구체 오답 사례는 기관 통보 후 7일 유예)</li>
          </ol>
          <p className="text-xs text-slate-500 pt-1">
            * 모든 지자체 담당자와 시민은 공표 이후 언제든지 <a href="/corrections" className="underline font-semibold text-navy-800">정정·반론 신청(/corrections)</a> 및 정비 사건 등록을 통해 재측정을 요청할 수 있습니다.
          </p>
        </div>
      </section>

      {/* 6. 예의 있는 수집 규약 (Polite Crawler) */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-gold-600">05 / CRAWLER & VERIFICATION BOT POLICY</div>
          <h2 className="text-2xl font-bold text-navy-950 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-navy-800" />
            예의 있는 인용 확인 규약 (INV-5)
          </h2>
        </div>

        <div className="bg-navy-950 text-slate-200 p-6 sm:p-7 rounded-2xl border border-white/10 shadow-xl space-y-4 font-mono text-xs">
          <div className="flex items-center gap-2 text-gold-400 font-sans font-bold text-sm border-b border-white/10 pb-3">
            <Terminal className="w-4 h-4" />
            JeongdapNoteBot 절대 규약 (구 KPlaceLabBot 12주 병기)
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-slate-400">표준 User-Agent 식별자</span>
              <div className="text-white font-bold p-2 bg-white/5 rounded-lg border border-white/5 break-all">
                {SCANNER_UA}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400">구 식별자 (12주 병기)</span>
              <div className="text-slate-300 p-2 bg-white/5 rounded-lg border border-white/5 break-all">
                {LEGACY_SCANNER_UA}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400">인용 페이지 확인 최소 간격</span>
              <div className="text-white font-bold p-2 bg-white/5 rounded-lg border border-white/5">
                {CITED_PAGE_MIN_INTERVAL_MS} ms (동일 호스트 1.5초 이상 지연)
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400">단일 요청 타임아웃</span>
              <div className="text-white font-bold p-2 bg-white/5 rounded-lg border border-white/5">
                {SCAN_TIMEOUT_MS} ms
              </div>
            </div>
          </div>
        </div>
      </section>

      <SourceNote
        date="2026-10-17"
        version={CURRENT_METHOD_VERSION}
        sourceText="모두의 정답노트 측정 방법론 v1.0 (01_measurement-methodology-v1.0.md) 및 ADR-0013~0024"
      />
    </div>
  );
}
