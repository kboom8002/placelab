# SDD 02 — 데이터 모델

> 기준: PostgreSQL (Supabase). 아래 DDL은 **설계 기준**이며 실제 마이그레이션은 `supabase/migrations/`에 나눠 작성한다. 이름은 영어 snake_case.

## 1. 확장·열거형
```sql
create extension if not exists pg_trgm;     -- 지역·옛 이름 검색
-- gen_random_uuid()는 PostgreSQL 13+ 기본 제공

create type region_level as enum ('national','metro','basic','admin_city','dong');
create type fact_grade as enum ('candidate','L1','L2','L3');            -- 후보·주민·담당·공식
create type fact_status as enum ('confirmed','conflict','expired','scheduled');
create type q_slot as enum ('A','B','C','D','E');                        -- 공통 코어·층별 기본·지역 특화·주민 제안·통제
create type q_lang as enum ('ko','en','ja','zh_hant','zh_hans');
create type search_mode as enum ('search_off','search_on');
create type judgment_label as enum ('ok','old','nofact','mix','unk','undecidable');
create type judge_type as enum ('auto','human','adjudicated');
create type pub_stage as enum ('draft','embargo','fact_check','published','corrected');
create type correction_type as enum ('canon','crawl','source','multilingual');
create type correction_status as enum ('pending_assign','in_progress','remeasure_scheduled','resolved');
create type l10n_stage as enum ('ai_draft','ai_check','native1','native2','adjudicated','registered');
create type app_role as enum ('citizen','crew','rater','native_reviewer','gov_official','gov_admin','ops_editor','ops_measure','ops_admin');
```

## 2. 지역·에디션
```sql
create table regions (
  code text primary key,                 -- 행정 코드(행정표준코드 기반) 또는 'KR'
  level region_level not null,
  name_ko text not null,
  short_name text,
  parent_code text references regions(code),
  slug text not null unique,             -- 'jeju/seogwipo/daejeong'
  valid_from date not null,
  valid_to date,                         -- null = 현행
  is_virtual boolean not null default false,
  created_at timestamptz not null default now()
);
create index on regions (parent_code);
create index regions_name_trgm on regions using gin (name_ko gin_trgm_ops);

create table region_successions (
  from_code text references regions(code),
  to_code text references regions(code),
  effective_date date not null,
  kind text not null check (kind in ('merge','split','rename')),
  source text not null,                  -- 공식 고시·법령 근거
  primary key (from_code, to_code)
);

create table region_aliases (
  region_code text references regions(code),
  alias text not null,
  kind text not null check (kind in ('old_name','common_name')),
  primary key (region_code, alias)
);
create index region_alias_trgm on region_aliases using gin (alias gin_trgm_ops);

create table editions (
  region_code text primary key references regions(code),
  brand_name text not null,              -- '서귀포 정답노트'
  contract_status text not null default 'none' check (contract_status in ('none','pilot','contract')),
  co_brand boolean not null default false, -- 계약일 때만 true 허용
  langs q_lang[] not null default '{ko}',
  constraint co_brand_requires_contract check (not co_brand or contract_status = 'contract')
);
```

