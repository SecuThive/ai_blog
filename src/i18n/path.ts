import { defaultLocale, isLocale, type Locale } from './config';
import { CAT_TO_SLUG, SLUG_TO_CAT } from './categories';

const NO_PREFIX = ['/api', '/rss', '/ads.txt', '/sitemap.xml', '/robots.txt'];

export function stripLocale(pathname: string): string {
  if (pathname === '/en' || pathname === '/ko') return '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3) || '/';
  if (pathname.startsWith('/ko/')) return pathname.slice(3) || '/';
  return pathname || '/';
}

export function localeFromPathname(pathname: string): Locale {
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en';
  return defaultLocale;
}

function swapCategorySegment(path: string, locale: Locale): string {
  const match = path.match(/^(\/category\/)([^/?#]+)(.*)$/);
  if (!match) return path;
  const [, prefix, raw, rest] = match;
  let cat = raw;
  try { cat = decodeURIComponent(raw); } catch { /* keep raw */ }
  if (locale === 'en') {
    const slug = CAT_TO_SLUG[cat] ?? cat;
    return `${prefix}${slug}${rest}`;
  }
  const korean = SLUG_TO_CAT[cat] ?? cat;
  return `${prefix}${korean}${rest}`;
}

export function withLocale(href: string, locale: Locale): string {
  if (!href.startsWith('/')) return href;
  if (NO_PREFIX.some(p => href === p || href.startsWith(`${p}/`) || href.startsWith(`${p}?`))) {
    return href;
  }
  const [pathname, search = ''] = href.split(/(?=[?#])/);
  let path = stripLocale(pathname);
  path = swapCategorySegment(path, locale);
  if (locale === 'en') {
    const prefixed = path === '/' ? '/en' : `/en${path}`;
    return `${prefixed}${search}`;
  }
  return `${path}${search}`;
}

export function publicPath(pathname: string): string {
  const locale = localeFromPathname(pathname);
  const stripped = stripLocale(pathname);
  return withLocale(stripped, locale);
}
