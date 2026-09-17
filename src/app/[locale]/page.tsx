import Link from '@/i18n/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { readingTime, makeFreshClient } from '@/lib/supabase';
import { catTone, toneForSeries, engCatTone } from '@/lib/utils';
import type { PostSummary, EngineerGuide } from '@/lib/types';
import {
  MagLatestSection,
  HomeScrollReveal,
  type MagPost,
} from '@/components/HomeClient';
import SubscribeForm from '@/components/SubscribeForm';
import PostThumb from '@/components/PostThumb';
import TrackedLink from '@/components/TrackedLink';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary, interpolate, type Messages } from '@/i18n/messages';
import { pageMetadata } from '@/i18n/metadata';
import { localizePost, localizeGuide } from '@/i18n/content';
import { categoryLabel, engineerCatLabel } from '@/i18n/categories';
import { formatTimeAgo } from '@/i18n/format';

// 홈은 DB 쿼리 6개를 병렬로 조합하므로 매분 콜드 재생성하면 최초 응답이 길어진다.
// 발행 웹훅이 목록·sitemap을 별도로 무효화하므로 5분 캐시로 최신 글 반영과 응답 안정성을
// 함께 확보한다.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: '/', title: dict.meta.siteName, description: dict.meta.siteDesc });
}

interface SeriesInfo {
  name: string;
  count: number;
  latestDate: string;
  tone: string;
}

async function getSeries(): Promise<SeriesInfo[]> {
  const { data } = await makeFreshClient()
    .from('posts')
    .select('tags,published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const map = new Map<string, { count: number; latestDate: string }>();
  for (const p of (data ?? [])) {
    const tags: string[] = p.tags ?? [];
    const seriesTag = tags.find((t: string) => t.startsWith('series:'));
    if (!seriesTag) continue;
    const seriesName = seriesTag.replace('series:', '');
    if (!map.has(seriesName)) {
      map.set(seriesName, { count: 0, latestDate: p.published_at ?? '' });
    }
    map.get(seriesName)!.count++;
  }

  return Array.from(map.entries())
    .map(([name, v]) => ({ name, ...v, tone: toneForSeries(name) }))
    .sort((a, b) => b.count - a.count);
}

async function getGuideCount(): Promise<number> {
  const { count } = await makeFreshClient()
    .from('engineer_guides')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');
  return count ?? 0;
}

async function getSubscriberCount(): Promise<number> {
  const { count } = await makeFreshClient()
    .from('subscribers')
    .select('id', { count: 'exact', head: true });
  return count ?? 0;
}

async function getPosts(locale: Locale): Promise<PostSummary[]> {
  const client = makeFreshClient();
  const base = 'id,title,slug,excerpt,cover_image,category,tags,author,agent_role,views,published_at,content';
  const withEn = await client
    .from('posts')
    .select(`${base},title_en,excerpt_en`)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20);
  const rows = (withEn.error
    ? (await client.from('posts').select(base).eq('status', 'published').order('published_at', { ascending: false }).limit(20)).data
    : withEn.data) ?? [];

  return (rows as Record<string, unknown>[]).map((p) => {
    const localized = localizePost({
      title: String(p.title ?? ''),
      excerpt: String(p.excerpt ?? ''),
      content: String(p.content ?? ''),
      title_en: (p.title_en as string | null) ?? null,
      excerpt_en: (p.excerpt_en as string | null) ?? null,
    }, locale);
    return {
      ...p,
      title: localized.title,
      excerpt: localized.excerpt,
      content: undefined,
      reading_time: readingTime((p.content as string) ?? ''),
    };
  }) as unknown as PostSummary[];
}

/* ===== Arrow icon ===== */
function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

