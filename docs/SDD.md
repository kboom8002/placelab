# SDD — kplacelab 소프트웨어 설계서

| | |
|---|---|
| 대상 | Next.js (App Router) + Supabase |
| 작성일 | 2026-09-05 |
| 선행 문서 | [`PRD.md`](./PRD.md) · [`AGENTS.md`](../AGENTS.md) |

이 문서는 **어떻게 만드는가**를 다룬다. **무엇을 만드는가**는 PRD, **왜 그렇게 판정하는가**는 `docs/knowledge/` 에 있다.

---

## 1. 설계 원칙

이 시스템의 설계는 세 가지 사실에서 나온다.

1. **측정 대상 서버는 우리 통제 밖이다.** 실측에서 9곳 중 6곳이 정상 판정 불가였다(`K09`). 타임아웃·오설정·도메인 공유가 예외가 아니라 **정상 상태**다. 따라서 스캐너는 실패를 오류가 아니라 **데이터**로 다룬다.
2. **공표되는 수치는 되돌릴 수 없다.** 그래서 관측(`tech_scans`)과 판정(`verdicts`)을 분리하고, 판정은 승격 절차를 거친다.
3. **편향의 종류가 다른 데이터가 한 DB에 산다.** 스키마와 타입 수준에서 섞이지 않게 막는다.

---

## 2. 런타임 구성

```
                    ┌──────────────────────────────┐
   방문자 ─────────▶│  Vercel — Next.js App Router  │
                    │  · 공개 페이지 (ISR)          │
                    │  · 제출/정정 Route Handler    │
                    │  · 기관·관리자 (동적)         │
                    └───────────┬──────────────────┘
                                │ supabase-js
                                ▼
                    ┌──────────────────────────────┐
                    │  Supabase Postgres            │
                    │  · RLS · 뷰 · 트리거          │
                    │  · scan_jobs (SKIP LOCKED)    │
                    │  · pg_cron · pg_net           │
                    └───────────┬──────────────────┘
                        pg_net.http_post
                                ▼
                    ┌──────────────────────────────┐
                    │  Supabase Edge Functions      │
                    │  · scan-enqueue   (주 1회)    │
                    │  · scan-worker    (배치 소비) │  ──▶ 지자체 도메인
                    │  · verdict-promote(주 1회)    │
                    │  · measure-l3     (유료)      │  ──▶ AI API
                    └──────────────────────────────┘
```

배포 대상은 **Vercel과 Supabase 둘뿐**이다. → [`adr/0001-scanner-runtime.md`](./adr/0001-scanner-runtime.md)

### 왜 워커가 아니라 Edge Functions인가

Edge Function은 실행 시간 제한이 있으므로 **한 번의 호출이 전수를 처리하지 않는다.** 대신 `scan-worker` 를 짧게 여러 번 깨우고, 각 호출이 큐에서 소량(기본 20개)만 가져가 처리한다. 남은 일은 다음 호출이 이어받는다. 이 구조는 실행 시간 제한을 **설계 제약이 아니라 배치 크기 파라미터**로 바꾼다.

- `pg_cron` 이 매주 월요일 03:00 KST 에 `scan-enqueue` 를 호출해 큐를 채운다.
- `pg_cron` 이 그 후 6시간 동안 **2분마다** `scan-worker` 를 호출한다.
- 큐가 비면 워커는 즉시 반환한다(무해한 no-op).
- 도메인당 주 1회 규칙은 **큐 생성 시점**에 보장된다(`scan_jobs` 유니크 제약).

---

## 3. 스캐너 설계

### 3.1 한 도메인에 대해 하는 일

```
1) GET https://{host}/robots.txt        타임아웃 10s, 리다이렉트 3회까지
2) (robots가 허용하는 경우에만) GET https://{host}/
3) (robots에 Sitemap 선언이 있으면) HEAD 그 URL
4) TLS 인증서 체인·만료일 확인
```

**이 네 가지가 전부다.** 본문 크롤링·링크 추적·하위 페이지 순회는 하지 않는다(NG-5).

`robots.txt` 가 우리 UA를 거부하면 2·3단계를 **수행하지 않고** 그 사실만 기록한다(INV-5).

### 3.2 4분 판정 알고리즘

