# Phase 2 최종 확인 (2026-10-03, 로컬 빌드)

브랜치 빌드를 임시 DB(04:17 덤프 복원 + phase 2 SQL 적용, 운영 DB 아님)에 연결해 `next start`로 확인했다.

| 항목 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm test` | 11개 통과, 실패 0 |
| `npm run build` | 성공 |
| eslint | 이번 PR에서 바뀐 파일은 오류 없음. 기존 파일 3개(bookmarks/page.tsx, Footer.tsx, MermaidDiagram.tsx)에 이전부터 있던 오류가 있다 |
| 주요 URL 21개 | 기대 상태 코드와 일치(404 경로 포함) |
| 광고 로더 범위 24개 경로 | 홈·색인 글(KO/EN)·가이드에만 있고, 검색·태그·카테고리·시리즈·아카이브·문의·구독·해지·고지·북마크·404에는 없다. noindex 글 표본에도 없다 |
| 고지 링크 | 홈 푸터에 /privacy, /terms, /policy, /about, /contact. EN 푸터는 /en/privacy |
| sitemap | 568개 URL(KO 글 387, 가이드 142). noindex 글 0개. 표본 41개 모두 200 |
| 내부 링크 | 주요 6개 화면에서 찾은 777개 중 700개 확인, 모두 200(`&amp;`가 섞인 1건은 검사 스크립트의 디코딩 문제였고 실제 URL은 200) |
| CSP 헤더 | AdSense·Cloudflare 도메인 포함 확인 |
| 수정 글 렌더링 | #813, #814, #815 KO/EN 200, 수정 문구 반영 |

## Publish gate regression test (2026-10-03 12:45 KST)

- 대상: `sql/2026-10-03-phase2-triggers.sql`의 `enforce_review_before_publish`(posts, engineer_guides).
- 환경: 최신 백업 `nodelog-20261003-0417.dump`를 임시 컨테이너(`pgvector/pgvector:pg17`, 127.0.0.1)에 복원했다. 시험이 끝난 뒤 컨테이너를 삭제했다. 운영 DB는 건드리지 않았다.
- 재사용 스크립트: [`sql/tests/publish-gate-regression.sql`](sql/tests/publish-gate-regression.sql). 트리거 파일을 `\ir`로 적용하고 모든 경우를 한 트랜잭션에서 실행한 뒤 ROLLBACK한다. 실행: `cd docs/adsense-audit/sql/tests && psql -X -d <임시 DB> -f publish-gate-regression.sql`.
- 시험 대상 행: 발행 상태이고 `reviewed_at`/`reviewed_by`가 NULL인 글 1편과 발행 가이드 1편, 초안 글 1편. 복원본의 발행 글 540편은 모두 검토 기록이 없다.

**첫 실행에서 실패한 경우와 수정.** 이미 발행된 행에 upsert(`INSERT … ON CONFLICT (slug) DO UPDATE`, supabase-js `.upsert`)를 하면서 `status='published'`를 다시 보내면 `publish blocked`로 막혔다. BEFORE INSERT 트리거가 충돌 판정보다 먼저 실행되어, 새 행을 발행하는 것으로 보았기 때문이다. 수정: INSERT일 때는 같은 id나 slug의 발행 행이 이미 있으면 통과시킨다. 이어지는 ON CONFLICT UPDATE는 UPDATE 분기(`OLD.status='published'`라 통과)를 탄다. 함수는 여전히 예외를 던지기만 하고 status나 published_at에 값을 넣지 않는다.

수정 후 결과(19/19 통과):

| # | 경우 | 기대 | 결과 |
|---|---|---|---|
| a1 | 발행 글(검토 NULL)의 KO 제목·본문·요약 수정 | 성공, status와 published_at 유지 | PASS |
| a2 | 같은 글의 EN만 수정(`content_evidence.en.title`) | 성공, status·published_at·updated_at 유지 | PASS |
| a3 | 같은 글을 `status='published'`를 다시 넣어 전체 저장(API PUT, 봇 방식) | 성공 | PASS |
| a4 | 발행 가이드의 제목·요약·본문 수정, status를 다시 넣어 저장 | 성공, published 유지 | PASS |
| b1 | 발행 글·가이드에 no-op(`title=title`)과 `views+1` | 성공 | PASS |
| b2 | 발행 글·가이드에 upsert(status=published) | 성공, published 유지 | 수정 전 FAIL, 수정 후 PASS |
| c1 | 초안 글 → published, 검토 기록 없음 | 차단(check_violation) | PASS |
| c2 | 초안 글 → published, `reviewed_by`가 공백 | 차단 | PASS |
| c3 | 글을 처음부터 published로 INSERT, 검토 기록 없음 | 차단 | PASS |
| c4 | 초안 글 → published, `reviewed_at`·`reviewed_by` 있음 | 통과 | PASS |
| c5 | status 없이 가이드 INSERT | draft로 들어감 | PASS |
| c6 | 가이드 초안 → published, 검토 기록 없음 | 차단 | PASS |
| c7 | 가이드를 처음부터 published로 INSERT, 검토 기록 없음 | 차단 | PASS |
| c8 | 가이드 초안 → published, 검토 기록 있음 | 통과 | PASS |
| d1 | 기본값을 draft로 바꾼 뒤 기존 가이드 142편의 status | 변화 없음 | PASS(0건 변경) |
| d2 | `engineer_guides.status` 기본값 | `'draft'` | PASS |
| e1 | 글 전체에 `views=views`, 발행 글 전체에 `content_evidence=content_evidence` 실행 후 스냅숏과 비교(c4 행 제외) | status·published_at 변화 없음 | PASS(790행) |
| e2 | 가이드 전체에 `views=views` 실행 후 비교 | status 변화 없음 | PASS(142행) |
| e3 | 두 트리거 함수 소스에 `new.status`나 `new.published_at` 대입이 있는지 | 없음 | PASS |

가이드에는 EN 컬럼이 없어서(EN 문구는 코드에 있음) a2는 글에서만 시험했다. 가이드에는 published_at 컬럼도 없어서, 가이드의 공개 여부는 status 하나로 판단했다.

**같은 복원본에서 다시 확인한 것.** 한 트랜잭션에서 트리거 파일 2회 → 콘텐츠 1차 2회 → batch2 2회를 실행하고 ROLLBACK했다. 트리거 파일은 두 번 모두 오류 없이 적용됐다. 1차는 첫 실행에 `UPDATE 1` 10건, 두 번째에 `UPDATE 0` 10건이었다. batch2는 첫 실행 `UPDATE 1` 6건, 두 번째 `UPDATE 0` 6건이었다. 끝난 뒤 글 상태는 draft 251, published 540으로 복원본과 같았다. 콘텐츠 SQL은 검토 기록이 없는 발행 글을 고치는데, 게이트에 막히지 않았다.

`tests/publishGate.test.ts`에 정적 검사를 추가했다. 트리거 함수에 status나 published_at 대입이 없는지, upsert 분기가 있는지, 회귀 스크립트가 있고 ROLLBACK으로 끝나는지 본다(`npm test` 12/12).
