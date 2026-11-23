# 깨진 slug 16건 복구 — 2026-10-23

## 문제

`posts.slug` 16건에서 한글이 UTF-8 hex 문자열로 치환돼 있었다(예: `ai-ec9790ec9db4eca084ed8ab8-...` = `ai-에이전트-...`). 모두 시리즈 에피소드(2~3편 위주)이며 status는 `published`다. 디코딩한 한글 slug와 충돌하는 기존 글은 없다.

## 변경

- `src/lib/postRedirects.ts`: 구 slug 16개 → 한글 slug 308 매핑 추가. 기존 단일 홉 규칙(tests/postRedirects.test.ts)을 통과한다.
- `scripts/fix-garbled-slugs-2026-10-23.mjs`: DB의 `posts.slug`를 갱신한다. 기본은 dry-run, `--apply`에서만 쓰며 `scripts/garbled-slugs-backup-<날짜>.json`에 이전 값을 남긴다. 행마다 `id`와 기존 slug를 함께 조건으로 걸어 다른 행을 건드리지 않는다.

## 반영 순서 (순서가 중요)

`blog/[slug]`는 DB 조회 전에 `POST_REDIRECTS`를 먼저 확인한다. 그래서 순서가 어긋나면 해당 URL이 404가 된다.

1. `postRedirects.ts` 변경을 운영 빌드에 배포한다. 이 시점에는 DB에 새 slug가 아직 없어서 구 URL이 새 URL로 308 이동해도 도착지가 404다. 바로 다음 단계를 이어서 한다.
2. `node scripts/fix-garbled-slugs-2026-10-23.mjs --apply`로 DB를 갱신한다.
3. 갱신 후 `/api/revalidate`(slug별 POST, `x-api-key` 필요)나 서버 재시작으로 글 캐시와 sitemap을 갱신한다.
4. 구 URL 1~2개가 308로 새 URL에 이동하고 새 URL이 200인지, sitemap에 새 slug가 들어갔는지 확인한다.

## 롤백

백업 JSON의 `from` 값으로 `posts.slug`를 되돌리고, 매핑을 `postRedirects.ts`에서 지운 뒤 다시 배포한다. 매핑이 남아 있으면 원문 접근이 막힌다.
