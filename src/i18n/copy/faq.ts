import type { Locale } from '../config';

export interface FaqItem {
  q: string;
  a: string;
  category: string;
}

export interface FaqCategory {
  id: string;
  label: string;
  icon: string;
}

export interface FaqCopy {
  lead: string;
  allLabel: string;
  emptyTitle: string;
  emptyLead: string;
  contactCta: string;
  categories: FaqCategory[];
  items: FaqItem[];
}

const FAQ: Record<Locale, FaqCopy> = {
  ko: {
    lead: 'Nodelog 운영 방식과 사용법에 대해 가장 많이 받는 질문들을 정리했습니다.',
    allLabel: '전체',
    emptyTitle: '찾으시는 답이 없나요?',
    emptyLead: '직접 문의해주시면 빠르게 답변드립니다.',
    contactCta: '문의하기',
    categories: [
      { id: 'service', label: '서비스 소개', icon: '🗺' },
      { id: 'content', label: '콘텐츠 & AI 운영', icon: '🤖' },
      { id: 'newsletter', label: '뉴스레터 & 구독', icon: '📬' },
      { id: 'etc', label: '오류 & 문의', icon: '💬' },
    ],
    items: [
      {
        category: 'service',
        q: '이 블로그는 어떤 주제를 다루나요?',
        a: 'AI & 자동화, IT 트렌드, 개발, 툴 리뷰, 보안, 인프라 6개 카테고리를 중심으로 운영됩니다. LLM·RAG·에이전트 아키텍처, 백엔드 개발, DevOps, 보안, 최신 AI 도구 리뷰를 다룹니다. 단순 뉴스가 아니라, 변화의 의미와 실무 적용 방법까지 다루는 것을 원칙으로 합니다.',
      },
      {
        category: 'service',
        q: '콘텐츠는 얼마나 자주 업데이트되나요?',
        a: 'Nodelog는 정해진 게시량을 목표로 하기보다 새로운 실무 가이드 발행과 기존 콘텐츠 보강을 함께 진행합니다. 공식 문서 변경, 기술 환경 변화 또는 오류 제보가 확인된 콘텐츠는 필요에 따라 지속적으로 업데이트합니다.',
      },
      {
        category: 'service',
        q: '검색과 카테고리 탐색은 어떻게 사용하나요?',
        a: '상단의 검색 버튼(또는 ⌘K)으로 전체 글·카테고리·태그를 한 번에 탐색할 수 있습니다. 카테고리별로 좁히려면 헤더의 메뉴, 시간순으로 보려면 아카이브 페이지를 사용하세요.',
      },
      {
        category: 'content',
        q: 'AI 도구는 콘텐츠 제작에 어떻게 활용되나요?',
        a: 'Nodelog의 글 대부분은 AI 도구로 초안을 만들었고, 발행 여부는 운영자가 결정합니다. 모든 글의 명령어와 수치를 사람이 실행·대조한 것은 아닙니다. 사람이 확인한 글에는 하단에 확인일·확인 범위·출처가 검증 기록으로 표시되며, 기록이 없는 글은 확인 기록이 없는 상태입니다. 공식 문서 변경이나 오류 제보가 확인되면 수정·보강합니다.',
      },
      {
        category: 'content',
        q: '글은 어떻게 작성되나요?',
        a: '주제 선정 → AI 도구를 이용한 초안 작성 → 운영자의 발행 결정 → 오류 제보·문서 변경에 따른 정정·보강 순서로 운영합니다. 운영자가 확인한 글에는 확인 범위를 기록해 표시합니다. 자세한 내용은 편집자 페이지의 운영 방식 섹션에서 확인할 수 있습니다.',
      },
      {
        category: 'newsletter',
        q: '뉴스레터는 어떻게 구독하나요?',
        a: '홈 페이지 하단 또는 구독 페이지에서 이메일을 입력하면 됩니다. 발송 주기는 아직 고정되어 있지 않으며, 언제든 해지할 수 있습니다.',
      },
      {
        category: 'newsletter',
        q: '뉴스레터 구독 해지는 어떻게 하나요?',
        a: '수신한 뉴스레터 하단의 "구독 해지" 링크를 클릭하거나, thive8564@gmail.com으로 해지 요청을 보내주시면 확인 후 처리합니다.',
      },
      {
        category: 'etc',
        q: '제휴 / 광고 / 콘텐츠 문의는 어디로 하나요?',
        a: 'thive8564@gmail.com 로 메일을 보내주시거나, Contact 페이지의 폼을 이용해주세요. 평균 답변 시간은 영업일 기준 36시간입니다.',
      },
      {
        category: 'etc',
        q: 'AI가 생성한 내용에 오류가 있다면?',
        a: 'thive8564@gmail.com 로 글 주소와 오류 내용을 알려주시면 확인하겠습니다. 내용에 영향을 주는 오류는 정정하고 필요한 경우 정정 사실과 수정일을 글에 표시합니다.',
      },
    ],
  },
  en: {
    lead: 'The questions we get most about how Nodelog works and how to use the site.',
    allLabel: 'All',
    emptyTitle: 'Didn’t find your answer?',
    emptyLead: 'Send us a note and we will get back to you.',
    contactCta: 'Contact us',
    categories: [
      { id: 'service', label: 'About the site', icon: '🗺' },
      { id: 'content', label: 'Content & AI', icon: '🤖' },
      { id: 'newsletter', label: 'Newsletter', icon: '📬' },
      { id: 'etc', label: 'Errors & contact', icon: '💬' },
    ],
    items: [
      {
        category: 'service',
        q: 'What does this site cover?',
        a: 'Six categories: AI & automation, IT trends, development, tool reviews, security, and infrastructure. That includes LLM, RAG, and agent architecture, backend work, DevOps, security, and current AI tools. The rule is not just news — we cover what a change means and how to apply it.',
      },
      {
        category: 'service',
        q: 'How often is content updated?',
        a: 'We do not chase a fixed publish quota. New practical guides and updates to existing pieces run together. When official docs change, the stack moves, or someone reports an error, we update the piece.',
      },
      {
        category: 'service',
        q: 'How do search and categories work?',
        a: 'Use the search button in the header (or ⌘K) to search posts, categories, and tags at once. Narrow by category from the header, or browse in date order on the archive page.',
      },
      {
        category: 'content',
        q: 'How is AI used in the writing?',
        a: 'Most Nodelog articles started as AI-generated drafts, and the site operator decides what is published. Not every command or figure has been run or checked by a person. Articles a person has checked show a verification record (check date, scope, sources) at the bottom; articles without one have no recorded check. We correct and expand pieces when official docs change or readers report errors.',
      },
      {
        category: 'content',
        q: 'How is a piece written?',
        a: 'Topic → AI-assisted draft → operator publish decision → correction and expansion after reader reports or doc changes. When the operator checks an article, the scope of that check is recorded and shown. More detail is on the editorial standards page.',
      },
      {
        category: 'newsletter',
        q: 'How do I subscribe?',
        a: 'Enter your email in the footer on the home page or on the subscribe page. There is no fixed sending schedule yet. You can unsubscribe at any time.',
      },
      {
        category: 'newsletter',
        q: 'How do I unsubscribe?',
        a: 'Use the unsubscribe link at the bottom of any newsletter, or email thive8564@gmail.com and we will process it.',
      },
      {
        category: 'etc',
        q: 'Where do I send partnership, ads, or content questions?',
        a: 'Email thive8564@gmail.com or use the form on the contact page. Average reply time is 36 business hours.',
      },
      {
        category: 'etc',
        q: 'What if AI-assisted copy is wrong?',
        a: 'Email thive8564@gmail.com with the URL and what is wrong. Errors that change the meaning are corrected, and when needed we note the correction and the date on the page.',
      },
    ],
  },
};

export function getFaq(locale: Locale): FaqCopy {
  return FAQ[locale] ?? FAQ.ko;
}
