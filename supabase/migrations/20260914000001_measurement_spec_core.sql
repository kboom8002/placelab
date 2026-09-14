-- supabase/migrations/20260914000001_measurement_spec_core.sql
-- docs/measurement-spec: 지자체 정보 상태 측정 규격 코어 테이블 및 불변식 제약
-- 불변식: 판정(judged_by)은 오직 'rule'만 허용, 총점/순위/등급/가중치/빈칸수/예측치 컬럼 금지,
--        전국 공표문(national_report)은 사전 통지(notified_at) 및 확인 기간 종료(review_closed_at) 필수.

-- 1. 응답 원문 (Response Records - 요약 필드 없음, 전량 무손실 보존)
create table if not exists spec_response_records (
  response_id    text primary key,
  question_id    text not null,
  agency_handle  text not null,
  run_profile_id text not null,
  attempt        int  not null check (attempt >= 1),
  observed_at    timestamptz not null,
  outcome        text not null check (outcome in ('answered', 'refused', 'error')),
  raw_text       text not null,
  body_urls      text[] not null default '{}',
  citation_urls  text[] not null default '{}',
  error_detail   text,
  created_at     timestamptz not null default now()
);

create index if not exists spec_resp_agency_idx on spec_response_records (agency_handle, question_id);
create index if not exists spec_resp_profile_idx on spec_response_records (run_profile_id);

-- 2. 관측 레코드 (Observations - 추출까지만 담고 판정은 담지 않음)
create table if not exists spec_observations (
  observation_id text primary key,
  question_id    text not null,
  agency_handle  text not null,
  run_profile_id text not null,
  window_start   timestamptz not null,
  window_end     timestamptz not null,
  response_ids   text[] not null check (cardinality(response_ids) >= 1),
  extracted      jsonb not null,
  extracted_by   text not null check (extracted_by in ('model', 'rule', 'human')),
  unstable       boolean not null default false,
  access_state   jsonb,
  note           text,
  created_at     timestamptz not null default now()
);

create index if not exists spec_obs_agency_idx on spec_observations (agency_handle, question_id);

-- 3. 판정 레코드 (Verdicts - 규칙과 원장 대조로만 판정, judged_by = 'rule')
create table if not exists spec_verdicts (
  verdict_id          text primary key,
  observation_id      text not null references spec_observations(observation_id),
  question_id         text not null,
  agency_handle       text not null,
  result              text not null check (result in ('match', 'mismatch', 'not_confirmed')),
  nonresponse_code    text check (nonresponse_code in ('N1', 'N2', 'N3', 'N4', 'N5')),
  mismatch_code       text check (mismatch_code in ('C0', 'C1', 'C2', 'C3', 'C4')),
  ledger_value        text,
  ledger_value_nature text check (ledger_value_nature in ('measured', 'estimated', 'planned', 'unstated')),
  ledger_stale        boolean not null default false,
  name_collision      text[] not null default '{}',
  judged_by           text not null check (judged_by = 'rule'), -- 언어 모형 개입 절대 금지
  judged_at           timestamptz not null default now(),
  ledger_as_of        date not null,
  billable            boolean not null default true,
  note                text,

  constraint verdict_mismatch_code_required check (
    result <> 'mismatch' or mismatch_code is not null
  ),
  constraint verdict_stale_ledger_unconfirmed check (
    not ledger_stale or result = 'not_confirmed'
  )
);

create index if not exists spec_verdict_agency_idx on spec_verdicts (agency_handle, question_id);

-- 4. 질문과 주체의 격자 (Grids - 정본 부재 및 소관 귀속)
create table if not exists spec_grids (
  grid_id        text primary key,
  agency_handle  text not null,
  window_start   timestamptz not null,
  window_end     timestamptz not null,
  rows           jsonb not null,
  note           text,
  created_at     timestamptz not null default now()
);

create index if not exists spec_grids_agency_idx on spec_grids (agency_handle);

-- 5. 역점사업 레코드 (Projects - 기관별 통보서 경로 전용, 3대 자격 요건 필수)
create table if not exists spec_projects (
  project_id         text primary key,
  agency_handle      text not null,
  official_name      text not null check (length(official_name) >= 1),
  budgeted           boolean not null check (budgeted = true),
  owned              boolean not null check (owned = true),
  named              boolean not null check (named = true),
  owning_department  text not null,
  stage              text not null check (stage in ('planned', 'reviewed', 'noticed', 'started', 'changed', 'completed', 'operating')),
  stage_as_of        date not null,
  stage_ledger       text not null,
  ledger_stale       boolean not null default false,
  canonical_url      text,
  press_release_urls text[] not null default '{}',
  value_facts        jsonb not null default '[]',
  withheld           jsonb not null default '[]',
  sensitivity        text not null default 'agency_only' check (sensitivity = 'agency_only'),
  note               text,
  created_at         timestamptz not null default now()
);

create index if not exists spec_projects_agency_idx on spec_projects (agency_handle);

-- 6. 산출물 레코드 (Outputs - 5대 절 순서 고정, 3개 공표 경로 격리)
create table if not exists spec_outputs (
  output_id        text primary key,
  channel          text not null check (channel in ('national_report', 'agency_notice', 'anonymized_dataset')),
  proxy_notice     text not null check (length(proxy_notice) >= 1),
  run_profile_id   text not null,
  observed_start   timestamptz not null,
  observed_end     timestamptz not null,
  ledger_as_of     date not null,
  notified_at      timestamptz,
  review_closed_at timestamptz,
  band             text,
  band_of          text,
  sections         jsonb not null,
  note             text,
  created_at       timestamptz not null default now(),

  constraint spec_output_national_gate check (
    channel <> 'national_report' or (notified_at is not null and review_closed_at is not null)
  )
);

create index if not exists spec_outputs_channel_idx on spec_outputs (channel);

-- 7. RLS 활성화 및 권한 설정
alter table spec_response_records enable row level security;
alter table spec_observations    enable row level security;
alter table spec_verdicts        enable row level security;
alter table spec_grids           enable row level security;
alter table spec_projects        enable row level security;
alter table spec_outputs         enable row level security;

create policy "service_role_manage_spec" on spec_response_records for all using (auth.role() = 'service_role');
create policy "service_role_manage_spec_obs" on spec_observations for all using (auth.role() = 'service_role');
create policy "service_role_manage_spec_verdicts" on spec_verdicts for all using (auth.role() = 'service_role');
create policy "service_role_manage_spec_grids" on spec_grids for all using (auth.role() = 'service_role');
create policy "service_role_manage_spec_projects" on spec_projects for all using (auth.role() = 'service_role');
create policy "service_role_manage_spec_outputs" on spec_outputs for all using (auth.role() = 'service_role');

create policy "public_read_published_outputs" on spec_outputs
  for select to anon, authenticated
  using (channel = 'national_report' and review_closed_at is not null and review_closed_at <= now());