## 3. 속성 사전·대상·정본
```sql
create table attributes (
  code text primary key,                 -- 'life.library_closed'
  area text not null check (area in ('life','tour','traffic','welfare','foreign','safety')),
  name_ko text not null,
  value_type text not null,              -- 'weekday_rule','timetable','date_range','money','address','contact','list','route','condition','name_succession'
  volatility text not null check (volatility in ('fixed','periodic','event','temporary','institutional')),
  layers text[] not null,                -- {'metro','basic','dong'}
  is_core boolean not null default false,
  is_risk boolean not null default false,
  status text not null default 'active' check (status in ('active','candidate')),
  version text not null default 'v0.1'
);

create table entities (
  id uuid primary key default gen_random_uuid(),
  region_code text not null references regions(code),
  name_ko text not null,
  kind text not null,                    -- 'office','library','attraction','port','service',...
  address text, lat numeric(9,6), lng numeric(9,6),  -- PostGIS 의존 없이 (ADR-013)
  confusion_group_id uuid                -- 혼동 묶음(같은 그룹의 다른 대상 값 = 혼동 값)
);

create table entity_names (               -- 명칭 용어집
  entity_id uuid references entities(id),
  lang q_lang not null,
  name text not null,
  kind text not null check (kind in ('official','alias','old','misspelling')),
  review_status text not null default 'pending' check (review_status in ('pending','reviewing','approved')),
  primary key (entity_id, lang, name)
);

create table facts (                      -- 정본: 덮어쓰기 금지
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references entities(id),
  attribute_code text not null references attributes(code),
  value jsonb not null,                  -- 정규화 값 (04 §2)
  conditions jsonb,                      -- 예외
  valid_from date, valid_to date,        -- 유효 시간
  recorded_at timestamptz not null default now(),  -- 기록 시간
  grade fact_grade not null default 'candidate',
  status fact_status not null default 'confirmed',
  evidence jsonb not null default '[]',  -- [{type,url,storage_path,by,at}]
  superseded_by uuid references facts(id),
  created_by uuid
);
create index on facts (entity_id, attribute_code, valid_from);

create table fact_texts (                 -- 다국어 정본 문장
  fact_id uuid references facts(id),
  lang q_lang not null,
  text text not null,
  review_status text not null default 'pending',
  primary key (fact_id, lang)
);
```

## 4. 질문·세트·답안지
```sql
create table questions (
  id uuid primary key default gen_random_uuid(),
  region_code text not null references regions(code),
  entity_id uuid references entities(id),
  attribute_code text not null,          -- 후보 속성은 'xxx.yyy*' 허용 (status=candidate)
  slot q_slot not null,
  is_tourist boolean not null default false,  -- 다국어 측정 대상
  status text not null default 'draft' check (status in ('draft','ready','retired'))
);

create table question_texts (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id),
  lang q_lang not null,
  variant smallint not null check (variant in (1,2)),   -- 1 구어체 · 2 검색어체
  text text not null,
  review_status l10n_stage not null default 'ai_draft', -- ko는 'registered'로 생성 가능
  text_hash text not null,               -- sha256(text), 앱 또는 트리거에서 계산 (생성 열은 함수 변동성 문제로 쓰지 않음)
  unique (question_id, lang, variant)
);

create table question_sets (
  id uuid primary key default gen_random_uuid(),
  region_code text not null references regions(code),
  layer region_level not null,
  version text not null,                 -- 'KR-기초-v1.0'
  frozen boolean not null default false,
  preregistered_at timestamptz,
  hash text                               -- 항목 text_hash 정렬 연결의 sha256
);
create table question_set_items (
  set_id uuid references question_sets(id),
  question_text_id uuid references question_texts(id),
  primary key (set_id, question_text_id)
);

create table answer_keys (                -- 정본에서 생성 (04 §3)
  question_id uuid references questions(id),
  as_of date not null,
  correct jsonb not null,                -- 정규화 정답
  variants text[] not null default '{}',
  old_values jsonb not null default '[]',
  confusion_values jsonb not null default '[]',
  required jsonb not null default '[]',
  fact_ids uuid[] not null,
  primary key (question_id, as_of)
);
```

