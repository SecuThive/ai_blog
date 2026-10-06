# DB 변경 기록 (Nodelog posts / engineer_guides)

## 이 PR 작업 (2026-10-03)
- 운영 DB에 쓰기 없음. 읽기 조회만 했다.
- 수정안: `sql/2026-10-03-phase1-content-fixes.sql`(미적용). 2026-10-03 04:17 백업의 posts 테이블을 임시 컨테이너에 복원해 시험 적용했다(8건 각 1행). 시험 후 컨테이너는 삭제했다.

- Phase 2 (미적용, COMMIT 없음):
  - `sql/2026-10-03-phase2-triggers.sql`: EN 번역만 바뀐 수정은 updated_at을 올리지 않게 `set_post_content_updated_at()` 교체, 승인 게이트 트리거(posts, engineer_guides), engineer_guides reviewed_at/reviewed_by 추가, status 기본값 'draft'.
  - `sql/2026-10-03-phase2-content-quality.sql`: posts #640, #656, #805, #816, #817의 KO 본문과 EN 본문(content_evidence.en.content). KO 변경에는 contentUpdatedAt과 changeSummary를 남긴다. 원문 md5 조건이 있어 재실행하면 0행이다. 변경 내용은 `content-diffs/`에 있다.
  - 시험: 04:17 덤프를 임시 컨테이너에 복원, 10건 각 1행, 재실행 0행, ROLLBACK. 자세한 결과는 `pipeline.md` 5절.
  - `sql/2026-10-03-phase2-content-quality-batch2.sql`: 홈 최신 글 #813, #814, #815의 KO·EN 본문. 같은 방식(원문 md5 조건, KO 변경에만 contentUpdatedAt·changeSummary). 시험: 트리거 SQL → 1차 콘텐츠 SQL → batch2 순서로 적용해 6건 각 1행, 재실행 6건 0행, 결과 md5가 수정본과 일치, ROLLBACK. 변경 내용은 `content-diffs/813|814|815.*.diff`.
    - #815 Vault vs ASM vs SOPS: ASM 복제본도 시크릿 1개로 과금되므로 시나리오 ③ 금액 정정($450+ → $800+, 합계 $738 → $1,090+). 근거 없던 "경험적 손익분기 100~150개"를 손익분기 식과 계산 예시로 교체하고, 운영 시간이 가정이라고 밝힘. ESO `external-secrets.io/v1beta1` → `v1`(v0.17.0부터 v1beta1 미제공). `age-keygen` 전 `mkdir -p`, macOS 기본 키 경로, `no matching creation rules`는 암호화 때 오류라는 점, 수신자 제거 시 `updatekeys` → `rotate --in-place`, ASM 복구 대기기간(기본 30일, 7~30일) 정정.
    - #814 ServiceAccount 토큰 401: `--service-account-extend-token-expiration`(기본 true)로 자동 주입 토큰 만료가 최대 1년까지 늘어난다는 점 반영, 버전표를 기능 게이트 단계(1.21 beta/1.22 GA, 1.24 beta/1.26 GA, 1.28 GA, 1.29 beta/1.30 GA)로 정정, 레거시 토큰 정리는 자동 생성 Secret만 대상이라는 점 정정, JWT 디코딩 명령을 base64url·패딩 보정으로 수정(기존 명령은 정상 토큰도 `invalid input`), "PSS restricted가 automount를 끈다"는 오기재 삭제, 바운드 토큰은 Pod 삭제로 무효화된다는 점 추가.
    - #813 pg_hba: PostgreSQL 14부터 바뀐 오류 형식(`connection to server at ... failed`, `no encryption`/`SSL encryption`) 추가, `include`·정규식 매칭 지원 버전 15 → 16 정정.

## 다른 세션이 이미 운영 DB에 적용한 변경 (2026-10-02, 이 PR과 무관)
`~/project/ai-blog`(메인 작업 트리)의 Codex/ChatGPT 세션이 실행한 스크립트다. 파일 수정 시각이 DB 타임스탬프와 일치한다.
사용자의 이번 단계 지시가 아니었고, 그 작업 트리의 코드 변경(16개 파일)은 커밋되지 않은 상태다.

| 시각(KST) | 대상 | 내용 | 스크립트 |
|---|---|---|---|
| 2026-10-02 13:57:21 | posts #400 | KO 제목·본문을 「2024년 출시 LLM 비교 자료」 회고로 재작성, content_evidence에 en·verifiedAt·reviewScope·changeSummary·officialSources 추가 | `scripts/fix-llm-2024-retrospective.mjs` |
| 2026-10-02 14:05 | posts #667, #805 | Endpoints 글 역할 구분 문구 | `scripts/clarify-endpoints-article-roles.mjs` |
| 2026-10-02 14:05:10 | engineer_guides #167 | 같은 작업 | 같은 스크립트 |