```ts
// src/scanner/verdict.ts — 기준의 원본은 docs/knowledge/K03-measurement-spec.md
export function judgeRobots(r: RobotsFetchResult): Verdict {
  if (r.kind === 'timeout')      return { v: 'undetermined', reason: 'timeout' };
  if (r.kind === 'network_error')return { v: 'undetermined', reason: 'timeout' };
  if (r.status === 404)          return { v: 'no_file' };
  if (r.status >= 500)           return { v: 'undetermined', reason: 'timeout' };

  // robots.txt 자리에 HTML이 오는 경우 (실측: 경기 GGFEZ)
  if (looksLikeHtml(r.body))     return { v: 'undetermined', reason: 'malformed' };

  const groups = parseRobots(r.body);
  if (groups === null)           return { v: 'undetermined', reason: 'parse_fail' };

  const perAgent = AI_AGENTS.map(a => ({ agent: a, rule: resolve(groups, a) }));
  if (perAgent.every(x => x.rule === 'disallow_all')) return { v: 'blocked_all' };
  if (perAgent.some(x  => x.rule === 'disallow_all')) return { v: 'blocked_selective' };
  return { v: 'open' };
}
```

`SHARED_DOMAIN` 은 스캐너가 아니라 **단위 마스터**에서 결정된다. `units.domain_form = 'B'` 인 단위는 스캔 대상이 아니며(§5.2 트리거), 화면에서 소관 시·도의 값을 참조하되 반드시 병기 문구를 붙인다.

### 3.3 예의 있는 수집 — 상수

```ts
// src/scanner/constants.ts
export const SCANNER_UA =
  'KPlaceLabBot/1.0 (+https://kplacelab.kr/bot; contact@kplacelab.kr)';
export const SCAN_TIMEOUT_MS      = 10_000;
export const SCAN_MIN_INTERVAL_MS = 5_000;   // 같은 호스트에 대한 최소 간격
export const SCAN_MAX_REDIRECTS   = 3;
export const SCAN_BATCH_SIZE      = 20;
export const SCAN_MAX_ATTEMPTS    = 3;
export const SCAN_CADENCE         = 'weekly';
```

`/bot` 페이지는 누구인지, 무엇을 가져가는지, 어떻게 연락하는지를 설명한다. **수집 거부 옵션은 두지 않는다** — 거부 옵션을 두면 전수가 깨지고, 애초에 `robots.txt` 로 거부하는 것이 표준 수단이며 우리는 그것을 존중한다.

### 3.4 실패 처리

| 상황 | 처리 |
|---|---|
| 타임아웃 | `attempts < 3` 이면 지수 백오프(10분·1시간)로 재큐. 3회 실패 시 `undetermined/timeout` 확정 기록 |
| 5xx | 위와 동일 |
| 4xx (404 제외) | 재시도 없이 `undetermined/timeout` |
| DNS 실패 | 재시도 없이 기록. 3주 연속이면 단위 마스터 점검 알림 |
| 리스 만료 | `locked_at < now() - 15min` 인 `running` 잡을 `queued` 로 회수 |

---

## 4. 판정 승격 (INV-8)

`tech_scans` 는 관측이고 `verdicts` 는 공표 가능한 판정이다.

```
매주 화요일 04:00 KST · verdict-promote
  for each domain:
    최근 2회 스캔을 본다
    두 관측의 (robots_verdict, undetermined_reason)이 같으면
      verdicts 를 upsert 하고 consecutive_weeks 를 늘린다
    다르면
      verdicts 를 갱신하지 않는다 (직전 판정이 유지된다)
      change_pending 플래그를 세워 운영 대시보드에 노출한다
```

**직전 판정이 유지된다**는 점이 중요하다. 흔들리는 값을 공개 화면에 그대로 흘리지 않는다. 대신 운영자는 흔들리는 도메인을 목록으로 본다.

첫 공개 전에는 `verdicts.published = false` 이며, 사전 통지 기간(FR-24)이 끝난 뒤 일괄로 `true` 가 된다.

---

## 5. 데이터베이스

> **검증 상태** — 이 절의 DDL은 PostgreSQL 16에서 실제로 실행해 확인했다. 아래 시나리오가 의도대로 거부/통과된다: B형 부모 누락, 특별구역 `sgg_code`, B형 스캔 도메인 등록, 호스트 중복 스캔 등록, 사유 없는 `undetermined`, 지명 합계 불일치, 미검수 질문 승인, 1주 판정 승격, 주 1회 유니크, `SKIP LOCKED` 클레임, 집계 뷰의 `population` 행 출력, 정확 판정에 증상군 부여, 작화-증상군 불일치, 민감 문항 자동 판정, **미공개 사전 등록으로 측정 시작**, **공개보다 이른 시작 시각**, **회신 시각 없는 통지 회신 표시**.

### 5.1 열거형

```sql
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
```

### 5.2 단위 마스터

```sql
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
```

`id` 규칙 — 자치단체는 `lg-{행정표준코드}`, 특별구역은 `sz-{제도}-{약칭}` (예: `sz-fez-ifez`). 규칙의 원본은 `K02`.

```sql
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
```

