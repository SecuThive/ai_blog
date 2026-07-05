'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

/**
 * 애드센스 스크립트를 콘텐츠 페이지에서만 로드한다.
 * 정책상 광고가 부적절한 페이지(검색 결과·법적 고지·문의·구독·개인 저장 목록)
 * 에서는 로드하지 않는다. (404는 진짜 404 상태코드를 반환하므로
 * AdSense 크롤러가 광고 대상으로 삼지 않는다.)
 */
const EXCLUDED_PREFIXES = [
  '/search',
  '/privacy',
  '/terms',
  '/policy',
  '/contact',
  '/subscribe',
  '/bookmarks',
];

export default function AdSenseScript({ adsenseId }: { adsenseId: string }) {
  const pathname = usePathname() ?? '/';
  const excluded = EXCLUDED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (excluded) return null;
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
