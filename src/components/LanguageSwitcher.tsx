'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/i18n/provider';
import { stripLocale, withLocale } from '@/i18n/path';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname() ?? '/';
  const path = stripLocale(pathname);
  const koHref = withLocale(path, 'ko');
  const enHref = withLocale(path, 'en');

  return (
    <nav className="lang-switch" aria-label="Language">
      <NextLink
        href={koHref}
        hrefLang="ko"
        className={locale === 'ko' ? 'active' : ''}
        aria-current={locale === 'ko' ? 'true' : undefined}
      >
        KO
      </NextLink>
      <span className="lang-switch-sep" aria-hidden="true">/</span>
      <NextLink
        href={enHref}
        hrefLang="en"
        className={locale === 'en' ? 'active' : ''}
        aria-current={locale === 'en' ? 'true' : undefined}
      >
        EN
      </NextLink>
    </nav>
  );
}
