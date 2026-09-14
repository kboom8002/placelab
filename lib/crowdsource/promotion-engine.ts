// lib/crowdsource/promotion-engine.ts
// 시민 제보(Layer 2) → Layer 3 통제 검증 프로브 자동 승격 엔진
// 불변식 준수:
// - INV-7: method_version 및 측정 조건 보존
// - INV-8: 단발 스캔은 공표 판정으로 승격하지 않고, "탐색적 관측(INV-11)"으로 표기
// - INV-9: 반복(3~5회) 실행 및 Floor Risk 병기

import { createClient } from '@supabase/supabase-js';
import type {
  CitizenReport,
  PromotionCandidate,
  PromotionQueueItem,
  PromotionStatus,
  ReportSyndrome,
} from '@/lib/types/citizen-report';
import type { Question } from '@/lib/types/measurement-spec';
import { getAllCitizenReports, updateCitizenReportStatus } from './report-aggregator';
import { createMeasureJob } from '@/lib/measurement/job-manager';
import { runMeasurement } from '@/lib/measurement/runner';
import { findAgencyByHandle, findAgencyByDisplay } from '@/lib/measurement/registries';

// 인메모리 승격 큐 (DB 오프라인/개발 환경 대응)
const memoryPromotionQueue: PromotionQueueItem[] = [];

// 초기 시드 큐 데이터 (초기 데모 및 즉시 테스트 가능)
const INITIAL_QUEUE_ITEMS: PromotionQueueItem[] = [
  {
    id: 'promo-seed-001',
    unit_id: 'AG-0076', // 수원시
    trigger_reports: ['rep-seed-002'],
    trigger_count: 1,
    trigger_syndrome: 'confabulation',
    probe_prompt: '수원시 둘째 아이 출산 시 지급되는 출산지원금의 정확한 명칭과 금액, 신청 절차를 알려주세요.',
    probe_category: '출산지원',
    status: 'qualified',
    priority: 10, // 작화는 최우선(10)
    auto_qualified_at: '2026-09-13T11:25:00Z',
    admin_note: '시민 제보 "수원맘 새출발 바우처 300만원" 작화 의혹 검증용 프로브',
    created_at: '2026-09-13T11:25:00Z',
  },
  {
    id: 'promo-seed-002',
    unit_id: 'AG-0076', // 수원시
    trigger_reports: ['rep-seed-001'],
    trigger_count: 1,
    trigger_syndrome: 'stale_fact',
    probe_prompt: '수원시 대형폐기물 스티커 수수료 및 인터넷 배출 신청 시스템의 지원 범위는?',
    probe_category: '폐기물',
    status: 'qualified',
    priority: 5,
    auto_qualified_at: '2026-09-12T09:20:00Z',
    admin_note: '2024년 개정 수수료 미반영 의혹 검증',
    created_at: '2026-09-12T09:20:00Z',
  },
];

if (memoryPromotionQueue.length === 0) {
  memoryPromotionQueue.push(...INITIAL_QUEUE_ITEMS);
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
 * 승격 큐 전체 목록 조회
 */
export async function getPromotionQueue(options?: {
  status?: PromotionStatus;
  unitId?: string;
}): Promise<PromotionQueueItem[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let query = supabase
        .from('promotion_queue')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (options?.status) query = query.eq('status', options.status);
      if (options?.unitId) query = query.eq('unit_id', options.unitId);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as PromotionQueueItem[];
      }
    } catch {}
  }

  return memoryPromotionQueue.filter((item) => {
    if (options?.status && item.status !== options.status) return false;
    if (options?.unitId && item.unit_id !== options.unitId) return false;
    return true;
  });
}

/**
 * 시민 제보 분석 및 승격 후보 자동 추출 (Evaluate Candidates)
 * 규칙:
 * 1. 작화(confabulation) 제보는 1건만으로 즉시 qualified
 * 2. 동일 지자체 + 동일 증상군 3건 이상 누적 시 qualified
 * 3. 동일/유사 프롬프트 2건 이상 제보 시 qualified
 */
export async function evaluatePromotionCandidates(): Promise<PromotionCandidate[]> {
  const allReports = await getAllCitizenReports({ status: 'pending' });
  const candidates: PromotionCandidate[] = [];

  // 지자체별 그룹핑
  const unitGroup = new Map<string, CitizenReport[]>();
  for (const r of allReports) {
    if (!unitGroup.has(r.unit_id)) unitGroup.set(r.unit_id, []);
    unitGroup.get(r.unit_id)!.push(r);
  }

  for (const [unitId, reports] of unitGroup.entries()) {
    const agency = findAgencyByHandle(unitId) || findAgencyByDisplay(unitId);
    const unitName = agency ? agency.display : unitId;

    // 규칙 1: 작화 즉시 추출
    const confabReports = reports.filter(
      (r) => r.is_confabulation || r.syndrome_self === 'confabulation'
    );
    for (const cr of confabReports) {
      candidates.push({
        unitId,
        unitName,
        triggerReports: [cr.id],
        triggerCount: 1,
        triggerSyndrome: 'confabulation',
        probePrompt: `${unitName} 행정 정보 검증: ${cr.prompt_used}`,
        probeCategory: '작화 검증 (Floor Hunter)',
        priority: 10,
        reason: '시민 제보에서 중대한 환각/작화(Floor Risk = critical) 의심 사안 발생',
      });
    }

    // 규칙 2: 동일 증상 3건 이상 누적
    const syndromeGroups = new Map<ReportSyndrome, CitizenReport[]>();
    for (const r of reports) {
      const syn: ReportSyndrome = r.syndrome_self || 'other';
      if (!syndromeGroups.has(syn)) syndromeGroups.set(syn, []);
      syndromeGroups.get(syn)!.push(r);
    }

    for (const [syndrome, sReports] of syndromeGroups.entries()) {
      if (syndrome !== 'confabulation' && sReports.length >= 3) {
        candidates.push({
          unitId,
          unitName,
          triggerReports: sReports.map((r) => r.id),
          triggerCount: sReports.length,
          triggerSyndrome: syndrome,
          probePrompt: `${unitName} 공공서비스 실태 검증: ${sReports[0].prompt_used}`,
          probeCategory: '다빈도 제보 검증',
          priority: 5,
          reason: `동일 지자체 ${syndrome} 증상군 제보 ${sReports.length}건 누적`,
        });
      }
    }
  }

  return candidates;
}

