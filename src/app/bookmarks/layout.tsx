import type { Metadata } from 'next';

// 개인 저장 목록(localStorage 기반) — 사용자별 페이지이므로 색인 제외.
export const metadata: Metadata = {
  title: '저장한 글',
  robots: { index: false, follow: true },
};

export default function BookmarksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
