import type { Metadata } from 'next';
import type { Locale } from './config';
import { withLocale } from './path';
import { getDictionary } from './messages';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export function siteUrl(path: string, locale: Locale = 'ko'): string {
  const loc = withLocale(path, locale);
  return `${SITE_URL}${loc === '/' ? '' : loc}`;
}

export function languageAlternates(path: string): NonNullable<Metadata['alternates']>['languages'] {
  return {
    ko: siteUrl(path, 'ko'),
    en: siteUrl(path, 'en'),
    'x-default': siteUrl(path, 'ko'),
  };
}

export function pageMetadata({
  locale,
  path,
  title,
  description,
  robots,
}: {
  locale: Locale;
  path: string;
  title?: string;
  description?: string;
  robots?: Metadata['robots'];
}): Metadata {
  const dict = getDictionary(locale);
  const url = siteUrl(path, locale);
  const resolvedTitle = title ?? dict.meta.siteName;
  const resolvedDesc = description ?? dict.meta.siteDesc;
  return {
    title: resolvedTitle,
    description: resolvedDesc,
    alternates: {
      canonical: url,
      languages: languageAlternates(path),
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDesc,
      url,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'ko_KR',
      alternateLocale: locale === 'en' ? ['ko_KR'] : ['en_US'],
    },
    twitter: { card: 'summary_large_image', title: resolvedTitle, description: resolvedDesc },
    ...(robots ? { robots } : {}),
  };
}
