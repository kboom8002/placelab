-- 20261017000002_jeongdap_phase1_core.sql
-- 모두의 정답노트 (Jeongdap Note) Phase 1 데이터 모델 (FR-81 ~ FR-92, ADR-0014 ~ ADR-0024)
-- 기존 테이블(units, unit_domains, observations, item_results, tech_scans, verdicts)은 파괴하지 않고 확장·보존한다.
-- 모든 신규 테이블에 RLS를 활성화한다.
--
-- 되돌리는 법:
--   하단 신규 테이블(audit_log, publications, band_boundaries, portal_*, weekly_*, observe_mentions,
--   identity_checks, probe_*, cited_pages, request_profiles, ai_services, facts, unit_aliases, unit_id_map)을
--   역순으로 drop table if exists ... cascade; 수행.

-- 1. 단위 마스터 합집합 확장 및 ID 매핑 (ADR-0022, FR-81)
alter type population_type add value if not exists 'metro';
alter type population_type add value if not exists 'basic';

alter table units
  add column if not exists unit_kind text check (unit_kind in ('national','metro','basic','emd','special_zone')),
  add column if not exists admin_code text,
  add column if not exists successor_unit_id text references units(id),
  add column if not exists valid_from date default '2026-01-01',
  add column if not exists valid_to date;

create table if not exists unit_id_map (
  unit_id     text not null references units(id) on delete cascade,
  scheme      text not null check (scheme in ('gazetteer','mois_sgg','site_code','legacy_kplacelab')),
  external_id text not null,
  created_at  timestamptz not null default now(),
  primary key (scheme, external_id)
);

create table if not exists unit_aliases (
  id                   bigserial primary key,
  unit_id              text not null references units(id) on delete cascade,
  alias                text not null,
  lang                 text not null default 'ko' check (lang in ('ko','en','ja','zh-hans','zh-hant')),
  kind                 text not null default 'short' check (kind in ('official','short','historical','foreign')),
  min_context_required boolean not null default false,
  created_at           timestamptz not null default now(),
  unique (unit_id, alias, lang)
);

alter table unit_domains
  add column if not exists domain_kind text default 'self'
    check (domain_kind in ('self','metro','central','linked_agency','culture','other')),
  add column if not exists verification_status text default 'confirmed'
    check (verification_status in ('confirmed','needs_check')),
  add column if not exists verified_by text,
  add column if not exists verified_at timestamptz;

-- 2. 정본(Facts) — 이중 시간축, 덮어쓰기 금지, 고위험 2출처 제약 (ADR-0004/0014, FR-82)
create table if not exists facts (
  id                   uuid primary key default gen_random_uuid(),
  unit_id              text not null references units(id),
  attribute_code       text not null,
  risk_level           text not null default 'medium' check (risk_level in ('high','medium','low')),
  value_text           text,
  numbers_norm         text,
  answer_key           text,
  source_urls          text[] not null default '{}',
  supply_gap           boolean not null default false,
  not_applicable       boolean not null default false,
  supply_gap_judged_by text,
  review_status        text not null default 'ai_draft' check (review_status in ('ai_draft','confirmed','superseded')),
  valid_from           timestamptz not null default now(),
  valid_to             timestamptz,
  recorded_at          timestamptz not null default now(),
  constraint facts_high_risk_two_sources_when_confirmed
    check (
      review_status <> 'confirmed'
      or supply_gap = true
      or not_applicable = true
      or risk_level <> 'high'
      or array_length(source_urls, 1) >= 2
    )
);

-- 3. 문항 세트·템플릿·인스턴스·기대표 (INV-10, INV-16, FR-82, FR-86)
create table if not exists probe_sets (
  id             text primary key,
  title          text not null,
  method_version text not null references method_versions(version),
  layer          text not null check (layer in ('A_national_scan','B_harm_precision','C_weekly','D_panel','E_active','culture_track')),
  content_hash   text not null,
  frozen         boolean not null default false,
  frozen_at      timestamptz,
  prereg_id      text references preregistrations(id),
  created_at     timestamptz not null default now()
);

