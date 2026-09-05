-- 20260905000013_create_notifications_citations_prereg.sql
-- SDD 5.6a 신뢰 자산 (통지, 인용) 및 5.6b 사전 등록 (INV-11)

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