변경 전 원본: `~/project/nodelog-db/backups/nodelog-20261002-0417.dump`.
#400 원래 제목: 「2024년 LLM 모델 선택 가이드: GPT-4o부터 Claude 3.5까지, 산업별 최적 AI 엔진 고르는 법」.

## 참고: updated_at 일괄 갱신
- 발행 글 540편 모두 `updated_at`이 발행일보다 하루 넘게 늦다. 364편은 2026-09-18 01~03시, 131편은 2026-09-29 02~03시(KST)에 찍혔다. 번역(`content_evidence.en`) 일괄 추가 때 트리거 `posts_set_content_updated_at`이 실행된 결과다.
- `engineer_guides`는 트리거가 없다. 26편이 2026-09-29 05:00에 제목이 바뀌었다(`refresh_apply.py`).

## 시간 민감 콘텐츠 갱신 (2026-10-04, 운영 DB 적용)
- posts #217, #206, #224, #419, #284, #212, #798, #743, #417 KO·EN 본문 갱신(각 1행). 백업 `~/project/nodelog-db/backups/stale-refresh-20261004-0437.dump`, 행별 복원 SQL은 같은 폴더의 `stale-refresh-20261004-0437-restore/`. 자세한 내용은 `stale-refresh.md`, SQL은 `sql/stale-refresh/`.
- (마일스톤 2, 04:55 KST) posts #469, #584, #402, #263, #395, #99, #720, #461, #265 KO·EN 갱신, #217·#206 출처 줄 보강(각 1행). 백업 `stale-refresh-20261004-044945.dump`, 복원 SQL `stale-refresh-20261004-044945-restore/`.
- (마일스톤 3, 05:07 KST) posts #704, #747, #326, #302, #604, #665, #422, #74, #812 KO·EN 갱신, #206·#743 검수 표현 반영(각 1행). #245·#17은 변경 없음. 백업 `stale-refresh-20261004-045921.dump`, 복원 SQL `stale-refresh-20261004-045921-restore/`.
- (배치 4, 05:14 KST, 사용자 승인) posts #734, #665 KO·EN 갱신(과기정통부·국정원 2026-04-20 보도자료 원문 + CSAP 고시). 백업 `stale-refresh-20261004-051233.dump`, 복원 SQL `stale-refresh-20261004-051233-restore/`.
- (배치 5, 05:17 KST, 검수 반영) posts #734, #665 KO·EN에서 출처 없는 기간·비용 추정치 삭제. 행 단위 복원 SQL `stale-refresh-20261004-051233-restore/{734v5,665v5}.restore.sql`(기준 덤프 `stale-refresh-20261004-051233.dump`).

## 예제 코드 수정: LLM 캐시 키 hash() → sha256 (2026-10-06 10:34 KST, 운영 DB 적용, 편집자 요청)
- posts #419 KO 본문과 EN 본문(content_evidence.en.content)의 Redis 캐시 키 예제에서 `hash(user_query)`를 `hashlib.sha256(user_query.encode()).hexdigest()`로 바꾸고 `import hashlib`와 설명 주석 한 줄(내장 hash()는 PYTHONHASHSEED로 프로세스마다 값이 달라 워커 간 캐시가 공유되지 않음)을 추가했다. 1행 변경, updated_at은 트리거가 갱신, published_at·status·slug 변경 없음. contentUpdatedAt·changeSummary는 건드리지 않았다.
- SQL `sql/content-fixes/419-llm-cache-hash.sql`(hash(user_query)가 남아 있을 때만 바꾸므로 재실행하면 0행). ROLLBACK 시험: 1행, 재실행 0행.
- 백업 `~/project/nodelog-db/backups/fix-llm-hash-20261006-103420.dump`, 행 복원 SQL `fix-llm-hash-20261006-103420-restore/419.restore.sql`(ROLLBACK으로 원문 md5 복원 확인).
- 캐시 무효화 태그 `post-fa62c04e0e44ba3a`(sha1(slug) 앞 16자, Vercel invalidate_by_tags).

