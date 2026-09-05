-- 20260905000006_create_verdicts.sql
-- SDD 5.4 판정 및 판정 변경 로그

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
