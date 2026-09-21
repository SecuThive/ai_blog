import Link from '@/i18n/link';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import { readingTime, makeFreshClient } from '@/lib/supabase';
import { catTone } from '@/lib/utils';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary, interpolate, type Messages } from '@/i18n/messages';
import { pageMetadata } from '@/i18n/metadata';
import { categoryLabel } from '@/i18n/categories';
import { titleForLocale, excerptForLocale } from '@/i18n/content';
import { formatTimeAgo } from '@/i18n/format';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: '/recommend',
    title: dict.pages.recommendTitle,
    description: dict.pages.recommendLead,
  });
}

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
  content_evidence?: unknown;
}

function risingScore(p: PostRow): number {
  const days = Math.max((Date.now() - new Date(p.published_at).getTime()) / 86_400_000, 1);
  return p.views / days;
}

function fmtViews(n: number, locale: Locale): string {
  if (locale === 'en') {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toLocaleString('en-US');
  }
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString('ko-KR');
}

async function getPosts(): Promise<PostRow[]> {
  noStore();
  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,excerpt,category,tags,published_at,views,content,content_evidence')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  return (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as number,
    title: p.title as string,
    slug: p.slug as string,
    excerpt: p.excerpt as string,
    category: p.category as string,
    tags: (p.tags as string[]) ?? [],
    published_at: p.published_at as string,
    views: (p.views as number) ?? 0,
    reading_time: readingTime((p.content as string) ?? ''),
    content_evidence: p.content_evidence,
  }));
}

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

