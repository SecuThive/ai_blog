import { makeFreshClient } from '@/lib/supabase';
import type { MetadataRoute } from 'next';

// ISR: sitemap을 1시간마다 재생성해 DB 변경(시리즈 강등/발행 등)이 반영되도록 함.
// (이게 없으면 빌드 시점 정적 캐시로 고정되어 DB 변경이 sitemap에 안 나타남)
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';
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
  const tagCount = new Map<string, number>();
  for (const row of (tagsRes.data ?? []) as { tags: string[] }[]) {
    for (const tag of row.tags ?? []) {
      if (tag.startsWith('series:')) {
        seriesSet.add(tag.replace('series:', ''));
      } else {
        tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
      }
    }
  }

  const seriesPages = Array.from(seriesSet).map(name => ({
    url: `${base}/series/${encodeURIComponent(name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // 얇은 태그 페이지(글 < MIN_TAG_POSTS)는 sitemap에서 제외 — low-value/doorway 페이지 방지.
  // 태그 페이지(tag/[tag])의 noindex 임계값과 동일하게 유지할 것.
  const MIN_TAG_POSTS = 3;
  const tagPages = Array.from(tagCount.entries())
    .filter(([, count]) => count >= MIN_TAG_POSTS)
    .map(([tag]) => ({
      url: `${base}/tag/${encodeURIComponent(tag)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));

  const CATEGORIES = ['AI & 자동화', 'IT 트렌드', '개발', '툴 리뷰', '보안', '인프라'];
  const categoryPages = CATEGORIES.map(cat => ({
    url: `${base}/category/${encodeURIComponent(cat)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
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

  return [...staticPages, ...categoryPages, ...posts, ...guides, ...seriesPages, ...tagPages];
}
