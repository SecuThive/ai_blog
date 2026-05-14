-- ── Supabase SQL Editor에 그대로 붙여넣고 실행 ──────────────────

create table if not exists posts (
  id            bigserial primary key,
  title         text        not null,
  slug          text        not null unique,
  content       text        not null,
  excerpt       text        not null default '',
  cover_image   text,
  category      text        not null default 'AI & 자동화',
  tags          text[]      not null default '{}',
  status        text        not null default 'published' check (status in ('draft','published')),
  author        text        not null default 'Content Director',
  agent_role    text        not null default 'content_director',
  views         bigint      not null default 0,
  created_at    timestamptz not null default now(),
  published_at  timestamptz
);

-- 인덱스
create index if not exists posts_status_published_at on posts(status, published_at desc);
create index if not exists posts_category on posts(category);
create index if not exists posts_slug on posts(slug);

-- Row Level Security: 누구나 published 글 읽기 가능
alter table posts enable row level security;

create policy "Public can read published posts"
  on posts for select
  using (status = 'published');

-- service_role은 모든 작업 허용 (API route에서 사용)
create policy "Service role has full access"
  on posts for all
  using (auth.role() = 'service_role');
