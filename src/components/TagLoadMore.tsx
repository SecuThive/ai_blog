'use client';

import Link from 'next/link';
import { useState } from 'react';
import { catTone } from '@/lib/utils';
import PostThumb from '@/components/PostThumb';

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

const PAGE_SIZE = 12;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return '오늘';
  if (d < 7) return `${d}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function TagLoadMore({ posts }: { posts: PostRow[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = posts.slice(0, visible);
  const hasMore = visible < posts.length;

  return (
    <>
      <div className="grid-2">
        {shown.map((p) => {
          const tone = catTone(p.category);
          return (
            <Link key={p.id} href={`/blog/${p.slug}`} className="card card-link">
              <PostThumb slug={p.slug} title={p.title} coverImage={p.cover_image} category={p.category} />
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
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 32, marginBottom: 64 }}>
          <button className="btn btn-ghost" onClick={() => setVisible(v => v + PAGE_SIZE)}>
            더 보기 ({shown.length}/{posts.length})
          </button>
        </div>
      )}
    </>
  );
}
