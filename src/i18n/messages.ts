import type { Locale } from './config';
import ko from './messages/ko.json';
import en from './messages/en.json';

export type Messages = typeof ko;

const dictionaries: Record<Locale, Messages> = { ko, en };

export function getDictionary(locale: Locale): Messages {
  return dictionaries[locale] ?? dictionaries.ko;
}

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}