`unit_domains_scannable_host_idx` 가 INV-1의 기술적 보루다 — **한 호스트를 두 단위가 동시에 스캔 대상으로 가질 수 없다.** 울산광역시와 울산경제자유구역이 `www.ulsan.go.kr` 을 각각 스캔 대상으로 등록하는 사고가 원천 차단된다.

```sql
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
```

> **주의** — 자치단체(광역·기초·특례시·행정시)는 전부 `domain_form = 'A'` 다. A/B/C는 특별구역만의 구분이 아니라 **모든 단위에 대한 도메인 보유 형태**이며, 자치단체는 정의상 자체 도메인을 갖는다.

### 5.3 스캔 큐와 관측

```sql
create table scan_jobs (
  id             bigint generated always as identity primary key,
  domain_id      bigint      not null references unit_domains(id) on delete cascade,
  scheduled_week date        not null,
  scheduled_for  timestamptz not null,
  status         job_status  not null default 'queued',
  attempts       int         not null default 0,
  locked_at      timestamptz,
  last_error     text,
  created_at     timestamptz not null default now(),
  unique (domain_id, scheduled_week)
);

create index scan_jobs_pick_idx on scan_jobs (status, scheduled_for);
```

`unique (domain_id, scheduled_week)` 가 **도메인당 주 1회**를 DB 수준에서 보장한다(NFR-4).

```sql
create or replace function claim_scan_jobs(p_limit int default 20)
returns setof scan_jobs
language sql
security definer
set search_path = public
as $$
  update scan_jobs j
     set status    = 'running',
         locked_at = now(),
         attempts  = j.attempts + 1
   where j.id in (
     select id from scan_jobs
      where status = 'queued' and scheduled_for <= now()
      order by scheduled_for
      limit p_limit
      for update skip locked
   )
  returning j.*;
$$;

create or replace function reclaim_stale_jobs()
returns int
language sql
security definer
set search_path = public
as $$
  with r as (
    update scan_jobs
       set status = 'queued', locked_at = null
     where status = 'running'
       and locked_at < now() - interval '15 minutes'
    returning 1
  ) select count(*)::int from r;
$$;
```

```sql
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
```

`tech_scans_undetermined_needs_reason` 이 INV-2를 DB에서 강제한다. `undetermined` 인데 사유가 없거나, 사유가 있는데 판정이 `undetermined` 가 아니면 **INSERT가 실패한다.**

`ai_agents` 는 `{"GPTBot":"allow","ClaudeBot":"disallow_all", …}` 형태. 대상 UA 목록은 `K03` 이 원본이고 시드로 관리한다.

### 5.4 판정

```sql
create table verdicts (
  domain_id           bigint primary key references unit_domains(id) on delete cascade,
  robots_verdict      robots_verdict not null,
  undetermined_reason undetermined_reason,
  method_version      text        not null,
  confirmed_from      timestamptz not null,
  confirmed_at        timestamptz not null,
  consecutive_weeks   int         not null,
  change_pending      boolean     not null default false,
  published           boolean     not null default false,

  constraint verdicts_needs_two_weeks check (consecutive_weeks >= 2),
  constraint verdicts_undetermined_needs_reason
    check ((robots_verdict = 'undetermined') = (undetermined_reason is not null))
);
```

### 5.5 응답 측정

```sql
create table method_versions (
  version        text primary key,
  named_count    int  not null,
  unnamed_count  int  not null,
  effective_from date not null,
  notes          text
);

create table question_bank (
  id             text primary key,
  method_version text not null references method_versions(version),
  kind           text not null check (kind in ('named','unnamed')),
  seq            int  not null,
  body           text not null,
  domain_tag     text,
  unique (method_version, kind, seq)
);

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
```

지명 4단계의 합계가 명세의 문항 수와 일치해야 한다는 규칙은 `CHECK` 로 표현할 수 없으므로(서브쿼리 불가) 트리거로 강제한다.

```sql
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
```

`item_results` 는 **반복 회차별로** 저장한다. 집계는 조회 시점에 한다 — 집계된 값에서 분포를 복원할 방법은 없다. → [ADR-0006](./adr/0006-distribution-over-score.md)

```sql
create type failure_syndrome as enum (
  'confabulation','stale_fact','generic_drift',
  'cross_unit','hypersensitivity','unstable_skeleton'
);
create type floor_risk as enum ('low','moderate','high','critical');

create table item_results (
  observation_id  uuid not null references observations(id) on delete cascade,
  question_id     text not null references question_bank(id),
  rep             int  not null check (rep >= 1),     -- 반복 회차
  verdict         accuracy,
  skeleton_match  boolean,
  detail_match    boolean,
  confabulated    boolean not null default false,
  syndrome        failure_syndrome,
  appeared        boolean,
  rank            int,
  confidence      text check (confidence in ('high','mid','low')),
  cited_sources   text[],                              -- web_search=on 일 때만
  note            text,
  primary key (observation_id, question_id, rep),

  -- 정확한 응답에는 증상군을 붙이지 않는다
  constraint item_results_syndrome_only_on_failure
    check (syndrome is null or verdict in ('partial','inaccurate','absent')),
  -- 작화는 증상군과 일치해야 한다
  constraint item_results_confabulation_consistent
    check (not confabulated or syndrome = 'confabulation')
);

create index item_results_question_idx on item_results (question_id, verdict);
```

