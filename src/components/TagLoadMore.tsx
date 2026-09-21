'use client';

import Link from '@/i18n/link';
import { useState } from 'react';
import { catTone } from '@/lib/utils';
import PostThumb from '@/components/PostThumb';
import { useT } from '@/i18n/provider';
import { interpolate } from '@/i18n/messages';
import { categoryLabel } from '@/i18n/categories';
import { formatTimeAgo } from '@/i18n/format';
import { titleForLocale, excerptForLocale } from '@/i18n/content';

interface PostRow {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  published_at: string;
  reading_time?: number;
  cover_image?: string;
  tags?: string[] | null;
  content_evidence?: unknown;
}

const PAGE_SIZE = 12;

export default function TagLoadMore({ posts }: { posts: PostRow[] }) {
  const { locale, dict } = useT();
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
              <PostThumb slug={p.slug} title={titleForLocale(locale, p.title, { tags: p.tags, content_evidence: p.content_evidence })} coverImage={p.cover_image} category={p.category} />
              <div className="card-body">
                <div className="card-meta">
                  <span className={`badge badge-${tone}`}>{categoryLabel(p.category, locale)}</span>
                </div>
                <h3 className="card-title">{titleForLocale(locale, p.title, { tags: p.tags, content_evidence: p.content_evidence })}</h3>
                <p className="card-excerpt">{excerptForLocale(locale, p.excerpt, { tags: p.tags, content_evidence: p.content_evidence })}</p>
                <div className="card-foot">
                  <span>{formatTimeAgo(p.published_at, locale, dict)}</span>
                  <span className="dot" />
                  <span>{interpolate(dict.home.minRead, { min: p.reading_time ?? 1 })}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 32, marginBottom: 64 }}>
          <button className="btn btn-ghost" onClick={() => setVisible(v => v + PAGE_SIZE)}>
            {dict.common.loadMore} ({shown.length}/{posts.length})
          </button>
        </div>
      )}
    </>
  );
}
