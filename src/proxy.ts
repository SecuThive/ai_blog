import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { defaultLocale, isLocale } from '@/i18n/config';

const PASSTHROUGH_PREFIXES = [
  '/api',
  '/rss',
  '/ads.txt',
  '/sitemap.xml',
  '/robots.txt',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/apple-icon',
  '/icon',
];

// 경로 값에 '.'이 들어갈 수 있는 콘텐츠 라우트. 정적 파일로 오인해 로캘 rewrite를 건너뛰면 404가 된다.
const CONTENT_PREFIXES = ['/blog/', '/engineer/', '/tag/', '/series/', '/category/'];

function shouldPassthrough(pathname: string): boolean {
  if (PASSTHROUGH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  // Static files in /public (llms.txt, images, etc.). 콘텐츠 라우트(태그 'Node.js' 같은 값 포함)는 제외한다.
  if (pathname.includes('.') && !CONTENT_PREFIXES.some((p) => pathname.startsWith(p))) {
    return true;
  }
  return false;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (shouldPassthrough(pathname)) return undefined;

  const first = pathname.split('/').filter(Boolean)[0];

  // next start may pass an internal locale rewrite through Proxy again. Keep the
  // rewritten /ko route internal instead of redirecting it back to the public URL.
  if (request.headers.get('x-thivelab-internal-locale') === 'ko' && first === defaultLocale) {
    return NextResponse.next();
  }

  // Default locale is unprefixed: /ko/... → /...
  if (first === defaultLocale) {
    const stripped = pathname.replace(/^\/ko/, '') || '/';
    const url = new URL(stripped, process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com');
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url, 308);
  }

  // English lives at /en/...
  if (isLocale(first)) return undefined;

  // No locale prefix → rewrite internally to /ko/...
  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
  // Cloudflare sets X-Forwarded-Proto: https, but next start listens on plain
  // HTTP locally. Rewriting to https://localhost:<port> would return 500.
  url.protocol = 'http:';
  const headers = new Headers(request.headers);
  headers.set('x-thivelab-internal-locale', defaultLocale);
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
    // 위 패턴은 '.'이 들어간 경로를 모두 제외하므로, 값에 '.'이 올 수 있는 콘텐츠 라우트는 따로 매칭한다.
    '/blog/:path*',
    '/engineer/:path*',
    '/tag/:path*',
    '/series/:path*',
    '/category/:path*',
  ],
};
