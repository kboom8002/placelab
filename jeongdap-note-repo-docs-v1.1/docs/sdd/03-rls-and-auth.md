# SDD 03 — 인증·권한·RLS

## 1. 인증
- Supabase Auth: 시민·참여자는 이메일 매직 링크/OTP, 지자체·운영은 **초대제 + 2단계 인증**.
- 역할은 `user_roles`(역할 × 지역 범위 × 언어 범위)에 저장. JWT 커스텀 클레임은 캐시 용도로만 쓰고 **권한 판정은 DB 함수**로 한다.
- 미성년(`profiles.is_minor`)은 `citizen`만.

## 2. 헬퍼 함수
```sql
create or replace function has_role(r app_role) returns boolean language sql stable security definer as $$
  select exists (select 1 from user_roles where user_id = auth.uid() and role = r)
$$;

-- 지역 범위: 사용자 역할 지역과 그 하위 지역
create or replace function region_in_scope(target text, r app_role) returns boolean language sql stable security definer as $$
  with recursive up(code, parent) as (
    select code, parent_code from regions where code = target
    union all
    select g.code, g.parent_code from regions g join up on g.code = up.parent
  )
  select exists (select 1 from user_roles ur join up on ur.region_code = up.code
                 where ur.user_id = auth.uid() and ur.role = r)
$$;

create or replace function lang_in_scope(l q_lang) returns boolean language sql stable security definer as $$
  select exists (select 1 from user_roles where user_id = auth.uid() and role = 'native_reviewer' and lang = l)
$$;
```

## 3. 정책 예시
```sql
alter table scorecards enable row level security;
create policy scorecards_public_read on scorecards for select using (
  exists (select 1 from publications p where p.round_id = scorecards.round_id
          and p.region_code = scorecards.region_code and p.stage in ('published','corrected'))
);
create policy scorecards_embargo_gov on scorecards for select using (
  region_in_scope(region_code, 'gov_official') or region_in_scope(region_code, 'gov_admin')
);
create policy scorecards_ops on scorecards for all using (has_role('ops_measure'));

alter table answers enable row level security;
create policy answers_ops on answers for select using (has_role('ops_measure') or has_role('ops_editor'));
-- 판정자는 answers를 직접 읽지 않고 rater_tasks 뷰(서비스명 가림, 배정된 것만)로 읽는다.

alter table claims enable row level security;
create policy claims_insert_self on claims for insert with check (reporter_id = auth.uid());
create policy claims_read_self on claims for select using (reporter_id = auth.uid() or has_role('ops_editor') or region_in_scope(region_code,'gov_official'));

alter table votes enable row level security;
create policy votes_once on votes for insert with check (user_id = auth.uid());

alter table l10n_reviews enable row level security;
create policy l10n_native on l10n_reviews for insert with check (
  stage in ('native1','native2') and lang_in_scope(lang) and actor_id = auth.uid()
);
create policy l10n_ops on l10n_reviews for all using (has_role('ops_measure') or has_role('ops_editor'));
-- AI 워커(service role)는 ai_draft·ai_check만 쓰도록 워커 코드와 체크 제약으로 강제:
--   service role은 RLS를 우회하므로, 함수 insert_l10n_ai(...)에서 stage in ('ai_draft','ai_check')만 허용

alter table corrections enable row level security;
create policy corrections_gov on corrections for all using (region_in_scope(region_code,'gov_official') or has_role('ops_editor'));

alter table user_roles enable row level security;
create policy roles_minor_guard on user_roles for insert with check (
  not (role in ('crew','rater','native_reviewer') and exists (select 1 from profiles p where p.user_id = user_roles.user_id and p.is_minor))
);
```

## 4. 뷰
| 뷰 | 용도 |
| --- | --- |
| `public_scorecards` | 발행된 결과만, 순위 컬럼 없음 |
| `rater_tasks` | 판정 배정 + 답 원문 + `masked_label` (실명·provider 제외) |
| `proposal_list` | 제안 + 투표 수(개인 정보 제외) |
| `region_tree` | 지역과 상위 경로 (브레드크럼) |

## 5. 원칙
- 서버(Server Actions·Route Handlers)에서 역할을 **다시** 확인한다. RLS만 믿지 않는다.
- service role 키는 워커·Edge Functions·재검증 핸들러에서만.
- 모든 정책은 `pnpm test:rls`의 역할 × 자원 시나리오(`knowledge/roles-and-permissions.md`)로 검증.
