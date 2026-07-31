import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export const metadata: Metadata = {
  title: '문의 · 제휴',
  description: '기사 제보·정정 요청, 콘텐츠 제휴, 광고 문의를 받습니다.',
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: '문의 · 제휴 | Nodelog',
    description: '기사 제보·정정 요청, 콘텐츠 제휴, 광고 문의를 받습니다.',
    url: `${SITE_URL}/contact`,
    type: 'website',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
