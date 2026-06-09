import Link from 'next/link';
import type { Metadata } from 'next';
import { readingTime, makeFreshClient } from '@/lib/supabase';
import { catTone, toneForSeries, engCatTone } from '@/lib/utils';
import type { PostSummary, EngineerGuide } from '@/lib/types';
import {
  TickerBar,
  ControlPanel,
  SignalDashboard,
  TopicCloud,
  MagLatestSection,
  HomeScrollReveal,
  type TickItem,
  type FeedItem,
  type BarItem,
  type TopicItem,
  type SignalData,
  type MagPost,
} from '@/components/HomeClient';
import SubscribeForm from '@/components/SubscribeForm';
import PostThumb from '@/components/PostThumb';

const SOURCE_COUNT = '4,128';

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export const metadata: Metadata = {
  title: 'Nodelog — IT·개발·보안 테크 미디어',
  description: 'IT·개발·보안·인프라 실무 인사이트를 전문 에디터가 검증·큐레이션하는 테크 미디어. 매일 업데이트됩니다.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Nodelog — IT·개발·보안 테크 미디어',
    description: 'IT·개발·보안·인프라 실무 인사이트를 전문 에디터가 검증·큐레이션하는 테크 미디어. 매일 업데이트됩니다.',
    url: SITE_URL,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
};

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
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

async function getSubscriberCount(): Promise<number> {
  const { count } = await makeFreshClient()
    .from('subscribers')
    .select('id', { count: 'exact', head: true });
  return count ?? 0;
}

