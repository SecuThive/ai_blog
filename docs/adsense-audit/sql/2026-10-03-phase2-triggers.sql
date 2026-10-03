-- Phase 2 trigger changes (E: translation-only edits, D: publish approval gate).
-- Idempotent: CREATE OR REPLACE / IF NOT EXISTS / DROP TRIGGER IF EXISTS.
-- No COMMIT: review inside the transaction, then COMMIT manually after a backup.
-- Note: there is no content_updated_at column in posts. The "content updated" date shown on
-- the site comes from posts.updated_at (this trigger) and content_evidence.contentUpdatedAt
-- (set explicitly by editors). Both are covered: the trigger ignores EN-only edits, and
-- EN-only edits never write contentUpdatedAt.
BEGIN;

-- ── E. updated_at is bumped only for non-translation changes ────────────────
-- Ignored: content_evidence->'en' (EN title/excerpt/content) and tags starting with 'i18n.'.
-- Everything else in the original comparison still counts (KO title, content, excerpt,
-- cover_image, category, other tags, other content_evidence keys).
CREATE OR REPLACE FUNCTION public.set_post_content_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if row(
    new.title,
    new.content,
    new.excerpt,
    new.cover_image,
    new.category,
    array(select t from unnest(coalesce(new.tags, '{}'::text[])) t where t not like 'i18n.%'),
    coalesce(new.content_evidence, '{}'::jsonb) - 'en'
  ) is distinct from row(
    old.title,
    old.content,
    old.excerpt,
    old.cover_image,
    old.category,
    array(select t from unnest(coalesce(old.tags, '{}'::text[])) t where t not like 'i18n.%'),
    coalesce(old.content_evidence, '{}'::jsonb) - 'en'
  ) then
    new.updated_at = now();
  end if;
  return new;
end;
$function$;
-- Trigger posts_set_content_updated_at (BEFORE UPDATE) already exists and is unchanged.

-- ── D. Publishing requires a review record ──────────────────────────────────
-- Rejects any INSERT with status='published', or UPDATE that changes status to 'published',
-- unless reviewed_at and reviewed_by are set. Existing published rows are not touched
-- (edits to already-published rows pass because OLD.status is already 'published').
-- The site API (/api/posts, /api/posts/[id]) and the patched Telegram bot set both fields.
CREATE OR REPLACE FUNCTION public.enforce_review_before_publish()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published')
     and (new.reviewed_at is null or coalesce(btrim(new.reviewed_by), '') = '') then
    raise exception 'publish blocked: % id=% needs reviewed_at and reviewed_by (approval gate, docs/adsense-audit/pipeline.md)',
      tg_table_name, new.id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$function$;

DROP TRIGGER IF EXISTS posts_enforce_review_before_publish ON public.posts;
CREATE TRIGGER posts_enforce_review_before_publish
  BEFORE INSERT OR UPDATE OF status ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_review_before_publish();

-- engineer_guides: default was 'published', so upserts without a status published directly.
ALTER TABLE public.engineer_guides ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.engineer_guides ADD COLUMN IF NOT EXISTS reviewed_by text;
ALTER TABLE public.engineer_guides ALTER COLUMN status SET DEFAULT 'draft';

DROP TRIGGER IF EXISTS engineer_guides_enforce_review_before_publish ON public.engineer_guides;
CREATE TRIGGER engineer_guides_enforce_review_before_publish
  BEFORE INSERT OR UPDATE OF status ON public.engineer_guides
  FOR EACH ROW EXECUTE FUNCTION public.enforce_review_before_publish();

-- Checks to run before COMMIT:
-- SELECT pg_get_triggerdef(oid) FROM pg_trigger WHERE tgname LIKE '%enforce_review%';
-- SELECT column_default FROM information_schema.columns WHERE table_name='engineer_guides' AND column_name='status';
