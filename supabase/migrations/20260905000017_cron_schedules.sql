-- Requires pg_cron and pg_net extensions (enabled in Supabase dashboard)
-- UTC Sunday 18:00 = KST Monday 03:00
select cron.schedule(
  'weekly-scan-enqueue',
  '0 18 * * 0',
  $$
  select net.http_post(
    url := current_setting('app.settings.edge_function_url') || '/scan-enqueue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-edge-secret', current_setting('app.settings.edge_shared_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