## 상위 4편 보강 + hash() 수정 (2026-10-06 10:45 KST, 운영 DB 적용, 편집자 요청)
X/SNS 첫 답글에 걸 글 4편의 KO·EN 본문 보강. 각 1행, updated_at은 트리거가 갱신했고 published_at·status·slug·title은 그대로다. 4편은 content_evidence에 contentUpdatedAt(2026-10-06)·changeSummary·officialSources를 남겼다(verifiedAt은 넣지 않음).
- 선정: ECONNREFUSED → #750(제목에 에러명, 같은 주제 중 범용 런북), SA 토큰 401 → #814(유일), CrashLoopBackOff → #590(조회수 최다, 중복 글 리다이렉트 대상), 에이전트 최소 권한 → #245(에이전트 보안 글 중 조회수 최다).
- `sql/content-fixes/750-top4-econnrefused.sql`: 상단 에러 원문 + 원인→확인→해결 표, "80%" 삭제, REJECT도 refused, Node 17+/20+ `::1`·AggregateError, 2026-10 LTS(24·22, 20 EOL), curl 8.x·최신 psql 메시지, 리눅스 host-gateway, sudo·nft 명령.
- `sql/content-fixes/814-top4-sa-token-401.sql`: 상단 표, 403 링크 오류(probe 글로 연결돼 있던 것) → #645, 버전표 기능 게이트 기준 정정 + 지원 버전 1.35~1.37, extend-token-expiration(최대 1년), base64url 디코딩 명령 수정(2곳), projected 예시 audience 생략·kube-root-ca.crt 추가·InClusterConfig 경로 주의, client-go·Python 클라이언트 1분 재읽기, 깨진 앵커 1개. 2026-10-03 batch2(미적용) 조사 내용을 다시 확인해 반영했다.
- `sql/content-fixes/590-top4-crashloopbackoff.sql`: 상단 표, 90%·70%·"절반" 삭제, Secret 부재는 CreateContainerConfigError, `-o yaml` → `describe`(값 노출 방지), startupProbe 1.20 GA, 백오프 10~300초·10분 리셋·KubeletCrashLoopBackOffMax(1.35 beta), subPath 갱신 불가, `kubectl debug --copy-to`, 참고 문서 6개.
- `sql/content-fixes/245-top4-agent-least-privilege.sql`: 상단 OWASP LLM06:2025 최소 권한 점검표, 서버 측 도구 인가 예제 코드(실행 확인), 정규식·시스템 프롬프트 재강조는 보조 수단(LLM01:2025), excerpt(KO·i18n.excerpt 태그·en.excerpt) 정리.
- hash(): `sql/content-fixes/307-llm-cache-hash.sql`(FastAPI+Redis 캐시 키, 워커 간 공유 → sha256), `sql/content-fixes/274-ab-assign-hash.sql`(사용자별 A/B 고정 배정, 요청·워커·재시작 간 같아야 함 → sha256). KO·EN 모두.
- 4편 SQL은 원문 md5 조건, 307/274는 옛 문자열이 있을 때만 바꿔 재실행하면 0행. ROLLBACK 시험: 6건 각 1행, 2회차 6건 0행, 결과 md5가 수정본과 일치.
- 백업 `~/project/nodelog-db/backups/top4-refresh-20261006-104536.dump`, 행 복원 SQL `top4-refresh-20261006-104536-restore/{750,814,590,245,274,307}.restore.sql`(ROLLBACK으로 원문 md5 복원 확인).
- 캐시 무효화 태그: #750 `post-9ab4ad78f30ef0be`, #814 `post-8e4f860e5d1a6779`, #590 `post-42b92446ebe64d63`, #245 `post-fbe4ca06111e451c`, #307 `post-7f748353ac1b17a6`, #274 `post-b273b4f94b2b3745`.

## #307 FastAPI 예제: datetime import + lifespan (2026-10-06 10:49 KST, 운영 DB 적용, 편집자 승인)
- posts #307 KO·EN 본문의 FastAPI+Redis 예제 코드만 수정: `from datetime import datetime` 추가(코드가 `datetime.now()` 사용), 폐기 예정인 `@app.on_event("startup")`을 `contextlib.asynccontextmanager` lifespan + `app = FastAPI(lifespan=lifespan)`으로 교체. 시작 로직(`await r.ping()`, 출력)은 그대로이고 원문에 shutdown 핸들러는 없었다. 본문에 on_event 언급·출처 블록이 없어 산문·링크는 바꾸지 않았다.
- 검증: 수정 후 코드 블록을 추출해 `python -m py_compile` 통과(KO·EN), venv(fastapi 0.142.2, redis 8.1.0)에서 import 확인, fakeredis + TestClient로 lifespan 실행·캐시 미스→히트까지 확인.
- SQL `sql/content-fixes/307-fastapi-lifespan.sql`(옛 블록이 있을 때만 바꾸므로 재실행하면 0행). ROLLBACK 시험: 1행, 2회차 0행. 1행 적용, published_at·status·slug 변경 없음.
- 백업 `~/project/nodelog-db/backups/fix-307-lifespan-20261006-104858.dump`, 행 복원 SQL `fix-307-lifespan-20261006-104858-restore/307.restore.sql`(ROLLBACK으로 복원 확인). 캐시 태그 `post-7f748353ac1b17a6`.
