import { makeFreshClient } from '@/lib/supabase';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nodelog.kr';
  const client = makeFreshClient();

  const [postsRes, guidesRes, tagsRes] = await Promise.all([
    client
      .from('posts')
      .select('slug,published_at,tags')
      .eq('status', 'published'),
    client
      .from('engineer_guides')
      .select('slug,updated_at')
      .eq('status', 'published'),
    client
      .from('posts')
      .select('tags')
      .eq('status', 'published'),
  ]);

  const posts = ((postsRes.data ?? []) as { slug: string; published_at: string; tags: string[] }[]).map(p => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.published_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const guides = ((guidesRes.data ?? []) as { slug: string; updated_at: string }[]).map(g => ({
    url: `${base}/engineer/${g.slug}`,
    lastModified: new Date(g.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const seriesSet = new Set<string>();
  const tagSet = new Set<string>();
  for (const row of (tagsRes.data ?? []) as { tags: string[] }[]) {
    for (const tag of row.tags ?? []) {
      if (tag.startsWith('series:')) {
        seriesSet.add(tag.replace('series:', ''));
      } else {
        tagSet.add(tag);
      }
    }
  }

  const seriesPages = Array.from(seriesSet).map(name => ({
    url: `${base}/series/${encodeURIComponent(name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const tagPages = Array.from(tagSet).map(tag => ({
    url: `${base}/tag/${encodeURIComponent(tag)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  const staticPages = [
    { url: base, changeFrequency: 'daily' as const, priority: 1 },
    { url: `${base}/engineer`, changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${base}/series`, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${base}/trending`, changeFrequency: 'hourly' as const, priority: 0.7 },
    { url: `${base}/tags`, changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${base}/archive`, changeFrequency: 'daily' as const, priority: 0.6 },
    { url: `${base}/curated`, changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${base}/recommend`, changeFrequency: 'daily' as const, priority: 0.6 },
    { url: `${base}/about`, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: 'monthly' as const, priority: 0.4 },
    { url: `${base}/faq`, changeFrequency: 'monthly' as const, priority: 0.4 },
  ].map(p => ({ ...p, lastModified: new Date() }));

  return [...staticPages, ...posts, ...guides, ...seriesPages, ...tagPages];
}
