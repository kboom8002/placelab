-- 20260905000015_create_rls.sql
-- SDD 5.8 Row Level Security (RLS) 정책

alter table units          enable row level security;
alter table unit_domains   enable row level security;
alter table verdicts       enable row level security;
alter table tech_scans     enable row level security;
alter table observations   enable row level security;
alter table questions      enable row level security;
alter table statements     enable row level security;
alter table corrections    enable row level security;
alter table scan_jobs      enable row level security;
alter table method_versions enable row level security;
alter table question_bank  enable row level security;
alter table preregistrations enable row level security;
alter table citations      enable row level security;

-- 공개 읽기 (anon, authenticated)
create policy units_public_read on units
  for select to anon, authenticated using (active);

create policy unit_domains_public_read on unit_domains
  for select to anon, authenticated using (active);

create policy verdicts_public_read on verdicts
  for select to anon, authenticated using (published);

create policy statements_public_read on statements
  for select to anon, authenticated using (published_at is not null);

create policy method_versions_public_read on method_versions
  for select to anon, authenticated using (true);

create policy question_bank_public_read on question_bank
  for select to anon, authenticated using (true);

create policy preregistrations_public_read on preregistrations
  for select to anon, authenticated using (status <> 'draft');

create policy citations_public_read on citations
  for select to anon, authenticated using (true);

-- 정정 요청은 누구나 제출 가능, 조작/열람은 불가 (service_role만 조회)
create policy corrections_public_insert on corrections
  for insert to anon, authenticated with check (true);
