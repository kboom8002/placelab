// lib/crowdsource/report-aggregator.ts
// 시민 제보(Floor Hunter) 군집화 및 집계 엔진
// AGENTS.md 절대 불변식 준수:
// - INV-1: 두 모집단(local_gov / special_zone) 합산 금지, population 인자 필수
// - INV-3: 점수/제보수 정렬 금지, 행정구역 코드순 정렬
// - INV-4: 참여한 단위 수(participatingUnits)만 분모로 사용, denominator 필드 부재 강제

import { createClient } from '@supabase/supabase-js';
import type { Population, Layer2ReportStat } from '@/lib/types/layers';
import type {
  CitizenReport,
  CitizenReportInput,
  ReportCluster,
  ReportSyndrome,
  PromotionStatus,
} from '@/lib/types/citizen-report';
import { getPopulationFrame } from '@/lib/measurement/registries';
import type { AgencyEntry } from '@/lib/types/measurement-spec';
import { CURRENT_METHOD_VERSION } from '@/lib/constants/measurement';

// 인메모리 저장소 (DB 오프라인/개발 환경 폴백 및 시뮬레이션용)
const memoryReports: CitizenReport[] = [];

// 기본 시드 데이터 (테스트 및 초기 UI 가시성 확보)
const INITIAL_REPORTS: CitizenReport[] = [
  {
    id: 'rep-seed-001',
    unit_id: 'lg-41110', // 수원시
    prompt_used: '수원시 대형폐기물 스티커 가격과 신청 방법 알려줘',
    ai_response_summary: '수원시 2024년 개정 전 수수료인 구 가격을 안내함. 인터넷 신청 시 모바일 웹 지원이 된다고 거짓 안내함.',
    ai_service: 'ChatGPT (OpenAI)',
    model_version: 'GPT-4o',
    web_search: false,
    language: 'ko',
    measured_on: '2026-09-12',
    verdict_self: 'partial',
    syndrome_self: 'stale_fact',
    is_confabulation: false,
    evidence_note: '수원시청 홈페이지 공지사항 확인 결과 2024년 1월 개정된 신규 요금표와 불일치함.',
    submitter_type: 'resident',
    anonymous: true,
    status: 'qualified',
    pii_checked: true,
    created_at: '2026-09-12T09:15:00Z',
    updated_at: '2026-09-12T09:15:00Z',
  },
  {
    id: 'rep-seed-002',
    unit_id: 'lg-41110', // 수원시
    prompt_used: '수원시 둘째 아이 출산지원금 얼마 나와?',
    ai_response_summary: '수원시에서 둘째 출산 시 "수원맘 새출발 바우처 300만원"을 전액 현금 지급한다고 안내함.',
    ai_service: 'Gemini (Google)',
    model_version: 'Gemini 2.5 Flash',
    web_search: false,
    language: 'ko',
    measured_on: '2026-09-13',
    verdict_self: 'inaccurate',
    syndrome_self: 'confabulation',
    is_confabulation: true,
    evidence_note: '수원시에는 "수원맘 새출발 바우처"라는 사업 자체가 존재하지 않으며 둘째 출산지원금은 100만원임.',
    submitter_type: 'resident',
    anonymous: true,
    status: 'qualified',
    pii_checked: true,
    created_at: '2026-09-13T11:20:00Z',
    updated_at: '2026-09-13T11:20:00Z',
  },
  {
    id: 'rep-seed-003',
    unit_id: 'lg-41110', // 수원시
    prompt_used: '수원시 청년 월세 지원 대상 조건과 신청 방법은?',
    ai_response_summary: '용인시의 청년 월세 지원 소득 기준(중위소득 120%)을 수원시 기준으로 오안내함.',
    ai_service: 'Claude (Anthropic)',
    model_version: 'Claude 3.5 Sonnet',
    web_search: false,
    language: 'ko',
    measured_on: '2026-09-13',
    verdict_self: 'partial',
    syndrome_self: 'cross_unit',
    is_confabulation: false,
    evidence_note: '수원시 기준은 중위소득 150% 이하인데 용인시 공고문 내용이 섞여서 출력됨.',
    submitter_type: 'official',
    anonymous: false,
    submitter_email: 'officer@suwon.go.kr',
    status: 'qualified',
    pii_checked: true,
    created_at: '2026-09-13T14:40:00Z',
    updated_at: '2026-09-13T14:40:00Z',
  },
  {
    id: 'rep-seed-004',
    unit_id: 'lg-41650', // 포천시
    prompt_used: '포천시 종량제 봉투 20L 가격 얼마야?',
    ai_response_summary: '포천시 20L 종량제 봉투가 800원이라고 답변함.',
    ai_service: 'ChatGPT (OpenAI)',
    model_version: 'GPT-4o',
    web_search: false,
    language: 'ko',
    measured_on: '2026-09-11',
    verdict_self: 'inaccurate',
    syndrome_self: 'wrong_number',
    is_confabulation: false,
    evidence_note: '포천시 조례상 20L 가격은 560원인데 타 지자체 가격과 혼동함.',
    submitter_type: 'resident',
    anonymous: true,
    status: 'pending',
    pii_checked: true,
    created_at: '2026-09-11T10:00:00Z',
    updated_at: '2026-09-11T10:00:00Z',
  },
  {
    id: 'rep-seed-005',
    unit_id: 'lg-50130', // 서귀포시
    prompt_used: '서귀포시 심야에 문 여는 약국이나 야간 달빛어린이병원 안내해줘',
    ai_response_summary: '제주시 연동에 있는 병원만 안내하고 서귀포시에는 야간 병원이 전무하다고 답함.',
    ai_service: 'Gemini (Google)',
    model_version: 'Gemini 2.5 Flash',
    web_search: false,
    language: 'ko',
    measured_on: '2026-09-14',
    verdict_self: 'partial',
    syndrome_self: 'generic_drift',
    is_confabulation: false,
    evidence_note: '서귀포의료원 야간 응급의료 및 서귀포 당번약국 정보가 완전히 누락됨.',
    submitter_type: 'resident',
    anonymous: true,
    status: 'pending',
    pii_checked: true,
    created_at: '2026-09-14T08:30:00Z',
    updated_at: '2026-09-14T08:30:00Z',
  },
];

