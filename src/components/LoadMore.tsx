'use client';

import Link from '@/i18n/link';
import { useState } from 'react';
import { catTone } from '@/lib/utils';
import PostThumb from '@/components/PostThumb';
import { useT } from '@/i18n/provider';
import { interpolate } from '@/i18n/messages';
import { categoryLabel } from '@/i18n/categories';
import { formatTimeAgo } from '@/i18n/format';

interface PostRow {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  published_at: string;
  reading_time?: number;
  cover_image?: string;
}

interface LoadMoreProps {
  initialPosts: PostRow[];
  fetchUrl: string;  // base URL — LoadMore appends &page=N automatically
  pageSize?: number;
  layout?: 'grid' | 'list';
}

export default function LoadMore({ initialPosts, fetchUrl, pageSize = 12, layout = 'grid' }: LoadMoreProps) {
  const { dict, locale } = useT();
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(initialPosts.length < pageSize);

  const loadMore = async () => {
    setLoading(true);
    try {
      const next = page + 1;
      const res = await fetch(`${fetchUrl}&page=${next}`);
      const data = await res.json();
      const newPosts: PostRow[] = data.posts ?? data ?? [];
      setPosts(prev => [...prev, ...newPosts]);
      setPage(next);
      if (newPosts.length < pageSize) setExhausted(true);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  if (layout === 'list') {
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {posts.map(post => {
            const tone = catTone(post.category);
            return (
              <Link key={post.id} href={`/blog/${post.slug}`} className="card card-link" style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                    <span className={`badge badge-${tone}`}>{post.category}</span>
                    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)' }}>{formatTimeAgo(post.published_at, locale, dict)}</span>
                    {post.reading_time && (
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)' }}>{interpolate(dict.home.minShort, { min: post.reading_time })}</span>
                    )}
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 15.5, letterSpacing: '-0.015em', lineHeight: 1.4 }}>{post.title}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
        {!exhausted && (
          <div style={{ textAlign: 'center', marginTop: 32, marginBottom: 64 }}>
            <button className="btn btn-ghost" onClick={loadMore} disabled={loading}>
              {loading ? dict.common.loading : dict.common.loadMore}
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="grid-3" style={{ marginBottom: 32 }}>
        {posts.map(post => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="card card-link">
            <PostThumb slug={post.slug} title={post.title} coverImage={post.cover_image} category={post.category} />
            <div className="card-body">
              <div className="card-meta">
                <span className={`badge badge-${catTone(post.category)}`}>{categoryLabel(post.category, locale)}</span>
                <span className="card-time">{formatTimeAgo(post.published_at, locale, dict)}</span>
                {post.reading_time && <span className="card-time">{interpolate(dict.home.minShort, { min: post.reading_time })}</span>}
              </div>
              <h3 className="card-title">{post.title}</h3>
              <p className="card-excerpt">{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
      {!exhausted && (
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <button className="btn btn-ghost" onClick={loadMore} disabled={loading}>
            {loading ? dict.common.loading : `${dict.common.loadMore} (${interpolate(dict.common.showing, { count: posts.length })})`}
          </button>
        </div>
      )}
    </>
  );
}
