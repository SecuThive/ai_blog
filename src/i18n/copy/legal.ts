import type { Locale } from '../config';

export interface LegalSection {
  title: string;
  body: string;
}

export interface LegalDoc {
  title: string;
  lead: string;
  eyebrow: string;
  updated: string;
  contact: string;
  sections: LegalSection[];
}

const TERMS: Record<Locale, LegalDoc> = {
  ko: {
    title: '이용안내',
    lead: 'Nodelog를 이용하시는 데 있어 알아두셔야 할 기본 정책과 이용 조건입니다.',
    eyebrow: 'TERMS OF USE',
    updated: '최종 업데이트 · 2026.04.30 · 적용 시작일 2026.05.01',
    contact: '이용 약관에 대해 궁금한 점이 있다면 {email} 로 문의해주세요.',
    sections: [
      { title: '1. 서비스 범위', body: 'Nodelog는 IT 분야의 큐레이션 콘텐츠를 제공하는 디지털 미디어입니다. 모든 콘텐츠는 정보 제공 목적이며, 특정 의사결정에 대한 법적·전문적 자문이 아닙니다.' },
      { title: '2. 콘텐츠 이용', body: '본 사이트의 콘텐츠는 개인 학습과 공유를 위해 자유롭게 인용 가능합니다(출처 표기 필수). 상업적 재배포는 별도 허락이 필요합니다.' },
      { title: '3. 저작권', body: '명시되지 않은 모든 콘텐츠의 저작권은 Nodelog와 원 저자에게 있습니다.' },
      { title: '4. 면책', body: 'Nodelog의 콘텐츠는 작성 시점의 정보에 기반하며, 시간 경과에 따른 변화로 발생하는 결과에 대해 책임지지 않습니다.' },
      { title: '5. 사이트 변경', body: 'Nodelog는 사전 통지 없이 사이트 구조, 디자인, 기능을 변경할 수 있습니다.' },
    ],
  },
  en: {
    title: 'Terms of use',
    lead: 'The basic policies and conditions for using Nodelog.',
    eyebrow: 'TERMS OF USE',
    updated: 'Last updated · 30 Apr 2026 · Effective 1 May 2026',
    contact: 'Questions about these terms? Write to {email}.',
    sections: [
      { title: '1. Scope of the service', body: 'Nodelog is a digital publication of curated IT content. Everything here is for information only and is not legal, professional, or investment advice for a specific decision.' },
      { title: '2. Using the content', body: 'You may quote our content for personal learning and sharing if you credit the source. Commercial redistribution needs separate permission.' },
      { title: '3. Copyright', body: 'Unless stated otherwise, copyright in the content belongs to Nodelog and the original authors.' },
      { title: '4. Disclaimer', body: 'Content is based on information available at the time of writing. We are not responsible for outcomes that follow from later changes in tools, versions, or the law.' },
      { title: '5. Changes to the site', body: 'Nodelog may change site structure, design, and features without prior notice.' },
    ],
  },
};

