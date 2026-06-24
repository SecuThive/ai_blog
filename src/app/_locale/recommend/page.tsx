import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import { readingTime, makeFreshClient } from '@/lib/supabase';
import { catTone } from '@/lib/utils';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export const metadata: Metadata = {
  title: 'AI 추천 — Nodelog',
  description: '조회수·최신성·카테고리 다양성 기반으로 선별한 추천 글.',
  alternates: { canonical: `${SITE_URL}/recommend` },
  openGraph: {
    title: 'AI 추천 — Nodelog',
    description: '조회수·최신성·카테고리 다양성 기반으로 선별한 추천 글.',
    url: `${SITE_URL}/recommend`,
    type: 'website',
  },
};

export const revalidate = 60;

interface PostRow {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  published_at: string;
  views: number;
  reading_time: number;
}

/** 조회수 ÷ 발행 경과일 — 트렌딩 스코어 */
function trendingScore(p: PostRow): number {
  const days = Math.max((Date.now() - new Date(p.published_at).getTime()) / 86_400_000, 1);
  return p.views / days;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d < 1) return '오늘';
  if (d < 7) return `${d}일 전`;
  if (d < 30) return `${Math.floor(d / 7)}주 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function fmtViews(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000)  return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

async function getPosts(): Promise<PostRow[]> {
  noStore();
  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,excerpt,category,tags,published_at,views,content')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  return (data ?? []).map((p: Record<string, unknown>) => ({
    id:           p.id as number,
    title:        p.title as string,
    slug:         p.slug as string,
    excerpt:      p.excerpt as string,
    category:     p.category as string,
    tags:         (p.tags as string[]) ?? [],
    published_at: p.published_at as string,
    views:        (p.views as number) ?? 0,
    reading_time: readingTime((p.content as string) ?? ''),
  }));
}

/* ── 추천 그룹 레이블 컴포넌트 ── */
function GroupLabel({
  icon, label, score, scoreColor,
}: {
  icon: React.ReactNode;
  label: string;
  score: string;
  scoreColor?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <span className="ai-tag" style={{ fontSize: 11, gap: 5 }}>
        {icon}
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--ff-mono)', fontSize: 11,
        color: scoreColor ?? 'var(--text-3)',
        letterSpacing: '0.04em',
      }}>
        {score}
      </span>
    </div>
  );
}

export default async function RecommendPage() {
  const posts = await getPosts();

  if (posts.length === 0) {
    return (
      <div className="err">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>AI RECOMMEND</div>
          <p style={{ color: 'var(--text-3)' }}>추천 글을 준비 중입니다.</p>
          <Link href="/" className="btn btn-ghost" style={{ marginTop: 16 }}>← 홈으로</Link>
        </div>
      </div>
    );
  }

  /* ── 통계 ── */
  const totalViews  = posts.reduce((s, p) => s + p.views, 0);
  const avgReading  = Math.round(posts.reduce((s, p) => s + p.reading_time, 0) / posts.length);
  const catCount    = new Map<string, number>();
  for (const p of posts) catCount.set(p.category, (catCount.get(p.category) ?? 0) + 1);
  const topCats     = Array.from(catCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const total       = posts.length;

  /* ── 추천 그룹 ── */

  // 1. 급상승 — trending score 상위 4
  const trending = [...posts]
    .sort((a, b) => trendingScore(b) - trendingScore(a))
    .slice(0, 4);

  // 2. 많이 읽힌 글 — 누적 조회수 상위 4
  const byViews = [...posts]
    .sort((a, b) => b.views - a.views)
    .slice(0, 4);

  // 3. 최신 발행 — 발행일 최신순 4 (이미 정렬됨)
  const byRecent = posts.slice(0, 4);

  // 4. 카테고리별 베스트 — 각 카테고리에서 views 최고 글
  const catBest = new Map<string, PostRow>();
  for (const p of posts) {
    const prev = catBest.get(p.category);
    if (!prev || p.views > prev.views) catBest.set(p.category, p);
  }
  const byCat = Array.from(catBest.values())
    .sort((a, b) => b.views - a.views)
    .slice(0, 4);

  // 5. 완독 추천 — 5~20분 범위, trending score 순
  const byDepth = [...posts]
    .filter(p => p.reading_time >= 5 && p.reading_time <= 20)
    .sort((a, b) => trendingScore(b) - trendingScore(a))
    .slice(0, 4);
  const byDepthFallback = byDepth.length >= 2 ? byDepth
    : [...posts].sort((a, b) => b.reading_time - a.reading_time).slice(0, 4);

  const starIcon = (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  );

  const groups: {
    id: string;
    title: string;
    sub: string;
    posts: PostRow[];
    renderCard: (p: PostRow, i: number) => React.ReactNode;
  }[] = [
    {
      id: 'trending',
      title: '급상승 중인 글',
      sub: '조회수 ÷ 발행 경과일 기준 — 최근 주목받는 글',
      posts: trending,
      renderCard: (p) => (
        <>
          <GroupLabel
            icon={starIcon}
            label="급상승"
            score={`↑ ${trendingScore(p).toFixed(1)}/일`}
            scoreColor="var(--acc-mint)"
          />
          <h3 style={{ margin: '0 0 8px', fontSize: 15.5, lineHeight: 1.35, letterSpacing: '-0.01em' }}>{p.title}</h3>
          <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, lineHeight: 1.55 }}>{p.excerpt}</p>
          <div className="card-foot">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
            </svg>
            <span>{fmtViews(p.views)}</span>
            <span className="dot" />
            <span>{timeAgo(p.published_at)}</span>
          </div>
        </>
      ),
    },
    {
      id: 'views',
      title: '가장 많이 읽힌 글',
      sub: '누적 조회수 기준 상위 글',
      posts: byViews,
      renderCard: (p, i) => (
        <>
          <GroupLabel
            icon={starIcon}
            label={`# ${i + 1} · 인기`}
            score={`${fmtViews(p.views)} 조회`}
            scoreColor="var(--acc-blue)"
          />
          <h3 style={{ margin: '0 0 8px', fontSize: 15.5, lineHeight: 1.35, letterSpacing: '-0.01em' }}>{p.title}</h3>
          <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, lineHeight: 1.55 }}>{p.excerpt}</p>
          <div className="card-foot">
            <span>{p.reading_time}분 읽기</span>
            <span className="dot" />
            <span>{timeAgo(p.published_at)}</span>
          </div>
        </>
      ),
    },
    {
      id: 'recent',
      title: '최신 발행',
      sub: '가장 최근에 게재된 글',
      posts: byRecent,
      renderCard: (p) => (
        <>
          <GroupLabel
            icon={starIcon}
            label="최신"
            score={timeAgo(p.published_at)}
          />
          <h3 style={{ margin: '0 0 8px', fontSize: 15.5, lineHeight: 1.35, letterSpacing: '-0.01em' }}>{p.title}</h3>
          <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, lineHeight: 1.55 }}>{p.excerpt}</p>
          <div className="card-foot">
            <span>{p.reading_time}분 읽기</span>
            <span className="dot" />
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
            </svg>
            <span>{fmtViews(p.views)}</span>
          </div>
        </>
      ),
    },
    {
      id: 'category',
      title: '카테고리별 베스트',
      sub: '각 카테고리에서 조회수가 가장 높은 글',
      posts: byCat,
      renderCard: (p) => (
        <>
          <GroupLabel
            icon={starIcon}
            label="카테고리 1위"
            score={`${fmtViews(p.views)} 조회`}
            scoreColor="var(--acc-purple)"
          />
          <h3 style={{ margin: '0 0 8px', fontSize: 15.5, lineHeight: 1.35, letterSpacing: '-0.01em' }}>{p.title}</h3>
          <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, lineHeight: 1.55 }}>{p.excerpt}</p>
          <div className="card-foot">
            <span>{p.reading_time}분 읽기</span>
            <span className="dot" />
            <span>{timeAgo(p.published_at)}</span>
          </div>
        </>
      ),
    },
    {
      id: 'depth',
      title: '완독 추천 · 깊이 있는 글',
      sub: '5~20분 분량 중 급상승 중인 글',
      posts: byDepthFallback,
      renderCard: (p) => (
        <>
          <GroupLabel
            icon={starIcon}
            label={`${p.reading_time}분 읽기`}
            score={`↑ ${trendingScore(p).toFixed(1)}/일`}
            scoreColor="var(--acc-amber)"
          />
          <h3 style={{ margin: '0 0 8px', fontSize: 15.5, lineHeight: 1.35, letterSpacing: '-0.01em' }}>{p.title}</h3>
          <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, lineHeight: 1.55 }}>{p.excerpt}</p>
          <div className="card-foot">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
            </svg>
            <span>{fmtViews(p.views)}</span>
            <span className="dot" />
            <span>{timeAgo(p.published_at)}</span>
          </div>
        </>
      ),
    },
  ];

  return (
    <div>
      {/* ── Hero ── */}
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 4 }}>
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            AI RECOMMENDATIONS
          </div>
          <h1 className="page-title">AI 추천</h1>
          <p className="page-lead">
            조회수·최신성·카테고리 다양성 기반으로 실시간 선별한 추천 글입니다.
            급상승 지수(조회수 ÷ 경과일)로 지금 주목받는 글을 먼저 보여줍니다.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">

          {/* ── 통계 카드 ── */}
          <div className="card" style={{ padding: 28, marginBottom: 52 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
              <div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8 }}>
                  ANALYSED
                </div>
                <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>{total}편</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>발행된 글 기준</div>
              </div>

              <div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8 }}>
                  TOTAL VIEWS
                </div>
                <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>{fmtViews(totalViews)}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>누적 조회수</div>
              </div>

              <div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8 }}>
                  AVG READ
                </div>
                <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>{avgReading}분</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>평균 읽기 시간</div>
              </div>

              <div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 10 }}>
                  TOP CATEGORIES
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {topCats.map(([cat, cnt]) => (
                    <span key={cat} className={`badge badge-${catTone(cat)}`} style={{ fontSize: 10.5 }}>
                      {cat} · {Math.round((cnt / total) * 100)}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── 추천 그룹 ── */}
          {groups.map(group => (
            group.posts.length > 0 && (
              <div key={group.id} style={{ marginBottom: 60 }}>
                <div className="sec-head2" style={{ marginBottom: 24 }}>
                  <div className="left">
                    <div>
                      <div className="section-eyebrow" style={{ marginBottom: 6 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                        AI · PICK
                      </div>
                      <h2 style={{ margin: '0 0 4px', fontSize: 22, letterSpacing: '-0.02em', fontWeight: 600 }}>{group.title}</h2>
                      <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13 }}>{group.sub}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
                  {group.posts.map((p, i) => {
                    const tone = catTone(p.category);
                    return (
                      <Link
                        key={p.id}
                        href={`/blog/${p.slug}`}
                        className="card card-link"
                        style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 0 }}
                      >
                        <div style={{ marginBottom: 10 }}>
                          <span className={`badge badge-${tone}`}>{p.category}</span>
                        </div>
                        {group.renderCard(p, i)}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )
          ))}
        </div>
      </section>
    </div>
  );
}
