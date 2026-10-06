'use client';

import Link from '@/i18n/link';
import { useEffect, useState } from 'react';
import { catTone } from '@/lib/utils';
import { useT } from '@/i18n/provider';
import { categoryLabel } from '@/i18n/categories';

interface BookmarkedPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  published_at: string;
}

type SortKey = 'newest' | 'oldest' | 'title';

function sortPosts(posts: BookmarkedPost[], key: SortKey, locale: string): BookmarkedPost[] {
  return [...posts].sort((a, b) => {
    if (key === 'newest') return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    if (key === 'oldest') return new Date(a.published_at).getTime() - new Date(b.published_at).getTime();
    return a.title.localeCompare(b.title, locale === 'en' ? 'en' : 'ko');
  });
}

function sortLabels(locale: string): Record<SortKey, string> {
  return locale === 'en'
    ? { newest: 'Newest', oldest: 'Oldest', title: 'Title' }
    : { newest: '최신순', oldest: '오래된순', title: '제목순' };
}

export default function BookmarksPage() {
  const { locale, dict } = useT();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [posts, setPosts] = useState<BookmarkedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('newest');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('bookmarks') ?? '[]');
      // localStorage는 마운트 후에만 읽을 수 있다(SSR HTML과 첫 렌더를 맞추기 위해 effect에서 읽음).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlugs(Array.isArray(stored) ? stored : []);
    } catch { setSlugs([]); }
  }, []);

  useEffect(() => {
    // 북마크 목록이 바뀔 때 로딩 상태를 외부 요청(fetch)과 맞춘다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (slugs.length === 0) { setLoading(false); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    // 한 번의 배치 요청으로 카드 컬럼만 가져온다(글마다 /api/posts/[slug] 호출 → 전체 본문 조회 +
    // 조회수 증가가 발생하던 문제 해소). 제목/요약은 서버에서 locale에 맞게 영문화된다.
    let cancelled = false;
    fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs: slugs.slice(0, 100), locale }),
    })
      .then(r => (r.ok ? r.json() : { posts: [] }))
      .catch(() => ({ posts: [] }))
      .then((res: { posts?: BookmarkedPost[] }) => {
        if (cancelled) return;
        setPosts(Array.isArray(res.posts) ? res.posts : []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slugs, locale]);

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

  const sorted = sortPosts(posts, sort, locale);

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">BOOKMARKS</div>
          <h1 className="page-title">{dict.pages.bookmarksTitle}</h1>
          <p className="page-lead">{dict.pages.bookmarksLead}</p>
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
              <h3 style={{ margin: '0 0 10px', fontSize: 18, letterSpacing: '-0.01em' }}>{dict.pages.bookmarksEmpty}</h3>
              <p style={{ color: 'var(--text-3)', marginBottom: 28, lineHeight: 1.6 }}>{dict.pages.bookmarksEmptyLead}</p>
              <Link href="/" className="btn btn-primary">{dict.pages.goRead} →</Link>
            </div>
          )}

          {!loading && posts.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11.5, color: 'var(--text-4)', letterSpacing: '0.08em' }}>
                    {locale === 'en' ? `${posts.length} saved` : `${posts.length}개 저장됨`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.06em' }}>{locale === 'en' ? 'Sort' : '정렬'}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(Object.keys(sortLabels(locale)) as SortKey[]).map(k => (
                      <button
                        key={k}
                        className={`btn btn-sm${sort === k ? ' btn-primary' : ' btn-ghost'}`}
                        onClick={() => setSort(k)}
                        style={{ fontSize: 12 }}
                      >
                        {sortLabels(locale)[k]}
                      </button>
                    ))}
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={clearAll}
                    style={{ fontSize: 12, color: 'var(--acc-rose)', marginLeft: 4 }}
                  >
                    {dict.pages.clearAll}
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
