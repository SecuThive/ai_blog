-- ── Supabase SQL Editor에 붙여넣고 실행 ──────────────────────────

create table if not exists comments (
  id         bigserial primary key,
  post_slug  text        not null,
  name       text        not null default '익명',
  content    text        not null,
  status     text        not null default 'approved' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now()
);

create index if not exists comments_post_slug on comments(post_slug, status);

alter table comments enable row level security;

-- 누구나 승인된 댓글 읽기 가능
create policy "Public can read approved comments"
  on comments for select
  using (status = 'approved');

-- service_role 전체 권한 (API route에서 insert에 사용)
create policy "Service role full access on comments"
  on comments for all
  using (auth.role() = 'service_role');
