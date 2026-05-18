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

-- ── subscribers ──────────────────────────────────────────────────

create table if not exists subscribers (
  id         bigserial primary key,
  email      text not null unique,
  created_at timestamptz not null default now()
);

alter table subscribers enable row level security;

create policy "Service role full access on subscribers"
  on subscribers for all
  using (auth.role() = 'service_role');

-- ── engineer_guides ───────────────────────────────────────────────

create table if not exists engineer_guides (
  id          bigserial primary key,
  title       text        not null,
  slug        text        not null unique,
  summary     text        not null default '',
  content     text        not null,
  category    text        not null,
  tags        text[]      not null default '{}',
  difficulty  text        not null default 'beginner' check (difficulty in ('beginner','intermediate','advanced')),
  os_compat   text[]      not null default '{}',
  author      text        not null default 'Engineer Bot',
  views       bigint      not null default 0,
  status      text        not null default 'published' check (status in ('draft','published')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists engineer_guides_status on engineer_guides(status);
create index if not exists engineer_guides_category on engineer_guides(category);
create index if not exists engineer_guides_slug on engineer_guides(slug);

alter table engineer_guides enable row level security;

create policy "Public can read published guides"
  on engineer_guides for select
  using (status = 'published');

create policy "Service role full access on guides"
  on engineer_guides for all
  using (auth.role() = 'service_role');

-- ── contact_messages ─────────────────────────────────────────────

create table if not exists contact_messages (
  id         bigserial primary key,
  name       text        not null,
  email      text        not null,
  type       text,
  company    text,
  message    text        not null,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;

create policy "Service role full access on contacts"
  on contact_messages for all
  using (auth.role() = 'service_role');
