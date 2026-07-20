import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import { makeFreshClient } from '@/lib/supabase';
import { catTone } from '@/lib/utils';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export const metadata: Metadata = {
  title: '트렌딩',
  description: '가장 많이 읽히고 완독된 글들.',
  alternates: { canonical: `${SITE_URL}/trending` },
  openGraph: {
    title: '트렌딩',
    description: '가장 많이 읽히고 완독된 글들.',
    url: `${SITE_URL}/trending`,
    type: 'website',
  },
};

export const revalidate = 30;

interface PostRow {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  views: number;
  published_at: string;
}

/** 조회수 ÷ 발행 후 경과일 — 최근 급상승 글을 우선 */
function trendingScore(p: PostRow): number {
  const daysSince = Math.max(
    (Date.now() - new Date(p.published_at).getTime()) / 86_400_000,
    1
  );
  return p.views / daysSince;
}

async function getTrending(): Promise<{
  hot: PostRow[];          // trending score 상위 3
  allTime: PostRow[];      // 누적 조회수 전체 순위
  recent: PostRow[];       // 최근 30일 발행, trending score 순
  byCategory: { cat: string; tone: string; post: PostRow }[];
  tagStats: { tag: string; views: number }[];
  totalViews: number;
}> {
  noStore();
  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,excerpt,category,tags,views,published_at')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(50);

  const posts = (data ?? []) as PostRow[];
  const totalViews = posts.reduce((s, p) => s + p.views, 0);

  /* 상위 3 — 최근 급상승 기준 */
  const hot = [...posts]
    .sort((a, b) => trendingScore(b) - trendingScore(a))
    .slice(0, 3);

  /* 전체 순위 — 누적 조회수 순 (이미 정렬됨) */
  const allTime = posts.slice(0, 20);

  /* 최근 30일 발행 글 — trending score 순 */
  const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const recent = [...posts]
    .filter(p => p.published_at >= cutoff)
    .sort((a, b) => trendingScore(b) - trendingScore(a))
    .slice(0, 10);

  /* 카테고리별 1위 (누적 조회수 기준 — 이미 views-sorted) */
  const seen = new Set<string>();
  const byCategory = posts
    .filter(p => {
      if (seen.has(p.category)) return false;
      seen.add(p.category);
      return true;
    })
    .slice(0, 6)
    .map(p => ({ cat: p.category, tone: catTone(p.category), post: p }));

  /* 태그별 총 조회수 집계 */
  const tagMap = new Map<string, number>();
  for (const p of posts) {
    for (const t of (p.tags ?? [])) {
      if (!t.startsWith('series:') && t.length > 1) {
        tagMap.set(t, (tagMap.get(t) ?? 0) + p.views);
      }
    }
  }
  const tagStats = Array.from(tagMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, views]) => ({ tag, views }));

  return { hot, allTime, recent, byCategory, tagStats, totalViews };
}

