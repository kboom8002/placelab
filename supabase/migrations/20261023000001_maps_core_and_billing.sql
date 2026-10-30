-- supabase/migrations/20261023000001_maps_core_and_billing.sql
-- MAPS 스튜디오 (Multi-AI Presence & Alignment Studio) 코어 및 결제 격리 스키마
-- 근거: ADR-0026, ADR-0027, PRD FR-97 ~ FR-106
-- 불변식: INV-3, INV-6, INV-7, INV-9, INV-12, INV-17, MAPS-INV-01 ~ MAPS-INV-20

-- ============================================================================
-- 0. 공통 불변(Append-Only) 트리거 함수
-- ============================================================================
create or replace function public.maps_prevent_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'MAPS append-only violation on table %: % is prohibited (MAPS-INV-01/03/04)', tg_table_name, tg_op;
end;
$$;

create or replace function public.maps_prevent_frozen_qset_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'maps_question_sets' then
    if old.frozen = true then
      raise exception 'MAPS frozen question_set (%) cannot be modified or deleted (INV-10)', old.qset_id;
    end if;
    return new;
  elsif tg_table_name = 'maps_questions' then
    if exists (select 1 from public.maps_question_sets qs where qs.qset_id = old.qset_id and qs.frozen = true) then
      raise exception 'MAPS question (%) belongs to a frozen question_set (%) and cannot be modified (INV-10)', old.question_id, old.qset_id;
    end if;
    return new;
  end if;
  return new;
end;
$$;

-- ============================================================================
-- 1. 테넌트 · 멤버 · 적격성 심사 (A원칙 방화벽: 지자체 유상 판매 차단)
-- ============================================================================
create table if not exists public.maps_tenants (
  tenant_id           text primary key,
  name                text not null,
  slug                text not null unique,
  org_type            text not null
                      check (org_type in (
                        'enterprise',
                        'hospital',
                        'university',
                        'smb',
                        'public_corp',
                        'foundation',
                        'agency_partner',
                        'local_gov_blocked'
                      )),
  eligibility_status  text not null default 'pending_review'
                      check (eligibility_status in (
                        'approved',
                        'rejected_conflict_of_interest',
                        'pending_review'
                      )),
  sponsor_disclosure  text,
  primary_domain      text not null,
  contact_email       text,
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  constraint chk_maps_tenant_no_local_gov_approved
    check (not (org_type = 'local_gov_blocked' and eligibility_status = 'approved')),
  constraint chk_maps_tenant_quasi_public_disclosure
    check (
      org_type not in ('public_corp', 'foundation')
      or eligibility_status <> 'approved'
      or (sponsor_disclosure is not null and length(trim(sponsor_disclosure)) > 0)
    )
);

comment on table public.maps_tenants is
  'MAPS 스튜디오 고객사 테넌트. 지자체(광역 16·기초 227)는 A원칙(INV-17, MAPS-INV-17)에 따라 유상 계약 및 승인이 원천 차단된다.';

