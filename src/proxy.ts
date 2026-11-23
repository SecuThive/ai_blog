import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { defaultLocale, isLocale } from '@/i18n/config';

const PASSTHROUGH_PREFIXES = [
  '/admin',
  '/_next',
  '/api',
  '/rss',
  '/ads.txt',
  '/sitemap.xml',
  '/robots.txt',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/apple-icon',
  '/icon',
  '/thivelab',
];

// 경로 값에 '.'이 들어갈 수 있는 콘텐츠 라우트. 정적 파일로 오인해 로캘 rewrite를 건너뛰면 404가 된다.
const CONTENT_PREFIXES = ['/blog/', '/engineer/', '/tag/', '/series/', '/category/'];

const LEGACY_BLOG_SLUGS: Record<string, string> = {
  '개인정보-위탁-vs-제3자-제공-차이-동의-널-받아야-할까-2026-가이드':
    '개인정보-위탁-vs-제3자-제공-차이-동의-또-받아야-할까-2026-가이드',
  '2026-isms-p-인증-준비-체크리스트-102개-항목빈출-결함-실무-가이드':
    '2026-isms-p-인증-준비-체크리스트-의무대상절차비용-총정리',
};

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
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  }
  // Next's permanentRedirect and next.config permanent: true use 308. These
  // historically indexed URLs need an actual HTTP 301 on their first hop.
  const legacyMatch = pathname.match(/^\/(en\/|ko\/)?blog\/([^/]+)$/);
  if (legacyMatch) {
    let slug: string;
    try {
      slug = decodeURIComponent(legacyMatch[2]);
    } catch {
      slug = '';
    }
    const target = LEGACY_BLOG_SLUGS[slug]
      ?? (slug.includes('동의-널-받아야-할까')
        ? LEGACY_BLOG_SLUGS['개인정보-위탁-vs-제3자-제공-차이-동의-널-받아야-할까-2026-가이드']
        : slug.includes('102개-항목빈출-결함-실무-가이드')
          ? LEGACY_BLOG_SLUGS['2026-isms-p-인증-준비-체크리스트-102개-항목빈출-결함-실무-가이드']
          : undefined);
    if (target) {
      const url = request.nextUrl.clone();
      url.pathname = `/${legacyMatch[1] === 'en/' ? 'en/' : ''}blog/${encodeURIComponent(target)}`;
      return NextResponse.redirect(url, 301);
    }
  }
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
