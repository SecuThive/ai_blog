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

## 운영 DB 적용 (마일스톤 2, 2026-10-04 04:55 KST)
- 적용 전 전체 백업: `~/project/nodelog-db/backups/stale-refresh-20261004-044945.dump` (pg_restore 전체 읽기 확인).
- 행별 원래 값 복원 SQL: `~/project/nodelog-db/backups/stale-refresh-20261004-044945-restore/<id>.restore.sql` (#217·#206은 `217v2`·`206v2`, 배치 1 적용 후 상태로 되돌림).
- 같은 순서로 11건 시험(각 1행, 재실행 0행, ROLLBACK) → 적용(각 UPDATE 1, COMMIT) → content·title md5가 수정본과 일치.
- 11건 모두 KO 본문이 바뀌어 updated_at은 트리거로 갱신, published_at 유지. EN만 바뀐 글은 없음.
- 캐시 태그 11개 무효화, KO·EN URL 22개 모두 200, 새 문구 확인.

## 출처 블록 수치별 원문 URL 점검 (배치 1)
새로 넣은 수치마다 원문 페이지(뉴스·홈페이지 아님) URL이 붙어 있는지 다시 확인했다.
- #743: 이미 충족(docs.docker.com/docker-hub/usage/). 수정 없음.
- #217: 전년 대비 증감의 비교 기준(2025년 2분기 점유율)에 원문이 없었음 → Synergy 2025년 2분기 발표를 추가하고, 수치별로 어느 페이지인지 출처 줄에 적음. SQL `sql/stale-refresh/217-aws-azure-gcp-compare-v2.sql`.
- #206: 수치는 모두 Chainalysis 원문에 있음. 출처 줄에 수치를 하나씩 적고, 28%를 원문 표현대로 추정치로 고침. SQL `sql/stale-refresh/206-ransomware-trends-v2.sql`.

| 글 | 수치 | 원문 URL |
|---|---|---|
| #217 | 2026년 2분기 점유율 AWS 28%, Microsoft 20%, Google 15% | https://www.srgresearch.com/articles/q2-cloud-market-passes-143-billion-highest-growth-rate-in-eight-years |
| #217 | 2025년 2분기 점유율 AWS 30%, Microsoft 20%, Google 13% (증감 기준) | https://www.srgresearch.com/articles/q2-cloud-market-nears-100-billion-milestone-and-its-still-growing-by-25-year-over-year |
| #217 | AWS 39개 리전, 124개 가용영역 | https://aws.amazon.com/about-aws/global-infrastructure/ |
| #206 | 2025년 지불 총액 약 8.2억 달러, 2024년 수정치 8.92억 달러, -8%, 공격 주장 +50%, 지불 비율 28%(추정), 9억 달러 안팎까지 증가 가능 | https://www.chainalysis.com/blog/crypto-ransomware-2026/ |
| #206 | LockBit 인프라 압수 2024-02-20 | https://www.nationalcrimeagency.gov.uk/news/nca-leads-international-investigation-targeting-worlds-most-harmful-ransomware-group |
| #743 | 비인증 6시간당 100회(IPv4·IPv6 /64), Personal 200회, 유료 무제한 | https://docs.docker.com/docker-hub/usage/ |

## 배치 2 (9건)
| id | 바뀐 내용 | 주요 출처 |
|---|---|---|
| 469 | 제목·H1·결론의 "2024년" 제거(제목 「개발자가 알아야 할 LLM 활용 트렌드 5가지: …」). 임베딩 모델명 확인 | platform.openai.com/docs/guides/embeddings |
| 584 | 제목·H1·요약·예시의 2024 제거. SGE → AI 개요·AI 모드. FAQ 리치 결과(2026-05-07부터 미표시) 권장 → 검색 갤러리에서 현재 지원 유형 확인으로 교체. Core Web Vitals LCP·INP·CLS | developers.google.com/search (updates, ai-features, search-gallery), web.dev/articles/vitals |
| 402 | H1·도입 de-date. EU AI Act 4단계 위험 등급과 적용 일정, DIR 0.8/1.2 → 4/5 규칙 | digital-strategy.ec.europa.eu AI Act, eCFR 29 CFR 1607.4 |
| 263 | 제목 「2026년 LLM 동향: OpenAI·Anthropic·Google 모델 라인업 비교와 6개월 개발 로드맵」. GPT-5(예상)/Claude 3.5/4/Llama 3 표 → 공식 모델 페이지의 현재 라인업과 공급사 설명. 가격은 넣지 않음 | 각 공급사 모델·가격 공식 페이지 |
| 395 | 출처 없는 "시장 점유율(2024)" 수치 삭제 → 렌더링 방식 열. 예시 제목 de-date | 없음(삭제만) |
| 99 | 예제 모델 ID: OpenAI는 `OPENAI_MODEL` 환경변수, Claude는 `claude-sonnet-5-5`. 병렬 툴 호출 출처 | OpenAI function calling, Anthropic tool use·models overview |
| 720 | FAQ의 모델 추천 → 모델명 없이 공식 모델 페이지 안내 | 본문 링크 |
| 461 | GPT-4o 추천 → 등급별 2026-10-04 예(GPT-6 Luna, Claude Haiku 4.5, Gemini 3.5 Flash-Lite / 상위 GPT-6 Astra·6.1 Sol, Claude Opus·Sonnet 5.5, Gemini 3.1 Pro) | 각 공급사 모델·가격 공식 페이지 |
| 265 | H1의 "2024" 제거. "OWASP Top 10" → OWASP Top 10 for LLM Applications 2025(LLM01 Prompt Injection) | genai.owasp.org/llm-top-10 |

slug는 URL 유지를 위해 바꾸지 않았다(#469·#584·#402·#263·#265 slug에 2024가 남아 있음).

### 배치 2에서 새로 넣은 수치·사실과 원문 URL
| 글 | 수치·사실 | 원문 URL |
|---|---|---|
| #469 | 현재 임베딩 모델 `text-embedding-3-small`·`text-embedding-3-large` | https://platform.openai.com/docs/guides/embeddings |
| #584 | FAQ 리치 결과 2026-05-07부터 미표시, 문서 삭제 | https://developers.google.com/search/updates#removing-faq-rich-result |
| #584 | AI 개요·AI 모드 | https://developers.google.com/search/docs/appearance/ai-features |
| #584 | Core Web Vitals 지표 LCP·INP·CLS | https://web.dev/articles/vitals |
| #402 | AI Act 4단계 위험 등급, 2024-08-01 발효, 2025-02-02·2025-08-02·2026-08-02, Annex III 2027-12-02, Annex I 2028-08-02, AI Omnibus 2026-07-27 발효 | https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai |
| #402 | 4/5(80%) 규칙 | https://www.ecfr.gov/current/title-29/subtitle-B/chapter-XIV/part-1607/section-1607.4 |
| #263, #461 | OpenAI GPT-6 Astra, GPT-6.1 Sol, GPT-6 Luna | https://platform.openai.com/docs/models |
| #263, #461, #99 | Anthropic Claude Fable 5.1, Opus 5.5, Sonnet 5.5(`claude-sonnet-5-5`), Haiku 4.5 | https://docs.anthropic.com/en/docs/about-claude/models/overview |
| #263, #461 | Google Gemini 3.1 Pro(Preview), 3.8 Flash, 3.5 Flash-Lite | https://ai.google.dev/gemini-api/docs/models |
| #99 | OpenAI `parallel_tool_calls` | https://developers.openai.com/api/docs/guides/function-calling |
| #99 | Claude 병렬 툴 사용 | https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview |
| #265 | OWASP Top 10 for LLM Applications 2025, LLM01:2025 Prompt Injection | https://genai.owasp.org/llm-top-10/ |

#395·#720은 수치를 넣지 않았다(삭제·일반화만). 가격 수치는 어느 글에도 새로 넣지 않았다.

## 남은 대상과 다음 배치 제안
인벤토리 90행: 2024/2025가 나오는 발행 글 83행(posts 72, guides 11) + 편집 체크리스트의 다음 배치 목록 7행.
시간 민감 23건: 배치 1 9건, 배치 2 9건 완료. 남은 5건 중 #734는 보류(공식 원문 확보 전 수정하지 않음), #704·#747·#326·#302 대기. 나머지 60행은 예시 데이터·코드의 날짜, CVE 번호, 역사적 사실이라 유지. guides 11편은 모두 명령 예시의 날짜·파일명이다.
체크리스트 목록(#604, #665, #422, #74, #245, #17, #812)은 2024/2025 표현이 없어 이번 기준 밖이지만 주제상 시간 민감하므로 따로 검토한다.

다음 배치(마일스톤 3) 제안: #704, #747, #326, #302, 이어서 #604, #665, #422, #74, #245, #17, #812. #734는 보류 유지.