Floor Risk는 저장하지 않고 **조회 시 산출**한다 — 평균이 아니라 최악을 고르는 규칙이므로 함수로 표현된다.

```sql
create or replace function floor_risk_of(p_observation uuid, p_question text)
returns floor_risk
language sql stable
as $$
  select case
    when bool_or(confabulated)                     then 'critical'
    when bool_or(verdict = 'inaccurate')           then 'high'
    when bool_or(verdict = 'absent')               then 'moderate'
    else 'low'
  end::floor_risk
  from item_results
  where observation_id = p_observation and question_id = p_question;
$$;
```

### 5.5a 문항 강건성 검사

채택 전 검사 결과를 남긴다. **강건성 검사를 통과하지 않은 문항의 결과는 공표하지 않는다.** → [ADR-0007](./adr/0007-questions-are-instruments.md)

```sql
create type variant_axis as enum ('original','punct','polite','order','frame');

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
```

`question_bank` 는 8블록으로 저장한다.

```sql
alter table question_bank
  add column block_actor     text,
  add column block_situation text,
  add column block_task      text,
  add column block_knowledge text,
  add column block_workflow  text,
  add column block_format    text,
  add column block_language  text not null default 'ko',
  add column block_output    text;
```

프롬프트는 블록에서 **조립**한다. 셀프체크 화면에는 조립된 자연어만 보여주고 블록 구조는 노출하지 않는다.

### 5.6 코퍼스 · 반론 · 정정

```sql
create table questions (
  id             uuid primary key default gen_random_uuid(),
  unit_id        text references units(id),
  observation_id uuid references observations(id) on delete set null,
  body           text        not null,
  redacted_body  text,
  pii_checked    boolean     not null default false,
  category       text,
  kind           text check (kind in ('named','unnamed')),
  approved       boolean     not null default false,
  created_at     timestamptz not null default now(),

  constraint questions_approved_needs_pii_check
    check (not approved or pii_checked)
);

create table statements (
  id               uuid primary key default gen_random_uuid(),
  unit_id          text not null references units(id) on delete cascade,
  body             text not null,
  author_verified  boolean     not null default false,
  published_at     timestamptz,
  created_at       timestamptz not null default now()
);

create table corrections (
  id          uuid primary key default gen_random_uuid(),
  unit_id     text not null references units(id),
  domain_id   bigint references unit_domains(id),
  claim       text not null,
  contact     text,
  status      correction_status not null default 'received',
  received_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution  text
);

create index corrections_open_idx on corrections (status, received_at);
```

`questions_approved_needs_pii_check` 는 개인정보 검수를 건너뛴 질문이 승인되는 것을 막는다(NG-6).

### 5.6a 신뢰 자산 — 통지와 인용

해자는 방법론이 아니라 **시계열·기관 관계·인용 지위**에 있다(→ [ADR-0008](./adr/0008-moat-is-time.md)). 뒤의 둘은 저장하지 않으면 존재하지 않으므로 테이블을 만든다.

```sql
create type notice_kind    as enum ('pre_publication','status_change','correction_reply','remeasure');
create type notice_channel as enum ('email','official_letter','phone','portal');

create table notifications (
  id           bigint generated always as identity primary key,
  unit_id      text           not null references units(id),
  kind         notice_kind    not null,
  channel      notice_channel not null,
  sent_at      timestamptz    not null default now(),
  recipient    text,
  subject      text           not null,
  body_hash    text           not null,
  responded    boolean        not null default false,
  responded_at timestamptz,
  note         text,

  constraint notifications_response_needs_time
    check (not responded or responded_at is not null)
);

create index notifications_unit_idx on notifications (unit_id, sent_at desc);
```

`body_hash` 는 **무엇을 통지했는지 사후에 다툴 수 없게** 하기 위한 것이다. 정정 분쟁에서 이 해시가 방어 수단이 된다.