## 5. 측정·판정·집계
```sql
create table services (
  id uuid primary key default gen_random_uuid(),
  masked_label text not null unique,     -- '서비스 A'
  provider text not null, model text,
  market_lang q_lang,                    -- null = 기본 패널
  active boolean not null default true
);
create table service_terms (service_id uuid references services(id), checked_at date, allows_search bool, allows_locale bool, publish_scope text, notes text);
create table model_versions (service_id uuid references services(id), model_id text, first_seen timestamptz, canary_shift boolean default false);
create table prompt_versions (id uuid primary key default gen_random_uuid(), purpose text check (purpose in ('judge','l10n_draft','l10n_check','claim_extract')), version text, text_hash text, created_at timestamptz default now());

create table rounds (
  id text primary key,                   -- '2026-R1'
  name text not null, period tstzrange, scope text, status text not null default 'planned'
);

create table run_jobs (
  id uuid primary key default gen_random_uuid(),
  round_id text references rounds(id),
  question_text_id uuid references question_texts(id),
  service_id uuid references services(id),
  mode search_mode not null,
  repeat_no smallint not null,
  idem_key text not null unique,         -- sha256(round|qt|service|mode|repeat)
  status text not null default 'queued', attempts int not null default 0, cost_usd numeric(10,5)
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references run_jobs(id),
  raw_text text not null, citations jsonb, model_id text, latency_ms int,
  created_at timestamptz not null default now()
);

create table judgments (                  -- insert only
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references answers(id),
  judge_type judge_type not null, judge_id uuid,
  label judgment_label not null,
  risk boolean not null default false,
  entity_match boolean,                  -- 명칭 정답률용
  confidence real,
  answer_key_as_of date not null, rule_version text not null, prompt_version_id uuid,
  reason text,
  created_at timestamptz not null default now()
);

create table calibrations (question_text_id uuid, service_id uuid, app_label judgment_label, tester_id uuid, screenshot_path text, measured_at timestamptz);

create table scorecards (                 -- 집계 결과 (순위 컬럼 금지)
  id uuid primary key default gen_random_uuid(),
  region_code text not null references regions(code), round_id text not null references rounds(id),
  area text, lang q_lang, mode search_mode, service_id uuid,     -- null = 전체
  n_units int not null, rate real, ci_low real, ci_high real, delta real,
  name_rate real, counts jsonb           -- 동 단위 건수
);
-- null(=전체)을 포함한 조합의 유일성
create unique index scorecards_uniq on scorecards (region_code, round_id, coalesce(area,'*'), coalesce(lang::text,'*'), coalesce(mode::text,'*'), coalesce(service_id::text,'*'));

create table publications (
  id uuid primary key default gen_random_uuid(),
  round_id text references rounds(id), region_code text references regions(code),
  stage pub_stage not null default 'draft',
  embargo_until timestamptz, fact_check_due timestamptz, published_at timestamptz, correction_note text
);
create table report_files (round_id text, region_code text, lang q_lang, kind text check (kind in ('web','pdf','csv')), path text, hash text);
```

## 6. 참여·지자체·현지화
```sql
create table profiles (user_id uuid primary key references auth.users(id), alias text not null, region_code text, langs q_lang[], is_minor boolean not null default false, trained_at timestamptz);
create table user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id), role app_role not null, region_code text references regions(code), lang q_lang);
create unique index user_roles_uniq on user_roles (user_id, role, coalesce(region_code,''), coalesce(lang::text,''));
create table consents (user_id uuid, purpose text, granted_at timestamptz, revoked_at timestamptz);

create table claims (id uuid primary key default gen_random_uuid(), region_code text not null, lang q_lang not null default 'ko', question_text text, ai_text text not null, evidence_url text, status text not null default 'received', reporter_id uuid, created_at timestamptz default now());
create table proposals (id uuid primary key default gen_random_uuid(), region_code text not null, text text not null, area text, status text not null default 'reviewing', created_by uuid, created_at timestamptz default now());
create table votes (proposal_id uuid references proposals(id), user_id uuid, region_code text not null, primary key (proposal_id, user_id));
-- 지역별 1인 1표: 같은 user·region에서 같은 제안 중복 금지(PK) + 지역 내 제안 수 제한은 정책으로 (03 §4)

create table corrections (id uuid primary key default gen_random_uuid(), region_code text, judgment_id uuid, claim_id uuid, type correction_type not null, lang q_lang, dept text, due_at date, status correction_status not null default 'pending_assign', remeasure_round text, created_at timestamptz default now());
create table objections (id uuid primary key default gen_random_uuid(), region_code text, judgment_id uuid, publication_id uuid, text text not null, status text default 'received', created_by uuid, created_at timestamptz default now());

create table l10n_reviews (id uuid primary key default gen_random_uuid(), target text check (target in ('question_text','fact_text')), target_id uuid, lang q_lang, stage l10n_stage, actor_id uuid, decision text, edited_text text, reason text, checks jsonb, created_at timestamptz default now());

create table trainings (course text primary key, version text, content jsonb);
create table training_results (user_id uuid, course text, score int, passed_at timestamptz);
create table missions (id uuid primary key default gen_random_uuid(), type text, region_code text, target_id uuid, status text);
create table activities (id uuid primary key default gen_random_uuid(), user_id uuid, mission_id uuid, minutes int, quality real, settled boolean default false, created_at timestamptz default now());
create table businesses (id uuid primary key default gen_random_uuid(), region_code text, name text, aihompy_url text, consent boolean not null);
create table notifications (id uuid primary key default gen_random_uuid(), user_id uuid, kind text, payload jsonb, read_at timestamptz);
create table audit_logs (id bigserial primary key, actor uuid, action text, table_name text, row_id text, before jsonb, after jsonb, at timestamptz default now());
```

