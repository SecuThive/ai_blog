import Link from '@/i18n/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import { readingTime, makeFreshClient } from '@/lib/supabase';
import { TAG_REDIRECTS } from '@/lib/tagRedirects';
import TagLoadMore from '@/components/TagLoadMore';
import { publicTags } from '@/lib/utils';
import { isLocale } from '@/i18n/config';
import { getDictionary, interpolate } from '@/i18n/messages';
import { pageMetadata, siteUrl } from '@/i18n/metadata';
import { tagLabel } from '@/i18n/display';
import { withLocale } from '@/i18n/path';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; tag: string }> }): Promise<Metadata> {
  const { tag, locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  const decoded = decodeURIComponent(tag);
  const label = tagLabel(decoded, locale) ?? decoded;
  if (decoded.startsWith('series:') || /^ep:\d+$/.test(decoded)) {
    return { title: dict.common.notFoundTitle, robots: { index: false, follow: false } };
  }
  const redirectTarget = TAG_REDIRECTS[decoded];
  if (redirectTarget) {
    return {
      title: `#${tagLabel(redirectTarget, locale) ?? redirectTarget} — Nodelog`,
      alternates: { canonical: siteUrl(`/tag/${encodeURIComponent(redirectTarget)}`, locale) },
      robots: { index: false, follow: true },
    };
  }
  const description = locale === 'en'
    ? `Posts tagged “${label}”.`
    : `"${decoded}" 태그로 분류된 글 모음`;
  return pageMetadata({
    locale,
    path: `/tag/${encodeURIComponent(decoded)}`,
    title: `#${label} — Nodelog`,
    description,
    robots: { index: false, follow: true },
  });
}

interface PostRow {
  id: number; title: string; slug: string; excerpt: string;
  category: string; published_at: string; reading_time: number;
  cover_image?: string;
  tags?: string[] | null;
  content_evidence?: unknown;
}

async function getPostsByTag(tag: string): Promise<PostRow[]> {
  noStore();
  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,excerpt,cover_image,category,tags,published_at,views,content,content_evidence')
    .eq('status', 'published')
    .contains('tags', [tag])
    .order('published_at', { ascending: false });
  return (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as number, title: p.title as string, slug: p.slug as string,
    excerpt: p.excerpt as string, category: p.category as string,
    published_at: p.published_at as string, cover_image: p.cover_image as string | undefined,
    tags: p.tags as string[] | null,
    content_evidence: p.content_evidence,
    reading_time: readingTime((p.content as string) ?? ''),
  }));
}

async function getRelatedTags(tag: string): Promise<string[]> {
  noStore();
  const { data } = await makeFreshClient()
    .from('posts')
    .select('tags')
    .eq('status', 'published')
    .contains('tags', [tag]);

  const tagCount = new Map<string, number>();
  for (const p of (data ?? [])) {
    for (const t of publicTags(p.tags as string[] ?? [])) {
      if (t !== tag) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    }
  }
  return Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t]) => t);
}

export default async function TagDetailPage({ params }: { params: Promise<{ locale: string; tag: string }> }) {
  const { tag: tagParam, locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  const tag = decodeURIComponent(tagParam);
  const label = tagLabel(tag, locale) ?? tag;

  if (tag.startsWith('series:') || /^ep:\d+$/.test(tag)) notFound();

  const redirectTarget = TAG_REDIRECTS[tag];
  if (redirectTarget) permanentRedirect(withLocale(`/tag/${encodeURIComponent(redirectTarget)}`, locale));

  const [posts, relatedTags] = await Promise.all([
    getPostsByTag(tag),
    getRelatedTags(tag),
  ]);
  if (posts.length === 0) notFound();

  const related = relatedTags
    .map((t) => {
      const lbl = tagLabel(t, locale);
      return lbl ? { raw: t, label: lbl } : null;
    })
    .filter((t): t is { raw: string; label: string } => t !== null);

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="crumbs">
            <Link href="/">{dict.common.home}</Link><span className="sep">/</span>
            <Link href="/tags">{dict.pages.tagsTitle}</Link><span className="sep">/</span>
            <span style={{ color: 'var(--text-1)' }}>#{label}</span>
          </div>
          <div className="page-eyebrow" style={{ marginTop: 12 }}>TAG</div>
          <h1 className="page-title" style={{ marginBottom: 12 }}>#{label}</h1>
          <p className="page-lead">
            {locale === 'en' ? `Posts tagged “${label}”.` : `"${tag}" 키워드로 분류된 글 모음.`}
          </p>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-3)', letterSpacing: '0.04em', marginTop: 12 }}>
            <strong style={{ color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>{posts.length}</strong> POSTS
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="split">
            <div>
              {posts.length === 0 ? (
                <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)' }}>
                    {dict.pages.tagEmpty}
                  </div>
                </div>
              ) : (
                <TagLoadMore posts={posts} />
              )}
            </div>

            <aside className="aside-rail">
              {related.length > 0 && (
                <div className="widget">
                  <h5>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    {dict.pages.relatedTags}
                  </h5>
                  <div className="pill-row">
                    {related.map(t => (
                      <Link key={t.raw} href={`/tag/${encodeURIComponent(t.raw)}`} className="tag-chip">{t.label}</Link>
                    ))}
                  </div>
                </div>
              )}
              <div className="widget">
                <h5>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                  {dict.pages.tagsTitle}
                </h5>
                <Link href="/tags" className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  {dict.home.allTags}
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
