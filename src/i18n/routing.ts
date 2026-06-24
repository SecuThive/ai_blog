import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
  localePrefix: 'as-needed', // 한국어: /, 영어: /en/
});

export type Locale = (typeof routing.locales)[number];