## 7. 상품·확장
```sql
create table products (code text primary key, name text, category char(1));  -- A1–G3
create table contracts (id uuid primary key default gen_random_uuid(), region_code text, products text[], period daterange, status text);
create table deliverables (id uuid primary key default gen_random_uuid(), contract_id uuid, kind text, due_at date, status text, file_path text);
create table region_seeds (id uuid primary key default gen_random_uuid(), region_code text, source text, payload jsonb, status text check (status in ('candidate','reviewed','merged')));
create table aggregation_rules (level region_level, metric text, method text, version text);
create table exports (id uuid primary key default gen_random_uuid(), kind text, region_code text, format text, path text, license text);
create table dialogue_tasks (id uuid primary key default gen_random_uuid(), region_code text, scenario text, status text, link_ref text);  -- 원문은 대화노트 구역
create table aihompy_links (region_code text, entity_id uuid, target text, url text, lang q_lang, last_published_fact_version uuid);
```

## 8. 불변성 트리거 (요지)
```sql
-- 1) 판정: update/delete 금지
create or replace function forbid_mutation() returns trigger language plpgsql as $$
begin raise exception '% is append-only', tg_table_name; end $$;
create trigger judgments_immutable before update or delete on judgments for each row execute function forbid_mutation();

-- 2) 고정된 질문 세트 항목 변경 금지
create or replace function forbid_frozen_set_change() returns trigger language plpgsql as $$
begin
  if exists (select 1 from question_sets s where s.id = coalesce(new.set_id, old.set_id) and s.frozen) then
    raise exception 'question set is frozen';
  end if; return coalesce(new, old);
end $$;
create trigger qsi_frozen before insert or update or delete on question_set_items for each row execute function forbid_frozen_set_change();

-- 3) 정본 변경은 함수로만: supersede_fact(old_id, new_value, valid_from, evidence) → 새 행 + 이전 valid_to/superseded_by 설정
--    facts에 대한 직접 update는 ops_editor도 value/valid_from 열을 못 바꾸게 열 권한 제한
```

## 9. 시드
| 시드 | 파일 | 비고 |
| --- | --- | --- |
| 지역 레지스트리 | `supabase/seed/regions.sql` | 행정 코드 원천에서 생성, 개편 승계 포함 (`knowledge/region-registry.md`) |
| 속성 사전 | `supabase/seed/attributes.sql` | `knowledge/attribute-dictionary.md` |
| 질문 세트 | `supabase/seed/question_sets/*.sql` | `knowledge/data/question-sets.md` |
| 다국어 질문·용어집 | `supabase/seed/l10n/*.sql` | `knowledge/data/multilingual-questions.md`, `entity-glossary.md` (초안 = `ai_draft` 상태로 적재) |
