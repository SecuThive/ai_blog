import type { Locale } from './config';

/** Korean category name → English URL slug */
export const CAT_TO_SLUG: Record<string, string> = {
  'AI & 자동화': 'ai-automation',
  '개발': 'development',
  '툴 리뷰': 'tool-reviews',
  'IT 트렌드': 'it-trends',
  '보안': 'security',
  '인프라': 'infrastructure',
};

/** English slug → Korean category name */
export const SLUG_TO_CAT: Record<string, string> = Object.fromEntries(
  Object.entries(CAT_TO_SLUG).map(([k, v]) => [v, k]),
);

export const CATEGORY_LABELS: Record<string, { ko: string; en: string }> = {
  'AI & 자동화': { ko: 'AI 자동화', en: 'AI & Automation' },
  '개발': { ko: '개발', en: 'Development' },
  '툴 리뷰': { ko: '툴 리뷰', en: 'Tool Reviews' },
  'IT 트렌드': { ko: 'IT 트렌드', en: 'IT Trends' },
  '보안': { ko: '보안', en: 'Security' },
  '인프라': { ko: '인프라', en: 'Infrastructure' },
};

export const ENGINEER_CAT_LABELS: Record<string, { ko: string; en: string }> = {
  'Linux / Shell': { ko: 'Linux / Shell', en: 'Linux / Shell' },
  'Docker / 컨테이너': { ko: 'Docker / 컨테이너', en: 'Docker / Containers' },
  'Git / CI·CD': { ko: 'Git / CI·CD', en: 'Git / CI·CD' },
  '네트워킹 / 서버': { ko: '네트워킹 / 서버', en: 'Networking / Servers' },
  'OS / 시스템': { ko: 'OS / 시스템', en: 'OS / Systems' },
  '보안 설정': { ko: '보안 설정', en: 'Security Hardening' },
  '클라우드': { ko: '클라우드', en: 'Cloud' },
  '데이터베이스': { ko: '데이터베이스', en: 'Databases' },
  '트러블슈팅': { ko: '트러블슈팅', en: 'Troubleshooting' },
};

export function categoryLabel(cat: string, locale: Locale): string {
  return CATEGORY_LABELS[cat]?.[locale] ?? cat;
}

export function engineerCatLabel(cat: string, locale: Locale): string {
  return ENGINEER_CAT_LABELS[cat]?.[locale] ?? cat;
}

export function toKoreanCategory(param: string): string {
  try {
    const decoded = decodeURIComponent(param);
    return SLUG_TO_CAT[decoded] ?? decoded;
  } catch {
    return SLUG_TO_CAT[param] ?? param;
  }
}

export function categoryHref(cat: string, locale: Locale): string {
  const slug = locale === 'en' ? (CAT_TO_SLUG[cat] ?? cat) : cat;
  return `/category/${slug}`;
}
