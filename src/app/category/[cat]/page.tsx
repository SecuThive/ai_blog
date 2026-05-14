import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { readingTime } from '@/lib/supabase';
import type { PostSummary } from '@/lib/types';
import type { Metadata } from 'next';
import Cover, { categoryHue } from '@/components/Cover';

export const revalidate = 60;

function makeFreshClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

export async function generateMetadata({ params }: { params: Promise<{ cat: string }> }): Promise<Metadata> {
  const { cat: rawCat } = await params;
  const cat = decodeURIComponent(rawCat);
  return { title: `${cat} — Synapse`, description: `${cat} 카테고리의 AI 작성 포스트` };
}

export async function generateStaticParams() {
  const cats = ['AI & 자동화', '개발', '툴 리뷰', 'IT 트렌드'];
  return cats.map(cat => ({ cat: encodeURIComponent(cat) }));
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

export default async function CategoryPage({ params }: { params: Promise<{ cat: string }> }) {
  const { cat: rawCat } = await params;
  const cat = decodeURIComponent(rawCat);
  const hue = categoryHue(cat);

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

  const NAV = [
    { href: '/category/AI%20%26%20%EC%9E%90%EB%8F%99%ED%99%94', label: 'AI & 자동화' },
    { href: '/category/%EA%B0%9C%EB%B0%9C', label: '개발' },
    { href: '/category/%ED%88%B4%20%EB%A6%AC%EB%B7%B0', label: '툴 리뷰' },
    { href: '/category/IT%20%ED%8A%B8%EB%A0%8C%EB%93%9C', label: 'IT 트렌드' },
  ];

  return (
    <div className="shell">
      {/* Category masthead */}
      <div className="cat-masthead">
        <p className="cat-mast-kicker">SYNAPSE · 주제별 색인</p>
        <h1 className="cat-mast-title" style={{ '--hue': hue } as React.CSSProperties}>{cat}</h1>
        <div>
          <p className="cat-mast-deck">AI가 큐레이션한 {cat} 관련 심층 분석글 모음.</p>
        </div>
        <div className="cat-mast-meta">
          <span>{posts.length}개 포스트</span>
          <span className="dot">·</span>
          <span>AI 큐레이션</span>
          <span className="dot">·</span>
          <span>매일 업데이트</span>
        </div>
      </div>

      {/* Category tab strip */}
      <nav className="cat-tabs">
        <Link href="/" className="cat-tab">전체</Link>
        {NAV.map(n => (
          <Link
            key={n.href}
            href={n.href}
            className={`cat-tab${n.label === cat ? ' active' : ''}`}
          >
            {n.label}
          </Link>
        ))}
      </nav>

      {posts.length === 0 ? (
        <div className="cat-empty">
          <div className="cat-empty-icon">◌</div>
          <p>이 카테고리에 아직 포스트가 없습니다.</p>
          <Link href="/" className="article-back" style={{ justifyContent: 'center', marginTop: 16 }}>← 홈으로</Link>
        </div>
      ) : (
        <>
          <div className="section-head" style={{ marginTop: 40 }}>
            <div>
              <span className="section-num">¶ {cat}</span>
              <h2 className="section-title">{posts.length}개의 글</h2>
            </div>
            <Link href="/" className="section-more">← 홈으로</Link>
          </div>
          <div className="cards" style={{ marginBottom: 80 }}>
            {posts.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="card">
                <Cover hue={hue} mark={String(post.id).padStart(2, '0')} kicker={post.category} shape="card" />
                <div className="card-cat">{post.category}</div>
                <h3 className="card-title">{post.title}</h3>
                <p className="card-sub">{post.excerpt}</p>
                <div className="card-foot">
                  <span className="ai-mini">AI · 작성</span>
                  <span>{post.reading_time}분</span>
                  <span>{timeAgo(post.published_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
