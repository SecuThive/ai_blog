-- =====================================================================================
-- Nodelog 1단계(애드센스 품질) 본문 수정안 — 2026-10-03 작성, **미적용**
-- -------------------------------------------------------------------------------------
-- 이 파일은 검토용입니다. 이 PR 작업 중에는 운영 DB에 아무것도 쓰지 않았습니다.
--
-- 적용 전:
--   1) 백업:  ~/project/nodelog-db/nodelog-backup.sh   (pg_dump → ~/project/nodelog-db/backups/)
--   2) 아래 "사전 확인" SELECT로 대상 문자열이 그대로 있는지 확인. 각 UPDATE는 WHERE에 원문 문자열 조건을
--      걸어 두어, 원문이 이미 바뀌었으면 0행만 갱신된다(중복 적용 안전).
--   3) psql에서 실행:  \i 2026-10-03-phase1-content-fixes.sql  → 결과 확인 후 COMMIT, 이상하면 ROLLBACK.
--      (파일 끝에 COMMIT이 없다. 직접 입력해야 반영된다.)
--   4) 반영 후: /api/revalidate 호출 또는 재배포로 ISR 캐시 갱신, IndexNow 제출은 선택.
--
-- 주의: posts에는 트리거 posts_set_content_updated_at가 있어 title/content/excerpt/tags/content_evidence가
--   바뀌면 updated_at=now()가 찍힌다. 이 PR의 코드는 화면·JSON-LD·sitemap에 updated_at 대신
--   content_evidence.contentUpdatedAt(+changeSummary)만 쓰므로, 아래 수정에는 실제 변경일과 변경 요약을 함께 넣는다.
-- 사람 확인 필요 표시: [확인] — 적용 전에 편집자가 문구를 읽어 보세요.
-- =====================================================================================

BEGIN;

-- 공용: tags 배열에서 접두사(i18n.title: 등)로 시작하는 값을 교체(순서 유지, 없으면 뒤에 추가)
CREATE OR REPLACE FUNCTION pg_temp.set_tag(tags text[], prefix text, val text) RETURNS text[] AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM unnest(tags) t WHERE t LIKE prefix || '%')
      THEN ARRAY(SELECT CASE WHEN t LIKE prefix || '%' THEN prefix || val ELSE t END
                 FROM unnest(tags) WITH ORDINALITY AS u(t, n) ORDER BY n)
    ELSE tags || (prefix || val)
  END
$$ LANGUAGE sql IMMUTABLE;

-- 공용: 변경 기록(content_evidence.contentUpdatedAt / changeSummary) 기록
CREATE OR REPLACE FUNCTION pg_temp.stamp(ev jsonb, summary text) RETURNS jsonb AS $$
  SELECT coalesce(ev, '{}'::jsonb)
    || jsonb_build_object(
         'contentUpdatedAt', to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD'),
         'changeSummary', CASE WHEN ev ? 'changeSummary' AND coalesce(ev->>'changeSummary','') <> ''
                               THEN (ev->>'changeSummary') || ' / ' || summary ELSE summary END)
$$ LANGUAGE sql STABLE;

-- -------------------------------------------------------------------------------------
-- 사전 확인
-- -------------------------------------------------------------------------------------
SELECT id, slug, title, updated_at FROM posts WHERE id IN (206, 217, 262, 263, 265, 267, 400, 402) ORDER BY id;

