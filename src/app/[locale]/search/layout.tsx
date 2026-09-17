import type { Metadata } from 'next';

// 사이트 내 검색 결과 페이지: 색인 제외(noindex), 링크는 따라가도록(follow).
// 검색 결과 URL이 색인되면 low-value/soft-404 신호가 되므로 차단한다.
export const metadata: Metadata = {
  title: '검색',
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
