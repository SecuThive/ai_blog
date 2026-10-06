-- content fix 2026-10-06 post #307 poc를-넘어-프로덕션으로-클라우드-환경에서-llm을-안정적으로-서비스화하는-기술-로드맵
-- FastAPI + Redis example: cache key hash(prompt) -> hashlib.sha256(prompt.encode()).hexdigest()
-- (Redis is shared by all workers; str hash() is salted per process via PYTHONHASHSEED, so keys would not match across workers/restarts).
-- KO body + EN body (content_evidence.en.content). Adds `import hashlib` and one comment line.
-- Idempotent: each field is rewritten only while it still contains hash(prompt); re-running updates 0 rows.
BEGIN;
UPDATE posts SET
  content = CASE WHEN content LIKE '%{hash(prompt)}%' THEN
    replace(replace(content,
      E'import redis.asyncio as redis\nimport asyncio\n',
      E'import hashlib\nimport redis.asyncio as redis\nimport asyncio\n'),
      E'    cache_key = f"llm_cache:{hash(prompt)}"\n',
      E'    # 내장 hash()는 프로세스마다 값이 달라(PYTHONHASHSEED) 워커 간 Redis 캐시가 공유되지 않으므로 sha256을 사용\n    cache_key = f"llm_cache:{hashlib.sha256(prompt.encode()).hexdigest()}"\n')
    ELSE content END,
  content_evidence = CASE WHEN content_evidence->'en'->>'content' LIKE '%{hash(prompt)}%' THEN
    jsonb_set(content_evidence, '{en,content}', to_jsonb(
      replace(replace(content_evidence->'en'->>'content',
        E'import redis.asyncio as redis\nimport asyncio\n',
        E'import hashlib\nimport redis.asyncio as redis\nimport asyncio\n'),
        E'    cache_key = f"llm_cache:{hash(prompt)}"\n',
        E'    # Built-in hash() differs per process (PYTHONHASHSEED), so workers would not share the Redis cache; use sha256\n    cache_key = f"llm_cache:{hashlib.sha256(prompt.encode()).hexdigest()}"\n')))
    ELSE content_evidence END
WHERE id = 307
  AND (content LIKE '%{hash(prompt)}%' OR content_evidence->'en'->>'content' LIKE '%{hash(prompt)}%');
COMMIT;
