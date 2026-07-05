import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '문의 · 제휴',
  description: '기사 제보·정정 요청, 콘텐츠 제휴, 광고 문의를 받습니다.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
