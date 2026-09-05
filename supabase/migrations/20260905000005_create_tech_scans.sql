-- 20260905000005_create_tech_scans.sql
-- SDD 5.3 기술 스캔 관측치 및 INV-2 제약조건

create table tech_scans (
  id                  bigint generated always as identity primary key,
  domain_id           bigint      not null references unit_domains(id),
  method_version      text        not null,
  scanned_at          timestamptz not null default now(),
  http_status         int,
  latency_ms          int,
  robots_verdict      robots_verdict not null,
  undetermined_reason undetermined_reason,
  ai_agents           jsonb,
  sitemap_declared    boolean,
  sitemap_reachable   boolean,
  meta_robots         text,
  jsonld_count        int,
  jsonld_types        text[],
  jsonld_valid        boolean,
  hreflang_count      int,
  tls_ok              boolean,
  tls_expires_at      timestamptz,
  raw_hash            text        not null,

  constraint tech_scans_undetermined_needs_reason
    check ((robots_verdict = 'undetermined') = (undetermined_reason is not null))
);

create index tech_scans_domain_time_idx on tech_scans (domain_id, scanned_at desc);
