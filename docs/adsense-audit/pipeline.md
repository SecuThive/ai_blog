# 발행 파이프라인: 승인 봇 크래시 루프와 승인 우회 (2026-10-03, 진단은 읽기만)

운영 프로세스(pm2, launchd, docker)는 재시작하거나 멈추거나 수정하지 않았다. 아래 배포 단계는 설명이며 실행되지 않았다.

## 1. 승인 봇이 계속 재시작되는 이유
- pm2 앱 `blog-approval`이 `python3 /Users/mainthive/project/SAFESUARE/backend/telegram_approval_bot.py`를 실행한다.
- 이 파일은 더 이상 없다. `SAFESUARE/backend`에는 `.telegram_approval_offset`(9월 25일, 488486291)과 `uploads/`만 남아 있다.
- 그래서 python이 `can't open file … No such file or directory`로 바로 끝나고, pm2 autorestart가 지연 없이 다시 띄운다. 재시작 횟수는 약 2,786만 회이고, 에러 로그가 약 80분마다 50MB씩 쌓였다가 로테이션된다. `restart_delay`, `exp_backoff_restart_delay`, `max_restarts` 설정이 없다.
- 2026-10-03 11:57 KST 재확인(`pm2 jlist`, 읽기만): status `stopped`, restart_time 27,946,472, 실행 경로는 여전히 SAFESUARE 쪽이다. 에러 로그는 11:57에도 쓰였다. 이 작업에서 pm2 명령(stop/restart/delete)은 실행하지 않았다.
- 현재 코드는 `~/project/NEWGEN/backend/telegram_approval_bot.py`에 있다(NEWGEN-CORE에 같은 사본이 있고, 9월 7일자). 이 디렉터리는 git 저장소가 아니라서 수정안은 별도 패치로 둔다: `pipeline/telegram_approval_bot.patch`.
- 예전 out 로그에는 `⚠ 처리 실패: 'supabase_url'`이 있다. blog_settings에 키가 없을 때 `blog["supabase_url"]`이 KeyError를 냈다. 지금 NEWGEN의 blog_settings.json에는 키가 있다(값은 출력하지 않았다).
- 네트워크 오류 때 콜백 처리 루프 밖의 `answerCallbackQuery`에서 예외가 나면 프로세스 전체가 죽는다.

## 2. 승인 우회 경로
| 경로 | 문제 |
|---|---|
| `engineer_guides.status` 기본값 `'published'` | status 없이 upsert하는 `scripts/insert-guides-batch-*.mjs`가 곧바로 공개된다. |
| `scripts/insert-*.mjs`, `add-guides-*`, `fix-series.mjs` | service-role 키로 `status: 'published'`를 직접 넣었다. `insert-episodes`, `insert-new-episodes`는 `published_at`을 과거 날짜로 미리 넣었다. |
| 봇 `publish()` | `status=published`, `published_at=now()`만 쓰고 `reviewed_at/reviewed_by`를 남기지 않는다. 재발행이면 원래 공개일을 덮어쓴다. |
| 봇 `apply_refresh()` | 수정 적용 때 `published_at=now()`로 바꾼다("lastmod 갱신"). 공개일을 바꾸는 것은 날짜 조작이다. |
| DB | 승인 기록 없이 published로 바뀌는 것을 막는 장치가 없다. engineer_guides에는 reviewed_at/reviewed_by 컬럼도 없다. |
| `/api/posts` | 승인 확인과 reviewed_by를 요구하지만, reviewed_by는 호출자가 직접 적는 값이다. |

공개 편집 원칙 페이지는 사람이 검토한 뒤 발행한다고 밝히므로, 위 경로는 그 설명과 맞지 않는다.

## 3. 이 PR의 수정
- **DB 게이트** (`sql/2026-10-03-phase2-triggers.sql`, 미적용, COMMIT 없음):
  - `enforce_review_before_publish()` 트리거를 posts와 engineer_guides에 건다(BEFORE INSERT OR UPDATE OF status). published로 넣거나 바꾸는데 reviewed_at/reviewed_by가 없으면 거부한다.
  - 이미 published인 행의 수정은 통과한다.
  - engineer_guides에 reviewed_at/reviewed_by를 추가하고 status 기본값을 'draft'로 바꾼다.
- **스크립트**: 위 스크립트의 `status: 'published'`를 `'draft'`로 바꿨다. 미리 넣던 `published_at`은 null로 바꿨다. k8s-runbooks의 기존 행 갱신 경로는 status를 건드리지 않는다.
- **테스트** (`tests/publishGate.test.ts`):
  - scripts/에 `status: 'published'` 쓰기 페이로드가 없는지 확인한다. CSV 보고서용 `score-content-quality.mjs`는 제외한다.
  - 미리 정한 published_at을 복사하지 않는지 확인한다.
  - 트리거 SQL에 COMMIT이 없는지 확인한다.
