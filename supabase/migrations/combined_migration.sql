-- ==========================================================
-- kplacelab 통합 데이터베이스 마이그레이션 (01~15)
-- PostgreSQL 16 / Supabase 호환
-- ==========================================================

-- 01. ENUMs
create type population           as enum ('local_gov','special_zone');
create type unit_type            as enum ('metro','basic','special_city','admin_city','fez','rfz','odz','other');
create type domain_form          as enum ('A','B','C');
create type domain_role          as enum ('main','tourism','invest','other');
create type robots_verdict       as enum ('open','blocked_all','blocked_selective','no_file','undetermined');
create type undetermined_reason  as enum ('timeout','malformed','parse_fail','shared_domain','dns_fail','other');
create type accuracy             as enum ('accurate','partial','inaccurate','absent');
create type submitter_type       as enum ('resident','official','researcher','press','unknown');
create type review_status        as enum ('pending','accepted','rejected');
create type correction_status    as enum ('received','reviewing','accepted','rejected','remeasured');
create type job_status           as enum ('queued','running','done','failed');
create type failure_syndrome     as enum ('confabulation','stale_fact','generic_drift','cross_unit','hypersensitivity','unstable_skeleton');
create type floor_risk           as enum ('low','moderate','high','critical');
create type variant_axis         as enum ('original','punct','polite','order','frame');
create type notice_kind          as enum ('pre_publication','status_change','correction_reply','remeasure');
create type notice_channel       as enum ('email','official_letter','phone','portal');
create type citation_kind        as enum ('press','assembly','research','government','other');
create type prereg_status        as enum ('draft','published','running','completed','abandoned');

-- 02. Units
create table units (
  id               text primary key,
  population       population  not null,
  unit_type        unit_type   not null,
  name             text        not null,
  name_en          text,
  sgg_code         text,
  parent_unit_id   text        references units(id),
  domain_form      domain_form not null,
  contracting_body text,
  is_depop_area    boolean     not null default false,
  active           boolean     not null default true,
  created_at       timestamptz not null default now(),

  constraint units_b_needs_parent
    check (domain_form <> 'B' or parent_unit_id is not null),
  constraint units_sgg_only_local
    check (population = 'local_gov' or sgg_code is null),
  constraint units_c_has_no_own_domain
    check (domain_form <> 'C' or parent_unit_id is not null)
);

create index units_population_idx on units (population, active);
create index units_parent_idx     on units (parent_unit_id);

-- 03. Unit Domains
create table unit_domains (
  id          bigint generated always as identity primary key,
  unit_id     text        not null references units(id) on delete cascade,
  host        text        not null,
  role        domain_role not null default 'main',
  path_prefix text,
  scannable   boolean     not null default true,
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  unique (unit_id, host, role)
);

create unique index unit_domains_scannable_host_idx
  on unit_domains (host) where scannable;

create or replace function enforce_scannable_by_form() returns trigger
language plpgsql as $$
declare f domain_form;
begin
  select domain_form into f from units where id = new.unit_id;
  if new.scannable and f <> 'A' then
    raise exception
      '단위 %(도메인형 %)는 스캔 대상 도메인을 가질 수 없습니다. AGENTS.md INV-1 · SDD 5.2 참조',
      new.unit_id, f;
  end if;
  return new;
end $$;

create trigger unit_domains_form_guard
  before insert or update on unit_domains
  for each row execute function enforce_scannable_by_form();

-- 04. Scan Jobs
create table scan_jobs (
  id             bigint generated always as identity primary key,
  domain_id      bigint      not null references unit_domains(id) on delete cascade,
  scheduled_week date        not null,
  scheduled_for  timestamptz not null,
  status         job_status  not null default 'queued',
  attempts       int         not null default 0,
  locked_at      timestamptz,
  last_error     text,
  created_at     timestamptz not null default now(),
  unique (domain_id, scheduled_week)
);

create index scan_jobs_pick_idx on scan_jobs (status, scheduled_for);

create or replace function claim_scan_jobs(p_limit int default 20)
returns setof scan_jobs
language sql
security definer
set search_path = public
as $$
  update scan_jobs j
     set status    = 'running',
         locked_at = now(),
         attempts  = j.attempts + 1
   where j.id in (
     select id from scan_jobs
      where status = 'queued' and scheduled_for <= now()
      order by scheduled_for
      limit p_limit
      for update skip locked
   )
  returning j.*;
$$;

