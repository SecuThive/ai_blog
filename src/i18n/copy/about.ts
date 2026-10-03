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
      { num: 'EDITORIAL', label: 'CONTENT PROCESS', sub: '자료 확인 · 정정 · 출처 보강' },
      { num: 'UPDATED', label: 'LIVING CONTENT', sub: '오류 정정 · 문서 변경 반영 · 지속 보강' },
    ],
    missionTitle: '미션',
    missionLead: '실무자가 신뢰할 수 있는 IT 정보를 만드는 것. 정보의 양이 아니라 맥락의 밀도를 높이는 것.',
    missionBody: 'AI 도구는 자료 조사와 정리를 보조할 수 있지만, 어떤 신호가 중요한지와 어떤 문장이 오해를 부르는지를 판단하는 일은 사람의 몫이라고 믿습니다. Nodelog는 그 협업 방식을 가장 단순하고 정직하게 보여주는 미디어를 지향합니다.',
    howTitle: '운영 방식',
    steps: [
      { n: '01', t: '주제 선정', d: '공식 문서·릴리스 노트·기술 자료와 독자 검색 수요를 바탕으로 다룰 주제를 정합니다.' },
      { n: '02', t: '자료 확인', d: '주제와 직접 관련된 1차 자료를 우선 확인하고 글의 범위와 핵심 질문을 정리합니다.' },
      { n: '03', t: '초안 준비', d: '대부분의 초안은 AI 도구로 작성합니다. 초안에 들어간 주장과 수치는 그대로 사실로 간주하지 않습니다.' },
      { n: '04', t: '확인과 기록', d: '운영자가 확인한 글에는 확인일·범위·출처를 검증 기록으로 남깁니다. 기록이 없는 글은 사람이 확인한 기록이 없는 상태이며, 과거 글은 순차 점검 중입니다.' },
      { n: '05', t: '발행', d: '운영자가 발행을 결정합니다. 카테고리·시리즈·태그·관련 글은 자동으로 연결됩니다.' },
      { n: '06', t: '보강', d: '오류 제보와 문서 변경을 확인해 필요한 글을 정정하거나 보강합니다.' },
    ],
    principlesTitle: '편집 원칙',
    principles: [
      { t: '출처를 확인합니다', d: '핵심 주장에 필요한 공식 문서와 1차 자료를 우선 연결하고, 미비한 기존 글은 순차 보강합니다.' },
      { t: '한계를 함께 적습니다', d: '환경과 버전에 따라 결과가 달라질 수 있는 내용은 적용 조건과 확인 방법을 함께 안내합니다.' },
      { t: '광고는 본문과 섞지 않습니다', d: '광고는 본문·메뉴·버튼과 혼동되지 않게 배치합니다. 현재 후원·제휴 글은 없으며, 생기면 상단에 명확히 표시합니다.' },
      { t: '틀린 것은 고칩니다', d: '오류나 오래된 정보가 확인되면 정정하고, 실질적 변경에는 변경 요약과 날짜를 남깁니다. 기준 시점이 지난 글은 그 시점의 자료임을 표시합니다.' },
    ],
  },
  en: {
    stats: [
      { num: 'PRACTICAL', label: 'TECHNICAL GUIDES', sub: 'Linux · Docker · Network · Security' },
      { num: 'EDITORIAL', label: 'CONTENT PROCESS', sub: 'Source checks · corrections · citation updates' },
      { num: 'UPDATED', label: 'LIVING CONTENT', sub: 'Corrections · doc changes · ongoing expansion' },
    ],
    missionTitle: 'Mission',
    missionLead: 'Make IT information practitioners can trust. Raise the density of context, not the volume of information.',
    missionBody: 'AI can help with research and organization. Deciding which signals matter, and which sentences will mislead, is still a human job. Nodelog aims to show that collaboration as simply and honestly as possible.',
    howTitle: 'How we work',
    steps: [
      { n: '01', t: 'Pick the topic', d: 'We choose topics from official docs, release notes, technical sources, and what readers actually search for.' },
      { n: '02', t: 'Check the sources', d: 'We start with primary sources that speak directly to the topic, then set the scope and the core questions.' },
      { n: '03', t: 'Draft', d: 'Most drafts are written with AI tools. Claims and figures in a draft are not treated as facts.' },
      { n: '04', t: 'Check and record', d: 'When the operator checks an article, the date, scope and sources are kept as a verification record. Articles without one have no recorded human check; older ones are being reviewed over time.' },
      { n: '05', t: 'Publish', d: 'The operator decides to publish. Category, series, tags and related pieces are linked automatically.' },
      { n: '06', t: 'Keep it current', d: 'We correct or expand pieces when readers report errors or upstream docs change.' },
    ],
    principlesTitle: 'Editorial principles',
    principles: [
      { t: 'Check the source', d: 'We attach official docs and primary sources to the claims that need them, and we strengthen older pieces that fall short.' },
      { t: 'Write the limits down', d: 'If the result depends on environment or version, we include the conditions and how to verify.' },
      { t: 'Keep ads out of the copy', d: 'Ads are placed so they cannot be mistaken for article text, menus or buttons. There is no sponsored or affiliate content today; if there is, it will be labeled at the top.' },
      { t: 'Fix what is wrong', d: 'Confirmed errors and outdated facts are corrected, with a change summary and date for substantive changes. Articles past their reference date are labeled as such.' },
    ],
  },
};

export function getAbout(locale: Locale): AboutCopy {
  return ABOUT[locale] ?? ABOUT.ko;
}
