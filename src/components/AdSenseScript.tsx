'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { NOINDEX_POST_SLUGS } from '@/lib/noindexPosts';

/**
 * 승인 후 수동 광고 단위 운영을 전제로 광고 스크립트를 고유 콘텐츠가 충분한 화면에서만 로드한다.
 * 홈, 색인 가능한 블로그 글, 엔지니어 가이드만 수익화 대상으로 삼아
 * 검색·목록·법적 고지·문의·구독·개인 저장·noindex 글에는 광고 단위를 두지 않는다.
 */
function isMonetizablePath(pathname: string): boolean {
  if (pathname === '/') return true;
  if (/^\/engineer\/[^/]+\/?$/.test(pathname)) return true;
  if (/^\/blog\/[^/]+\/?$/.test(pathname)) {
    const encodedSlug = pathname.split('/')[2] ?? '';
    try {
      return !NOINDEX_POST_SLUGS.has(decodeURIComponent(encodedSlug));
    } catch {
      return false;
    }
  }
  return false;
}

export default function AdSenseScript({ adsenseId }: { adsenseId: string }) {
  const pathname = usePathname() ?? '/';
  if (!isMonetizablePath(pathname)) return null;
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
