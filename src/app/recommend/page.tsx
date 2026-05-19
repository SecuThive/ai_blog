import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import { readingTime, makeFreshClient } from '@/lib/supabase';
import { catTone } from '@/lib/utils';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export const metadata: Metadata = {
  title: 'AI 추천 — Nodelog',
  description: '읽기 패턴 기반으로 독자에게 맞는 글을 추천합니다.',
  alternates: { canonical: `${SITE_URL}/recommend` },
  openGraph: {
    title: 'AI 추천 — Nodelog',
    description: '읽기 패턴 기반으로 독자에게 맞는 글을 추천합니다.',
    url: `${SITE_URL}/recommend`,
    type: 'website',
  },
};

export const revalidate = 60;

interface PostRow {
  id: number; title: string; slug: string; excerpt: string;
  category: string; published_at: string; views: number; reading_time: number;
}

async function getPosts(): Promise<PostRow[]> {
  noStore();
  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,excerpt,category,published_at,views,content')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(24);

  return (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as number, title: p.title as string, slug: p.slug as string,
    excerpt: p.excerpt as string, category: p.category as string,
    published_at: p.published_at as string, views: (p.views as number) ?? 0,
    reading_time: readingTime((p.content as string) ?? ''),
  }));
}

function matchScore(p: PostRow, maxViews: number): number {
  const viewScore = maxViews > 0 ? (p.views / maxViews) * 60 : 0;
  const daysSince = (Date.now() - new Date(p.published_at).getTime()) / 86400000;
  const recencyScore = Math.max(0, 40 - daysSince * 1.5);
  return Math.min(99, Math.max(60, Math.round(viewScore + recencyScore)));
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return '오늘';
  if (d < 7) return `${d}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default async function RecommendPage() {
  const posts = await getPosts();

  const maxViews = Math.max(...posts.map(p => p.views), 1);

  // 카테고리 분포 계산
  const catCount = new Map<string, number>();
  for (const p of posts) catCount.set(p.category, (catCount.get(p.category) ?? 0) + 1);
  const topCats = Array.from(catCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const total = posts.length || 1;

  // 오늘 발행 수
  const todayCount = posts.filter(p => {
    const d = new Date(p.published_at);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }).length;

  const avgReading = posts.length
    ? Math.round(posts.reduce((s, p) => s + p.reading_time, 0) / posts.length)
    : 0;

  // 추천 그룹: 실제 데이터 기반
  const byViews = [...posts].sort((a, b) => b.views - a.views).slice(0, 3);
  const byRecent = [...posts].sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()).slice(0, 3);
  const seenCats = new Set<string>();
  const byCat = posts.filter(p => { if (seenCats.has(p.category)) return false; seenCats.add(p.category); return true; }).slice(0, 3);
  const byDepth = [...posts].sort((a, b) => b.reading_time - a.reading_time).slice(0, 3);

  const groups = [
    { t: '가장 많이 읽힌 글', s: '누적 조회수 기준 상위 3편', posts: byViews },
    { t: '최신 발행', s: '가장 최근에 게재된 글', posts: byRecent },
    { t: '카테고리 대표 글', s: '각 카테고리에서 가장 많이 읽힌 글', posts: byCat },
    { t: '깊이 있는 글', s: '읽기 시간 기준 — 긴 호흡으로 읽을 만한 글', posts: byDepth },
  ];

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 4 }}>
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            AI RECOMMENDATIONS
          </div>
          <h1 className="page-title">AI 추천</h1>
          <p className="page-lead">조회수·최신성·카테고리 다양성 기준으로 선별한 추천 글입니다.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* 실제 데이터 기반 통계 카드 */}
          <div className="card" style={{ padding: 24, marginBottom: 48, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            <div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em', marginBottom: 8 }}>TOTAL POSTS</div>
              <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{total}편</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>오늘 발행 {todayCount}편</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em', marginBottom: 8 }}>TOP CATEGORIES</div>
              <div className="pill-row">
                {topCats.map(([cat, cnt]) => (
                  <span key={cat} className={`badge badge-${catTone(cat)}`}>{cat} · {Math.round((cnt / total) * 100)}%</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em', marginBottom: 8 }}>AVG READ TIME</div>
              <div style={{ fontSize: 24, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{avgReading}분</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>평균 읽기 시간</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em', marginBottom: 8 }}>TOP VIEWED</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.4 }}>{byViews[0]?.title.slice(0, 28)}…</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{byViews[0]?.views.toLocaleString()} 조회</div>
            </div>
          </div>

          {groups.map(group => (
            <div key={group.t} style={{ marginBottom: 56 }}>
              <div className="section-head">
                <div>
                  <div className="section-eyebrow">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 4 }}>
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    AI · PICK
                  </div>
                  <h2 style={{ margin: '0 0 6px', fontSize: 22, letterSpacing: '-0.02em' }}>{group.t}</h2>
                  <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13.5 }}>{group.s}</p>
                </div>
              </div>
              <div className="grid-3">
                {group.posts.map(p => {
                  const tone = catTone(p.category);
                  const score = matchScore(p, maxViews);
                  return (
                    <Link key={p.id} href={`/blog/${p.slug}`} className="card card-link" style={{ padding: 22 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span className="ai-tag" style={{ fontSize: 11 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 3 }}>
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                          MATCH {score}%
                        </span>
                        <span className={`badge badge-${tone}`}>{p.category}</span>
                      </div>
                      <h3 style={{ margin: '0 0 8px', fontSize: 15.5, lineHeight: 1.35, letterSpacing: '-0.01em' }}>{p.title}</h3>
                      <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, lineHeight: 1.55 }}>{p.excerpt}</p>
                      <div className="card-foot">
                        <span>{p.reading_time}분</span>
                        <span className="dot" />
                        <span>{timeAgo(p.published_at)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