```sql
create type citation_kind as enum ('press','assembly','research','government','other');

create table citations (
  id            bigint generated always as identity primary key,
  kind          citation_kind not null,
  source        text          not null,
  url           text,
  cited_on      date          not null,
  unit_id       text          references units(id),
  quote         text,
  accurate      boolean,
  used_our_term boolean,
  term          text,
  attributed    boolean,
  note          text,
  created_at    timestamptz   not null default now(),

  -- NULL 을 통과시키지 않으려면 `is true` 여야 한다.
  -- `used_our_term` 만 쓰면 NULL 일 때 CHECK 가 NULL 로 평가되어 통과한다.
  constraint citations_term_needs_flag
    check (term is null or used_our_term is true)
);

create index citations_date_idx on citations (cited_on desc);
create index citations_term_idx on citations (term) where used_our_term;
```

`accurate` 는 인용이 `K07` 인용 가이드를 따랐는지다. **틀린 인용의 비율이 우리 문안이 실패한 정도**이므로 지표로 관리한다. 인용 추적은 누락이 불가피하므로 **하한값으로만 보고**한다 — `확인된 인용 N건`.

`used_our_term`·`term`·`attributed` 는 **개념 선점의 크기**를 잰다(FR-50). 우리는 측정을 파는 회사이므로 자기 확산도 측정한다.

> **`used_our_term = true` 이고 `attributed = false` 인 인용이 늘어나는 것이 성공 신호다.** 출처 없이 우리 단어를 쓴다는 것은 그 단어가 **일반명사가 되었다**는 뜻이다. 이 값을 낮추려 하지 않는다. → [ADR-0010](./adr/0010-diffusion-first.md)

### 5.6b 사전 등록

측정은 사전 등록 없이 공표되지 않는다(→ [ADR-0009](./adr/0009-preregistration.md)).

```sql
create type prereg_status as enum ('draft','published','running','completed','abandoned');

create table preregistrations (
  id             text primary key,
  title          text          not null,
  claim_id       text          not null,
  hypothesis     text          not null,
  method_version text          references method_versions(version),
  method_summary text          not null,
  criteria       text          not null,
  falsification  text          not null,
  stop_rule      text          not null,
  status         prereg_status not null default 'draft',
  published_at   timestamptz,
  started_at     timestamptz,
  completed_at   timestamptz,
  outcome        text,
  supersedes     text          references preregistrations(id),

  constraint prereg_published_needs_time
    check (status = 'draft' or published_at is not null),
  constraint prereg_published_before_start
    check (started_at is null or (published_at is not null and published_at <= started_at))
);
```

`prereg_published_before_start` 가 INV-11의 핵심을 DB에서 강제한다 — **공개 시각이 측정 시작 시각보다 늦을 수 없다.** `claim_id` 는 `EVIDENCE.md` 의 주장 ID(`C-1`…)를 가리킨다.

`observations` 와 `robustness_runs` 는 사전 등록을 참조한다. 참조가 없는 관측은 **탐색적**이며 공개 집계에서 제외된다(FR-46).

```sql
alter table observations    add column prereg_id text references preregistrations(id);
alter table robustness_runs add column prereg_id text references preregistrations(id);
```

### 5.7 집계 뷰 — 모집단별로만

```sql
-- 두 모집단을 UNION 하는 뷰는 만들지 않는다 (AGENTS.md INV-1)
create view v_layer1_coverage as
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
```

이 뷰는 `population` 을 **행으로** 내보낸다. 소비하는 쪽이 반드시 모집단을 골라야 하며, 전체 합계를 내려면 의도적으로 그렇게 써야 한다 — 실수로 합산되지 않는다.

```sql
create view v_layer2_participation as
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
```

Layer 2 뷰는 **참여한 단위만** 나온다. 전국 분모가 아예 존재하지 않는 구조이므로, 화면이 `전국 N곳 중` 이라고 쓰려면 없는 데이터를 만들어내야 한다(INV-4).

### 5.8 RLS

```sql
alter table units          enable row level security;
alter table unit_domains   enable row level security;
alter table verdicts       enable row level security;
alter table tech_scans     enable row level security;
alter table observations   enable row level security;
alter table questions      enable row level security;
alter table statements     enable row level security;
alter table corrections    enable row level security;
alter table scan_jobs      enable row level security;

-- 공개 읽기
create policy units_public_read on units
  for select to anon, authenticated using (active);

create policy unit_domains_public_read on unit_domains
  for select to anon, authenticated using (active);

create policy verdicts_public_read on verdicts
  for select to anon, authenticated using (published);

create policy statements_public_read on statements
  for select to anon, authenticated using (published_at is not null);

-- 원시 관측·큐는 공개하지 않는다 (service_role 만 RLS를 우회)
-- tech_scans, scan_jobs, observations, questions 에는 anon 정책을 두지 않는다.

-- 정정 요청은 누구나 낼 수 있고, 읽을 수는 없다
create policy corrections_public_insert on corrections
  for insert to anon, authenticated with check (true);
```

