-- 20260905000010_create_item_results.sql
-- SDD 5.5 문항별 반복 회차 결과 및 Floor Risk 계산 함수 (INV-9)

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
