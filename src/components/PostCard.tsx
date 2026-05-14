import Link from 'next/link';
import Cover, { categoryHue } from './Cover';
import type { PostSummary } from '@/lib/types';

function slugMark(slug: string): string {
  const clean = slug.replace(/-/g, '').replace(/[^a-zA-Z가-힣]/g, '');
  return clean.slice(0, 2).toUpperCase() || '·';
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

interface Props {
  post: PostSummary;
  featured?: boolean;
}

export default function PostCard({ post, featured = false }: Props) {
  const hue = categoryHue(post.category);
  const mark = slugMark(post.slug);

  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`} className="card">
        <Cover hue={hue} mark={mark} kicker={post.category} shape="hero" />
        <div className="card-cat">{post.category}</div>
        <h2 className="card-title" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)' }}>{post.title}</h2>
        <p className="card-sub" style={{ fontSize: 16, lineHeight: 1.6 }}>{post.excerpt}</p>
        <div className="card-foot">
          <span className="ai-mini">AI · 작성</span>
          <span>{post.reading_time}분</span>
          <span>{timeAgo(post.published_at)}</span>
          <span>{post.views.toLocaleString()} views</span>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className="card">
      <Cover hue={hue} mark={mark} kicker={post.category} shape="card" />
      <div className="card-cat">{post.category}</div>
      <h3 className="card-title">{post.title}</h3>
      <p className="card-sub">{post.excerpt}</p>
      <div className="card-foot">
        <span className="ai-mini">AI · 작성</span>
        <span>{post.reading_time}분</span>
        <span>{timeAgo(post.published_at)}</span>
      </div>
    </Link>
  );
}
