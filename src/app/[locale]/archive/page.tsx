import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import { makeFreshClient } from '@/lib/supabase';
import ArchiveLoadMore from '@/components/ArchiveLoadMore';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/messages';
import { pageMetadata } from '@/i18n/metadata';

export const revalidate = 60;

interface PostRow {
  id: number;
  title: string;
  slug: string;
  category: string;
  published_at: string;
  tags?: string[] | null;
  content_evidence?: unknown;
}

type MonthMap = Map<string, PostRow[]>;
type YearMap = Map<string, MonthMap>;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: '/archive',
    title: dict.pages.archiveTitle,
    description: dict.pages.archiveLead,
  });
}

async function getAllPosts(): Promise<PostRow[]> {
  noStore();
  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,category,published_at,tags,content_evidence')
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

export default async function ArchivePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  const posts = await getAllPosts();
  const grouped = groupByYearMonth(posts);

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
          <div className="page-eyebrow">ARCHIVE</div>
          <h1 className="page-title">{dict.pages.archiveTitle}</h1>
          <p className="page-lead">{dict.pages.archiveLead}</p>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)', letterSpacing: '0.08em', marginTop: 16 }}>
            {posts.length} POSTS TOTAL
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {posts.length === 0 ? (
            <div className="card" style={{ padding: 56, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)' }}>{dict.common.noContent}</div>
            </div>
          ) : (
            <ArchiveLoadMore grouped={groupedArr} />
          )}
        </div>
      </section>
    </div>
  );
}
