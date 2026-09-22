import type { Metadata } from 'next';

export function catTone(cat: string | null | undefined): string {
  if (!cat) return 'blue';
  if (cat.includes('AI') || cat.includes('자동화')) return 'blue';
  if (cat.includes('트렌드') || cat.includes('IT')) return 'purple';
  if (cat.includes('개발') || cat.includes('인프라')) return 'mint';
  if (cat.includes('툴') || cat.includes('리뷰')) return 'amber';
  if (cat.includes('보안')) return 'rose';
  return 'blue';
}

export function engCatTone(cat: string): string {
  if (cat.startsWith('Linux') || cat.startsWith('OS')) return 'mint';
  if (cat.startsWith('Docker') || cat.startsWith('클라우드')) return 'blue';
  if (cat.startsWith('Git')) return 'purple';
  if (cat.startsWith('네트워킹') || cat.startsWith('데이터베이스')) return 'amber';
  if (cat.startsWith('보안')) return 'rose';
  if (cat.startsWith('트러블슈팅')) return 'orange';
  return 'blue';
}

export function diffLabel(d: string, locale: 'ko' | 'en' = 'ko'): string {
  if (locale === 'en') {
    if (d === 'intermediate') return 'Intermediate';
    if (d === 'advanced') return 'Advanced';
    return 'Beginner';
  }
  if (d === 'intermediate') return '중급';
  if (d === 'advanced') return '고급';
  return '초급';
}

export function toneForSeries(name: string): string {
  if (name.includes('거버넌스') || name.includes('MLSecOps') || name.includes('신뢰성') || name.includes('보안')) return 'rose';
  if (name.includes('경제') || name.includes('비즈니스') || name.includes('도입') || name.includes('산업') || name.includes('엔터프라이즈')) return 'amber';
  if (name.includes('에이전트') || name.includes('Agent') || name.includes('프롬프트')) return 'purple';
  if (name.includes('LLMOps') || name.includes('MLOps') || name.includes('아키텍처') || name.includes('데이터') || name.includes('엣지')) return 'mint';
  if (name.includes('RAG') || name.includes('벡터') || name.includes('Vector')) return 'blue';
  return 'blue';
}

export const SERIES_DESC: Record<string, string> = {
  'RAG 완전 정복': 'LLM 환각을 줄이는 검색 증강 생성. 원리부터 프로덕션 운영·평가·보안까지.',
  'LLM 에이전트 마스터 가이드': '챗봇을 넘어 도구를 쓰는 에이전트 시스템. 설계·평가·보안·오케스트레이션.',
  '엔터프라이즈 AI 아키텍처 가이드': 'PoC를 프로덕션으로 만드는 기업용 AI 청사진. 레거시 통합, 거버넌스, 멀티클라우드.',
  'LLM 애플리케이션 아키텍처 심화': '게이트웨이, 데이터 파이프라인, 프롬프트 버전 관리 등 LLM 앱 계층.',
  'AI 시스템 경제성 마스터 가이드': 'LLM 비용을 잡는 아키텍처 패턴. 모델 선택, 지연, ROI 측정.',
  'LLMOps 실전 마스터 가이드': 'LLM을 서비스로 운영하기. 배포·모니터링·레이턴시 최적화.',
  'AI 거버넌스 & MLSecOps 마스터 가이드': '컴플라이언스, 감사 추적, 편향 탐지, 보안 자동화를 위한 거버넌스.',
  'AI 도입 성공을 위한 비즈니스 프레임워크': '도입을 성과로 연결하는 KPI·변화 관리·프로세스 진단.',
  '엣지 AI 배포 마스터 가이드': '온디바이스 추론과 모델 경량화. 양자화·TFLite·스트림 파이프라인.',
  'AI 에이전트 신뢰성 검증 가이드': '장애 감지, 자동 복구, SLA. 비결정성 제어 패턴.',
  'Vector DB 마스터 클래스': 'HNSW, 하이브리드 검색, 멀티테넌트 운영 등 검색 인프라.',
  '산업 현장 AI 통합 아키텍처 가이드': 'AI-OT 게이트웨이, 이상 감지, 엣지-클라우드 하이브리드.',
  'LLM 프롬프트 엔지니어링 마스터': 'CoT·ToT·ReAct, A/B 테스트, 버전 관리 — 프롬프트를 엔지니어링으로.',
  'AI 데이터 아키텍처 마스터 가이드': '데이터 제품화, Data Mesh, 품질 자동화.',
};

/** Homepage/series UI display names (DB series: tags stay unchanged). */
export const SERIES_DISPLAY: Record<string, string> = {
  'RAG 완전 정복': 'RAG 시리즈',
  'LLM 에이전트 마스터 가이드': 'LLM 에이전트',
  'AI 시스템 경제성 마스터 가이드': 'AI 시스템 경제성',
  'LLMOps 실전 마스터 가이드': 'LLMOps 실전',
  'AI 거버넌스 & MLSecOps 마스터 가이드': 'AI 거버넌스 & MLSecOps',
  '엣지 AI 배포 마스터 가이드': '엣지 AI 배포',
  'Vector DB 마스터 클래스': 'Vector DB',
  'LLM 프롬프트 엔지니어링 마스터': 'LLM 프롬프트 엔지니어링',
  'AI 데이터 아키텍처 마스터 가이드': 'AI 데이터 아키텍처',
};

// 기사(상세) 페이지가 generateMetadata로 루트 metadata를 덮어쓸 때 robots가
// 유실되지 않도록 명시적으로 부여하는 기본값 — 큰 썸네일·긴 스니펫 허용.
export const DEFAULT_ROBOTS: Metadata['robots'] = {
  index: true,
  follow: true,
  googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
};

// 조회수가 이 값 미만이면 UI에 노출하지 않는다 — '1 조회'처럼 빈약해 보이는
// 수치를 숨겨 체감 품질 저하를 막는다. (실제 카운트는 계속 누적됨)
export const MIN_DISPLAY_VIEWS = 100;

// series:/ep: 는 시리즈 회차 관리용 내부 태그 — 노출용(표시·keywords·JSON-LD)에서 제외한다.
export function publicTags(tags: string[]): string[] {
  return (tags ?? []).filter(t =>
    !t.startsWith('series:')
    && !t.startsWith('ep:')
    && !t.startsWith('i18n.')
    // 슬래시는 단일 동적 세그먼트를 둘로 나눠 내부 404를 만든다.
    && !t.includes('/')
  );
}
