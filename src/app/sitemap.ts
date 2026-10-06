import { unstable_cache } from 'next/cache';
import { makeFreshClient } from '@/lib/supabase';
import { NOINDEX_POST_SLUGS } from '@/lib/noindexPosts';
import type { MetadataRoute } from 'next';
import { withLocale } from '@/i18n/path';
import { readEditorialRecord, substantiveUpdate } from '@/lib/editorialRecord';
import { fetchSitemapData, resolveSitemapData, SITEMAP_CACHE_TAG, type SitemapData } from '@/lib/sitemapData';


// sitemap.ts는 이 Next 버전에서 "기본 캐시되는 특수 Route Handler"라
// revalidate ISR이 프로덕션에서 신뢰되게 동작하지 않았다(7/6 이후 신규 글 미반영 사고).
// 그래서 한때 매 요청 동적 생성(force-dynamic)으로 전환했었다.
// 2026-09: Supabase egress 쿼터 초과로 1시간 ISR로 되돌렸다.
// 2026-10: 외부 감사에서 sitemap 캐시 나이가 약 40시간까지 관측되어(ISR 재검증이 또 신뢰되지 않음)
// 다시 요청마다 생성한다(force-dynamic → 응답은 no-store, CDN에 오래된 sitemap이 남지 않는다).
// 2026-10-04: DB 조회 실패가 그대로 throw → /sitemap.xml 500이 된 사례가 있어 장애 내성을 추가했다.
//  - 페이지 자체는 매 요청 렌더링하지만, DB 조회 결과는 Next 데이터 캐시(unstable_cache,
//    revalidate 120초 + 'sitemap' 태그)를 거친다. 데이터 캐시는 stale-while-revalidate라
//    백그라운드 재조회가 실패하면 이전 정상 결과를 계속 돌려준다 = 인스턴스 간 공유되는 last-good 사본.
//    발행 웹훅(/api/revalidate)이 revalidateTag('sitemap', 'max')로 즉시 갱신을 요청한다.
//  - DB 조회는 4초 타임아웃. 실패·타임아웃·부분 성공·0건은 모두 throw라 데이터 캐시에 저장되지 않는다.
//  - 데이터 캐시도 비어 있고 조회도 실패하면: 인스턴스 메모리의 last-good → 그것도 없으면 핵심 정적 경로
//    sitemap(목록·정책 페이지)을 낸다. 500은 내지 않으며, 폴백 사용은 [sitemap] 로그로 남긴다.
export const dynamic = 'force-dynamic';

const SITEMAP_DATA_REVALIDATE_SECONDS = 120;

const getCachedSitemapData = unstable_cache(
  () => {
    const client = makeFreshClient();
    return fetchSitemapData((table, columns, signal) =>
      client.from(table).select(columns).eq('status', 'published').abortSignal(signal),
    ).catch((err: unknown) => {
      // 백그라운드 재검증 실패도 여기서 로그가 남는다(그때는 이전 정상 결과가 계속 제공됨).
      console.error(`[sitemap] DB fetch failed: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    });
  },
  ['sitemap-data-v1'],
  { revalidate: SITEMAP_DATA_REVALIDATE_SECONDS, tags: [SITEMAP_CACHE_TAG] },
);

// 인스턴스 메모리의 마지막 정상 데이터(데이터 캐시 미스 + DB 장애가 겹칠 때의 2차 폴백).
let lastGood: SitemapData | null = null;

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

const CATEGORIES = ['AI & 자동화', 'IT 트렌드', '개발', '툴 리뷰', '보안', '인프라'];

// 핵심 정적 경로. latest가 null(DB 데이터 없음)이면 날짜를 지어내지 않고 lastModified를 생략한다.
function corePages(base: string, latest: Date | null, latestGuide: Date | null): MetadataRoute.Sitemap {
  const dated = (d: Date | null) => (d ? { lastModified: d } : {});
  const pages = [
    { path: '', changeFrequency: 'daily' as const, priority: 1, ...dated(latest) },
    { path: '/engineer', changeFrequency: 'daily' as const, priority: 0.9, ...dated(latestGuide ?? latest) },
    { path: '/series', changeFrequency: 'weekly' as const, priority: 0.8, ...dated(latest) },
    { path: '/trending', changeFrequency: 'daily' as const, priority: 0.7, ...dated(latest) },
    { path: '/tags', changeFrequency: 'weekly' as const, priority: 0.6, ...dated(latest) },
    { path: '/archive', changeFrequency: 'daily' as const, priority: 0.6, ...dated(latest) },
    { path: '/curated', changeFrequency: 'weekly' as const, priority: 0.6, ...dated(latest) },
    { path: '/recommend', changeFrequency: 'daily' as const, priority: 0.6, ...dated(latest) },
    { path: '/about', changeFrequency: 'monthly' as const, priority: 0.5, lastModified: new Date('2026-10-03') },
    { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.4, lastModified: new Date('2026-07-31') },
    { path: '/faq', changeFrequency: 'monthly' as const, priority: 0.4, lastModified: new Date('2026-10-03') },
    { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3, lastModified: new Date('2026-10-06') },
    { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3, lastModified: new Date('2026-04-30') },
    { path: '/policy', changeFrequency: 'monthly' as const, priority: 0.4, lastModified: new Date('2026-10-03') },
    { path: '/author', changeFrequency: 'monthly' as const, priority: 0.4, lastModified: new Date('2026-10-03') },
  ].map(({ path, ...p }) => entry(base, path || '/', p));
  return pages;
}

function staticSitemap(base: string): MetadataRoute.Sitemap {
  const categoryPages = CATEGORIES.map(cat => entry(base, `/category/${encodeURIComponent(cat)}`, {
    changeFrequency: 'daily',
    priority: 0.8,
  }));
  return [...corePages(base, null, null), ...categoryPages];
}

function fullSitemap(base: string, data: SitemapData): MetadataRoute.Sitemap {
  // lastmod는 "실질적 본문 변경"만 반영한다. posts.updated_at은 번역 일괄 추가 등 배치 작업에도
  // 트리거로 갱신되어(2026-09-18·09-29에 수백 편이 한꺼번에 찍힘) 사실과 다른 신호가 되므로 쓰지 않는다.
  // 편집자가 명시한 content_evidence.contentUpdatedAt만 쓰고, 없으면 최초 발행일을 쓴다.
  // (JSON 경로 선택이라 content_evidence 전체(영문 본문 포함)를 내려받지 않는다.)

  // noindex 처리된 보강 대상 글은 sitemap에서도 제외 (색인 신호 일관성)
  const posts = data.posts
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

  const guideRows = data.guides;
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
  for (const row of data.posts) {
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
  const latestDate = latestPost ? new Date(latestPost) : new Date(data.fetchedAt);

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

  // 글이 하나도 없는 카테고리는 제출하지 않는다(main 10971e6).
  const categoryPages = CATEGORIES.filter(cat => catLast.has(cat)).map(cat => entry(base, `/category/${encodeURIComponent(cat)}`, {
    lastModified: catLast.get(cat) ? new Date(catLast.get(cat)!) : latestDate,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const staticPages = corePages(base, latestDate, latestGuide ? new Date(latestGuide) : null);
  return [...staticPages, ...categoryPages, ...posts, ...guides, ...seriesPages];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';
  const { data } = await resolveSitemapData({
    load: getCachedSitemapData,
    lastGood: () => lastGood,
    remember: d => { lastGood = d; },
    log: m => console.error(m),
  });
  return data ? fullSitemap(base, data) : staticSitemap(base);
}
