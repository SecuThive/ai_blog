import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { readingTime, makeFreshClient } from '@/lib/supabase';
import LoadMore from '@/components/LoadMore';
import JsonLd from '@/components/JsonLd';
import type { PostSummary } from '@/lib/types';
import type { Metadata } from 'next';
// i18n 보류: import { getLocale, getTranslations } from 'next-intl/server';
import { getKoreanCat, getCatParam } from '@/lib/categoryMap';

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export async function generateMetadata({ params }: { params: Promise<{ cat: string; locale: string }> }): Promise<Metadata> {
  const { cat: rawCat } = await params;
  const locale = await getLocale();
  const koreanCat = getKoreanCat(locale, decodeURIComponent(rawCat));
  const displayCat = locale === 'en'
    ? rawCat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : koreanCat;
  const url = `${SITE_URL}${locale === 'en' ? '/en' : ''}/category/${rawCat}`;
  return {
    title: `${displayCat} — Nodelog`,
    description: locale === 'en'
      ? `In-depth ${displayCat} analysis curated by AI. Updated daily.`
      : `${koreanCat} 카테고리의 AI 분석 포스트`,
    alternates: { canonical: url },
    openGraph: {
      title: `${displayCat} — Nodelog`,
      description: locale === 'en'
        ? `In-depth ${displayCat} analysis curated by AI.`
        : `AI가 분석한 ${koreanCat} 관련 심층 분석글 모음`,
      url,
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
  };
}

export async function generateStaticParams() {
  // Ko slugs
  const koSlugs = ['AI & 자동화', '개발', '툴 리뷰', 'IT 트렌드', '보안', '인프라'].map(cat => ({ cat }));
  // En slugs
  const enSlugs = ['ai-automation', 'development', 'tool-reviews', 'it-trends', 'security', 'infrastructure'].map(cat => ({ cat }));
  return [...koSlugs, ...enSlugs];
}

const ALL_CATS_KO = ['AI & 자동화', 'IT 트렌드', '개발', '툴 리뷰', '보안', '인프라'];

export default async function CategoryPage({ params }: { params: Promise<{ cat: string; locale: string }> }) {
  noStore();
  const { cat: rawCat } = await params;
  const locale = await getLocale();
  const t = await getTranslations('category');

  // Map URL param to Korean category name
  const koreanCat = getKoreanCat(locale, decodeURIComponent(rawCat));

  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,excerpt,cover_image,category,tags,author,agent_role,views,published_at,content')
    .eq('status', 'published')
    .eq('category', koreanCat)
    .order('published_at', { ascending: false })
    .limit(24);

  const posts: PostSummary[] = (data ?? []).map((p: Record<string, unknown>) => ({
    ...p,
    content: undefined,
    reading_time: readingTime((p.content as string) ?? ''),
  })) as unknown as PostSummary[];

  const displayCat = locale === 'en'
    ? rawCat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : koreanCat;

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${displayCat} — Nodelog`,
    description: t('lead', { cat: displayCat }),
    url: `${SITE_URL}${locale === 'en' ? '/en' : ''}/category/${rawCat}`,
    inLanguage: locale === 'en' ? 'en' : 'ko',
    publisher: { '@type': 'Organization', name: 'Nodelog', url: SITE_URL },
    hasPart: posts.slice(0, 10).map(p => ({
      '@type': 'Article',
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      description: p.excerpt,
    })),
  };

  return (
    <div>
      <JsonLd data={collectionSchema} />
      <div className="page-hero">
        <div className="container">
          <div className="page-eyebrow">{displayCat}</div>
          <h1 className="page-title">{displayCat}</h1>
          <p className="page-lead">{t('lead', { cat: displayCat })}</p>
        </div>
      </div>

      <div className="container">
        {/* Category filter tabs */}
        <div className="filter-row" style={{ marginTop: 0 }}>
          <span className="label">{t('allCategories')}</span>
          {/* All */}
          <Link href="/" className="filter-tab">{t('all')}</Link>
          {ALL_CATS_KO.map(cat => {
            const slug = getCatParam(locale, cat);
            const isActive = cat === koreanCat;
            const label = locale === 'en'
              ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              : cat;
            return (
              <Link
                key={cat}
                href={`/category/${slug}`}
                className={`filter-tab${isActive ? ' active' : ''}`}
              >
                {isActive ? `● ${label}` : label}
              </Link>
            );
          })}
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)' }}>
            {posts.length} {t('posts')}
          </span>
        </div>

        {posts.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
              NO POSTS
            </div>
            <p style={{ color: 'var(--text-3)', marginBottom: 24 }}>{t('noPosts')}</p>
            <Link href="/" className="btn btn-ghost">{t('goHome')}</Link>
          </div>
        ) : (
          <LoadMore
            initialPosts={posts}
            fetchUrl={`/api/posts?category=${encodeURIComponent(koreanCat)}&limit=12`}
            pageSize={12}
            layout="grid"
          />
        )}
      </div>
    </div>
  );
}
