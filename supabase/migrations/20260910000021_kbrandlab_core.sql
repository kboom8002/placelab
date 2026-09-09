-- supabase/migrations/20260910000021_kbrandlab_core.sql
-- K-Brand Lab PRD v3.0 코어 데이터베이스 스키마
-- 소비자 질문 기반 브랜드 연구, AI 응답 측정, 정본·소셜 판정 및 KRole 연계

-- ============================================================================
-- 1. ENUM 타입 정의
-- ============================================================================

-- 질문 출처 (INV-01)
CREATE TYPE kb_question_source AS ENUM (
  'consumer_actual',
  'researcher_derived',
  'ai_suggested'
);

-- 소비자 6단계 구매 여정 (§5.3)
CREATE TYPE kb_journey_stage AS ENUM (
  'need_discovery',
  'category_exploration',
  'brand_comparison',
  'purchase_terms',
  'usage_troubleshooting',
  'repurchase_churn'
);

-- 브랜드 과제 5대 유형 (§5.3)
CREATE TYPE kb_issue_type AS ENUM (
  'info_gap',
  'verification_gap',
  'purchase_barrier',
  'product_unfit',
  'new_demand'
);

-- 엔티티 유형 (§6.2)
CREATE TYPE kb_entity_type AS ENUM (
  'brand',
  'product',
  'poi',
  'experience'
);

-- 주장 유형 (§6.3)
CREATE TYPE kb_claim_type AS ENUM (
  'operational_terms',
  'product_spec_origin',
  'performance_safety',
  'experience_usability',
  'cultural_authenticity'
);

-- 주장 지식 상태 (§6.3)
CREATE TYPE kb_claim_knowledge_state AS ENUM (
  'brand_reported',
  'supported',
  'contradicted',
  'insufficient',
  'disputed',
  'expired'
);

-- 정본 revision 상태 (§6.3)
CREATE TYPE kb_canonical_status AS ENUM (
  'draft',
  'in_review',
  'approved',
  'published',
  'superseded',
  'expired',
  'withdrawn'
);

-- 검토 및 소셜 판정 상태 (§7.2)
CREATE TYPE kb_review_status AS ENUM (
  'requested',
  'eligibility_check',
  'assigned',
  'independent_review',
  'adjudication',
  'published',
  'challenged',
  'expired',
  'reopened'
);

-- 프로브 유형 (§8.3)
CREATE TYPE kb_probe_type AS ENUM (
  'branded',
  'open',
  'h2h',
  'fact_check'
);

-- 기술 수집 상태 (§8.5)
CREATE TYPE kb_capture_status AS ENUM (
  'captured',
  'technical_failed',
  'cancelled',
  'unattempted'
);

-- 응답 의미 분류 (§8.5)
CREATE TYPE kb_response_semantic AS ENUM (
  'substantive',
  'insufficient',
  'refusal',
  'empty',
  'off_topic',
  'unclassified'
);

-- 출처 관리 권한 (§8.7)
CREATE TYPE kb_source_control AS ENUM (
  'direct',
  'contractual',
  'third_party_request',
  'no_control',
  'unknown'
);

-- H2H 결과 분포 (§8.6 M-08)
CREATE TYPE kb_h2h_result AS ENUM (
  'target_favorable',
  'opponent_favorable',
  'conditional',
  'tie',
  'indeterminate'
);

-- ============================================================================
-- 2. 테넌트 및 프로젝트 계층
-- ============================================================================

-- 고객 조직 (Tenant)
CREATE TABLE IF NOT EXISTS kb_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_number TEXT,
  contact_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 연구 프로젝트 단위 (Project)
