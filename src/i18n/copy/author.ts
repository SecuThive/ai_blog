import type { Locale } from '../config';

export interface AuthorCopy {
  title: string;
  lead: string;
  description: string;
  statsGuides: string;
  statsGuidesLabel: string;
  statsAreas: string;
  statsTopCat: string;
  aiTitle: string;
  aiBody: string;
  aiRows: { k: string; v: string; mono?: boolean }[];
  editorTitle: string;
  editorBody: string;
  editorRows: { k: string; v: string }[];
  teamTitle: string;
  teamLead: string;
  areasLabel: string;
  checksLabel: string;
  opsLabel: string;
  opsBody: string;
  pipelineTitle: string;
  principlesTitle: string;
  penName: string;
  reviewsLabel: string;
  profileLabel: string;
  areas: string[];
  checks: string[];
  stages: { t: string; s: string; tone: string; icon: string; desc: string }[];
  principles: { icon: string; t: string; d: string }[];
}

const AUTHOR: Record<Locale, AuthorCopy> = {
  ko: {
    title: '편집팀과 운영 원칙',
    lead: 'Nodelog는 자료 조사와 초안 작성에 AI 도구를 보조적으로 활용하며, 공개 여부와 수정 범위는 사람이 결정합니다.',
    description: 'Nodelog 기술 편집팀의 담당 범위와 AI 보조 도구 활용, 검토, 정정 및 발행 기준을 공개합니다.',
    statsGuides: '{count}편',
    statsGuidesLabel: '엔지니어 가이드',
    statsAreas: '{count}개 영역',
    statsTopCat: '{count}개 카테고리 중 최다',
    aiTitle: 'AI 보조 도구',
    aiBody: '주제 조사와 글의 구조화, 초고 작성, 관련 글 매칭을 돕는 AI 도구입니다. 최종 공개 여부와 수정 범위는 사람이 판단합니다.',
    aiRows: [
      { k: '주요 역할', v: '조사 보조 · 구조화 · 초안' },
      { k: '공개 결정', v: '사람 편집 검토 후' },
      { k: '모델', v: '작업에 따라 변경', mono: true },
    ],
    editorTitle: '편집자',
    editorBody: '운영자가 발행 전 초안을 읽고 사실관계, 명령어, 문맥과 표현을 점검합니다. 오류 제보와 공식 문서 변경 사항도 확인해 기존 글을 보강합니다.',
    editorRows: [
      { k: '역할', v: 'Nodelog 기술 편집팀' },
      { k: '주요 역할', v: '자료 확인 · 편집 · 발행 판단' },
      { k: '정정 문의', v: 'thive8564@gmail.com' },
    ],
    teamTitle: 'Nodelog 기술 편집팀',
    teamLead: '특정 개인의 이력이 아니라, Nodelog의 기술 편집 검토가 어떤 범위와 기준으로 이뤄지는지 공개합니다.',
    areasLabel: '검토 분야',
    checksLabel: '검토 항목',
    opsLabel: '콘텐츠 운영',
    opsBody: 'AI가 자료 조사와 초안 작성을 보조하고, 최종 공개 여부와 수정 범위는 사람 편집자가 결정합니다. 각 글 하단에 편집 검토 표기와 관련 공식 문서를 함께 제공합니다.',
    pipelineTitle: '협업 파이프라인',
    principlesTitle: '편집 원칙',
    penName: '필명',
    reviewsLabel: '주로 검토',
    profileLabel: '프로필',
    areas: ['Linux · 서버', '네트워크', '데이터베이스', '보안 · 인증', '컨테이너 · 클라우드', 'AI · 자동화'],
    checks: ['공식 문서 대조', '명령어 · 설정 검증', '버전 · 환경 조건', '적용 조건 · 주의점', '보안 위험'],
    stages: [
      { t: '소스 추적', s: '공식 문서 · 기술 소스', tone: 'blue', icon: '🌐', desc: '주요 기술 소스·공식 문서 변화 추적' },
      { t: '자료 정리', s: 'AI-assisted', tone: 'purple', icon: '📊', desc: '자료 조사와 콘텐츠 구조화 보조' },
      { t: '초안 준비', s: 'Draft assistance', tone: 'purple', icon: '✍️', desc: '편집을 위한 기술 콘텐츠 초안 준비' },
      { t: '편집자 검토', s: 'Human · 사실/톤', tone: 'mint', icon: '🔍', desc: '사실 확인·톤·맥락 검토' },
      { t: '발행 & 개선', s: 'Editorial review', tone: 'amber', icon: '🚀', desc: '사람의 발행 판단과 발행 후 정정·보강' },
    ],
    principles: [
      { icon: '🔍', t: '투명성', d: 'AI 도구를 조사·구조화·초안 작성의 보조 수단으로 활용하고 사람이 편집 검토한다는 운영 방식을 공개합니다.' },
      { icon: '✅', t: '사실 확인', d: '핵심 사실과 명령어를 관련 문서와 대조하고, 오류 제보를 받으면 확인 후 정정합니다.' },
      { icon: '🚫', t: '사람의 발행 판단', d: 'AI 도구의 결과물을 그대로 공개하지 않고, 공개 여부와 수정 범위를 사람이 결정합니다.' },
      { icon: '📚', t: '출처 연결', d: '관련 공식 문서·1차 출처를 글과 함께 안내하는 것을 원칙으로 하며, 미비한 글은 순차적으로 보강하고 있습니다.' },
    ],
  },
  en: {
    title: 'Editorial team and standards',
    lead: 'Nodelog uses AI tools to assist research and drafting. A person decides what is published and what to change.',
    description: 'The Nodelog editorial team’s scope, how AI is used, and the standards for review, correction, and publication.',
    statsGuides: '{count} guides',
    statsGuidesLabel: 'Engineer guides',
    statsAreas: '{count} areas',
    statsTopCat: 'Most-covered of {count} categories',
    aiTitle: 'AI assistance',
    aiBody: 'AI tools help with topic research, structure, first drafts, and related-piece matching. A person still decides what goes live and what to change.',
    aiRows: [
      { k: 'Role', v: 'Research · structure · draft' },
      { k: 'Publish decision', v: 'After human review' },
      { k: 'Models', v: 'Varies by task', mono: true },
    ],
    editorTitle: 'Editors',
    editorBody: 'An editor reads the draft before publication and checks facts, commands, context, and wording. Reader reports and official-doc changes are used to expand existing pieces.',
    editorRows: [
      { k: 'Who', v: 'Nodelog editorial team' },
      { k: 'Role', v: 'Source check · edit · publish' },
      { k: 'Corrections', v: 'thive8564@gmail.com' },
    ],
    teamTitle: 'Nodelog editorial team',
    teamLead: 'This is not a personal resume. It is the scope and standard of Nodelog’s technical review.',
    areasLabel: 'Areas we review',
    checksLabel: 'What we check',
    opsLabel: 'How content is run',
    opsBody: 'AI assists research and drafting. A human editor decides whether to publish and what to change. Each piece carries an editorial-review note and related official docs.',
    pipelineTitle: 'How we collaborate',
    principlesTitle: 'Editorial principles',
    penName: 'Pen name',
    reviewsLabel: 'Usually reviews',
    profileLabel: 'Profile',
    areas: ['Linux · servers', 'Networking', 'Databases', 'Security · identity', 'Containers · cloud', 'AI · automation'],
    checks: ['Official-doc check', 'Command · config check', 'Version · environment', 'Limits · cautions', 'Security risk'],
    stages: [
      { t: 'Track sources', s: 'Official docs · technical sources', tone: 'blue', icon: '🌐', desc: 'Watch the docs and sources that matter' },
      { t: 'Organize', s: 'AI-assisted', tone: 'purple', icon: '📊', desc: 'Help with research and structure' },
      { t: 'Draft', s: 'Draft assistance', tone: 'purple', icon: '✍️', desc: 'Prepare a technical draft for editing' },
      { t: 'Editor review', s: 'Human · facts / tone', tone: 'mint', icon: '🔍', desc: 'Facts, tone, and context' },
      { t: 'Publish & improve', s: 'Editorial review', tone: 'amber', icon: '🚀', desc: 'A person publishes, then we correct and expand' },
    ],
    principles: [
      { icon: '🔍', t: 'Transparency', d: 'We say in the open that AI assists research, structure, and drafting, and that a person does the editorial review.' },
      { icon: '✅', t: 'Fact checking', d: 'We check key facts and commands against the relevant docs, and we correct after confirming a report.' },
      { icon: '🚫', t: 'Human publish decision', d: 'We do not publish AI output as-is. A person decides what goes live and what to change.' },
      { icon: '📚', t: 'Source links', d: 'We aim to put official docs and primary sources next to the piece, and we strengthen older pages that fall short.' },
    ],
  },
};

export function getAuthor(locale: Locale): AuthorCopy {
  return AUTHOR[locale] ?? AUTHOR.ko;
}