create or replace function reclaim_stale_jobs()
returns int
language sql
security definer
set search_path = public
as $$
  with r as (
    update scan_jobs
       set status = 'queued', locked_at = null
     where status = 'running'
       and locked_at < now() - interval '15 minutes'
    returning 1
  ) select count(*)::int from r;
$$;

-- 05. Tech Scans
create table tech_scans (
  id                  bigint generated always as identity primary key,
  domain_id           bigint      not null references unit_domains(id),
  method_version      text        not null,
  scanned_at          timestamptz not null default now(),
  http_status         int,
  latency_ms          int,
  robots_verdict      robots_verdict not null,
  undetermined_reason undetermined_reason,
  ai_agents           jsonb,
  sitemap_declared    boolean,
  sitemap_reachable   boolean,
  meta_robots         text,
  jsonld_count        int,
  jsonld_types        text[],
  jsonld_valid        boolean,
  hreflang_count      int,
  tls_ok              boolean,
  tls_expires_at      timestamptz,
  raw_hash            text        not null,

  constraint tech_scans_undetermined_needs_reason
    check ((robots_verdict = 'undetermined') = (undetermined_reason is not null))
);

create index tech_scans_domain_time_idx on tech_scans (domain_id, scanned_at desc);

-- 06. Verdicts & Change Log
create table verdicts (
  domain_id           bigint primary key references unit_domains(id) on delete cascade,
  robots_verdict      robots_verdict not null,
  undetermined_reason undetermined_reason,
  method_version      text        not null,
  confirmed_from      timestamptz not null,
  confirmed_at        timestamptz not null,
  consecutive_weeks   int         not null,
  change_pending      boolean     not null default false,
  published           boolean     not null default false,

  constraint verdicts_needs_two_weeks check (consecutive_weeks >= 2),
  constraint verdicts_undetermined_needs_reason
    check ((robots_verdict = 'undetermined') = (undetermined_reason is not null))
);

create table verdict_changelog (
  id                  bigint generated always as identity primary key,
  domain_id           bigint      not null references unit_domains(id) on delete cascade,
  from_verdict        robots_verdict,
  from_reason         undetermined_reason,
  to_verdict          robots_verdict not null,
  to_reason           undetermined_reason,
  method_version      text        not null,
  changed_on          timestamptz not null default now(),
  note                text
);

create index verdict_changelog_domain_idx on verdict_changelog (domain_id, changed_on desc);

-- 07. Method Versions
create table method_versions (
  version        text primary key,
  named_count    int  not null,
  unnamed_count  int  not null,
  effective_from date not null,
  notes          text
);

-- 08. Question Bank
create table question_bank (
  id             text primary key,
  method_version text not null references method_versions(version),
  kind           text not null check (kind in ('named','unnamed')),
  seq            int  not null,
  body           text not null,
  domain_tag     text,
  block_actor     text,
  block_situation text,
  block_task      text,
  block_knowledge text,
  block_workflow  text,
  block_format    text,
  block_language  text not null default 'ko',
  block_output    text,
  unique (method_version, kind, seq)
);

-- 09. Observations
create table observations (
  id               uuid primary key default gen_random_uuid(),
  unit_id          text        not null references units(id),
  layer            int         not null check (layer in (2,3)),
  method_version   text        not null references method_versions(version),
  measured_on      date        not null,
  ai_service       text        not null,
  model_version    text,
  web_search       boolean     not null,
  language         text        not null default 'ko',
  personalized     boolean,
  repeats          int         not null default 1 check (repeats >= 1),

  named_accurate   int not null default 0 check (named_accurate   >= 0),
  named_partial    int not null default 0 check (named_partial    >= 0),
  named_inaccurate int not null default 0 check (named_inaccurate >= 0),
  named_absent     int not null default 0 check (named_absent     >= 0),

  unnamed_appearances int check (unnamed_appearances >= 0),
  unnamed_slots       int check (unnamed_slots       >= 0),

  submitter_type   submitter_type not null default 'unknown',
  anonymous        boolean        not null default true,
  submitter_email  text,
  note             text,
  status           review_status  not null default 'pending',
  created_at       timestamptz    not null default now(),

  constraint observations_unnamed_bounds
    check (unnamed_appearances is null or unnamed_slots is null
           or unnamed_appearances <= unnamed_slots)
);

create index observations_unit_idx  on observations (unit_id, measured_on desc);
create index observations_layer_idx on observations (layer, method_version);

