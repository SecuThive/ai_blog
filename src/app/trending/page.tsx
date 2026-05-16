import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '트렌딩 — Nodelog',
  description: '가장 많이 읽히고 완독된 글들.',
};

export const revalidate = 30;

function makeFreshClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

function catTone(cat: string): string {
  if (cat.includes('AI') || cat.includes('자동화')) return 'blue';
  if (cat.includes('트렌드') || cat.includes('IT')) return 'purple';
  if (cat.includes('개발') || cat.includes('인프라')) return 'mint';
  if (cat.includes('툴') || cat.includes('리뷰')) return 'amber';
  if (cat.includes('보안')) return 'rose';
  return 'blue';
}

interface PostRow {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  views: number;
  published_at: string;
}

async function getTrending(): Promise<{ top: PostRow[]; all: PostRow[]; byCategory: { cat: string; tone: string; post: PostRow }[] }> {
  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,excerpt,category,views,published_at')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(20);

  const posts = (data ?? []) as PostRow[];
  const top = posts.slice(0, 3);
  const all = posts;

  const seen = new Set<string>();
  const byCategory = posts
    .filter(p => {
      if (seen.has(p.category)) return false;
      seen.add(p.category);
      return true;
    })
    .slice(0, 5)
    .map(p => ({ cat: p.category, tone: catTone(p.category), post: p }));

  return { top, all, byCategory };
}

export default async function TrendingPage() {
  const { top, all, byCategory } = await getTrending();

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 4 }}>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            TRENDING
          </div>
          <h1 className="page-title">트렌딩</h1>
          <p className="page-lead">가장 많이 읽히고, 끝까지 완독된 글들. 숫자 자체보다 어떤 주제가 움직이는지를 살피세요.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid-3" style={{ marginBottom: 56 }}>
            {top.map((p, i) => {
              const tone = catTone(p.category);
              return (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="card card-link"
                  style={{ padding: 24, position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ position: 'absolute', top: -12, right: -12, fontSize: 92, fontWeight: 600, color: 'var(--text-5)', opacity: 0.4, letterSpacing: '-0.05em', fontFamily: 'var(--ff-mono)', lineHeight: 1, pointerEvents: 'none' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <span className={`badge badge-${tone}`}>{p.category}</span>
                  </div>
                  <h3 style={{ margin: '0 0 12px', fontSize: 17, lineHeight: 1.35, letterSpacing: '-0.015em' }}>{p.title}</h3>
                  <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, lineHeight: 1.55 }}>{p.excerpt}</p>
                  <div className="card-foot" style={{ marginTop: 16 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>{p.views.toLocaleString()}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="split">
            <div>
              <h3 style={{ margin: '0 0 20px', fontSize: 17, letterSpacing: '-0.015em' }}>전체 순위 · 조회수 기준</h3>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {all.map((p, i) => {
                  const tone = catTone(p.category);
                  return (
                    <Link
                      key={p.id}
                      href={`/blog/${p.slug}`}
                      style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 18, padding: '16px 0', borderTop: '1px solid var(--line-1)', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
                    >
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 14, color: i < 3 ? 'var(--acc-blue)' : 'var(--text-4)', fontWeight: i < 3 ? 600 : 400, fontVariantNumeric: 'tabular-nums' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          <span className={`badge badge-${tone}`}>{p.category}</span>
                        </div>
                        <div style={{ fontSize: 14.5, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{p.title}</div>
                      </div>
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                        {p.views.toLocaleString()}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

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
                          <p className="widget-item-meta" style={{ marginBottom: 4 }}>{c.cat}</p>
                          <Link href={`/blog/${c.post.slug}`} className="widget-item-title" style={{ color: 'var(--text-1)', textDecoration: 'none', fontSize: 13 }}>
                            {c.post.title}
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="ai-widget">
                <span className="ai-tag">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  가장 빠르게 떠오르는 주제
                </span>
                <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[['MCP', '+312%'], ['Postgres 17', '+148%'], ['Cursor', '+96%'], ['Edge AI', '+74%']].map(([t, pct]) => (
                    <li key={t} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span>{t}</span>
                      <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--acc-mint)' }}>{pct}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
