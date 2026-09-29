import type { Metadata } from 'next';
import { makeFreshClient } from '@/lib/supabase';
import ArchiveLoadMore from '@/components/ArchiveLoadMore';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/messages';
import { pageMetadata } from '@/i18n/metadata';

// egress 절감: 예전엔 noStore()로 매 요청 DB를 조회했다. 경로가 ASCII라 ISR이 정상 동작하므로
// 시간 기반 재생성으로 전환한다. 조회 에러는 throw → ISR이 빈 페이지를 캐시하지 않고 직전 정상본 유지.
export const revalidate = 1800;

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
  const { data, error } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,category,published_at,tags,content_evidence')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw new Error(`archive fetch failed: ${error.code ?? ''} ${error.message}`);
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