CREATE TABLE IF NOT EXISTS kb_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES kb_organizations(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  target_market TEXT NOT NULL DEFAULT 'KR',
  primary_language TEXT NOT NULL DEFAULT 'ko',
  secondary_language TEXT DEFAULT 'en',
  budget_limit_usd NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
  current_spend_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. 엔티티(Entity) 및 정본(Canonical) 계층
-- ============================================================================

-- 브랜드, 제품, POI, 체험 엔티티
CREATE TABLE IF NOT EXISTS kb_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES kb_entities(id) ON DELETE SET NULL,
  entity_type kb_entity_type NOT NULL,
  official_name TEXT NOT NULL,
  aliases JSONB NOT NULL DEFAULT '[]'::jsonb, -- 언어별 별칭 [{lang: 'ko', name: '...'}, {lang: 'en', name: '...'}]
  external_ids JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. barcode, wikidata_id, krole_id
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 증거 및 출처 자료
CREATE TABLE IF NOT EXISTS kb_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  source_url TEXT,
  source_title TEXT,
  source_control kb_source_control NOT NULL DEFAULT 'unknown',
  content_hash TEXT NOT NULL,
  excerpt TEXT,
  published_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rights_scope TEXT NOT NULL DEFAULT 'internal_research_only',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 미디어 자산 (이미지 등)
CREATE TABLE IF NOT EXISTS kb_media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES kb_entities(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  creator_credit TEXT,
  license_type TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  alt_texts JSONB NOT NULL DEFAULT '{}'::jsonb, -- {ko: '...', en: '...'}
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 개별 주장 리비전 (ClaimRevision)
CREATE TABLE IF NOT EXISTS kb_claim_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES kb_entities(id) ON DELETE CASCADE,
  revision_number INT NOT NULL DEFAULT 1,
  claim_type kb_claim_type NOT NULL,
  statement TEXT NOT NULL,
  target_condition TEXT, -- 적용 조건 (예: 2026년형, 특정 옵션 등)
  applicable_market TEXT NOT NULL DEFAULT 'KR',
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  evidence_id UUID REFERENCES kb_evidences(id) ON DELETE SET NULL,
  knowledge_state kb_claim_knowledge_state NOT NULL DEFAULT 'brand_reported',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_id, revision_number)
);

-- 정본 묶음 (CanonicalRevision)
CREATE TABLE IF NOT EXISTS kb_canonical_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES kb_entities(id) ON DELETE CASCADE,
  revision_number INT NOT NULL DEFAULT 1,
  status kb_canonical_status NOT NULL DEFAULT 'draft',
  descriptions JSONB NOT NULL DEFAULT '{}'::jsonb, -- {ko: '...', en: '...'}
  media_asset_ids UUID[] DEFAULT ARRAY[]::UUID[],
  claim_revision_ids UUID[] DEFAULT ARRAY[]::UUID[],
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_id, revision_number)
);

-- ============================================================================
-- 4. 질문 수집 및 과제 도출 계층
-- ============================================================================

-- 출처 레코드 (SourceRecord)
CREATE TABLE IF NOT EXISTS kb_source_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  source_type kb_question_source NOT NULL,
  channel_name TEXT NOT NULL, -- e.g. customer_inquiry, product_qa, interview, ai_probe
  original_ref TEXT, -- 원본 파일명/상담 ID 등
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  privacy_cleared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 소비자 질문 (Question)
CREATE TABLE IF NOT EXISTS kb_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES kb_entities(id) ON DELETE SET NULL,
  source_type kb_question_source NOT NULL,
  raw_text TEXT NOT NULL,
  normalized_text TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ko',
  primary_journey kb_journey_stage NOT NULL,
  secondary_journeys kb_journey_stage[] DEFAULT ARRAY[]::kb_journey_stage[],
  context_situation TEXT,
  context_task TEXT,
  context_hesitation TEXT,
  context_existing_answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 질문 관찰 발생 기록 (QuestionObservation: 고유 질문과 발생 횟수 분리)
CREATE TABLE IF NOT EXISTS kb_question_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES kb_questions(id) ON DELETE CASCADE,
  source_record_id UUID NOT NULL REFERENCES kb_source_records(id) ON DELETE CASCADE,
  raw_occurrence_text TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 브랜드 과제 및 기회 테마 (Theme / Issue)
CREATE TABLE IF NOT EXISTS kb_brand_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES kb_entities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  primary_issue_type kb_issue_type NOT NULL,
  secondary_issue_types kb_issue_type[] DEFAULT ARRAY[]::kb_issue_type[],
  description TEXT NOT NULL,
  action_plan TEXT,
  priority_score NUMERIC(5, 2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'deferred')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. 소셜 판정 계층 (§7)
-- ============================================================================

