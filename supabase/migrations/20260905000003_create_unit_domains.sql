-- 20260905000003_create_unit_domains.sql
-- SDD 5.2 단위 도메인 매핑 및 호스트 유니크 인덱스, 폼 가드 트리거

create table unit_domains (
  id          bigint generated always as identity primary key,
  unit_id     text        not null references units(id) on delete cascade,
  host        text        not null,
  role        domain_role not null default 'main',
  path_prefix text,
  scannable   boolean     not null default true,
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  unique (unit_id, host, role)
);

create unique index unit_domains_scannable_host_idx
  on unit_domains (host) where scannable;

-- A형 단위만 스캔 가능한 도메인을 가질 수 있다
create or replace function enforce_scannable_by_form() returns trigger
language plpgsql as $$
declare f domain_form;
begin
  select domain_form into f from units where id = new.unit_id;
  if new.scannable and f <> 'A' then
    raise exception
      '단위 %(도메인형 %)는 스캔 대상 도메인을 가질 수 없습니다. AGENTS.md INV-1 · SDD 5.2 참조',
      new.unit_id, f;
  end if;
  return new;
end $$;

create trigger unit_domains_form_guard
  before insert or update on unit_domains
  for each row execute function enforce_scannable_by_form();
