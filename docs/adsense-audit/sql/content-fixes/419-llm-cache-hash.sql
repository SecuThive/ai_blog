-- content fix 2026-10-06 post #419 llm-api-비용-폭탄-피하기-캐싱-모델-선택-필터링으로-비용-최적화하는-3가지-전략
-- Redis cache key example: Python hash(user_query) -> hashlib.sha256(user_query.encode()).hexdigest()
-- (str hash() is salted per process via PYTHONHASHSEED, so workers would not share the cache).
-- KO body (content) + EN body (content_evidence.en.content). Adds `import hashlib` and one comment line.
-- Idempotent: each field is rewritten only while it still contains hash(user_query); re-running updates 0 rows.
-- updated_at is bumped by trigger posts_set_content_updated_at. published_at/status/slug untouched.
BEGIN;
UPDATE posts SET
  content = CASE WHEN content LIKE '%{hash(user_query)}%' THEN
    replace(replace(content,
      E'import redis\nimport time\n',
      E'import hashlib\nimport redis\nimport time\n'),
      E'    # 1. Key 생성: 질문과 시스템 정보를 조합하여 고유 Key 생성\n    cache_key = f"llm_query:{hash(user_query)}"\n',
      E'    # 1. Key 생성: 질문과 시스템 정보를 조합하여 고유 Key 생성\n    # 내장 hash()는 프로세스마다 값이 달라(PYTHONHASHSEED) 워커 간 캐시가 공유되지 않으므로 sha256을 사용\n    cache_key = f"llm_query:{hashlib.sha256(user_query.encode()).hexdigest()}"\n')
    ELSE content END,
  content_evidence = CASE WHEN content_evidence->'en'->>'content' LIKE '%{hash(user_query)}%' THEN
    jsonb_set(content_evidence, '{en,content}', to_jsonb(
      replace(replace(content_evidence->'en'->>'content',
        E'import redis\nimport time\n',
        E'import hashlib\nimport redis\nimport time\n'),
        E'    # 1. Key 생성: 질문과 시스템 정보를 조합하여 고유 Key 생성\n    cache_key = f"llm_query:{hash(user_query)}"\n',
        E'    # 1. Key 생성: 질문과 시스템 정보를 조합하여 고유 Key 생성\n    # Built-in hash() differs per process (PYTHONHASHSEED), so workers would not share the cache; use sha256\n    cache_key = f"llm_query:{hashlib.sha256(user_query.encode()).hexdigest()}"\n')))
    ELSE content_evidence END
WHERE id = 419
  AND (content LIKE '%{hash(user_query)}%' OR content_evidence->'en'->>'content' LIKE '%{hash(user_query)}%');
COMMIT;