-- 검토 케이스 (ReviewCase)
CREATE TABLE IF NOT EXISTS kb_review_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_revision_id UUID NOT NULL REFERENCES kb_claim_revisions(id) ON DELETE CASCADE,
  method_version TEXT NOT NULL DEFAULT 'v1.0',
  status kb_review_status NOT NULL DEFAULT 'requested',
  adjudication_notes TEXT,
  adjudicated_by TEXT,
  adjudicated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 검토자 개별 응답 (ReviewResponse: 독립 2인 검토 및 이해관계 신고, INV-06)
CREATE TABLE IF NOT EXISTS kb_review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_case_id UUID NOT NULL REFERENCES kb_review_cases(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL,
  reviewer_affiliation TEXT,
  conflict_of_interest_declared BOOLEAN NOT NULL DEFAULT false,
  conflict_detail TEXT,
  independent_verdict kb_claim_knowledge_state NOT NULL,
  verdict_rationale TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revised_at TIMESTAMPTZ,
  UNIQUE(review_case_id, reviewer_id)
);

-- ============================================================================
-- 6. AI 측정 계층 (§8, Slot / Attempt / Assessment)
-- ============================================================================

-- 진단 질문 세트 (ProbeSet)
CREATE TABLE IF NOT EXISTS kb_probe_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  version TEXT NOT NULL DEFAULT 'v1.0',
  title TEXT NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 개별 진단 프로브 (Probe)
CREATE TABLE IF NOT EXISTS kb_probes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  probe_set_id UUID NOT NULL REFERENCES kb_probe_sets(id) ON DELETE CASCADE,
  question_id UUID REFERENCES kb_questions(id) ON DELETE SET NULL,
  probe_type kb_probe_type NOT NULL,
  target_entity_id UUID REFERENCES kb_entities(id) ON DELETE SET NULL,
  comparison_entity_ids UUID[] DEFAULT ARRAY[]::UUID[],
  prompt_ko TEXT NOT NULL,
  prompt_en TEXT,
  evaluation_purpose TEXT NOT NULL DEFAULT 'development' CHECK (evaluation_purpose IN ('development', 'evaluation')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 측정 런 (MeasurementRun)
CREATE TABLE IF NOT EXISTS kb_measurement_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  probe_set_id UUID NOT NULL REFERENCES kb_probe_sets(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  timepoint TEXT NOT NULL DEFAULT 'baseline_1',
  reps INT NOT NULL DEFAULT 3 CHECK (reps > 0),
  planned_slots INT NOT NULL DEFAULT 0,
  completed_slots INT NOT NULL DEFAULT 0,
  total_cost_usd NUMERIC(8, 4) NOT NULL DEFAULT 0.0000,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'paused', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 논리적 관찰 슬롯 (MeasurementSlot: 1문항 × 1언어 × 1환경 × 1반복, INV-09)
CREATE TABLE IF NOT EXISTS kb_measurement_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES kb_measurement_runs(id) ON DELETE CASCADE,
  probe_id UUID NOT NULL REFERENCES kb_probes(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'ko',
  provider TEXT NOT NULL, -- e.g. openai, gemini
  model_requested TEXT NOT NULL, -- e.g. gpt-5.6-luna, gemini-3.5-flash-lite
  search_grounding_enabled BOOLEAN NOT NULL DEFAULT false,
  rep INT NOT NULL DEFAULT 1,
  capture_status kb_capture_status NOT NULL DEFAULT 'unattempted',
  first_attempt_at TIMESTAMPTZ,
  final_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(run_id, probe_id, language, provider, model_requested, search_grounding_enabled, rep)
);

-- 물리적 호출 시도 (MeasurementAttempt: 재시도 포함 모든 실제 API 호출 보존)
CREATE TABLE IF NOT EXISTS kb_measurement_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES kb_measurement_slots(id) ON DELETE CASCADE,
  attempt_number INT NOT NULL DEFAULT 1,
  model_returned TEXT,
  latency_ms INT,
  cost_usd NUMERIC(8, 6) NOT NULL DEFAULT 0.000000,
  raw_response TEXT,
  raw_response_hash TEXT,
  error_code TEXT,
  error_message TEXT,
  grounding_metadata JSONB,
  cited_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 응답 판정 및 대조 분석 (AnswerAssessment)
CREATE TABLE IF NOT EXISTS kb_answer_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES kb_measurement_slots(id) ON DELETE CASCADE,
  final_attempt_id UUID NOT NULL REFERENCES kb_measurement_attempts(id) ON DELETE CASCADE,
  semantic_classification kb_response_semantic NOT NULL DEFAULT 'unclassified',
  brand_mentioned BOOLEAN NOT NULL DEFAULT false,
  brand_recommended BOOLEAN NOT NULL DEFAULT false,
  h2h_result kb_h2h_result,
  official_channel_cited BOOLEAN NOT NULL DEFAULT false,
  controllable_source_cited BOOLEAN NOT NULL DEFAULT false,
  assessed_by TEXT NOT NULL DEFAULT 'automated',
  assessed_version TEXT NOT NULL DEFAULT 'v1.0',
  is_human_verified BOOLEAN NOT NULL DEFAULT false,
  verifier_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 7. KRole 공개, 개입, 성과 및 스냅샷 계층 (§10, §13, §14)
-- ============================================================================

-- KRole 공개 발행물 (Publication)
CREATE TABLE IF NOT EXISTS kb_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_revision_id UUID NOT NULL REFERENCES kb_canonical_revisions(id) ON DELETE RESTRICT,
  public_slug TEXT NOT NULL UNIQUE,
  public_url TEXT,
  channel TEXT NOT NULL DEFAULT 'krole_web',
  published_by TEXT NOT NULL,
  is_withdrawn BOOLEAN NOT NULL DEFAULT false,
  withdrawn_reason TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMPTZ
);

-- 개선 개입 기록 (Intervention: 전후 비교 기준점)
CREATE TABLE IF NOT EXISTS kb_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  brand_theme_id UUID REFERENCES kb_brand_themes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  intervention_type TEXT NOT NULL, -- e.g. canonical_update, official_site_faq, wiki_correction, product_revision
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  external_accessible_at TIMESTAMPTZ,
  notes TEXT
);

