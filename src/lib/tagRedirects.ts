/**
 * 태그 통합(2026-07-16)으로 canonical 태그에 흡수된 변형 태그 → 대표 태그 매핑.
 * 병합으로 글이 0이 된 (구)색인 태그 URL을 canonical 태그로 308(영구) 리다이렉트해
 * 링크 가치를 이전하고 중복/빈 태그 페이지 색인을 방지한다.
 * (생성: scripts/merge-tags-2026-07-16.mjs → scripts/tag-redirects-2026-07-16.json)
 */
export const TAG_REDIRECTS: Record<string, string> = {
  'AI 에이전트': 'AI에이전트',
  '프롬프트 엔지니어링': '프롬프트엔지니어링',
  'AI 자동화': 'AI자동화',
  'networkpolicy': 'NetworkPolicy',
  'AI 배포': 'AI배포',
  'VectorDB': '벡터DB',
  '벡터 DB': '벡터DB',
  'AI 아키텍처': 'AI아키텍처',
  'LLM Agent': 'LLMAgent',
  'AI 거버넌스': 'AI거버넌스',
  'devops': 'DevOps',
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  '엔터프라이즈 AI': '엔터프라이즈AI',
  'ServiceMesh': 'Service Mesh',
  'ResponsibleAI': 'Responsible AI',
  'LLM 배포': 'LLM배포',
  '모델 경량화': '모델경량화',
};
