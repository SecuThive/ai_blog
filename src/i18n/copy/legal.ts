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
    updated: '최종 업데이트 · 2026.07.31 (메타데이터 및 안내 표현 보완) · 최초 적용일 2026.06.02',
    contact: '이 정책에 대해 궁금한 점이 있다면 {email} 로 문의해주세요.',
    sections: [
      { title: '1. 수집하는 정보', body: '① 뉴스레터: 구독 신청 시 이메일 주소를 수집합니다. ② 댓글: 작성 시 입력한 이름(별명 가능)과 댓글 내용, 도배 방지를 위한 IP 주소의 일방향 해시값을 수집합니다. ③ 문의 폼: 이름, 이메일, 소속(선택), 문의 내용을 수집합니다. ④ 이용 분석·광고: 페이지 방문, 이용 시간, 기기·브라우저 정보와 쿠키·광고 식별자가 처리될 수 있습니다.' },
      { title: '2. 정보의 사용 목적', body: '뉴스레터 이메일은 발송과 동의 이력 기록에만 사용됩니다. 댓글 정보는 댓글 표시와 어뷰징 방지에, 문의 정보는 답변과 이력 관리에 사용됩니다. 분석 데이터는 콘텐츠 추천, 사이트 품질 개선, 광고 게재 및 성과 측정에 사용됩니다.' },
      { title: '3. 보관 기간', body: '뉴스레터 구독 이메일은 구독 해지 처리 후 관련 법령상 보관 의무가 없는 범위에서 삭제합니다. 댓글은 삭제 요청을 확인한 뒤 처리하며, 문의 내역은 답변과 분쟁 대응에 필요한 기간 동안 보관 후 삭제합니다. 광고·분석 데이터와 쿠키의 보관 기간은 각 제공업체(Google·Vercel 등)의 정책과 운영 설정을 따릅니다.' },
      { title: '4. 제3자 제공 및 처리 위탁', body: '당사는 사용자의 개인정보를 판매하지 않습니다. 다만 서비스 운영을 위해 다음의 사업자에게 처리를 위탁하거나, 해당 사업자가 자체 쿠키를 통해 익명화된 이용 데이터를 처리할 수 있습니다 — 광고: Google AdSense, 분석: Google Analytics·Vercel Analytics, 데이터 보관: Supabase, 메일 발송: 뉴스레터·문의 알림 인프라(Resend). 각 사업자는 자체 개인정보처리방침에 따라 데이터를 처리하며, 일부 처리는 국외(미국 등) 서버에서 이루어질 수 있습니다.' },
      { title: '5. 사용자의 권리', body: '사용자는 자신의 정보에 대한 열람, 정정, 삭제, 처리 정지를 언제든 요청할 수 있으며 thive8564@gmail.com 로 요청 시 7일 이내에 처리됩니다.' },
      { title: '6. 쿠키 및 광고', body: '본 사이트는 사이트 작동에 필요한 세션 쿠키와, 이용 분석·광고 게재를 위한 쿠키를 사용합니다. 특히 Google을 포함한 제3자 광고 사업자는 쿠키(예: DoubleClick 쿠키 및 광고 식별자)를 사용하여 사용자가 본 사이트 및 다른 웹사이트를 방문한 기록을 기반으로 맞춤형 광고를 게재할 수 있습니다. 사용자는 Google 광고 설정(google.com/settings/ads) 또는 www.aboutads.info 에서 맞춤형 광고를 비활성화(opt-out)할 수 있으며, 브라우저 설정에서 쿠키를 직접 차단할 수도 있습니다. 단, 쿠키를 차단하면 일부 기능이 제한될 수 있습니다.' },
      { title: '7. AI 도구 및 콘텐츠 피드백', body: '자료 조사, 콘텐츠 구조화와 초안 작성 과정에서 AI 도구를 보조적으로 활용할 수 있으며, 최종 콘텐츠는 편집 검토 후 공개됩니다. 사용자가 보낸 오류 제보와 콘텐츠 피드백은 해당 글의 확인·정정과 사이트 품질 개선을 위해 검토할 수 있으며, 자체 추천 모델 학습에는 사용하지 않습니다. 별도 동의 없이 개인 식별 정보를 공개하지 않습니다.' },
      { title: '8. 정책 변경', body: '이 정책이 변경될 경우 본 페이지 상단에 변경 사실과 변경 시점이 명시되며, 뉴스레터 구독자에게는 이메일로도 안내됩니다.' },
    ],
  },
  en: {
    title: 'Privacy policy',
    lead: 'What Nodelog (thivelab.com) collects, how we use it, and your rights.',
    eyebrow: 'PRIVACY POLICY',
    updated: 'Last updated · 31 Jul 2026 (metadata and wording refresh) · First effective 2 Jun 2026',
    contact: 'Questions about this policy? Write to {email}.',
    sections: [
      { title: '1. Information we collect', body: '(1) Newsletter: email address when you subscribe. (2) Comments: the name you enter (a nickname is fine), the comment text, and a one-way hash of the IP address to limit spam. (3) Contact form: name, email, organization (optional), and the message. (4) Analytics and ads: page views, time on site, device and browser data, and cookies or advertising identifiers may be processed.' },
      { title: '2. Why we use it', body: 'Newsletter emails are used only to send the newsletter and keep a record of consent. Comment data is used to display comments and prevent abuse. Contact data is used to reply and keep a record of the request. Analytics data is used to recommend content, improve the site, and measure ads.' },
      { title: '3. How long we keep it', body: 'Newsletter emails are deleted after you unsubscribe, unless a law requires us to keep them. Comments are handled after we confirm a deletion request. Contact records are kept as long as needed to reply and handle disputes, then deleted. Retention of ads, analytics, and cookies follows each provider (Google, Vercel, and others) and our settings.' },
      { title: '4. Processors and third parties', body: 'We do not sell personal information. To run the service we use processors, or they may process anonymized usage data through their own cookies — ads: Google AdSense; analytics: Google Analytics and Vercel Analytics; storage: Supabase; email: newsletter and contact alerts (Resend). Each processor follows its own privacy policy, and some processing may take place on servers outside Korea (including the United States).' },
      { title: '5. Your rights', body: 'You may request access, correction, deletion, or a pause in processing at any time. Email thive8564@gmail.com and we will handle the request within 7 days.' },
      { title: '6. Cookies and ads', body: 'We use session cookies needed for the site to work, plus cookies for analytics and ads. Third-party advertisers including Google may use cookies (for example the DoubleClick cookie and advertising IDs) to show personalized ads based on visits to this site and others. You can opt out in Google Ads settings (google.com/settings/ads) or at www.aboutads.info, and you can block cookies in your browser. Blocking cookies may limit some features.' },
      { title: '7. AI tools and content feedback', body: 'We may use AI tools to assist research, structuring, and drafting. Final content is published after editorial review. Error reports and content feedback may be reviewed to check and correct the article and to improve the site. We do not use them to train our own recommendation models. We do not publish personally identifying information without separate consent.' },
      { title: '8. Changes to this policy', body: 'If this policy changes, we will note the change and the date at the top of this page, and we will also email newsletter subscribers.' },
    ],
  },
};