셀프체크 제출은 **anon 이 `observations` 에 직접 INSERT 하지 않는다.** Route Handler 가 검증(레이트 리밋·봇 차단·조건 필수값·지명 합계)을 마친 뒤 `service_role` 로 삽입한다. 이유는 트리거만으로는 남용을 막을 수 없기 때문이다.

---

## 6. Next.js 구성

```
app/
  (public)/
    page.tsx                     전국 현황 — 모집단 병기, 순위 없음
    method/page.tsx              방법론 전문 (FR-8)
    cite/page.tsx                인용 가이드 (FR-9)
    bot/page.tsx                 수집기 안내 (NFR-4)
    units/page.tsx               단위 목록 — 기본 정렬: 행정구역 코드순
    units/[unitId]/page.tsx      단위 상세 + 설명 게재 + 정정 요청 링크
    [slug]/page.tsx              지역 조회 URL — /포천시 (FR-48) · 마지막 매칭
    press/page.tsx               보도 키트 (FR-49)
    selfcheck/page.tsx           프롬프트 (지역명 치환·복사)
    submit/page.tsx              결과 제출 폼
  (org)/
    dashboard/page.tsx           기관 대시보드 (v1)
  (admin)/
    review/page.tsx              검수 큐
    corrections/page.tsx         정정 처리
    scans/page.tsx               흔들리는 도메인 · 실패 목록
  api/
    submit/route.ts              POST — 셀프체크 제출
    corrections/route.ts         POST — 정정 요청
    export/layer1/route.ts       GET  — 공개 CSV/JSON (FR-10)
    og/[unitId]/route.tsx        GET  — 단위별 공유 카드 (FR-47) · **확산 엔진**
  robots.ts                      개방 + Sitemap 선언 (NFR-3)
  sitemap.ts
```

### 6.0 Layer 0 · 공개 표면의 설계 기준

Layer 1~3의 설계 기준은 **타당도**이고, Layer 0는 **전달성**이다. 같은 기준으로 설계하면 둘 다 어중간해진다. → [ADR-0010](./adr/0010-diffusion-first.md)

| 요소 | 요구 |
|---|---|
| **공유 카드** (FR-47) | 단위 이름 + 4분 판정 + 측정일 + 방법론 버전. **한 장으로 읽히고 한 장으로 인용 가능해야 한다** |
| **지역 조회 URL** (FR-48) | `/{시군구명}` — 기억해서 말할 수 있는 주소. 링크 하나로 "우리 동네"에 도달 |
| **보도 키트** (FR-49) | 승격·통지 완료 수치, 인용 문장 템플릿, **금지 표현**, 방법론 요약, 원자료 CSV |
| **프롬프트 팩** (FR-51) | 인쇄·배포 가능한 형태. 세미나 배포물로 쓴다 |

**Layer 0는 새 사실을 만들지 않는다.** 나르는 모든 숫자는 `verdicts.published = true` 이고 사전 등록을 거친 것이어야 한다. 이 제약을 코드로 강제한다 — 공유 카드 생성기는 미승격 판정을 받으면 카드를 만들지 않고 *"아직 공표 전"* 을 렌더한다.

### 6.1 렌더링 전략

| 경로 | 전략 | 이유 |
|---|---|---|
| `/`, `/units`, `/units/[id]` | ISR (`revalidate = 3600`) | 데이터가 주 1회 갱신된다. 매 요청 DB를 칠 이유가 없다 |
| `/{slug}` 지역 조회 | ISR | FR-48. `/units/[id]` 로 리다이렉트하지 않고 자체 렌더 — 공유 시 URL이 살아 있어야 한다 |
| `/api/og/[unitId]` | 캐시 (판정 갱신 시 무효화) | 공유 카드. 매 요청 생성하면 SNS 크롤러 트래픽에 무너진다 |
| `/method`, `/cite`, `/bot`, `/press` | 정적 | 배포 시점에 고정 |
| `/selfcheck` | 정적 + 클라이언트 치환 | 지역명 치환은 브라우저에서. 서버 요청 불필요 |
| `/submit` | 동적 | 폼 |
| `(org)`, `(admin)` | 동적 · `force-dynamic` | 인증 필요, 캐시 금지 |

승격(`verdict-promote`)이 끝나면 Edge Function 이 Vercel Deploy Hook 대신 `revalidateTag('verdicts')` 를 호출하는 Route Handler 를 친다. 캐시 태그는 `verdicts`, `units`, `layer2`.

### 6.2 타입으로 강제하는 불변식

