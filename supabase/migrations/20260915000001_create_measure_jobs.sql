-- supabase/migrations/20260915000001_create_measure_jobs.sql
-- 웹 UI 기반 비동기 측정 작업(Measure Jobs) 큐 및 결과 저장소 (§8.2, INV-7)

create table if not exists measure_jobs (
  id              uuid primary key default gen_random_uuid(),
  agency_handle   text not null,
  agency_name     text not null,
  providers       text[] not null default '{"gemini"}',
  models          jsonb not null default '{}'::jsonb,
  question_set    text not null default 'core',
  repetitions     int not null default 3,
  channel         text not null default 'agency_notice',
  simulation      boolean not null default false,

  status          text not null default 'queued'
                  check (status in ('queued', 'running', 'done', 'failed')),
  progress        jsonb not null default '{}'::jsonb,

  result          jsonb,
  vip_report_md   text,
  tech_report_md  text,
  error           text,

  created_at      timestamptz not null default now(),
  started_at      timestamptz,
  completed_at    timestamptz,
  locked_at       timestamptz
);

create index if not exists idx_measure_jobs_status on measure_jobs (status, created_at);
create index if not exists idx_measure_jobs_agency on measure_jobs (agency_handle);

-- 안전한 동시성 락 획득 함수 (FOR UPDATE SKIP LOCKED)
create or replace function claim_measure_jobs(p_limit int default 1)
returns setof measure_jobs
language plpgsql
as $$
begin
  return query
  with to_claim as (
    select id
    from measure_jobs
    where status = 'queued'
       or (status = 'running' and locked_at < now() - interval '10 minutes')
    order by created_at asc
    limit p_limit
    for update skip locked
  )
  update measure_jobs j
  set status = 'running',
      locked_at = now(),
      started_at = coalesce(started_at, now())
  from to_claim
  where j.id = to_claim.id
  returning j.*;
end;
$$;
