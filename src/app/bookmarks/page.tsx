'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { catTone } from '@/lib/utils';

interface BookmarkedPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  published_at: string;
}

type SortKey = 'newest' | 'oldest' | 'title';

function sortPosts(posts: BookmarkedPost[], key: SortKey): BookmarkedPost[] {
  return [...posts].sort((a, b) => {
    if (key === 'newest') return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    if (key === 'oldest') return new Date(a.published_at).getTime() - new Date(b.published_at).getTime();
    return a.title.localeCompare(b.title, 'ko');
  });
}

const SORT_LABELS: Record<SortKey, string> = {
  newest: '최신순',
  oldest: '오래된순',
  title: '제목순',
};

export default function BookmarksPage() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [posts, setPosts] = useState<BookmarkedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('newest');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('bookmarks') ?? '[]');
      setSlugs(Array.isArray(stored) ? stored : []);
    } catch { setSlugs([]); }
  }, []);

  useEffect(() => {
    if (slugs.length === 0) { setLoading(false); return; }
    setLoading(true);
    Promise.all(
      slugs.map(slug =>
        fetch(`/api/posts/${slug}`).then(r => r.ok ? r.json() : null).catch(() => null)
      )
    ).then(results => {
      const valid = results
        .filter((r): r is { post: BookmarkedPost } => r?.post != null)
        .map(r => r.post);
      setPosts(valid);
      setLoading(false);
    });
  }, [slugs]);

  const remove = (slug: string) => {
    const next = slugs.filter(s => s !== slug);
    setSlugs(next);
    setPosts(prev => prev.filter(p => p.slug !== slug));
    localStorage.setItem('bookmarks', JSON.stringify(next));
  };

  const clearAll = () => {
    setSlugs([]);
    setPosts([]);
    localStorage.removeItem('bookmarks');
  };

  const sorted = sortPosts(posts, sort);

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">BOOKMARKS</div>
          <h1 className="page-title">저장한 글</h1>
          <p className="page-lead">북마크한 글 목록입니다. 브라우저에 저장되며 기기별로 독립적입니다.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 32 }}>
        <div className="container" style={{ maxWidth: 860 }}>
          {loading && (
            <div style={{ padding: '80px 0', textAlign: 'center', fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)', letterSpacing: '0.10em' }}>
              LOADING…
            </div>
          )}

          {!loading && slugs.length === 0 && (
            <div className="card" style={{ padding: '72px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔖</div>
              <h3 style={{ margin: '0 0 10px', fontSize: 18, letterSpacing: '-0.01em' }}>저장한 글이 없습니다</h3>
              <p style={{ color: 'var(--text-3)', marginBottom: 28, lineHeight: 1.6 }}>
                글 읽기 화면의 &lsquo;저장&rsquo; 버튼을 눌러보세요.<br />
                브라우저에 자동 저장됩니다.
              </p>
              <Link href="/" className="btn btn-primary">최신 글 보러 가기 →</Link>
            </div>
          )}

          {!loading && posts.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11.5, color: 'var(--text-4)', letterSpacing: '0.08em' }}>
                    {posts.length}개 저장됨
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.06em' }}>정렬</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
                      <button
                        key={k}
                        className={`btn btn-sm${sort === k ? ' btn-primary' : ' btn-ghost'}`}
                        onClick={() => setSort(k)}
                        style={{ fontSize: 12 }}
                      >
                        {SORT_LABELS[k]}
                      </button>
                    ))}
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={clearAll}
                    style={{ fontSize: 12, color: 'var(--acc-rose)', marginLeft: 4 }}
                  >
                    전체 삭제
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sorted.map(post => {
                  const tone = catTone(post.category);
                  return (
                    <div
                      key={post.slug}
                      className="card"
                      style={{ padding: '18px 22px', display: 'flex', gap: 16, alignItems: 'flex-start' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                          <span className={`badge badge-${tone}`}>{post.category}</span>
                          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)' }}>
                            {new Date(post.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <Link href={`/blog/${post.slug}`}>
                          <h3 style={{ margin: '0 0 6px', fontSize: 16.5, letterSpacing: '-0.015em', lineHeight: 1.4 }}>{post.title}</h3>
                        </Link>
                        <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13.5, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {post.excerpt}
                        </p>
                      </div>
                      <button
                        onClick={() => remove(post.slug)}
                        aria-label="북마크 삭제"
                        title="북마크 삭제"
                        style={{ flexShrink: 0, color: 'var(--text-4)', padding: '4px', borderRadius: 6, transition: 'color 140ms' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--acc-rose)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
