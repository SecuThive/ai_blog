import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';

export const revalidate = 60;

function makeFreshClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

function catTone(cat: string): string {
  if (cat.includes('AI') || cat.includes('자동화')) return 'blue';
  if (cat.includes('트렌드') || cat.includes('IT')) return 'purple';
  if (cat.includes('개발') || cat.includes('인프라')) return 'mint';
  if (cat.includes('툴') || cat.includes('리뷰')) return 'amber';
  if (cat.includes('보안')) return 'rose';
  return 'blue';
}

interface PostRow {
  id: number;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  published_at: string;
  content?: string;
}

async function getCategoryPosts(category: string): Promise<PostRow[]> {
  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,category,excerpt,published_at')
    .eq('status', 'published')
    .eq('category', category)
    .order('published_at', { ascending: true });
  return (data ?? []) as PostRow[];
}

export async function generateStaticParams() {
  const { data } = await makeFreshClient()
    .from('posts')
    .select('category')
    .eq('status', 'published');
  const cats = [...new Set((data ?? []).map((p: { category: string }) => p.category))];
  return cats.map(c => ({ id: encodeURIComponent(c) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const category = decodeURIComponent(id);
  return {
    title: `${category} 시리즈 — Nodelog`,
    description: `${category} 카테고리의 모든 글을 순서대로 탐색하세요.`,
  };
}

export default async function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = decodeURIComponent(id);
  const posts = await getCategoryPosts(category);
  const tone = catTone(category);

  return (
    <div>
      <div className="article-hero">
        <div className="container">
          <div className="crumbs">
            <Link href="/">홈</Link>
            <span className="sep">/</span>
            <Link href="/series">시리즈</Link>
            <span className="sep">/</span>
            <span style={{ color: 'var(--text-1)' }}>{category}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, marginBottom: 12 }}>
            <span className={`badge badge-${tone}`}>{category}</span>
            <span className="badge">{posts.length}편</span>
          </div>
          <h1 className="article-title">{category} 시리즈</h1>
          <p className="article-deck">
            {category} 카테고리의 {posts.length}편 글을 순서대로 탐색하세요.
            각 편은 독립적으로 읽어도 좋지만, 순서대로 따라가면 더 큰 그림이 보입니다.
          </p>
          {posts.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <Link href={`/blog/${posts[0].slug}`} className="btn btn-primary btn-lg">
                처음부터 읽기
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </Link>
              <Link href={`/blog/${posts[posts.length - 1].slug}`} className="btn btn-lg">
                마지막 편으로 이동
              </Link>
            </div>
          )}
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="split">
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: 20, letterSpacing: '-0.02em' }}>학습 경로</h3>
              <p style={{ margin: '0 0 28px', color: 'var(--text-3)', fontSize: 14 }}>
                각 편을 순서대로 따라가며 주제를 깊게 이해하세요.
              </p>
              <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {posts.map((ep, i) => (
                  <li
                    key={ep.id}
                    className="card card-link"
                    style={{
                      borderRadius: i === 0 ? '10px 10px 0 0' : i === posts.length - 1 ? '0 0 10px 10px' : 0,
                      marginTop: i === 0 ? 0 : -1,
                    }}
                  >
                    <Link
                      href={`/blog/${ep.slug}`}
                      style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 18, padding: '18px 22px', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
                    >
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `color-mix(in oklch, var(--acc-${tone}) 18%, var(--bg-3))`,
                        color: `var(--acc-${tone})`,
                        border: '1px solid var(--line-2)',
                        fontFamily: 'var(--ff-mono)',
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.06em', marginBottom: 4 }}>
                          EP · {String(i + 1).padStart(2, '0')}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                          {ep.title}
                        </div>
                        {ep.excerpt && (
                          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.5 }}>
                            {ep.excerpt.slice(0, 80)}…
                          </div>
                        )}
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-4)', flexShrink: 0 }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>

            <aside className="aside-rail">
              <div className="widget">
                <h5>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  시리즈 정보
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-3)' }}>총 편 수</span>
                    <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{posts.length}편</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-3)' }}>카테고리</span>
                    <span className={`badge badge-${tone}`}>{category}</span>
                  </div>
                  {posts.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-3)' }}>최근 업데이트</span>
                      <strong style={{ fontSize: 12 }}>
                        {new Date(posts[posts.length - 1].published_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="widget">
                <h5>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                  다른 시리즈
                </h5>
                <Link href="/series" className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  전체 시리즈 보기
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
