-- 20260906000019_aeo_diagnosis.sql
-- 3-Tier AEO 진단 시스템 스키마 (K04 v2.1)

-- Tier 1 확정 질문 (15문항, 전 지자체 공통)
create table if not exists tier1_questions (
  id   text primary key,
  seq  int not null unique,
  category text not null,
  body_template text not null,
  method_version text not null default 'v2.1'
);

-- Tier 2 질문 (지자체별 맞춤, 편집 가능)
create table if not exists tier2_questions (
  id   text primary key,
  unit_id text not null,
  category text not null check (category in (
    'specialty_industry','landmark','local_policy',
    'heritage','geography','local_food','recent_issue'
  )),
  seq  int not null,
  body text not null,
  ground_truth text not null,
  ground_truth_source text,
  difficulty text default 'medium' check (difficulty in ('easy','medium','hard')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (unit_id, seq)
);

-- Tier 3 질문 (지자체별, 템플릿 기반)
create table if not exists tier3_questions (
  id   text primary key,
  unit_id text not null,
  question_type text not null check (question_type in (
    'recommendation','association','keyword_entry',
    'scenario','comparison','negative_test'
  )),
  seq  int not null,
  body text not null,
  target_keywords text[],
  competitor_units text[],
  is_active boolean default true,
  unique (unit_id, seq)
);

-- 크롤링 결과 (Tier 2 생성용)
create table if not exists unit_crawl_corpus (
  id         uuid primary key default gen_random_uuid(),
  unit_id    text not null,
  url        text not null,
  title      text,
  content_summary text,
  content_hash text,
  og_tags    jsonb,
  jsonld     jsonb,
  crawled_at timestamptz default now(),
  unique (unit_id, url)
);

-- AI 생성 질문 후보 (검수 전)
create table if not exists tier2_candidates (
  id         uuid primary key default gen_random_uuid(),
  unit_id    text not null,
  category   text not null,
  body       text not null,
  ground_truth_candidate text,
  source_url text,
  status     text default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz default now()
);

-- 측정 세션
create table if not exists aeo_measurements (
  id           text primary key,
  unit_id      text not null,
  unit_name    text not null,
  method_version text not null default 'v2.1',
  ai_service   text not null,
  model        text not null,
  web_search   text not null default 'on',
  mode         text not null check (mode in ('quick','full')),
  reps         int not null default 3,
  status       text default 'running' check (status in ('running','completed','failed')),
  started_at   timestamptz default now(),
  completed_at timestamptz,
  total_queries int,
  error_count  int default 0
);

-- 관측 결과 (INV-9: 회차별 저장)
create table if not exists aeo_observations (
  id             uuid primary key default gen_random_uuid(),
  measurement_id text not null references aeo_measurements(id),
  tier           text not null check (tier in ('T1','T2','T3')),
  question_id    text not null,
  rep            int not null,
  response       text not null,
  response_hash  text not null,
  verdict        text,
  verdict_detail jsonb,
  cited_urls     text[],
  latency_ms     int,
  created_at     timestamptz default now()
);

create index if not exists idx_aeo_obs_measurement on aeo_observations(measurement_id);
create index if not exists idx_aeo_obs_question on aeo_observations(question_id, rep);

-- Tier 1 시드 데이터 (15문항)
insert into tier1_questions (id, seq, category, body_template) values
  ('B-01', 1,  'birth',       '{unit} 둘째 출산지원금이랑 산후조리비 총 얼마야?'),
  ('B-02', 2,  'move_in',     '{unit} 전입신고 하면 받을 수 있는 혜택 있어?'),
  ('B-03', 3,  'waste',       '{unit} 대형폐기물 스티커 가격이랑 배출 신청 방법 알려줘'),
  ('B-04', 4,  'waste_bag',   '{unit} 종량제봉투 종류별 가격 알려줘'),
  ('B-05', 5,  'civil',       '{unit} 청/군청 민원실 점심시간에도 되는지, 주차요금 얼마야?'),
  ('B-06', 6,  'senior_bus',  '{unit} 어르신 버스비 지원 대상 나이랑 금액 알려줘'),
  ('B-07', 7,  'senior_bath', '{unit} 어르신 목욕권이나 이미용 지원 있어?'),
  ('B-08', 8,  'youth_rent',  '{unit} 청년 월세 지원 대상 조건이랑 지원 금액 알려줘'),
  ('B-09', 9,  'startup',     '{unit} 청년 창업 지원금이나 창업 공간 지원 있어?'),
  ('B-10', 10, 'night_care',  '{unit} 밤에 아이가 아프면 갈 수 있는 소아과 어디야?'),
  ('B-11', 11, 'child_care',  '{unit} 초등 방과후 돌봄교실이나 지역아동센터 정보 알려줘'),
  ('B-12', 12, 'multicultural','{unit} 다문화가족지원센터 위치랑 프로그램 알려줘'),
  ('B-13', 13, 'loan',        '{unit} 소상공인 특례보증 대출 조건 알려줘'),
  ('B-14', 14, 'tax',         '{unit} 소상공인 무료 세무 상담 받을 수 있는 곳 있어?'),
  ('B-15', 15, 'festival',    '{unit} 올해 열리는 대표 축제 일정이랑 장소 안내해줘')
on conflict (id) do nothing;
