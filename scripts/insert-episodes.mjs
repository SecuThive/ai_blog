import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://isfzeksbzxtuqymfocqv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[가-힣]+/g, (m) => encodeURIComponent(m).replace(/%/g, '').toLowerCase())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeExcerpt(content) {
  return content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*`\[\]|]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 200) + '…';
}

function readMd(filename) {
  return fs.readFileSync(path.join(__dirname, filename), 'utf-8');
}

const episodes = [
  // ── 엣지 AI 배포 마스터 가이드 ──────────────────────────────────
  {
    file: 'ep-edge-ai-1.md',
    title: '엣지 AI 배포 마스터 가이드 1편: 모델 경량화와 온디바이스 추론',
    published_at: '2026-05-21T14:00:00+09:00',
    tags: ['엣지 AI', '모델 경량화', 'TFLite', 'ONNX', '온디바이스', 'series:엣지 AI 배포 마스터 가이드'],
  },

  // ── AI 에이전트 신뢰성 검증 가이드 ──────────────────────────────
  {
    file: 'ep-agent-reliability-2.md',
    title: 'AI 에이전트 신뢰성 검증 가이드 2편: 실패 감지와 자동 복구 전략',
    published_at: '2026-05-20T17:11:00+09:00',
    tags: ['AI 에이전트', '신뢰성', '장애 감지', '자동 복구', 'series:AI 에이전트 신뢰성 검증 가이드'],
  },
  {
    file: 'ep-agent-reliability-3.md',
    title: 'AI 에이전트 신뢰성 검증 가이드 3편: 프로덕션 모니터링과 SLA 관리',
    published_at: '2026-05-20T17:41:00+09:00',
    tags: ['AI 에이전트', '신뢰성', '모니터링', 'SLA', 'series:AI 에이전트 신뢰성 검증 가이드'],
  },

  // ── 산업 현장 AI 통합 아키텍처 가이드 ──────────────────────────
  {
    file: 'ep-industrial-ai-2.md',
    title: '산업 현장 AI 통합 아키텍처 가이드 2편: 실시간 이상 감지와 예측 유지보수',
    published_at: '2026-05-21T02:11:00+09:00',
    tags: ['산업 AI', 'IIoT', '이상 감지', '예측 유지보수', 'series:산업 현장 AI 통합 아키텍처 가이드'],
  },
  {
    file: 'ep-industrial-ai-3.md',
    title: '산업 현장 AI 통합 아키텍처 가이드 3편: 엣지-클라우드 하이브리드 배포',
    published_at: '2026-05-21T02:41:00+09:00',
    tags: ['산업 AI', 'IIoT', '엣지 컴퓨팅', '하이브리드 배포', 'series:산업 현장 AI 통합 아키텍처 가이드'],
  },

  // ── LLM 프롬프트 엔지니어링 마스터 ─────────────────────────────
  {
    file: 'ep-prompt-eng-2.md',
    title: 'LLM 프롬프트 엔지니어링 마스터 2편: CoT·ToT·ReAct 고급 패턴',
    published_at: '2026-05-21T18:02:00+09:00',
    tags: ['프롬프트 엔지니어링', 'Chain-of-Thought', 'ReAct', 'LLM', 'series:LLM 프롬프트 엔지니어링 마스터'],
  },
  {
    file: 'ep-prompt-eng-3.md',
    title: 'LLM 프롬프트 엔지니어링 마스터 3편: 버전 관리와 A/B 테스트 운영',
    published_at: '2026-05-21T18:32:00+09:00',
    tags: ['프롬프트 엔지니어링', '버전 관리', 'A/B 테스트', 'LLM', 'series:LLM 프롬프트 엔지니어링 마스터'],
  },

  // ── LLM 성능 향상 시리즈 ────────────────────────────────────────
  {
    file: 'ep-llm-perf-2.md',
    title: 'LLM 성능 향상 시리즈 2편: LoRA·QLoRA 파인튜닝 실전 가이드',
    published_at: '2026-05-21T18:57:00+09:00',
    tags: ['LLM', '파인튜닝', 'LoRA', 'QLoRA', 'series:LLM 성능 향상 시리즈'],
  },
  {
    file: 'ep-llm-perf-3.md',
    title: 'LLM 성능 향상 시리즈 3편: 라우팅·앙상블로 비용 70% 절감',
    published_at: '2026-05-21T19:27:00+09:00',
    tags: ['LLM', '라우팅', '앙상블', '비용 최적화', 'series:LLM 성능 향상 시리즈'],
  },

  // ── Enterprise AI Architecture Blueprint ───────────────────────
  {
    file: 'ep-enterprise-ai-2.md',
    title: 'Enterprise AI Architecture Blueprint 2편: 보안 아키텍처와 데이터 분류',
    published_at: '2026-05-22T18:41:00+09:00',
    tags: ['엔터프라이즈 AI', '보안', 'RBAC', 'GDPR', 'series:Enterprise AI Architecture Blueprint'],
  },
  {
    file: 'ep-enterprise-ai-3.md',
    title: 'Enterprise AI Architecture Blueprint 3편: AI 거버넌스와 규제 준수 자동화',
    published_at: '2026-05-22T19:11:00+09:00',
    tags: ['엔터프라이즈 AI', '거버넌스', '규제 준수', 'FinOps', 'series:Enterprise AI Architecture Blueprint'],
  },

  // ── Vector DB 마스터 클래스 ─────────────────────────────────────
  {
    file: 'ep-vector-db-2.md',
    title: 'Vector DB 마스터 클래스 2편: HNSW 인덱스와 하이브리드 검색 최적화',
    published_at: '2026-05-23T01:36:00+09:00',
    tags: ['Vector DB', 'HNSW', '하이브리드 검색', 'BM25', 'series:Vector DB 마스터 클래스'],
  },
  {
    file: 'ep-vector-db-3.md',
    title: 'Vector DB 마스터 클래스 3편: 멀티테넌트 운영과 드리프트 모니터링',
    published_at: '2026-05-23T02:06:00+09:00',
    tags: ['Vector DB', '멀티테넌트', '드리프트 감지', '프로덕션', 'series:Vector DB 마스터 클래스'],
  },

  // ── AI 거버넌스 & MLSecOps 마스터 가이드 ───────────────────────
  {
    file: 'ep-governance-3.md',
    title: 'AI 거버넌스 & MLSecOps 마스터 가이드 3편: CI/CD 보안 자동화와 편향 탐지',
    published_at: '2026-05-24T16:18:00+09:00',
    tags: ['AI 거버넌스', 'MLSecOps', '편향 탐지', '연합 학습', 'series:AI 거버넌스 & MLSecOps 마스터 가이드'],
  },

  // ── LLM 에이전트 심화 마스터 가이드 ────────────────────────────
  {
    file: 'ep-agent-deep-3.md',
    title: 'LLM 에이전트 심화 마스터 가이드 3편: 평가 프레임워크와 멀티 에이전트 운영',
    published_at: '2026-05-25T02:00:00+09:00',
    tags: ['LLM 에이전트', '평가', '멀티 에이전트', 'Human-in-the-Loop', 'series:LLM 에이전트 심화 마스터 가이드'],
  },

  // ── AI 데이터 아키텍처 마스터 가이드 ───────────────────────────
  {
    file: 'ep-data-arch-3.md',
    title: 'AI 데이터 아키텍처 마스터 가이드 3편: 데이터 품질 자동화와 거버넌스',
    published_at: '2026-05-25T02:56:00+09:00',
    tags: ['데이터 아키텍처', '데이터 품질', '리니지', '데이터 메시', 'series:AI 데이터 아키텍처 마스터 가이드'],
  },
];

async function run() {
  let succeeded = 0;
  let failed = 0;

  for (const ep of episodes) {
    const content = readMd(ep.file);
    const slug = slugify(ep.title);
    const excerpt = makeExcerpt(content);

    const post = {
      title: ep.title,
      slug,
      content,
      excerpt,
      category: 'AI & 자동화',
      tags: ep.tags,
      author: 'Content Reviewer',
      agent_role: 'content_reviewer',
      status: 'published',
      views: 0,
      published_at: ep.published_at,
      cover_image: null,
    };

    const { error } = await supabase.from('posts').insert(post);
    if (error) {
      console.error(`❌ FAILED: ${ep.title}`);
      console.error(`   ${error.message}`);
      failed++;
    } else {
      console.log(`✅ OK: ${ep.title}`);
      succeeded++;
    }
  }

  console.log(`\nDone: ${succeeded} inserted, ${failed} failed.`);
}

run().catch(console.error);
