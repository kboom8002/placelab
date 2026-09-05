alter table notifications enable row level security;
create policy "service_role_full_access" on notifications
  for all using (auth.role() = 'service_role');

alter table item_results enable row level security;
create policy "service_role_full_access" on item_results
  for all using (auth.role() = 'service_role');

alter table robustness_runs enable row level security;
create policy "service_role_full_access" on robustness_runs
  for all using (auth.role() = 'service_role');

alter table question_robustness enable row level security;
create policy "service_role_full_access" on question_robustness
  for all using (auth.role() = 'service_role');

alter table verdict_changelog enable row level security;
create policy "service_role_full_access" on verdict_changelog
  for all using (auth.role() = 'service_role');
