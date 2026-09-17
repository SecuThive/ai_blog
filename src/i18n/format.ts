import type { Locale } from './config';
import { interpolate, type Messages } from './messages';

export function formatTimeAgo(dateStr: string, locale: Locale, dict: Messages): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return dict.common.justNow;
  if (m < 60) return interpolate(dict.common.minutesAgo, { m });
  const h = Math.floor(m / 60);
  if (h < 24) return interpolate(dict.common.hoursAgo, { h });
  const d = Math.floor(h / 24);
  if (d < 7) return interpolate(dict.common.daysAgo, { d });
  const tag = locale === 'en' ? 'en-US' : 'ko-KR';
  return new Date(dateStr).toLocaleDateString(tag, { month: 'short', day: 'numeric' });
}

export function formatDate(dateStr: string, locale: Locale): string {
  const tag = locale === 'en' ? 'en-US' : 'ko-KR';
  return new Date(dateStr).toLocaleDateString(tag, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
