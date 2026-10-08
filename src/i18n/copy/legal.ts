import type { Locale } from '../config';

export interface LegalSection {
  title: string;
  body: string;
  /** 본문 아래에 실제 하이퍼링크로 표시할 외부 문서(200 응답을 확인한 URL만). */
  links?: { label: string; url: string }[];
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
    updated: '최종 업데이트 · 2026.10.08 (분석 서비스·문의 주소 반영) · 최초 적용일 2026.06.02',
    contact: '이 정책에 대해 궁금한 점이 있다면 {email} 로 문의해주세요.',
    sections: [
      { title: '1. 수집하는 정보', body: '① 뉴스레터: 구독 신청 시 이메일 주소를 수집합니다. ② 댓글: 작성 시 입력한 이름(별명 가능)과 댓글 내용, 도배 방지를 위한 IP 주소의 일방향 해시값을 수집합니다. ③ 문의 폼: 이름, 이메일, 소속(선택), 문의 내용을 수집합니다. ④ 이용 분석·광고: 페이지 방문, 이용 시간, 기기·브라우저 정보와 쿠키·광고 식별자가 처리될 수 있습니다.' },
      { title: '2. 정보의 사용 목적', body: '뉴스레터 이메일은 발송과 구독 상태 관리에 사용됩니다. 댓글 정보는 댓글 표시와 어뷰징 방지에, 문의 정보는 답변과 이력 관리에 사용됩니다. 분석 데이터는 사이트 이용 분석과 품질 개선에, 광고 데이터는 광고 게재 및 성과 측정에 사용될 수 있습니다.' },
      { title: '3. 보관 기간', body: '뉴스레터 구독을 해지하면 해당 이메일은 발송 대상에서 즉시 제외(비활성 처리)됩니다. 이메일 주소 자체의 삭제를 원하면 아래 연락처로 요청해 주세요. 댓글은 삭제 요청을 확인한 뒤 처리하며, 문의 내역은 답변과 분쟁 대응에 필요한 기간 동안 보관 후 삭제합니다. 광고·분석 데이터와 쿠키의 보관 기간은 각 제공업체(Google·Cloudflare 등)의 정책과 운영 설정을 따릅니다.' },
      { title: '4. 제3자 제공 및 처리 위탁', body: '당사는 사용자의 개인정보를 판매하지 않습니다. 서비스 운영 과정에서 광고: Google AdSense, 분석: Google Analytics·Cloudflare Web Analytics, 메일 발송: Resend, 보안·전송: Cloudflare, 웹 글꼴 전송: jsDelivr를 사용합니다. 게시물과 서비스 데이터는 운영자가 직접 관리하는 PostgreSQL 데이터베이스에 보관합니다. 외부 서비스의 쿠키·데이터 처리는 각 사업자의 정책을 따르며 일부 처리는 국외 서버에서 이루어질 수 있습니다.', links: [
        { label: 'Google 개인정보처리방침', url: 'https://policies.google.com/privacy' },
        { label: 'Cloudflare 개인정보처리방침', url: 'https://www.cloudflare.com/privacypolicy/' },
        { label: 'Resend 개인정보처리방침', url: 'https://resend.com/legal/privacy-policy' },
      ] },
      { title: '5. 사용자의 권리', body: '사용자는 자신의 정보에 대한 열람, 정정, 삭제, 처리 정지를 thive@thivelab.com으로 요청할 수 있습니다. 요청 내용을 확인하고 처리 결과를 회신합니다.' },
      { title: '6. 쿠키·웹 비콘 및 광고', body: '본 사이트는 로그인 기능이 없어 자체 세션 쿠키를 쓰지 않습니다. 화면 테마, 북마크, 최근 검색어는 사용자의 브라우저 저장소(localStorage)에만 보관되며 서버로 전송되지 않습니다. 이용 분석(Google Analytics)과 광고(Google AdSense)를 위해 쿠키가 사용됩니다. Google을 포함한 제3자 광고 사업자는 광고 게재 과정에서 사용자의 브라우저에 쿠키를 저장하거나 읽을 수 있고, 웹 비콘이나 IP 주소를 이용해 정보를 수집할 수 있습니다. Google은 광고 쿠키를 사용해 사용자가 본 사이트와 다른 웹사이트를 방문한 기록을 기반으로 Google과 파트너가 광고를 게재하도록 할 수 있습니다. 맞춤형 광고는 아래 Google 광고 설정이나 YourAdChoices에서 해제할 수 있고, 브라우저 설정에서 쿠키를 차단할 수도 있습니다. 단, 쿠키를 차단하면 일부 기능이 제한될 수 있습니다.', links: [
        { label: 'Google 광고 설정(내 광고 센터, 맞춤 광고 해제)', url: 'https://myadcenter.google.com/' },
        { label: 'Google이 파트너 사이트·앱의 정보를 사용하는 방식', url: 'https://policies.google.com/technologies/partner-sites' },
        { label: 'Google 광고 기술', url: 'https://policies.google.com/technologies/ads' },
        { label: 'YourAdChoices(DAA) 맞춤 광고 해제', url: 'https://youradchoices.com/' },
      ] },
      { title: '7. 보안·전송 서비스(Cloudflare, jsDelivr)', body: '사이트 트래픽은 Cloudflare를 거칩니다. Cloudflare는 악성 트래픽 차단을 위해 접속 IP 주소와 요청 정보를 처리하며, 봇 감지 스크립트가 보안 쿠키(cf_clearance)를 설정할 수 있습니다. Cloudflare Web Analytics는 방문 통계와 페이지 성능 정보를 처리합니다. 본문 글꼴(Pretendard)은 jsDelivr CDN에서 불러오므로 글꼴 요청 시 사용자의 IP 주소와 브라우저 정보가 jsDelivr에 전달됩니다.', links: [
        { label: 'Cloudflare 개인정보처리방침', url: 'https://www.cloudflare.com/privacypolicy/' },
        { label: 'Cloudflare 쿠키 안내', url: 'https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/' },
        { label: 'Cloudflare Web Analytics 수집 범위', url: 'https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/' },
        { label: 'jsDelivr 개인정보처리방침', url: 'https://www.jsdelivr.com/terms/privacy-policy' },
      ] },
      { title: '8. AI 도구 및 콘텐츠 피드백', body: '글 대부분의 초안 작성에 AI 도구를 사용했습니다. 글의 출처·검증 범위는 해당 페이지에 표시된 자료와 기록을 기준으로 확인할 수 있습니다. 사용자가 보낸 오류 제보와 콘텐츠 피드백은 해당 글의 정정과 사이트 품질 개선을 위해 검토할 수 있으며, 자체 추천 모델 학습에는 사용하지 않습니다. 별도 동의 없이 개인 식별 정보를 공개하지 않습니다.' },
      { title: '9. 정책 변경', body: '이 정책을 변경하면 본 페이지에 변경 내용과 날짜를 표시합니다.' },
    ],
  },
  en: {
    title: 'Privacy policy',
    lead: 'What Nodelog (thivelab.com) collects, how we use it, and your rights.',
    eyebrow: 'PRIVACY POLICY',
    updated: 'Last updated · 8 Oct 2026 (analytics services and contact address) · First effective 2 Jun 2026',
    contact: 'Questions about this policy? Write to {email}.',
    sections: [
      { title: '1. Information we collect', body: '(1) Newsletter: email address when you subscribe. (2) Comments: the name you enter (a nickname is fine), the comment text, and a one-way hash of the IP address to limit spam. (3) Contact form: name, email, organization (optional), and the message. (4) Analytics and ads: page views, time on site, device and browser data, and cookies or advertising identifiers may be processed.' },
      { title: '2. Why we use it', body: 'Newsletter emails are used to send the newsletter and manage subscription status. Comment data is used to display comments and prevent abuse. Contact data is used to reply and keep a record of the request. Analytics data is used to understand site use and improve the site; ad data may be used to serve and measure ads.' },
      { title: '3. How long we keep it', body: 'When you unsubscribe, your email is immediately excluded from sending (marked inactive). To have the address itself deleted, contact us below. Comments are handled after we confirm a deletion request. Contact records are kept as long as needed to reply and handle disputes, then deleted. Retention of ads, analytics, and cookies follows each provider (Google, Cloudflare, and others) and our settings.' },
      { title: '4. Processors and third parties', body: 'We do not sell personal information. We may use Google AdSense for ads, Google Analytics and Cloudflare Web Analytics for analytics, Resend for email, Cloudflare for security and delivery, and jsDelivr for web fonts. Posts and service data are stored in a PostgreSQL database managed by the site operator. External services process cookies and data under their own policies, and some processing may take place outside Korea.', links: [
        { label: 'Google privacy policy', url: 'https://policies.google.com/privacy' },
        { label: 'Cloudflare privacy policy', url: 'https://www.cloudflare.com/privacypolicy/' },
        { label: 'Resend privacy policy', url: 'https://resend.com/legal/privacy-policy' },
      ] },
      { title: '5. Your rights', body: 'You may request access, correction, deletion, or a pause in processing by emailing thive@thivelab.com. We will review the request and reply with the result.' },
      { title: '6. Cookies, web beacons and ads', body: 'The site has no login, so it sets no session cookies of its own. Theme, bookmarks and recent searches stay in your browser storage (localStorage) and are not sent to our server. Cookies are used for analytics (Google Analytics) and ads (Google AdSense). Third parties, including Google, may place or read cookies on your browser, or use web beacons or IP addresses to collect information, as a result of ad serving on this site. Google’s use of advertising cookies enables it and its partners to serve ads based on your visits to this site and other sites. You can opt out of personalized ads in Google My Ad Center or at YourAdChoices below, and you can block cookies in your browser. Blocking cookies may limit some features.', links: [
        { label: 'Google My Ad Center (opt out of personalized ads)', url: 'https://myadcenter.google.com/' },
        { label: 'How Google uses information from sites or apps that use its services', url: 'https://policies.google.com/technologies/partner-sites' },
        { label: 'How Google uses cookies in advertising', url: 'https://policies.google.com/technologies/ads' },
        { label: 'YourAdChoices (DAA) opt-out', url: 'https://youradchoices.com/' },
      ] },
      { title: '7. Security and delivery services (Cloudflare, jsDelivr)', body: 'Traffic to the site passes through Cloudflare, which processes IP addresses and request data to block malicious traffic; its bot-detection script may set a security cookie (cf_clearance). Cloudflare Web Analytics processes visit statistics and page performance data. The body font (Pretendard) is loaded from the jsDelivr CDN, so your IP address and browser information are sent to jsDelivr when the font is requested.', links: [
        { label: 'Cloudflare privacy policy', url: 'https://www.cloudflare.com/privacypolicy/' },
        { label: 'Cloudflare cookies', url: 'https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/' },
        { label: 'What Cloudflare Web Analytics collects', url: 'https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/' },
        { label: 'jsDelivr privacy policy', url: 'https://www.jsdelivr.com/terms/privacy-policy' },
      ] },
      { title: '8. AI tools and content feedback', body: 'Most articles were drafted with AI tools. Check each page for its stated sources and verification scope. Error reports and content feedback may be reviewed to correct the article and improve the site. We do not use them to train our own recommendation models. We do not publish personally identifying information without separate consent.' },
      { title: '9. Changes to this policy', body: 'If this policy changes, we will note the change and date on this page.' },
    ],
  },
};