create or replace function enforce_named_total() returns trigger
language plpgsql as $$
declare expected int;
begin
  select named_count into expected
    from method_versions where version = new.method_version;
  if expected is null then
    raise exception '알 수 없는 method_version: %', new.method_version;
  end if;
  if new.named_accurate + new.named_partial
   + new.named_inaccurate + new.named_absent <> expected then
    raise exception
      '지명 문항 합계가 %와 다릅니다 (받은 값: %). AGENTS.md INV-7 참조',
      expected,
      new.named_accurate + new.named_partial + new.named_inaccurate + new.named_absent;
  end if;
  return new;
end $$;

create trigger observations_named_total
  before insert or update on observations
  for each row execute function enforce_named_total();

-- 10. Item Results
create table item_results (
  observation_id  uuid not null references observations(id) on delete cascade,
  question_id     text not null references question_bank(id),
  rep             int  not null check (rep >= 1),
  verdict         accuracy,
  skeleton_match  boolean,
  detail_match    boolean,
  confabulated    boolean not null default false,
  syndrome        failure_syndrome,
  appeared        boolean,
  rank            int,
  confidence      text check (confidence in ('high','mid','low')),
  cited_sources   text[],
  note            text,
  primary key (observation_id, question_id, rep),

  constraint item_results_syndrome_only_on_failure
    check (syndrome is null or verdict in ('partial','inaccurate','absent')),
  constraint item_results_confabulation_consistent
    check (not confabulated or syndrome = 'confabulation')
);

create index item_results_question_idx on item_results (question_id, verdict);

create or replace function floor_risk_of(p_observation uuid, p_question text)
returns floor_risk
language sql stable
as $$
  select case
    when bool_or(confabulated)                     then 'critical'
    when bool_or(verdict = 'inaccurate')           then 'high'
    when bool_or(verdict = 'absent')               then 'moderate'
    else 'low'
  end::floor_risk
  from item_results
  where observation_id = p_observation and question_id = p_question;
$$;

-- 11. Robustness
create table robustness_runs (
  id             bigint generated always as identity primary key,
  question_id    text not null references question_bank(id),
  method_version text not null references method_versions(version),
  unit_id        text not null references units(id),
  variant        variant_axis not null,
  variant_text   text not null,
  ai_service     text not null,
  rep            int  not null check (rep >= 1),
  verdict        accuracy,
  skeleton_match boolean,
  ran_at         timestamptz not null default now(),
  unique (question_id, method_version, unit_id, variant, ai_service, rep)
);

create table question_robustness (
  question_id    text not null references question_bank(id),
  method_version text not null references method_versions(version),
  divergence     numeric not null,
  threshold      numeric not null,
  sensitive      boolean generated always as (divergence > threshold) stored,
  checked_at     timestamptz not null default now(),
  primary key (question_id, method_version)
);

-- 12. Questions, Statements, Corrections
create table questions (
  id             uuid primary key default gen_random_uuid(),
  unit_id        text references units(id),
  observation_id uuid references observations(id) on delete set null,
  body           text        not null,
  redacted_body  text,
  pii_checked    boolean     not null default false,
  category       text,
  kind           text check (kind in ('named','unnamed')),
  approved       boolean     not null default false,
  created_at     timestamptz not null default now(),

  constraint questions_approved_needs_pii_check
    check (not approved or pii_checked)
);

create table statements (
  id               uuid primary key default gen_random_uuid(),
  unit_id          text not null references units(id) on delete cascade,
  body             text not null,
  author_verified  boolean     not null default false,
  published_at     timestamptz,
  created_at       timestamptz not null default now()
);

create table corrections (
  id          uuid primary key default gen_random_uuid(),
  unit_id     text not null references units(id),
  domain_id   bigint references unit_domains(id),
  claim       text not null,
  contact     text,
  status      correction_status not null default 'received',
  received_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution  text
);

create index corrections_open_idx on corrections (status, received_at);

-- 13. Notifications, Citations, Preregistrations
create table notifications (
  id           bigint generated always as identity primary key,
  unit_id      text           not null references units(id),
  kind         notice_kind    not null,
  channel      notice_channel not null,
  sent_at      timestamptz    not null default now(),
  recipient    text,
  subject      text           not null,
  body_hash    text           not null,
  responded    boolean        not null default false,
  responded_at timestamptz,
  note         text,

  constraint notifications_response_needs_time
    check (not responded or responded_at is not null)
);

