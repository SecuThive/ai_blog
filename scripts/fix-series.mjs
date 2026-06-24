/**
 * 시리즈 정리 스크립트
 * 1) 유사/중복 시리즈 태그 통합 (병합)
 * 2) 1~2편짜리 시리즈에 에피소드 추가 생성 → DB 직접 삽입
 *
 * 실행: node scripts/fix-series.mjs
 *      node scripts/fix-series.mjs --dry-run
 */

import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');

// ── Supabase ───────────────────────────────────────────────────────────────
const SB_URL     = 'https://isfzeksbzxtuqymfocqv.supabase.co';
const SB_SERVICE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0';
const db = createClient(SB_URL, SB_SERVICE);

// ── Anthropic OAuth 토큰 ────────────────────────────────────────────────────
const ANTHROPIC_TOKEN = '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';

// ═══════════════════════════════════════════════════════════════════════════
// 1. 병합 대상: { postId, oldSeriesTag, newSeriesTag }
// ═══════════════════════════════════════════════════════════════════════════
const MERGES = [
  // 기업용 LLM 에이전트 → 메인 6편 시리즈에 합류
  { postId: 113, old: 'series:LLM 에이전트 마스터 가이드: 기업 도입을 위한 정책 및 리스크 관리 프레임워크', newSeries: 'LLM 에이전트 마스터 가이드' },
  // 운영 비용 최적화 → 경제성 5편 시리즈에 합류
  { postId: 115, old: 'series:LLM 운영 비용 최적화 마스터 가이드', newSeries: 'AI 시스템 경제성 마스터 가이드' },
  // AI 거버넌스 + MLSecOps 통합
  { postId: 116, old: 'series:AI 거버넌스 마스터 가이드', newSeries: 'AI 거버넌스 & MLSecOps 마스터 가이드' },
  { postId: 225, old: 'series:MLSecOps 심층 가이드', newSeries: 'AI 거버넌스 & MLSecOps 마스터 가이드' },
  // 엣지 AI 배포 통합
  { postId: 121, old: 'series:엣지AI배포마스터가이드', newSeries: '엣지 AI 배포 마스터 가이드' },
  { postId: 122, old: 'series:엣지 AI 배포 최적화 가이드', newSeries: '엣지 AI 배포 마스터 가이드' },
  // AI 데이터 아키텍처 통합
  { postId: 125, old: 'series:AI 데이터 제품화 아키텍처 가이드', newSeries: 'AI 데이터 아키텍처 마스터 가이드' },
  { postId: 241, old: 'series:AI 시대의 데이터 아키텍처 설계', newSeries: 'AI 데이터 아키텍처 마스터 가이드' },
  // 프롬프트 엔지니어링 이름 정규화
  { postId: 126, old: 'series:LLM프롬프트엔지니어링마스터', newSeries: 'LLM 프롬프트 엔지니어링 마스터' },
  // LLM 에이전트 심화 통합
  { postId: 147, old: 'series:LLM 에이전트 심화 가이드', newSeries: 'LLM 에이전트 심화 마스터 가이드' },
  { postId: 247, old: 'series:LLM 에이전트 심화 아키텍처', newSeries: 'LLM 에이전트 심화 마스터 가이드' },
  // AI 시스템 아키텍처 심화 통합 (이름 중복 3개)
  { postId: 226, old: 'series:AI 시스템 아키텍처 심화: LLM 애플리케이션의 성능 병목 지점 해결에 초점', newSeries: 'AI 시스템 아키텍처 심화' },
  { postId: 235, old: 'series:AI 시스템 아키텍처 심화: LLM 애플리케이션의 성능 병목 지점 해결', newSeries: 'AI 시스템 아키텍처 심화' },
  // AI 비즈니스 → 기존 2편 시리즈에 합류
  { postId: 231, old: 'series:AI 비즈니스 프로세스 재설계 가이드', newSeries: 'AI 도입 성공을 위한 비즈니스 프레임워크' },
  // AI 에이전트 실전 통합 (3개)
  { postId: 243, old: 'series:AI 에이전트 오케스트레이션 마스터 가이드', newSeries: 'AI 에이전트 실전 마스터 가이드' },
  { postId: 244, old: 'series:AI 에이전트 실전 가이드', newSeries: 'AI 에이전트 실전 마스터 가이드' },
  { postId: 258, old: 'series:AI 에이전트 시스템 구축 마스터 클래스', newSeries: 'AI 에이전트 실전 마스터 가이드' },
  // LLMOps 실전 통합 (3개)
  { postId: 252, old: 'series:LLM 서비스 배포 및 최적화', newSeries: 'LLMOps 실전 마스터 가이드' },
  { postId: 255, old: 'series:LLMOps 심층 분석', newSeries: 'LLMOps 실전 마스터 가이드' },
  { postId: 266, old: 'series:MLOps 파이프라인 마스터 가이드', newSeries: 'LLMOps 실전 마스터 가이드' },
];

