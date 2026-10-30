-- supabase/migrations/20261017000003_local_radar_smb_core.sql
-- 로컬레이다 (LocalRadar · 소상공인 AI 로컬 탐색 스캔) 코어 스키마
-- 근거: ADR-0025, PRD FR-93 ~ FR-96
-- 방화벽 규칙(INV-17): 공익 측정 테이블(probe_*, observe_*, units)과 외래키·뷰·집계를 절대 섞지 않는다.

-- ============================================================================
-- 1. 상권 코호트 마스터 (kbl_local_cohorts)
-- ============================================================================
create table if not exists public.kbl_local_cohorts (
  cohort_id          text primary key,
  name               text not null,
  region_label       text not null,
  sector_label       text not null,
  description        text not null,
  -- 스폰서십 상태 (결정 1: 향후 공기업·지역재단 스폰서십 가능, 공시 필수)
  sponsor_status     text not null default 'self_funded'
                     check (sponsor_status in ('self_funded', 'foundation_sponsored', 'public_corp_sponsored')),
  sponsor_org_name   text,
  disclosure_note    text not null,
  active             boolean not null default true,
  created_at         timestamptz not null default now()
);

comment on table public.kbl_local_cohorts is
  '로컬레이다(LocalRadar) 상권 코호트 마스터. 서귀포·강남·은평구 등 권역별 소비자 탐색 스캔 공유 단위 (ADR-0025, FR-94)';

-- ============================================================================
-- 2. 코호트 소속 매장 마스터 (kbl_local_shops)
-- ============================================================================
create table if not exists public.kbl_local_shops (
  shop_id                text primary key,
  cohort_id              text not null references public.kbl_local_cohorts(cohort_id),
  shop_code              text not null unique,
  shop_name              text not null,
  category               text not null,
  neighborhood           text not null,
  aliases                text[] not null default '{}',
  disambiguation_tokens  text[] not null default '{}',
  canonical_url          text,
  place_url              text,
  booking_url            text,
  -- 강남 뷰티·피부과/클리닉 등 의료법 준수 관리 플래그
  is_medical_regulated   boolean not null default false,
  license_verified       boolean not null default true,
  active                 boolean not null default true,
  created_at             timestamptz not null default now()
);

create index if not exists idx_kbl_local_shops_cohort
  on public.kbl_local_shops (cohort_id, shop_name);

comment on table public.kbl_local_shops is
  '로컬레이다 등록 소상공인 매장 마스터. 가게 실명 비교 시 가나다순·창 상태로만 표기하며 서열화 금지 (INV-3, FR-95)';

-- ============================================================================
-- 3. 매장 고위험 영업 정본 5항목 + 확장 정본 (kbl_local_canonical_facts)
-- ============================================================================
create table if not exists public.kbl_local_canonical_facts (
  fact_id            uuid primary key default gen_random_uuid(),
  shop_id            text not null references public.kbl_local_shops(shop_id),
  fact_key           text not null
                     check (fact_key in (
                       'hours_holiday',    -- 1. 영업시간·정기휴무·브레이크타임
                       'price_menu',       -- 2. 대표 메뉴/객실·시술 가격 및 추가 요금
                       'booking_method',   -- 3. 예약 방법·워크인 가능 여부·취소 규정
                       'parking_access',   -- 4. 주차 가능 여부·대중교통 접근성
                       'pet_kids_policy',  -- 5. 반려동물·영유아 동반·외국어 응대 규정
                       'extended_spec'     -- 확장 정본 (정밀팩 20항목)
                     )),
  fact_label         text not null,
  canonical_value    text not null,
  acceptable_tokens  text[] not null default '{}',
  forbidden_tokens   text[] not null default '{}',
  source_url         text not null,
  owner_verified_at  timestamptz not null default now(),
  valid_from         date not null default current_date,
  valid_to           date,
  created_at         timestamptz not null default now()
);

create index if not exists idx_kbl_local_facts_shop
  on public.kbl_local_canonical_facts (shop_id, fact_key)
  where valid_to is null;

-- ============================================================================
-- 4. 코호트 공유 소비자 탐색 질문 (kbl_local_discovery_probes)
-- ============================================================================
create table if not exists public.kbl_local_discovery_probes (
  probe_id           text primary key,
  cohort_id          text not null references public.kbl_local_cohorts(cohort_id),
  intent_category    text not null,
  question_ko        text not null,
  question_en        text not null,
  question_ja        text not null,
  question_zh        text not null,
  active             boolean not null default true,
  created_at         timestamptz not null default now()
);

-- ============================================================================
-- 5. 로컬레이다 실행 조건 헤더 (kbl_local_runs — INV-7 측정 조건 필수)
-- ============================================================================
create table if not exists public.kbl_local_runs (
  run_id             uuid primary key default gen_random_uuid(),
  cohort_id          text not null references public.kbl_local_cohorts(cohort_id),
  scan_layer         text not null check (scan_layer in ('discovery_shared', 'fact_precision')),
  method_version     text not null,
  ai_service         text not null,
  web_search         boolean not null,
  language           text not null check (language in ('ko', 'en', 'ja', 'zh-Hans')),
  measured_on        date not null,
  week_slot          text not null, -- 예: '2026-W42-1'
  created_at         timestamptz not null default now()
);

