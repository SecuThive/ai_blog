-- ── Supabase SQL Editor에 붙여넣고 실행 ──────────────────────────

-- 1. 포스트 피드백 카운터 컬럼 추가
alter table posts
  add column if not exists helpful_count   bigint not null default 0,
  add column if not exists unhelpful_count bigint not null default 0;

-- 2. 댓글 Rate Limiting용 IP 해시 컬럼 추가
alter table comments
  add column if not exists ip_hash text;

create index if not exists comments_ip_hash_created
  on comments(ip_hash, created_at desc);