export default async function RecommendPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  const posts = await getPosts();

  if (posts.length === 0) {
    return (
      <div className="err">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>AI RECOMMEND</div>
          <p style={{ color: 'var(--text-3)' }}>{dict.pages.recommendEmpty}</p>
          <Link href="/" className="btn btn-ghost" style={{ marginTop: 16 }}>{dict.common.backHome}</Link>
        </div>
      </div>
    );
  }

  const totalViews = posts.reduce((s, p) => s + p.views, 0);
  const avgReading = Math.round(posts.reduce((s, p) => s + p.reading_time, 0) / posts.length);
  const catCount = new Map<string, number>();
  for (const p of posts) catCount.set(p.category, (catCount.get(p.category) ?? 0) + 1);
  const topCats = Array.from(catCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const total = posts.length;

  const rising = [...posts].sort((a, b) => risingScore(b) - risingScore(a)).slice(0, 4);
  const byViews = [...posts].sort((a, b) => b.views - a.views).slice(0, 4);
  const byRecent = posts.slice(0, 4);
  const catBest = new Map<string, PostRow>();
  for (const p of posts) {
    const prev = catBest.get(p.category);
    if (!prev || p.views > prev.views) catBest.set(p.category, p);
  }
  const byCat = Array.from(catBest.values()).sort((a, b) => b.views - a.views).slice(0, 4);
  const byDepth = [...posts]
    .filter((p) => p.reading_time >= 5 && p.reading_time <= 20)
    .sort((a, b) => risingScore(b) - risingScore(a))
    .slice(0, 4);
  const byDepthFinal = byDepth.length >= 2
    ? byDepth
    : [...posts].sort((a, b) => b.reading_time - a.reading_time).slice(0, 4);

  const starIcon = (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  );

  const perDay = dict.pages.recommendPerDay;
  const viewsLabel = dict.pages.recommendViews;

  const locTitle = (p: PostRow) => titleForLocale(locale, p.title, { tags: p.tags, content_evidence: p.content_evidence });
  const locExcerpt = (p: PostRow) => excerptForLocale(locale, p.excerpt, { tags: p.tags, content_evidence: p.content_evidence });

  type Group = {
    id: string;
    title: string;
    sub: string;
    posts: PostRow[];
    renderCard: (p: PostRow, i: number) => React.ReactNode;
  };

  const groups: Group[] = [
    {
      id: 'rising',
      title: dict.pages.recommendRising,
      sub: dict.pages.recommendRisingSub,
      posts: rising,
      renderCard: (p) => (
        <>
          <GroupLabel
            icon={starIcon}
            label={dict.pages.recommendRisingBadge}
            score={`↑ ${risingScore(p).toFixed(1)}${perDay}`}
            scoreColor="var(--acc-mint)"
          />
          <h3 style={{ margin: '0 0 8px', fontSize: 15.5, lineHeight: 1.35, letterSpacing: '-0.01em' }}>{locTitle(p)}</h3>
          <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, lineHeight: 1.55 }}>{locExcerpt(p)}</p>
          <div className="card-foot">
            <span>{fmtViews(p.views, locale)}</span>
            <span className="dot" />
            <span>{formatTimeAgo(p.published_at, locale, dict)}</span>
          </div>
        </>
      ),
    },
    {
      id: 'views',
      title: dict.pages.recommendPopular,
      sub: dict.pages.recommendPopularSub,
      posts: byViews,
      renderCard: (p, i) => (
        <>
          <GroupLabel
            icon={starIcon}
            label={`# ${i + 1} · ${dict.pages.recommendPopularBadge}`}
            score={`${fmtViews(p.views, locale)} ${viewsLabel}`}
          />
          <h3 style={{ margin: '0 0 8px', fontSize: 15.5, lineHeight: 1.35, letterSpacing: '-0.01em' }}>{locTitle(p)}</h3>
          <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, lineHeight: 1.55 }}>{locExcerpt(p)}</p>
          <div className="card-foot">
            <span>{interpolate(dict.common.minRead, { min: p.reading_time })}</span>
            <span className="dot" />
            <span>{formatTimeAgo(p.published_at, locale, dict)}</span>
          </div>
        </>
      ),
    },
    {
      id: 'recent',
      title: dict.pages.recommendRecent,
      sub: dict.pages.recommendRecentSub,
      posts: byRecent,
      renderCard: (p) => (
        <>
          <GroupLabel icon={starIcon} label={dict.pages.recommendRecentBadge} score={formatTimeAgo(p.published_at, locale, dict)} />
          <h3 style={{ margin: '0 0 8px', fontSize: 15.5, lineHeight: 1.35, letterSpacing: '-0.01em' }}>{locTitle(p)}</h3>
          <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, lineHeight: 1.55 }}>{locExcerpt(p)}</p>
          <div className="card-foot">
            <span>{interpolate(dict.common.minRead, { min: p.reading_time })}</span>
            <span className="dot" />
            <span className={`badge badge-${catTone(p.category)}`}>{categoryLabel(p.category, locale)}</span>
          </div>
        </>
      ),
    },
    {
      id: 'cat',
      title: dict.pages.recommendByCat,
      sub: dict.pages.recommendByCatSub,
      posts: byCat,
      renderCard: (p) => (
        <>
          <GroupLabel
            icon={starIcon}
            label={dict.pages.recommendByCatBadge}
            score={`${fmtViews(p.views, locale)} ${viewsLabel}`}
          />
          <h3 style={{ margin: '0 0 8px', fontSize: 15.5, lineHeight: 1.35, letterSpacing: '-0.01em' }}>{locTitle(p)}</h3>
          <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, lineHeight: 1.55 }}>{locExcerpt(p)}</p>
          <div className="card-foot">
            <span className={`badge badge-${catTone(p.category)}`}>{categoryLabel(p.category, locale)}</span>
            <span className="dot" />
            <span>{interpolate(dict.common.minRead, { min: p.reading_time })}</span>
          </div>
        </>
      ),
    },
    {
      id: 'depth',
      title: dict.pages.recommendDepth,
      sub: dict.pages.recommendDepthSub,
      posts: byDepthFinal,
      renderCard: (p) => (
        <>
          <GroupLabel
            icon={starIcon}
            label={interpolate(dict.common.minRead, { min: p.reading_time })}
            score={`↑ ${risingScore(p).toFixed(1)}${perDay}`}
            scoreColor="var(--acc-mint)"
          />
          <h3 style={{ margin: '0 0 8px', fontSize: 15.5, lineHeight: 1.35, letterSpacing: '-0.01em' }}>{locTitle(p)}</h3>
          <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, lineHeight: 1.55 }}>{locExcerpt(p)}</p>
          <div className="card-foot">
            <span className={`badge badge-${catTone(p.category)}`}>{categoryLabel(p.category, locale)}</span>
            <span className="dot" />
            <span>{fmtViews(p.views, locale)} {viewsLabel}</span>
          </div>
        </>
      ),
    },
  ];

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">AI RECOMMEND</div>
          <h1 className="page-title">{dict.pages.recommendTitle}</h1>
          <p className="page-lead">{dict.pages.recommendLead}</p>

          <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>{total}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>{dict.pages.recommendStatPosts}</div>
            </div>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>{fmtViews(totalViews, locale)}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>{dict.pages.recommendStatViews}</div>
            </div>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>{avgReading}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>{dict.pages.recommendStatRead}</div>
            </div>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {topCats.map(([cat, cnt]) => (
                  <span key={cat} className={`badge badge-${catTone(cat)}`} style={{ fontSize: 10.5 }}>
                    {categoryLabel(cat, locale)} · {Math.round((cnt / total) * 100)}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
          {groups.map((g) => (
            <div key={g.id}>
              <div className="sec-head2" style={{ marginBottom: 20 }}>
                <div className="left">
                  <span className="num" style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)', letterSpacing: '0.08em', padding: '4px 8px', border: '1px solid var(--line-2)', borderRadius: 4 }}>
                    AI · PICK
                  </span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{g.title}</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>{g.sub}</p>
                  </div>
                </div>
              </div>
              <div className="grid-2">
                {g.posts.map((p, i) => (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="card card-link" style={{ padding: 22 }}>
                    {g.renderCard(p, i)}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
