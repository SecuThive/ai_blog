# 리프레시 반자동 루프

트래픽 성장의 병목은 신규 발행이 아니라 **순위 5~20위(1페이지 직전) 기존 글을 올리는 것**.
이 루프가 그걸 자동 분석·초안 생성까지 하고, **발행만 사람이** 한다(E-E-A-T '사람 검토' 유지).

```
(cron 매주 월 09:00)
  gsc_fetch.py       GSC API → GSC CSV/ 갱신   (미설정 시 기존 CSV 유지, 비차단)
  refresh_finder.py  striking-distance 글을 기회 크기순 분석
  refresh_pipeline.py 상위 5편의 현재 글(Supabase) + RAG 근거 + 로컬 LLM 으로
                     개선안(제목안·본문보강·메타) 생성 → refresh_proposals/<날짜>/
  [사람]             INDEX.md 보고 검토·수정·발행
```

## 수동 실행

```bash
python3 scripts/refresh_finder.py            # 우선순위 목록만
python3 scripts/refresh_pipeline.py -n 5     # 개선안 초안 생성
python3 scripts/refresh_pipeline.py --no-llm # LLM 없이 체크리스트만(빠름)
bash    scripts/run_refresh.sh               # 루프 전체(cron 이 하는 것)
```

## GSC 자동 수집 설정 (1회, 사람이) — 안 하면 수동 CSV 로 동작

1. Google Cloud 콘솔에서 **Search Console API** 사용 설정
2. **서비스 계정** 생성 → JSON 키 다운로드 (repo 밖 또는 gitignore 위치에 저장)
3. Search Console → 속성 → 설정 → 사용자·권한 → **서비스 계정 이메일 추가**(제한 권한 가능)
4. `.env.local` 에:
   ```
   GSC_SERVICE_ACCOUNT_JSON=/절대경로/service-account.json
   GSC_SITE_URL=https://www.thivelab.com
   ```
5. `pip install google-auth requests` (또는 run_refresh.sh 에 `GSC_PYTHON=<google-auth 있는 venv>` 지정)

설정 전에도 루프는 돈다 — `GSC CSV/` 의 수동 내보내기를 분석한다.

## 발행 (사람이 승인해 반영) — refresh_apply.py

검토가 끝나면 이 도구로 라이브 글에 반영한다. **slug(URL)는 절대 안 바꾼다** — title·메타·본문만
갱신해 순위를 유지한 채 개선. 무인 자동발행이 아니라 사람이 실행한다.

```bash
# 1) 제목·메타만 (가장 빠른 회수 — INDEX 의 [제목·메타] 글)
python3 scripts/refresh_apply.py <url> --title "새 제목" [--excerpt "메타"] [--dry-run]

# 2) 본문까지 리라이트 → 스테이징(발행 안 함), 사람이 최종 검토
python3 scripts/refresh_apply.py <url> --rewrite
#    → refresh_proposals/<날짜>/applied/<slug>.final.md 생성

# 3) 검토·수정 끝난 최종본 발행
python3 scripts/refresh_apply.py --publish <final.md> [--dry-run]
```

- `--dry-run` 으로 무엇이 바뀔지 먼저 확인. 발행 이력은 `refresh_proposals/published.log`.
- 발행은 Supabase 라이브 글을 바꾼다(=사이트 반영). 되돌리려면 이전 값으로 다시 PATCH.

## 텔레그램 승인 (신규글·리프레시 공통)

발행/적용 전에 텔레그램으로 물어보고, 폰에서 버튼으로 승인한다. 승인 봇:
`SAFESUARE/backend/telegram_approval_bot.py` (pm2 `blog-approval`, 롱러닝).

- **신규글**: ai_company_engine 이 draft 저장 + `pub:<id>`/`del:<id>` 버튼 전송 → ✅ 발행 / ❌ 폐기.
- **리프레시**: `refresh_telegram.py` 가 후보를 구체 변경으로 만들어 공유 큐
  (`SAFESUARE/backend/refresh_approvals.json`)에 쌓고 `rf:<id>`/`rfx:<id>` 버튼 전송 →
  ✅ 적용(제목 PATCH 또는 본문 교체 + revalidate) / ❌ 건너뛰기. slug(URL) 불변.

```bash
python3 scripts/refresh_telegram.py -n 5              # 제목류+본문 승인 요청
python3 scripts/refresh_telegram.py -n 5 --no-content # 제목·메타만(저위험·빠름)
```

주간 루프(run_refresh.sh)가 이걸 실행하므로, 매주 폰으로 승인 요청이 온다.

## 운영 리듬

- 매주 자동 생성된 `refresh_proposals/<날짜>/INDEX.md` 를 열어 상위부터 검토.
- `[제목·메타]` 표시 = 순위는 되는데 CTR 낮음 → `--title` 로 제목만 고쳐도 즉시 회수(최우선).
- `[콘텐츠 보강]` = `--rewrite` → 스테이징 검토 → `--publish`.
- **새 글 대량 생성은 지양** — 병목 아님 + scaled-content 리스크(감사에서 196편 프루닝).

## 조정

- 생성 LLM: `REFRESH_LLM_MODEL`(기본 qwen2.5:14b) · RAG 경로: `SITE_KNOWLEDGE_QUERY`
- 개수: `refresh_pipeline.py -n N` · 노출 하한: `--min-impr`
- pm2 앱 `blog-refresh`(cron 월 09:00, `--no-autorestart`) — 실행 후 `stopped` 가 정상.
