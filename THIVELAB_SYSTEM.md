# thivelab.com 운영 시스템 지도 (Single Source of Truth)

혼란 방지용 확정 문서. "무엇이 라이브고, 무엇이 생성하고, 어디서 도는가."

## 1. 라이브 사이트 = `project/ai-blog`

- **프론트**: Next.js @ Vercel (repo: `SecuThive/ai_blog`, 배포: ai-blog-mocha.vercel.app → thivelab.com)
- **데이터**: Supabase `isfzeksbzxtuqymfocqv` — 테이블 `posts`(/blog/), `engineer_guides`(/engineer/)
- **GSC 속성**: `sc-domain:thivelab.com` (도메인 유형)

## 2. 두뇌 = 신규글 생성 엔진 (SAFESUARE 백엔드 안)

- 위치: `project/SAFESUARE/backend/utils/ai_company_engine.py` (ai_company 기능의 일부)
- 흐름: 스케줄러 → CEO 기획 → **content_writer(Claude 생성)** → content_reviewer(검토) → `_publish_to_blog`
- 발행: 블로그 API `POST /api/posts` (blog_settings.json 이 라이브를 가리킴)
- **주 3편 한도**: `_MAX_POSTS_PER_WEEK=3` + `_MAX_POSTS_PER_DAY=1`
- **승인**: `require_approval=true` → draft 저장 + 텔레그램 승인 요청
- **생성 참고자료(2026-07-23)**: content_writer 실행 직전(`run_task`) `_build_generation_context(topic)`가 ①발행글 색인(`blog_query.py`)에서 유사/관련 기존글 검색 → 프롬프트에 "이미 있는 유사 글(중복 예방·카니벌라이제이션 방지) + 내부링크 후보" 주입, ②운영지식(`query.py`)에서 편집 원칙 주입. subprocess 호출(`RAG_PYTHON`/`RAG_BLOG_QUERY`/`RAG_SITE_QUERY` env), 실패 시 빈 문자열로 생성 계속. content_writer 프롬프트에 "겹치면 각도 다르게·관련글 내부링크·편집원칙 반영" 규칙 추가.

⚠️ 이 엔진은 SAFESUARE 백엔드 프로세스(pm2 `safesquare-backend`)의 lifespan 스케줄러로 돈다.
= 백엔드가 떠 있어야 신규글이 생성된다. (독립 서비스 분리는 큰 재작성이라 보류 — 현재 헬스
알림으로 감시)

## 3. 리프레시 루프 = `project/ai-blog/scripts`

매주 월 09:00 pm2 `blog-refresh`(`run_refresh.sh`):
```
gsc_fetch.py       GSC API(서비스계정) → GSC CSV/ 최신화
refresh_finder.py  순위 5~20위(1p 직전) 글을 기회순 분석
refresh_telegram.py 개선안(제목/본문, 한국어) 생성 → 승인 큐 + 텔레그램 요청
```
`refresh_apply.py` = 수동 CLI 적용(대안). 사이트 관리 RAG(`~/claude-web-workspace/site-knowledge/`)가 생성 근거.

**내부링크·카니벌라이제이션 승인** `scripts/internal_links_telegram.py`: 발행글 색인(`site-knowledge/blog/data/blog_docs.json`)의 관련·미링크·클릭 근거로, 글 끝에 `## 관련 글` 마크다운 섹션(마커로 멱등)을 붙이는 **콘텐츠 변경**을 만들어 같은 승인 봇(rf/rfx)에 태운다. slug 불변, title/메타 불변, content 만. 유사도 ≥0.82(거의 같은 글)는 📌 로 대표글 신호 모음. **파괴적 병합/삭제는 안 함**(교차링크만). `--dry-run` 미리보기 / `-n` 건수 / `--dups-only` 카니벌만.

## 4. 텔레그램 승인 봇 = pm2 `blog-approval`

`project/SAFESUARE/backend/telegram_approval_bot.py` (롱러닝 폴러). 처리:
- 신규글: `pub:<id>`(발행) / `del:<id>`(폐기)
- 리프레시: `rf:<id>`(적용) / `rfx:<id>`(건너뛰기) — 큐 `backend/refresh_approvals.json`
- 발행/적용 시 Supabase 갱신 + `/api/revalidate`. **slug(URL) 불변.**

## 5. 인프라 (pm2)

| 앱 | 역할 | 상태 |
|---|---|---|
| `safesquare-backend` | 신규글 엔진 포함 백엔드 | online |
| `blog-approval` | 텔레그램 승인 봇 | online |
| `blog-refresh` | 주간 리프레시(월 09:00) | cron·stopped 정상 |
| `keep-awake` | caffeinate(맥 잠자기 방지) | online |
| `blog-health` | 3시간마다 이상 시 텔레그램 알림 | cron·stopped 정상 |

- ⚠️ **재부팅 자동복구**: pm2 startup 미설치 → `sudo … pm2 startup launchd …` 1회 실행 필요(TODO).
- Ollama(11434) = 리프레시 생성 의존. Claude = 신규글 생성(`llm.claude_code`).

## 6. 폐기됨 (혼동 금지)

- `SAFESUARE/myProject/thive-lab/` (쿠팡 수익형) = **죽음**. Supabase `oriwdqftmdspqqjdngmw` 연결 실패,
  blog 잡 큐 2026-04 이후 미실행. RAG 연결 제거·DEPRECATED 표시됨. **되살리지 말 것.**

## 7. 운영 치트시트

- 로그: `pm2 logs blog-approval` / `blog-refresh` 로그 = `ai-blog/refresh_proposals/run.log`
- 지금 리프레시 돌리기: `bash ai-blog/scripts/run_refresh.sh` 또는 `pm2 restart blog-refresh`
- 주기 바꾸기: `ai_company_engine.py`의 `_MAX_POSTS_PER_WEEK`
- 승인 끄고 자동발행: `blog_settings.json`의 `require_approval=false` (권장 안 함)
- 문제 시: `pm2 list` → `pm2 restart <이름>`
