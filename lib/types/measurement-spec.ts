// lib/types/measurement-spec.ts
// docs/measurement-spec: 지자체 정보 상태 측정 규격 단일 출처 (SSOT) TypeScript 타입 정의
// 스키마 출처: docs/measurement-spec/schema/*.schema.json & data/codes/*.json
// 불변식: 산식/총점/순위/등급/가중치/빈칸수/목표치/원문요약 필드 생성 엄격 금지

// ── 1. 코드표 ENUM ──────────────────────────────────────────────

export type LayerKind = 'access' | 'readability' | 'citation' | 'accuracy';

export type ActorRole =
  | 'agency_hq'
  | 'affiliate'
  | 'upper_tier'
  | 'institution'
  | 'private'
  | 'none';

export type OwnershipTier = 'direct' | 'affiliate' | 'partner' | 'out_of_reach';

export type DifficultyCode = 'D0' | 'D1' | 'D2' | 'D3';

export type SensitivityFlag = 'public' | 'agency_only' | 'restricted';

export type ValueNature = 'measured' | 'estimated' | 'planned' | 'unstated';

export type NonresponseCode = 'N1' | 'N2' | 'N3' | 'N4' | 'N5';

export type MismatchCode = 'C0' | 'C1' | 'C2' | 'C3' | 'C4';

export type GridCellValue = 'published' | 'partial' | 'not_applicable' | 'blank';

export type ProjectSlot =
  | 'existence'
  | 'location'
  | 'stage'
  | 'scale_schedule'
  | 'use'
  | 'owner';

export type ProjectStage =
  | 'planned'
  | 'reviewed'
  | 'noticed'
  | 'started'
  | 'changed'
  | 'completed'
  | 'operating';

export type SectionKind =
  | 'canon_absence_and_ownership'
  | 'entity_existence'
  | 'nonresponse_distribution'
  | 'public_source_citation'
  | 'residual_spread';

export type PublicationChannel =
  | 'national_report'
  | 'agency_notice'
  | 'anonymized_dataset';

// ── 2. 문항 (Question) ──────────────────────────────────────────

export interface Question {
  id: string; // ^[A-Z]{3,4}-[A-Za-z0-9_-]+$
  revision: number;
  status: 'active' | 'retired';
  text: string;
  boundary: string;
  type: 'value' | 'descriptive';
  layers: LayerKind[];
  ledger: string | null;
  owner_role: ActorRole;
  difficulty: DifficultyCode;
  sensitivity: SensitivityFlag;
  source_basis: string;
  basis_verification: 'confirmed' | 'to_verify' | 'n/a';
  note?: string;
}

// ── 3. 응답 원문 (ResponseRecord) ───────────────────────────────

export interface ResponseRecord {
  response_id: string;
  question_id: string;
  agency_handle: string;
  run_profile_id: string;
  attempt: number;
  observed_at: string; // ISO 8601 datetime
  outcome: 'answered' | 'refused' | 'error';
  raw_text: string;
  body_urls?: string[];
  citation_urls?: string[];
  error_detail?: string;
}

// ── 4. 관측 (Observation) ───────────────────────────────────────

export interface ExtractedFacts {
  stated_value?: string | null;
  stated_value_nature?: ValueNature;
  body_url_count?: number;
  citation_url_count?: number;
  public_source_present?: boolean;
  named_entities?: string[];
}

export interface AccessState {
  robots_checked?: boolean;
  robots_allows?: boolean;
  canonical_page_found?: boolean;
}

export interface Observation {
  observation_id: string;
  question_id: string;
  agency_handle: string;
  run_profile_id: string;
  observed_window: {
    start: string;
    end: string;
  };
  response_ids: string[];
  extracted: ExtractedFacts;
  extracted_by: 'model' | 'rule' | 'human';
  unstable?: boolean;
  access_state?: AccessState;
  note?: string;
}

// ── 5. 판정 (Verdict) ───────────────────────────────────────────

export interface Verdict {
  verdict_id: string;
  observation_id: string;
  question_id: string;
  agency_handle: string;
  result: 'match' | 'mismatch' | 'not_confirmed';
  nonresponse_code?: NonresponseCode;
  mismatch_code?: MismatchCode;
  ledger_value?: string | null;
  ledger_value_nature?: ValueNature;
  ledger_stale?: boolean;
  name_collision?: string[];
  judged_by: 'rule'; // 언어 모형 개입 절대 금지
  judged_at: string;
  ledger_as_of: string; // YYYY-MM-DD
  billable?: boolean; // D0 항목은 false
  note?: string;
}

// ── 6. 질문과 주체의 격자 (Grid) ─────────────────────────────────

export interface GridCell {
  actor_role: ActorRole;
  value: GridCellValue;
  evidence_url?: string;
}

export interface GridOwnership {
  owner_role: Exclude<ActorRole, 'none'>;
  tier: OwnershipTier;
  rationale?: string;
}

export interface GridRow {
  question_id: string;
  cells: GridCell[];
  row_verdict: 'canon_absent' | 'canon_present';
  ownership?: GridOwnership;
}

export interface Grid {
  grid_id: string;
  agency_handle: string;
  observed_window: {
    start: string;
    end: string;
  };
  rows: GridRow[];
  note?: string;
}

// ── 7. 역점사업 레코드 (ProjectRecord) ───────────────────────────

export interface ProjectEligibility {
  budgeted: true;
  owned: true;
  named: true;
}

export interface ProjectValueFact {
  slot: ProjectSlot;
  stated: string | null;
  nature: ValueNature;
  mismatch_code?: MismatchCode;
}

export interface ProjectWithheld {
  item: string;
  reason: string;
  statutory_basis?: string;
}

export interface ProjectRecord {
  project_id: string;
  agency_handle: string;
  official_name: string;
  eligibility: ProjectEligibility;
  owning_department: string;
  stage: ProjectStage;
  stage_as_of: string;
  stage_ledger: string;
  ledger_stale?: boolean;
  canonical_url?: string | null;
  press_release_urls?: string[];
  value_facts?: ProjectValueFact[];
  withheld?: ProjectWithheld[];
  sensitivity: 'agency_only';
  note?: string;
}

// ── 8. 산출물 (Output) ──────────────────────────────────────────

export interface OutputSection {
  order: 1 | 2 | 3 | 4 | 5;
  kind: SectionKind;
  items?: Record<string, any>[];
}

export interface Output {
  output_id: string;
  channel: PublicationChannel;
  proxy_notice: string; // 필수 선언
  run_profile_id: string;
  observed_at: {
    start: string;
    end: string;
  };
  ledger_as_of: string;
  notified_at?: string;
  review_closed_at?: string;
  band?: string;
  band_of?: string;
  sections: OutputSection[];
  note?: string;
}

// ── 9. 모집단 및 관측 프로필 등록부 ────────────────────────────

export interface AgencyEntry {
  handle: string;
  display: string;
  type: '시' | '군' | '자치구';
  upper_tier: string;
}

export interface PopulationFrame {
  revision: number;
  status: 'active' | 'placeholder';
  reference_date: string;
  source_document: string;
  source_authority: string;
  agency_count: number;
  agencies: AgencyEntry[];
}

export interface RunProfileEntry {
  run_profile_id: string;
  opened_at: string;
  closed_at: string | null;
  model_identifier: string;
  model_version: string;
  parameters: Record<string, any>;
  repeat_count: number;
  language: string;
  preamble: string;
  window_start: string;
  window_end: string;
}

export interface RunProfileRegistry {
  revision: number;
  status: 'active' | 'placeholder';
  profiles: RunProfileEntry[];
}