const POLICY: Record<Locale, LegalDoc> = {
  ko: {
    title: '편집 정책',
    lead: 'Nodelog가 콘텐츠를 만들고 검토하는 원칙을 외부에 공개합니다.',
    eyebrow: 'EDITORIAL POLICY',
    updated: '최종 업데이트 · 2026.10.03 · 적용 시작일 2026.05.01',
    contact: '편집 정책에 대한 문의는 {email} 로 보내주세요.',
    sections: [
      { title: '1. AI 사용 범위', body: 'Nodelog의 글 대부분은 AI 도구로 초안을 작성했습니다. 발행 여부는 운영자가 결정합니다. 2026년 7월 31일부터 글 등록 API는 발행 승인과 담당자 이름이 없으면 초안으로 보류하지만, 그 이전 글과 운영자 스크립트로 일괄 등록된 글에는 글별 검토 기록이 없습니다. 검토 기록이 없는 글에 검토·검증 완료 표기를 붙이지 않습니다.' },
      { title: '2. 사실 확인과 검증 기록', body: '운영자가 확인한 글에는 확인일, 확인 범위(확인한 것과 하지 않은 것), 실제로 명령을 실행했다면 그 환경, 확인한 출처를 검증 기록으로 남기고 그 경우에만 표시합니다. 공식 문서를 읽은 것과 명령을 실행해 본 것은 구분해 적습니다. 출처가 미비한 기존 글은 순차적으로 보강하거나 검색 색인에서 제외합니다.' },
      { title: '3. 후원 콘텐츠', body: '현재 후원·제휴 글은 없습니다. 후원을 받는 글이 생기면 상단에 "후원"을 명확히 표기하며, 후원사는 글의 내용에 개입할 수 없습니다.' },
      { title: '4. 정정과 날짜 표시', body: '오류 제보가 접수되면 관련 자료를 확인합니다. 내용에 영향을 주는 오류는 정정하고 변경 요약과 날짜를 글에 표시합니다. 번역 추가·태그 정리 같은 작업은 업데이트로 표시하지 않으며, 최초 발행일은 바꾸지 않습니다. 기준 시점이 지난 글은 그 시점의 자료임을 표시합니다.' },
      { title: '5. 콘텐츠 품질 관리', body: '중복되거나 독자에게 제공하는 고유 정보가 부족한 글은 통합·보강하거나 검색 색인에서 제외합니다. 발행 후에도 공식 문서 변경과 독자 피드백을 반영해 콘텐츠를 수정할 수 있습니다.' },
    ],
  },
  en: {
    title: 'Editorial policy',
    lead: 'How Nodelog researches, reviews, and publishes — in the open.',
    eyebrow: 'EDITORIAL POLICY',
    updated: 'Last updated · 3 Oct 2026 · Effective 1 May 2026',
    contact: 'Questions about editorial policy? Write to {email}.',
    sections: [
      { title: '1. How we use AI', body: 'Most Nodelog articles were drafted with AI tools. The site operator decides what is published. Since 31 July 2026 the posting API holds a post as a draft unless publication is approved with a named reviewer, but earlier posts and posts bulk-inserted by operator scripts have no per-article review record. Articles without a review record are not marked as reviewed or verified.' },
      { title: '2. Fact checking and verification records', body: 'When the operator checks an article, we record the check date, its scope (what was and was not checked), the environment if commands were actually run, and the sources checked, and we show this only in that case. Reading official docs and running a command are recorded separately. Older pieces with thin sourcing are strengthened over time or dropped from search.' },
      { title: '3. Sponsored content', body: 'There is no sponsored or affiliate content today. If a post is sponsored, it will be labeled “Sponsored” at the top, and sponsors will not control its substance.' },
      { title: '4. Corrections and dates', body: 'When we receive an error report, we check the sources. Errors that change the meaning are corrected, with a change summary and date on the page. Adding a translation or tidying tags is not shown as an update, and the original publish date is never changed. Articles past their reference date are labeled as such.' },
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