create index notifications_unit_idx on notifications (unit_id, sent_at desc);

create table citations (
  id            bigint generated always as identity primary key,
  kind          citation_kind not null,
  source        text          not null,
  url           text,
  cited_on      date          not null,
  unit_id       text          references units(id),
  quote         text,
  accurate      boolean,
  used_our_term boolean,
  term          text,
  attributed    boolean,
  note          text,
  created_at    timestamptz   not null default now(),

  constraint citations_term_needs_flag
    check (term is null or used_our_term is true)
);

create index citations_date_idx on citations (cited_on desc);
create index citations_term_idx on citations (term) where used_our_term;

create table preregistrations (
  id             text primary key,
  title          text          not null,
  claim_id       text          not null,
  hypothesis     text          not null,
  method_version text          references method_versions(version),
  method_summary text          not null,
  criteria       text          not null,
  falsification  text          not null,
  stop_rule      text          not null,
  status         prereg_status not null default 'draft',
  published_at   timestamptz,
  started_at     timestamptz,
  completed_at   timestamptz,
  outcome        text,
  supersedes     text          references preregistrations(id),

  constraint prereg_published_needs_time
    check (status = 'draft' or published_at is not null),
  constraint prereg_published_before_start
    check (started_at is null or (published_at is not null and published_at <= started_at))
);

alter table observations    add column prereg_id text references preregistrations(id);
alter table robustness_runs add column prereg_id text references preregistrations(id);

-- 14. Views
create or replace view v_layer1_coverage as
select u.population,
       v.robots_verdict,
       v.undetermined_reason,
       count(*)::int as unit_count
  from verdicts v
  join unit_domains d on d.id = v.domain_id
  join units        u on u.id = d.unit_id
 where v.published
   and d.role = 'main'
   and u.active
 group by u.population, v.robots_verdict, v.undetermined_reason;

create or replace view v_layer2_participation as
select o.unit_id,
       u.population,
       o.method_version,
       count(*)::int                                   as observation_count,
       count(distinct o.ai_service)::int               as service_count,
       min(o.measured_on)                              as first_measured_on,
       max(o.measured_on)                              as last_measured_on
  from observations o
  join units u on u.id = o.unit_id
 where o.layer = 2 and o.status = 'accepted'
 group by o.unit_id, u.population, o.method_version;

create or replace view v_unit_latest_verdict as
select u.id as unit_id,
       u.name,
       u.name_en,
       u.population,
       u.unit_type,
       u.domain_form,
       u.parent_unit_id,
       u.sgg_code,
       u.is_depop_area,
       d.id as domain_id,
       d.host,
       d.role as domain_role,
       v.robots_verdict,
       v.undetermined_reason,
       v.confirmed_at,
       v.consecutive_weeks,
       v.published
  from units u
  left join unit_domains d on d.unit_id = u.id and d.role = 'main' and d.active
  left join verdicts v on v.domain_id = d.id and v.published
 where u.active;

-- 15. RLS
alter table units            enable row level security;
alter table unit_domains     enable row level security;
alter table verdicts         enable row level security;
alter table tech_scans       enable row level security;
alter table observations     enable row level security;
alter table questions        enable row level security;
alter table statements       enable row level security;
alter table corrections      enable row level security;
alter table scan_jobs        enable row level security;
alter table method_versions   enable row level security;
alter table question_bank    enable row level security;
alter table preregistrations enable row level security;
alter table citations        enable row level security;

create policy units_public_read on units
  for select to anon, authenticated using (active);

create policy unit_domains_public_read on unit_domains
  for select to anon, authenticated using (active);

create policy verdicts_public_read on verdicts
  for select to anon, authenticated using (published);

create policy statements_public_read on statements
  for select to anon, authenticated using (published_at is not null);

create policy method_versions_public_read on method_versions
  for select to anon, authenticated using (true);

create policy question_bank_public_read on question_bank
  for select to anon, authenticated using (true);

create policy preregistrations_public_read on preregistrations
  for select to anon, authenticated using (status <> 'draft');

create policy citations_public_read on citations
  for select to anon, authenticated using (true);

create policy corrections_public_insert on corrections
  for insert to anon, authenticated with check (true);

-- Migration 16: Complete RLS
alter table notifications enable row level security;
create policy "service_role_full_access" on notifications
  for all using (auth.role() = 'service_role');

