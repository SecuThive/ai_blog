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

function shouldPassthrough(pathname: string): boolean {
  if (PASSTHROUGH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  // Static files in /public (llms.txt, images, etc.)
  if (pathname.includes('.') && !pathname.startsWith('/blog/') && !pathname.startsWith('/engineer/')) {
    return true;
  }
  return false;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (shouldPassthrough(pathname)) return undefined;

  const first = pathname.split('/').filter(Boolean)[0];

  // Default locale is unprefixed: /ko/... → /...
  if (first === defaultLocale) {
    const stripped = pathname.replace(/^\/ko/, '') || '/';
    const url = request.nextUrl.clone();
    url.pathname = stripped;
    return NextResponse.redirect(url);
  }

  // English lives at /en/...
  if (isLocale(first)) return undefined;

  // No locale prefix → rewrite internally to /ko/...
  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};

