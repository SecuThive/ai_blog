import Link from '@/i18n/link';
import AdSenseLoader from '@/components/AdSenseLoader';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { makeFreshClient } from '@/lib/supabase';
import { withEnFallbackContent } from '@/lib/enFallback';
import { getHomePostIds } from '@/lib/homePosts';
import { catTone, toneForSeries, engCatTone } from '@/lib/utils';
import type { PostSummary, EngineerGuide } from '@/lib/types';
import { HomeScrollReveal } from '@/components/HomeClient';
import SubscribeForm from '@/components/SubscribeForm';
import TrackedLink from '@/components/TrackedLink';
import TrackedExternalLink from '@/components/TrackedExternalLink';
import HeroDepthScene from '@/components/HeroDepthScene';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary, interpolate, type Messages } from '@/i18n/messages';
import { pageMetadata } from '@/i18n/metadata';
import { localizePost, localizeGuide } from '@/i18n/content';
import { categoryLabel, engineerCatLabel } from '@/i18n/categories';
import { formatDate } from '@/i18n/format';
import { seriesLabel } from '@/i18n/display';

// 홈은 DB 쿼리 6개를 병렬로 조합하므로 매분 콜드 재생성하면 최초 응답이 길어진다.
// 발행 웹훅(/api/revalidate)이 '/'를 별도로 무효화하므로 시간 기반 재생성은 30분으로
// 늘려 Supabase egress를 줄인다(신규 발행은 웹훅으로 즉시 반영).
export const revalidate = 1800;

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
  const ids = await getHomePostIds(20);
  if (ids.length === 0) return [];
  const client = makeFreshClient();
  const { data: rows } = await client
    .from('posts')
    .select('id,title,slug,excerpt,cover_image,category,tags,views,published_at,content_evidence')
    .in('id', ids)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20);

  // 본문은 가져오지 않는다(egress). 영문 제목/요약 태그가 없는 예외 행만 content 보충.
  const withEn = await withEnFallbackContent(client, 'posts', (rows ?? []) as (Record<string, unknown> & { id: number })[], locale);
  return withEn.map((p) => {
    const localized = localizePost({
      title: String(p.title ?? ''),
      excerpt: String(p.excerpt ?? ''),
      content: String(p.content ?? ''),
      tags: p.tags as string[] | null,
      content_evidence: p.content_evidence,
    }, locale);
    return {
      ...p,
      title: localized.title,
      excerpt: localized.excerpt,
      content: undefined,
      content_evidence: undefined,
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
function HeroV2({ posts, seriesCount, guideCount, subscriberCount, locale }: {
  posts: PostSummary[];
  seriesCount: number;
  guideCount: number;
  subscriberCount: number;
  locale: Locale;
}) {
  // 허영 지표(누적 발행 수·조회수·미달 구독자)는 노출하지 않는다 — 자동생성 인상 완화(#8).
  // 대신 실질 신호(시리즈·큐레이션 가이드·검토 방식)만 남긴다.
  const stats = [
    { num: String(seriesCount), sub: 'ACTIVE SERIES' },
    { num: `${guideCount}+`, sub: 'ENGINEER GUIDES' },
    // 구독자는 유의미해지기 전까지 숨김(미완성 지표처럼 보이는 '—' 제거)
    ...(subscriberCount >= 50
      ? [{ num: subscriberCount >= 1000 ? `${(subscriberCount / 1000).toFixed(1)}K` : String(subscriberCount), sub: 'SUBSCRIBERS' }]
      : []),
  ];
  return (
    <section className="heroX heroX--brand">
      <div className="container">
        <div className="heroX-grid heroX-grid--depth">
          <div className="heroX-copy">
            <span className="hero-status">
              <span className="live-dot" />
              <span>THIVELAB · NODELOG</span>
            </span>
            <h1>
              <span className="grad">NODELOG</span>
              <br />
              <span className="heroX-statement">{locale === 'en' ? 'Read. Trace. Resolve.' : '읽고, 추적하고, 해결하다.'}</span>
            </h1>
            <p className="heroX-lead">
              {locale === 'en'
                ? 'Practical engineering articles and guides for understanding a problem and finding the next step. Start with a topic, then follow the trail.'
                : '문제를 이해하고 다음 확인 지점을 찾기 위한 기술 글과 엔지니어 가이드. 관심 있는 주제에서 시작해 관련 글로 이어 읽어보세요.'}
            </p>
            <div className="heroX-actions">
              <TrackedLink href="/#nodelog-latest" event={{ name: 'home_nodelog_click', path: '/' }} className="btn btn-primary btn-lg">
                {locale === 'en' ? 'Explore articles' : '글 둘러보기'} <ArrowIcon />
              </TrackedLink>
              <Link href="/engineer" className="btn btn-lg btn-ghost">
                {locale === 'en' ? 'Engineer guides' : '엔지니어 가이드'} <ArrowIcon />
              </Link>
            </div>
            <div className="heroX-meta">
              {stats.map((s, i) => (
                <div key={i}>
                  <div className="stat-num">{s.num}</div>
                  <div className="stat-sub">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
          <HeroDepthScene locale={locale} posts={posts.slice(0, 3).map(post => ({ slug: post.slug, title: post.title, category: categoryLabel(post.category, locale) }))} />
        </div>
      </div>
    </section>
  );
}

function ServiceLaunchBanner({ locale }: { locale: Locale }) {
  return (
    <section className="service-launch" aria-labelledby="service-launch-title">
      <div className="container">
        <div className="service-launch-panel">
          <div className="service-launch-heading">
            <div>
              <span className="service-launch-eyebrow">THIVELAB PRODUCTS</span>
              <h2 id="service-launch-title">{locale === 'en' ? 'Learn, make, compete, and create.' : '배우고, 만들고, 도전해 보세요.'}</h2>
              <p>{locale === 'en' ? 'Explore the services you can use today.' : '지금 이용할 수 있는 THIVELAB 서비스를 소개합니다.'}</p>
            </div>
            <Link href="/about" className="section-link">{locale === 'en' ? 'About THIVELAB' : 'THIVELAB 소개'} <ArrowIcon /></Link>
          </div>
          <div className="service-launch-grid">
            <TrackedLink className="service-launch-item" href="/#nodelog-latest" event={{ name: 'product_card_click', path: '/', product: 'nodelog' }}>
              <span className="service-launch-item-label">LEARN · NODELOG</span>
              <strong>NODELOG</strong>
              <span className="service-launch-item-desc">{locale === 'en' ? 'Practical IT knowledge and engineer guides.' : '실무 IT 지식과 엔지니어 가이드.'}</span>
              <span className="service-launch-item-action">{locale === 'en' ? 'Read NODELOG' : '콘텐츠 보기'} <ArrowIcon /></span>
            </TrackedLink>
            <TrackedExternalLink className="service-launch-item service-launch-item--tools" href="https://tools.thivelab.com/" path="/" event={{ name: 'product_card_click', path: '/', product: 'tools' }} aria-label={locale === 'en' ? 'Open THIVELAB TOOLS' : 'THIVELAB TOOLS 열기'}>
              <span className="service-launch-item-label">MAKE · TOOLS</span>
              <strong>TOOLS</strong>
              <span className="service-launch-item-desc">{locale === 'en' ? 'Resize images, work with PDFs, and count text in your browser.' : '이미지·PDF·글자 수 작업을 브라우저에서 바로 처리하세요.'}</span>
              <span className="service-launch-item-action">{locale === 'en' ? 'Open free tools' : '무료 도구 사용하기'} <span aria-hidden="true">↗</span></span>
            </TrackedExternalLink>
            <TrackedExternalLink className="service-launch-item service-launch-item--moa" href="https://moa.thivelab.com/" path="/" event={{ name: 'product_card_click', path: '/', product: 'moa' }} aria-label={locale === 'en' ? 'Open MOA' : 'MOA 열기'}>
              <span className="service-launch-item-label">CREATIVE WORKSPACE · MOA</span>
              <strong>MOA</strong>
              <span className="service-launch-item-desc">{locale === 'en' ? 'Posters, menus, coupons, and review replies in one place.' : '홍보물·메뉴판·쿠폰·리뷰 답변을 한곳에서 만드세요.'}</span>
              <span className="service-launch-item-action">{locale === 'en' ? 'Try MOA' : 'MOA 바로가기'} <span aria-hidden="true">↗</span></span>
            </TrackedExternalLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function RecentArticles({ posts, locale, dict }: { posts: PostSummary[]; locale: Locale; dict: Messages }) {
  return (
    <section className="section" id="nodelog-latest" aria-labelledby="recent-articles-title">
      <div className="container">
        <div className="sec-head2">
          <div className="left">
            <span className="num">01 / NODELOG</span>
            <div>
              <h2 id="recent-articles-title">{dict.home.latestTitle}</h2>
              <p className="sub">{dict.home.latestSub}</p>
            </div>
          </div>
          <Link href="/archive" className="section-link">{dict.home.archive} <ArrowIcon /></Link>
        </div>
        <div className="recent-article-grid">
          {posts.slice(0, 15).map(post => (
            <article key={post.id} className="card recent-article-card">
              <div className="card-meta">
                <span className={`badge badge-${catTone(post.category)}`}>{categoryLabel(post.category, locale)}</span>
                <time dateTime={post.published_at}>{formatDate(post.published_at, locale)}</time>
              </div>
              <h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3>
              <p>{post.excerpt}</p>
            </article>
          ))}
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

function ReadingLanes({ lanePosts, dict }: { lanePosts: Record<string, PostSummary[]>; dict: Messages }) {
  const populatedLanes = LANE_DEFS.filter(lane => (lanePosts[lane.category]?.length ?? 0) > 0);
  if (populatedLanes.length === 0) return null;
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
          {populatedLanes.map((lane, i) => {
            const items = lanePosts[lane.category] ?? [];
            return (
              <div key={i} className="lane">
                <div className="lane-head">
                  <div>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--text-4)', letterSpacing: '0.10em', marginBottom: 6 }}>
                      LANE · {lane.tag}
                    </div>
                    <h3>{dict.home[lane.titleKey]}</h3>
                  </div>
                  <span className="ic">{lane.icon}</span>
                </div>
                <p className="lane-sub">{dict.home[lane.subKey]}</p>
                <div className="lane-steps">
                  {items.map((p, j) => (
                    <Link key={p.id} className="lane-step" href={`/blog/${p.slug}`}>
                      <span className="num">{String(j + 1).padStart(2, '0')}</span>
                      <div>
                        <p className="t">{p.title}</p>
                        {p.reading_time ? <p className="m">{interpolate(dict.home.minRead, { min: p.reading_time })}</p> : null}
                      </div>
                    </Link>
                  ))}
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
function SeriesShowcase({ series, dict, locale }: { series: SeriesInfo[]; dict: Messages; locale: Locale }) {
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
                  {seriesLabel(s.name, locale)}
                </div>
                <div className="card-body">
                  <div className="card-meta">
                    <span className={`badge badge-${s.tone}`}>SERIES</span>
                    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)' }}>
                      {interpolate(dict.home.postsCount, { count: s.count })}
                    </span>
                  </div>
                  <h3 className="card-title">{seriesLabel(s.name, locale)}</h3>
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
      const ids = await getHomePostIds(3, lane.category);
      if (ids.length === 0) return [lane.category, []] as const;
      const { data } = await client
        .from('posts')
        .select('id,title,slug,category,published_at,tags,content_evidence')
        .in('id', ids)
        .eq('status', 'published')
        .eq('category', lane.category)
        .order('published_at', { ascending: false })
        .limit(3);
      const withEn = await withEnFallbackContent(client, 'posts', (data ?? []) as (Record<string, unknown> & { id: number })[], locale, { title: true });
      const items = withEn.map((p) => {
        const localized = localizePost({
          title: String(p.title ?? ''),
          tags: p.tags as string[] | null,
          content: String(p.content ?? ''),
          content_evidence: p.content_evidence,
        }, locale);
        return {
          ...p,
          title: localized.title,
          content: undefined,
          content_evidence: undefined,
        };
      }) as unknown as PostSummary[];
      return [lane.category, items] as const;
    }),
  );
  return Object.fromEntries(entries);
}

async function getRecentGuides(locale: Locale): Promise<EngineerGuide[]> {
  const client = makeFreshClient();
  const { data } = await client
    .from('engineer_guides')
    .select('id,title,slug,summary,category,difficulty,views,created_at,tags')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(6);
  const withEn = await withEnFallbackContent(client, 'engineer_guides', (data ?? []) as EngineerGuide[], locale);
  return withEn.map((g) => ({ ...localizeGuide(g, locale), content: '' }));
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
                  <time dateTime={g.created_at} style={{ marginLeft: 'auto', fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--text-4)' }}>{formatDate(g.created_at, locale)}</time>
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
          {Array.from(new Set(guides.map(guide => guide.category))).map(cat => (
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
  // 홈의 시리즈 추천은 2편 이상인 모음으로 제한한다.
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
      {/* 홈은 실제 글 목록이 있을 때만 광고 로더를 둔다(빈 홈 화면 제외). */}
      <AdSenseLoader />
      <HeroV2 posts={posts} seriesCount={activeSeriesCount} guideCount={guideCount} subscriberCount={subscriberCount} locale={locale} />
      <RecentArticles posts={posts} locale={locale} dict={dict} />
      <EngineerGuidesSection guides={recentGuides} total={guideCount} locale={locale} dict={dict} />
      <ReadingLanes lanePosts={lanePosts} dict={dict} />
      <ServiceLaunchBanner locale={locale} />
      <SeriesShowcase series={series} dict={dict} locale={locale} />
      <EditorQuote dict={dict} />
      <NewsletterBand subscriberCount={subscriberCount} dict={dict} />
    </HomeScrollReveal>
  );
}