alter table item_results enable row level security;
create policy "service_role_full_access" on item_results
  for all using (auth.role() = 'service_role');

alter table robustness_runs enable row level security;
create policy "service_role_full_access" on robustness_runs
  for all using (auth.role() = 'service_role');

alter table question_robustness enable row level security;
create policy "service_role_full_access" on question_robustness
  for all using (auth.role() = 'service_role');

alter table verdict_changelog enable row level security;
create policy "service_role_full_access" on verdict_changelog
  for all using (auth.role() = 'service_role');

-- K16: ?�평??측정 ???�?�군�??�답 격차

-- 1. audience_tag ENUM
create type audience_tag as enum (
  'general','older','disability','child_care',
  'low_income','migrant','youth','small_business'
);

-- 2. question_bank??audience 배열 컨럼 추�?
alter table question_bank
  add column audience audience_tag[] not null default '{general}';

create index question_bank_audience_idx on question_bank using gin (audience);

-- 3. ?�깅 기�? ?�력 ?�이�?create table audience_taggings (
  method_version text         not null references method_versions(version),
  question_id    text         not null references question_bank(id),
  audience       audience_tag[] not null,
  prereg_id      text         references preregistrations(id),
  fixed_at       timestamptz  not null default now(),
  rationale      text         not null,
  primary key (method_version, question_id)
);

alter table audience_taggings enable row level security;
create policy "service_role_full_access" on audience_taggings
  for all using (auth.role() = 'service_role');

-- 4. 비교 결과 ?�이�?(prereg_id NOT NULL???�심 ???�전 ?�록 ?�는 비교???�??불�?)
create table audience_comparisons (
  id             bigint generated always as identity primary key,
  prereg_id      text        not null references preregistrations(id),
  claim_id       text        not null,
  method_version text        not null references method_versions(version),
  tag_a          audience_tag not null,
  tag_b          audience_tag not null,
  n_a            int         not null check (n_a > 0),
  n_b            int         not null check (n_b > 0),
  metric         text        not null,
  value_a        numeric     not null,
  value_b        numeric     not null,
  floor_risk_a   floor_risk,
  floor_risk_b   floor_risk,
  interval_low   numeric,
  interval_high  numeric,
  computed_at    timestamptz not null default now(),

  constraint audience_comparisons_distinct_tags check (tag_a <> tag_b),
  constraint audience_comparisons_interval_order
    check (interval_low is null or interval_high is null or interval_low <= interval_high)
);

alter table audience_comparisons enable row level security;
create policy "service_role_full_access" on audience_comparisons
  for all using (auth.role() = 'service_role');
create policy "anon_read_published" on audience_comparisons
  for select to anon, authenticated
  using (exists (
    select 1 from preregistrations p
    where p.id = audience_comparisons.prereg_id
    and p.status in ('running','completed')
  ));

-- supabase/migrations/20260907000020_policy_theme_lab.sql
-- Policy Theme Lab (PRD v3.0, FR-60 ~ FR-68)
-- 주�? 질문·불편 ?�집?�서 질문 지?? ?�책 ?�마 발굴 �?진단 질문 ?�동???�한 ?�이??모델

-- 1. ?�집 미션 ?�??(FR-60)
create table if not exists collection_missions (
  id uuid primary key default gen_random_uuid(),
  unit_id text references units(id) on delete cascade,
  title text not null,
  life_task text not null,           -- 조사 ?�???�활 과업 (주거, ?�봄, ?�동, ?�활?�정 ??
  channels text[] not null default '{online}', -- 'online', 'face_to_face', 'service_contact', 'diary'
  period_start date,
  period_end date,
  scope_note text,                   -- 조사 범위, 빠진 관??�??�계??  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  created_at timestamptz not null default now()
);

-- 2. 주�? ?�수 ?�문 (FR-61, INV-6 ?�문 비공�?보호)
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references collection_missions(id) on delete set null,
  unit_id text references units(id) on delete set null,
  raw_text text not null,            -- ?�문 (?��? 공개 ?�출 금�?)
  input_type text not null default 'question' check (input_type in ('question', 'experience', 'comparison', 'suggestion')),
  source_type text not null default 'citizen' check (source_type in ('citizen', 'facilitator', 'agency', 'researcher', 'ai', 'report')),
  is_real_experience boolean not null default true, -- ?�제 경험 vs ?�반 궁금�?  consent_scope text not null default 'internal' check (consent_scope in ('internal', 'public_anonymized', 'research_only')),
  contact_email text,                -- ?�속 ?�인 ?�락�?(?�택)
  created_at timestamptz not null default now()
);

