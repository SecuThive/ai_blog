-- Publish gate regression test for ../2026-10-03-phase2-triggers.sql
-- Run ONLY on a throwaway restore, from this directory:
--   psql -X -d <throwaway_db> -f publish-gate-regression.sql
-- Everything runs in one transaction and ends with ROLLBACK. Output: one PASS/FAIL row per case.
-- Expectation: the gate blocks only a move INTO 'published' without reviewed_at/reviewed_by,
-- and never changes status or published_at itself.
\set ON_ERROR_STOP 1
BEGIN;

-- Snapshot before the triggers file runs (case d/e compare against it).
CREATE TEMP TABLE snap_posts  AS SELECT id, status, published_at FROM public.posts;
CREATE TEMP TABLE snap_guides AS SELECT id, status FROM public.engineer_guides;
CREATE TEMP TABLE results (n serial, case_id text, ok boolean, detail text);

\ir ../2026-10-03-phase2-triggers.sql

-- Fixtures: an already-published row with NULL review fields, and a draft post.
CREATE TEMP TABLE fx AS SELECT
  (SELECT id FROM public.posts WHERE status='published' AND reviewed_at IS NULL AND reviewed_by IS NULL ORDER BY id LIMIT 1) AS pub_post,
  (SELECT id FROM public.engineer_guides WHERE status='published' ORDER BY id LIMIT 1) AS pub_guide,
  (SELECT id FROM public.posts WHERE status='draft' AND reviewed_at IS NULL ORDER BY id LIMIT 1) AS draft_post,
  NULL::bigint AS new_guide;

DO $t$
DECLARE
  f fx%ROWTYPE; s text; p timestamptz; u timestamptz; u2 timestamptz; blocked boolean; msg text;
