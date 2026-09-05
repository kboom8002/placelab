-- 20260905000012_create_questions_statements_corrections.sql
-- SDD 5.6 자유 질문 코퍼스, 소명(설명게재), 정정 요청

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
