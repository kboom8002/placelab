-- 20260905000014_create_views.sql
-- SDD 5.7 집계 뷰: 모집단 분리 (INV-1) 및 레이어 분리 (INV-4)

-- 두 모집단을 UNION 하는 뷰는 만들지 않는다 (AGENTS.md INV-1)
create or replace view v_layer1_coverage as
select u.population,
       v.robots_verdict,
       v.undetermined_reason,
       count(*)::int as unit_count
  from verdicts v
  join unit_domains d on d.id = v.domain_id
  join units        u on u.id = d.unit_id
 where v.published
   and d.role = 'main'
   and u.active
 group by u.population, v.robots_verdict, v.undetermined_reason;

-- Layer 2 참여 단위 뷰 (전국 분모 컬럼 미제공으로 '전국 N곳 중' 표현 방지)
create or replace view v_layer2_participation as
select o.unit_id,
       u.population,
       o.method_version,
       count(*)::int                                   as observation_count,
       count(distinct o.ai_service)::int               as service_count,
       min(o.measured_on)                              as first_measured_on,
       max(o.measured_on)                              as last_measured_on
  from observations o
  join units u on u.id = o.unit_id
 where o.layer = 2 and o.status = 'accepted'
 group by o.unit_id, u.population, o.method_version;

-- 단위별 최신 공개 판정 결합 뷰
create or replace view v_unit_latest_verdict as
select u.id as unit_id,
       u.name,
       u.name_en,
       u.population,
       u.unit_type,
       u.domain_form,
       u.parent_unit_id,
       u.sgg_code,
       u.is_depop_area,
       d.id as domain_id,
       d.host,
       d.role as domain_role,
       v.robots_verdict,
       v.undetermined_reason,
       v.confirmed_at,
       v.consecutive_weeks,
       v.published
  from units u
  left join unit_domains d on d.unit_id = u.id and d.role = 'main' and d.active
  left join verdicts v on v.domain_id = d.id and v.published
 where u.active;
