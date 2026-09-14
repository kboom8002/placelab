// lib/types/citizen-report.ts
// Layer 2 시민 제보(Floor Hunter) 및 승격 엔진 타입 정의 (INV-4, INV-6, INV-7)

import type { Accuracy, Population, SubmitterType } from '@/lib/types/layers';

export type ReportSyndrome =
  | 'confabulation'   // 작화: 없는 제도·창구를 있다고 안내 (Floor Risk = critical)
  | 'stale_fact'      // 정보 고착: 과거 시점 정보 고정
  | 'generic_drift'   // 일반론 표류: 지역 고유 정보 없음
  | 'cross_unit'      // 타 단위 혼입: 다른 지자체 정보
  | 'wrong_number'    // 숫자 오류: 금액·기한·횟수 틀림
  | 'other';          // 기타

export const REPORT_SYNDROME_LABELS: Record<ReportSyndrome, { label: string; desc: string; color: string }> = {
  confabulation: {
    label: '작화 (존재하지 않는 정보 날조)',
    desc: '없는 제도, 가상의 창구, 존재하지 않는 지원금을 사실처럼 꾸며낸 경우 (최고 위험)',
    color: 'rose',
  },
  stale_fact: {
    label: '정보 고착 (오래된 과거 정보)',
    desc: '폐지되었거나 개편 이전의 과거 기준/금액을 최신 정보인 양 안내한 경우',
    color: 'amber',
  },
  generic_drift: {
    label: '일반론 표류 (지자체 고유정보 부재)',
    desc: '해당 시군구의 실제 정책 대신 "일반적인 지자체의 경우..." 수준으로 두루뭉술 답한 경우',
    color: 'slate',
  },
  cross_unit: {
    label: '타 단위 혼입 (다른 지역 정보)',
    desc: '이름이 비슷하거나 인접한 다른 시군구의 조례/지원 사업을 우리 지역 것으로 제시한 경우',
    color: 'indigo',
  },
  wrong_number: {
    label: '핵심 숫자 오류',
    desc: '방향은 맞으나 지원금 액수, 감면 비율, 신청 기한, 배출 요일 등의 숫자가 틀린 경우',
    color: 'orange',
  },
  other: {
    label: '기타 오류',
    desc: '기타 부정확하거나 오해를 유발하는 답변',
    color: 'zinc',
  },
};

export type PromotionStatus =
  | 'pending'     // 제보 접수, 검토 전
  | 'qualified'   // 승격 요건 충족 (자동 판정)
  | 'approved'    // 관리자 승인 완료
  | 'measuring'   // Layer 3 통제 측정 실행 중
  | 'completed'   // 측정 완료 및 결과 환류
  | 'rejected'    // 반려 (중복, 증거 부족, 악의적 제보)
  | 'merged';     // 동일/유사 제보에 병합

export interface CitizenReport {
  id: string;
  unit_id: string;
  prompt_used: string;
  ai_response_summary: string; // 2000자 이내 요약 (INV-6)
  ai_service: string;          // INV-7
  model_version?: string | null;
  web_search: boolean;         // INV-7
  language: string;            // INV-7
  measured_on: string;         // INV-7 (YYYY-MM-DD)
  verdict_self: Accuracy;      // accurate, partial, inaccurate, absent
  syndrome_self?: ReportSyndrome | null;
  is_confabulation: boolean;
  screenshot_url?: string | null;
  evidence_note?: string | null;
  submitter_type: SubmitterType;
  anonymous: boolean;
  submitter_email?: string | null;
  status: PromotionStatus;
  pii_checked: boolean;
  admin_note?: string | null;
  merged_into?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CitizenReportInput {
  unitId: string;
  promptUsed: string;
  aiResponseSummary: string;
  aiService: string;
  modelVersion?: string;
  webSearch: boolean;
  language?: string;
  measuredOn?: string;
  verdictSelf: Accuracy;
  syndromeSelf?: ReportSyndrome;
  isConfabulation?: boolean;
  screenshotUrl?: string;
  evidenceNote?: string;
  submitterType?: SubmitterType;
  anonymous?: boolean;
  submitterEmail?: string;
}

export interface PromotionCandidate {
  unitId: string;
  unitName: string;
  triggerReports: string[];
  triggerCount: number;
  triggerSyndrome: ReportSyndrome;
  probePrompt: string;
  probeCategory?: string;
  priority: number;
  reason: string;
}

export interface PromotionQueueItem {
  id: string;
  unit_id: string;
  trigger_reports: string[];
  trigger_count: number;
  trigger_syndrome: ReportSyndrome;
  probe_prompt: string;
  probe_category?: string | null;
  measure_job_id?: string | null;
  observation_id?: string | null;
  status: PromotionStatus;
  priority: number;
  auto_qualified_at?: string | null;
  approved_at?: string | null;
  completed_at?: string | null;
  admin_note?: string | null;
  created_at: string;
}

export interface ReportCluster {
  unitId: string;
  unitName: string;
  sggCode?: string;
  totalReports: number;
  confabulationCount: number;
  syndromeDistribution: Record<ReportSyndrome, number>;
  latestReportDate: string;
  promotionEligible: boolean;
  promotedCount: number;
  topPrompts: { prompt: string; count: number; syndrome?: ReportSyndrome }[];
}
