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
    title: '편집 운영과 원칙',
    lead: 'Nodelog의 글 대부분은 AI 도구로 초안을 만들었습니다. 발행과 수정은 운영자가 결정하며, 글별로 사람이 확인한 범위는 기록이 있는 글에만 표시합니다.',
    description: 'Nodelog 편집의 담당 범위와 AI 보조 도구 활용, 검토, 정정 및 발행 기준을 공개합니다.',
    statsGuides: '{count}편',
    statsGuidesLabel: '엔지니어 가이드',
    statsAreas: '{count}개 영역',
    statsTopCat: '{count}개 카테고리 중 최다',
    aiTitle: 'AI 보조 도구',
    aiBody: '주제 조사, 글의 구조화, 초안 작성, 관련 글 매칭에 AI 도구를 씁니다. 공개된 글 대부분이 AI 초안에서 출발했습니다. 발행 여부와 수정 범위는 운영자가 결정합니다.',
    aiRows: [
      { k: '주요 역할', v: '조사 보조 · 구조화 · 초안 작성' },
      { k: '공개 결정', v: '운영자 결정' },
      { k: '모델', v: '작업에 따라 변경', mono: true },
    ],
    editorTitle: '편집자',
    editorBody: '운영자가 발행 여부를 정하고, 오류 제보와 공식 문서 변경을 확인해 기존 글을 정정·보강합니다. 모든 글의 명령어와 수치를 사람이 실행·대조한 것은 아닙니다. 사람이 확인한 날짜와 범위는 글 하단의 검증 기록에만 표시하며, 기록이 없는 글은 확인 기록이 없는 상태입니다.',
    editorRows: [
      { k: '담당', v: 'Nodelog 운영자' },
      { k: '주요 역할', v: '자료 확인 · 편집 · 발행 판단' },
      { k: '정정 문의', v: 'thive@thivelab.com' },
    ],
    teamTitle: 'Nodelog 편집',
    teamLead: '특정 개인의 경력을 내세우지 않습니다. 대신 어떤 범위를 다루고, 검토할 때 무엇을 확인하며, 그 기록을 어떻게 공개하는지 밝힙니다.',
    areasLabel: '검토 분야',
    checksLabel: '검토할 때 확인하는 항목(글별 기록이 있는 경우)',
    opsLabel: '콘텐츠 운영',
    opsBody: '2026년 7월 31일부터 글 등록 API는 발행 승인과 담당자 이름이 없으면 초안으로 보류합니다. 그 이전 글과 운영자 스크립트로 일괄 등록된 글에는 글별 검토 기록이 없습니다. 출처·확인일·확인 범위는 실제 기록이 있는 글에만 표시합니다.',
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
      { t: '운영자 확인', s: 'Human · 범위 기록', tone: 'mint', icon: '🔍', desc: '확인한 범위만 검증 기록으로 남김' },
      { t: '발행 & 개선', s: 'Operator decision', tone: 'amber', icon: '🚀', desc: '운영자의 발행 결정과 발행 후 정정·보강' },
    ],
    principles: [
      { icon: '🔍', t: '투명성', d: '글 대부분이 AI 초안에서 출발했다는 사실과, 사람이 확인한 범위가 글마다 다르다는 점을 공개합니다.' },
      { icon: '✅', t: '사실 확인', d: '확인한 글에는 확인일·범위·출처를 남기고, 확인하지 않은 것을 확인했다고 쓰지 않습니다. 오류 제보는 확인 후 정정합니다.' },
      { icon: '🚫', t: '사람의 발행 결정', d: '발행과 비공개·수정은 운영자가 결정합니다. 글별 검토 기록이 없는 과거 글은 순차적으로 점검합니다.' },
      { icon: '📚', t: '출처 연결', d: '관련 공식 문서·1차 출처를 글과 함께 안내하는 것을 원칙으로 하며, 미비한 글은 순차적으로 보강하고 있습니다.' },
    ],
  },
  en: {
    title: 'Editorial process and standards',
    lead: 'Most Nodelog articles started as AI-generated drafts. The site operator decides what is published and changed, and a human check is shown only on articles that have a recorded check.',
    description: 'The Nodelog’s editorial scope, how AI is used, and the standards for review, correction, and publication.',
    statsGuides: '{count} guides',
    statsGuidesLabel: 'Engineer guides',
    statsAreas: '{count} areas',
    statsTopCat: 'Most-covered of {count} categories',
    aiTitle: 'AI assistance',
    aiBody: 'AI tools are used for topic research, structure, first drafts, and related-piece matching. Most published articles started from an AI draft. The operator decides what goes live and what to change.',
    aiRows: [
      { k: 'Role', v: 'Research · structure · draft' },
      { k: 'Publish decision', v: 'By the site operator' },
      { k: 'Models', v: 'Varies by task', mono: true },
    ],
    editorTitle: 'Editors',
    editorBody: 'The operator decides what to publish and uses reader reports and official-doc changes to correct and expand existing pieces. Not every command or figure has been run or checked by a person. The date and scope of a human check appear only in an article’s verification record; articles without one have no recorded check.',
    editorRows: [
      { k: 'Who', v: 'Nodelog site operator' },
      { k: 'Role', v: 'Source check · edit · publish' },
      { k: 'Corrections', v: 'thive@thivelab.com' },
    ],
    teamTitle: 'Nodelog editorial',
    teamLead: 'We do not lean on personal credentials. Instead we state what we cover, what we check when we review, and how that record is published.',
    areasLabel: 'Areas we review',
    checksLabel: 'What a recorded check covers',
    opsLabel: 'How content is run',
    opsBody: 'Since 31 July 2026 the posting API holds a post as a draft unless publication is approved with a named reviewer. Earlier posts and posts bulk-inserted by operator scripts have no per-article review record. Sources, check dates and scope are shown only where a real record exists.',
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
      { t: 'Operator check', s: 'Human · recorded scope', tone: 'mint', icon: '🔍', desc: 'Only what was checked is recorded' },
      { t: 'Publish & improve', s: 'Operator decision', tone: 'amber', icon: '🚀', desc: 'The operator publishes, then we correct and expand' },
    ],
    principles: [
      { icon: '🔍', t: 'Transparency', d: 'We say in the open that most articles started as AI drafts and that the scope of human checking differs by article.' },
      { icon: '✅', t: 'Fact checking', d: 'Checked articles carry a check date, scope and sources; we do not claim checks we did not do. Reports are corrected after confirmation.' },
      { icon: '🚫', t: 'Human publish decision', d: 'The operator decides what is published, unpublished or changed. Older articles without a review record are being checked over time.' },
      { icon: '📚', t: 'Source links', d: 'We aim to put official docs and primary sources next to the piece, and we strengthen older pages that fall short.' },
    ],
  },
};

export function getAuthor(locale: Locale): AuthorCopy {
  return AUTHOR[locale] ?? AUTHOR.ko;
}
