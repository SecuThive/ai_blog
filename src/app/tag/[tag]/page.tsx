import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import { readingTime, makeFreshClient } from '@/lib/supabase';
import { catTone } from '@/lib/utils';
import PostThumb from '@/components/PostThumb';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `#${decoded} — Nodelog`,
    description: `"${decoded}" 태그로 분류된 글 모음`,
  };
}

interface PostRow {
  id: number; title: string; slug: string; excerpt: string;
  category: string; published_at: string; reading_time: number;
  cover_image?: string;
}

async function getPostsByTag(tag: string): Promise<PostRow[]> {
  noStore();
  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,excerpt,cover_image,category,tags,published_at,views,content')
    .eq('status', 'published')
    .contains('tags', [tag])
    .order('published_at', { ascending: false });
  return (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as number, title: p.title as string, slug: p.slug as string,
    excerpt: p.excerpt as string, category: p.category as string,
    published_at: p.published_at as string, cover_image: p.cover_image as string | undefined,
    reading_time: readingTime((p.content as string) ?? ''),
  }));
}

async function getRelatedTags(tag: string): Promise<string[]> {
  noStore();
  const { data } = await makeFreshClient()
    .from('posts')
    .select('tags')
    .eq('status', 'published')
    .contains('tags', [tag]);

  const tagCount = new Map<string, number>();
  for (const p of (data ?? [])) {
    for (const t of (p.tags as string[] ?? [])) {
      if (t !== tag) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    }
  }
  return Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t]) => t);
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

export default async function TagDetailPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: tagParam } = await params;
  const tag = decodeURIComponent(tagParam);

  const [posts, relatedTags] = await Promise.all([
    getPostsByTag(tag),
    getRelatedTags(tag),
  ]);

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="crumbs">
            <Link href="/">홈</Link><span className="sep">/</span>
            <Link href="/tags">태그</Link><span className="sep">/</span>
            <span style={{ color: 'var(--text-1)' }}>#{tag}</span>
          </div>
          <div className="page-eyebrow" style={{ marginTop: 12 }}>TAG · 태그 모음</div>
          <h1 className="page-title" style={{ marginBottom: 12 }}>#{tag}</h1>
          <p className="page-lead">&quot;{tag}&quot; 키워드로 분류된 글 모음.</p>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-3)', letterSpacing: '0.04em', marginTop: 12 }}>
            <strong style={{ color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>{posts.length}</strong> POSTS
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="split">
            <div>
              {posts.length === 0 ? (
                <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)' }}>
                    이 태그의 글이 없습니다.
                  </div>
                </div>
              ) : (
                <div className="grid-2">
                  {posts.map((p) => {
                    const tone = catTone(p.category);
                    return (
                      <Link key={p.id} href={`/blog/${p.slug}`} className="card card-link">
                        <PostThumb slug={p.slug} title={p.title} coverImage={p.cover_image} />
                        <div className="card-body">
                          <div className="card-meta">
                            <span className={`badge badge-${tone}`}>{p.category}</span>
                          </div>
                          <h3 className="card-title">{p.title}</h3>
                          <p className="card-excerpt">{p.excerpt}</p>
                          <div className="card-foot">
                            <span>{timeAgo(p.published_at)}</span>
                            <span className="dot" />
                            <span>{p.reading_time}분 읽기</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <aside className="aside-rail">
              {relatedTags.length > 0 && (
                <div className="widget">
                  <h5>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    유사 태그
                  </h5>
                  <div className="pill-row">
                    {relatedTags.map(t => (
                      <Link key={t} href={`/tag/${encodeURIComponent(t)}`} className="tag-chip">{t}</Link>
                    ))}
                  </div>
                </div>
              )}
              <div className="widget">
                <h5>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                  태그 탐색
                </h5>
                <Link href="/tags" className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  전체 태그 보기
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
