-- Add reply (parent_id) and likes to the comments table.
-- Run this in Supabase Dashboard > SQL Editor BEFORE deploying the community features.
-- Existing comments columns: id, post_slug, name, content, status, created_at, ip_hash
-- New columns are nullable/default, so existing code (site_ops_engine moderation) is unaffected.
-- NOTE: keep comments ASCII-only — the Supabase SQL editor mangled a non-ASCII arrow char before.

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES public.comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS likes     INTEGER NOT NULL DEFAULT 0;

-- Indexes: group a post's thread by parent_id and sort
CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON public.comments(post_slug, status);
CREATE INDEX IF NOT EXISTS idx_comments_parent    ON public.comments(parent_id) WHERE parent_id IS NOT NULL;

-- Idempotent likes: UNIQUE(comment_id, ip_hash) = one like per person per comment.
-- This UNIQUE constraint also doubles as abuse protection (no separate rate limit needed).
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id         BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  ip_hash    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (comment_id, ip_hash)
);
ALTER TABLE public.comment_likes DISABLE ROW LEVEL SECURITY;

-- Atomic like increment RPC (concurrency-safe, server-only)
CREATE OR REPLACE FUNCTION public.increment_comment_likes(cid BIGINT)
RETURNS INTEGER
LANGUAGE sql
AS $$
  UPDATE public.comments
     SET likes = likes + 1
   WHERE id = cid AND status = 'approved'
  RETURNING likes;
$$;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'comments'
  AND column_name IN ('parent_id', 'likes')
ORDER BY column_name;
