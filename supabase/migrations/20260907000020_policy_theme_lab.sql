-- supabase/migrations/20260907000020_policy_theme_lab.sql
-- Policy Theme Lab (PRD v3.0, FR-60 ~ FR-68)
-- 주민 질문·불편 수집에서 질문 지도, 정책 테마 발굴 및 진단 질문 연동을 위한 데이터 모델

-- 1. 수집 미션 대장 (FR-60)
create table if not exists collection_missions (
  id uuid primary key default gen_random_uuid(),
  unit_id text references units(id) on delete cascade,
  title text not null,
  life_task text not null,           -- 조사 대상 생활 과업 (주거, 돌봄, 이동, 생활행정 등)
  channels text[] not null default '{online}', -- 'online', 'face_to_face', 'service_contact', 'diary'
  period_start date,
  period_end date,
  scope_note text,                   -- 조사 범위, 빠진 관점 및 한계점
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  created_at timestamptz not null default now()
);

-- 2. 주민 접수 원문 (FR-61, INV-6 원문 비공개 보호)
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references collection_missions(id) on delete set null,
  unit_id text references units(id) on delete set null,
  raw_text text not null,            -- 원문 (절대 공개 노출 금지)
  input_type text not null default 'question' check (input_type in ('question', 'experience', 'comparison', 'suggestion')),
  source_type text not null default 'citizen' check (source_type in ('citizen', 'facilitator', 'agency', 'researcher', 'ai', 'report')),
  is_real_experience boolean not null default true, -- 실제 경험 vs 일반 궁금증
  consent_scope text not null default 'internal' check (consent_scope in ('internal', 'public_anonymized', 'research_only')),
  contact_email text,                -- 후속 확인 연락처 (선택)
  created_at timestamptz not null default now()
);

-- 3. 맥락 보완 정보 (FR-62)
create table if not exists submission_contexts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  intended_task text,                -- 그때 하려던 일
  blocked_at text,                   -- 질문/어려움이 발생한 단계
  already_checked text,              -- 이미 확인한 자료나 경로
  resolution_status text not null default 'unresolved' check (resolution_status in ('resolved', 'unresolved', 'partial', 'unknown')),
  followup_questions jsonb not null default '[]'::jsonb, -- AI 제안 후속 질문 (합성 표시)
  confirmed_by_participant boolean not null default false, -- 참여자 본인 확인 여부
  created_at timestamptz not null default now()
);

-- 4. 정제 질문 대장 (FR-63)
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  unit_id text references units(id) on delete set null,
  submission_ids uuid[] not null default '{}',
  refined_text text not null,        -- 비식별/중립 정제 질문 문구
  life_topic text not null check (life_topic in ('housing', 'care', 'mobility', 'work', 'environment', 'culture', 'civic_admin', 'other')),
  task_stage text not null check (task_stage in ('discovery', 'understanding', 'comparison', 'application', 'use', 'post_confirmation', 'unknown')),
  question_function text check (question_function in ('fact', 'condition', 'reason', 'procedure', 'alternative', 'criteria', 'other')),
  difficulty_candidate text check (difficulty_candidate in ('info_absence', 'contradiction', 'understanding_difficulty', 'access', 'procedure', 'supply', 'unknown')),
  source_type text not null default 'citizen' check (source_type in ('citizen', 'facilitator', 'agency', 'researcher', 'ai', 'report')),
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'approved', 'archived')),
  created_at timestamptz not null default now()
);

-- 5. 질문 묶음 (FR-63, 군집 및 이견 보존)
create table if not exists question_clusters (
  id uuid primary key default gen_random_uuid(),
  unit_id text references units(id) on delete set null,
  title text not null,
  representative_question_id uuid references questions(id) on delete set null,
  question_ids uuid[] not null default '{}',
  common_task text,                  -- 공통 과업
  observed_blockage text,            -- 관찰된 막힘
  merge_reason text,                 -- 묶음 사유 (사람 승인)
  created_at timestamptz not null default now()
);

-- 6. 정책 테마 브리프 (FR-65)
create table if not exists policy_themes (
  id uuid primary key default gen_random_uuid(),
  unit_id text references units(id) on delete set null,
  theme_code text not null unique,   -- 식별 코드 (예: TH-SW-01, TH-JP-01)
  title text not null,
  core_question text not null,       -- 핵심 질문
  cluster_ids uuid[] not null default '{}',
  target_audience text not null,     -- 대상과 상황
  observed_patterns text not null,   -- 관찰된 공통점과 상이한 경험
  unconfirmed_causes text not null,  -- 아직 확인되지 않은 원인 가설
  existing_solutions text,           -- 기존 안내·제도 현황
  next_diagnostic_questions jsonb not null default '[]'::jsonb, -- PlaceLab 진단 질문 3~5개
  next_citizen_questions jsonb not null default '[]'::jsonb,    -- 현장·주민 확인 질문 3~5개
  status text not null default 'candidate' check (status in ('candidate', 'context_enriched', 'citizen_confirmed', 'research_ready', 'suspended')),
  created_at timestamptz not null default now()
);

-- 인덱스 생성
create index if not exists idx_collection_missions_unit_id on collection_missions(unit_id);
create index if not exists idx_submissions_mission_id on submissions(mission_id);
create index if not exists idx_submissions_unit_id on submissions(unit_id);
create index if not exists idx_questions_unit_id on questions(unit_id);
create index if not exists idx_questions_topic_stage on questions(life_topic, task_stage);
create index if not exists idx_policy_themes_unit_id on policy_themes(unit_id);

-- RLS 활성화
alter table collection_missions enable row level security;
alter table submissions enable row level security;
alter table submission_contexts enable row level security;
alter table questions enable row level security;
alter table question_clusters enable row level security;
alter table policy_themes enable row level security;

-- RLS 정책: 원문(submissions, submission_contexts)은 엄격 비공개, 접수(INSERT)만 공개 허용 (INV-6)
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

-- 공개 읽기 정책: 미션, 정제 질문, 묶음, 정책 테마
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
