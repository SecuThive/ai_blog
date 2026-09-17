export const locales = ['ko', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ko';

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'ko' || value === 'en';
}
