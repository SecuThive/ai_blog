import type { Locale } from './config';

export const I18N_TITLE_PREFIX = 'i18n.title:';
export const I18N_EXCERPT_PREFIX = 'i18n.excerpt:';
export const I18N_BLOCK_START = '<!--NodelogEN';
export const I18N_BLOCK_END = 'NodelogEN-->';

export function pickLocalized(
  locale: Locale,
  original: string | null | undefined,
  translated: string | null | undefined,
): { value: string; isFallback: boolean } {
  const src = original ?? '';
  if (locale !== 'en') return { value: src, isFallback: false };
  const en = translated?.trim();
  if (en) return { value: en, isFallback: false };
  return { value: src, isFallback: true };
}

export interface EmbeddedEn {
  title?: string;
  excerpt?: string;
  content?: string;
}

export function parseEmbeddedEn(content: string | null | undefined): EmbeddedEn | null {
  if (!content) return null;
  const start = content.indexOf(I18N_BLOCK_START);
  const end = content.lastIndexOf(I18N_BLOCK_END);
  if (start === -1 || end === -1 || end <= start) return null;
  const raw = content.slice(start + I18N_BLOCK_START.length, end).trim();
  try {
    const parsed = JSON.parse(raw) as EmbeddedEn;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function stripEmbeddedEn(content: string | null | undefined): string {
  if (!content) return '';
  const start = content.indexOf(`\n\n${I18N_BLOCK_START}`);
  if (start !== -1) return content.slice(0, start).trimEnd();
  const alt = content.indexOf(I18N_BLOCK_START);
  if (alt !== -1) return content.slice(0, alt).trimEnd();
  return content;
}

export function tagValue(tags: string[] | null | undefined, prefix: string): string | null {
  const hit = (tags ?? []).find((t) => t.startsWith(prefix));
  if (!hit) return null;
  const value = hit.slice(prefix.length).trim();
  return value || null;
}

function evidenceEn(evidence: unknown): EmbeddedEn | null {
  if (!evidence || typeof evidence !== 'object') return null;
  const en = (evidence as { en?: unknown }).en;
  if (!en || typeof en !== 'object') return null;
  return en as EmbeddedEn;
}

export interface LocalizablePost {
  title: string;
  excerpt?: string | null;
  content?: string | null;
  title_en?: string | null;
  excerpt_en?: string | null;
  content_en?: string | null;
  tags?: string[] | null;
  content_evidence?: unknown;
}

export function localizePost<T extends LocalizablePost>(post: T, locale: Locale): T & { isEnglishFallback: boolean } {
  const embedded = parseEmbeddedEn(post.content);
  const evidence = evidenceEn(post.content_evidence);
  const koreanContent = stripEmbeddedEn(post.content);
  if (locale !== 'en') {
    return { ...post, content: koreanContent, isEnglishFallback: false };
  }
  const title = pickLocalized(
    locale,
    post.title,
    post.title_en || tagValue(post.tags, I18N_TITLE_PREFIX) || evidence?.title || embedded?.title,
  );
  const excerpt = pickLocalized(
    locale,
    post.excerpt,
    post.excerpt_en || tagValue(post.tags, I18N_EXCERPT_PREFIX) || evidence?.excerpt || embedded?.excerpt,
  );
  const content = pickLocalized(
    locale,
    koreanContent,
    post.content_en || evidence?.content || embedded?.content,
  );
  return {
    ...post,
    title: title.value,
    excerpt: excerpt.value,
    content: content.value,
    isEnglishFallback: content.isFallback && title.isFallback,
  };
}

export interface LocalizableGuide {
  title: string;
  summary?: string | null;
  content?: string | null;
  title_en?: string | null;
  summary_en?: string | null;
  content_en?: string | null;
  tags?: string[] | null;
}

export function localizeGuide<T extends LocalizableGuide>(guide: T, locale: Locale): T & { isEnglishFallback: boolean } {
  const embedded = parseEmbeddedEn(guide.content);
  const koreanContent = stripEmbeddedEn(guide.content);
  if (locale !== 'en') {
    return { ...guide, content: koreanContent, isEnglishFallback: false };
  }
  const title = pickLocalized(
    locale,
    guide.title,
    guide.title_en || tagValue(guide.tags, I18N_TITLE_PREFIX) || embedded?.title,
  );
  const summary = pickLocalized(
    locale,
    guide.summary,
    guide.summary_en || tagValue(guide.tags, I18N_EXCERPT_PREFIX) || embedded?.excerpt,
  );
  const content = pickLocalized(
    locale,
    koreanContent,
    guide.content_en || embedded?.content,
  );
  return {
    ...guide,
    title: title.value,
    summary: summary.value,
    content: content.value,
    isEnglishFallback: content.isFallback && title.isFallback,
  };
}
