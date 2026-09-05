-- 20260905000001_create_enums.sql
-- SDD 5.1 열거형

create type population           as enum ('local_gov','special_zone');
create type unit_type            as enum ('metro','basic','special_city','admin_city','fez','rfz','odz','other');
create type domain_form          as enum ('A','B','C');
create type domain_role          as enum ('main','tourism','invest','other');
create type robots_verdict       as enum ('open','blocked_all','blocked_selective','no_file','undetermined');
create type undetermined_reason  as enum ('timeout','malformed','parse_fail','shared_domain','dns_fail','other');
create type accuracy             as enum ('accurate','partial','inaccurate','absent');
create type submitter_type       as enum ('resident','official','researcher','press','unknown');
create type review_status        as enum ('pending','accepted','rejected');
create type correction_status    as enum ('received','reviewing','accepted','rejected','remeasured');
create type job_status           as enum ('queued','running','done','failed');
create type failure_syndrome     as enum ('confabulation','stale_fact','generic_drift','cross_unit','hypersensitivity','unstable_skeleton');
create type floor_risk           as enum ('low','moderate','high','critical');
create type variant_axis         as enum ('original','punct','polite','order','frame');
create type notice_kind          as enum ('pre_publication','status_change','correction_reply','remeasure');
create type notice_channel       as enum ('email','official_letter','phone','portal');
create type citation_kind        as enum ('press','assembly','research','government','other');
create type prereg_status        as enum ('draft','published','running','completed','abandoned');