- **봇 패치** (`pipeline/telegram_approval_bot.patch`, NEWGEN/backend에 적용):
  - `publish(post_id, blog, approver)`: 이미 발행된 글은 거부한다. `reviewed_at=now`, `reviewed_by=telegram:<username|id>`를 기록한다. 기존 published_at은 유지한다. PATCH에 `status=neq.published` 조건을 건다.
  - `apply_refresh`: published_at을 바꾸지 않는다. posts는 content_evidence에 `contentUpdatedAt`, `changeSummary`, `refreshApprovedBy`를 병합한다. guides는 updated_at만 바꾼다.
  - `supabase_url`이 없으면 경로를 포함한 명확한 오류를 낸다.
  - 토큰이나 chat_id가 없으면 시작하지 않는다(chat_id가 비면 누구든 승인할 수 있었다). 60초 대기 후 종료 코드 2로 끝난다.
  - `answerCallbackQuery` 실패가 프로세스를 죽이지 않게 감쌌다.
  - `py_compile`과 `patch --dry-run`으로만 확인했다. 실제 텔레그램이나 DB로는 실행하지 않았다.

## 4. 배포 단계 (설명만, 실행 안 함)
1. DB 백업: `~/project/nodelog-db/backups`에 새 덤프를 만든다.
2. `psql -1 -f docs/adsense-audit/sql/2026-10-03-phase2-triggers.sql`을 실행한다. 파일에 COMMIT이 없으므로, 대화형으로 열어 확인 쿼리를 본 뒤 직접 `COMMIT;`한다. 트리거 SQL은 콘텐츠 SQL보다 먼저 적용한다. 콘텐츠 SQL은 published 행의 본문만 바꾸므로 게이트와 충돌하지 않는다.
3. 봇 패치 적용: `cd ~/project/NEWGEN && cp backend/telegram_approval_bot.py backend/telegram_approval_bot.py.bak && patch -p1 < <repo>/docs/adsense-audit/pipeline/telegram_approval_bot.patch`
4. offset 파일: NEWGEN의 값(488486280)이 SAFESUARE의 값(488486291)보다 오래됐다. 텔레그램은 미확인 업데이트를 최대 24시간만 보관하므로 실제로 다시 처리될 위험은 낮다. 그래도 같게 맞추려면 SAFESUARE 파일을 NEWGEN/backend로 복사한다.
5. pm2 정의를 고친다. 기존 앱을 삭제하고 새 경로로 다시 등록한다.
   ```js
   // ecosystem.blog-approval.config.js
   module.exports = { apps: [{
     name: 'blog-approval',
     script: '/Users/mainthive/project/NEWGEN/backend/telegram_approval_bot.py',
     interpreter: '/opt/homebrew/bin/python3',
     cwd: '/Users/mainthive/project/NEWGEN/backend',
     autorestart: true,
     exp_backoff_restart_delay: 2000,   // 연속 실패 시 지연을 점점 늘린다(최대 15초)
     max_restarts: 20,
     min_uptime: '30s',
   }] };
   ```
   `pm2 delete blog-approval && pm2 start ecosystem.blog-approval.config.js && pm2 save`. 그다음 `pm2 logs blog-approval --lines 20`에서 "발행 승인 봇 시작"을 확인한다.
6. 로그 정리: `pm2 flush blog-approval`(선택).
7. 확인: 테스트 draft 1건을 승인 버튼으로 발행한다. reviewed_at, reviewed_by, published_at을 확인한다. service-role로 `status=published` PATCH를 시도하면 거부되는지 확인한다.

## 5. 시험 결과 (2026-10-03, 임시 컨테이너)
2026-10-03 04:17 덤프를 임시 컨테이너(pgvector:pg17)에 복원해 한 트랜잭션에서 시험하고 ROLLBACK했다. 컨테이너는 시험 후 삭제했다.
- 트리거 SQL → 콘텐츠 SQL 순서로 적용: 콘텐츠 UPDATE 10건 각 1행(5편 × KO/EN). 같은 파일 재실행: 10건 모두 0행.
- EN만 수정(`content_evidence.en.title`, `i18n.title:` 태그): updated_at 그대로. KO 본문 수정: updated_at 갱신.
- draft를 승인 기록 없이 published로 INSERT/UPDATE: `publish blocked` 오류. reviewed_at/reviewed_by를 넣으면 통과. 이미 published인 행 수정은 통과.
- status 없이 engineer_guides INSERT: 기본값 `draft`.
- `patch -p1 --dry-run`(NEWGEN): 적용 가능.