-- =====================================================================================
-- (5) 홈 노출 글 #400 — 2024년 출시 LLM 회고 자료
--   배경: 2026-10-02 13:57 KST에 별도 Codex 세션(~/project/ai-blog의 fix-llm-2024-retrospective.mjs)이 KO 본문을
--   회고 자료로 바꾸고 content_evidence.en(제목·본문·설명)과 verifiedAt 등을 넣었다(사용자 지시 아님, db-changes.md 참고).
--   남은 문제:
--     a) EN <title>/description은 tags의 i18n.title:/i18n.excerpt: 값이 content_evidence.en보다 우선해서
--        옛 「2024 LLM Model Selection Guide … Optimal AI Engine by Industry」가 그대로 나간다.
--     b) 비용 공식 표기가 모호하다. EN은 "(tokens × price per million) … / 1,000,000"(감사 보고서는 "100만 나눗셈
--        중복"으로 지적. 'price per million'을 '100만 토큰당 단가'로 읽으면 수식은 맞지만 '단가÷100만'으로 읽히면
--        두 번 나눈 셈), KO는 "토큰 × 입력 단가/100만 토큰"으로 나눗셈이 빠진 것처럼 읽힌다. 둘 다 같은 명확한 식으로 바꾼다.
--     c) KO 안내문 "최초 발행 표시는 2026년 5월 31일… Claude 3.5 Sonnet은 그 뒤인 2024년 6월"은 시간 순서가 틀렸다.
--        EN 안내문도 같은 구조라 함께 고친다.
-- =====================================================================================
UPDATE posts SET
  content = replace(replace(content,
    '이 글의 최초 발행 표시는 **2026년 5월 31일**입니다. Claude 3.5 Sonnet은 그 뒤인 2024년 6월에 공개됐으므로, 이 글을 2024년 당시 작성된 비교나 2026년 현재의 추천으로 읽어서는 안 됩니다.',
    '다루는 모델은 2024년 4~6월에 공개됐습니다(Llama 3 4월, GPT-4o 5월, Claude 3.5 Sonnet 6월). 이 글은 그보다 훨씬 뒤인 **2026년 5월 31일**에 처음 게시됐고 2026년 10월 2일 회고 자료로 다시 편집됐습니다. 따라서 2024년 당시에 쓴 비교도, 2026년 현재의 추천도 아닙니다.'),
    '월 호출 수 × ((호출당 평균 입력 토큰 × 입력 단가/100만 토큰) + (호출당 평균 출력 토큰 × 출력 단가/100만 토큰))',
    '월 호출 수 × ((호출당 평균 입력 토큰 ÷ 1,000,000 × 100만 토큰당 입력 단가) + (호출당 평균 출력 토큰 ÷ 1,000,000 × 100만 토큰당 출력 단가))'),
  content_evidence = pg_temp.stamp(
    jsonb_set(content_evidence, '{en,content}', to_jsonb(replace(replace(content_evidence->'en'->>'content',
      'This article was first published on **31 May 2026** and looks back at models announced in 2024. Claude 3.5 Sonnet was announced in June 2024. This is neither a comparison written in 2024 nor a current model recommendation.',
      'The models covered were announced between April and June 2024 (Llama 3 in April, GPT-4o in May, Claude 3.5 Sonnet in June). This article was first published much later, on **31 May 2026**, and was re-edited as a retrospective on 2 October 2026. It is neither a comparison written in 2024 nor a current model recommendation.'),
      'monthly calls × ((mean input tokens × input price per million) + (mean output tokens × output price per million)) / 1,000,000',
      'monthly calls × ((mean input tokens ÷ 1,000,000 × input price per 1M tokens) + (mean output tokens ÷ 1,000,000 × output price per 1M tokens))'))),
    'Fixed English title/description, cost formula wording and timeline notice'),
  tags = pg_temp.set_tag(pg_temp.set_tag(tags,
    'i18n.title:', content_evidence->'en'->>'title'),
    'i18n.excerpt:', content_evidence->'en'->>'excerpt')
WHERE id = 400
  AND content LIKE '%Claude 3.5 Sonnet은 그 뒤인 2024년 6월%';

-- =====================================================================================
-- (4) 제목 연도만 바뀐 글 — 본문과 맞는 제목으로 돌리고 기준 시점 안내를 넣는다
--   공통 원칙: 본문이 쓰인 시점(2024·2025)을 숨기지 않는다. 연도를 지우거나 본문 연도에 맞추고,
--   본문 첫머리에 "작성 기준 시점" 안내를 넣는다. 수치·전망의 사실 확인은 하지 않았다([확인]).
-- =====================================================================================

-- #263 「🚀 2026년 LLM 트렌드 리포트: GPT-5, Claude 4, Gemini …」
--   본문: "GPT-5 (예상)", "결론: 2024년, 성공적인 LLM 도입 전략", 설명은 "Claude 3.5". GPT-5 출시(2025-08) 전에 쓴 전망이다.
--   권장(편집 판단): 현행 정보로 다시 쓰기 전까지 noindex 목록(src/lib/noindexPosts.ts)에 추가. 아래는 최소한의 정직한 표기.
UPDATE posts SET
  title = 'LLM 트렌드 리포트(2024년 작성 기준): GPT-5 출시 전 전망과 Claude·Gemini 비교',
  excerpt = 'GPT-5 출시 전, 2024년 시점에서 GPT·Claude·Gemini 계열의 방향과 팀 단위 도입 로드맵을 정리한 전망 글입니다. 현재 모델 선택에는 공급사 최신 문서를 확인하세요.',
  content = replace(content,
    '# 🚀 2026년 LLM 트렌드 리포트: GPT-5, Claude 4, Gemini 심층 비교 및 6개월 개발 로드맵',
    E'# LLM 트렌드 리포트(2024년 작성 기준): GPT-5 출시 전 전망과 Claude·Gemini 비교\n\n> **작성 기준 시점**: 이 글은 GPT-5가 출시되기 전(2024년 기준)의 전망을 담고 있습니다. "GPT-5 (예상)" 등 예측 표현은 당시 시점의 추정이며 현재 사실과 다를 수 있습니다. 2026년 현재 모델 선택의 근거로 쓰지 마세요.'),
  tags = pg_temp.set_tag(pg_temp.set_tag(tags,
    'i18n.title:', 'LLM Trend Report (as of 2024): Pre-GPT-5 Outlook and Claude/Gemini Comparison'),
    'i18n.excerpt:', 'A 2024-era outlook on GPT, Claude and Gemini written before GPT-5 shipped, with a team adoption roadmap. Check current provider documentation before choosing a model.'),
  content_evidence = pg_temp.stamp(
    CASE WHEN content_evidence ? 'en' THEN jsonb_set(content_evidence, '{en,title}', to_jsonb('LLM Trend Report (as of 2024): Pre-GPT-5 Outlook and Claude/Gemini Comparison'::text)) ELSE content_evidence END,
    'Restored the as-of-2024 framing in the title (title had been changed to 2026 while the body is a pre-GPT-5 outlook)')