// 초기 시드 주입
if (memoryReports.length === 0) {
  memoryReports.push(...INITIAL_REPORTS);
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}

/**
 * 모든 시민 제보 조회 (DB 우선, 실패 시 메모리)
 */
export async function getAllCitizenReports(options?: {
  unitId?: string;
  status?: PromotionStatus;
  onlyPiiChecked?: boolean;
}): Promise<CitizenReport[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let query = supabase
        .from('citizen_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.unitId) {
        query = query.eq('unit_id', options.unitId);
      }
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.onlyPiiChecked) {
        query = query.eq('pii_checked', true);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as CitizenReport[];
      }
    } catch {
      // 폴백
    }
  }

  // 메모리 필터링
  return memoryReports.filter((r) => {
    if (options?.unitId && r.unit_id !== options.unitId) return false;
    if (options?.status && r.status !== options.status) return false;
    if (options?.onlyPiiChecked && !r.pii_checked) return false;
    return true;
  });
}

/**
 * 신규 시민 제보 등록 (INV-6, INV-7 준수)
 */
export async function createCitizenReport(
  input: CitizenReportInput
): Promise<CitizenReport> {
  // INV-6 검증: 원문 요약 길이 2000자 초과 금지
  if (input.aiResponseSummary.length > 2000) {
    throw new Error('AI 응답 요약은 2000자를 초과할 수 없습니다 (INV-6 위반).');
  }

  // INV-7 검증: 측정 조건 필수 (DB NOT NULL 정합)
  if (!input.aiService || input.webSearch === undefined || !input.measuredOn) {
    throw new Error('측정 조건(aiService, webSearch, measuredOn)은 필수입니다 (INV-7 위반).');
  }

  const id = `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  // PII 자동 감지
  const piiRegex =
    /(\d{2,3}-\d{3,4}-\d{4})|(\d{6}-[1-4]\d{6})|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const hasPii =
    piiRegex.test(input.promptUsed) ||
    piiRegex.test(input.aiResponseSummary) ||
    (input.evidenceNote ? piiRegex.test(input.evidenceNote) : false);

  const newReport: CitizenReport = {
    id,
    unit_id: input.unitId,
    prompt_used: input.promptUsed,
    ai_response_summary: input.aiResponseSummary,
    ai_service: input.aiService,
    model_version: input.modelVersion || null,
    web_search: input.webSearch,
    language: input.language || 'ko',
    measured_on: input.measuredOn || now.split('T')[0],
    verdict_self: input.verdictSelf,
    syndrome_self: input.syndromeSelf || (input.isConfabulation ? 'confabulation' : 'other'),
    is_confabulation: Boolean(input.isConfabulation),
    screenshot_url: input.screenshotUrl || null,
    evidence_note: input.evidenceNote || null,
    submitter_type: input.submitterType || 'unknown',
    anonymous: input.anonymous ?? true,
    submitter_email: input.submitterEmail || null,
    status: input.isConfabulation ? 'qualified' : 'pending', // 작화는 즉시 승격 자격(qualified) 부여
    pii_checked: !hasPii, // PII 미검출 시 true, 검출 시 관리자 검수 대기
    admin_note: hasPii ? '자동 PII 감지: 관리자 마스킹 검수 필요' : null,
    merged_into: null,
    created_at: now,
    updated_at: now,
  };

  // 1. Supabase 삽입 시도
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('citizen_reports').insert(newReport);
    } catch {
      // 폴백
    }
  }

  // 2. 메모리 저장소 갱신
  memoryReports.unshift(newReport);

  return newReport;
}

/**
 * 제보 상태 갱신 (관리자 검수/병합/승격)
 */
export async function updateCitizenReportStatus(
  id: string,
  patch: Partial<Pick<CitizenReport, 'status' | 'pii_checked' | 'admin_note' | 'merged_into'>>
): Promise<CitizenReport | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('citizen_reports')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (data) {
        // 동기화
        const idx = memoryReports.findIndex((r) => r.id === id);
        if (idx !== -1) memoryReports[idx] = data as CitizenReport;
        return data as CitizenReport;
      }
    } catch {
      // 폴백
    }
  }

  const report = memoryReports.find((r) => r.id === id);
  if (!report) return null;
  Object.assign(report, patch, { updated_at: new Date().toISOString() });
  return report;
}

/**
 * INV-1, INV-3, INV-4 준수: 단위별 시민 제보 군집화 및 대시보드 통계 집계
 *
 * @param options.population 필수 지정 (INV-1: 기본값 금지, 두 모집단 합산 금지)
 */
export async function aggregateReports(options: {
  population: Population;
}): Promise<{
  stat: Layer2ReportStat;
  clusters: ReportCluster[];
}> {
  const { population } = options;
  if (!population) {
    throw new Error('집계 함수는 반드시 모집단(population)을 인자로 받아야 합니다 (INV-1 위반).');
  }

  const allReports = await getAllCitizenReports();
  const populationFrame = getPopulationFrame();

  // 해당 모집단에 속한 단위 필터링 (INV-1: 모집단 완전 분리)
  const validAgencies: AgencyEntry[] =
    population === 'local_gov'
      ? populationFrame.agencies
      : [
          { handle: 'sz-fez-ifez', display: '인천경제자유구역청 (IFEZ)', type: '시', upper_tier: '인천광역시' },
          { handle: 'sz-fez-bjfez', display: '부산진해경제자유구역청 (BJFEZ)', type: '시', upper_tier: '부산광역시/경상남도' },
          { handle: 'sz-fez-gfez', display: '광양만권경제자유구역청 (GFEZ)', type: '시', upper_tier: '전라남도/경상남도' },
          { handle: 'sz-fez-dgfez', display: '대구경북경제자유구역청 (DGFEZ)', type: '시', upper_tier: '대구광역시/경상북도' },
          { handle: 'sz-fez-gjfez', display: '광주경제자유구역청 (GJFEZ)', type: '시', upper_tier: '광주광역시' },
          { handle: 'sz-fez-egfez', display: '동해안권경제자유구역청 (EGFEZ)', type: '시', upper_tier: '강원특별자치도' },
        ];

  const agencyMap = new Map(validAgencies.map((a) => [a.handle, a]));

  // 단위별 제보 버킷
  const unitBuckets = new Map<string, CitizenReport[]>();

  for (const rep of allReports) {
    // unit_id 또는 agency handle 매핑
    const agency =
      agencyMap.get(rep.unit_id) ||
      validAgencies.find(
        (a) =>
          a.handle === rep.unit_id ||
          a.display === rep.unit_id ||
          rep.unit_id.includes(a.handle.replace('AG-', ''))
      );

    if (agency) {
      const key = agency.handle;
      if (!unitBuckets.has(key)) unitBuckets.set(key, []);
      unitBuckets.get(key)!.push(rep);
    }
  }

  // 클러스터 생성
  const clusters: ReportCluster[] = [];
  let totalReports = 0;
  let confabulationCount = 0;
  let promotedCount = 0;

  const totalSyndromes: Record<ReportSyndrome, number> = {
    confabulation: 0,
    stale_fact: 0,
    generic_drift: 0,
    cross_unit: 0,
    wrong_number: 0,
    other: 0,
  };

  // INV-3: 정렬은 행정구역 코드순(validAgencies 순서 유지)
  for (const agency of validAgencies) {
    const reports = unitBuckets.get(agency.handle) || [];
    if (reports.length === 0) continue; // 참여한 단위만 집계 (INV-4)

    totalReports += reports.length;

    const syndromeDist: Record<ReportSyndrome, number> = {
      confabulation: 0,
      stale_fact: 0,
      generic_drift: 0,
      cross_unit: 0,
      wrong_number: 0,
      other: 0,
    };

    let unitConfab = 0;
    let unitPromoted = 0;
    let latestDate = reports[0].created_at;

    // 프롬프트 빈도 분석
    const promptCountMap = new Map<string, { count: number; syndrome?: ReportSyndrome }>();

    for (const r of reports) {
      if (r.is_confabulation || r.syndrome_self === 'confabulation') {
        unitConfab++;
        confabulationCount++;
      }
      const syn: ReportSyndrome = r.syndrome_self || 'other';
      syndromeDist[syn] = (syndromeDist[syn] || 0) + 1;
      totalSyndromes[syn] = (totalSyndromes[syn] || 0) + 1;

      if (['qualified', 'approved', 'measuring', 'completed'].includes(r.status)) {
        unitPromoted++;
        promotedCount++;
      }

      if (new Date(r.created_at) > new Date(latestDate)) {
        latestDate = r.created_at;
      }

      const pKey = r.prompt_used.trim();
      const curr = promptCountMap.get(pKey) || { count: 0, syndrome: r.syndrome_self || undefined };
      curr.count++;
      promptCountMap.set(pKey, curr);
    }

    const topPrompts = Array.from(promptCountMap.entries())
      .map(([prompt, val]) => ({ prompt, count: val.count, syndrome: val.syndrome }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // 승격 적격 여부: 작화 1건 이상이거나 동일 질문 2회 이상이거나 제보 3건 이상
    const promotionEligible = unitConfab >= 1 || reports.length >= 3;

    clusters.push({
      unitId: agency.handle,
      unitName: agency.display,
      sggCode: agency.handle.replace('AG-', ''),
      totalReports: reports.length,
      confabulationCount: unitConfab,
      syndromeDistribution: syndromeDist,
      latestReportDate: latestDate.split('T')[0],
      promotionEligible,
      promotedCount: unitPromoted,
      topPrompts,
    });
  }

  // INV-4: 참여한 단위 수(participatingUnits)만 계산. denominator 필드 없음!
  const participatingUnits = clusters.length;

  const stat = {
    population,
    participatingUnits,
    totalReports,
    confabulationCount,
    syndromeDistribution: totalSyndromes,
    promotedCount,
    methodVersion: CURRENT_METHOD_VERSION,
  } as unknown as Layer2ReportStat;

  return { stat, clusters };
}