BEGIN
  SELECT * INTO f FROM fx;
  IF f.pub_post IS NULL OR f.pub_guide IS NULL OR f.draft_post IS NULL THEN
    RAISE EXCEPTION 'fixture missing: %', row_to_json(f);
  END IF;

  -- a. published + NULL review: content/title/EN edits succeed, status/published_at unchanged
  UPDATE public.posts SET title = title || ' [t]', content = content || E'\n<!-- t -->', excerpt = coalesce(excerpt,'') || ' t'
   WHERE id = f.pub_post;
  SELECT status, published_at INTO s, p FROM public.posts WHERE id = f.pub_post;
  INSERT INTO results(case_id, ok, detail) SELECT 'a1 post KO title/content edit', s='published' AND p IS NOT DISTINCT FROM sp.published_at,
    format('status=%s published_at kept=%s', s, p IS NOT DISTINCT FROM sp.published_at) FROM snap_posts sp WHERE sp.id=f.pub_post;

  SELECT updated_at INTO u FROM public.posts WHERE id = f.pub_post;
  UPDATE public.posts SET content_evidence = jsonb_set(coalesce(content_evidence,'{}'),'{en}',
      coalesce(content_evidence->'en','{}') || '{"title":"EN regression edit"}') WHERE id = f.pub_post;
  SELECT status, published_at, updated_at INTO s, p, u2 FROM public.posts WHERE id = f.pub_post;
  INSERT INTO results(case_id, ok, detail) SELECT 'a2 post EN-only edit', s='published' AND p IS NOT DISTINCT FROM sp.published_at AND u2 IS NOT DISTINCT FROM u,
    format('status=%s published_at kept=%s updated_at kept=%s', s, p IS NOT DISTINCT FROM sp.published_at, u2 IS NOT DISTINCT FROM u) FROM snap_posts sp WHERE sp.id=f.pub_post;

  -- full-row save that repeats status='published' (what PUT /api/posts/[id] and the bot send)
  UPDATE public.posts SET status='published', title = title || '2' WHERE id = f.pub_post;
  SELECT status INTO s FROM public.posts WHERE id = f.pub_post;
  INSERT INTO results(case_id, ok, detail) VALUES ('a3 post edit with status=published repeated', s='published', 'status='||s);

  UPDATE public.engineer_guides SET title = title || ' [t]', summary = coalesce(summary,'') || ' t', content = content || E'\n<!-- t -->' WHERE id = f.pub_guide;
  UPDATE public.engineer_guides SET status='published', title = title || '2' WHERE id = f.pub_guide;
  SELECT status INTO s FROM public.engineer_guides WHERE id = f.pub_guide;
  INSERT INTO results(case_id, ok, detail) VALUES ('a4 guide title/summary/content edit (+status repeated)', s='published', 'status='||s);

  -- b. no-op and view-count updates on published + NULL review
  UPDATE public.posts SET title = title WHERE id = f.pub_post;
  UPDATE public.posts SET views = views + 1 WHERE id = f.pub_post;
  UPDATE public.engineer_guides SET title = title WHERE id = f.pub_guide;
  UPDATE public.engineer_guides SET views = views + 1 WHERE id = f.pub_guide;
  INSERT INTO results(case_id, ok, detail) SELECT 'b1 no-op + views+1 (post, guide)',
    (SELECT status FROM public.posts WHERE id=f.pub_post)='published' AND (SELECT status FROM public.engineer_guides WHERE id=f.pub_guide)='published', 'both statements succeeded';

  -- upsert of an existing published row (supabase-js .upsert / PostgREST merge-duplicates)
  blocked := false;
  BEGIN
    INSERT INTO public.posts (id, title, slug, content, status)
      SELECT id, title || ' up', slug, content, 'published' FROM public.posts WHERE id = f.pub_post
      ON CONFLICT (slug) DO UPDATE SET title = excluded.title, status = excluded.status;
    INSERT INTO public.engineer_guides (title, slug, content, category, status)
      SELECT title || ' up', slug, content, category, 'published' FROM public.engineer_guides WHERE id = f.pub_guide
      ON CONFLICT (slug) DO UPDATE SET title = excluded.title, status = excluded.status;
  EXCEPTION WHEN check_violation THEN blocked := true; END;
  INSERT INTO results(case_id, ok, detail) VALUES ('b2 upsert onto existing published post/guide (status=published)',
    NOT blocked AND (SELECT status FROM public.posts WHERE id=f.pub_post)='published' AND (SELECT status FROM public.engineer_guides WHERE id=f.pub_guide)='published',
    CASE WHEN blocked THEN 'blocked (wrong)' ELSE 'succeeded, status=published' END);

  -- c. draft -> published
  blocked := false;
  BEGIN UPDATE public.posts SET status='published', published_at=now() WHERE id=f.draft_post;
  EXCEPTION WHEN check_violation THEN blocked := true; msg := SQLERRM; END;
  INSERT INTO results(case_id, ok, detail) VALUES ('c1 post draft->published, no review: blocked', blocked, coalesce(left(msg,60),'NOT blocked'));

  blocked := false;
  BEGIN UPDATE public.posts SET status='published', published_at=now(), reviewed_at=now(), reviewed_by='   ' WHERE id=f.draft_post;
  EXCEPTION WHEN check_violation THEN blocked := true; END;
  INSERT INTO results(case_id, ok, detail) VALUES ('c2 post draft->published, blank reviewed_by: blocked', blocked, CASE WHEN blocked THEN 'blocked' ELSE 'NOT blocked' END);

  blocked := false;
  BEGIN INSERT INTO public.posts (title, slug, content, status) VALUES ('gate t','gate-regression-post','x','published');
  EXCEPTION WHEN check_violation THEN blocked := true; END;
  INSERT INTO results(case_id, ok, detail) VALUES ('c3 post INSERT as published, no review: blocked', blocked, CASE WHEN blocked THEN 'blocked' ELSE 'NOT blocked' END);

  UPDATE public.posts SET status='published', published_at=now(), reviewed_at=now(), reviewed_by='regression-test' WHERE id=f.draft_post;
  SELECT status INTO s FROM public.posts WHERE id=f.draft_post;
  INSERT INTO results(case_id, ok, detail) VALUES ('c4 post draft->published with review: passes', s='published', 'status='||s);

  INSERT INTO public.engineer_guides (title, slug, content, category, difficulty)
    VALUES ('gate t','gate-regression-guide','x',
            (SELECT category FROM public.engineer_guides WHERE id=f.pub_guide), 'beginner')
    RETURNING id, status INTO f.new_guide, s;
  UPDATE fx SET new_guide = f.new_guide;
  INSERT INTO results(case_id, ok, detail) VALUES ('c5 guide INSERT without status gets draft', s='draft', 'status='||s);

  blocked := false;
  BEGIN UPDATE public.engineer_guides SET status='published' WHERE id=f.new_guide;
  EXCEPTION WHEN check_violation THEN blocked := true; END;
  INSERT INTO results(case_id, ok, detail) VALUES ('c6 guide draft->published, no review: blocked', blocked, CASE WHEN blocked THEN 'blocked' ELSE 'NOT blocked' END);

  blocked := false;
  BEGIN INSERT INTO public.engineer_guides (title, slug, content, category, difficulty, status)
    VALUES ('gate t2','gate-regression-guide-2','x',(SELECT category FROM public.engineer_guides WHERE id=f.pub_guide),'beginner','published');
  EXCEPTION WHEN check_violation THEN blocked := true; END;
  INSERT INTO results(case_id, ok, detail) VALUES ('c7 guide INSERT as published, no review: blocked', blocked, CASE WHEN blocked THEN 'blocked' ELSE 'NOT blocked' END);

  UPDATE public.engineer_guides SET status='published', reviewed_at=now(), reviewed_by='regression-test' WHERE id=f.new_guide;
  SELECT status INTO s FROM public.engineer_guides WHERE id=f.new_guide;
  INSERT INTO results(case_id, ok, detail) VALUES ('c8 guide draft->published with review: passes', s='published', 'status='||s);