// ═══════════════════════════════════════════════════════════════════════════
// 2. 새 에피소드 생성 목록
// ═══════════════════════════════════════════════════════════════════════════
// 병합 후 2편짜리 → EP3 추가 / 독립 1편 → EP2·EP3 추가
// 엣지 AI 배포: 기존 [2편], (3편) 두 포스트가 있으므로 EP1 선행 추가
const NEW_EPISODES = [
  // ── 엣지 AI 배포 마스터 가이드: EP1 선행 (기존 포스트들이 2, 3편이므로)
  {
    seriesName: '엣지 AI 배포 마스터 가이드',
    episodeTitle: '엣지 AI 배포 입문: 온디바이스 AI의 원리와 아키텍처 선택 가이드',
    prompt: `당신은 AI 인프라 전문가입니다. '엣지 AI 배포 마스터 가이드' 시리즈의 1편으로, 엣지 AI 배포의 개요를 다루는 글을 작성하세요.

주제: 엣지 AI 배포 입문 — 온디바이스 AI의 원리와 아키텍처 선택 가이드
포함할 내용:
- 클라우드 AI vs 엣지 AI: 지연·비용·프라이버시 트레이드오프
- 엣지 디바이스 유형별(MCU, GPU, NPU) 아키텍처 결정 기준
- 실전 배포 체크리스트 (전력, 메모리, 연결성)
- 대표 프레임워크: TensorFlow Lite, ONNX Runtime, OpenVINO 비교

마크다운, 한국어, 1800~2500자, h1 제외, 코드·표·수치 포함`,
    category: 'AI & 자동화', author: 'Content Reviewer', agent_role: 'content_reviewer',
    tags: ['엣지AI', '온디바이스AI', 'TFLite', 'ONNX', 'NPU'],
    publishOffset: -90, // 기존 EP2(121) 90분 전
    referencePostId: 121,
  },

  // ── AI 에이전트 신뢰성 검증 가이드 (EP2, EP3)
  {
    seriesName: 'AI 에이전트 신뢰성 검증 가이드',
    episodeTitle: 'AI 에이전트 자동화 테스트 전략: 비결정 시스템을 검증하는 프레임워크',
    prompt: `당신은 MLOps 전문가입니다. 'AI 에이전트 신뢰성 검증 가이드' 시리즈 2편입니다. 1편에서 비결정성 제어 아키텍처(샌드박싱, 트랜잭션, 상태 머신)를 다뤘습니다.

주제: AI 에이전트 자동화 테스트 전략 — 비결정 시스템을 검증하는 프레임워크
포함할 내용:
- 에이전트 테스트의 어려움: 일반 유닛 테스트가 실패하는 이유
- 확률적 어설션(Probabilistic Assertions): 통계적 검증 접근법
- 시나리오 기반 테스트 vs 퍼즈 테스트 설계
- Replay 테스트: 프로덕션 트레이스를 테스트 케이스로 재활용
- 실전 도구: LangSmith, Braintrust, Eval harness 비교

마크다운, 한국어, 1800~2500자, h1 제외, 코드·표·수치 포함`,
    category: 'AI & 자동화', author: 'Content Reviewer', agent_role: 'content_reviewer',
    tags: ['AI에이전트', 'MLOps', 'LLM테스트', '자동화검증', 'LangSmith'],
    publishOffset: 30, referencePostId: 108,
  },
  {
    seriesName: 'AI 에이전트 신뢰성 검증 가이드',
    episodeTitle: '에이전트 장애 복구 설계: Circuit Breaker·Fallback·Graceful Degradation 패턴',
    prompt: `당신은 MLOps 전문가입니다. 'AI 에이전트 신뢰성 검증 가이드' 시리즈 3편입니다. 1편(비결정성 제어), 2편(자동화 테스트)에 이어 장애 복구 설계를 다룹니다.

주제: 에이전트 장애 복구 설계 — Circuit Breaker·Fallback·Graceful Degradation
포함할 내용:
- LLM 에이전트에서 발생하는 장애 유형 분류 (타임아웃, 모델 거부, 툴 오류)
- Circuit Breaker 패턴: 반복 실패 감지 → 자동 차단 → 복구
- Fallback 체인 설계: 대체 모델, 캐시, 규칙 기반 백업
- Graceful Degradation: 기능 축소 서빙으로 전체 다운 방지
- 실전 구현 예시 (Python + tenacity + asyncio)

마크다운, 한국어, 1800~2500자, h1 제외, 코드·표·수치 포함`,
    category: 'AI & 자동화', author: 'Content Reviewer', agent_role: 'content_reviewer',
    tags: ['AI에이전트', 'CircuitBreaker', 'MLOps', '장애복구', '신뢰성'],
    publishOffset: 60, referencePostId: 108,
  },

  // ── 산업 현장 AI 통합 아키텍처 가이드 (EP2, EP3)
  {
    seriesName: '산업 현장 AI 통합 아키텍처 가이드',
    episodeTitle: '산업 데이터 파이프라인 설계: MQTT·OPC-UA에서 클라우드 데이터 레이크까지',
    prompt: `당신은 산업 AI 아키텍트입니다. '산업 현장 AI 통합 아키텍처 가이드' 시리즈 2편입니다. 1편에서 AI-OT 게이트웨이 설계 방법론을 다뤘습니다.

주제: 산업 데이터 파이프라인 설계 — MQTT·OPC-UA에서 클라우드 데이터 레이크까지
포함할 내용:
- 산업 프로토콜(MQTT, OPC-UA, Modbus) → 표준 이벤트 스트림 변환
- 엣지 버퍼링: 네트워크 단절 시 데이터 유실 방지 전략
- Apache Kafka vs AWS IoT Greengrass: 산업 현장 적합성 비교
- 타임시리즈 DB(InfluxDB, TimescaleDB) 설계 패턴
- 이상 탐지 모델 실시간 서빙 파이프라인 구조

마크다운, 한국어, 1800~2500자, h1 제외, 코드·표·수치 포함`,
    category: 'AI & 자동화', author: 'Content Reviewer', agent_role: 'content_reviewer',
    tags: ['산업AI', 'OT통합', 'MQTT', 'OPC-UA', '데이터파이프라인'],
    publishOffset: 30, referencePostId: 120,
  },
  {
    seriesName: '산업 현장 AI 통합 아키텍처 가이드',
    episodeTitle: '제조 현장 AI 모델 운영: 저지연 추론, 연속 학습, 예측 유지보수 실전 가이드',
    prompt: `당신은 산업 AI 아키텍트입니다. '산업 현장 AI 통합 아키텍처 가이드' 시리즈 3편입니다. 1편(게이트웨이 설계), 2편(데이터 파이프라인)에 이어 모델 운영을 다룹니다.

주제: 제조 현장 AI 모델 운영 — 저지연 추론·연속 학습·예측 유지보수
포함할 내용:
- 저지연 추론 요구사항: 제조 현장 SLA(< 50ms) 달성 방법
- 온라인 학습 vs 배치 재학습: 제조 데이터 특성에 맞는 전략
- 예측 유지보수(PdM) 모델: 이상 탐지부터 잔여 수명 예측까지
- 모델 드리프트 감지: 생산 환경 변화에 대응하는 모니터링
- 실전 사례: 설비 진동 데이터 기반 결함 예측 구현

마크다운, 한국어, 1800~2500자, h1 제외, 코드·표·수치 포함`,
    category: 'AI & 자동화', author: 'Content Reviewer', agent_role: 'content_reviewer',
    tags: ['산업AI', '예측유지보수', 'MLOps', '엣지AI', '제조AI'],
    publishOffset: 60, referencePostId: 120,
  },

  // ── LLM 프롬프트 엔지니어링 마스터 (EP2, EP3)
  {
    seriesName: 'LLM 프롬프트 엔지니어링 마스터',
    episodeTitle: '고급 프롬프트 패턴: CoT·ToT·ReAct를 프로덕션에서 활용하는 법',
    prompt: `당신은 LLM 프롬프트 엔지니어링 전문가입니다. 'LLM 프롬프트 엔지니어링 마스터' 시리즈 2편입니다. 1편에서 Zero-shot, Few-shot, Role, Chain, Format 5가지 핵심 기법을 다뤘습니다.

주제: 고급 프롬프트 패턴 — CoT·ToT·ReAct를 프로덕션에서 활용하는 법
포함할 내용:
- Chain-of-Thought(CoT): 단계별 추론 유도로 정확도 높이기
- Tree-of-Thought(ToT): 복잡한 문제에서 다수 경로 탐색
- ReAct 패턴: 추론 + 도구 호출 반복 루프 설계
- Self-Consistency: 동일 문제 다수 실행 후 다수결 앙상블
- 프로덕션 도입 시 비용·지연 트레이드오프 분석

마크다운, 한국어, 1800~2500자, h1 제외, 코드·표·수치 포함`,
    category: 'AI & 자동화', author: 'Content Reviewer', agent_role: 'content_reviewer',
    tags: ['프롬프트엔지니어링', 'CoT', 'ReAct', 'LLM', 'ToT'],
    publishOffset: 30, referencePostId: 126,
  },
  {
    seriesName: 'LLM 프롬프트 엔지니어링 마스터',
    episodeTitle: '프롬프트 버전 관리와 A/B 테스트: 체계적인 프롬프트 최적화 파이프라인',
    prompt: `당신은 LLM 프롬프트 엔지니어링 전문가입니다. 'LLM 프롬프트 엔지니어링 마스터' 시리즈 3편입니다. 1편(기초 기법), 2편(고급 패턴)에 이어 프롬프트 운영을 다룹니다.

주제: 프롬프트 버전 관리와 A/B 테스트 — 체계적인 프롬프트 최적화 파이프라인
포함할 내용:
- 프롬프트를 코드처럼 관리: Git 기반 버전 관리 전략
- 프롬프트 레지스트리 설계: 환경별(dev/staging/prod) 분리
- A/B 테스트 설계: 평가 지표 정의, 샘플 크기, 통계적 유의성
- LLM 평가 자동화: G-Eval, RAGAS, 인간 레이블 혼합 전략
- 실전 도구: PromptLayer, LangSmith, Braintrust 비교

마크다운, 한국어, 1800~2500자, h1 제외, 코드·표·수치 포함`,
    category: 'AI & 자동화', author: 'Content Reviewer', agent_role: 'content_reviewer',
    tags: ['프롬프트엔지니어링', 'LLM평가', 'A/B테스트', 'PromptOps', 'LangSmith'],
    publishOffset: 60, referencePostId: 126,
  },

  // ── LLM 성능 향상 시리즈 (EP2, EP3)
  {
    seriesName: 'LLM 성능 향상 시리즈',
    episodeTitle: 'LLM 파인튜닝 실전 가이드: LoRA·QLoRA로 커스텀 모델 효율적으로 만들기',
    prompt: `당신은 LLM 엔지니어입니다. 'LLM 성능 향상 시리즈' 2편입니다. 1편에서 RAG로 신뢰도 높은 사내 챗봇을 만드는 방법을 다뤘습니다.

주제: LLM 파인튜닝 실전 가이드 — LoRA·QLoRA로 커스텀 모델 효율적으로 만들기
포함할 내용:
- 파인튜닝 vs RAG: 언제 어떤 방법을 선택해야 하는가
- LoRA(Low-Rank Adaptation): 원리, 하이퍼파라미터 튜닝 가이드
- QLoRA: 4-bit 양자화로 소비자 GPU에서 파인튜닝하기
- 데이터셋 준비: 품질이 양보다 중요한 이유 + 데이터 정제 방법
- 실전 파이프라인: Hugging Face TRL + Weights & Biases 추적

마크다운, 한국어, 1800~2500자, h1 제외, 코드·표·수치 포함`,
    category: 'AI & 자동화', author: 'Content Reviewer', agent_role: 'content_reviewer',
    tags: ['파인튜닝', 'LoRA', 'QLoRA', 'LLM', 'HuggingFace'],
    publishOffset: 30, referencePostId: 130,
  },
  {
    seriesName: 'LLM 성능 향상 시리즈',
    episodeTitle: 'LLM 앙상블과 라우팅: 여러 모델을 조합해 정확도와 비용을 동시에 잡는 전략',
    prompt: `당신은 LLM 엔지니어입니다. 'LLM 성능 향상 시리즈' 3편입니다. 1편(RAG 챗봇), 2편(파인튜닝)에 이어 모델 조합 전략을 다룹니다.

주제: LLM 앙상블과 라우팅 — 여러 모델을 조합해 정확도와 비용을 동시에 잡는 전략
포함할 내용:
- LLM 라우팅의 필요성: 모든 질문에 GPT-4를 쓰는 낭비
- 쿼리 복잡도 분류기로 모델 라우팅 구현하기
- 앙상블 기법: Mixture-of-Experts 개념과 경량 구현
- 폴백 체인: 빠른 모델 → 느린 정밀 모델 순차 호출
- 비용 대비 성능 측정: 실전 A/B 테스트 결과 분석 예시

마크다운, 한국어, 1800~2500자, h1 제외, 코드·표·수치 포함`,
    category: 'AI & 자동화', author: 'Content Reviewer', agent_role: 'content_reviewer',
    tags: ['LLM라우팅', 'LLM앙상블', 'MixtureOfExperts', '비용최적화', 'LLM'],
    publishOffset: 60, referencePostId: 130,
  },

  // ── Enterprise AI Architecture Blueprint (EP2, EP3)
  {
    seriesName: 'Enterprise AI Architecture Blueprint',
    episodeTitle: 'Enterprise AI Security Blueprint: 데이터 프라이버시와 모델 보안 설계 원칙',
    prompt: `당신은 기업 AI 아키텍트입니다. 'Enterprise AI Architecture Blueprint' 시리즈 2편입니다. 1편에서 PoC에서 프로덕션으로 가는 기업용 AI 아키텍처 청사진을 다뤘습니다.

주제: Enterprise AI Security Blueprint — 데이터 프라이버시와 모델 보안 설계 원칙
포함할 내용:
- 기업 AI의 3가지 보안 위협: 프롬프트 인젝션, 모델 탈취, 데이터 유출
- 데이터 분류 체계(PII, 기밀, 내부)와 AI 파이프라인 분리 전략
- LLM 게이트웨이를 통한 입출력 필터링 아키텍처
- 모델 접근 제어: RBAC, 감사 로그, 최소 권한 원칙
- 컴플라이언스 자동화: GDPR, CCPA 대응 체크리스트

마크다운, 한국어, 1800~2500자, h1 제외, 코드·표·수치 포함`,
    category: 'AI & 자동화', author: 'Content Reviewer', agent_role: 'content_reviewer',
    tags: ['EnterpriseAI', 'AI보안', 'GDPR', 'LLM보안', '기업AI'],
    publishOffset: 30, referencePostId: 157,
  },
  {
    seriesName: 'Enterprise AI Architecture Blueprint',
    episodeTitle: '기업 AI 거버넌스 체계: 모델 라이프사이클 관리와 규제 준수 자동화',
    prompt: `당신은 기업 AI 아키텍트입니다. 'Enterprise AI Architecture Blueprint' 시리즈 3편입니다. 1편(아키텍처 청사진), 2편(보안)에 이어 거버넌스를 다룹니다.

주제: 기업 AI 거버넌스 체계 — 모델 라이프사이클 관리와 규제 준수 자동화
포함할 내용:
- AI 거버넌스의 4 축: 책임성, 투명성, 공정성, 프라이버시
- 모델 레지스트리와 라이프사이클: 학습→검증→배포→폐기 관리
- 모델 카드(Model Card) 작성 표준과 감사 추적 체계
- EU AI Act, 국내 AI 기본법 대응 체크리스트
- MLflow + DVC 기반 재현 가능한 거버넌스 파이프라인

마크다운, 한국어, 1800~2500자, h1 제외, 코드·표·수치 포함`,
    category: 'AI & 자동화', author: 'Content Reviewer', agent_role: 'content_reviewer',
    tags: ['AI거버넌스', 'ModelRegistry', 'EUAIAct', 'MLflow', '기업AI'],
    publishOffset: 60, referencePostId: 157,
  },

  // ── Vector DB 마스터 클래스 (EP2, EP3)
  {
    seriesName: 'Vector DB 마스터 클래스',
    episodeTitle: '벡터 인덱싱 심층 가이드: HNSW·IVF·PQ 알고리즘의 실전 트레이드오프',
    prompt: `당신은 벡터 데이터베이스 전문가입니다. 'Vector DB 마스터 클래스' 시리즈 2편입니다. 1편에서 Pinecone·Weaviate·pgvector·Qdrant 선정 기준과 기본 최적화를 다뤘습니다.

주제: 벡터 인덱싱 심층 가이드 — HNSW·IVF·PQ 알고리즘의 실전 트레이드오프
포함할 내용:
- ANN(Approximate Nearest Neighbor) 검색의 정확도 vs 속도 트레이드오프
- HNSW: 계층 그래프 탐색 원리, efConstruction·M 파라미터 튜닝
- IVF(Inverted File Index): nlist, nprobe 설정이 성능에 미치는 영향
- Product Quantization(PQ): 메모리 압축의 원리와 정확도 손실
- 실전 벤치마크: ANN Benchmarks 해석법과 워크로드별 선택 기준

마크다운, 한국어, 1800~2500자, h1 제외, 코드·표·수치 포함`,
    category: 'AI & 자동화', author: 'Content Reviewer', agent_role: 'content_reviewer',
    tags: ['VectorDB', 'HNSW', 'IVF', 'ANN', 'RAG'],
    publishOffset: 30, referencePostId: 177,
  },
  {
    seriesName: 'Vector DB 마스터 클래스',
    episodeTitle: '하이브리드 검색 아키텍처: 벡터 + 키워드 검색을 조합한 최적 RAG 설계',
    prompt: `당신은 벡터 데이터베이스 전문가입니다. 'Vector DB 마스터 클래스' 시리즈 3편입니다. 1편(DB 선정), 2편(인덱싱 알고리즘)에 이어 하이브리드 검색을 다룹니다.

주제: 하이브리드 검색 아키텍처 — 벡터 + 키워드 검색을 조합한 최적 RAG 설계
포함할 내용:
- 순수 벡터 검색의 한계: 정확한 용어·숫자 검색에서 실패하는 이유
- BM25 + 벡터 검색 결합: Reciprocal Rank Fusion(RRF) 알고리즘
- Re-ranking 레이어: Cross-encoder로 초기 검색 결과 재정렬
- Weaviate·Qdrant·Elasticsearch 하이브리드 검색 구현 비교
- 쿼리 분해(Query Decomposition)와 멀티스텝 검색 전략

마크다운, 한국어, 1800~2500자, h1 제외, 코드·표·수치 포함`,
    category: 'AI & 자동화', author: 'Content Reviewer', agent_role: 'content_reviewer',
    tags: ['VectorDB', '하이브리드검색', 'BM25', 'RRF', 'RAG'],
    publishOffset: 60, referencePostId: 177,
  },

  // ── AI 거버넌스 & MLSecOps 마스터 가이드 → EP3 추가
  {
    seriesName: 'AI 거버넌스 & MLSecOps 마스터 가이드',
    episodeTitle: 'AI 모델 공급망 보안: SBOM·모델 서명·취약점 스캐닝 실전 가이드',
    prompt: `당신은 AI 보안 전문가입니다. 'AI 거버넌스 & MLSecOps 마스터 가이드' 시리즈 3편입니다. 1편(AI 거버넌스 감사 프레임워크), 2편(MLSecOps 규제 준수)에 이어 공급망 보안을 다룹니다.

주제: AI 모델 공급망 보안 — SBOM·모델 서명·취약점 스캐닝 실전 가이드
포함할 내용:
- AI 공급망 공격 사례: 악성 모델 가중치, 오염된 데이터셋
- AI/ML SBOM: 모델 의존성 목록화 표준(CycloneDX, SPDX)
- 모델 서명과 무결성 검증: Sigstore, Cosign 활용
- Hugging Face 모델의 보안 스캐닝: pickle 취약점, 악성 레이어
- CI/CD 파이프라인에 보안 게이트 통합하는 실전 예시

마크다운, 한국어, 1800~2500자, h1 제외, 코드·표·수치 포함`,
    category: 'AI & 자동화', author: 'Content Reviewer', agent_role: 'content_reviewer',
    tags: ['MLSecOps', 'AI공급망보안', 'SBOM', 'AI거버넌스', 'DevSecOps'],
    publishOffset: 30, referencePostId: 225,
  },

  // ── LLM 에이전트 심화 마스터 가이드 → EP3 추가
  {
    seriesName: 'LLM 에이전트 심화 마스터 가이드',
    episodeTitle: 'LLM 에이전트 툴 오케스트레이션 고급 전략: 동적 툴 선택과 병렬 실행 아키텍처',
    prompt: `당신은 LLM 에이전트 아키텍트입니다. 'LLM 에이전트 심화 마스터 가이드' 시리즈 3편입니다. 1편(ReAct 패턴 추론 워크플로우), 2편(상태 관리 완벽 가이드)에 이어 툴 오케스트레이션을 다룹니다.

주제: LLM 에이전트 툴 오케스트레이션 고급 전략 — 동적 툴 선택과 병렬 실행
포함할 내용:
- 정적 툴 리스트의 한계: 컨텍스트 창 초과와 혼동 문제
- 동적 툴 검색(Tool Retrieval): 임베딩 기반 런타임 툴 선택
- 툴 병렬 실행: 의존성 그래프 파악 후 동시 호출로 지연 감소
- 툴 결과 검증과 오류 복구: 자동 재시도 및 대안 툴 폴백
- 실전 구현: LangGraph + async 병렬 툴 호출 예시

마크다운, 한국어, 1800~2500자, h1 제외, 코드·표·수치 포함`,
    category: 'AI & 자동화', author: 'Content Reviewer', agent_role: 'content_reviewer',
    tags: ['LLM에이전트', '툴오케스트레이션', 'LangGraph', '병렬실행', 'ReAct'],
    publishOffset: 30, referencePostId: 247,
  },

  // ── AI 데이터 아키텍처 마스터 가이드 → EP3 추가
  {
    seriesName: 'AI 데이터 아키텍처 마스터 가이드',
    episodeTitle: 'AI 시대 레이크하우스 설계: Delta Lake·Apache Iceberg로 구축하는 통합 데이터 플랫폼',
    prompt: `당신은 데이터 아키텍트입니다. 'AI 데이터 아키텍처 마스터 가이드' 시리즈 3편입니다. 1편(데이터 제품화 개념), 2편(Data Mesh 아키텍처)에 이어 레이크하우스를 다룹니다.

주제: AI 시대 레이크하우스 설계 — Delta Lake·Apache Iceberg로 구축하는 통합 데이터 플랫폼
포함할 내용:
- 데이터 레이크의 한계(데이터 늪)와 레이크하우스가 해결하는 방법
- Delta Lake vs Apache Iceberg: ACID, 타임트래블, 스키마 진화 비교
- AI/ML 워크로드를 위한 피처 스토어 통합 패턴
- 레이크하우스 위에 RAG 파이프라인 구축하기 (예시: Databricks + LangChain)
- 비용 최적화: 스토리지 계층화, 자동 압축, 파티셔닝 전략

마크다운, 한국어, 1800~2500자, h1 제외, 코드·표·수치 포함`,
    category: 'AI & 자동화', author: 'Content Reviewer', agent_role: 'content_reviewer',
    tags: ['레이크하우스', 'DeltaLake', 'Iceberg', '데이터아키텍처', 'RAG'],
    publishOffset: 30, referencePostId: 241,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// helpers
// ═══════════════════════════════════════════════════════════════════════════

function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

async function callClaude(prompt, retries = 5) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': ANTHROPIC_TOKEN,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.content[0].type === 'text' ? data.content[0].text : '';
    }

    if (res.status === 429 || res.status === 529) {
      const waitMs = Math.pow(2, attempt) * 5000; // 5s, 10s, 20s, 40s, 80s
      console.log(`  ⏳ Rate limit (${res.status}), ${waitMs / 1000}s 후 재시도… (${attempt + 1}/${retries + 1})`);
      await new Promise(r => setTimeout(r, waitMs));
      continue;
    }

    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err.slice(0, 200)}`);
  }
  throw new Error(`Claude API 재시도 초과`);
}

function makeExcerpt(content) {
  return content.replace(/[#*`\[\]]/g, '').replace(/\n+/g, ' ').trim().slice(0, 200) + '…';
}

