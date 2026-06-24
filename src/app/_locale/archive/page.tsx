import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import { makeFreshClient } from '@/lib/supabase';
import ArchiveLoadMore from '@/components/ArchiveLoadMore';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export const metadata: Metadata = {
  title: '아카이브 — Nodelog',
  description: '시간 순서로 정리된 전체 글.',
  alternates: { canonical: `${SITE_URL}/archive` },
  openGraph: {
    title: '아카이브 — Nodelog',
    description: '시간 순서로 정리된 전체 글.',
    url: `${SITE_URL}/archive`,
    type: 'website',
  },
};

export const revalidate = 60;

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
  noStore();
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

  // 직렬화 가능한 형태로 변환
  const groupedArr = Array.from(grouped.entries()).map(([year, months]) => ({
    year,
    months: Array.from(months.entries()).map(([month, monthPosts]) => ({
      month,
      posts: monthPosts,
    })),
  }));

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">ARCHIVE · 시간 축</div>
          <h1 className="page-title">아카이브</h1>
          <p className="page-lead">시간 순서로 정리된 전체 글. 연도·월 단위로 탐색하세요.</p>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)', letterSpacing: '0.08em', marginTop: 16 }}>
            {posts.length} POSTS TOTAL
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {posts.length === 0 ? (
            <div className="card" style={{ padding: 56, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)' }}>아직 발행된 글이 없습니다.</div>
            </div>
          ) : (
            <ArchiveLoadMore grouped={groupedArr} />
          )}
        </div>
      </section>
    </div>
  );
}