-- ============================================================================
-- 6. Layer A: 공유 탐색 스캔 가게 실명 등장 기록 (kbl_local_discovery_mentions — INV-9 rep 분리)
-- ============================================================================
create table if not exists public.kbl_local_discovery_mentions (
  run_id             uuid not null references public.kbl_local_runs(run_id) on delete cascade,
  probe_id           text not null references public.kbl_local_discovery_probes(probe_id),
  rep                smallint not null check (rep >= 1 and rep <= 12),
  shop_id            text not null references public.kbl_local_shops(shop_id),
  s1_in_search       boolean not null default false,
  s2_cited           boolean not null default false,
  s3_first_cited     boolean not null default false,
  citation_url       text,
  raw_hash           text not null, -- INV-6: 응답 원문 대신 해시만 저장
  created_at         timestamptz not null default now(),
  primary key (run_id, probe_id, rep, shop_id)
);

-- ============================================================================
-- 7. Layer B: 개별 매장 영업 사실 판정 결과 (kbl_local_fact_results — INV-9 rep 분리)
-- ============================================================================
create table if not exists public.kbl_local_fact_results (
  run_id             uuid not null references public.kbl_local_runs(run_id) on delete cascade,
  shop_id            text not null references public.kbl_local_shops(shop_id),
  fact_key           text not null,
  rep                smallint not null check (rep >= 1 and rep <= 9),
  s1_in_search       boolean not null default false,
  s2_cited           boolean not null default false,
  s3_first_cited     boolean not null default false,
  s4_verdict         text not null check (s4_verdict in ('matched', 'wrong', 'unverifiable', 'not_cited')),
  walk_away_risk     boolean not null default false, -- 영업시간·휴무·예약·가격 등 헛걸음 유발 오답 여부
  booking_connected  boolean not null default false, -- 실제 예약·플레이스·공식 링크 연결 여부
  raw_hash           text not null,                  -- INV-6: 원문 비노출
  minimal_quote      text,
  created_at         timestamptz not null default now(),
  primary key (run_id, shop_id, fact_key, rep)
);

-- ============================================================================
-- 8. RLS (Row-Level Security) — 공익 트랙 및 gov_* 역할과 격리
-- ============================================================================
alter table public.kbl_local_cohorts enable row level security;
alter table public.kbl_local_shops enable row level security;
alter table public.kbl_local_canonical_facts enable row level security;
alter table public.kbl_local_discovery_probes enable row level security;
alter table public.kbl_local_runs enable row level security;
alter table public.kbl_local_discovery_mentions enable row level security;
alter table public.kbl_local_fact_results enable row level security;

-- lab_org, lab_member, ops_admin 역할만 조회 허용
create policy "kbl_local_cohorts_read" on public.kbl_local_cohorts
  for select using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('lab_org', 'lab_member', 'ops_admin')
  );

create policy "kbl_local_shops_read" on public.kbl_local_shops
  for select using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('lab_org', 'lab_member', 'ops_admin')
  );

create policy "kbl_local_facts_read" on public.kbl_local_canonical_facts
  for select using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('lab_org', 'lab_member', 'ops_admin')
  );

create policy "kbl_local_probes_read" on public.kbl_local_discovery_probes
  for select using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('lab_org', 'lab_member', 'ops_admin')
  );

create policy "kbl_local_runs_read" on public.kbl_local_runs
  for select using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('lab_org', 'lab_member', 'ops_admin')
  );

create policy "kbl_local_mentions_read" on public.kbl_local_discovery_mentions
  for select using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('lab_org', 'lab_member', 'ops_admin')
  );

create policy "kbl_local_fact_results_read" on public.kbl_local_fact_results
  for select using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('lab_org', 'lab_member', 'ops_admin')
  );

-- ============================================================================
-- 9. 초기 3대 상권 코호트 시드 (서귀포 · 강남 · 은평구)
-- ============================================================================
insert into public.kbl_local_cohorts (
  cohort_id, name, region_label, sector_label, description, sponsor_status, sponsor_org_name, disclosure_note
) values
  (
    'SEOGWIPO_STAY',
    '서귀포 스테이·로컬체험 코호트',
    '제주 서귀포시',
    '숙박 · 감귤/다도 체험 · 로컬 식음',
    '서귀포 독채 스테이, 감귤·다도 체험농장, 로컬 다이닝 소상공인을 위한 4개 국어 AI 로컬 탐색 스캔 코호트',
    'self_funded',
    null,
    '민간 소상공인 자체 구독 코호트 (향후 지역관광재단·공기업 스폰서십 참여 시 이해관계 공시 의무 적용)'
  ),
  (
    'GANGNAM_SMB',
    '강남 뷰티·클리닉·웰니스 코호트',
    '서울 강남구',
    'K-뷰티 · 피부과/클리닉 · 웰니스 SMB',
    '외국인·내국인 로컬 탐색이 집중되는 강남 뷰티·피부과/클리닉·웰니스 소상공인 코호트 (의료기관은 치료 효과 비교 없이 진료시간·다국어·예약·면허 등 객관 운영 사실만 대조)',
    'self_funded',
    null,
    '민간 소상공인 자체 구독 코호트 (의료법 제56조 준수: 시술 효과 비교·서열화 배제, 객관 운영 정본만 대조)'
  ),
  (
    'EUNPYEONG_LOCAL',
    '은평구 골목상권·생활밀착 소상공인 코호트',
    '서울 은평구',
    '은평한옥마을 · 연서시장 · 불광천 골목상권',
    '은평한옥마을·연서시장·불광천 일대 베이커리, 공방, 로컬 서점, 가족 외식 소상공인을 위한 생활밀착 AI 로컬 탐색 스캔 코호트',
    'self_funded',
    null,
    '민간 골목상권 소상공인 코호트 (향후 상권활성화재단·소상공인지원기관 스폰서십 연계 시 공시 의무 적용)'
  )
on conflict (cohort_id) do nothing;
