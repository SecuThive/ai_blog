'use client';

import Link from '@/i18n/link';
import Cover, { categoryHue } from './Cover';
import type { PostSummary } from '@/lib/types';
import { MIN_DISPLAY_VIEWS } from '@/lib/utils';
import { useT } from '@/i18n/provider';
import { interpolate } from '@/i18n/messages';
import { categoryLabel } from '@/i18n/categories';
import { formatTimeAgo } from '@/i18n/format';

function slugMark(slug: string): string {
  const clean = slug.replace(/-/g, '').replace(/[^a-zA-Z가-힣]/g, '');
  return clean.slice(0, 2).toUpperCase() || '·';
}

interface Props {
  post: PostSummary;
  featured?: boolean;
}

export default function PostCard({ post, featured = false }: Props) {
  const { dict, locale } = useT();
  const hue = categoryHue(post.category);
  const mark = slugMark(post.slug);

  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`} className="card">
        <Cover hue={hue} mark={mark} kicker={post.category} shape="hero" />
        <div className="card-cat">{categoryLabel(post.category, locale)}</div>
        <h2 className="card-title" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)' }}>{post.title}</h2>
        <p className="card-sub" style={{ fontSize: 16, lineHeight: 1.6 }}>{post.excerpt}</p>
        <div className="card-foot">
          <span className="ai-mini">{dict.common.aiWritten}</span>
          <span>{interpolate(dict.home.minShort, { min: post.reading_time })}</span>
          <span>{formatTimeAgo(post.published_at, locale, dict)}</span>
          {post.views >= MIN_DISPLAY_VIEWS && <span>{post.views.toLocaleString()} views</span>}
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className="card">
      <Cover hue={hue} mark={mark} kicker={post.category} shape="card" />
      <div className="card-cat">{categoryLabel(post.category, locale)}</div>
      <h3 className="card-title">{post.title}</h3>
      <p className="card-sub">{post.excerpt}</p>
      <div className="card-foot">
        <span className="ai-mini">{dict.common.aiWritten}</span>
        <span>{interpolate(dict.home.minShort, { min: post.reading_time })}</span>
        <span>{formatTimeAgo(post.published_at, locale, dict)}</span>
      </div>
    </Link>
  );
}