const PRIVACY: Record<Locale, LegalDoc> = {
  ko: {
    title: '개인정보처리방침',
    lead: 'Nodelog(thivelab.com)가 수집하는 정보의 범위, 사용 방식, 그리고 사용자의 권리를 명확하게 안내합니다.',
    eyebrow: 'PRIVACY POLICY',
    updated: '최종 업데이트 · 2026.10.02 (권리 요청·변경 안내 표현 및 광고 설정 링크 정정) · 최초 적용일 2026.06.02',
    contact: '이 정책에 대해 궁금한 점이 있다면 {email} 로 문의해주세요.',
    sections: [
      { title: '1. 수집하는 정보', body: '① 뉴스레터: 구독 신청 시 이메일 주소를 수집합니다. ② 댓글: 작성 시 입력한 이름(별명 가능)과 댓글 내용, 도배 방지를 위한 IP 주소의 일방향 해시값을 수집합니다. ③ 문의 폼: 이름, 이메일, 소속(선택), 문의 내용을 수집합니다. ④ 이용 분석·광고: 페이지 방문, 이용 시간, 기기·브라우저 정보와 쿠키·광고 식별자가 처리될 수 있습니다.' },
      { title: '2. 정보의 사용 목적', body: '뉴스레터 이메일은 발송과 구독 상태 관리에 사용됩니다. 댓글 정보는 댓글 표시와 어뷰징 방지에, 문의 정보는 답변과 이력 관리에 사용됩니다. 분석 데이터는 사이트 이용 분석과 품질 개선에, 광고 데이터는 광고 게재 및 성과 측정에 사용될 수 있습니다.' },
      { title: '3. 보관 기간', body: '구독 해지 시 해당 이메일을 비활성 상태로 변경하고 발송 대상에서 제외합니다. 기록 삭제는 thive8564@gmail.com 로 요청할 수 있습니다. 댓글·문의 기록은 삭제 요청을 확인한 뒤 처리합니다. 각 항목의 구체적인 보관 기간과 광고·분석 업체 설정은 운영 기록으로 확인해 추가 고지할 예정입니다.' },
      { title: '4. 제3자 제공 및 처리 위탁', body: '당사는 사용자의 개인정보를 판매하지 않습니다. 서비스 운영 과정에서 광고: Google AdSense, 분석: Google Analytics·Vercel Analytics, 메일 발송: Resend를 사용할 수 있습니다. 게시물과 서비스 데이터는 자체 운영 PostgreSQL 데이터베이스에 보관합니다. 외부 서비스의 쿠키·데이터 처리는 각 사업자의 정책을 따르며 일부 처리는 국외 서버에서 이루어질 수 있습니다.' },
      { title: '5. 사용자의 권리', body: '사용자는 자신의 정보에 대한 열람, 정정, 삭제, 처리 정지를 thive8564@gmail.com 로 요청할 수 있습니다. 요청 내용을 확인하고 처리 결과를 회신합니다.' },
      { title: '6. 쿠키 및 광고', body: '본 사이트의 분석 서비스와 광고 서비스는 쿠키 또는 유사 식별자를 사용할 수 있습니다. Google을 포함한 제3자 광고 사업자는 본 사이트와 다른 사이트 방문 정보를 이용해 맞춤형 광고를 제공할 수 있습니다. Google 광고 설정은 이 페이지 아래의 링크에서 열 수 있습니다. 브라우저에서도 쿠키를 관리할 수 있습니다. EEA·영국·스위스의 광고 동의 방식은 계정 설정을 확인 중입니다.' },
      { title: '7. AI 도구 및 콘텐츠 피드백', body: '자료 조사, 콘텐츠 구조화와 초안 작성 과정에서 AI 도구를 보조적으로 활용할 수 있습니다. 글의 출처·검증 범위는 해당 페이지에 표시된 자료와 기록을 기준으로 확인할 수 있습니다. 사용자가 보낸 오류 제보와 콘텐츠 피드백은 해당 글의 정정과 사이트 품질 개선을 위해 검토할 수 있으며, 자체 추천 모델 학습에는 사용하지 않습니다. 별도 동의 없이 개인 식별 정보를 공개하지 않습니다.' },
      { title: '8. 정책 변경', body: '이 정책을 변경하면 본 페이지에 변경 내용과 날짜를 표시합니다.' },
    ],
  },
  en: {
    title: 'Privacy policy',
    lead: 'What Nodelog (thivelab.com) collects, how we use it, and your rights.',
    eyebrow: 'PRIVACY POLICY',
    updated: 'Last updated · 2 Oct 2026 (rights, change notices, and ad links) · First effective 2 Jun 2026',
    contact: 'Questions about this policy? Write to {email}.',
    sections: [
      { title: '1. Information we collect', body: '(1) Newsletter: email address when you subscribe. (2) Comments: the name you enter (a nickname is fine), the comment text, and a one-way hash of the IP address to limit spam. (3) Contact form: name, email, organization (optional), and the message. (4) Analytics and ads: page views, time on site, device and browser data, and cookies or advertising identifiers may be processed.' },
      { title: '2. Why we use it', body: 'Newsletter emails are used to send the newsletter and manage subscription status. Comment data is used to display comments and prevent abuse. Contact data is used to reply and keep a record of the request. Analytics data is used to understand site use and improve the site; ad data may be used to serve and measure ads.' },
      { title: '3. How long we keep it', body: 'Unsubscribing marks the email inactive and removes it from the mailing list. You can request deletion at thive8564@gmail.com. We handle comment and contact deletion requests after review. Specific retention periods and ad or analytics provider settings still need to be checked against operating records and added here.' },
      { title: '4. Processors and third parties', body: 'We do not sell personal information. We may use Google AdSense for ads, Google Analytics and Vercel Analytics for analytics, and Resend for email. Posts and service data are stored in a self-hosted PostgreSQL database. External services process cookies and data under their own policies, and some processing may take place outside Korea.' },
      { title: '5. Your rights', body: 'You may request access, correction, deletion, or a pause in processing by emailing thive8564@gmail.com. We will review the request and reply with the result.' },
      { title: '6. Cookies and ads', body: 'Our analytics and advertising services may use cookies or similar identifiers. Third-party advertisers including Google may use visits to this and other sites to provide personalized ads. Google ad settings are linked below this policy. You can also manage cookies in your browser. Consent settings for ads in the EEA, UK and Switzerland still need account-level review.' },
      { title: '7. AI tools and content feedback', body: 'We may use AI tools to assist research, structuring, and drafting. Check each page for its stated sources and verification scope. Error reports and content feedback may be reviewed to correct the article and improve the site. We do not use them to train our own recommendation models. We do not publish personally identifying information without separate consent.' },
      { title: '8. Changes to this policy', body: 'If this policy changes, we will note the change and date on this page.' },
    ],
  },
};