-- 3. 맥락 보완 ?�보 (FR-62)
create table if not exists submission_contexts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  intended_task text,                -- 그때 ?�려????  blocked_at text,                   -- 질문/?�려?�??발생???�계
  already_checked text,              -- ?��? ?�인???�료??경로
  resolution_status text not null default 'unresolved' check (resolution_status in ('resolved', 'unresolved', 'partial', 'unknown')),
  followup_questions jsonb not null default '[]'::jsonb, -- AI ?�안 ?�속 질문 (?�성 ?�시)
  confirmed_by_participant boolean not null default false, -- 참여??본인 ?�인 ?��?
  created_at timestamptz not null default now()
);

-- 4. ?�제 질문 ?�??(FR-63)
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  unit_id text references units(id) on delete set null,
  submission_ids uuid[] not null default '{}',
  refined_text text not null,        -- 비식�?중립 ?�제 질문 문구
  life_topic text not null check (life_topic in ('housing', 'care', 'mobility', 'work', 'environment', 'culture', 'civic_admin', 'other')),
  task_stage text not null check (task_stage in ('discovery', 'understanding', 'comparison', 'application', 'use', 'post_confirmation', 'unknown')),
  question_function text check (question_function in ('fact', 'condition', 'reason', 'procedure', 'alternative', 'criteria', 'other')),
  difficulty_candidate text check (difficulty_candidate in ('info_absence', 'contradiction', 'understanding_difficulty', 'access', 'procedure', 'supply', 'unknown')),
  source_type text not null default 'citizen' check (source_type in ('citizen', 'facilitator', 'agency', 'researcher', 'ai', 'report')),
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'approved', 'archived')),
  created_at timestamptz not null default now()
);

-- 5. 질문 묶음 (FR-63, 군집 �??�견 보존)
create table if not exists question_clusters (
  id uuid primary key default gen_random_uuid(),
  unit_id text references units(id) on delete set null,
  title text not null,
  representative_question_id uuid references questions(id) on delete set null,
  question_ids uuid[] not null default '{}',
  common_task text,                  -- 공통 과업
  observed_blockage text,            -- 관찰된 막힘
  merge_reason text,                 -- 묶음 ?�유 (?�람 ?�인)
  created_at timestamptz not null default now()
);

-- 6. ?�책 ?�마 브리??(FR-65)
create table if not exists policy_themes (
  id uuid primary key default gen_random_uuid(),
  unit_id text references units(id) on delete set null,
  theme_code text not null unique,   -- ?�별 코드 (?? TH-SW-01, TH-JP-01)
  title text not null,
  core_question text not null,       -- ?�심 질문
  cluster_ids uuid[] not null default '{}',
  target_audience text not null,     -- ?�?�과 ?�황
  observed_patterns text not null,   -- 관찰된 공통?�과 ?�이??경험
  unconfirmed_causes text not null,  -- ?�직 ?�인?��? ?��? ?�인 가??  existing_solutions text,           -- 기존 ?�내·?�도 ?�황
  next_diagnostic_questions jsonb not null default '[]'::jsonb, -- PlaceLab 진단 질문 3~5�?  next_citizen_questions jsonb not null default '[]'::jsonb,    -- ?�장·주�? ?�인 질문 3~5�?  status text not null default 'candidate' check (status in ('candidate', 'context_enriched', 'citizen_confirmed', 'research_ready', 'suspended')),
  created_at timestamptz not null default now()
);

-- ?�덱???�성
create index if not exists idx_collection_missions_unit_id on collection_missions(unit_id);
create index if not exists idx_submissions_mission_id on submissions(mission_id);
create index if not exists idx_submissions_unit_id on submissions(unit_id);
create index if not exists idx_questions_unit_id on questions(unit_id);
create index if not exists idx_questions_topic_stage on questions(life_topic, task_stage);
create index if not exists idx_policy_themes_unit_id on policy_themes(unit_id);

-- RLS ?�성??alter table collection_missions enable row level security;
alter table submissions enable row level security;
alter table submission_contexts enable row level security;
alter table questions enable row level security;
alter table question_clusters enable row level security;
alter table policy_themes enable row level security;

-- RLS ?�책: ?�문(submissions, submission_contexts)?� ?�격 비공�? ?�수(INSERT)�?공개 ?�용 (INV-6)
create policy "allow_anon_submit" on submissions
  for insert to anon, authenticated
  with check (true);