create table if not exists public.maps_tenant_members (
  tenant_id   text not null references public.maps_tenants(tenant_id) on delete cascade,
  user_id     uuid not null,
  role        text not null
              check (role in ('client_owner', 'client_editor', 'client_viewer')),
  created_at  timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table if not exists public.maps_eligibility_checks (
  check_id            uuid primary key default gen_random_uuid(),
  org_name            text not null,
  org_type            text not null,
  domain              text not null,
  matched_unit_code   text,
  eligible            boolean not null,
  reason_code         text not null
                      check (reason_code in (
                        'ELIGIBLE_PRIVATE',
                        'ELIGIBLE_QUASI_PUBLIC_WITH_DISCLOSURE',
                        'BLOCKED_MUNICIPAL_A_PRINCIPLE',
                        'BLOCKED_PUBLIC_DOMAIN_SUFFIX',
                        'REQUIRES_SPONSOR_DISCLOSURE'
                      )),
  redirect_path       text,
  sponsor_disclosure  text,
  checked_at          timestamptz not null default now()
);

-- ============================================================================
-- 2. 정본 대상(Entities) · 속성 사전 · 이원 시간(Bitemporal) 정본 대장
-- ============================================================================
create table if not exists public.maps_entities (
  entity_id           text primary key,
  tenant_id           text not null references public.maps_tenants(tenant_id),
  entity_type         text not null
                      check (entity_type in ('organization', 'product', 'service', 'location', 'person', 'policy')),
  canonical_name      text not null,
  aliases             text[] not null default '{}',
  disambiguators      text[] not null default '{}',
  negative_aliases    text[] not null default '{}',
  official_domains    text[] not null default '{}',
  primary_urls        text[] not null default '{}',
  active              boolean not null default true,
  created_at          timestamptz not null default now()
);

create index if not exists idx_maps_entities_tenant
  on public.maps_entities (tenant_id, canonical_name);

create table if not exists public.maps_prop_dictionary (
  prop_key        text primary key,
  sector          text not null,
  label_ko        text not null,
  value_type      text not null
                  check (value_type in (
                    'number', 'money', 'hours', 'phone', 'address',
                    'enum', 'boolean', 'date_range', 'url', 'text'
                  )),
  risk_weight     numeric(4,2) not null default 1.00 check (risk_weight >= 0 and risk_weight <= 5),
  volatility      text not null default 'medium'
                  check (volatility in ('low', 'medium', 'high', 'seasonal')),
  unit            text,
  tolerance_rule  jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create table if not exists public.maps_fact_versions (
  fact_version_id             text primary key,
  tenant_id                   text not null references public.maps_tenants(tenant_id),
  entity_id                   text not null references public.maps_entities(entity_id),
  prop_key                    text not null references public.maps_prop_dictionary(prop_key),
  value_norm                  jsonb not null,
  value_raw                   text not null,
  unit                        text,
  qualifiers                  jsonb not null default '{}'::jsonb,
  -- 사실 유효 기간 (Valid Time: 미래 예고 시 valid_from > now() 허용)
  valid_from                  timestamptz not null,
  valid_to                    timestamptz,
  -- 대장 기록 시점 (Transaction Time)
  recorded_at                 timestamptz not null default now(),
  superseded_at               timestamptz,
  source_url                  text not null,
  source_quote                text,
  -- 확인 수준 ('등급' 금칙어 회피 -> confirm_level)
  confirm_level               text not null default 'doc_verified'
                              check (confirm_level in ('unreviewed', 'doc_verified', 'owner_signed')),
  confirmed_by                text,
  confirmed_at                timestamptz,
  supersedes_fact_version_id  text references public.maps_fact_versions(fact_version_id),
  constraint chk_maps_fact_valid_window
    check (valid_to is null or valid_to > valid_from)
);

create index if not exists idx_maps_fact_versions_as_of
  on public.maps_fact_versions (entity_id, prop_key, valid_from, valid_to);

drop trigger if exists trg_maps_fact_versions_append_only on public.maps_fact_versions;
create trigger trg_maps_fact_versions_append_only
  before update or delete on public.maps_fact_versions
  for each row execute function public.maps_prevent_mutation();

comment on table public.maps_fact_versions is
  '이원 시간(Bitemporal) 정본 대장. UPDATE/DELETE 금지(MAPS-INV-03). 미래 효력일(valid_from > now) 예고 등록을 지원한다.';

-- ============================================================================
-- 3. 측정 엔진 · 동결 문항 세트 · 문항 (비공개 대조군 분리)
-- ============================================================================
create table if not exists public.maps_engines (
  engine_id       text primary key,
  provider        text not null check (provider in ('openai', 'google', 'anthropic', 'perplexity', 'naver')),
  service_label   text not null,
  masked_label    text not null, -- 판정자·리포트 블라인드 코드 (예: svc-A, svc-B / MAPS-INV-11)
  model_id        text not null,
  channel         text not null default 'api_websearch',
  search_mode     text not null default 'on_verified'
                  check (search_mode in ('on_verified', 'off')),
  locale          text not null default 'ko-KR',
  region          text not null default 'KR',
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists public.maps_question_sets (
  qset_id           text primary key,
  tenant_id         text references public.maps_tenants(tenant_id),
  sector            text not null,
  version           text not null,
  title             text not null,
  frozen            boolean not null default false,
  frozen_hash       text,
  frozen_at         timestamptz,
  preregistered_at  timestamptz,
  created_at        timestamptz not null default now(),
  constraint chk_maps_qset_frozen_hash
    check (frozen = false or (frozen_hash is not null and frozen_at is not null))
);

drop trigger if exists trg_maps_qset_freeze_guard on public.maps_question_sets;
create trigger trg_maps_qset_freeze_guard
  before update or delete on public.maps_question_sets
  for each row execute function public.maps_prevent_frozen_qset_mutation();

create table if not exists public.maps_questions (
  question_id       text primary key,
  qset_id           text not null references public.maps_question_sets(qset_id),
  template_code     text not null,
  intent_axis       text not null
                    check (intent_axis in ('information', 'comparison', 'recommendation', 'verification', 'troubleshooting', 'eligibility')),
  persona_axis      text not null default 'general_consumer',
  frame_axis        text not null default 'neutral'
                    check (frame_axis in ('neutral', 'positive_premise', 'critical_premise', 'constraint_heavy', 'alternative_seeking')),
  lang              text not null default 'ko',
  prompt_text       text not null,
  target_entity_id  text references public.maps_entities(entity_id),
  target_prop_key   text references public.maps_prop_dictionary(prop_key),
  is_canary         boolean not null default false,
  is_control        boolean not null default false,
  split_group       text not null default 'customer_audit'
                    check (split_group in ('public_sample', 'customer_audit', 'private_control')),
  risk_level        text not null default 'medium'
                    check (risk_level in ('low', 'medium', 'high', 'critical_excluded')),
  created_at        timestamptz not null default now()
);

drop trigger if exists trg_maps_questions_freeze_guard on public.maps_questions;
create trigger trg_maps_questions_freeze_guard
  before update or delete on public.maps_questions
  for each row execute function public.maps_prevent_frozen_qset_mutation();

-- ============================================================================
-- 4. 실행(Runs) · 원시 관측(Observations) · 카나리아 · 6분류 판정(Judgments)
-- ============================================================================
create table if not exists public.maps_runs (
  run_id            text primary key,
  tenant_id         text not null references public.maps_tenants(tenant_id),
  qset_id           text not null references public.maps_question_sets(qset_id),
  engine_id         text not null references public.maps_engines(engine_id),
  -- INV-7 필수 5대 측정 조건 (NOT NULL, 기본값 채우기 금지)
  method_version    text not null,
  ai_service        text not null,
  web_search        boolean not null,
  language          text not null,
  measured_on       date not null,
  repeats           int not null check (repeats >= 1 and repeats <= 20),
  -- INV-13 정밀 측정 원문 전송 강제
  prompt_send_mode  text not null default 'raw_question_only'
                    check (prompt_send_mode = 'raw_question_only'),
  status            text not null default 'completed'
                    check (status in ('queued', 'running', 'completed', 'failed', 'halted_canary')),
  started_at        timestamptz not null default now(),
  finished_at       timestamptz
);

create table if not exists public.maps_observations (
  observation_id    text not null unique,
  run_id            text not null references public.maps_runs(run_id),
  question_id       text not null references public.maps_questions(question_id),
  rep               int not null check (rep >= 1),
  observed_at       timestamptz not null default now(),
  -- INV-6: 응답 원문 전문은 비공개 저장소(raw_ref)에만 두고 공개/표준 테이블에는 해시와 추출 구조만 저장
  raw_ref           text not null,
  raw_hash          text not null,
  extracted_claims  jsonb not null default '[]'::jsonb,
  citations         jsonb not null default '[]'::jsonb,
  refusal_type      text check (refusal_type in ('none', 'honest_unknown', 'safety_refusal', 'policy_disclaimer')),
  latency_ms        int,
  primary key (run_id, question_id, rep)
);

drop trigger if exists trg_maps_observations_append_only on public.maps_observations;
create trigger trg_maps_observations_append_only
  before update or delete on public.maps_observations
  for each row execute function public.maps_prevent_mutation();

comment on table public.maps_observations is
  '반복 회차별(rep) 원시 관측 테이블(INV-9). 원문 전문은 raw_ref 비공개 저장소에 격리하며(INV-6), UPDATE/DELETE 금지(MAPS-INV-01).';

create table if not exists public.maps_canary_results (
  canary_id               text primary key,
  engine_id               text not null references public.maps_engines(engine_id),
  checked_at              timestamptz not null default now(),
  fingerprint             jsonb not null,
  drift_score             numeric(5,4) not null check (drift_score >= 0 and drift_score <= 1),
  model_update_suspected  boolean not null default false,
  notes                   text
);

create table if not exists public.maps_judgments (
  judgment_id              text primary key,
  observation_id           text not null references public.maps_observations(observation_id),
  target_entity_id         text not null references public.maps_entities(entity_id),
  prop_key                 text not null references public.maps_prop_dictionary(prop_key),
  as_of_fact_version_id    text references public.maps_fact_versions(fact_version_id),
  verdict                  text not null
                           check (verdict in (
                             'correct',
                             'outdated',
                             'confused',
                             'fabricated',
                             'asserted',
                             'honest_unknown'
                           )),
  lag_days                 int check (lag_days is null or lag_days >= 0),
  confused_with_entity_id  text,
  citation_class           text not null default 'none'
                           check (citation_class in (
                             'official',
                             'primary_doc',
                             'secondary_press',
                             'ugc_blog',
                             'broken',
                             'unrelated',
                             'none'
                           )),
  harm_score               numeric(4,2) not null default 0 check (harm_score >= 0 and harm_score <= 5),
  limit_violation          boolean not null default false,
  judge_type               text not null
                           check (judge_type in (
                             'rule',
                             'llm_candidate',
                             'human_single',
                             'human_consensus',
                             'adjudicated'
                           )),
  judge_id                 text not null,
  rationale                text not null,
  supersedes_judgment_id   text references public.maps_judgments(judgment_id),
  judged_at                timestamptz not null default now(),
  constraint chk_maps_judgment_asserted_no_official_citation
    check (not (verdict = 'asserted' and citation_class in ('official', 'primary_doc')))
);

create index if not exists idx_maps_judgments_obs
  on public.maps_judgments (observation_id, judged_at desc);

drop trigger if exists trg_maps_judgments_append_only on public.maps_judgments;
create trigger trg_maps_judgments_append_only
  before update or delete on public.maps_judgments
  for each row execute function public.maps_prevent_mutation();

comment on table public.maps_judgments is
  '관측 시점(as-of) 6분류 판정 테이블. UPDATE/DELETE 금지(MAPS-INV-04). 재판정·이의 인용 시 supersedes_judgment_id 로 새 행을 추가한다.';

-- ============================================================================
-- 5. 잡 큐 · 간극 작업함(G1~G6) · 개입 · 대조군 코호트 · 리포트 · 이의 · 알림 · 감사 로그
-- ============================================================================
create table if not exists public.maps_jobs (
  job_id        uuid primary key default gen_random_uuid(),
  tenant_id     text not null references public.maps_tenants(tenant_id),
  job_type      text not null
                check (job_type in ('free_check', 'pulse_run', 'deep_audit_run', 'proof_remeasure', 'canary_check')),
  status        text not null default 'queued'
                check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  payload       jsonb not null default '{}'::jsonb,
  attempts      int not null default 0,
  max_attempts  int not null default 3,
  next_run_at   timestamptz not null default now(),
  locked_by     text,
  last_error    text,
  created_at    timestamptz not null default now()
);

create table if not exists public.maps_gap_tasks (
  gap_task_id        text primary key,
  tenant_id          text not null references public.maps_tenants(tenant_id),
  entity_id          text not null references public.maps_entities(entity_id),
  prop_key           text not null references public.maps_prop_dictionary(prop_key),
  gap_type           text not null
                     check (gap_type in (
                       'G1_presence',
                       'G2_fact',
                       'G3_time',
                       'G4_source',
                       'G5_context',
                       'G6_engine'
                     )),
  diagnosis_stage    text not null
                     check (diagnosis_stage in (
                       'S1_existence',
                       'S2_crawl_access',
                       'S3_indexing_discoverability',
                       'S4_parseability',
                       'S5_conflict_recency',
                       'S6_model_internal'
                     )),
  prescription_code  text not null
                     check (prescription_code in (
                       'P1_publish_canonical',
                       'P2_open_robots_sitemap',
                       'P3_ia_deeplink_anchor',
                       'P4_html_table_jsonld',
                       'P5_retire_old_date_pin',
                       'P6_official_objection_pack'
                     )),
  -- MAPS-INV-09: 우선순위는 반드시 5요소(demand, gap, harm, feasibility, cost)와 함께 보존·표시
  priority           numeric(5,4) not null,
  demand_score       numeric(5,4) not null,
  gap_score          numeric(5,4) not null,
  harm_score         numeric(5,4) not null,
  feasibility_score  numeric(5,4) not null,
  cost_score         numeric(5,4) not null,
  status             text not null default 'open'
                     check (status in ('open', 'in_progress', 'deployed_waiting_remeasure', 'closed', 'wont_fix')),
  due_date           date,
  created_at         timestamptz not null default now()
);

create table if not exists public.maps_interventions (
  intervention_id       text primary key,
  tenant_id             text not null references public.maps_tenants(tenant_id),
  gap_task_id           text references public.maps_gap_tasks(gap_task_id),
  action_type           text not null
                        check (action_type in (
                          'canonical_page_publish',
                          'jsonld_embed',
                          'robots_sitemap_update',
                          'outdated_doc_retire',
                          'html_table_refactor',
                          'provider_feedback_submit'
                        )),
  target_url            text not null,
  artifact_hash         text not null,
  deployed_at           timestamptz not null default now(),
  verified_crawl_at     timestamptz,
  elapsed_minutes       int not null default 30 check (elapsed_minutes >= 0),
  estimated_cost_krw    bigint not null default 0 check (estimated_cost_krw >= 0),
  notes                 text,
  created_by            text not null,
  created_at            timestamptz not null default now()
);

create table if not exists public.maps_cohorts (
  cohort_id    text primary key,
  tenant_id    text not null references public.maps_tenants(tenant_id),
  name         text not null,
  role         text not null
               check (role in ('treated', 'control_attribute', 'control_peer')),
  entity_ids   text[] not null default '{}',
  prop_keys    text[] not null default '{}',
  created_at   timestamptz not null default now()
);

create table if not exists public.maps_reports (
  report_id            text primary key,
  tenant_id            text not null references public.maps_tenants(tenant_id),
  report_type          text not null
                       check (report_type in ('pulse', 'deep_audit', 'proof', 'radar', 'sample_fictional')),
  period_start         date not null,
  period_end           date not null,
  method_version       text not null,
  is_fictional_sample  boolean not null default false,
  summary_metrics      jsonb not null,
  copy_lint_passed     boolean not null default false,
  published_at         timestamptz,
  approved_by          text,
  created_at           timestamptz not null default now(),
  constraint chk_maps_report_lint_before_publish
    check (published_at is null or copy_lint_passed = true)
);

create table if not exists public.maps_objections (
  objection_id          text primary key,
  tenant_id             text not null references public.maps_tenants(tenant_id),
  judgment_id           text not null references public.maps_judgments(judgment_id),
  report_id             text references public.maps_reports(report_id),
  submitted_by          text not null,
  claim_text            text not null,
  evidence_url          text not null,
  status                text not null default 'submitted'
                        check (status in ('submitted', 'under_review', 'accepted', 'rejected')),
  resolution_note       text,
  resolved_judgment_id  text references public.maps_judgments(judgment_id),
  created_at            timestamptz not null default now(),
  resolved_at           timestamptz
);

create table if not exists public.maps_alerts (
  alert_id         text primary key,
  tenant_id        text not null references public.maps_tenants(tenant_id),
  severity         text not null check (severity in ('info', 'warning', 'critical')),
  alert_type       text not null
                   check (alert_type in (
                     'new_fabrication_spike',
                     'outdated_after_fact_change',
                     'canary_model_drift',
                     'robots_regression',
                     'remeasure_due'
                   )),
  title            text not null,
  detail           jsonb not null default '{}'::jsonb,
  acknowledged_at  timestamptz,
  created_at       timestamptz not null default now()
);

create table if not exists public.maps_audit_log (
  audit_id      uuid primary key default gen_random_uuid(),
  actor_id      text not null,
  actor_role    text not null,
  action        text not null,
  target_table  text not null,
  target_id     text not null,
  diff          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- 6. 결제·청구 격리 스키마 (MAPS-INV-05: 판정·간극·리포트 테이블과 외래키 0개)
-- ============================================================================
create table if not exists public.maps_billing_products (
  sku_code                text primary key,
  name_ko                 text not null,
  stage_label             text not null, -- 재기 / 맞추기 / 간극 짚기 / 메우기 / 증명
  billing_cycle           text not null
                          check (billing_cycle in ('free', 'one_time', 'monthly', 'quarterly', 'annual', 'quote_only')),
  -- INV-12, MAPS-INV-10: 'assumption' 상태의 상품은 정가 노출·즉시 결제를 차단하고 [가정] 배지 표시
  price_status            text not null default 'assumption'
                          check (price_status in ('assumption', 'confirmed')),
  confirmed_price_krw     bigint,
  assumption_range_label  text not null,
  deliverables            text[] not null default '{}',
  non_guarantee_notice    text not null,
  active                  boolean not null default true,
  created_at              timestamptz not null default now(),
  constraint chk_maps_sku_confirmed_price
    check (
      (price_status = 'assumption' and confirmed_price_krw is null)
      or (price_status = 'confirmed' and confirmed_price_krw is not null and confirmed_price_krw >= 0)
    )
);

create table if not exists public.maps_billing_orders (
  order_id          text primary key,
  tenant_id         text not null references public.maps_tenants(tenant_id),
  sku_code          text not null references public.maps_billing_products(sku_code),
  order_mode        text not null check (order_mode in ('pg_checkout', 'b2b_quote')),
  amount_krw        bigint not null check (amount_krw >= 0),
  status            text not null default 'pending'
                    check (status in ('pending', 'quote_requested', 'paid', 'canceled', 'refunded')),
  buyer_name        text not null,
  buyer_email       text not null,
  created_at        timestamptz not null default now(),
  paid_at           timestamptz
);

create table if not exists public.maps_billing_payments (
  payment_id        text primary key,
  order_id          text not null references public.maps_billing_orders(order_id),
  pg_provider       text not null default 'tosspayments',
  payment_key       text not null,
  idempotency_key   text not null unique,
  amount_krw        bigint not null check (amount_krw >= 0),
  method            text not null,
  status            text not null check (status in ('DONE', 'CANCELED', 'PARTIAL_CANCELED', 'ABORTED')),
  receipt_url       text,
  raw_webhook_hash  text not null,
  approved_at       timestamptz not null default now()
);

create table if not exists public.maps_billing_subscriptions (
  subscription_id       text primary key,
  tenant_id             text not null references public.maps_tenants(tenant_id),
  sku_code              text not null references public.maps_billing_products(sku_code),
  status                text not null check (status in ('active', 'past_due', 'canceled')),
  current_period_start  date not null,
  current_period_end    date not null,
  cancel_at_period_end  boolean not null default false,
  created_at            timestamptz not null default now()
);

create table if not exists public.maps_billing_invoices (
  invoice_id      text primary key,
  tenant_id       text not null references public.maps_tenants(tenant_id),
  order_id        text references public.maps_billing_orders(order_id),
  amount_krw      bigint not null check (amount_krw >= 0),
  tax_krw         bigint not null default 0 check (tax_krw >= 0),
  status          text not null check (status in ('draft', 'issued', 'paid', 'void')),
  issued_at       timestamptz not null default now(),
  due_date        date
);

-- ============================================================================
-- 7. RLS(행 수준 보안) 정책 (비공개 대조군 문항 고객사 열람 원천 차단: MAPS-INV-13)
-- ============================================================================
alter table public.maps_tenants enable row level security;
alter table public.maps_tenant_members enable row level security;
alter table public.maps_entities enable row level security;
alter table public.maps_fact_versions enable row level security;
alter table public.maps_questions enable row level security;
alter table public.maps_runs enable row level security;
alter table public.maps_observations enable row level security;
alter table public.maps_judgments enable row level security;
alter table public.maps_gap_tasks enable row level security;
alter table public.maps_interventions enable row level security;
alter table public.maps_reports enable row level security;
alter table public.maps_objections enable row level security;
alter table public.maps_billing_products enable row level security;
alter table public.maps_billing_orders enable row level security;

create policy maps_billing_products_public_read
  on public.maps_billing_products
  for select
  using (active = true);

create policy maps_tenant_members_self_read
  on public.maps_tenant_members
  for select
  using (auth.uid() = user_id);

create policy maps_tenants_member_read
  on public.maps_tenants
  for select
  using (
    exists (
      select 1 from public.maps_tenant_members m
      where m.tenant_id = maps_tenants.tenant_id
        and m.user_id = auth.uid()
    )
  );

-- MAPS-INV-13: 고객사는 private_control(비공개 대조군) 및 카나리아 문항을 절대 조회할 수 없다.
create policy maps_questions_client_safe_read
  on public.maps_questions
  for select
  using (
    split_group <> 'private_control'
    and is_canary = false
  );
