-- 20260905000008_create_question_bank.sql
-- SDD 5.5 및 5.5a 질문 은행 (8블록 구조)

create table question_bank (
  id             text primary key,
  method_version text not null references method_versions(version),
  kind           text not null check (kind in ('named','unnamed')),
  seq            int  not null,
  body           text not null,
  domain_tag     text,
  block_actor     text,
  block_situation text,
  block_task      text,
  block_knowledge text,
  block_workflow  text,
  block_format    text,
  block_language  text not null default 'ko',
  block_output    text,
  unique (method_version, kind, seq)
);
