import Link from '@/i18n/link';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import { makeFreshClient } from '@/lib/supabase';
import { catTone, publicTags } from '@/lib/utils';
import { isLocale } from '@/i18n/config';
import { getDictionary, interpolate } from '@/i18n/messages';
import { pageMetadata } from '@/i18n/metadata';
import { categoryLabel } from '@/i18n/categories';
import { tagLabel } from '@/i18n/display';

export const revalidate = 60;

interface TagInfo { tag: string; label: string; count: number }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: '/tags',
    title: dict.pages.tagsTitle,
    description: dict.pages.tagsLead.replace('{count}', ''),
  });
}

async function getTags(locale: 'ko' | 'en'): Promise<{ popular: TagInfo[]; byCategory: { cat: string; label: string; tone: string; tags: TagInfo[] }[]; total: number }> {
  noStore();
  const { data } = await makeFreshClient()
    .from('posts')
    .select('tags,category')
    .eq('status', 'published');

  const tagCount = new Map<string, number>();
  const catTags = new Map<string, Map<string, number>>();

  for (const p of (data ?? [])) {
    const tags = publicTags((p.tags ?? []) as string[]);
    const cat = p.category as string;
    if (!catTags.has(cat)) catTags.set(cat, new Map());
    for (const t of tags) {
      tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
      const ctMap = catTags.get(cat)!;
      ctMap.set(t, (ctMap.get(t) ?? 0) + 1);
    }
  }

  const toInfo = (tag: string, count: number): TagInfo | null => {
    const label = tagLabel(tag, locale);
    if (!label) return null;
    return { tag, label, count };
  };

  const popular = Array.from(tagCount.entries())
    .map(([tag, count]) => toInfo(tag, count))
    .filter((t): t is TagInfo => t !== null)
    .sort((a, b) => b.count - a.count)
    .slice(0, 40);

  const byCategory = Array.from(catTags.entries()).map(([cat, tMap]) => ({
    cat,
    label: categoryLabel(cat, locale),
    tone: catTone(cat),
    tags: Array.from(tMap.entries())
      .map(([tag, count]) => toInfo(tag, count))
      .filter((t): t is TagInfo => t !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  })).filter(c => c.tags.length > 0);

  return { popular, byCategory, total: tagCount.size };
}

export default async function TagsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  const { popular, byCategory, total } = await getTags(locale);

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">TAGS</div>
          <h1 className="page-title">{dict.pages.tagsTitle}</h1>
          <p className="page-lead">{interpolate(dict.pages.tagsLead, { count: total })}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ marginBottom: 28, fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em' }}>
            POPULAR
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 56 }}>
            {popular.map(({ tag, label, count }) => (
              <Link
                key={tag}
                href={`/tag/${encodeURIComponent(tag)}`}
                className="tag-chip"
                style={{ fontSize: 13.5, padding: '8px 14px' }}
              >
                #{label} <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', marginLeft: 4 }}>{count}</span>
              </Link>
            ))}
            {popular.length === 0 && (
              <div style={{ color: 'var(--text-4)', fontSize: 14 }}>{dict.home.tagsEmpty}</div>
            )}
          </div>

          {byCategory.length > 0 && (
            <>
              <div style={{ marginBottom: 28, fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em' }}>
                BY CATEGORY
              </div>
              <div className="grid-2">
                {byCategory.map(c => (
                  <div key={c.cat} className="card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h4 style={{ margin: 0, fontSize: 15, letterSpacing: '-0.01em' }}>{c.label}</h4>
                      <span className={`badge badge-${c.tone}`}>{c.label}</span>
                    </div>
                    <div className="pill-row">
                      {c.tags.map(({ tag, label, count }) => (
                        <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`} className="tag-chip">
                          {label} <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', marginLeft: 2 }}>{count}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
