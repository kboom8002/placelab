-- supabase/migrations/20260915000002_create_citizen_reports.sql
-- Layer 2 시민 제보(Floor Hunter) 및 Layer 3 승격 큐 스키마 (INV-4, INV-6, INV-7)

-- 1. 증상군 분류 (K03 M-2.3.2 기반)
do $$ begin
  create type report_syndrome as enum (
    'confabulation',     -- 작화: 없는 제도·창구를 있다고 안내
    'stale_fact',        -- 정보 고착: 과거 시점 정보 고정
    'generic_drift',     -- 일반론 표류: 지역 고유 정보 없음
    'cross_unit',        -- 타 단위 혼입: 다른 지자체 정보
    'wrong_number',      -- 숫자 오류: 금액·기한·횟수 틀림
    'other'              -- 기타
  );
exception
  when duplicate_object then null;
end $$;

-- 2. 승격 상태
do $$ begin
  create type promotion_status as enum (
    'pending',           -- 제보 접수, 검토 전
    'qualified',         -- 승격 요건 충족 (자동 판정)
    'approved',          -- 관리자 승인 → Layer 3 큐 등록
    'measuring',         -- Layer 3 측정 진행 중
    'completed',         -- 측정 완료, 결과 연결됨
    'rejected',          -- 반려 (중복·무관·증거 부족)
    'merged'             -- 유사 제보에 병합됨
  );
exception
  when duplicate_object then null;
end $$;

-- 3. 시민 제보 테이블 (INV-4: observations와 엄격 분리)
create table if not exists citizen_reports (
  id                  uuid primary key default gen_random_uuid(),
  unit_id             text not null references units(id),

  -- 제보 내용
  prompt_used         text not null,
  ai_response_summary text not null,                     -- 응답 요약 (원문 전문은 INV-6 위반)
  ai_service          text not null,                     -- ChatGPT, Gemini 등 (INV-7)
  model_version       text,
  web_search          boolean not null,                  -- 검색 ON/OFF (INV-7)
  language            text not null default 'ko',        -- (INV-7)
  measured_on         date not null default current_date,-- (INV-7)

  -- 증상 분류 (제보자 자기 평가)
  verdict_self        accuracy not null,                 -- accurate, partial, inaccurate, absent
  syndrome_self       report_syndrome,
  is_confabulation    boolean not null default false,    -- 작화 여부

  -- 증거
  screenshot_url      text,
  evidence_note       text,

  -- 제보자 메타데이터
  submitter_type      submitter_type not null default 'unknown',
  anonymous           boolean not null default true,
  submitter_email     text,

  -- 관리 상태
  status              promotion_status not null default 'pending',
  pii_checked         boolean not null default false,
  admin_note          text,
  merged_into         uuid references citizen_reports(id),

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- INV-6: 원문 전문 저장 방지 (요약은 2000자 이내)
  constraint citizen_reports_summary_length
    check (length(ai_response_summary) <= 2000)
);

create index if not exists idx_citizen_reports_unit on citizen_reports (unit_id, created_at desc);
create index if not exists idx_citizen_reports_syndrome on citizen_reports (syndrome_self, status);
create index if not exists idx_citizen_reports_confab on citizen_reports (is_confabulation) where is_confabulation = true;

-- 4. 승격 큐 테이블 (Layer 2 시민 제보 → Layer 3 자동/통제 측정 브릿지)
create table if not exists promotion_queue (
  id                  uuid primary key default gen_random_uuid(),
  unit_id             text not null references units(id),

  -- 트리거된 제보들
  trigger_reports     uuid[] not null,                   -- citizen_reports.id 목록
  trigger_count       int not null check (trigger_count >= 1),
  trigger_syndrome    report_syndrome not null,

  -- 생성할 검증 프로브
  probe_prompt        text not null,
  probe_category      text,

  -- Layer 3 측정 연결 (measure_jobs 및 observations 연결)
  measure_job_id      uuid references measure_jobs(id),
  observation_id      uuid references observations(id),

  -- 상태 및 우선순위
  status              promotion_status not null default 'qualified',
  priority            int not null default 0,
  auto_qualified_at   timestamptz default now(),
  approved_at         timestamptz,
  completed_at        timestamptz,
  admin_note          text,

  created_at          timestamptz not null default now()
);

create index if not exists idx_promotion_queue_status on promotion_queue (status, priority desc);
create index if not exists idx_promotion_queue_unit on promotion_queue (unit_id);

-- RLS 활성화
alter table citizen_reports enable row level security;
alter table promotion_queue enable row level security;

-- 읽기 정책: 승인 및 PII 검수 완료된 제보만 공개 읽기 가능
create policy "Public can view approved citizen reports"
  on citizen_reports for select
  using (pii_checked = true and status not in ('rejected'));

-- 삽입 정책: 누구나 제보 등록 가능
create policy "Anyone can submit citizen reports"
  on citizen_reports for insert
  with check (true);