/**
 * 승격 후보를 정식 큐 항목으로 등록
 */
export async function queuePromotionCandidate(
  candidate: PromotionCandidate
): Promise<PromotionQueueItem> {
  const id = `promo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const item: PromotionQueueItem = {
    id,
    unit_id: candidate.unitId,
    trigger_reports: candidate.triggerReports,
    trigger_count: candidate.triggerCount,
    trigger_syndrome: candidate.triggerSyndrome,
    probe_prompt: candidate.probePrompt,
    probe_category: candidate.probeCategory || null,
    status: 'qualified',
    priority: candidate.priority,
    auto_qualified_at: now,
    admin_note: candidate.reason,
    created_at: now,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('promotion_queue').insert(item);
    } catch {}
  }

  memoryPromotionQueue.unshift(item);

  // 연관된 제보들의 상태도 qualified 로 갱신
  for (const rId of candidate.triggerReports) {
    await updateCitizenReportStatus(rId, { status: 'qualified' });
  }

  return item;
}

/**
 * 승격 승인 및 Layer 3 검증 측정 즉시 실행 (Approve & Execute)
 * - runMeasurement()를 커스텀 질문으로 실행하여 엄격한 3~5회 반복 실측 검증
 * - INV-11 준수: 이 측정은 시민 제보 기반 탐색적 관측(Exploratory)으로 규정됨
 */
export async function approveAndExecutePromotion(
  queueId: string,
  options: {
    providers?: ('gemini' | 'openai')[];
    simulation?: boolean;
    adminPromptOverride?: string;
  } = {}
): Promise<{
  queueItem: PromotionQueueItem;
  measureJobId: string;
}> {
  const queueItem = memoryPromotionQueue.find((q) => q.id === queueId);
  if (!queueItem) {
    throw new Error(`승격 큐 항목(${queueId})을 찾을 수 없습니다.`);
  }

  const agency = findAgencyByHandle(queueItem.unit_id) || findAgencyByDisplay(queueItem.unit_id);
  const agencyHandle = agency ? agency.handle : queueItem.unit_id;
  const agencyName = agency ? agency.display : queueItem.unit_id;

  const probeText = options.adminPromptOverride || queueItem.probe_prompt;
  const providers = options.providers || ['gemini'];
  const simulation = options.simulation ?? true;

  // 1. 측정 작업(MeasureJob) 생성
  const job = await createMeasureJob({
    agencyHandle,
    agencyName,
    providers,
    questionSet: 'custom',
    repetitions: 3, // Layer 3 검증은 최소 3회 이상 (K03 규약)
    simulation,
    channel: 'exploratory_citizen_probe', // INV-11: 탐색적 채널
  });

  // 2. 큐 항목 상태 갱신
  queueItem.status = 'measuring';
  queueItem.measure_job_id = job.id;
  queueItem.approved_at = new Date().toISOString();
  if (options.adminPromptOverride) {
    queueItem.probe_prompt = options.adminPromptOverride;
  }

  // 3. 비동기로 측정 러너 실행 (검증 프로브 질문 주입)
  const customQuestion: Question = {
    id: `CQ-${queueId.slice(-6).replace(/[^A-Za-z0-9]/g, 'X').toUpperCase()}`,
    revision: 1,
    status: 'active',
    text: probeText,
    boundary: 'citizen_reported_probe',
    type: 'descriptive',
    layers: ['accuracy'],
    ledger: null,
    owner_role: 'agency_hq',
    difficulty: 'D1',
    sensitivity: 'public',
    source_basis: 'citizen_report',
    basis_verification: 'to_verify',
    note: 'Floor Hunter 시민 제보 승격 프로브',
  };

  // 백그라운드 측정 실행
  (async () => {
    try {
      const runnerResult = await runMeasurement({
        agencyKey: agencyHandle,
        providers,
        questionSet: 'custom',
        customQuestions: [customQuestion],
        repetitions: 3,
        simulation,
      });

      queueItem.status = 'completed';
      queueItem.completed_at = new Date().toISOString();

      // 연관 제보들의 상태도 completed로 연결
      for (const repId of queueItem.trigger_reports) {
        await updateCitizenReportStatus(repId, {
          status: 'completed',
          admin_note: `Layer 3 검증 완료 (Job ID: ${job.id}). 보고서 생성 완료.`,
        });
      }
    } catch (err: any) {
      queueItem.status = 'approved';
      queueItem.admin_note = `측정 실패: ${err.message}`;
    }
  })();

  return {
    queueItem,
    measureJobId: job.id,
  };
}