WHERE id = 263 AND title LIKE '%2026년 LLM 트렌드 리포트%';
-- [확인] EN 본문(content_evidence.en.content)의 H1·첫 문단에도 같은 안내를 넣을지 편집자가 결정.

-- #206 「2026 랜섬웨어 공격 동향과 기업 대응…」
--   본문: "## 2026년 랜섬웨어 현황" 아래 2024년 피해액, "## 2025년 주요 트렌드". 제목만 2026으로 바뀌었다.
UPDATE posts SET
  title = '랜섬웨어 공격 동향과 기업 대응(2025년 기준): 초기 침투 차단·백업·초동 대응',
  content = replace(content,
    '## 2026년 랜섬웨어 현황',
    E'> **작성 기준 시점**: 이 글의 현황·트렌드는 2025년 기준이며 피해액 등 수치는 2024년 집계입니다. 최신 동향은 각 보안 기관의 최근 보고서를 함께 확인하세요.\n\n## 랜섬웨어 현황(2025년 기준)'),
  tags = pg_temp.set_tag(tags, 'i18n.title:', 'Ransomware Attack Trends and Enterprise Response (as of 2025): Initial Access, Backups, First Hour'),
  content_evidence = pg_temp.stamp(
    CASE WHEN content_evidence ? 'en' THEN jsonb_set(content_evidence, '{en,title}', to_jsonb('Ransomware Attack Trends and Enterprise Response (as of 2025): Initial Access, Backups, First Hour'::text)) ELSE content_evidence END,
    'Title and section heading aligned with the 2025 body; added as-of note')
WHERE id = 206 AND content LIKE '%## 2026년 랜섬웨어 현황%';
-- [확인] "2024년 피해액 약 42억 달러"의 출처가 본문에 없다. 출처(예: 기관 보고서)를 달거나 문장을 삭제할 것.

-- #217 AWS vs Azure vs GCP — 제목 연도는 이미 지워졌지만 본문은 "2025년 기준 점유율 31/25/11%"(출처 없음)
UPDATE posts SET
  content = replace(replace(content,
    '## 2025년 클라우드 시장 현황',
    '## 클라우드 시장 현황(2025년 작성 기준)'),
    '2025년 기준 글로벌 클라우드 시장 점유율: AWS 31%, Azure 25%, GCP 11%.',
    '작성 당시(2025년) 업계 조사에서 흔히 인용되던 글로벌 점유율은 AWS 약 31%, Azure 약 25%, GCP 약 11%였습니다. 점유율은 조사 기관·분기마다 달라지므로 최신 수치는 원 조사 자료에서 확인하세요.'),
  excerpt = replace(excerpt, '2026 실무 비교', '실무 비교'),
  content_evidence = pg_temp.stamp(content_evidence, 'Marked market-share figures as 2025 and unsourced; removed 2026 label from the description')
WHERE id = 217 AND content LIKE '%2025년 기준 글로벌 클라우드 시장 점유율%';
-- [확인] 점유율 수치의 원 출처(Synergy Research 등)를 찾아 링크하거나 문장 자체를 삭제하는 편이 낫다.
-- [확인] EN 설명(i18n.excerpt:)의 "As of 2025, … 31%, 25%, and 11%"도 같은 문제.

-- #402 AI 거버넌스 체크리스트 — 제목은 연도 없이 바뀌었으나 본문 H1·도입부에 "[필독] 2024년 … 최신"이 남음
UPDATE posts SET
  content = replace(replace(content,
    '# [필독] 2024년 AI 거버넌스 체크리스트: 윤리, 프라이버시, 설명가능성(XAI) 완벽 가이드',
    E'# AI 거버넌스 체크리스트: 윤리·프라이버시·설명가능성(XAI) 개발 단계별 점검\n\n> **작성 기준 시점**: 이 체크리스트는 2024년 기준으로 작성됐습니다. 이후 EU AI Act 시행 일정, 국내 AI 기본법 등 규제가 바뀌었으므로 적용 전에 최신 법령과 가이드라인을 확인하세요.'),
    '2024년 최신 AI 거버넌스 체크리스트와', '(2024년 작성 기준) AI 거버넌스 체크리스트와'),
  content_evidence = pg_temp.stamp(content_evidence, 'Removed leftover 2024 H1 and "latest" claim; added as-of note')
