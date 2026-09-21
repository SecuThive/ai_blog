import type { Locale } from '../config';

export interface AboutCopy {
  stats: { num: string; label: string; sub: string }[];
  missionTitle: string;
  missionLead: string;
  missionBody: string;
  howTitle: string;
  steps: { n: string; t: string; d: string }[];
  principlesTitle: string;
  principles: { t: string; d: string }[];
}

const ABOUT: Record<Locale, AboutCopy> = {
  ko: {
    stats: [
      { num: 'PRACTICAL', label: 'TECHNICAL GUIDES', sub: 'Linux · Docker · Network · Security' },
      { num: 'REVIEWED', label: 'EDITORIAL PROCESS', sub: '자료 확인 · 문맥 검토 · 발행 판단' },
      { num: 'UPDATED', label: 'LIVING CONTENT', sub: '오류 정정 · 문서 변경 반영 · 지속 보강' },
    ],
    missionTitle: '미션',
    missionLead: '실무자가 신뢰할 수 있는 IT 정보를 만드는 것. 정보의 양이 아니라 맥락의 밀도를 높이는 것.',
    missionBody: 'AI 도구는 자료 조사와 정리를 보조할 수 있지만, 어떤 신호가 중요한지와 어떤 문장이 오해를 부르는지를 판단하는 일은 사람의 몫이라고 믿습니다. Nodelog는 그 협업 방식을 가장 단순하고 정직하게 보여주는 미디어를 지향합니다.',
    howTitle: '운영 방식',
    steps: [
      { n: '01', t: '주제 선정', d: '공식 문서·릴리스 노트·기술 자료와 독자 검색 수요를 바탕으로 다룰 주제를 정합니다.' },
      { n: '02', t: '자료 확인', d: '주제와 직접 관련된 1차 자료를 우선 확인하고 글의 범위와 핵심 질문을 정리합니다.' },
      { n: '03', t: '초안 준비', d: 'AI 도구를 구조화와 초안 작성의 보조 수단으로 활용하고, 참고 자료는 편집 과정에서 다시 확인합니다.' },
      { n: '04', t: '편집 검토', d: '사실관계·명령어·표현·문맥을 점검하고 불확실하거나 근거가 약한 문장을 수정합니다.' },
      { n: '05', t: '발행', d: '카테고리·시리즈·태그·관련 글 자동 연결. 메타데이터 색인.' },
      { n: '06', t: '보강', d: '오류 제보와 문서 변경을 확인해 필요한 글을 정정하거나 보강합니다.' },
    ],
    principlesTitle: '편집 원칙',
    principles: [
      { t: '출처를 확인합니다', d: '핵심 주장에 필요한 공식 문서와 1차 자료를 우선 연결하고, 미비한 기존 글은 순차 보강합니다.' },
      { t: '한계를 함께 적습니다', d: '환경과 버전에 따라 결과가 달라질 수 있는 내용은 적용 조건과 확인 방법을 함께 안내합니다.' },
      { t: '광고는 본문과 섞지 않습니다', d: '제휴 콘텐츠는 별도의 표식과 색상으로 명확히 구분합니다.' },
      { t: '실패도 다룹니다', d: '도입에 실패한 도구, 잘못된 판단의 회고를 거르지 않습니다.' },
    ],
  },
  en: {
    stats: [
      { num: 'PRACTICAL', label: 'TECHNICAL GUIDES', sub: 'Linux · Docker · Network · Security' },
      { num: 'REVIEWED', label: 'EDITORIAL PROCESS', sub: 'Source check · context review · publish decision' },
      { num: 'UPDATED', label: 'LIVING CONTENT', sub: 'Corrections · doc changes · ongoing expansion' },
    ],
    missionTitle: 'Mission',
    missionLead: 'Make IT information practitioners can trust. Raise the density of context, not the volume of information.',
    missionBody: 'AI can help with research and organization. Deciding which signals matter, and which sentences will mislead, is still a human job. Nodelog aims to show that collaboration as simply and honestly as possible.',
    howTitle: 'How we work',
    steps: [
      { n: '01', t: 'Pick the topic', d: 'We choose topics from official docs, release notes, technical sources, and what readers actually search for.' },
      { n: '02', t: 'Check the sources', d: 'We start with primary sources that speak directly to the topic, then set the scope and the core questions.' },
      { n: '03', t: 'Draft', d: 'AI tools help with structure and a first draft. Sources are checked again during editing.' },
      { n: '04', t: 'Editorial review', d: 'We check facts, commands, wording, and context, and we rewrite claims that are weak or unclear.' },
      { n: '05', t: 'Publish', d: 'Category, series, tags, and related pieces are connected. Metadata is indexed.' },
      { n: '06', t: 'Keep it current', d: 'We correct or expand pieces when readers report errors or upstream docs change.' },
    ],
    principlesTitle: 'Editorial principles',
    principles: [
      { t: 'Check the source', d: 'We attach official docs and primary sources to the claims that need them, and we strengthen older pieces that fall short.' },
      { t: 'Write the limits down', d: 'If the result depends on environment or version, we include the conditions and how to verify.' },
      { t: 'Keep ads out of the copy', d: 'Partner content is marked and colored so it cannot be mistaken for editorial.' },
      { t: 'Cover failure too', d: 'We do not skip tools that failed, or retrospectives on bad calls.' },
    ],
  },
};

export function getAbout(locale: Locale): AboutCopy {
  return ABOUT[locale] ?? ABOUT.ko;
}
