import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '아카이브 — Nodelog',
  description: '시간 순서로 정리된 전체 글.',
};

export const revalidate = 60;

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
  category: string;
  published_at: string;
}

type MonthMap = Map<string, PostRow[]>;
type YearMap = Map<string, MonthMap>;

async function getAllPosts(): Promise<PostRow[]> {
  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,category,published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  return (data ?? []) as PostRow[];
}

function groupByYearMonth(posts: PostRow[]): YearMap {
  const map: YearMap = new Map();
  for (const p of posts) {
    const d = new Date(p.published_at);
    const year = String(d.getFullYear());
    const month = String(d.getMonth() + 1).padStart(2, '0');
    if (!map.has(year)) map.set(year, new Map());
    const monthMap = map.get(year)!;
    if (!monthMap.has(month)) monthMap.set(month, []);
    monthMap.get(month)!.push(p);
  }
  return map;
}

export default async function ArchivePage() {
  const posts = await getAllPosts();
  const grouped = groupByYearMonth(posts);

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">ARCHIVE · 시간 축</div>
          <h1 className="page-title">아카이브</h1>
          <p className="page-lead">시간 순서로 정리된 전체 글. 연도·월 단위로 탐색하세요.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {Array.from(grouped.entries()).map(([year, months]) => {
            const total = Array.from(months.values()).flat().length;
            return (
              <div key={year} style={{ marginBottom: 64 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 28, paddingBottom: 16, borderBottom: '1px solid var(--line-1)' }}>
                  <h2 style={{ margin: 0, fontSize: 40, letterSpacing: '-0.03em', fontWeight: 600 }}>{year}</h2>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)', letterSpacing: '0.08em' }}>{total} POSTS</span>
                </div>
                {Array.from(months.entries()).map(([month, monthPosts]) => (
                  <div key={month} style={{ marginBottom: 36 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 32, alignItems: 'start' }}>
                      <div style={{ position: 'sticky', top: 'calc(var(--header-h) + 32px)' }}>
                        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{month}월</div>
                        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.08em', marginTop: 4 }}>{monthPosts.length} POSTS</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {monthPosts.map((p, i) => {
                          const d = new Date(p.published_at);
                          const tone = catTone(p.category);
                          return (
                            <Link
                              key={p.id}
                              href={`/blog/${p.slug}`}
                              style={{ display: 'grid', gridTemplateColumns: '50px 120px 1fr', gap: 20, padding: '16px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line-1)', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
                            >
                              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums' }}>
                                {String(d.getMonth() + 1).padStart(2, '0')}.{String(d.getDate()).padStart(2, '0')}
                              </span>
                              <span className={`badge badge-${tone}`} style={{ width: 'fit-content' }}>{p.category}</span>
                              <span style={{ fontSize: 14.5, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{p.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          {posts.length === 0 && (
            <div className="card" style={{ padding: 56, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)' }}>아직 발행된 글이 없습니다.</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
