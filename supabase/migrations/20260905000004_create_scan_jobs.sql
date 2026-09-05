-- 20260905000004_create_scan_jobs.sql
-- SDD 5.3 스캔 큐 및 락/리클레임 함수

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