/* ── 유틸 ── */
function fmtViews(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000)  return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}일 전`;
  if (d < 30) return `${Math.floor(d / 7)}주 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default async function TrendingPage() {
  const { hot, allTime, recent, byCategory, tagStats, totalViews } = await getTrending();

  return (
    <div>
      {/* ── Hero ── */}
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 4 }}>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            TRENDING
          </div>
          <h1 className="page-title">트렌딩</h1>
          <p className="page-lead">
            조회수 ÷ 발행 경과일로 산출한 <strong style={{ color: 'var(--text-1)' }}>실시간 상승 지수</strong> 기준.
            막 올라오는 글일수록 더 빠르게 상위에 반영됩니다.
          </p>

          {totalViews > 0 && (
            <div style={{ marginTop: 24, display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
                  {fmtViews(totalViews)}
                </div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
                  TOTAL VIEWS (TOP 50)
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
                  {allTime.length}
                </div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
                  RANKED POSTS
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
                  {recent.length}
                </div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
                  HOT THIS MONTH
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">

          {/* ── 급상승 Top 3 ── */}
          {hot.length > 0 && (
            <>
              <div className="sec-head2" style={{ marginBottom: 28 }}>
                <div className="left">
                  <span className="num" style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)', letterSpacing: '0.08em', padding: '4px 8px', border: '1px solid var(--line-2)', borderRadius: 4 }}>
                    HOT NOW
                  </span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>급상승 중인 글</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
                      조회수 ÷ 발행 경과일 기준 — 최근 올라온 인기 글이 먼저 표시됩니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid-3" style={{ marginBottom: 56 }}>
                {hot.map((p, i) => {
                  const tone = catTone(p.category);
                  const score = trendingScore(p);
                  return (
                    <Link
                      key={p.id}
                      href={`/blog/${p.slug}`}
                      className="card card-link"
                      style={{ padding: 24, position: 'relative', overflow: 'hidden' }}
                    >
                      <div style={{
                        position: 'absolute', top: -12, right: -12,
                        fontSize: 92, fontWeight: 600,
                        color: 'var(--text-5)', opacity: 0.4,
                        letterSpacing: '-0.05em', fontFamily: 'var(--ff-mono)', lineHeight: 1,
                        pointerEvents: 'none',
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                        <span className={`badge badge-${tone}`}>{p.category}</span>
                        {i === 0 && (
                          <span style={{
                            fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.06em',
                            color: 'var(--acc-mint)',
                            background: 'color-mix(in oklch, var(--acc-mint) 10%, transparent)',
                            border: '1px solid color-mix(in oklch, var(--acc-mint) 25%, transparent)',
                            padding: '2px 7px', borderRadius: 4,
                          }}>
                            ↑ 1위
                          </span>
                        )}
                      </div>
                      <h3 style={{ margin: '0 0 10px', fontSize: 17, lineHeight: 1.35, letterSpacing: '-0.015em' }}>{p.title}</h3>
                      <p style={{ margin: '0 0 14px', color: 'var(--text-3)', fontSize: 13, lineHeight: 1.55 }}>{p.excerpt}</p>
                      <div className="card-foot" style={{ marginTop: 'auto' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>{fmtViews(p.views)} 조회</span>
                        <span className="dot" />
                        <span>{timeAgo(p.published_at)}</span>
                        <span className="dot" />
                        <span style={{ color: 'var(--acc-blue)' }}>{score.toFixed(1)}/일</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {/* ── 전체 순위 + 사이드바 ── */}
          <div className="split">
            <div>
              {/* 전체 순위 — 누적 조회수 */}
              <h3 style={{ margin: '0 0 6px', fontSize: 17, letterSpacing: '-0.015em', fontWeight: 600 }}>전체 순위</h3>
              <p style={{ margin: '0 0 20px', fontSize: 12.5, color: 'var(--text-3)', fontFamily: 'var(--ff-mono)' }}>누적 조회수 기준 · TOP {allTime.length}</p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {allTime.map((p, i) => {
                  const tone = catTone(p.category);
                  return (
                    <Link
                      key={p.id}
                      href={`/blog/${p.slug}`}
                      style={{
                        display: 'grid', gridTemplateColumns: '40px 1fr auto',
                        gap: 18, padding: '14px 0',
                        borderTop: '1px solid var(--line-1)',
                        alignItems: 'center', textDecoration: 'none', color: 'inherit',
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--ff-mono)', fontSize: 14,
                        color: i < 3 ? 'var(--acc-blue)' : 'var(--text-4)',
                        fontWeight: i < 3 ? 600 : 400,
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          <span className={`badge badge-${tone}`}>{p.category}</span>
                        </div>
                        <div style={{ fontSize: 14.5, color: 'var(--text-1)', letterSpacing: '-0.01em', lineHeight: 1.35 }}>{p.title}</div>
                        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', marginTop: 4, letterSpacing: '0.04em' }}>
                          {timeAgo(p.published_at)}
                        </div>
                      </div>
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                        {fmtViews(p.views)}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* 최근 30일 인기 */}
              {recent.length > 0 && (
                <>
                  <h3 style={{ margin: '52px 0 6px', fontSize: 17, letterSpacing: '-0.015em', fontWeight: 600 }}>최근 30일 인기</h3>
                  <p style={{ margin: '0 0 20px', fontSize: 12.5, color: 'var(--text-3)', fontFamily: 'var(--ff-mono)' }}>
                    최근 발행 · 상승 지수(조회수/일) 순
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {recent.map((p, i) => {
                      const tone = catTone(p.category);
                      const score = trendingScore(p);
                      return (
                        <Link
                          key={p.id}
                          href={`/blog/${p.slug}`}
                          style={{
                            display: 'grid', gridTemplateColumns: '40px 1fr auto',
                            gap: 18, padding: '14px 0',
                            borderTop: '1px solid var(--line-1)',
                            alignItems: 'center', textDecoration: 'none', color: 'inherit',
                          }}
                        >
                          <span style={{
                            fontFamily: 'var(--ff-mono)', fontSize: 14,
                            color: i < 3 ? 'var(--acc-mint)' : 'var(--text-4)',
                            fontWeight: i < 3 ? 600 : 400,
                          }}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <div style={{ marginBottom: 4 }}>
                              <span className={`badge badge-${tone}`}>{p.category}</span>
                            </div>
                            <div style={{ fontSize: 14.5, color: 'var(--text-1)', letterSpacing: '-0.01em', lineHeight: 1.35 }}>{p.title}</div>
                            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', marginTop: 4, letterSpacing: '0.04em' }}>
                              {timeAgo(p.published_at)}
                            </div>
                          </div>
                          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--acc-blue)', whiteSpace: 'nowrap', textAlign: 'right' }}>
                            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-3)' }}>{fmtViews(p.views)}</span>
                            {score.toFixed(1)}/일
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* ── 사이드바 ── */}
            <aside className="aside-rail">
              {byCategory.length > 0 && (
                <div className="widget">
                  <h5>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    카테고리별 1위
                  </h5>
                  <ul className="widget-list">
                    {byCategory.map(c => (
                      <li key={c.cat} className="widget-item">
                        <span style={{ color: `var(--acc-${c.tone})`, flexShrink: 0, fontSize: 10 }}>◆</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span className="widget-item-meta">{c.cat}</span>
                            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--text-4)' }}>
                              {fmtViews(c.post.views)}
                            </span>
                          </div>
                          <Link href={`/blog/${c.post.slug}`} className="widget-item-title" style={{ color: 'var(--text-1)', textDecoration: 'none', fontSize: 13 }}>
                            {c.post.title}
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tagStats.length > 0 && (
                <div className="ai-widget">
                  <span className="ai-tag">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    핵심 토픽 · 태그별 조회수
                  </span>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {tagStats.map(({ tag, views }, i) => {
                      const maxV = tagStats[0].views;
                      const barW = Math.round((views / maxV) * 100);
                      return (
                        <li key={tag} style={{ padding: '8px 0', borderBottom: i < tagStats.length - 1 ? '1px solid var(--line-1)' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <Link
                              href={`/tag/${encodeURIComponent(tag)}`}
                              style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500, letterSpacing: '-0.005em' }}
                            >
                              {tag}
                            </Link>
                            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)' }}>
                              {fmtViews(views)}
                            </span>
                          </div>
                          <div style={{ height: 4, background: 'var(--bg-1)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', width: `${barW}%`, borderRadius: 999,
                              background: 'linear-gradient(90deg, var(--acc-blue), var(--acc-purple))',
                            }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* 빈 데이터 안내 */}
              {allTime.length === 0 && (
                <div className="widget" style={{ textAlign: 'center', padding: 32 }}>
                  <p style={{ color: 'var(--text-3)', fontSize: 13, margin: 0 }}>
                    아직 트렌딩 데이터가 없습니다.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
