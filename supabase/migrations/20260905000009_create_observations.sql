-- 20260905000009_create_observations.sql
-- SDD 5.5 응답 관측치 및 지명 합계 강제 트리거 (INV-7)

create table observations (
  id               uuid primary key default gen_random_uuid(),
  unit_id          text        not null references units(id),
  layer            int         not null check (layer in (2,3)),
  method_version   text        not null references method_versions(version),
  measured_on      date        not null,
  ai_service       text        not null,
  model_version    text,
  web_search       boolean     not null,
  language         text        not null default 'ko',
  personalized     boolean,
  repeats          int         not null default 1 check (repeats >= 1),

  named_accurate   int not null default 0 check (named_accurate   >= 0),
  named_partial    int not null default 0 check (named_partial    >= 0),
  named_inaccurate int not null default 0 check (named_inaccurate >= 0),
  named_absent     int not null default 0 check (named_absent     >= 0),

  unnamed_appearances int check (unnamed_appearances >= 0),
  unnamed_slots       int check (unnamed_slots       >= 0),

  submitter_type   submitter_type not null default 'unknown',
  anonymous        boolean        not null default true,
  submitter_email  text,
  note             text,
  status           review_status  not null default 'pending',
  created_at       timestamptz    not null default now(),

  constraint observations_unnamed_bounds
    check (unnamed_appearances is null or unnamed_slots is null
           or unnamed_appearances <= unnamed_slots)
);

create index observations_unit_idx  on observations (unit_id, measured_on desc);
create index observations_layer_idx on observations (layer, method_version);

create or replace function enforce_named_total() returns trigger
language plpgsql as $$
declare expected int;
begin
  select named_count into expected
    from method_versions where version = new.method_version;
  if expected is null then
    raise exception '알 수 없는 method_version: %', new.method_version;
  end if;
  if new.named_accurate + new.named_partial
   + new.named_inaccurate + new.named_absent <> expected then
    raise exception
      '지명 문항 합계가 %와 다릅니다 (받은 값: %). AGENTS.md INV-7 참조',
      expected,
      new.named_accurate + new.named_partial + new.named_inaccurate + new.named_absent;
  end if;
  return new;
end $$;

create trigger observations_named_total
  before insert or update on observations
  for each row execute function enforce_named_total();