END
$t$;

-- d. default change does not alter existing rows
INSERT INTO results(case_id, ok, detail)
SELECT 'd1 guides: status of existing rows unchanged', count(*) FILTER (WHERE g.status IS DISTINCT FROM sg.status) = 0,
       format('%s rows compared, %s changed', count(*), count(*) FILTER (WHERE g.status IS DISTINCT FROM sg.status))
FROM snap_guides sg JOIN public.engineer_guides g USING (id);
INSERT INTO results(case_id, ok, detail)
SELECT 'd2 guides column default is draft', column_default = '''draft''::text', column_default
FROM information_schema.columns WHERE table_schema='public' AND table_name='engineer_guides' AND column_name='status';

-- e. no silent unpublish: touch every row, then compare status/published_at with the snapshot
UPDATE public.posts SET views = views;
UPDATE public.engineer_guides SET views = views;
UPDATE public.posts SET content_evidence = content_evidence WHERE status='published';
INSERT INTO results(case_id, ok, detail)
SELECT 'e1 posts: status/published_at unchanged except c4 row', count(*) FILTER (WHERE (p.status, p.published_at) IS DISTINCT FROM (sp.status, sp.published_at)) = 0,
       format('%s rows compared', count(*))
FROM snap_posts sp JOIN public.posts p USING (id) WHERE sp.id <> (SELECT draft_post FROM fx);
INSERT INTO results(case_id, ok, detail)
SELECT 'e2 guides: status unchanged', count(*) FILTER (WHERE g.status IS DISTINCT FROM sg.status) = 0, format('%s rows compared', count(*))
FROM snap_guides sg JOIN public.engineer_guides g USING (id);
INSERT INTO results(case_id, ok, detail)
SELECT 'e3 trigger functions never assign status', bool_and(prosrc !~* 'new\.status\s*:?=' AND prosrc !~* 'new\.published_at\s*:?='), string_agg(proname, ',')
FROM pg_proc WHERE proname IN ('enforce_review_before_publish','set_post_content_updated_at');

SELECT n, CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS result, case_id, detail FROM results ORDER BY n;
SELECT count(*) FILTER (WHERE ok) AS passed, count(*) FILTER (WHERE NOT ok) AS failed FROM results;
ROLLBACK;
