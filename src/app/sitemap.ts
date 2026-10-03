import { makeFreshClient } from '@/lib/supabase';
import { NOINDEX_POST_SLUGS } from '@/lib/noindexPosts';
import type { MetadataRoute } from 'next';
import { withLocale } from '@/i18n/path';
import { readEditorialRecord, substantiveUpdate } from '@/lib/editorialRecord';


// sitemap.ts는 이 Next 버전에서 "기본 캐시되는 특수 Route Handler"라
// revalidate ISR이 프로덕션에서 신뢰되게 동작하지 않았다(7/6 이후 신규 글 미반영 사고).
// 그래서 한때 매 요청 동적 생성(force-dynamic)으로 전환했었다.
// 2026-09: Supabase egress 쿼터 초과로 사이트가 내려간 뒤, 매 요청 전 글의 slug·tags(i18n.title/
// i18n.excerpt 태그 텍스트 포함)를 긁는 비용을 없애기 위해 1시간 ISR로 되돌린다. 발행 웹훅
// (/api/revalidate)이 revalidatePath('/sitemap.xml')을 호출하므로 신규 발행은 즉시 반영을 기대하고,
// 최악의 경우에도 1시간 내 반영된다. 조회 에러는 throw → 글이 빠진 sitemap이 캐시되지 않게 한다.
// 2026-10: 외부 감사에서 sitemap 캐시 나이가 약 40시간까지 관측되어(ISR 재검증이 또 신뢰되지 않음)
// 다시 요청마다 생성한다. DB가 자체 운영 PostgreSQL로 옮겨져 egress 쿼터 문제가 없고, 아래 조회는
// JSON 경로 선택으로 본문·영문 번역을 내려받지 않아 가볍다. CDN 캐시는 max-age=0, must-revalidate.
export const dynamic = 'force-dynamic';

