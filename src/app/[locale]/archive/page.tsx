import type { Metadata } from 'next';
import { makeFreshClient } from '@/lib/supabase';
import ArchiveLoadMore from '@/components/ArchiveLoadMore';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/messages';
import { pageMetadata } from '@/i18n/metadata';
import { titleForLocale } from '@/i18n/content';
import type { Locale } from '@/i18n/config';

// egress 절감: 예전엔 noStore()로 매 요청 DB를 조회했다. 경로가 ASCII라 ISR이 정상 동작하므로
// 시간 기반 재생성으로 전환한다. 조회 에러는 throw → ISR이 빈 페이지를 캐시하지 않고 직전 정상본 유지.
export const revalidate = 1800;

interface PostRow {
  id: number;
  title: string;
  slug: string;
  category: string;
  published_at: string;
}

interface PostQueryRow extends PostRow {
  tags?: string[] | null;
  en_title?: string | null;
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

// 2026-10: 예전엔 content_evidence 전체(영문 본문 포함)를 클라이언트 컴포넌트 props로 넘겨 HTML이
// 약 5.6MB였다. 제목만 서버에서 언어별로 계산해 목록에 필요한 5개 필드만 넘긴다.
async function getAllPosts(locale: Locale): Promise<PostRow[]> {
  const { data, error } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,category,published_at,tags,en_title:content_evidence->en->>title')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw new Error(`archive fetch failed: ${error.code ?? ''} ${error.message}`);
  return ((data ?? []) as unknown as PostQueryRow[]).map((p) => ({
    id: p.id,
    slug: p.slug,
    category: p.category,
    published_at: p.published_at,
    title: titleForLocale(locale, p.title, {
      tags: p.tags,
      content_evidence: p.en_title ? { en: { title: p.en_title } } : null,
    }),
  }));
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
  const posts = await getAllPosts(locale);
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