create table if not exists probe_templates (
  qid            text primary key,
  category       text not null check (category in ('national_rep','civic_admin','local_culture','placebo','anchor')),
  life_area      text not null,
  func_kind      text not null check (func_kind in ('fact','link','recommend','risk')),
  risk_level     text not null default 'medium' check (risk_level in ('high','medium','low')),
  template_ko    text not null,
  template_en    text,
  placebo_kind   text check (placebo_kind in ('fictional_entity','other_region_entity','similar_name_entity')),
  disaster       boolean not null default false,
  holdout        boolean not null default false,
  approved       boolean not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists probe_instances (
  instance_id    text primary key,
  set_id         text not null references probe_sets(id) on delete restrict,
  qid            text not null references probe_templates(qid),
  unit_id        text references units(id),
  lang           text not null default 'ko' check (lang in ('ko','en','ja','zh-hans','zh-hant')),
  question_text  text not null,
  fact_id        uuid references facts(id),
  status         text not null default '확정' check (status in ('확정','확인 필요','보류')),
  disaster       boolean not null default false,
  holdout        boolean not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists probe_expectations (
  id             uuid primary key default gen_random_uuid(),
  instance_id    text not null references probe_instances(instance_id) on delete cascade,
  unit_id        text not null references units(id),
  declaration    text not null check (declaration in ('대표 자산','나올 만함','약함','해당 없음')),
  declarer_a     text not null,
  declarer_b     text not null,
  content_hash   text not null,
  created_at     timestamptz not null default now(),
  unique (instance_id, unit_id)
);

-- 4. AI 서비스·요청 프로필·실행·답변·인용·인용 페이지·판정 (INV-6, INV-7, INV-9, INV-13)
create table if not exists ai_services (
  id           text primary key,
  role         text not null check (role in ('precision','observe')),
  masked_label text not null,
  provider     text not null,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists request_profiles (
  id               text primary key,
  service_id       text not null references ai_services(id),
  role             text not null check (role in ('precision','observe')),
  model_default    text not null,
  tools_json       jsonb not null default '[{"type":"web_search"}]'::jsonb,
  include_json     jsonb not null default '["web_search_call.action.sources"]'::jsonb,
  has_instructions boolean not null default false,
  location_signal  boolean not null default false,
  profile_hash     text not null,
  created_at       timestamptz not null default now(),
  constraint request_profiles_precision_no_instructions
    check (role <> 'precision' or (has_instructions = false and location_signal = false))
);

create table if not exists probe_rounds (
  id             text primary key,
  title          text not null,
  set_id         text not null references probe_sets(id),
  prereg_id      text references preregistrations(id),
  block_no       smallint not null default 1 check (block_no >= 1),
  status         text not null default 'planned' check (status in ('planned','running','completed','halted')),
  halt_reason    text,
  started_at     timestamptz,
  completed_at   timestamptz,
  created_at     timestamptz not null default now()
);

create table if not exists probe_runs (
  id                  uuid primary key default gen_random_uuid(),
  round_id            text not null references probe_rounds(id) on delete cascade,
  profile_id          text not null references request_profiles(id),
  method_version      text not null references method_versions(version),
  ai_service          text not null references ai_services(id),
  model_version       text not null,
  search_tool_version text not null default 'web_search',
  web_search          boolean not null,
  language            text not null,
  location_signal     boolean not null default false check (location_signal = false),
  measured_on         date not null,
  day_index           smallint not null default 1 check (day_index between 1 and 7),
  created_at          timestamptz not null default now()
);

create table if not exists probe_answers (
  run_id         uuid not null references probe_runs(id) on delete cascade,
  instance_id    text not null references probe_instances(instance_id),
  rep            smallint not null check (rep >= 1),
  response_id    text,
  status         text not null default 'ok' check (status in ('ok','error')),
  error_code     text,
  retry_count    smallint not null default 0,
  raw_hash       text not null,
  raw_storage_key text,
  short_quote    text check (char_length(short_quote) <= 280),
  asked_at       timestamptz not null default now(),
  primary key (run_id, instance_id, rep)
);

create table if not exists probe_tool_results (
  id          bigserial primary key,
  run_id      uuid not null,
  instance_id text not null,
  rep         smallint not null,
  ord         smallint not null,
  url         text not null,
  domain_kind text not null default 'other',
  foreign key (run_id, instance_id, rep) references probe_answers(run_id, instance_id, rep) on delete cascade
);

create table if not exists probe_citations (
  id          bigserial primary key,
  run_id      uuid not null,
  instance_id text not null,
  rep         smallint not null,
  ord         smallint not null,
  url         text not null,
  title       text,
  domain_kind text not null default 'other',
  foreign key (run_id, instance_id, rep) references probe_answers(run_id, instance_id, rep) on delete cascade
);

create table if not exists cited_pages (
  id             bigserial primary key,
  url            text not null,
  fetched_at     timestamptz not null default now(),
  http_status    smallint,
  body_hash      text,
  last_modified  text,
  robots_allowed boolean not null default true
);

-- append-only 판정 테이블 (MUST NOT 3: 수정·삭제 금지)
create table if not exists probe_judgments (
  id                uuid primary key default gen_random_uuid(),
  run_id            uuid not null,
  instance_id       text not null,
  rep               smallint not null,
  judge_type        text not null check (judge_type in ('auto','human','cross','adjudicated')),
  rater_id          uuid,
  stage1_search     boolean not null,
  stage2_read       boolean not null,
  stage3_first      boolean not null,
  stage4_category   text not null check (stage4_category in (
    'present_match','differ','no_info','undetermined_page_ok',
    'official_conflict','supply_gap','not_applicable','pending',
    'match_candidate','mismatch_candidate'
  )),
  supply_gap        boolean not null default false,
  not_applicable    boolean not null default false,
  harm_possible     boolean not null default false,
  placebo_fp        boolean not null default false,
  note              text,
  created_at        timestamptz not null default now(),
  foreign key (run_id, instance_id, rep) references probe_answers(run_id, instance_id, rep) on delete restrict
);

-- 5. 상시 관측·주간 질문 (FR-85, FR-91)
create table if not exists weekly_questions (
  week_code   text primary key,
  mode        text not null check (mode in ('defense','active')),
  question_ko text not null,
  life_area   text not null,
  disaster    boolean not null default false check (disaster = false),
  published   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists observe_mentions (
  id             bigserial primary key,
  week_code      text not null,
  day_code       text not null check (day_code in ('mon','wed','fri')),
  q_id           text not null,
  lang           text not null default 'ko',
  unit_id        text not null references units(id),
  matched_term   text not null,
  official_cited boolean not null default false,
  created_at     timestamptz not null default now()
);

-- 6. 지자체 포털 등록부 — 정비 사건 · 알리기 사건 · 선언표 (FR-92)
create table if not exists portal_declarations (
  id            uuid primary key default gen_random_uuid(),
  unit_id       text not null references units(id),
  stage         text not null default 'default' check (stage in ('default','registered')),
  kind          text not null check (kind in ('알릴','낡은','알리지 않을')),
  element       text not null,
  keywords      text[] not null default '{}',
  source_url    text,
  content_hash  text not null,
  registered_by uuid,
  created_at    timestamptz not null default now()
);

create table if not exists portal_repair_events (
  id              uuid primary key default gen_random_uuid(),
  unit_id         text not null references units(id),
  type_codes      text[] not null check (array_length(type_codes, 1) >= 1),
  page_url        text not null,
  occurred_at     timestamptz not null default now(),
  before_hash     text,
  after_hash      text,
  delivery_status text not null default 'pending' check (delivery_status in ('pending','confirmed','unconfirmed')),
  publish_consent boolean not null default false,
  source          text not null default 'gov' check (source in ('auto','gov')),
  created_at      timestamptz not null default now()
);

create table if not exists portal_publish_events (
  id          uuid primary key default gen_random_uuid(),
  unit_id     text not null references units(id),
  type_code   text not null check (type_code in ('M','E','P','G','R','W')),
  title       text not null,
  target_url  text not null,
  published_on date not null default current_date,
  remeasure_2w_status text not null default 'scheduled' check (remeasure_2w_status in ('scheduled','completed')),
  remeasure_6w_status text not null default 'scheduled' check (remeasure_6w_status in ('scheduled','completed')),
  created_at  timestamptz not null default now()
);

-- 7. 구간 경계 및 공표 승인 기록 (ADR-0018, INV-9, INV-17)
create table if not exists band_boundaries (
  id             uuid primary key default gen_random_uuid(),
  population     population_type not null,
  method_version text not null references method_versions(version),
  prereg_id      text not null references preregistrations(id),
  high_min_rate  numeric(5,4) not null check (high_min_rate > mid_min_rate and high_min_rate <= 1),
  mid_min_rate   numeric(5,4) not null check (mid_min_rate >= 0),
  locked_at      timestamptz not null default now(),
  unique (population, method_version)
);

create table if not exists publications (
  id                      uuid primary key default gen_random_uuid(),
  round_id                text references probe_rounds(id),
  prereg_id               text not null references preregistrations(id),
  query_version           text not null,
  as_of_date              date not null,
  result_hash             text not null,
  disaster_excluded_check boolean not null default true check (disaster_excluded_check = true),
  approved_by             text not null,
  published_at            timestamptz not null default now()
);

-- 8. 감사 로그 (보류 문항 접근, 원문 열람, 원본 기록 제공)
create table if not exists audit_log (
  id          bigserial primary key,
  actor_id    uuid,
  action_kind text not null check (action_kind in ('holdout_access','raw_answer_view','record_export','publication_approve')),
  target_ref  text not null,
  reason      text,
  created_at  timestamptz not null default now()
);

-- 9. RLS 활성화 (AGENTS.md MUST 4)
alter table unit_id_map enable row level security;
alter table unit_aliases enable row level security;
alter table facts enable row level security;
alter table probe_sets enable row level security;
alter table probe_templates enable row level security;
alter table probe_instances enable row level security;
alter table probe_expectations enable row level security;
alter table ai_services enable row level security;
alter table request_profiles enable row level security;
alter table probe_rounds enable row level security;
alter table probe_runs enable row level security;
alter table probe_answers enable row level security;
alter table probe_tool_results enable row level security;
alter table probe_citations enable row level security;
alter table cited_pages enable row level security;
alter table probe_judgments enable row level security;
alter table weekly_questions enable row level security;
alter table observe_mentions enable row level security;
alter table portal_declarations enable row level security;
alter table portal_repair_events enable row level security;
alter table portal_publish_events enable row level security;
alter table band_boundaries enable row level security;
alter table publications enable row level security;
alter table audit_log enable row level security;

-- 공개 읽기 정책 (보류 holdout 및 재난 disaster 제외)
create policy "public_read_unit_id_map" on unit_id_map for select using (true);
create policy "public_read_unit_aliases" on unit_aliases for select using (true);
create policy "public_read_probe_sets" on probe_sets for select using (frozen = true);
create policy "public_read_probe_templates" on probe_templates for select using (holdout = false and disaster = false and approved = true);
create policy "public_read_probe_instances" on probe_instances for select using (holdout = false and disaster = false);
create policy "public_read_ai_services" on ai_services for select using (true);
create policy "public_read_request_profiles" on request_profiles for select using (true);
create policy "public_read_weekly_questions" on weekly_questions for select using (published = true and disaster = false);
create policy "public_read_band_boundaries" on band_boundaries for select using (true);
create policy "public_read_publications" on publications for select using (true);
create policy "public_read_consented_repair_events" on portal_repair_events for select using (publish_consent = true);
