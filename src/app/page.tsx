import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { readingTime } from '@/lib/supabase';
import type { PostSummary } from '@/lib/types';

function makeFreshClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

export const revalidate = 60;

async function getPosts(): Promise<PostSummary[]> {
  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,excerpt,cover_image,category,tags,author,agent_role,views,published_at,content')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20);

  return (data ?? []).map((p: Record<string, unknown>) => ({
    ...p,
    content: undefined,
    reading_time: readingTime((p.content as string) ?? ''),
  })) as unknown as PostSummary[];
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

function catTone(cat: string): string {
  if (cat.includes('AI') || cat.includes('자동화')) return 'blue';
  if (cat.includes('트렌드') || cat.includes('IT')) return 'purple';
  if (cat.includes('개발') || cat.includes('인프라') || cat.includes('클라우드')) return 'mint';
  if (cat.includes('툴') || cat.includes('리뷰') || cat.includes('생산성')) return 'amber';
  if (cat.includes('보안')) return 'rose';
  return 'blue';
}

const CATEGORIES = [
  { label: 'AI 자동화', href: '/category/AI & 자동화', tone: 'blue', icon: '⚡' },
  { label: 'IT 트렌드', href: '/category/IT 트렌드', tone: 'purple', icon: '📡' },
  { label: '개발', href: '/category/개발', tone: 'mint', icon: '</>' },
  { label: '툴 리뷰', href: '/category/툴 리뷰', tone: 'amber', icon: '★' },
];

function HeroHub() {
  const cells = [
    { top: '8%', right: '5%', title: 'AI 자동화', sub: '+47% 효율' },
    { top: '36%', right: '-4%', title: '개발 트렌드', sub: '주간 업데이트' },
    { bottom: '14%', right: '8%', title: '보안 동향', sub: 'AI 위협 분석' },
    { bottom: '20%', left: '2%', title: '클라우드', sub: '최신 인사이트' },
    { top: '14%', left: '4%', title: 'IT 트렌드', sub: '글로벌 현황' },
  ];
  return (
    <div className="hub">
      <div className="hub-ring" />
      <div className="hub-ring r2" />
      <div className="hub-ring r3" />
      <div className="hub-core" />
      {cells.map((c, i) => (
        <div key={i} className="hub-cell" style={c as React.CSSProperties}>
          <div className="cell-title">{c.title}</div>
          <div style={{ color: 'var(--text-3)', fontSize: 11 }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

function PostCard({ post }: { post: PostSummary }) {
  const tone = catTone(post.category);
  return (
    <Link href={`/blog/${post.slug}`} className="card card-link">
      <div className={`card-thumb thumb-${tone}`}>
        {post.category}
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span className={`badge badge-${tone}`}>{post.category}</span>
        </div>
        <h3 className="card-title">{post.title}</h3>
        <p className="card-excerpt">{post.excerpt}</p>
        <div className="card-foot">
          <span>{timeAgo(post.published_at)}</span>
          <span className="dot" />
          <span>{post.reading_time}분 읽기</span>
        </div>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const posts = await getPosts();

  if (posts.length === 0) {
    return (
      <div className="container" style={{ paddingTop: 80, paddingBottom: 80, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.16em', color: 'var(--text-3)', marginBottom: 24, textTransform: 'uppercase' }}>
          NODELOG · AI IT MEDIA
        </div>
        <h1 style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 600, letterSpacing: '-.035em', marginBottom: 20 }}>
          첫 번째 글을 준비 중입니다.
        </h1>
        <p style={{ fontSize: 17, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
          AI 에이전트가 최신 IT 트렌드를 분석하고 글을 작성 중입니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="hero-status">
                <span className="live-dot" />
                NODELOG · AI-POWERED IT MEDIA
              </div>
              <h1>
                AI가 분석하는<br />
                <span className="grad">IT의 최전선</span>
              </h1>
              <p className="lead">
                인공지능이 취재하고 사람이 검수하는 IT·개발·보안·인프라 전문 미디어.
                매일 업데이트되는 깊이 있는 기술 인사이트를 만나보세요.
              </p>
              <div className="hero-actions">
                <Link href={`/blog/${posts[0].slug}`} className="btn btn-primary btn-lg">
                  최신 글 읽기
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href="/category/AI & 자동화" className="btn btn-ghost btn-lg">
                  카테고리 보기
                </Link>
              </div>
              <div className="hero-meta">
                <div>
                  <div className="stat-num">{posts.length}+</div>
                  <div className="stat-lab">발행 글</div>
                </div>
                <div>
                  <div className="stat-num">4</div>
                  <div className="stat-lab">카테고리</div>
                </div>
                <div>
                  <div className="stat-num">Daily</div>
                  <div className="stat-lab">업데이트</div>
                </div>
              </div>
            </div>
            <HeroHub />
          </div>
        </div>
      </section>

      {/* ===== Category tiles ===== */}
      <section className="section" style={{ paddingBottom: 32 }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 12 }}>
            {CATEGORIES.map(c => (
              <Link
                key={c.href}
                href={c.href}
                className="card"
                style={{ flex: 1, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer', textDecoration: 'none' }}
              >
                <div style={{ fontSize: 22 }}>{c.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{c.label}</div>
                <div className={`badge badge-${c.tone}`} style={{ alignSelf: 'flex-start' }}>{c.tone.toUpperCase()}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Latest posts ===== */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="section-eyebrow">LATEST</div>
              <h2 className="section-title">최신 글</h2>
            </div>
            <Link href="/" className="section-link">
              전체 보기
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid-3">
            {posts.slice(0, 6).map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {posts.length > 6 && (
            <>
              <div style={{ margin: '48px 0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>더 많은 글</h3>
              </div>
              <div className="grid-3">
                {posts.slice(6).map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ===== Subscribe band ===== */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="subscribe">
            <div>
              <div className="section-eyebrow" style={{ marginBottom: 16 }}>NEWSLETTER</div>
              <h3>IT 인사이트를 이메일로 받아보세요</h3>
              <p>AI가 분석한 최신 기술 트렌드와 깊이 있는 분석 글을 매일 아침 받아보세요. 30초면 구독 완료.</p>
            </div>
            <div>
              <form className="subscribe-form" action="#" method="post">
                <input className="input" type="email" name="email" placeholder="you@example.com" />
                <button type="submit" className="btn btn-primary">구독하기</button>
              </form>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-4)', fontFamily: 'var(--ff-mono)' }}>
                언제든 구독 해지 가능 · 스팸 없음
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
