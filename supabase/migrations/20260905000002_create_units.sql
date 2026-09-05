-- 20260905000002_create_units.sql
-- SDD 5.2 단위 마스터

create table units (
  id               text primary key,
  population       population  not null,
  unit_type        unit_type   not null,
  name             text        not null,
  name_en          text,
  sgg_code         text,
  parent_unit_id   text        references units(id),
  domain_form      domain_form not null,
  contracting_body text,
  is_depop_area    boolean     not null default false,
  active           boolean     not null default true,
  created_at       timestamptz not null default now(),

  constraint units_b_needs_parent
    check (domain_form <> 'B' or parent_unit_id is not null),
  constraint units_sgg_only_local
    check (population = 'local_gov' or sgg_code is null),
  constraint units_c_has_no_own_domain
    check (domain_form <> 'C' or parent_unit_id is not null)
);

create index units_population_idx on units (population, active);
create index units_parent_idx     on units (parent_unit_id);