WHERE id = 402 AND content LIKE '%# [필독] 2024년 AI 거버넌스 체크리스트%';
-- [확인] 규제 관련 문장(GDPR·EU AI Act·국내법)은 사람이 최신 상태를 확인해야 한다.

-- #265 AI 개발 보안 점검 체크리스트 — 제목은 바뀌었는데 본문 H1이 옛 「2024 AI 개발 필수 가이드 …」
UPDATE posts SET
  content = replace(content,
    '# 2024 AI 개발 필수 가이드: LLM 보안부터 Python 최적화까지, 실전 취약점 점검 체크리스트',
    '# AI 개발 보안 점검 체크리스트: Python 코드·CI 파이프라인·LLM 데이터 흐름'),
  content_evidence = pg_temp.stamp(content_evidence, 'Body H1 aligned with the current title')
WHERE id = 265 AND content LIKE '%# 2024 AI 개발 필수 가이드%';

-- #262, #267 (noindex 상태) — 슬러그는 2024년, 제목·H1은 2026년. 본문에 2026년 근거가 없다.
UPDATE posts SET
  title = replace(title, '2026년 LLM 오케스트레이션 가이드', 'LLM 오케스트레이션 가이드'),
  content = replace(content, '# 2026년 LLM 오케스트레이션 가이드', '# LLM 오케스트레이션 가이드'),
  tags = pg_temp.set_tag(tags, 'i18n.title:', 'LLM Orchestration Guide: LangChain vs LlamaIndex vs Semantic Kernel — Which Framework Is Right for You?'),
  content_evidence = pg_temp.stamp(
    CASE WHEN content_evidence ? 'en' THEN jsonb_set(content_evidence, '{en,title}', to_jsonb('LLM Orchestration Guide: LangChain vs LlamaIndex vs Semantic Kernel — Which Framework Is Right for You?'::text)) ELSE content_evidence END,
    'Removed unsupported 2026 label from title')
WHERE id = 262 AND title LIKE '2026년 LLM 오케스트레이션 가이드%';

UPDATE posts SET
  title = replace(title, '2026년 기업용 AI 아키텍처 설계 가이드', '기업용 AI 아키텍처 설계 가이드'),
  content = replace(content, '# 2026년 기업용 AI 아키텍처 설계 가이드', '# 기업용 AI 아키텍처 설계 가이드'),
  tags = pg_temp.set_tag(tags, 'i18n.title:', 'Enterprise AI Architecture Design Guide: AWS vs Azure vs GCP — A Comparison of MLOps Platforms'),
  content_evidence = pg_temp.stamp(
    CASE WHEN content_evidence ? 'en' THEN jsonb_set(content_evidence, '{en,title}', to_jsonb('Enterprise AI Architecture Design Guide: AWS vs Azure vs GCP — A Comparison of MLOps Platforms'::text)) ELSE content_evidence END,
    'Removed unsupported 2026 label from title')
WHERE id = 267 AND title LIKE '2026년 기업용 AI 아키텍처 설계 가이드%';

-- -------------------------------------------------------------------------------------
-- 사후 확인
-- -------------------------------------------------------------------------------------
SELECT id, title, content_evidence->>'contentUpdatedAt' AS content_updated_at, content_evidence->>'changeSummary' AS change_summary
FROM posts WHERE id IN (206, 217, 262, 263, 265, 267, 400, 402) ORDER BY id;

-- 여기서 결과를 보고 직접  COMMIT;  또는  ROLLBACK;  을 입력하세요.


-- =====================================================================================
-- (선택, 별도 승인) 트리거 수정안 — 번역(en)만 바뀐 경우 updated_at을 건드리지 않기
--   현재 set_post_content_updated_at()은 content_evidence가 조금이라도 바뀌면 updated_at=now()를 찍어,
--   2026-09-18·09-29 번역 배치 때 수백 편의 수정일이 한꺼번에 바뀌었다. 이 PR 코드는 더 이상 updated_at을
--   공개 수정일로 쓰지 않으므로 필수는 아니다. 적용하려면 현재 함수 정의를 먼저 확인할 것:
--     SELECT pg_get_functiondef('set_post_content_updated_at'::regproc);
-- 아래는 그 함수의 비교식에서 content_evidence 비교를 바꾸는 예시(현재 정의에 맞춰 조정 필요):
--   ... OR (OLD.content_evidence - 'en') IS DISTINCT FROM (NEW.content_evidence - 'en') ...
-- =====================================================================================
