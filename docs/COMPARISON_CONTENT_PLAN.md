# 툴 리뷰·비교글 확대 계획 (2026-07-15)

## 배경
- "툴 리뷰" 카테고리 발행 8편(전체의 ~2%)로 최약. 반면 "A vs B" 비교글은 **구매의도·광고 RPM이 높은** 최고가치 유형.
- noindex 정리 결과, 검색의도 명확한 **비교글 30편이 이미 존재하나 저품질로 색인 제외** 상태 → 재작성 시 즉시 재색인 가능한 '숨은 자산'.

## 실행 1 — 엔진 프롬프트 강화 (완료, 라이브)
`SAFESUARE/backend/utils/ai_company_engine.py` content_planner 프롬프트에 반영:
- **툴 리뷰 쿼터**: 최소 3사이클 중 1편은 "툴 리뷰" 카테고리의 구체적 "A vs B(vs C)" 비교글.
- 비교 유형(#4)에 구매의도 강조 + 인프라/개발/보안 예시 확장(GitHub Actions vs GitLab CI, Trivy vs Grype, FastAPI vs Spring Boot 등).
- 판정 기준: 가격·성능·러닝커브·한국어/국내 지원을 **직접 계산한 비교표**로 결론.

## 실행 2 — 기존 비교글 30편 재작성·재색인 (숨은 자산)
저품질 원인 대부분 "코드/표 없음·공식 링크 없음". **비교표 + 공식 문서 링크 + 버전 명시**만 보강하면 58점 상회로 재색인. 조회수 높은 순:

| # | 카테고리 | 조회 | 제목 |
|---|---|---|---|
| 21 | AI & 자동화 | 23 | MLOps 실전 가이드: 모델 버전 관리부터 프로덕션 배포까지, 최고의 툴 스택 비교 분석 |
| 17 | AI & 자동화 | 19 | DevOps 운영의 고통 끝! Prometheus, Grafana, Datadog 비교 가이드 (모니터링 아키텍처 설계) |
| 27 | 개발 | 18 | 백엔드 아키텍처 설계 가이드: FastAPI vs Spring Boot vs Django, 상황별 최적 프레임워크 선택법 |
| 16 | AI & 자동화 | 18 | [비교 가이드] 2026년, 우리 회사에 맞는 RPA vs. AI 워크플로우 자동화 솔루션 완벽 비교 |
| 19 | AI & 자동화 | 17 | 개발자 필독: AI 코딩 어시스턴트, Copilot vs GPT-4, 무엇이 진짜 생산성을 높일까? (실전 비교 리뷰) |
| 32 | AI & 자동화 | 16 | Jetson 환경에서 LLM 초저지연 구현 가이드: ONNX vs. TensorRT 모델 최적화 실습 |
| 77 | 툴 리뷰 | 16 | 클라우드를 넘어 엣지로: 임베디드 AI를 위한 필수 툴 비교 가이드 (TFLite vs. ONNX Runtime) |
| 22 | 개발 | 15 | 프로젝트 규모별 CI/CD 툴 선택 가이드: GitHub Actions vs GitLab vs Jenkins 완벽 비교 |
| 5 | AI & 자동화 | 15 | RAG 구현 필수 가이드: 벡터 DB, PGVector, Faiss, 나에게 맞는 검색 아키텍처 비교 분석 |
| 26 | IT 트렌드 | 14 | 클라우드 비용 최적화 가이드: 서버리스 vs. 쿠버네티스, TCO 관점으로 완벽 비교 분석 |
| 534 | AI & 자동화 | 14 | LLM 추론 속도 획기적으로 높이는 3가지 핵심 최적화 기법 완벽 비교 가이드 |
| 24 | 개발 | 13 | Redux vs Zustand vs Jotai: 프로젝트 규모별 최적의 상태 관리 패턴 가이드 |
| 31 | 개발 | 10 | 백엔드 프레임워크 선택 가이드: 대규모 트래픽부터 빠른 개발까지, 시나리오별 최적의 선택법 |
| 336 | AI & 자동화 | 10 | RAG 아키텍처 완성 가이드: AWS vs Azure vs GCP 벡터 DB 심층 비교 및 구축 로드맵 |
| 8 | 개발 | 9 | 백엔드 개발자를 위한 완벽 가이드: Python, Node.js, Java 런타임별 성능 및 아키텍처 비교 |
| 356 | AI & 자동화 | 9 | AI 거버넌스, 이론을 넘어 산업별 규제 비교 분석까지: 글로벌 컴플라이언스 로드맵 |
| 1 | AI & 자동화 | 9 | 개발자부터 기획자까지: 업무별 최적 AI 코파일럿 툴 3종 전격 비교 분석 |
| 78 | AI & 자동화 | 8 | LLM 에이전트 워크플로우 설계 가이드: LangChain vs LangGraph vs Semantic Kernel 완벽 비교 |
| 30 | 개발 | 8 | 분산 시스템 아키텍처 심층 분석: API Gateway vs. Message Queue 패턴 선택 가이드 |
| 3 | AI & 자동화 | 7 | 개발자를 위한 LLM 선택 가이드: GPT-4o vs. Claude 3 vs. Gemini, 비용 효율성 비교 분석 |
| 164 | AI & 자동화 | 6 | AI 도입 실패 비용을 막는 법: 기술 스펙 비교를 넘어선 '비즈니스 프로세스 재설계' 로드맵 |
| 262 | AI & 자동화 | 6 | 2026년 LLM 오케스트레이션 가이드: LangChain vs LlamaIndex vs Semantic Kernel, 나에게 맞는 프레임워크는? |
| 4 | AI & 자동화 | 6 | LLM 기반 워크플로우 오케스트레이션: Airflow, Prefect, Dagster, 데이터 엔지니어의 선택 가이드 |
| 49 | AI & 자동화 | 5 | LangChain vs AutoGen vs CrewAI: LLM 워크플로우 구축, 나에게 맞는 '최적의 엔진'은? |
| 267 | AI & 자동화 | 4 | 2026년 기업용 AI 아키텍처 설계 가이드: AWS vs Azure vs GCP, MLOps 플랫폼 완벽 비교 |
| 457 | AI & 자동화 | 4 | LLM 운영 비용 폭탄 피하는 법: Quantization부터 엣지까지, 최적 아키텍처 패턴 3종 비교 분석 |
| 719 | AI & 자동화 | 4 | 노코드 LLM으로 업무 자동화 끝내는 방법: 툴 비교부터 실전 구축 가이드 |
| 39 | IT 트렌드 | 4 | 서버리스 vs. 엣지 컴퓨팅: 시스템 아키텍트가 알아야 할 최적의 분산 컴퓨팅 아키텍처 선택 가이드 |
| 671 | AI & 자동화 | 3 | 코딩 없이 업무 자동화하는 법: 직장인 필수 노코드 툴 3가지 비교 및 활용 가이드 |
| 561 | 인프라 | 1 | MSA 분산 트랜잭션, SAGA 패턴 vs 이벤트 소싱(ES) 선택 가이드 |

## 실행 3 — 신규 비교 토픽 (엔진 기획 or 수동)
사이트 강점(인프라·개발·보안 런북)과 인접한 저경쟁·고의도 "vs":

| 카테고리 | 제안 제목 |
|---|---|
| 인프라 | Prometheus vs Grafana Loki vs ELK — 로그·메트릭 스택 선택 |
| 인프라 | Terraform vs Pulumi vs OpenTofu — IaC 도구 선택 기준 (2026) |
| 인프라 | Nginx vs Traefik vs Caddy — 리버스 프록시 선택 (자동 HTTPS·성능) |
| 인프라 | Docker Compose vs Kubernetes — 언제 K8s로 넘어가야 하나 |
| 개발 | pytest vs unittest — 파이썬 테스트 프레임워크 실무 선택 |
| 개발 | uv vs pip vs Poetry — 파이썬 패키지 관리 속도·재현성 비교 (2026) |
| 개발 | Bun vs Node.js vs Deno — 런타임 벤치·호환성 선택 가이드 |
| 보안 | Trivy vs Grype vs Snyk — 컨테이너 취약점 스캐너 선택 |
| 보안 | Vault vs AWS Secrets Manager vs Sealed Secrets — 시크릿 관리 선택 |
| 툴 리뷰 | GitHub Actions vs GitLab CI vs Jenkins — CI/CD 비용·속도 실측 비교 |
| 툴 리뷰 | pgvector vs Qdrant vs Chroma — 소규모 RAG 벡터DB 선택 |
| 툴 리뷰 | Cursor vs GitHub Copilot vs Windsurf — AI 코딩 툴 실무 비교 (2026) |
| 툴 리뷰 | Supabase vs Firebase vs Appwrite — BaaS 선택 기준 |
| 툴 리뷰 | Resend vs SendGrid vs AWS SES — 트랜잭션 이메일 발송 비교 |
| AI & 자동화 | Ollama vs vLLM vs LM Studio — 로컬 LLM 서빙 선택 |

## 비교글 템플릿 (58점+ 보장 구조)
1. **결론 먼저**: "○○에는 A, △△에는 B" 한 줄 요약 + 판정 비교표(가격·성능·러닝커브·한국어지원·라이선스)
2. **후보별 심층**: 각 도구 강점/약점, 실제 명령어·설정 예시(코드블록)
3. **상황별 의사결정 분기**: 규모/예산/팀 숙련도별 선택 플로우
4. **공식 1차 출처 링크**(각 도구 docs) + 검증 환경(버전) 명시
5. **관련 내부링크**: 사이트 내 관련 런북/가이드 앵커 연결

> 세부 재작성 대상 전체는 `docs/REWRITE_CANDIDATES.md` 참조.
