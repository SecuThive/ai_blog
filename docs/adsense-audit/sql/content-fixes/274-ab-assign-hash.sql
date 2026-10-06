-- content fix 2026-10-06 post #274 LLM 프롬프트 버전 관리와 A/B 테스트
-- Sticky A/B assignment example: hash(user_id) % 100 -> int(hashlib.sha256(user_id.encode()).hexdigest(), 16) % 100
-- (assignment must stay the same across requests/workers/restarts; str hash() is salted per process via PYTHONHASHSEED).
-- KO body + EN body (content_evidence.en.content), one prose bullet each, with one short explanatory sentence.
-- Idempotent: rewritten only while the old text is present; re-running updates 0 rows.
BEGIN;
UPDATE posts SET
  content = replace(content,
    '- 사용자 ID 해시로 버전을 고정 배정합니다(예: `hash(user_id) % 100 < 50`).',
    '- 사용자 ID 해시로 버전을 고정 배정합니다(예: `int(hashlib.sha256(user_id.encode()).hexdigest(), 16) % 100 < 50`). 파이썬 내장 `hash()`는 문자열 값이 프로세스마다 달라(PYTHONHASHSEED) 워커나 재시작에 따라 배정이 바뀌므로 쓰지 않습니다.'),
  content_evidence = jsonb_set(content_evidence, '{en,content}', to_jsonb(replace(content_evidence->'en'->>'content',
    '- Assign versions deterministically by hashed user ID (e.g., `hash(user_id) % 100 < 50`).',
    '- Assign versions deterministically by hashed user ID (e.g., `int(hashlib.sha256(user_id.encode()).hexdigest(), 16) % 100 < 50`). Don''t use Python''s built-in `hash()`: string hashes differ per process (PYTHONHASHSEED), so assignments would change across workers and restarts.')))
WHERE id = 274
  AND (content LIKE '%`hash(user_id) \% 100 < 50`%' OR content_evidence->'en'->>'content' LIKE '%`hash(user_id) \% 100 < 50`%');
COMMIT;
