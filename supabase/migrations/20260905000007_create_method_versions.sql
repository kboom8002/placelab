-- 20260905000007_create_method_versions.sql
-- SDD 5.5 방법론 버전

create table method_versions (
  version        text primary key,
  named_count    int  not null,
  unnamed_count  int  not null,
  effective_from date not null,
  notes          text
);