create policy "service_role_all_submissions" on submissions
  for all to service_role
  using (true);

create policy "allow_anon_context_submit" on submission_contexts
  for insert to anon, authenticated
  with check (true);

create policy "service_role_all_contexts" on submission_contexts
  for all to service_role
  using (true);

-- 공개 ?�기 ?�책: 미션, ?�제 질문, 묶음, ?�책 ?�마
create policy "allow_anon_read_missions" on collection_missions
  for select to anon, authenticated
  using (true);
create policy "service_role_all_missions" on collection_missions
  for all to service_role
  using (true);

create policy "allow_anon_read_questions" on questions
  for select to anon, authenticated
  using (status in ('reviewed', 'approved'));
create policy "service_role_all_questions" on questions
  for all to service_role
  using (true);

create policy "allow_anon_read_clusters" on question_clusters
  for select to anon, authenticated
  using (true);
create policy "service_role_all_clusters" on question_clusters
  for all to service_role
  using (true);

create policy "allow_anon_read_themes" on policy_themes
  for select to anon, authenticated
  using (true);
create policy "service_role_all_themes" on policy_themes
  for all to service_role
  using (true);
-- supabase/migrations/20260910000021_kbrandlab_core.sql
-- K-Brand Lab PRD v3.0 코어 ?�이?�베?�스 ?�키�?-- ?�비??질문 기반 브랜???�구, AI ?�답 측정, ?�본·?�셜 ?�정 �?KRole ?�계

-- ============================================================================
-- 1. ENUM ?�???�의
-- ============================================================================

-- 질문 출처 (INV-01)
CREATE TYPE kb_question_source AS ENUM (
  'consumer_actual',
  'researcher_derived',
  'ai_suggested'
);

-- ?�비??6?�계 구매 ?�정 (§5.3)
CREATE TYPE kb_journey_stage AS ENUM (
  'need_discovery',
  'category_exploration',
  'brand_comparison',
  'purchase_terms',
  'usage_troubleshooting',
  'repurchase_churn'
);

-- 브랜??과제 5?� ?�형 (§5.3)
CREATE TYPE kb_issue_type AS ENUM (
  'info_gap',
  'verification_gap',
  'purchase_barrier',
  'product_unfit',
  'new_demand'
);

-- ?�티???�형 (§6.2)
CREATE TYPE kb_entity_type AS ENUM (
  'brand',
  'product',
  'poi',
  'experience'
);

-- 주장 ?�형 (§6.3)
CREATE TYPE kb_claim_type AS ENUM (
  'operational_terms',
  'product_spec_origin',
  'performance_safety',
  'experience_usability',
  'cultural_authenticity'
);

-- 주장 지???�태 (§6.3)
CREATE TYPE kb_claim_knowledge_state AS ENUM (
  'brand_reported',
  'supported',
  'contradicted',
  'insufficient',
  'disputed',
  'expired'
);

-- ?�본 revision ?�태 (§6.3)
CREATE TYPE kb_canonical_status AS ENUM (
  'draft',
  'in_review',
  'approved',
  'published',
  'superseded',
  'expired',
  'withdrawn'
);

-- 검??�??�셜 ?�정 ?�태 (§7.2)
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

-- ?�로�??�형 (§8.3)
CREATE TYPE kb_probe_type AS ENUM (
  'branded',
  'open',
  'h2h',
  'fact_check'
);

-- 기술 ?�집 ?�태 (§8.5)
CREATE TYPE kb_capture_status AS ENUM (
  'captured',
  'technical_failed',
  'cancelled',
  'unattempted'
);

-- ?�답 ?��? 분류 (§8.5)
CREATE TYPE kb_response_semantic AS ENUM (
  'substantive',
  'insufficient',
  'refusal',
  'empty',
  'off_topic',
  'unclassified'
);

-- 출처 관�?권한 (§8.7)
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
-- 2. ?�넌??�??�로?�트 계층
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

-- ?�구 ?�로?�트 ?�위 (Project)
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
-- 3. ?�티??Entity) �??�본(Canonical) 계층
-- ============================================================================

