'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/i18n/provider';
import { stripLocale, withLocale } from '@/i18n/path';

export default function LanguageSwitcher() {
  const { locale, dict } = useT();
  const pathname = usePathname() ?? '/';
  const path = stripLocale(pathname);
  const koHref = withLocale(path, 'ko');
  const enHref = withLocale(path, 'en');

  return (
    <nav className="lang-switch" data-locale={locale} aria-label={dict.lang.label}>
      <span className="lang-switch-thumb" aria-hidden="true" />
      <NextLink
        href={koHref}
        hrefLang="ko"
        className={locale === 'ko' ? 'active' : ''}
        aria-current={locale === 'ko' ? 'true' : undefined}
        aria-label={dict.lang.switchToKo}
        title={dict.lang.switchToKo}
      >
        KO
      </NextLink>
      <NextLink
        href={enHref}
        hrefLang="en"
        className={locale === 'en' ? 'active' : ''}
        aria-current={locale === 'en' ? 'true' : undefined}
        aria-label={dict.lang.switchToEn}
        title={dict.lang.switchToEn}
      >
        EN
      </NextLink>
    </nav>
  );
}
