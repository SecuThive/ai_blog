import type { Locale } from '../config';

export interface ContactCopy {
  title: string;
  lead: string;
  types: { value: string; label: string; icon: string }[];
  trust: { icon: string; label: string; value: string }[];
  successTitle: string;
  successBody: string;
  backHome: string;
  formTitle: string;
  name: string;
  namePlaceholder: string;
  email: string;
  typeLabel: string;
  company: string;
  optional: string;
  message: string;
  messagePlaceholder: string;
  encrypted: string;
  sending: string;
  send: string;
  errorGeneric: string;
  errorNetwork: string;
  direct: { label: string; mail: string }[];
  faqTag: string;
  faqBody: string;
  faqCta: string;
  newsletterBody: string;
  newsletterCta: string;
}

const CONTACT: Record<Locale, ContactCopy> = {
  ko: {
    title: '문의 · 제휴',
    lead: '기사 제보, 콘텐츠 제휴, 협업, 또는 단순한 피드백 — 어떤 메시지든 환영합니다.',
    types: [
      { value: '기사 제보 / 정정 요청', label: '기사 제보 / 정정 요청', icon: '📰' },
      { value: '콘텐츠 제휴 / 협업', label: '콘텐츠 제휴 / 협업', icon: '🤝' },
      { value: '광고 / 스폰서십', label: '광고 / 스폰서십', icon: '📣' },
      { value: '채용 / 운영 참여', label: '채용 / 운영 참여', icon: '🧑‍💻' },
      { value: '일반 문의', label: '일반 문의', icon: '💬' },
    ],
    trust: [
      { icon: '⏱', label: '평균 답변', value: '36시간 이내' },
      { icon: '🔒', label: '개인정보', value: '제3자 미제공' },
      { icon: '📬', label: '직접 답변', value: '담당자 직접 회신' },
    ],
    successTitle: '문의가 접수되었습니다',
    successBody: '영업일 기준 36시간 내에 {email}으로 답변드리겠습니다.',
    backHome: '홈으로 돌아가기',
    formTitle: '메시지 보내기',
    name: '이름',
    namePlaceholder: '홍길동',
    email: '이메일',
    typeLabel: '문의 유형',
    company: '회사 / 소속',
    optional: '(선택)',
    message: '메시지',
    messagePlaceholder: '구체적으로 알려주시면 빠른 답변에 도움이 됩니다.',
    encrypted: '메시지는 암호화되어 전송됩니다',
    sending: '전송 중…',
    send: '메시지 보내기',
    errorGeneric: '오류가 발생했습니다.',
    errorNetwork: '네트워크 오류가 발생했습니다.',
    direct: [
      { label: '일반 문의', mail: 'thive8564@gmail.com' },
      { label: '제휴 / 광고', mail: 'thive8564@gmail.com' },
      { label: '제보 / 정정', mail: 'thive8564@gmail.com' },
    ],
    faqTag: '자주 묻는 질문',
    faqBody: '문의 전에 FAQ를 확인해보세요. 가장 자주 받는 질문은 미리 정리되어 있습니다.',
    faqCta: 'FAQ 보기',
    newsletterBody: '매주 화요일, 보안·AI·인프라 핵심 뉴스를 6분 분량으로 받아보세요.',
    newsletterCta: '무료 구독하기 →',
  },
  en: {
    title: 'Contact & partnerships',
    lead: 'Corrections, partnerships, collaboration, or a short note — we read all of it.',
    types: [
      { value: '기사 제보 / 정정 요청', label: 'Tip / correction', icon: '📰' },
      { value: '콘텐츠 제휴 / 협업', label: 'Partnership / collab', icon: '🤝' },
      { value: '광고 / 스폰서십', label: 'Ads / sponsorship', icon: '📣' },
      { value: '채용 / 운영 참여', label: 'Hiring / contributing', icon: '🧑‍💻' },
      { value: '일반 문의', label: 'General', icon: '💬' },
    ],
    trust: [
      { icon: '⏱', label: 'Typical reply', value: 'Within 36 hours' },
      { icon: '🔒', label: 'Privacy', value: 'Not sold to third parties' },
      { icon: '📬', label: 'Who replies', value: 'A person on the team' },
    ],
    successTitle: 'Message received',
    successBody: 'We will reply to {email} within 36 business hours.',
    backHome: 'Back to home',
    formTitle: 'Send a message',
    name: 'Name',
    namePlaceholder: 'Your name',
    email: 'Email',
    typeLabel: 'Topic',
    company: 'Company / org',
    optional: '(optional)',
    message: 'Message',
    messagePlaceholder: 'Specifics help us reply faster.',
    encrypted: 'Messages are sent over HTTPS',
    sending: 'Sending…',
    send: 'Send message',
    errorGeneric: 'Something went wrong.',
    errorNetwork: 'Network error. Please try again.',
    direct: [
      { label: 'General', mail: 'thive8564@gmail.com' },
      { label: 'Partnerships / ads', mail: 'thive8564@gmail.com' },
      { label: 'Tips / corrections', mail: 'thive8564@gmail.com' },
    ],
    faqTag: 'FAQ',
    faqBody: 'Check the FAQ first. The questions we get most are already there.',
    faqCta: 'Read the FAQ',
    newsletterBody: 'Security, AI, and infrastructure — about six minutes, every Tuesday.',
    newsletterCta: 'Subscribe free →',
  },
};

export function getContact(locale: Locale): ContactCopy {
  return CONTACT[locale] ?? CONTACT.ko;
}