/* ===== Hero v2 ===== */
function HeroV2({ posts, seriesCount, guideCount, subscriberCount, dict }: {
  posts: PostSummary[];
  seriesCount: number;
  guideCount: number;
  subscriberCount: number;
  dict: Messages;
}) {
  // 허영 지표(누적 발행 수·조회수·미달 구독자)는 노출하지 않는다 — 자동생성 인상 완화(#8).
  // 대신 실질 신호(시리즈·큐레이션 가이드·검토 방식)만 남긴다.
  const stats = [
    { num: String(seriesCount), sub: 'ACTIVE SERIES' },
    { num: `${guideCount}+`, sub: 'ENGINEER GUIDES' },
    { badge: true, sub: 'REVIEWED · UPDATED' },
    // 구독자는 유의미해지기 전까지 숨김(미완성 지표처럼 보이는 '—' 제거)
    ...(subscriberCount >= 50
      ? [{ num: subscriberCount >= 1000 ? `${(subscriberCount / 1000).toFixed(1)}K` : String(subscriberCount), sub: 'SUBSCRIBERS' }]
      : []),
  ];
  return (
    <section className="heroX">
      <div className="container">
        <div className="heroX-grid heroX-grid--solo">
          <div>
            <span className="hero-status">
              <span className="live-dot" />
              <span>REVIEWED · CURATED · UPDATED</span>
            </span>
            <h1>
              <span className="grad">{dict.home.heroLine1}</span>
              <br />
              {dict.home.heroLine2}
            </h1>
            <p className="heroX-lead">
              {dict.home.heroLead}
            </p>
            <div className="heroX-actions">
              {posts[0] && (
                <Link href={`/blog/${posts[0].slug}`} className="btn btn-primary btn-lg">
                  {dict.home.latestPost} <ArrowIcon />
                </Link>
              )}
              <Link href="/engineer" className="btn btn-lg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                </svg>
                {dict.home.engineerGuides}
              </Link>
              <Link href="/about" className="btn btn-lg btn-ghost">
                {dict.home.howWeWork}
              </Link>
            </div>
            <div className="heroX-meta" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
              {stats.map((s, i) => (
                <div key={i}>
                  {s.badge ? (
                    <div style={{ marginBottom: 6 }}>
                      <span className="ai-tag" style={{ fontSize: 11 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
                        </svg>
                        CHECK
                      </span>
                    </div>
                  ) : (
                    <div className="stat-num">{s.num}</div>
                  )}
                  <div className="stat-sub">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== Daily Briefing ===== */
function DailyBriefing({ posts, locale, dict }: { posts: PostSummary[]; locale: Locale; dict: Messages }) {
  const lead = posts[0];
  const sub = posts.slice(1, 3);
  const quick = posts.slice(3, 7);

  if (!lead) return null;

  const leadTone = catTone(lead.category);

  return (
    <section className="section">
      <div className="container">
        <div className="sec-head2">
          <div className="left">
            <span className="num">01 / BRIEFING</span>
            <div>
              <h2>{dict.home.briefingTitle}</h2>
              <p className="sub">{dict.home.briefingSub}</p>
            </div>
          </div>
          <Link href="/" className="section-link">
            {dict.home.allPosts} <ArrowIcon size={14} />
          </Link>
        </div>

        <div className="brief-wrap">
          <Link className="brief-main" href={`/blog/${lead.slug}`}>
            <PostThumb slug={lead.slug} title={lead.title} coverImage={lead.cover_image} category={lead.category} className="ph card-thumb" priority />
            <div className="brief-main-body">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 0 }}>
                <span className={`badge badge-${leadTone}`}>{categoryLabel(lead.category, locale)}</span>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.04em' }}>
                  {formatTimeAgo(lead.published_at, locale, dict)} · {interpolate(dict.home.minRead, { min: lead.reading_time })}
                </span>
              </div>
              <h3>{lead.title}</h3>
              <p>{lead.excerpt}</p>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.04em', display: 'flex', gap: 8 }}>
                <span>REVIEWED · UPDATED</span>
              </div>
            </div>
          </Link>

          <div className="brief-side">
            {sub.map((p, i) => (
              <Link key={p.id} className="brief-card" href={`/blog/${p.slug}`}>
                <div className="num">02.{i + 1} · {p.category.toUpperCase()}</div>
                <h4>{p.title}</h4>
                <p>{p.excerpt}</p>
              </Link>
            ))}
            {quick.length > 0 && (
              <div className="brief-quick">
                <h6>{dict.home.quickReads}</h6>
                <ul>
                  {quick.map((p, i) => (
                    <li key={p.id}>
                      <span className="t">{String(i + 1).padStart(2, '0')}</span>
                      <Link className="l" href={`/blog/${p.slug}`} style={{ color: 'var(--text-2)' }}>
                        {p.title.length > 36 ? p.title.slice(0, 36) + '…' : p.title}
                      </Link>
                      <span className="r">{interpolate(dict.home.minShort, { min: p.reading_time })}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== Reading Lanes ===== */
const LANE_DEFS = [
  {
    tag: 'DEV', titleKey: 'laneDev' as const, subKey: 'laneDevSub' as const, category: '개발',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    tag: 'AI', titleKey: 'laneAi' as const, subKey: 'laneAiSub' as const, category: 'AI & 자동화',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
        <path d="M5 3l.5 1.5L7 5l-1.5.5L5 7l-.5-1.5L3 5l1.5-.5z" />
      </svg>
    ),
  },
  {
    tag: 'SEC', titleKey: 'laneSec' as const, subKey: 'laneSecSub' as const, category: '보안',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    tag: 'PRO', titleKey: 'lanePro' as const, subKey: 'laneProSub' as const, category: 'IT 트렌드',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L8.5 9H1l6 5.5L4.5 22 12 17l7.5 5-2.5-7.5L23 9h-7.5z" />
      </svg>
    ),
  },
];

function ReadingLanes({ lanePosts, locale, dict }: { lanePosts: Record<string, PostSummary[]>; locale: Locale; dict: Messages }) {
  return (
    <section className="section">
      <div className="container">
        <div className="sec-head2">
          <div className="left">
            <span className="num">03 / READING LANES</span>
            <div>
              <h2>{dict.home.lanesTitle}</h2>
              <p className="sub">
                {dict.home.lanesSub}
              </p>
            </div>
          </div>
          <Link href="/curated" className="section-link">
            {dict.home.allCollections} <ArrowIcon size={14} />
          </Link>
        </div>

        <div className="lanes">
          {LANE_DEFS.map((lane, i) => {
            const items = lanePosts[lane.category] ?? [];
            return (
              <div key={i} className="lane">
                <div className="lane-head">
                  <div>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--text-4)', letterSpacing: '0.10em', marginBottom: 6 }}>
                      LANE · {lane.tag}
                    </div>
                    <h4>{dict.home[lane.titleKey]}</h4>
                  </div>
                  <span className="ic">{lane.icon}</span>
                </div>
                <p className="lane-sub">{dict.home[lane.subKey]}</p>
                <div className="lane-steps">
                  {items.length > 0 ? items.map((p, j) => (
                    <Link key={p.id} className="lane-step" href={`/blog/${p.slug}`}>
                      <span className="num">{String(j + 1).padStart(2, '0')}</span>
                      <div>
                        <p className="t">{p.title}</p>
                        <p className="m">{interpolate(dict.home.minRead, { min: p.reading_time })}</p>
                      </div>
                    </Link>
                  )) : (
                    <TrackedLink
                      className="lane-step"
                      href={`/category/${lane.category}`}
                      event={{ name: 'category_click', path: '/', category: lane.category, position: `lane-empty-${lane.tag}` }}
                    >
                      <span className="num">→</span>
                      <div>
                        <p className="t">{interpolate(dict.home.viewCategory, { cat: categoryLabel(lane.category, locale) })}</p>
                        <p className="m">{dict.home.categoryAll}</p>
                      </div>
                    </TrackedLink>
                  )}
                </div>
                <div className="lane-foot">
                  <span>{items.length} STEPS</span>
                  <TrackedLink
                    href={`/category/${lane.category}`}
                    event={{ name: 'category_click', path: '/', category: lane.category, position: `lane-footer-${lane.tag}` }}
                  >
                    {dict.home.viewAll}
                  </TrackedLink>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* MagLatest — client 컴포넌트로 이전 (HomeClient.tsx MagLatestSection 사용) */

/* ===== Editor's Quote ===== */
function EditorQuote({ dict }: { dict: Messages }) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`;
  return (
    <section className="section">
      <div className="container">
        <div className="editor-quote">
          <div>
            <div className="q-mark">&ldquo;</div>
            <div className="section-eyebrow" style={{ marginBottom: 14, marginTop: 8 }}>EDITORIAL NOTE</div>
          </div>
          <div>
            <blockquote>
              {dict.home.quote}
            </blockquote>
            <div className="att">
              <span className="pip">N</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.005em' }}>{dict.home.editorTeam}</div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.06em', marginTop: 2 }}>
                  TECH EDITORIAL · {yearMonth}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== Series Showcase ===== */
function SeriesShowcase({ series, dict }: { series: SeriesInfo[]; dict: Messages }) {
  const featuredSeries = series.slice(0, 3);
  return (
    <section className="section" style={{ background: 'linear-gradient(180deg, transparent, rgba(20,24,36,0.4) 30%, transparent)' }}>
      <div className="container">
        <div className="sec-head2">
          <div className="left">
            <span className="num">05 / SERIES</span>
            <div>
              <h2>{dict.home.seriesTitle}</h2>
              <p className="sub">{dict.home.seriesSub}</p>
            </div>
          </div>
          <Link href="/series" className="section-link">
            {dict.home.allSeries} <ArrowIcon size={14} />
          </Link>
        </div>
        {featuredSeries.length === 0 ? (
          <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '40px 0' }}>
            {dict.home.seriesEmpty}
          </p>
        ) : (
          <div className="grid-3">
            {featuredSeries.map((s) => (
              <Link key={s.name} href={`/series/${encodeURIComponent(s.name)}`} className="card card-link">
                <div className={`card-thumb thumb-${s.tone}`} style={{ aspectRatio: '16/7' }}>
                  {s.name}
                </div>
                <div className="card-body">
                  <div className="card-meta">
                    <span className={`badge badge-${s.tone}`}>SERIES</span>
                    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)' }}>
                      {interpolate(dict.home.postsCount, { count: s.count })}
                    </span>
                  </div>
                  <h3 className="card-title">{s.name}</h3>
                  <p className="card-excerpt">
                    {interpolate(dict.home.seriesCardLead, { count: s.count })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ===== Newsletter Band ===== */
function NewsletterBand({ subscriberCount, dict }: { subscriberCount: number; dict: Messages }) {
  const countLabel = subscriberCount >= 1000 ? `${(subscriberCount / 1000).toFixed(1)}K` : String(subscriberCount);
  const subLabel = subscriberCount > 0
    ? interpolate(dict.home.subscribersNow, { count: countLabel })
    : dict.home.subscribeNow;
  return (
    <section className="section">
      <div className="container">
        <div className="subscribe">
          <div>
            <div className="section-eyebrow" style={{ marginBottom: 14 }}>{dict.home.newsletterEyebrow}</div>
            <h3>{dict.home.newsletterTitle}</h3>
            <p>{interpolate(dict.home.newsletterLead, { sub: subLabel })}</p>
          </div>
          <div>
            <SubscribeForm compact />
            <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-4)', fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em' }}>
              {dict.home.newsletterFine}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// 리딩 레인은 카테고리별 최신 3편을 각각 조회한다. 홈 상단 "최근 20편"만
// 슬라이스하면 최근 발행이 특정 카테고리(인프라·개발 등)에 몰릴 때 AI·PRO
// 레인이 비므로, 레인별 카테고리 쿼리로 항상 채운다.
async function getLanePosts(locale: Locale): Promise<Record<string, PostSummary[]>> {
  const client = makeFreshClient();
  const entries = await Promise.all(
    LANE_DEFS.map(async (lane) => {
      const withEn = await client
        .from('posts')
        .select('id,title,slug,category,content,published_at,tags,title_en')
        .eq('status', 'published')
        .eq('category', lane.category)
        .order('published_at', { ascending: false })
        .limit(3);
      const data = (withEn.error
        ? (await client.from('posts').select('id,title,slug,category,content,published_at,tags').eq('status', 'published').eq('category', lane.category).order('published_at', { ascending: false }).limit(3)).data
        : withEn.data) ?? [];
      const items = (data as Record<string, unknown>[]).map((p) => {
        const localized = localizePost({
          title: String(p.title ?? ''),
          title_en: (p.title_en as string | null) ?? null,
        }, locale);
        return {
          ...p,
          title: localized.title,
          content: undefined,
          reading_time: readingTime((p.content as string) ?? ''),
        };
      }) as unknown as PostSummary[];
      return [lane.category, items] as const;
    }),
  );
  return Object.fromEntries(entries);
}

async function getRecentGuides(locale: Locale): Promise<EngineerGuide[]> {
  const client = makeFreshClient();
  const withEn = await client
    .from('engineer_guides')
    .select('id,title,slug,summary,category,difficulty,views,created_at,tags,title_en,summary_en')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(6);
  const data = (withEn.error
    ? (await client.from('engineer_guides').select('id,title,slug,summary,category,difficulty,views,created_at,tags').eq('status', 'published').order('created_at', { ascending: false }).limit(6)).data
    : withEn.data) ?? [];
  return (data as EngineerGuide[]).map((g) => localizeGuide(g, locale));
}

function EngineerGuidesSection({ guides, total, locale, dict }: { guides: EngineerGuide[]; total: number; locale: Locale; dict: Messages }) {
  if (guides.length === 0) return null;
  return (
    <section className="section" style={{ background: 'linear-gradient(180deg, transparent, rgba(20,36,24,0.3) 30%, transparent)' }}>
      <div className="container">
        <div className="sec-head2">
          <div className="left">
            <span className="num">02 / ENGINEER GUIDE</span>
            <div>
              <h2>{dict.home.guidesTitle}</h2>
              <p className="sub">{interpolate(dict.home.guidesSub, { total })}</p>
            </div>
          </div>
          <Link href="/engineer" className="section-link">
            {dict.home.allGuides} <ArrowIcon size={14} />
          </Link>
        </div>
        <div className="grid-3" style={{ gap: 12 }}>
          {guides.map(g => {
            const tone = engCatTone(g.category);
            const diff = dict.difficulty[g.difficulty] ?? g.difficulty;
            return (
              <Link key={g.id} href={`/engineer/${g.slug}`} className="card card-link" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge badge-${tone}`} style={{ fontSize: 10.5 }}>{engineerCatLabel(g.category, locale)}</span>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--text-4)', letterSpacing: '0.04em' }}>{diff}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: 15, lineHeight: 1.38, letterSpacing: '-0.012em' }}>{g.title}</h3>
                <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 12.5, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{g.summary}</p>
                <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px dashed var(--line-1)', fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                  {dict.home.viewGuide}
                </div>
              </Link>
            );
          })}
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['Linux / Shell', 'Docker / 컨테이너', 'Git / CI·CD', '네트워킹 / 서버', '보안 설정', '데이터베이스'].map(cat => (
            <TrackedLink
              key={cat}
              href={`/engineer?cat=${encodeURIComponent(cat)}`}
              event={{ name: 'category_click', path: '/', category: cat, position: 'engineer-guides-chip' }}
              style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', border: '1px solid var(--line-1)', borderRadius: 4, padding: '4px 10px', letterSpacing: '0.04em', textDecoration: 'none' }}
            >
              {engineerCatLabel(cat, locale)}
            </TrackedLink>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== Page ===== */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = getDictionary(locale);
  const [posts, guideCount, series, subscriberCount, recentGuides, lanePosts] = await Promise.all([
    getPosts(locale),
    getGuideCount(),
    getSeries(),
    getSubscriberCount(),
    getRecentGuides(locale),
    getLanePosts(locale),
  ]);

  // "ACTIVE SERIES"는 실제로 탐색 가능한 시리즈만 센다 — 1편짜리 얇은 시리즈는
  // series/[id]가 noindex이고 sitemap에서도 제외되므로(2편 이상) 동일 기준(>=2)을 적용.
  const activeSeriesCount = series.filter(s => s.count >= 2).length;

  if (posts.length === 0) {
    return (
      <div className="container" style={{ paddingTop: 80, paddingBottom: 80, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.16em', color: 'var(--text-3)', marginBottom: 24, textTransform: 'uppercase' }}>
          NODELOG · PRACTICAL IT MEDIA
        </div>
        <h1 style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 600, letterSpacing: '-.035em', marginBottom: 20 }}>
          {dict.home.emptyTitle}
        </h1>
        <p style={{ fontSize: 17, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
          {dict.home.emptyLead}
        </p>
      </div>
    );
  }

  return (
    <HomeScrollReveal>
      <HeroV2 posts={posts} seriesCount={activeSeriesCount} guideCount={guideCount} subscriberCount={subscriberCount} dict={dict} />
      <DailyBriefing posts={posts} locale={locale} dict={dict} />
      <EngineerGuidesSection guides={recentGuides} total={guideCount} locale={locale} dict={dict} />
      <ReadingLanes lanePosts={lanePosts} locale={locale} dict={dict} />
      {/* DailyBriefing이 이미 posts[0..6](리드+서브+퀵리즈)을 노출했으므로, "최신 글" 섹션은
          그 뒤를 이어 posts[7..]부터 보여준다 — 같은 글이 두 섹션에 중복 노출되는 것을 방지. */}
      <MagLatestSection posts={posts.slice(7) as MagPost[]} />
      <SeriesShowcase series={series} dict={dict} />
      <EditorQuote dict={dict} />
      <NewsletterBand subscriberCount={subscriberCount} dict={dict} />
    </HomeScrollReveal>
  );
}
