# DB 변경 기록 (Nodelog posts / engineer_guides)

## 이 PR 작업 (2026-10-03)
- 운영 DB에 쓰기 없음. 읽기 조회만 했다.
- 수정안: `sql/2026-10-03-phase1-content-fixes.sql`(미적용). 2026-10-03 04:17 백업의 posts 테이블을 임시 컨테이너에 복원해 시험 적용했다(8건 각 1행). 시험 후 컨테이너는 삭제했다.

- Phase 2 (미적용, COMMIT 없음):
  - `sql/2026-10-03-phase2-triggers.sql`: EN 번역만 바뀐 수정은 updated_at을 올리지 않게 `set_post_content_updated_at()` 교체, 승인 게이트 트리거(posts, engineer_guides), engineer_guides reviewed_at/reviewed_by 추가, status 기본값 'draft'.
  - `sql/2026-10-03-phase2-content-quality.sql`: posts #640, #656, #805, #816, #817의 KO 본문과 EN 본문(content_evidence.en.content). KO 변경에는 contentUpdatedAt과 changeSummary를 남긴다. 원문 md5 조건이 있어 재실행하면 0행이다. 변경 내용은 `content-diffs/`에 있다.
  - 시험: 04:17 덤프를 임시 컨테이너에 복원, 10건 각 1행, 재실행 0행, ROLLBACK. 자세한 결과는 `pipeline.md` 5절.

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