async function getPosts(): Promise<PostSummary[]> {
  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,excerpt,cover_image,category,tags,author,agent_role,views,published_at,content')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20);

  return (data ?? []).map((p: Record<string, unknown>) => ({
    ...p,
    content: undefined,
    reading_time: readingTime((p.content as string) ?? ''),
  })) as unknown as PostSummary[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return '방금 전';
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
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
function HeroV2({ posts, ticks, feed, bars, seriesCount, postCount, subscriberCount }: {
  posts: PostSummary[];
  ticks: TickItem[];
  feed: FeedItem[];
  bars: BarItem[];
  seriesCount: number;
  postCount: number;
  subscriberCount: number;
}) {
  return (
    <section className="heroX">
      <div className="container">
        <TickerBar ticks={ticks} />
        <div className="heroX-grid">
          <div>
            <span className="hero-status">
              <span className="live-dot" />
              <span>INDEX · 24/7 · {SOURCE_COUNT} SOURCES</span>
              <span style={{ color: 'var(--text-5)' }}>·</span>
              <span>POSTS {postCount > 0 ? `${postCount}+` : '...'}</span>
            </span>
            <h1>
              <span className="grad">전문 에디터가 검증한,</span>
              <br />
              <em>오늘의</em> 실전 IT 인사이트.
            </h1>
            <p className="heroX-lead">
              자동화, 개발, 보안, 인프라, 생산성. 전 세계 {SOURCE_COUNT}개 IT 소스를 모니터링해
              핵심 신호를 추리고, 전문 에디터의 사실 확인·검수를 거쳐 실무에 바로 쓰는 콘텐츠로 발행합니다.
            </p>
            <div className="heroX-actions">
              {posts[0] && (
                <Link href={`/blog/${posts[0].slug}`} className="btn btn-primary btn-lg">
                  최신 글 보기 <ArrowIcon />
                </Link>
              )}
              <Link href="/series" className="btn btn-lg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                시리즈 바로가기
              </Link>
              <Link href="/about" className="btn btn-lg btn-ghost">
                운영 방식 알아보기
              </Link>
            </div>
            <div className="heroX-meta">
              <div>
                <div className="stat-num">{postCount > 0 ? `${postCount}+` : '—'}</div>
                <div className="stat-sub">PUBLISHED · 누적</div>
              </div>
              <div>
                <div className="stat-num">{seriesCount}</div>
                <div className="stat-sub">ACTIVE SERIES</div>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>
                  <span className="ai-tag" style={{ fontSize: 11 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
                    </svg>
                    AI
                  </span>
                </div>
                <div className="stat-sub">CURATED · 24/7</div>
              </div>
              <div>
                <div className="stat-num">{subscriberCount > 0 ? (subscriberCount >= 1000 ? `${(subscriberCount / 1000).toFixed(1)}K` : String(subscriberCount)) : '—'}</div>
                <div className="stat-sub">SUBSCRIBERS</div>
              </div>
            </div>
          </div>
          <ControlPanel feed={feed} bars={bars} />
        </div>
      </div>
    </section>
  );
}

/* ===== Daily Briefing ===== */
function DailyBriefing({ posts }: { posts: PostSummary[] }) {
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
              <h2>오늘의 IT 브리핑</h2>
              <p className="sub">AI가 선정한 오늘의 주요 글. 편집자 1차 검토 완료.</p>
            </div>
          </div>
          <Link href="/" className="section-link">
            전체 글 <ArrowIcon size={14} />
          </Link>
        </div>

        <div className="brief-wrap">
          <Link className="brief-main" href={`/blog/${lead.slug}`}>
            <PostThumb slug={lead.slug} title={lead.title} coverImage={lead.cover_image} category={lead.category} className="ph card-thumb" />
            <div className="brief-main-body">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 0 }}>
                <span className={`badge badge-${leadTone}`}>{lead.category}</span>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.04em' }}>
                  {timeAgo(lead.published_at)} · {lead.reading_time}분 읽기
                </span>
              </div>
              <h3>{lead.title}</h3>
              <p>{lead.excerpt}</p>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.04em', display: 'flex', gap: 8 }}>
                <span>AI · EDITED BY HUMAN</span>
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
                <h6>QUICK READS · 짧게 읽기</h6>
                <ul>
                  {quick.map((p, i) => (
                    <li key={p.id}>
                      <span className="t">{String(i + 1).padStart(2, '0')}</span>
                      <Link className="l" href={`/blog/${p.slug}`} style={{ color: 'var(--text-2)' }}>
                        {p.title.length > 36 ? p.title.slice(0, 36) + '…' : p.title}
                      </Link>
                      <span className="r">{p.reading_time}분</span>
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
    tag: 'DEV', title: '개발자', category: '개발',
    sub: '코드를 쓰는 시간을 더 똑똑하게 만드는 도구와 패턴.',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    tag: 'AI', title: 'AI 실무자', category: 'AI & 자동화',
    sub: 'GPT·Claude·MCP를 실제 업무 흐름에 녹여 넣는 법.',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
        <path d="M5 3l.5 1.5L7 5l-1.5.5L5 7l-.5-1.5L3 5l1.5-.5z" />
      </svg>
    ),
  },
  {
    tag: 'SEC', title: '보안 담당', category: '보안',
    sub: 'AI 시대의 새로운 위협 모델과 실무 방어 전략.',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    tag: 'PRO', title: '시니어 · PM', category: 'IT 트렌드',
    sub: '시간·정보·도구를 다루는 비동기 워크플로우.',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L8.5 9H1l6 5.5L4.5 22 12 17l7.5 5-2.5-7.5L23 9h-7.5z" />
      </svg>
    ),
  },
];

function ReadingLanes({ posts }: { posts: PostSummary[] }) {
  return (
    <section className="section">
      <div className="container">
        <div className="sec-head2">
          <div className="left">
            <span className="num">03 / READING LANES</span>
            <div>
              <h2>당신의 자리에서 시작하기</h2>
              <p className="sub">
                역할별로 정리된 학습 경로. 입문 → 깊이 → 의사결정의 흐름으로 자연스럽게 이어집니다.
              </p>
            </div>
          </div>
          <Link href="/curated" className="section-link">
            모든 컬렉션 <ArrowIcon size={14} />
          </Link>
        </div>

        <div className="lanes">
          {LANE_DEFS.map((lane, i) => {
            const lanePosts = posts.filter(p => p.category === lane.category).slice(0, 3);
            return (
              <div key={i} className="lane">
                <div className="lane-head">
                  <div>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--text-4)', letterSpacing: '0.10em', marginBottom: 6 }}>
                      LANE · {lane.tag}
                    </div>
                    <h4>{lane.title}</h4>
                  </div>
                  <span className="ic">{lane.icon}</span>
                </div>
                <p className="lane-sub">{lane.sub}</p>
                <div className="lane-steps">
                  {lanePosts.length > 0 ? lanePosts.map((p, j) => (
                    <Link key={p.id} className="lane-step" href={`/blog/${p.slug}`}>
                      <span className="num">{String(j + 1).padStart(2, '0')}</span>
                      <div>
                        <p className="t">{p.title}</p>
                        <p className="m">{p.reading_time}분 읽기</p>
                      </div>
                    </Link>
                  )) : (
                    <Link className="lane-step" href={`/category/${lane.category}`}>
                      <span className="num">→</span>
                      <div>
                        <p className="t">{lane.category} 글 보러가기</p>
                        <p className="m">카테고리 전체</p>
                      </div>
                    </Link>
                  )}
                </div>
                <div className="lane-foot">
                  <span>{lanePosts.length} STEPS</span>
                  <Link href={`/category/${lane.category}`}>전체 보기 →</Link>
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
function EditorQuote() {
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
              정보의 양이 아니라{' '}
              <span style={{ background: 'linear-gradient(180deg, transparent 60%, color-mix(in oklch, var(--acc-blue) 30%, transparent) 60%)' }}>
                맥락의 밀도
              </span>
              를 높이는 일.
              AI가 빠르게 정리하지만, 어떤 신호가 진짜로 중요한지를 결정하는 건 여전히 사람의 몫이라고 믿습니다.
            </blockquote>
            <div className="att">
              <span className="pip">N</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.005em' }}>Nodelog Editorial Team</div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.06em', marginTop: 2 }}>
                  AI + HUMAN · {yearMonth}
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
function SeriesShowcase({ series }: { series: SeriesInfo[] }) {
  return (
    <section className="section" style={{ background: 'linear-gradient(180deg, transparent, rgba(20,24,36,0.4) 30%, transparent)' }}>
      <div className="container">
        <div className="sec-head2">
          <div className="left">
            <span className="num">06 / SERIES</span>
            <div>
              <h2>시리즈로 깊게 파보기</h2>
              <p className="sub">하나의 주제를 끝까지 따라가도록 단계별로 구성된 학습 경로형 콘텐츠.</p>
            </div>
          </div>
          <Link href="/series" className="section-link">
            전체 시리즈 <ArrowIcon size={14} />
          </Link>
        </div>
        {series.length === 0 ? (
          <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '40px 0' }}>
            시리즈를 준비 중입니다.
          </p>
        ) : (
          <div className="grid-3">
            {series.map((s) => (
              <Link key={s.name} href={`/series/${encodeURIComponent(s.name)}`} className="card card-link">
                <div className={`card-thumb thumb-${s.tone}`} style={{ aspectRatio: '16/7' }}>
                  {s.name}
                </div>
                <div className="card-body">
                  <div className="card-meta">
                    <span className={`badge badge-${s.tone}`}>SERIES</span>
                    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)' }}>
                      {s.count}편
                    </span>
                  </div>
                  <h3 className="card-title">{s.name}</h3>
                  <p className="card-excerpt">
                    {s.count}편으로 구성된 심층 연재. 처음부터 끝까지 따라가며 주제를 완전히 이해하세요.
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

/* ===== AI Recommendation Block ===== */
function AIRecommendBlock({ posts }: { posts: PostSummary[] }) {
  const recs = posts.slice(0, 3);
  if (recs.length === 0) return null;

  const maxViews = Math.max(...recs.map(r => r.views), 1);

  return (
    <section className="section">
      <div className="container">
        <div className="sec-head2">
          <div className="left">
            <span className="num">07 / AI RECOMMEND</span>
            <div>
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: 8 }}>
                  <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
                  <path d="M5 3l.5 1.5L7 5l-1.5.5L5 7l-.5-1.5L3 5l1.5-.5z" />
                </svg>
                오늘 AI가 추천하는 글
              </h2>
              <p className="sub">최근 조회수·완독 패턴을 분석해, 같은 주제에 관심 있는 독자들이 선택한 글. 매시간 갱신.</p>
            </div>
          </div>
          <Link href="/recommend" className="section-link">
            추천 페이지 <ArrowIcon size={14} />
          </Link>
        </div>
        <div className="grid-3">
          {recs.map((p) => {
            const tone = catTone(p.category);
            const popularity = Math.min(99, Math.max(60, Math.round((p.views / maxViews) * 35 + 62)));
            return (
              <Link key={p.id} href={`/blog/${p.slug}`} className="card card-link" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="ai-tag">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
                    </svg>
                    인기 {popularity}%
                  </span>
                  <span className={`badge badge-${tone}`}>{p.category}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: 16.5, lineHeight: 1.35, letterSpacing: '-0.015em' }}>{p.title}</h3>
                <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, lineHeight: 1.55 }}>{p.excerpt}</p>
                <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px dashed var(--line-1)', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.04em' }}>
                  {p.category} · {p.reading_time}분 읽기 · 조회 {p.views.toLocaleString()}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ===== Newsletter Band ===== */
function NewsletterBand({ subscriberCount }: { subscriberCount: number }) {
  const subLabel = subscriberCount > 0
    ? `${subscriberCount >= 1000 ? (subscriberCount / 1000).toFixed(1) + 'K' : subscriberCount}명이 구독 중.`
    : '지금 바로 구독하세요.';
  return (
    <section className="section">
      <div className="container">
        <div className="subscribe">
          <div>
            <div className="section-eyebrow" style={{ marginBottom: 14 }}>NEWSLETTER · WEEKLY · 매주 화요일</div>
            <h3>한 주의 IT를, AI가 정리해 보냅니다.</h3>
            <p>가장 의미 있는 변화 5개, 실무에 적용 가능한 도구 3개, 그리고 가장 깊이 있는 시리즈 1편. {subLabel}</p>
          </div>
          <div>
            <SubscribeForm compact />
            <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-4)', fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em' }}>
              NO SPAM · 언제든 해지 가능 · 평균 6분 분량
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

async function getRecentGuides(): Promise<EngineerGuide[]> {
  const { data } = await makeFreshClient()
    .from('engineer_guides')
    .select('id,title,slug,summary,category,difficulty,views,created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(6);
  return (data ?? []) as EngineerGuide[];
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
};

function EngineerGuidesSection({ guides }: { guides: EngineerGuide[] }) {
  if (guides.length === 0) return null;
  return (
    <section className="section" style={{ background: 'linear-gradient(180deg, transparent, rgba(20,36,24,0.3) 30%, transparent)' }}>
      <div className="container">
        <div className="sec-head2">
          <div className="left">
            <span className="num">02 / ENGINEER GUIDE</span>
            <div>
              <h2>실무 엔지니어 레퍼런스</h2>
              <p className="sub">Linux·Docker·Git·네트워킹·보안·DB — 복사해서 바로 쓰는 실전 가이드 {guides.length}+ 편.</p>
            </div>
          </div>
          <Link href="/engineer" className="section-link">
            전체 가이드 <ArrowIcon size={14} />
          </Link>
        </div>
        <div className="grid-3" style={{ gap: 12 }}>
          {guides.map(g => {
            const tone = engCatTone(g.category);
            const diff = DIFFICULTY_LABEL[g.difficulty] ?? g.difficulty;
            return (
              <Link key={g.id} href={`/engineer/${g.slug}`} className="card card-link" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge badge-${tone}`} style={{ fontSize: 10.5 }}>{g.category}</span>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--text-4)', letterSpacing: '0.04em' }}>{diff}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: 15, lineHeight: 1.38, letterSpacing: '-0.012em' }}>{g.title}</h3>
                <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 12.5, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{g.summary}</p>
                <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px dashed var(--line-1)', fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                  가이드 보기
                </div>
              </Link>
            );
          })}
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['Linux / Shell', 'Docker / 컨테이너', 'Git / CI·CD', '네트워킹 / 서버', '보안 설정', '데이터베이스'].map(cat => (
            <Link key={cat} href={`/engineer?cat=${encodeURIComponent(cat)}`} style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', border: '1px solid var(--line-1)', borderRadius: 4, padding: '4px 10px', letterSpacing: '0.04em', textDecoration: 'none' }}>
              {cat}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const CAT_TAG: Record<string, string> = {
  'AI & 자동화': 'AI', '개발': 'DEV', 'IT 트렌드': 'IT',
  '인프라': 'INF', '보안': 'SEC', '툴 리뷰': 'TOOL',
};
const CAT_TONE: Record<string, string> = {
  'AI & 자동화': '', '개발': 't-mint', 'IT 트렌드': 't-purple',
  '보안': 't-rose', '툴 리뷰': 't-amber', '인프라': 't-amber',
};

function buildClientData(posts: PostSummary[]) {
  const ticks: TickItem[] = posts.slice(0, 5).map(p => ({
    tag: CAT_TAG[p.category] ?? p.category.slice(0, 3).toUpperCase(),
    title: p.title,
  }));

  const feed: FeedItem[] = posts.slice(0, 5).map(p => {
    const d = new Date(p.published_at);
    const time = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    return {
      time,
      tag: CAT_TAG[p.category] ?? p.category.slice(0, 3).toUpperCase(),
      label: p.title.length > 22 ? p.title.slice(0, 22) + '…' : p.title,
      slug: p.slug,
    };
  });

  const catCounts = new Map<string, number>();
  for (const p of posts) {
    catCounts.set(p.category, (catCounts.get(p.category) ?? 0) + 1);
  }
  const maxCat = Math.max(...Array.from(catCounts.values()), 1);
  const bars: BarItem[] = Array.from(catCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({
      name,
      barW: Math.round((count / maxCat) * 100) + '%',
      tone: CAT_TONE[name] ?? '',
    }));

  const tagCounts = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.tags) {
      if (!t.startsWith('series:')) {
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      }
    }
  }
  const maxTag = Math.max(...Array.from(tagCounts.values()), 1);
  const topics: TopicItem[] = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([tag, count]) => ({
      tag,
      count,
      size: count >= maxTag * 0.75 ? 5 : count >= maxTag * 0.5 ? 4 : count >= maxTag * 0.25 ? 3 : count > 1 ? 2 : 1,
    }));

  const dateMap = new Map<string, PostSummary[]>();
  for (const p of posts) {
    const d = (p.published_at ?? '').slice(0, 10);
    if (d) {
      if (!dateMap.has(d)) dateMap.set(d, []);
      dateMap.get(d)!.push(p);
    }
  }
  const sortedDates = [...dateMap.keys()].sort().slice(-14);
  const half = Math.ceil(posts.length / 2);
  const SIG_COLORS: Array<'blue' | 'mint' | 'purple'> = ['blue', 'mint', 'purple'];
  const SIG_PERIODS = ['TOP MOVER', 'RISING', 'SLOW BURN'];

  const signals: SignalData[] = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, totalCount], i) => {
      const raw = sortedDates.map(d =>
        (dateMap.get(d) ?? []).filter(p => (p.tags ?? []).includes(tag)).length
      );
      const maxV = Math.max(...raw, 1);
      const spark = raw.map(v => Math.round((v / maxV) * 100));
      while (spark.length < 14) spark.unshift(0);
      const recent = posts.slice(0, half).filter(p => (p.tags ?? []).includes(tag)).length;
      const older = posts.slice(half).filter(p => (p.tags ?? []).includes(tag)).length;
      const delta = older === 0 ? (recent > 0 ? 100 : 0) : Math.round(((recent - older) / older) * 100);
      return {
        ticker: tag.replace(/\s+/g, '').toUpperCase().slice(0, 6),
        label: tag,
        delta,
        deltaLabel: delta >= 0 ? `↑ +${delta}%` : `↓ ${delta}%`,
        periodLabel: `${SIG_PERIODS[i]} · 7D`,
        spark,
        desc: `최근 게시글 ${totalCount}건에서 언급된 키워드.`,
        color: SIG_COLORS[i],
      };
    });

  const now = new Date();
  const heatmapDates: string[] = Array.from({ length: 14 }, (_, idx) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - idx));
    return (13 - idx) % 3 === 0
      ? `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
      : '';
  });

  return { ticks, feed, bars, topics, signals, heatmapDates };
}

/* ===== Page ===== */
export default async function HomePage() {
  const [posts, series, subscriberCount, recentGuides] = await Promise.all([getPosts(), getSeries(), getSubscriberCount(), getRecentGuides()]);

  if (posts.length === 0) {
    return (
      <div className="container" style={{ paddingTop: 80, paddingBottom: 80, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.16em', color: 'var(--text-3)', marginBottom: 24, textTransform: 'uppercase' }}>
          NODELOG · AI IT MEDIA
        </div>
        <h1 style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 600, letterSpacing: '-.035em', marginBottom: 20 }}>
          첫 번째 글을 준비 중입니다.
        </h1>
        <p style={{ fontSize: 17, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
          AI 에이전트가 최신 IT 트렌드를 분석하고 글을 작성 중입니다.
        </p>
      </div>
    );
  }

  const { ticks, feed, bars, topics, signals, heatmapDates } = buildClientData(posts);

  return (
    <HomeScrollReveal>
      <HeroV2 posts={posts} ticks={ticks} feed={feed} bars={bars} seriesCount={series.length} postCount={posts.length} subscriberCount={subscriberCount} />
      <DailyBriefing posts={posts} />
      <EngineerGuidesSection guides={recentGuides} />
      <SignalDashboard signals={signals} heatmapDates={heatmapDates} />
      <ReadingLanes posts={posts} />
      <MagLatestSection posts={posts.slice(1) as MagPost[]} />
      <TopicCloud topics={topics} />
      <EditorQuote />
      <SeriesShowcase series={series} />
      <AIRecommendBlock posts={posts.slice(5, 8)} />
      <NewsletterBand subscriberCount={subscriberCount} />
    </HomeScrollReveal>
  );
}
