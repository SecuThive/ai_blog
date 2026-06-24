-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/isfzeksbzxtuqymfocqv/sql

-- Add English translation columns to posts
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS excerpt_en TEXT,
  ADD COLUMN IF NOT EXISTS content_en TEXT;

-- Add English translation columns to engineer_guides
ALTER TABLE engineer_guides
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS summary_en TEXT,
  ADD COLUMN IF NOT EXISTS content_en TEXT;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'posts'
  AND column_name IN ('title_en', 'excerpt_en', 'content_en')
ORDER BY column_name;
