import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { readingTime } from '@/lib/supabase';
import type { PostSummary } from '@/lib/types';
import Cover, { categoryHue } from '@/components/Cover';

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

const TOPICS = [
  { glyph: '01', name: 'AI 도구', href: '/category/AI%20%26%20%EC%9E%90%EB%8F%99%ED%99%94', count: 'AI & 자동화' },
  { glyph: '02', name: '에이전트', href: '/category/AI%20%26%20%EC%9E%90%EB%8F%99%ED%99%94', count: 'AI & 자동화' },
  { glyph: '03', name: '개발', href: '/category/%EA%B0%9C%EB%B0%9C', count: '개발' },
  { glyph: '04', name: '툴 리뷰', href: '/category/%ED%88%B4%20%EB%A6%AC%EB%B7%B0', count: '툴 리뷰' },
  { glyph: '05', name: 'IT 트렌드', href: '/category/IT%20%ED%8A%B8%EB%A0%8C%EB%93%9C', count: 'IT 트렌드' },
  { glyph: '06', name: '리서치', href: '/category/IT%20%ED%8A%B8%EB%A0%8C%EB%93%9C', count: 'IT 트렌드' },
  { glyph: '07', name: '에세이', href: '/', count: '컬렉션' },
  { glyph: '08', name: '인터뷰', href: '/', count: '컬렉션' },
];

function AdSlot({ type = 'leaderboard', note }: { type?: string; note?: string }) {
  const sizes: Record<string, string> = {
    leaderboard: '728 × 90',
    rectangle: '300 × 250',
    skyscraper: '300 × 600',
    billboard: '970 × 250',
  };
  return (
    <div className={`ad-slot ad-${type}`}>
      <div className="ad-slot-label">
        <div>{sizes[type] ?? 'FLUID'}</div>
        <small>{note ?? type.toUpperCase()}</small>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const posts = await getPosts();
  const [hero, ...rest] = posts;

  if (!hero) {
    return (
      <div className="shell" style={{ paddingTop: 80, paddingBottom: 80, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.24em', color: 'var(--muted)', marginBottom: 24 }}>
          SYNAPSE · AI EDITORIAL
        </div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px,5vw,72px)', fontWeight: 900, letterSpacing: '-.03em', marginBottom: 20 }}>
          AI가 첫 번째 글을 준비 중입니다.
        </h1>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--muted)', lineHeight: 1.6 }}>
          SafeSquare AI Company에서 블로그 목표를 설정하고 에이전트를 시작하세요.
        </p>
      </div>
    );
  }

  const heroHue = categoryHue(hero.category);
  const heroMark = String(hero.id).padStart(2, '0');
  const dateStr = hero.published_at
    ? new Date(hero.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <div>
      {/* Leaderboard ad */}
      <div className="ad-leaderboard-wrap">
        <AdSlot type="leaderboard" />
      </div>

      <div className="shell">
        {/* HERO */}
        <section className="hero">
          <div className="hero-text">
            <div className="hero-num">
              <span>Nº {String(hero.id).padStart(2, '0')}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                {hero.category}
              </span>
            </div>
            <Link href={`/blog/${hero.slug}`} className="hero-title">{hero.title}</Link>
            <p className="hero-sub">{hero.excerpt}</p>
            <div className="hero-byline">
              <span className="byline-ai">AI 작성 · 사람 검수</span>
              <span className="byline-meta">
                <span>{dateStr}</span>
                <span className="dot">·</span>
                <span>{hero.reading_time}분 읽기</span>
              </span>
            </div>
          </div>
          <Link href={`/blog/${hero.slug}`} style={{ display: 'block' }}>
            <Cover hue={heroHue} mark={heroMark} kicker={hero.category} shape="hero" />
          </Link>
        </section>

        {/* MAIN FEED + SIDEBAR */}
        <div className="feed">
          <div className="feed-main">
            <div className="section-head">
              <div>
                <span className="section-num">¶ 최신 발행</span>
                <h2 className="section-title">이번 주의 글</h2>
              </div>
              <a href="/" className="section-more">전체 보기 →</a>
            </div>

            <div className="cards">
              {rest.slice(0, 3).map(post => {
                const hue = categoryHue(post.category);
                const mark = String(post.id).padStart(2, '0');
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

              {/* In-feed ad */}
              <div className="card adcard">
                <div className="card-cover">
                  <div className="adcard-tag">SPONSORED</div>
                  <div className="adcard-size">광고 · 인피드</div>
                </div>
                <h3 className="adcard-h">당신의 다음 큰 아이디어</h3>
                <p className="adcard-p">이곳에 자동 매칭된 네이티브 광고가 표시됩니다. AdSense In-feed 슬롯.</p>
                <div className="adcard-cta">자세히 보기 →</div>
              </div>

              {rest.slice(3).map(post => {
                const hue = categoryHue(post.category);
                const mark = String(post.id).padStart(2, '0');
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
          </div>

          {/* SIDEBAR */}
          <aside className="feed-side">
            <div className="side-block">
              <div className="side-h"><span>가장 많이 읽은 글</span><span>TOP 5</span></div>
              {rest.slice(0, 5).map((post, i) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="most-row">
                  <div className="most-num">{String(i + 1).padStart(2, '0')}</div>
                  <div>
                    <h4 className="most-title">{post.title}</h4>
                    <div className="most-meta">{post.category} · {post.reading_time}min</div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="side-block">
              <div className="side-h"><span>스폰서</span><span>광고</span></div>
              <div className="ad-rectangle">
                <AdSlot type="rectangle" />
              </div>
              <div className="ad-caption">Google AdSense · 300 × 250</div>
            </div>

            <div className="side-block">
              <div className="news-card">
                <div className="news-kicker">★ SYNAPSE 모닝 브리프</div>
                <div className="news-h">매일 아침, 한 편의 깊은 글.</div>
                <p className="news-p">사람이 검수한 AI 큐레이션을 이메일로. 30초면 구독 완료.</p>
                <div className="news-input">
                  <input type="email" placeholder="you@example.com" />
                  <button>구독</button>
                </div>
              </div>
            </div>

            <div className="side-block">
              <div className="side-h"><span>스폰서</span><span>광고</span></div>
              <div className="ad-skyscraper">
                <AdSlot type="skyscraper" />
              </div>
              <div className="ad-caption">Google AdSense · 300 × 600</div>
            </div>
          </aside>
        </div>

        {/* TOPIC TILES */}
        <section className="topics">
          <div>
            <span className="topics-h-num">¶ 04 · 주제별 색인</span>
            <h3 className="topics-h">
              <small>BROWSE BY TOPIC</small>
              주제별로 둘러보기
            </h3>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.5, color: 'var(--muted)', marginTop: 20, maxWidth: '30ch' }}>
              관심사를 따라 깊이 파고드세요. 매일 자동으로 큐레이션됩니다.
            </p>
          </div>
          <div className="topic-grid">
            {TOPICS.map(t => (
              <Link key={t.glyph} href={t.href} className="topic-tile">
                <div className="topic-glyph">{t.glyph}</div>
                <div className="topic-name">{t.name}</div>
                <div className="topic-count">{t.count} →</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Billboard ad */}
        <div style={{ padding: '60px 0 40px' }}>
          <div className="ad-rectangle" style={{ aspectRatio: '970/250', maxWidth: 970, margin: '0 auto' }}>
            <AdSlot type="billboard" note="AdSense · Billboard 970 × 250" />
          </div>
          <div className="ad-caption" style={{ marginTop: 8 }}>Google AdSense · 970 × 250 · Billboard</div>
        </div>
      </div>
    </div>
  );
}
