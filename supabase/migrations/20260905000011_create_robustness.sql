-- 20260905000011_create_robustness.sql
-- SDD 5.5a 문항 강건성 검사 (INV-10)

create table robustness_runs (
  id             bigint generated always as identity primary key,
  question_id    text not null references question_bank(id),
  method_version text not null references method_versions(version),
  unit_id        text not null references units(id),
  variant        variant_axis not null,
  variant_text   text not null,
  ai_service     text not null,
  rep            int  not null check (rep >= 1),
  verdict        accuracy,
  skeleton_match boolean,
  ran_at         timestamptz not null default now(),
  unique (question_id, method_version, unit_id, variant, ai_service, rep)
);

create table question_robustness (
  question_id    text not null references question_bank(id),
  method_version text not null references method_versions(version),
  divergence     numeric not null,      -- 변형 간 판정 분포 차이
  threshold      numeric not null,      -- 파일럿에서 정한 임계값
  sensitive      boolean generated always as (divergence > threshold) stored,
  checked_at     timestamptz not null default now(),
  primary key (question_id, method_version)
);