```ts
// src/types/stats.ts
declare const brand: unique symbol;

export type Layer1Stat = {
  [brand]: 'layer1';
  population: Population;          // 필수 — 기본값 없음
  denominator: number;             // 전수
  open: number; blockedAll: number; blockedSelective: number;
  noFile: number; undetermined: number;
};

export type Layer2Stat = {
  [brand]: 'layer2';
  participatingUnits: number;      // 분모는 '참여한 단위 수'
  observationCount: number;
  methodVersion: string;
};

// 두 타입은 브랜드가 달라 서로 대입되지 않는다.
// 하나의 컴포넌트가 Layer1Stat | Layer2Stat 을 받지 않도록 리뷰에서 막는다.
```

```ts
// src/api/units.ts — INV-3
const SORTABLE = ['sgg_code', 'name', 'population'] as const;
type Sortable = (typeof SORTABLE)[number];

export function parseSort(input: string | undefined): Sortable {
  if (!input) return 'sgg_code';
  if (!SORTABLE.includes(input as Sortable)) {
    throw new BadRequest('정렬할 수 없는 필드입니다. 이 서비스는 순위를 제공하지 않습니다.');
  }
  return input as Sortable;
}
```

### 6.3 제출 파이프라인

```
POST /api/submit
  1) 레이트 리밋 (IP + 단위, 10분 5건)
  2) 봇 방지 토큰 검증
  3) 스키마 검증 (zod) — 조건 필드 전부 필수 (INV-7)
  4) 지명 합계 == method_versions.named_count 사전 검증
  5) 자유 질문 개인정보 1차 자동 필터 → pii_checked=false 로 저장
  6) service_role 로 observations INSERT (status='pending')
  7) 제출자에게 즉시 요약 피드백 반환 (제출 편향 완화)
```

5번의 자동 필터는 **차단이 아니라 표시**다. 최종 판단은 사람의 검수 큐(FR-25)에서 한다.

---

## 7. Edge Functions

| 함수 | 트리거 | 하는 일 |
|---|---|---|
| `scan-enqueue` | `pg_cron` 주 1회 (월 03:00 KST) | `unit_domains where scannable and active` 를 `scan_jobs` 에 넣는다. 유니크 제약으로 중복 무해 |
| `scan-worker` | `pg_cron` 2분마다 (월 03:05~09:00) | `claim_scan_jobs(20)` → 호스트별 최소 간격 지키며 순차 조회 → `tech_scans` 기록 → 잡 종료/재큐 |
| `verdict-promote` | `pg_cron` 주 1회 (화 04:00 KST) | 2주 연속 규칙으로 `verdicts` upsert, 흔들림은 `change_pending` |
| `measure-l3` | 기관별 스케줄 (v1) | AI API 호출 → `observations(layer=3)` + `item_results` |
| `revalidate-notify` | `verdict-promote` 종료 시 | Next.js `revalidateTag` 호출 |

`pg_cron` 등록 예:

```sql
select cron.schedule(
  'scan-enqueue-weekly',
  '0 18 * * 0',                                   -- UTC 일 18:00 = KST 월 03:00
  $$ select net.http_post(
       url     := current_setting('app.edge_base') || '/scan-enqueue',
       headers := jsonb_build_object(
                    'Authorization','Bearer ' || current_setting('app.edge_key'),
                    'Content-Type','application/json'),
       body    := '{}'::jsonb
     ) $$
);
```

> `pg_cron` 은 UTC로 동작한다. **모든 스케줄은 UTC로 적고 KST 주석을 단다.** 서머타임은 없지만 이 규칙을 지키지 않으면 반드시 한 번은 틀린다.

---

## 8. 마이그레이션과 시드

```
supabase/
  migrations/
    20260905090000_enums.sql
    20260905090100_units.sql
    20260905090200_scan.sql
    20260905090300_observations.sql
    20260905090400_corpus.sql
    20260905090500_views.sql
    20260905090600_rls.sql
    20260905090700_cron.sql
  seed/
    units.csv              ← K02 에서 생성
    unit_domains.csv       ← K02
    questions.csv          ← K04
    ai_agents.json         ← K03
    method_versions.csv    ← K03
```

**기존 마이그레이션 파일을 수정하지 않는다.** 시드 CSV는 지식 문서에서 파생되며, 지식 문서를 고치지 않고 CSV만 고치는 것은 금지한다(`AGENTS.md` §3).

---

## 9. 테스트

### 9.1 불변식 테스트 — `pnpm test:invariants`

