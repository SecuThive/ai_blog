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
-- Blocks only a move INTO 'published' without reviewed_at and reviewed_by:
--   * UPDATE where OLD.status <> 'published' and NEW.status = 'published';
--   * INSERT of a new row with status 'published'.
-- Not blocked: any edit of a row that is already published (content, title, EN, views, no-op,
-- or a full-row save that repeats status='published'), including an upsert
-- (INSERT ... ON CONFLICT DO UPDATE, i.e. supabase-js .upsert) that hits an existing published
-- row by id or slug. BEFORE INSERT fires before conflict detection, so that case is checked
-- explicitly; the ON CONFLICT UPDATE then goes through the UPDATE branch.
-- The function never assigns status or published_at (no silent unpublish).
-- Regression test: tests/publish-gate-regression.sql.
CREATE OR REPLACE FUNCTION public.enforce_review_before_publish()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  already_published boolean := false;
begin
  if new.status is distinct from 'published'
     or (new.reviewed_at is not null and coalesce(btrim(new.reviewed_by), '') <> '') then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.status = 'published' then
      return new;
    end if;
  else
    -- INSERT: let an upsert onto an existing published row through (posts and engineer_guides
    -- both have id and a unique slug).
    execute format('select exists (select 1 from %I.%I where (id = $1 or slug = $2) and status = ''published'')',
                   tg_table_schema, tg_table_name)
      into already_published using new.id, new.slug;
    if already_published then
      return new;
    end if;
  end if;

  raise exception 'publish blocked: % id=% needs reviewed_at and reviewed_by (approval gate, docs/adsense-audit/pipeline.md)',
    tg_table_name, new.id
    using errcode = 'check_violation';
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
