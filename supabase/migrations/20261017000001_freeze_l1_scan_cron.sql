-- 20261017000001_freeze_l1_scan_cron.sql
-- ADR-0023 Step 1: Layer 1 robots 주간 스캔 크론 동결 (기존 마이그레이션 20260905000017은 수정하지 않음, AGENTS.md §2-3)
-- 데이터(tech_scans, verdicts, verdict_changelog)는 삭제하지 않고 읽기 전용 이력으로 보존한다.
--
-- 되돌리는 법:
--   20260905000017_cron_schedules.sql 의 cron.schedule('weekly-scan-enqueue', ...) 를 재실행한다.

do $$
begin
  if exists (
    select 1
    from pg_namespace n
    join pg_class c on c.relnamespace = n.oid
    where n.nspname = 'cron' and c.relname = 'job'
  ) then
    if exists (select 1 from cron.job where jobname = 'weekly-scan-enqueue') then
      perform cron.unschedule('weekly-scan-enqueue');
    end if;
  end if;
end $$;
