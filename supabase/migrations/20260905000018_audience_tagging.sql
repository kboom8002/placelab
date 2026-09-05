-- K16: 형평성 측정 — 대상군별 응답 격차

-- 1. audience_tag ENUM
create type audience_tag as enum (
  'general','older','disability','child_care',
  'low_income','migrant','youth','small_business'
);

-- 2. question_bank에 audience 배열 컨럼 추가
alter table question_bank
  add column audience audience_tag[] not null default '{general}';

create index question_bank_audience_idx on question_bank using gin (audience);

-- 3. 태깅 기준 이력 테이블
create table audience_taggings (
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

-- 4. 비교 결과 테이블 (prereg_id NOT NULL이 핵심 — 사전 등록 없는 비교는 저장 불가)
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