const POLICY: Record<Locale, LegalDoc> = {
  ko: {
    title: '편집 정책',
    lead: 'Nodelog가 콘텐츠를 만들고 검토하는 원칙을 외부에 공개합니다.',
    eyebrow: 'EDITORIAL POLICY',
    updated: '최종 업데이트 · 2026.07.31 · 적용 시작일 2026.05.01',
    contact: '편집 정책에 대한 문의는 {email} 로 보내주세요.',
    sections: [
      { title: '1. AI 사용 범위', body: 'Nodelog는 자료 조사, 콘텐츠 구조화 및 초안 작성 과정에서 AI 도구를 활용합니다. AI가 생성한 결과물은 그대로 자동 공개하지 않으며, 사람이 관련 자료를 확인하고 사실관계, 명령어, 문맥 및 표현을 검토한 뒤 최종 발행 여부를 결정합니다.' },
      { title: '2. 사실 확인', body: '핵심 주장과 명령어는 관련 공식 문서와 1차 자료를 우선 확인합니다. 적용 환경이나 버전에 따라 달라질 수 있는 내용은 조건과 확인 방법을 함께 안내하며, 출처가 미비한 기존 글은 순차적으로 보강하거나 검색 색인에서 제외합니다.' },
      { title: '3. 후원 콘텐츠', body: '스폰서가 있는 글은 상단에 "후원"이라는 명확한 표기와 함께 별도의 색상으로 구분됩니다. 후원사는 글의 내용에 개입할 수 없습니다.' },
      { title: '4. 정정', body: '오류 제보가 접수되면 관련 자료를 확인합니다. 내용에 영향을 주는 오류는 정정하고, 필요한 경우 수정일과 정정 사실을 글에 표시합니다.' },
      { title: '5. 콘텐츠 품질 관리', body: '중복되거나 독자에게 제공하는 고유 정보가 부족한 글은 통합·보강하거나 검색 색인에서 제외합니다. 발행 후에도 공식 문서 변경과 독자 피드백을 반영해 콘텐츠를 수정할 수 있습니다.' },
    ],
  },
  en: {
    title: 'Editorial policy',
    lead: 'How Nodelog researches, reviews, and publishes — in the open.',
    eyebrow: 'EDITORIAL POLICY',
    updated: 'Last updated · 31 Jul 2026 · Effective 1 May 2026',
    contact: 'Questions about editorial policy? Write to {email}.',
    sections: [
      { title: '1. How we use AI', body: 'Nodelog uses AI tools for research, structuring, and drafting. We do not auto-publish AI output. A person checks the sources, facts, commands, context, and wording, then decides whether to publish.' },
      { title: '2. Fact checking', body: 'Key claims and commands are checked against official docs and primary sources first. Where results depend on environment or version, we include the conditions and how to verify. Older pieces with thin sourcing are strengthened over time or dropped from search.' },
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
