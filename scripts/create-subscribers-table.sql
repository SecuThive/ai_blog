-- subscribers 테이블 생성
-- Supabase Dashboard > SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS public.subscribers (
  id        BIGSERIAL PRIMARY KEY,
  email     TEXT NOT NULL UNIQUE,
  active    BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS 비활성화 (서버 사이드에서만 접근)
ALTER TABLE public.subscribers DISABLE ROW LEVEL SECURITY;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_subscribers_email  ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON public.subscribers(active) WHERE active = true;