-- 브랜?? ?�품, POI, 체험 ?�티??CREATE TABLE IF NOT EXISTS kb_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES kb_entities(id) ON DELETE SET NULL,
  entity_type kb_entity_type NOT NULL,
  official_name TEXT NOT NULL,
  aliases JSONB NOT NULL DEFAULT '[]'::jsonb, -- ?�어�?별칭 [{lang: 'ko', name: '...'}, {lang: 'en', name: '...'}]
  external_ids JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. barcode, wikidata_id, krole_id
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 증거 �?출처 ?�료
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

-- 미디???�산 (?��?지 ??
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

-- 개별 주장 리비??(ClaimRevision)
CREATE TABLE IF NOT EXISTS kb_claim_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES kb_entities(id) ON DELETE CASCADE,
  revision_number INT NOT NULL DEFAULT 1,
  claim_type kb_claim_type NOT NULL,
  statement TEXT NOT NULL,
  target_condition TEXT, -- ?�용 조건 (?? 2026?�형, ?�정 ?�션 ??
  applicable_market TEXT NOT NULL DEFAULT 'KR',
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  evidence_id UUID REFERENCES kb_evidences(id) ON DELETE SET NULL,
  knowledge_state kb_claim_knowledge_state NOT NULL DEFAULT 'brand_reported',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_id, revision_number)
);

-- ?�본 묶음 (CanonicalRevision)
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
-- 4. 질문 ?�집 �?과제 ?�출 계층
-- ============================================================================

-- 출처 ?�코??(SourceRecord)
CREATE TABLE IF NOT EXISTS kb_source_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  source_type kb_question_source NOT NULL,
  channel_name TEXT NOT NULL, -- e.g. customer_inquiry, product_qa, interview, ai_probe
  original_ref TEXT, -- ?�본 ?�일�??�담 ID ??  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  privacy_cleared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ?�비??질문 (Question)
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

-- 질문 관�?발생 기록 (QuestionObservation: 고유 질문�?발생 ?�수 분리)
CREATE TABLE IF NOT EXISTS kb_question_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES kb_questions(id) ON DELETE CASCADE,
  source_record_id UUID NOT NULL REFERENCES kb_source_records(id) ON DELETE CASCADE,
  raw_occurrence_text TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 브랜??과제 �?기회 ?�마 (Theme / Issue)
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
-- 5. ?�셜 ?�정 계층 (§7)
-- ============================================================================

-- 검??케?�스 (ReviewCase)
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

-- 검?�자 개별 ?�답 (ReviewResponse: ?�립 2??검??�??�해관�??�고, INV-06)
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

-- 진단 질문 ?�트 (ProbeSet)
CREATE TABLE IF NOT EXISTS kb_probe_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  version TEXT NOT NULL DEFAULT 'v1.0',
  title TEXT NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 개별 진단 ?�로�?(Probe)
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

-- 측정 ??(MeasurementRun)
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

-- ?�리??관�??�롯 (MeasurementSlot: 1문항 × 1?�어 × 1?�경 × 1반복, INV-09)
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

-- 물리???�출 ?�도 (MeasurementAttempt: ?�시???�함 모든 ?�제 API ?�출 보존)
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

-- ?�답 ?�정 �??��?분석 (AnswerAssessment)
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
-- 7. KRole 공개, 개입, ?�과 �??�냅??계층 (§10, §13, §14)
-- ============================================================================

-- KRole 공개 발행�?(Publication)
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

-- 개선 개입 기록 (Intervention: ?�후 비교 기�???
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

-- ?�계 ?�품 �??�약 ?�퍼�?(Offering)
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

-- ?�과 ?�건 기록 (OutcomeEvent)
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

-- ?�현 가?�한 보고???�냅??(ReportSnapshot, INV-12)
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
-- 8. Row Level Security (RLS) �??�근 ?�책
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

-- Service Role?� ?�체 ?�이�?무제??관�?DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'kb_%'
  LOOP
    EXECUTE format('CREATE POLICY "service_role_all_%I" ON %I FOR ALL USING (auth.role() = ''service_role'')', t, t);
  END LOOP;
END $$;

-- 공개(anon) ?�용?�는 ?�직 ?�인 �?발행??KRole ?�본�??�퍼링만 ?�람 가??(AC-01)
CREATE POLICY "anon_read_published_canonicals" ON kb_canonical_revisions
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "anon_read_published_publications" ON kb_publications
  FOR SELECT TO anon, authenticated
  USING (is_withdrawn = false);

CREATE POLICY "anon_read_active_offerings" ON kb_offerings
  FOR SELECT TO anon, authenticated
  USING (is_active = true);
