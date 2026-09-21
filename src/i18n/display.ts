import type { Locale } from './config';
import { publicTags, SERIES_DESC } from '@/lib/utils';

export function containsHangul(value: string | null | undefined): boolean {
  return /[가-힣]/.test(value ?? '');
}

const TAG_LABELS: Record<string, string> = {
  'AI에이전트': 'AI agents',
  'AI 에이전트': 'AI agents',
  '프롬프트엔지니어링': 'Prompt engineering',
  '프롬프트 엔지니어링': 'Prompt engineering',
  'AI자동화': 'AI automation',
  'AI 자동화': 'AI automation',
  'AI배포': 'AI deployment',
  'AI 배포': 'AI deployment',
  '벡터DB': 'Vector DB',
  '벡터 DB': 'Vector DB',
  'AI아키텍처': 'AI architecture',
  'AI 아키텍처': 'AI architecture',
  'AI거버넌스': 'AI governance',
  'AI 거버넌스': 'AI governance',
  '엔터프라이즈AI': 'Enterprise AI',
  '엔터프라이즈 AI': 'Enterprise AI',
  'LLM배포': 'LLM deployment',
  'LLM 배포': 'LLM deployment',
  '모델경량화': 'Model compression',
  '모델 경량화': 'Model compression',
  'DOCKER DESKTOP 대안': 'Docker Desktop alternatives',
  '도커 데스크톱 비교': 'Docker Desktop comparison',
  '개인정보': 'Privacy',
  '보안': 'Security',
  '인프라': 'Infrastructure',
  '개발': 'Development',
  '트러블슈팅': 'Troubleshooting',
  '네트워킹': 'Networking',
  '클라우드': 'Cloud',
  '데이터베이스': 'Databases',
  '컨테이너': 'Containers',
};

const SERIES_LABELS: Record<string, string> = {
  'RAG 완전 정복': 'RAG, end to end',
  'LLM 에이전트 마스터 가이드': 'LLM agents master guide',
  '엔터프라이즈 AI 아키텍처 가이드': 'Enterprise AI architecture',
  'LLM 애플리케이션 아키텍처 심화': 'LLM application architecture',
  'AI 시스템 경제성 마스터 가이드': 'AI systems economics',
  'LLMOps 실전 마스터 가이드': 'LLMOps in production',
  'AI 거버넌스 & MLSecOps 마스터 가이드': 'AI governance & MLSecOps',
  'AI 도입 성공을 위한 비즈니스 프레임워크': 'Business framework for AI adoption',
  '엣지 AI 배포 마스터 가이드': 'Edge AI deployment',
  'AI 에이전트 신뢰성 검증 가이드': 'AI agent reliability',
  'Vector DB 마스터 클래스': 'Vector DB master class',
  '산업 현장 AI 통합 아키텍처 가이드': 'Industrial AI architecture',
  'LLM 프롬프트 엔지니어링 마스터': 'LLM prompt engineering',
  'AI 데이터 아키텍처 마스터 가이드': 'AI data architecture',
};

const SERIES_DESC_EN: Record<string, string> = {
  'RAG 완전 정복': 'Retrieval-augmented generation from first principles through production, evaluation, and security.',
  'LLM 에이전트 마스터 가이드': 'Beyond chatbots: designing, evaluating, securing, and orchestrating autonomous agent systems.',
  '엔터프라이즈 AI 아키텍처 가이드': 'Blueprints for taking PoCs to production — legacy integration, governance, and multi-cloud design.',
  'LLM 애플리케이션 아키텍처 심화': 'Gateways, data pipelines, and prompt versioning across every layer of an LLM app.',
  'AI 시스템 경제성 마스터 가이드': 'Architecture patterns that keep LLM costs in check: model choice, latency, and ROI.',
  'LLMOps 실전 마스터 가이드': 'Shipping LLMs as a reliable service: deploy, monitor, and tune latency.',
  'AI 거버넌스 & MLSecOps 마스터 가이드': 'Technical governance for compliance, audit trails, abuse detection, and security automation.',
  'AI 도입 성공을 위한 비즈니스 프레임워크': 'Turn adoption into outcomes: KPIs, change management, and process diagnosis.',
  '엣지 AI 배포 마스터 가이드': 'On-device inference and model compression: quantization, TFLite, and realtime streams.',
  'AI 에이전트 신뢰성 검증 가이드': 'Detect failures, recover automatically, and hold SLAs for non-deterministic agents.',
  'Vector DB 마스터 클래스': 'HNSW indexes, hybrid search, and multi-tenant operations for large-scale AI search.',
  '산업 현장 AI 통합 아키텍처 가이드': 'AI-OT gateways, realtime anomaly detection, and edge-cloud hybrids for IIoT.',
  'LLM 프롬프트 엔지니어링 마스터': 'CoT, ToT, ReAct, A/B tests, and versioning — treating prompts as engineering.',
  'AI 데이터 아키텍처 마스터 가이드': 'Data products, Data Mesh, and automated quality for AI-ready infrastructure.',
};

export function tagLabel(tag: string, locale: Locale): string | null {
  if (locale !== 'en') return tag;
  if (TAG_LABELS[tag]) return TAG_LABELS[tag];
  if (containsHangul(tag)) return null;
  return tag;
}

export function visiblePublicTags(
  tags: string[] | null | undefined,
  locale: Locale,
): { raw: string; label: string }[] {
  return publicTags(tags ?? [])
    .map((raw) => {
      const label = tagLabel(raw, locale);
      return label ? { raw, label } : null;
    })
    .filter((t): t is { raw: string; label: string } => t !== null);
}

export function seriesLabel(name: string, locale: Locale): string {
  if (locale !== 'en') return name;
  return SERIES_LABELS[name] ?? (containsHangul(name) ? 'Series' : name);
}

export function seriesDescription(name: string, locale: Locale): string {
  if (locale !== 'en') return SERIES_DESC[name] ?? `${name} 시리즈의 심층 연재.`;
  return SERIES_DESC_EN[name] ?? `${seriesLabel(name, locale)} — a multi-part deep dive.`;
}

export function pickLocalizedText(
  locale: Locale,
  original: string | null | undefined,
  translated: string | null | undefined,
): string {
  if (locale !== 'en') return original ?? '';
  const en = translated?.trim();
  if (en) return en;
  return original ?? '';
}
