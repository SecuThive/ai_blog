import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { readingTime } from '@/lib/supabase';
import type { PostSummary } from '@/lib/types';
import type { Metadata } from 'next';

export const revalidate = 60;

function makeFreshClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

export async function generateMetadata({ params }: { params: Promise<{ cat: string }> }): Promise<Metadata> {
  const { cat: rawCat } = await params;
  const cat = decodeURIComponent(rawCat);
  return { title: `${cat} — Nodelog`, description: `${cat} 카테고리의 AI 분석 포스트` };
}

export async function generateStaticParams() {
  return ['AI & 자동화', '개발', '툴 리뷰', 'IT 트렌드'].map(cat => ({ cat }));
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return '방금 전';
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function catTone(cat: string): string {
  if (cat.includes('AI') || cat.includes('자동화')) return 'blue';
  if (cat.includes('트렌드') || cat.includes('IT')) return 'purple';
  if (cat.includes('개발') || cat.includes('인프라')) return 'mint';
  if (cat.includes('툴') || cat.includes('리뷰')) return 'amber';
  if (cat.includes('보안')) return 'rose';
  return 'blue';
}

const ALL_CATS = [
  { label: '전체', href: '/' },
  { label: 'AI 자동화', href: '/category/AI & 자동화' },
  { label: 'IT 트렌드', href: '/category/IT 트렌드' },
  { label: '개발', href: '/category/개발' },
  { label: '툴 리뷰', href: '/category/툴 리뷰' },
];

export default async function CategoryPage({ params }: { params: Promise<{ cat: string }> }) {
  const { cat: rawCat } = await params;
  const cat = decodeURIComponent(rawCat);
  const tone = catTone(cat);

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
          {ALL_CATS.map(c => (
            <Link
              key={c.href}
              href={c.href}
              className={`filter-tab${c.label === cat || (c.label === '전체' && false) ? ' active' : ''}`}
            >
              {c.label === cat ? `● ${c.label}` : c.label}
            </Link>
          ))}
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
          <div className="grid-3" style={{ marginBottom: 80 }}>
            {posts.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="card card-link">
                <div className={`card-thumb thumb-${tone}`}>
                  {post.category}
                </div>
                <div className="card-body">
                  <div className="card-meta">
                    <span className={`badge badge-${tone}`}>{post.category}</span>
                  </div>
                  <h3 className="card-title">{post.title}</h3>
                  <p className="card-excerpt">{post.excerpt}</p>
                  <div className="card-foot">
                    <span>{timeAgo(post.published_at)}</span>
                    <span className="dot" />
                    <span>{post.reading_time}분 읽기</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