function entry(base: string, path: string, rest: Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'>): MetadataRoute.Sitemap[number] {
  const koPath = path === '/' ? '' : path;
  const enPath = withLocale(path, 'en');
  return {
    url: `${base}${koPath}`,
    alternates: {
      languages: {
        ko: `${base}${koPath}`,
        en: `${base}${enPath}`,
        'x-default': `${base}${koPath}`,
      },
    },
    ...rest,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';
  const client = makeFreshClient();

  // lastmod는 "실질적 본문 변경"만 반영한다. posts.updated_at은 번역 일괄 추가 등 배치 작업에도
  // 트리거로 갱신되어(2026-09-18·09-29에 수백 편이 한꺼번에 찍힘) 사실과 다른 신호가 되므로 쓰지 않는다.
  // 편집자가 명시한 content_evidence.contentUpdatedAt만 쓰고, 없으면 최초 발행일을 쓴다.
  // (JSON 경로 선택이라 content_evidence 전체(영문 본문 포함)를 내려받지 않는다.)
  const postsRes = await client
    .from('posts')
    .select('slug,published_at,tags,category,content_updated_at:content_evidence->>contentUpdatedAt,change_summary:content_evidence->>changeSummary')
    .eq('status', 'published');
  if (postsRes.error) throw new Error(`sitemap posts fetch failed: ${postsRes.error.code ?? ''} ${postsRes.error.message}`);
  const guidesRes = await client
    .from('engineer_guides')
    .select('slug,updated_at')
    .eq('status', 'published');
  if (guidesRes.error) throw new Error(`sitemap guides fetch failed: ${guidesRes.error.code ?? ''} ${guidesRes.error.message}`);

  // noindex 처리된 보강 대상 글은 sitemap에서도 제외 (색인 신호 일관성)
  const posts = ((postsRes.data ?? []) as unknown as { slug: string; published_at: string; content_updated_at?: string | null; change_summary?: string | null; tags: string[] }[])
    .filter(p => !NOINDEX_POST_SLUGS.has(p.slug))
    .map(p => entry(base, `/blog/${encodeURIComponent(p.slug)}`, {
      lastModified: new Date(
        substantiveUpdate(
          readEditorialRecord({ contentUpdatedAt: p.content_updated_at, changeSummary: p.change_summary }),
          p.published_at,
        ) ?? p.published_at,
      ),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  const guideRows = (guidesRes.data ?? []) as { slug: string; updated_at: string }[];
  const latestGuide = guideRows.map(g => g.updated_at).filter(Boolean).sort().pop();
  const guides = guideRows.map(g => entry(base, `/engineer/${encodeURIComponent(g.slug)}`, {
    lastModified: new Date(g.updated_at),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // lastmod는 "그 목록 페이지에 마지막으로 글이 추가된 시점"을 반영해야 한다.
  // (매 생성 시 new Date()를 넣으면 모든 페이지가 항상 방금 수정된 것처럼 보여
  //  크롤 예산이 낭비되고 lastmod 신뢰도가 떨어진다.)
  const seriesCount = new Map<string, number>();
  const seriesLast = new Map<string, string>();
  const catLast = new Map<string, string>();
  for (const row of (postsRes.data ?? []) as unknown as { published_at: string; tags: string[]; category?: string }[]) {
    const when = row.published_at ?? '';
    if (row.category && when > (catLast.get(row.category) ?? '')) catLast.set(row.category, when);
    for (const tag of row.tags ?? []) {
      if (tag.startsWith('series:')) {
        const name = tag.replace('series:', '');
        seriesCount.set(name, (seriesCount.get(name) ?? 0) + 1);
        if (when > (seriesLast.get(name) ?? '')) seriesLast.set(name, when);
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
    .map(([name]) => entry(base, `/series/${encodeURIComponent(name)}`, {
      lastModified: seriesLast.get(name) ? new Date(seriesLast.get(name)!) : latestDate,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

  const CATEGORIES = ['AI & 자동화', 'IT 트렌드', '개발', '툴 리뷰', '보안', '인프라'];
  const categoryPages = CATEGORIES.map(cat => entry(base, `/category/${encodeURIComponent(cat)}`, {
    lastModified: catLast.get(cat) ? new Date(catLast.get(cat)!) : latestDate,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const staticPages = [
    { path: '', changeFrequency: 'daily' as const, priority: 1, lastModified: latestDate },
    { path: '/engineer', changeFrequency: 'daily' as const, priority: 0.9, lastModified: latestGuide ? new Date(latestGuide) : latestDate },
    { path: '/series', changeFrequency: 'weekly' as const, priority: 0.8, lastModified: latestDate },
    { path: '/trending', changeFrequency: 'daily' as const, priority: 0.7, lastModified: latestDate },
    { path: '/tags', changeFrequency: 'weekly' as const, priority: 0.6, lastModified: latestDate },
    { path: '/archive', changeFrequency: 'daily' as const, priority: 0.6, lastModified: latestDate },
    { path: '/curated', changeFrequency: 'weekly' as const, priority: 0.6, lastModified: latestDate },
    { path: '/recommend', changeFrequency: 'daily' as const, priority: 0.6, lastModified: latestDate },
    { path: '/about', changeFrequency: 'monthly' as const, priority: 0.5, lastModified: new Date('2026-10-03') },
    { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.4, lastModified: new Date('2026-07-31') },
    { path: '/faq', changeFrequency: 'monthly' as const, priority: 0.4, lastModified: new Date('2026-10-03') },
    { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3, lastModified: new Date('2026-10-03') },
    { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3, lastModified: new Date('2026-04-30') },
    { path: '/policy', changeFrequency: 'monthly' as const, priority: 0.4, lastModified: new Date('2026-10-03') },
    { path: '/author', changeFrequency: 'monthly' as const, priority: 0.4, lastModified: new Date('2026-10-03') },
  ].map(({ path, ...p }) => entry(base, path || '/', p));

  return [...staticPages, ...categoryPages, ...posts, ...guides, ...seriesPages];
}
