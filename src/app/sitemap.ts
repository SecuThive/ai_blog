import { makeFreshClient } from '@/lib/supabase';
import type { MetadataRoute } from 'next';

// ISR: sitemap을 1시간마다 재생성해 DB 변경(시리즈 강등/발행 등)이 반영되도록 함.
// (이게 없으면 빌드 시점 정적 캐시로 고정되어 DB 변경이 sitemap에 안 나타남)
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';
  const client = makeFreshClient();

  const [postsRes, guidesRes] = await Promise.all([
    client
      .from('posts')
      .select('slug,published_at,tags,category')
      .eq('status', 'published'),
    client
      .from('engineer_guides')
      .select('slug,updated_at')
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

  // lastmod는 "그 목록 페이지에 마지막으로 글이 추가된 시점"을 반영해야 한다.
  // (매 생성 시 new Date()를 넣으면 모든 페이지가 항상 방금 수정된 것처럼 보여
  //  크롤 예산이 낭비되고 lastmod 신뢰도가 떨어진다.)
  const seriesCount = new Map<string, number>();
  const seriesLast = new Map<string, string>();
  const tagCount = new Map<string, number>();
  const tagLast = new Map<string, string>();
  const catLast = new Map<string, string>();
  for (const row of (postsRes.data ?? []) as { published_at: string; tags: string[]; category?: string }[]) {
    const when = row.published_at ?? '';
    if (row.category && when > (catLast.get(row.category) ?? '')) catLast.set(row.category, when);
    for (const tag of row.tags ?? []) {
      if (tag.startsWith('series:')) {
        const name = tag.replace('series:', '');
        seriesCount.set(name, (seriesCount.get(name) ?? 0) + 1);
        if (when > (seriesLast.get(name) ?? '')) seriesLast.set(name, when);
      } else {
        tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
        if (when > (tagLast.get(tag) ?? '')) tagLast.set(tag, when);
      }
    }
  }
  const latestPost = [...catLast.values()].sort().pop();
  const latestDate = latestPost ? new Date(latestPost) : new Date();

  // 에피소드 2편 미만인 얇은 시리즈는 sitemap에서 제외 — series/[id] 페이지의 noindex
  // 임계값(isThin: episodeCount < 2)과 동일하게 유지해, "noindex인데 sitemap에 제출"되는
  // GSC 색인 오류(Submitted URL marked 'noindex')를 방지한다.
  const MIN_SERIES_EPISODES = 2;
  const seriesPages = Array.from(seriesCount.entries())
    .filter(([, count]) => count >= MIN_SERIES_EPISODES)
    .map(([name]) => ({
      url: `${base}/series/${encodeURIComponent(name)}`,
      lastModified: seriesLast.get(name) ? new Date(seriesLast.get(name)!) : latestDate,
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
      lastModified: tagLast.get(tag) ? new Date(tagLast.get(tag)!) : latestDate,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));

  const CATEGORIES = ['AI & 자동화', 'IT 트렌드', '개발', '툴 리뷰', '보안', '인프라'];
  const categoryPages = CATEGORIES.map(cat => ({
    url: `${base}/category/${encodeURIComponent(cat)}`,
    lastModified: catLast.get(cat) ? new Date(catLast.get(cat)!) : latestDate,
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
  ].map(p => ({ ...p, lastModified: latestDate }));

  return [...staticPages, ...categoryPages, ...posts, ...guides, ...seriesPages, ...tagPages];
}
