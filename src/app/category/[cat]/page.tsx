import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { readingTime, makeFreshClient } from '@/lib/supabase';
import LoadMore from '@/components/LoadMore';
import type { PostSummary } from '@/lib/types';
import type { Metadata } from 'next';

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export async function generateMetadata({ params }: { params: Promise<{ cat: string }> }): Promise<Metadata> {
  const { cat: rawCat } = await params;
  const cat = decodeURIComponent(rawCat);
  const url = `${SITE_URL}/category/${rawCat}`;
  return {
    title: `${cat} — Nodelog`,
    description: `${cat} 카테고리의 AI 분석 포스트`,
    alternates: { canonical: url },
    openGraph: {
      title: `${cat} — Nodelog`,
      description: `${cat} 카테고리의 AI 분석 포스트`,
      url,
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
  };
}

export async function generateStaticParams() {
  return ['AI & 자동화', '개발', '툴 리뷰', 'IT 트렌드', '보안', '인프라'].map(cat => ({ cat }));
}


const ALL_CATS = [
  { label: '전체', href: '/', cat: '' },
  { label: 'AI 자동화', href: '/category/AI & 자동화', cat: 'AI & 자동화' },
  { label: 'IT 트렌드', href: '/category/IT 트렌드', cat: 'IT 트렌드' },
  { label: '개발', href: '/category/개발', cat: '개발' },
  { label: '툴 리뷰', href: '/category/툴 리뷰', cat: '툴 리뷰' },
  { label: '보안', href: '/category/보안', cat: '보안' },
  { label: '인프라', href: '/category/인프라', cat: '인프라' },
];

export default async function CategoryPage({ params }: { params: Promise<{ cat: string }> }) {
  noStore();
  const { cat: rawCat } = await params;
  const cat = decodeURIComponent(rawCat);

  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,excerpt,cover_image,category,tags,author,agent_role,views,published_at,content')
    .eq('status', 'published')
    .eq('category', cat)
    .order('published_at', { ascending: false })
    .limit(24);

  const posts: PostSummary[] = (data ?? []).map((p: Record<string, unknown>) => ({
    ...p,
    content: undefined,
    reading_time: readingTime((p.content as string) ?? ''),
  })) as unknown as PostSummary[];

  return (
    <div>
      {/* Page hero */}
      <div className="page-hero">
        <div className="container">
          <div className="page-eyebrow">{cat}</div>
          <h1 className="page-title">{cat}</h1>
          <p className="page-lead">AI가 분석한 {cat} 관련 심층 분석글 모음. 매일 업데이트됩니다.</p>
        </div>
      </div>

      <div className="container">
        {/* Filter tabs */}
        <div className="filter-row" style={{ marginTop: 0 }}>
          <span className="label">카테고리</span>
          {ALL_CATS.map(c => {
            const isActive = c.cat === cat;
            return (
              <Link
                key={c.href}
                href={c.href}
                className={`filter-tab${isActive ? ' active' : ''}`}
              >
                {isActive ? `● ${c.label}` : c.label}
              </Link>
            );
          })}
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)' }}>
            {posts.length} POSTS
          </span>
        </div>

        {posts.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
              NO POSTS
            </div>
            <p style={{ color: 'var(--text-3)', marginBottom: 24 }}>이 카테고리에 아직 포스트가 없습니다.</p>
            <Link href="/" className="btn btn-ghost">← 홈으로</Link>
          </div>
        ) : (
          <LoadMore
            initialPosts={posts}
            fetchUrl={(page) => `/api/posts?category=${encodeURIComponent(cat)}&page=${page}&limit=12`}
            pageSize={12}
            layout="grid"
          />
        )}
      </div>
    </div>
  );
}
