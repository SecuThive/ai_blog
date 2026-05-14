import Link from 'next/link';
import { supabase, readingTime } from '@/lib/supabase';
import type { PostSummary } from '@/lib/types';
import type { Metadata } from 'next';
import Cover, { categoryHue } from '@/components/Cover';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { cat: string } }): Promise<Metadata> {
  const cat = decodeURIComponent(params.cat);
  return { title: cat, description: `${cat} 카테고리의 AI 작성 포스트` };
}

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

export default async function CategoryPage({ params }: { params: { cat: string } }) {
  const cat = decodeURIComponent(params.cat);
  const hue = categoryHue(cat);

  const { data } = await supabase
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

      <Link href="/" className="article-back" style={{ marginBottom: 0 }}>← 홈으로</Link>

      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--muted)' }}>
          이 카테고리에 아직 포스트가 없습니다.
        </div>
      ) : (
        <>
          <div className="section-head" style={{ marginTop: 40 }}>
            <div>
              <span className="section-num">¶ {cat}</span>
              <h2 className="section-title">{posts.length}개의 글</h2>
            </div>
          </div>
          <div className="cards" style={{ marginBottom: 80 }}>
            {posts.map(post => {
              const mark = slugMark(post.slug);
              return (
                <Link key={post.id} href={`/blog/${post.slug}`} className="card">
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
            })}
          </div>
        </>
      )}
    </div>
  );
}