| 테스트 | 내용 |
|---|---|
| INV-1 | 코드베이스에 두 모집단을 `union` 하는 SQL·쿼리가 없다 (정적 검사) |
| INV-2 | `undetermined` 삽입 시 사유 없으면 DB가 거부한다 |
| INV-3 | `/api/units?order=score` 가 400을 반환한다 |
| INV-4 | Layer 2 응답 객체에 `denominator` 필드가 존재하지 않는다 (타입 + 런타임) |
| INV-5 | 스캐너가 `SCANNER_UA` 외의 UA를 쓰지 않는다 (fetch 목킹) |
| INV-6 | 공개 API 응답 스키마에 원문 필드가 없다 |
| INV-7 | 조건 필드 누락 제출이 400을 반환한다 |
| INV-8 | 1주치 관측만으로 `verdicts` 가 생기지 않는다 |
| INV-9 | 정확 판정에 증상군을 붙이면 DB가 거부한다 · 정확도 응답 객체에 `floorRisk` 가 없으면 타입 오류 |
| INV-10 | `question_robustness` 행이 없거나 `sensitive` 인 문항이 공개 집계에 포함되지 않는다 |
| INV-11 | 공개 시각 없이 또는 공개보다 이른 시작 시각으로 사전 등록을 시작하면 DB가 거부한다 · `prereg_id` 없는 관측이 공개 집계에 포함되지 않는다 |
| INV-12 | 공개 API·리포트 문안에 `EVIDENCE.md` 미등록 사실 주장이 없다 (정적 검사) |
| L0-1 | 미승격·미공표 판정으로 공유 카드를 만들면 카드 대신 "공표 전"이 렌더된다 |
| L0-2 | `citations` 에 `term` 만 있고 `used_our_term` 이 참이 아니면 DB가 거부한다 |

### 9.2 스캐너 픽스처

`K09` 의 실측 9건을 **회귀 픽스처**로 고정한다. 각 실패 유형이 정확히 그 사유 코드로 판정되는지 검증한다.

| 픽스처 | 기대 판정 |
|---|---|
| `ifez_allow_with_paths` | `open` |
| `bjfez_crawl_delay` | `open` |
| `gfez_allow_all` | `open` |
| `dgfez_404` | `no_file` |
| `jgfez_timeout` | `undetermined / timeout` |
| `gsfez_blocked` | `blocked_all` |
| `ggfez_html_body` | `undetermined / malformed` |
| `truncated_group` | `undetermined / parse_fail` |
| `b_form_unit` | 스캔 잡이 생성되지 않음 |

### 9.3 자체 준수 검사 (NFR-3)

CI 에서 배포된 자기 사이트를 스캐너로 돌려 `open` + sitemap 선언 + JSON-LD 유효를 확인한다. 실패하면 배포를 막는다.

---

## 10. 관측성

- 스캔 실행마다 `run_id` 로 묶어 성공/실패/사유 코드 분포를 기록한다.
- 운영 대시보드(`/admin/scans`)는 세 가지를 본다: **실패 도메인**, **판정이 흔들리는 도메인**, **3주 연속 DNS 실패**(마스터 오류 신호).
- 알림 임계값: 전수 성공률 < 90%, 한 번의 배치에서 `timeout` 비율 > 20%(우리 쪽 네트워크 문제 의심).

---

## 11. 환경 변수

```bash
# Next.js (Vercel)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # 서버 전용. 절대 클라이언트 번들에 넣지 않는다
REVALIDATE_SECRET=
TURNSTILE_SECRET_KEY=

# Edge Functions
EDGE_SHARED_SECRET=                 # pg_net 호출 인증
SCANNER_CONTACT_URL=https://kplacelab.kr/bot

# Layer 3 (v1)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
```

Postgres 쪽 설정은 `alter database ... set app.edge_base = '...'` 로 넣고, 키는 Supabase Vault 를 사용한다.

---

## 12. 보안

- `service_role` 키는 Route Handler 와 Edge Function 에만 존재한다. 서버 컴포넌트에서도 쓰지 않는다.
- 기관 계정은 공직 메일 도메인 화이트리스트 + 매직 링크. **도메인만으로 소관 단위를 자동 귀속하지 않는다** — 관리자 승인을 거친다(위탁·출연기관 문제, PRD §15).
- 제출자 이메일은 알림·정정 목적으로만 쓰고, 공개 경로 어디에도 노출하지 않는다.
- 정정 요청은 익명으로도 받는다. 신원 요구는 정정을 막는 장벽이 된다.

---

## 13. 열려 있는 설계 문제

| # | 문제 | 영향 |
|---|---|---|
| D-1 | B형 단위 상세 페이지에서 시·도 값을 보여줄 때의 캐시 무효화 경로 | 시·도 판정 변경 시 B형 페이지도 갱신되어야 함 |
| D-2 | Layer 3 의 AI 서비스 조합 변경 시 시계열 단절 처리 | `method_version` 만으로 부족할 수 있음 |
| D-3 | 자유 질문 개인정보 자동 필터의 구현 방식 (규칙 기반 vs 모델) | 모델을 쓰면 비용과 재현성 문제 |
| D-4 | 다국어 측정(FR-30)에서 `language` 를 관측의 축으로 둘지 별도 테이블로 뺄지 | A형 특별구역 요구가 확정되면 결정 |
