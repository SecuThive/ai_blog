# 시간 민감 콘텐츠 갱신 기록 (stale refresh)

확인일: 2026-10-04 (KST). 대상: 발행된 posts·engineer_guides 중 2024/2025 기준 표현과 시간에 민감한 사실(모델, 가격, 버전, 법·제도, 통계)이 함께 있는 글.
인벤토리: `stale-refresh-inventory.csv`. 적용 SQL: `sql/stale-refresh/<id>-*.sql` (적용한 UPDATE 그대로, 원문 md5 조건이 있어 재실행하면 0행).

## 운영 DB 적용 (마일스톤 1, 2026-10-04 04:45 KST)
- 적용 전 전체 백업: `~/project/nodelog-db/backups/stale-refresh-20261004-0437.dump` (pg_dump -Fc, public TABLE DATA 6개 확인).
- 행별 원래 값 복원 SQL: `~/project/nodelog-db/backups/stale-refresh-20261004-0437-restore/<id>.restore.sql` (title·excerpt·content·tags·content_evidence를 되돌린 뒤 updated_at을 원래 값으로 다시 맞춘다).
- 순서: 트랜잭션 안에서 9건 적용 → 각 1행, 재실행 0행 확인 후 ROLLBACK(시험) → 실제 적용(각 UPDATE 1, COMMIT) → 결과 md5가 수정본과 일치.
- 발행일(published_at)은 그대로. 9건 모두 KO 본문이 바뀌어 updated_at은 트리거로 갱신되고, content_evidence에 contentUpdatedAt(적용 시각 UTC)·changeSummary·verifiedAt·officialSources(#224 제외)를 남겼다.
- 캐시: Vercel `invalidate_by_tags`(ai-blog, production)로 태그 `post-<sha1(slug) 앞 16자>` 9개 무효화. KO·EN URL 18개 모두 200, 새 문구 확인.

## EN만 바뀌는 수정의 updated_at 보존
운영 DB의 `set_post_content_updated_at()`(BEFORE UPDATE)는 title·content·excerpt·cover_image·category·tags·content_evidence 중 하나라도 바뀌면 `updated_at = now()`로 덮어쓴다. 같은 UPDATE에서 updated_at을 지정해도 덮인다.
그래서 EN만 바꾸는 SQL은 같은 트랜잭션에서 두 번째 UPDATE로 `updated_at`만 원래 값으로 되돌린다. 두 번째 UPDATE는 비교 대상 컬럼이 그대로라 트리거가 값을 덮지 않는다.
운영 DB에서 #803으로 시험(BEGIN → EN 제목 수정 → updated_at 2026-10-04 04:45로 바뀜 → 되돌리는 UPDATE → 원래 값 2026-09-18 01:55 KST와 일치 → ROLLBACK). 생성기(`EN-only` 분기)가 이 패턴을 쓴다. 이번 배치에는 EN만 바뀐 글이 없었다.
Phase 2 트리거 교체안(`sql/2026-10-03-phase2-triggers.sql`)은 아직 운영에 적용되지 않았다.

## 배치 1 (9건)
| id | slug(앞부분) | 바뀐 내용 | 주요 출처 |
|---|---|---|---|
| 217 | aws-vs-azure-vs-gcp-… | 2025 점유율(31/25/11%) → Synergy 2026년 2분기(AWS 28%, Microsoft 20%, Google 15%). AWS 33리전/105AZ → 39/124. Cloud Functions → Cloud Run functions. 출처 없는 비용표 삭제, 공식 가격 API로 조회하라는 안내로 대체. 근거 없는 "생산성 두 배" 삭제. EN 요약·i18n 태그 갱신 | srgresearch.com Q2 2026, aws.amazon.com global infrastructure, cloud.google.com functions overview |
| 206 | 2026-랜섬웨어-… | 출처 없는 "2024년 피해액 42억 달러" → Chainalysis 2026(2025년 약 8.2억 달러, -8%, 공격 주장 +50%, 지불 비율 28%). "LockBit·BlackCat·Cl0p 검거" → LockBit 인프라 압수(2024-02, NCA). RaaS 분배 비율(20~30%) 삭제. 깨진 요약문 교체, "2025년 주요 트렌드" → "주요 트렌드" | chainalysis.com/blog/crypto-ransomware-2026, NCA 2024-02-20 |
| 224 | 컨테이너-이미지-보안-… | 원문과 맞지 않는 "2024 Sysdig 보고서, 프로덕션 컨테이너 87%" 삭제(수치 없는 문장으로 대체) | 없음(삭제만) |
| 419 | llm-api-비용-폭탄-… | GPT-3.5/GPT-4o/Claude 3/Llama 3 추천 → 등급 설명 + 2026-10-04 공식 페이지 기준 예(GPT-6 Luna, Claude Haiku 4.5, Gemini Flash-Lite). 근거 없는 "90% 사용 케이스" 삭제 | OpenAI·Anthropic·Google 모델/가격 공식 페이지 |
| 284 | 1편-llm-api-비용-… | gpt-4o-mini/GPT-4o/Llama 3 8B → 등급별 예. 실제 단가와 맞지 않던 X/0.5X/0.1X 표 → 공식 가격표로 계산하는 표 | 같음 |
| 212 | 클라우드-iam-… | Gartner "2025년까지 99%, 그중 75% 과도한 권한" → 원문 전망(99%는 고객 책임)만 남기고 지난 전망임을 명시. 예시 조건 만료일 2025-12-31 → 2026-12-31 | gartner.com "Is the Cloud Secure?" |
| 798 | terraform-vs-opentofu-… | "2024년 IBM 인수 확정" → 2024년 발표, 2025-02-27 완료. OpenTofu 거버넌스 Linux Foundation → CNCF 샌드박스(2025-04-23) | newsroom.ibm.com 2025-02-27, cncf.io/projects/opentofu |
| 743 | imagepullbackoff-… | "2024~2025년 익명 한도 강화" → 현재 한도(6시간당 비인증 100회/IP·/64, Personal 200회, 유료 무제한) | docs.docker.com/docker-hub/usage |
| 417 | llm-서비스-비용-폭탄-… | GPT-3.5/GPT-4 Turbo/GPT-4o/Gemini Pro → 등급별 예(GPT-6 Luna·6.1 Sol·6 Astra, Claude Haiku 4.5·Sonnet 5.5·Fable 5.1/Opus 5.5, Gemini Flash-Lite·Flash·Pro) | OpenAI·Anthropic·Google 모델 공식 페이지 |

모든 수정 글에는 본문 끝에 「출처 · 확인일 2026-10-04」(EN: 「Sources · checked 2026-10-04」) 블록을 붙였다(#212는 본문 안 링크, #224는 삭제만이라 없음).

## 남은 대상과 다음 배치 제안
인벤토리 90행: 2024/2025가 나오는 발행 글 83행(posts 72, guides 11) + 편집 체크리스트의 다음 배치 목록 7행.
시간 민감 23건(배치 1에서 9건 완료, 14건 대기). 나머지 60행은 예시 데이터·코드의 날짜, CVE 번호, 역사적 사실이라 유지. guides 11편은 모두 명령 예시의 날짜·파일명이다.
체크리스트 목록(#604, #665, #422, #74, #245, #17, #812)은 2024/2025 표현이 없어 이번 기준 밖이지만 주제상 시간 민감하므로 따로 검토한다.

다음 배치 제안: #734(CSAP 제도 개편, 공식 원문 확보 후), #469(2024 LLM 트렌드, 회고형 재구성 또는 전면 갱신), #584(2024 구글 SEO), #402(AI 거버넌스: EU AI Act·AI 기본법 일정), #263(2026 LLM 트렌드 글의 2024 결론·모델 목록), #395(2024 프레임워크 점유율 표), #99·#720·#461(GPT-4o 추천 문구), #265(본문 H1의 2024).
