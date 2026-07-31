import { makeFreshClient } from '@/lib/supabase';
import { NOINDEX_POST_SLUGS } from '@/lib/noindexPosts';
import type { MetadataRoute } from 'next';

// sitemap.ts는 이 Next 버전에서 "기본 캐시되는 특수 Route Handler"라
// revalidate ISR이 프로덕션에서 신뢰되게 동작하지 않았다(7/6 이후 신규 글 미반영 사고).
// 매 요청 동적 생성으로 전환 — 크롤러 요청량이 적고 쿼리가 가벼워 비용이 미미하며,
// 신규 발행·강등이 sitemap에 즉시 반영되는 것이 색인 신호 일관성에 더 중요하다.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';
  const client = makeFreshClient();

  // 마이그레이션 적용 전후 모두 sitemap을 유지한다. 새 updated_at 컬럼이 아직
  // 없는 환경에서는 기존 published_at 기반 결과로 안전하게 폴백한다.
  let postsRes = await client
    .from('posts')
    .select('slug,published_at,updated_at,tags,category')
    .eq('status', 'published');
  if (postsRes.error) {
    postsRes = await client
      .from('posts')
      .select('slug,published_at,tags,category')
      .eq('status', 'published') as typeof postsRes;
  }
  const guidesRes = await client
    .from('engineer_guides')
    .select('slug,updated_at')
    .eq('status', 'published');

  // noindex 처리된 보강 대상 글은 sitemap에서도 제외 (색인 신호 일관성)
  const posts = ((postsRes.data ?? []) as { slug: string; published_at: string; updated_at?: string | null; tags: string[] }[])
    .filter(p => !NOINDEX_POST_SLUGS.has(p.slug))
    .map(p => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at ?? p.published_at),
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
      } else if (/^ep:\d+$/.test(tag)) {
        // ep:N은 시리즈 에피소드 순서용 내부 태그 — /tag/ep:1 같은 무의미한
        // 페이지가 sitemap에 들어가지 않도록 제외한다(색인 대상 아님).
        continue;
      } else if (!tag.includes('/')) {
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
    { path: '', changeFrequency: 'daily' as const, priority: 1, lastModified: latestDate },
    { path: '/engineer', changeFrequency: 'daily' as const, priority: 0.9, lastModified: latestDate },
    { path: '/series', changeFrequency: 'weekly' as const, priority: 0.8, lastModified: latestDate },
    { path: '/trending', changeFrequency: 'daily' as const, priority: 0.7, lastModified: latestDate },
    { path: '/tags', changeFrequency: 'weekly' as const, priority: 0.6, lastModified: latestDate },
    { path: '/archive', changeFrequency: 'daily' as const, priority: 0.6, lastModified: latestDate },
    { path: '/curated', changeFrequency: 'weekly' as const, priority: 0.6, lastModified: latestDate },
    { path: '/recommend', changeFrequency: 'daily' as const, priority: 0.6, lastModified: latestDate },
    { path: '/about', changeFrequency: 'monthly' as const, priority: 0.5, lastModified: new Date('2026-07-31') },
    { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.4, lastModified: new Date('2026-07-31') },
    { path: '/faq', changeFrequency: 'monthly' as const, priority: 0.4, lastModified: new Date('2026-07-31') },
    { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3, lastModified: new Date('2026-07-31') },
    { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3, lastModified: new Date('2026-04-30') },
    { path: '/policy', changeFrequency: 'monthly' as const, priority: 0.4, lastModified: new Date('2026-07-31') },
    { path: '/author', changeFrequency: 'monthly' as const, priority: 0.4, lastModified: new Date('2026-07-31') },
  ].map(({ path, ...p }) => ({ ...p, url: `${base}${path}` }));

  return [...staticPages, ...categoryPages, ...posts, ...guides, ...seriesPages, ...tagPages];
}