// ═══════════════════════════════════════════════════════════════════════════
// Step 1: 태그 병합
// ═══════════════════════════════════════════════════════════════════════════

async function applyMerges() {
  console.log('\n━━━ Step 1: 시리즈 태그 병합 ━━━\n');
  for (const m of MERGES) {
    const { data: post } = await db.from('posts').select('id,tags').eq('id', m.postId).single();
    if (!post) { console.log(`  ⚠️  ID ${m.postId} 없음`); continue; }

    const newTags = post.tags.map(t => t === m.old ? `series:${m.newSeries}` : t);
    if (JSON.stringify(newTags) === JSON.stringify(post.tags)) {
      console.log(`  ⏭  ID ${m.postId} — 이미 올바른 태그`);
      continue;
    }

    console.log(`  🔄 ID ${m.postId}: "${m.old}" → "series:${m.newSeries}"`);
    if (!DRY_RUN) {
      const { error } = await db.from('posts').update({ tags: newTags }).eq('id', m.postId);
      if (error) console.error(`     ❌ 오류:`, error.message);
      else console.log(`     ✅ 완료`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Step 2: 새 에피소드 생성 및 삽입
// ═══════════════════════════════════════════════════════════════════════════

async function generateAndInsertEpisodes() {
  console.log('\n━━━ Step 2: 새 에피소드 삽입 ━━━\n');

  // referencePostId별 published_at 캐시
  const refIds = [...new Set(NEW_EPISODES.map(e => e.referencePostId))];
  const { data: refPosts } = await db.from('posts').select('id,published_at').in('id', refIds);
  const refDateMap = {};
  for (const p of refPosts) refDateMap[p.id] = new Date(p.published_at);

  for (const [i, ep] of NEW_EPISODES.entries()) {
    console.log(`[${i + 1}/${NEW_EPISODES.length}] ${ep.seriesName} — ${ep.episodeTitle.slice(0, 55)}…`);

    try {
      // published_at 계산
      const baseDate = refDateMap[ep.referencePostId] || new Date();
      const publishedAt = new Date(baseDate.getTime() + ep.publishOffset * 60 * 1000);

      // 내용 생성
      console.log(`  ✍️  Claude 생성 중…`);
      const content = await callClaude(ep.prompt);
      const excerpt = makeExcerpt(content);
      const slug = toSlug(ep.episodeTitle);

      const payload = {
        title: ep.episodeTitle,
        slug,
        content,
        excerpt,
        category: ep.category,
        tags: [...ep.tags, `series:${ep.seriesName}`],
        author: ep.author,
        agent_role: ep.agent_role,
        status: 'published',
        views: 0,
        published_at: publishedAt.toISOString(),
        cover_image: null,
      };

      console.log(`  📄 생성 완료 (${content.length}자) — slug: ${slug}`);

      if (!DRY_RUN) {
        const { data: inserted, error } = await db.from('posts').insert(payload).select('id').single();
        if (error) throw error;
        console.log(`  ✅ DB 삽입 완료 — ID: ${inserted.id}`);
      } else {
        console.log(`  🟡 DRY RUN — 삽입 생략\n  excerpt: ${excerpt.slice(0, 100)}`);
      }
    } catch (e) {
      console.error(`  ❌ 실패:`, e.message);
    }

    // API rate limit 방지
    if (i < NEW_EPISODES.length - 1) await new Promise(r => setTimeout(r, 2000));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`\n🛠  시리즈 정리 스크립트 시작 (${DRY_RUN ? 'DRY RUN' : '실제 실행'})\n`);
  await applyMerges();
  await generateAndInsertEpisodes();
  console.log('\n✨ 완료\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
