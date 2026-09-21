import Link from '@/i18n/link';
import type { Metadata } from 'next';
import { supabaseAdmin, readingTime } from '@/lib/supabase';
import { catTone } from '@/lib/utils';
import PostThumb from '@/components/PostThumb';
import { isLocale } from '@/i18n/config';
import { getDictionary, interpolate } from '@/i18n/messages';
import { pageMetadata } from '@/i18n/metadata';
import { categoryLabel, categoryHref } from '@/i18n/categories';
import { titleForLocale, excerptForLocale } from '@/i18n/content';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: '/curated',
    title: dict.pages.curatedTitle,
    description: dict.pages.curatedLead,
  });
}

interface PostRow {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  published_at: string;
  reading_time: number;
  cover_image?: string;
  views: number;
  tags?: string[];
  content_evidence?: unknown;
}

async function getPostsByCategory(category: string): Promise<PostRow[]> {
  const { data } = await supabaseAdmin()
    .from('posts')
    .select('id,title,slug,excerpt,cover_image,category,published_at,views,content,tags,content_evidence')
    .eq('status', 'published')
    .eq('category', category)
    .order('views', { ascending: false })
    .limit(3);

  return (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as number,
    title: p.title as string,
    slug: p.slug as string,
    excerpt: p.excerpt as string,
    category: p.category as string,
    published_at: p.published_at as string,
    cover_image: p.cover_image as string | undefined,
    views: (p.views as number) ?? 0,
    reading_time: readingTime((p.content as string) ?? ''),
    tags: (p.tags as string[]) ?? [],
    content_evidence: p.content_evidence,
  }));
}

export default async function CuratedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);

  const COLLECTIONS = [
    { id: 'security', category: '보안', t: dict.pages.curatedSecTitle, s: dict.pages.curatedSecLead, tone: 'rose', icon: '🔐' },
    { id: 'ai', category: 'AI & 자동화', t: dict.pages.curatedAiTitle, s: dict.pages.curatedAiLead, tone: 'purple', icon: '🤖' },
    { id: 'infra', category: '인프라', t: dict.pages.curatedInfraTitle, s: dict.pages.curatedInfraLead, tone: 'blue', icon: '⚙️' },
    { id: 'dev', category: '개발', t: dict.pages.curatedDevTitle, s: dict.pages.curatedDevLead, tone: 'mint', icon: '💻' },
  ];

  const collections = await Promise.all(
    COLLECTIONS.map(async (col) => ({
      ...col,
      posts: await getPostsByCategory(col.category),
    })),
  );
  const nonEmpty = collections.filter((c) => c.posts.length > 0);

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">{dict.pages.curatedEyebrow}</div>
          <h1 className="page-title">{dict.pages.curatedTitle}</h1>
          <p className="page-lead">{dict.pages.curatedLead}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {nonEmpty.length === 0 ? (
            <div className="card" style={{ padding: '60px 0', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-3)' }}>{dict.pages.curatedEmpty}</p>
              <Link href="/" className="btn btn-ghost" style={{ marginTop: 16 }}>
                {dict.common.backHomeLong}
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
              {nonEmpty.map((col) => (
                <div key={col.id}>
                  <div className="section-head" style={{ marginBottom: 24 }}>
                    <div>
                      <div className="section-eyebrow" style={{ color: `var(--acc-${col.tone})` }}>
                        {col.icon} COLLECTION
                      </div>
                      <h2 style={{ margin: '4px 0 6px', fontSize: 24, letterSpacing: '-0.02em' }}>{col.t}</h2>
                      <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 14 }}>{col.s}</p>
                    </div>
                    <Link href={categoryHref(col.category, locale)} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
                      {dict.pages.curatedViewAll}
                    </Link>
                  </div>
                  <div className="grid-3">
                    {col.posts.map((p) => {
                      const tone = catTone(p.category);
                      const title = titleForLocale(locale, p.title, { tags: p.tags, content_evidence: p.content_evidence });
                      const excerpt = excerptForLocale(locale, p.excerpt, { tags: p.tags, content_evidence: p.content_evidence });
                      return (
                        <Link key={p.id} href={`/blog/${p.slug}`} className="card card-link">
                          <PostThumb slug={p.slug} title={title} coverImage={p.cover_image} category={p.category} />
                          <div className="card-body">
                            <div className="card-meta">
                              <span className={`badge badge-${tone}`}>{categoryLabel(p.category, locale)}</span>
                              {p.views > 0 && (
                                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)' }}>
                                  {dict.pages.curatedViews} {p.views.toLocaleString()}
                                </span>
                              )}
                            </div>
                            <h3 className="card-title">{title}</h3>
                            <p className="card-excerpt">{excerpt}</p>
                            <div className="card-foot">
                              <span>{interpolate(dict.common.minRead, { min: p.reading_time })}</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
