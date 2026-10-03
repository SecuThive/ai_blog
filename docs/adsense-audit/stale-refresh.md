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

## 운영 DB 적용 (마일스톤 3, 2026-10-04 05:07 KST)
- 적용 전 전체 백업: `~/project/nodelog-db/backups/stale-refresh-20261004-045921.dump` (pg_restore 전체 읽기 확인).
- 행별 원래 값 복원 SQL: `~/project/nodelog-db/backups/stale-refresh-20261004-045921-restore/<id>.restore.sql` (#206·#743은 `206v3`·`743v3`, 직전 적용 상태로 되돌림).
- 11건 시험(각 1행, 재실행 0행, ROLLBACK) → 적용(각 UPDATE 1, COMMIT) → content·title md5가 수정본과 일치. #245·#17은 행을 건드리지 않음(updated_at 그대로 확인).
- 모두 KO 본문이 바뀌어 updated_at은 트리거로 갱신, published_at 유지. EN만 바뀐 글 없음.
- 캐시 태그 11개 무효화, KO·EN URL 22개 모두 200, 새 문구 확인.

## 배치 3 (11건 검토: 수정 9, 변경 없음 2) + 검수 반영 2건
| id | 바뀐 내용 | 출처 |
|---|---|---|
| 704 | Redis 라이선스 "2024~2025년 RSAL→AGPL" → 7.2 이하 BSD-3, 7.4 RSALv2/SSPLv1(2024-03), 8.0부터 AGPLv3 선택 추가. 정책 표에 Redis 8.6의 LRM 2종 추가(10종), 근거 없는 "allkeys-lfu 채택 증가" 삭제 | redis.io licenses, eviction, valkey.io |
| 747 | 출처 없는 "2025~2026년 트렌드"와 "90%" 삭제, pull.rebase 공식 문서 인용 | git-scm.com git-config |
| 326 | 예시 제목의 "2024년" 삭제(수치 없음, 출처 블록 없음) | — |
| 302 | 예시 제목 연도 삭제. 제목 60자·메타 설명 150~160자 기준 → Google 문서(길이 제한 없음, 잘림). "신뢰도 상승" 완화 | Google Search Central title links, snippets |
| 604 | 현행 전자금융감독규정(2026-07-15 시행) 대조: 클라우드 이용절차 제8조의2→제14조의2, 없는 제17조의2→제13조·제19조, 보고 "계약 후 7영업일"→사유 발생일부터 3개월. 근거 없는 "2026 완화" 표 → 조문상 예외(제15조①3·5호, 제14조의2⑦). 정보보호위원회 심의·평가 결과 활용 반영 | law.go.kr 전자금융감독규정 |
| 665 | "2026년 현재 등급제(하/중/상) 운영" → 고시(2023-01-31 시행) 원문: 상·중 등급은 별도 기준 후 시행, 종전 유형 신청 가능, SaaS 간편→하등급 인정 | law.go.kr 클라우드컴퓨팅서비스 보안인증에 관한 고시 |
| 422 | TensorFlow Lite → LiteRT 이름 변경, PyTorch 직접 변환, NNAPI Android 15 지원 중단, 양자화 효과를 공식 수치로 | ai.google.dev/edge/litert, developer.android.com |
| 74 | MLflow Tracing·Prompt Registry 반영(“수동 로깅 필요” 정정), 존재하지 않는 `wandb.sync(artifact)` → `Run.log_artifact()` | mlflow.org, docs.wandb.ai |
| 812 | Calico WireGuard 오버헤드(합산하지 않음)·MTU 자동 감지·operator 설정, Flannel MTU 자동 계산, GCP 기본 1460 출처. 근거 없는 "사고 증가" 문장 삭제 | docs.tigera.io, flannel docs, cloud.google.com |
| 245 | 확인함, 변경 없음(버전·수치 주장 없음) | — |
| 17 | 확인함, 변경 없음 | — |
| 206 (검수) | 2025년 지불 총액 "약 8.2억 달러 이상 / more than $820M", 28%를 추정치로 | chainalysis.com |
| 743 (검수) | "유료 플랜 무제한" → "Pro·Team·Business 요금제는 무제한", 출처 줄에 수치 | docs.docker.com |

### 배치 3에서 새로 넣은 수치·사실과 원문 URL
| 글 | 수치·사실 | 원문 URL |
|---|---|---|
| #704 | maxmemory-policy 10종, LRM(allkeys-lrm·volatile-lrm)은 Redis 8.6부터 | https://redis.io/docs/latest/develop/reference/eviction/ |
| #704 | 7.2 이하 BSD-3, 7.4 RSALv2/SSPLv1, 8.0 이상 RSALv2/SSPLv1/AGPLv3, 2024년 3월 변경 | https://redis.io/legal/licenses/ |
| #704 | Valkey maxmemory 정책 8종(LRM 없음) | https://valkey.io/topics/lru-cache/ |
| #747 | pull.rebase=true면 병합 대신 rebase | https://git-scm.com/docs/git-config#Documentation/git-config.txt-pullrebase |
| #302 | `<title>` 길이 제한 없음, 기기 폭에 맞춰 잘림 | https://developers.google.com/search/docs/appearance/title-link |
| #302 | 메타 설명 길이 제한 없음, 필요에 따라 잘림 | https://developers.google.com/search/docs/appearance/snippet |
| #604 | 2026-07-15 시행, 금융위원회고시 제2026-29호, 제14조의2(사유 발생일부터 3개월 이내 보고, 제7항), 제15조제1항제3·5호, 제8조의2, 제13조, 제19조 | https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000282622 |
| #665 | 과기정통부고시 제2023-4호(2023-01-31 시행), 제14조 등급 상·중·하, 부칙 제1조·제3조 | https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000218804 |
| #422 | TensorFlow Lite는 이제 LiteRT, 새 기능은 LiteRT에만 | https://ai.google.dev/edge/litert/migration |
| #422 | PyTorch → .tflite 변환 | https://ai.google.dev/edge/litert/conversion/pytorch/overview |
| #422 | 전체 정수 양자화 4배 작아짐·3배 이상 빨라짐, 동적 범위 4배·2~3배 | https://ai.google.dev/edge/litert/models/post_training_quantization |
| #422 | NNAPI Android 15에서 지원 중단 | https://developer.android.com/ndk/guides/neuralnetworks |
| #74 | MLflow Tracing 한 줄 자동 트레이싱(`mlflow.openai.autolog()`) | https://mlflow.org/docs/latest/genai/tracing/ |
| #74 | MLflow Prompt Registry | https://mlflow.org/docs/latest/genai/prompt-registry/ |
| #74 | `wandb.Run.log_artifact()` | https://docs.wandb.ai/guides/artifacts/construct-an-artifact/ |
| #812 | IPIP 20 B, VXLAN IPv4 50 B / IPv6 70 B, WireGuard IPv4 60 B / IPv6 80 B, GCE 1460 → IPIP 1440·VXLAN 1410, 자동 감지, `calicoNetwork.mtu` | https://docs.tigera.io/calico/latest/networking/configuring/mtu |
| #812 | Flannel MTU 자동 계산(subnet.env) | https://github.com/flannel-io/flannel/blob/master/Documentation/configuration.md |
| #812 | Flannel vxlan 백엔드 `MTU` 옵션 | https://github.com/flannel-io/flannel/blob/master/Documentation/backends.md |
| #812 | GCP VPC 기본 MTU 1460 | https://cloud.google.com/vpc/docs/mtu |
| #206 | 2025년 지불 총액 8.2억 달러 이상(more than $820M), 지불 비율 28%(추정치) | https://www.chainalysis.com/blog/crypto-ransomware-2026/ |
| #743 | 6시간당 비인증 100회(IPv4·IPv6 /64), Personal 200회, Pro·Team·Business 무제한 | https://docs.docker.com/docker-hub/usage/ |

## CSAP 글 갱신 (배치 4, 2026-10-04 05:14 KST, 사용자 승인)
- 근거 원문: 과학기술정보통신부 보도자료 「과기정통부·국정원, 공공 인터넷 기반 자원 공유(클라우드) 시장 진입 절차 개선 방안 발표」, 보도 시점 2026-04-20(월) 14:00(4-21 조간), 배포 2026-04-20 09:00, 사이버침해대응과. 기사 페이지 https://www.msit.go.kr/bbs/view.do?sCode=user&mId=307&mPid=208&bbsSeqNo=94&nttSeqNo=3187189 . 운영 머신에서 기사 페이지와 첨부 HWPX(260421 조간 (보도) …(수정).hwpx)를 내려받아 본문을 직접 읽음.
- 보도자료에 적힌 것: 이중 인증(CSAP + 국정원 보안 검증) → 국정원 단일 검증 체계, 2026년 상반기 「국가 클라우드컴퓨팅 보안 가이드라인」 등 개정, 1년 유예 후 2027년 하반기 본격 시행, 시행 전 CSAP 유효기간 인정, 민관 검증심의위원회, 기존 CSAP 평가기관 전문성 연계, 민간 클라우드 범용 영역은 ISMS에 자율 보안인증으로 통합 계획.
- 보도자료에 없는 것(본문에 쓰지 않음): 시행 월(요청에 있던 "2027년 7월"은 원문 표현이 아님, 원문은 "2027년 하반기"), 새 검증의 항목·등급, CSAP 고시 개정·폐지 일정, 지침 개정 완료 여부.
- 백업 `~/project/nodelog-db/backups/stale-refresh-20261004-051233.dump`, 복원 SQL `stale-refresh-20261004-051233-restore/{734v4,665v4}.restore.sql`. 시험(1행·재실행 0행·ROLLBACK) 후 적용, md5 일치, 캐시 태그 2개 무효화, KO·EN 4개 URL 200·새 문구·보도자료 URL 확인.

| id | 바뀐 내용 |
|---|---|
| 734 | 2026-04-20 발표 섹션 추가. 고시 소관 "디지털플랫폼정부위원회" → 과기정통부(과기정통부고시 제2023-4호). 근거 없는 등급별 세부표(취급 정보·망분리 요구 등) → 고시 조문표(제14조②, 부칙 제1·3조, 제15조②). 유형 표의 출처 없는 통제항목 수(100여 개·30여 개) 삭제, 현행 유형(IaaS·SaaS·PaaS·복합)과 DaaS 확인 안내. 결함 보완 "2~6주" → 30일(최대 90일), 갱신 "만료 전" → 만료 6개월 전 신청, 유효기간 "5년" → 인증서 기재 기간(고시에 없음). 출처 없는 SaaS 수요 급증·망분리 완화 논의 삭제. 요약문 갱신 |
| 665 | 제도 개편 예정 안내(보도자료 원문 기준) 추가, 출처 없는 "공공 SaaS 도입 급증" 삭제, 출처 블록에 보도자료 URL 추가 |

| 글 | 수치·날짜 | 원문 URL |
|---|---|---|
| #734, #665 | 2026-04-20 발표, 2026년 상반기 지침 개정, 1년 유예, 2027년 하반기 시행, 시행 전 CSAP 유효기간 인정 | https://www.msit.go.kr/bbs/view.do?sCode=user&mId=307&mPid=208&bbsSeqNo=94&nttSeqNo=3187189 |
| #734 | 과기정통부고시 제2023-4호(2023-01-31 시행), 등급 상·중·하(제14조②), 상·중 별도 기준 후 시행(부칙 제1조), SaaS 간편 → 하등급(부칙 제3조), 별표 4(제15조②), 세부 점검항목 KISA 공개(제15조③), 사후평가 매년(제2조), 결함 보완 30일·최대 90일(제17조④), 만료 6개월 전 갱신 신청(제20조①) | https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000218804 |

## CSAP 글 기간·비용 추정치 삭제 (배치 5, 2026-10-04 05:17 KST, 검수 반영)
- 검수 요청: 출처 없는 기간·비용 추정치는 "개략치" 표시가 아니라 본문에서 삭제. 고시에 근거한 기간만 유지.
- 별도 전체 덤프 없이 05:12 덤프(`stale-refresh-20261004-051233.dump`)를 기준으로, 적용 직전 라이브 행에서 행 단위 복원 SQL을 만들어 `stale-refresh-20261004-051233-restore/{734v5,665v5}.restore.sql`에 저장(복원하면 배치 4 상태로 돌아감).
- 시험(1행·재실행 0행·ROLLBACK) 후 적용, md5 일치, published_at 유지, 캐시 태그 post-5d86754f3c87c2e3·post-d39560239daf97dd 무효화, KO·EN 4개 URL 200·삭제 문구 없음·새 문구 확인.

| id | 삭제한 문구 (KO / EN) | 대체 |
|---|---|---|
| 734 | "전체 과정은 통상 **4~8개월** 규모입니다…현실적인 소요 기간은" / "typically takes **4–8 months**…realistic timeframes"; 흐름도의 (1~2주)·(1~2주)·(1~3개월)·(3~4주)·(1~2주)·(2~4주); "최소 수개월치" / "several months"; "1~3개월이 필요하기 때문에" / "take 1–3 months"; FAQ "통상 4~8개월을 권장" / "typically 4–8 months is recommended"; 출처 블록 "평가 기간(4~8개월)과 단계별 소요 기간은…개략치입니다." / "The overall timeline (4–8 months)…rough estimates…"; 도입부 "수개월의 준비" / "months of preparation" | 고시에 기간이 정해진 단계는 결함 보완(제17조제4항, 30일·최대 90일)뿐이라는 안내, FAQ는 결함 보완 기간과 만료 6개월 전 갱신 신청(제20조제1항)만 제시 |
| 665 | "짧게는 4개월, 보완이 길어지면 6개월 이상…최소 6개월 전에는 착수" / "as little as 4 months…6 months or more…at least 6 months ahead"; 표의 누적 예상 기간(~0.5·~1·~2·~3.5·~4.5·~5·~5~6개월)과 비용 개략 열; "수천만 원대까지" / "tens of millions of KRW"; "한두 달이 사라집니다" / "a month or two disappears"; FAQ "통상 신청부터 발급까지 4~6개월" / "Typically 4–6 months"; 면책 안내 "아래 수치는 실무 준비를 위한 개략 가이드" / "Figures below are a rough guide"; 출처 블록 "평가 기간·비용 수치는 공식 자료로 확인하지 못한 개략치입니다." / "Lead-time and cost figures are rough estimates…" | 기간·비용 열 없는 단계표, 보완 조치 30일·최대 90일(고시 제17조제4항) 표기, 출처 블록 고시 항목에 제17조제4항 추가 |

## 전체 집계 (마일스톤 1~3 + 배치 4·5 종료 시점)
인벤토리 90행: 2024/2025가 나오는 발행 글 83행(posts 72, guides 11) + 체크리스트 대기 목록 7행.
- 수정 완료 28건: 시간 민감 23건 전부(배치 1 9건, 배치 2 9건, 배치 3 4건, #734) + 대기 목록 중 사실이 낡았거나 틀린 5건(#604, #665, #422, #74, #812). #217·#206·#743·#665는 출처·표현 보강을 추가로 적용.
- 확인함, 변경 없음 2건: #245, #17.
- 보류 0건.
- 유지(시간 민감 아님) 60행: 예시 데이터·코드의 날짜, CVE 번호, 역사적 사실, guides 11편의 명령 예시.
- 고치지 못한 항목과 이유는 `editorial-checklist.md` 참고.
