import type { Metadata } from 'next';
import ThivelabWorld from './ThivelabWorld';

export const metadata: Metadata = {
  title: 'THIVELAB — 읽고, 만들고, 탐색하다',
  description: 'NODELOG, TOOLS, CIPHER, MOA로 이어지는 THIVELAB의 서비스와 새로운 시도를 살펴보세요.',
  alternates: { canonical: 'https://www.thivelab.com/thivelab' },
  robots: process.env.NODE_ENV === 'production'
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

export default function ThivelabPage() {
  return <ThivelabWorld />;
}