-- 연계 상품 및 예약 오퍼링 (Offering)
CREATE TABLE IF NOT EXISTS kb_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES kb_entities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  offering_type TEXT NOT NULL CHECK (offering_type IN ('product', 'education', 'event', 'reservation')),
  external_url TEXT NOT NULL,
  price_amount NUMERIC(12, 2),
  price_currency TEXT NOT NULL DEFAULT 'KRW',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 성과 사건 기록 (OutcomeEvent)
CREATE TABLE IF NOT EXISTS kb_outcome_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  offering_id UUID REFERENCES kb_offerings(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- e.g. offering_clicked, inquiry_submitted, booking_confirmed, payment_confirmed
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT UNIQUE,
  monetary_amount NUMERIC(12, 2),
  currency TEXT DEFAULT 'KRW'
);

-- 재현 가능한 보고서 스냅샷 (ReportSnapshot, INV-12)
CREATE TABLE IF NOT EXISTS kb_report_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  run_ids UUID[] NOT NULL,
  method_version TEXT NOT NULL DEFAULT 'v1.0',
  calculation_version TEXT NOT NULL DEFAULT 'v1.0',
  metrics_summary JSONB NOT NULL,
  report_markdown TEXT NOT NULL,
  generated_by TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 8. Row Level Security (RLS) 및 접근 정책
-- ============================================================================

ALTER TABLE kb_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_claim_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_canonical_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_source_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_question_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_brand_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_review_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_probe_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_probes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_measurement_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_measurement_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_measurement_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_answer_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_outcome_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_report_snapshots ENABLE ROW LEVEL SECURITY;

-- Service Role은 전체 테이블 무제한 관리
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'kb_%'
  LOOP
    EXECUTE format('CREATE POLICY "service_role_all_%I" ON %I FOR ALL USING (auth.role() = ''service_role'')', t, t);
  END LOOP;
END $$;

-- 공개(anon) 사용자는 오직 승인 및 발행된 KRole 정본과 오퍼링만 열람 가능 (AC-01)
CREATE POLICY "anon_read_published_canonicals" ON kb_canonical_revisions
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "anon_read_published_publications" ON kb_publications
  FOR SELECT TO anon, authenticated
  USING (is_withdrawn = false);

CREATE POLICY "anon_read_active_offerings" ON kb_offerings
  FOR SELECT TO anon, authenticated
  USING (is_active = true);