const POLICY: Record<Locale, LegalDoc> = {
  ko: {
    title: '편집 정책',
    lead: 'Nodelog가 콘텐츠를 만들고 검토하는 원칙을 외부에 공개합니다.',
    eyebrow: 'EDITORIAL POLICY',
    updated: '최종 업데이트 · 2026.09.30 · 적용 시작일 2026.05.01',
    contact: '편집 정책에 대한 문의는 {email} 로 보내주세요.',
    sections: [
      { title: '1. AI 사용 범위', body: 'Nodelog는 자료 조사, 콘텐츠 구조화 및 초안 작성 과정에서 AI 도구를 활용할 수 있습니다. 글에 기재된 출처·테스트 환경·검증일과 실제 검토 기록을 구분해 표시하며, 검토 기록이 없는 글에 완료 표기를 붙이지 않습니다.' },
      { title: '2. 사실 확인', body: '핵심 주장과 명령어는 관련 공식 문서와 1차 자료를 우선 확인하는 것을 원칙으로 합니다. 확인된 적용 환경이나 버전은 글에 명시하며, 확인되지 않은 경우 이를 검증 완료로 표시하지 않습니다. 출처가 미비한 기존 글은 순차적으로 보강하거나 검색 색인에서 제외합니다.' },
      { title: '3. 후원 콘텐츠', body: '스폰서가 있는 글은 상단에 "후원"이라는 명확한 표기와 함께 별도의 색상으로 구분됩니다. 후원사는 글의 내용에 개입할 수 없습니다.' },
      { title: '4. 정정', body: '오류 제보가 접수되면 관련 자료를 확인합니다. 내용에 영향을 주는 오류는 정정하고, 필요한 경우 수정일과 정정 사실을 글에 표시합니다.' },
      { title: '5. 콘텐츠 품질 관리', body: '중복되거나 독자에게 제공하는 고유 정보가 부족한 글은 통합·보강하거나 검색 색인에서 제외합니다. 발행 후에도 공식 문서 변경과 독자 피드백을 반영해 콘텐츠를 수정할 수 있습니다.' },
    ],
  },
  en: {
    title: 'Editorial policy',
    lead: 'How Nodelog researches, reviews, and publishes — in the open.',
    eyebrow: 'EDITORIAL POLICY',
    updated: 'Last updated · 30 Sep 2026 · Effective 1 May 2026',
    contact: 'Questions about editorial policy? Write to {email}.',
    sections: [
      { title: '1. How we use AI', body: 'Nodelog may use AI tools for research, structuring, and drafting. We distinguish the sources, test environment, verification date, and recorded review status of each article; an article without a review record is not marked as reviewed.' },
      { title: '2. Fact checking', body: 'We aim to check key claims and commands against official docs and primary sources. We state a verified environment or version when one is available and do not claim verification when it is not. Older pieces with thin sourcing are strengthened over time or dropped from search.' },
      { title: '3. Sponsored content', body: 'Sponsored posts are labeled “Sponsored” at the top and given a distinct color. Sponsors do not control the substance of the piece.' },
      { title: '4. Corrections', body: 'When we receive an error report, we check the sources. Errors that change the meaning are corrected, and when needed we note the correction and the date on the page.' },
      { title: '5. Quality control', body: 'Duplicate or thin pieces are merged, expanded, or removed from search. After publication we may still update content when official docs change or readers send feedback.' },
    ],
  },
};

export function getTerms(locale: Locale): LegalDoc {
  return TERMS[locale] ?? TERMS.ko;
}

export function getPrivacy(locale: Locale): LegalDoc {
  return PRIVACY[locale] ?? PRIVACY.ko;
}

export function getPolicy(locale: Locale): LegalDoc {
  return POLICY[locale] ?? POLICY.ko;
}
