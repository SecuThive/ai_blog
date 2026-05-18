import Link from 'next/link';
import { readingTime, makeFreshClient } from '@/lib/supabase';
import { catTone, toneForSeries } from '@/lib/utils';
import type { PostSummary } from '@/lib/types';
import {
  TickerBar,
  ControlPanel,
  SignalDashboard,
  TopicCloud,
  HomeScrollReveal,
  type TickItem,
  type FeedItem,
  type BarItem,
  type TopicItem,
} from '@/components/HomeClient';
import SubscribeForm from '@/components/SubscribeForm';
import PostThumb from '@/components/PostThumb';

export const revalidate = 60;

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
function HeroV2({ posts, ticks, feed, bars, seriesCount }: {
  posts: PostSummary[];
  ticks: TickItem[];
  feed: FeedItem[];
  bars: BarItem[];
  seriesCount: number;
}) {
  return (
    <section className="heroX">
      <div className="container">
        <TickerBar ticks={ticks} />
        <div className="heroX-grid">
          <div>
            <span className="hero-status">
              <span className="live-dot" />
              <span>INDEX · 24/7 · 4,128 SOURCES</span>
              <span style={{ color: 'var(--text-5)' }}>·</span>
              <span>편집자 검토 92% 통과</span>
            </span>
            <h1>
              <span className="grad">AI가 분석하고 사람이 검토한,</span>
              <br />
              <em>오늘의</em> 실전 IT 인사이트.
            </h1>
            <p className="heroX-lead">
              자동화, 개발, 보안, 인프라, 생산성. 전 세계 4,128개 IT 소스를 24시간 모니터링하고,
              변화의 신호를 점수화한 뒤, 사람 편집자의 검토를 거쳐 정제된 콘텐츠로 발행합니다.
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
                <div className="stat-num">{posts.length > 0 ? `${posts.length}+` : '—'}</div>
                <div className="stat-sub">PUBLISHED · 누적</div>
              </div>
              <div>
                <div className="stat-num">{seriesCount}</div>
                <div className="stat-sub">ACTIVE SERIES</div>
              </div>
              <div>
                <div className="stat-num">4,128</div>
                <div className="stat-sub">SOURCES · 모니터링</div>
              </div>
              <div>
                <div className="stat-num">4.2K</div>
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
            <PostThumb slug={lead.slug} title={lead.title} coverImage={lead.cover_image} className="ph card-thumb" />
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

/* ===== Magazine grid: Latest ===== */
function MagLatest({ posts }: { posts: PostSummary[] }) {
  const big = posts[0];
  const rest = posts.slice(1, 7);
  if (!big) return null;
  const bigTone = catTone(big.category);

  return (
    <section className="section">
      <div className="container">
        <div className="sec-head2">
          <div className="left">
            <span className="num">04 / LATEST</span>
            <div>
              <h2>최신 글</h2>
              <p className="sub">AI 큐레이션 + 편집자 검토를 거친 신규 인사이트. 시간순으로 정리되어 있습니다.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="filter-tab active">전체</span>
            <Link href="/category/AI & 자동화" className="filter-tab">AI</Link>
            <Link href="/category/개발" className="filter-tab">개발</Link>
            <Link href="/category/IT 트렌드" className="filter-tab">인프라</Link>
            <Link href="/" className="section-link" style={{ marginLeft: 4 }}>
              아카이브 <ArrowIcon size={14} />
            </Link>
          </div>
        </div>

        <div className="mag-grid">
          <Link className="card card-link mag-card-1" href={`/blog/${big.slug}`}>
            <PostThumb slug={big.slug} title={big.title} coverImage={big.cover_image} />
            <div className="card-body" style={{ padding: '22px 24px 26px' }}>
              <div className="card-meta">
                <span className={`badge badge-${bigTone}`}>{big.category}</span>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)' }}>
                  {big.reading_time}분 READ
                </span>
              </div>
              <h3 className="card-title">{big.title}</h3>
              <p className="card-excerpt" style={{ WebkitLineClamp: 3 } as React.CSSProperties}>{big.excerpt}</p>
              <div className="card-foot">
                <span>{timeAgo(big.published_at)}</span>
                <span className="dot" />
                <span>AI · EDITED BY HUMAN</span>
              </div>
            </div>
          </Link>
          {rest.map((p) => {
            const tone = catTone(p.category);
            return (
              <Link key={p.id} href={`/blog/${p.slug}`} className="card card-link">
                <PostThumb slug={p.slug} title={p.title} coverImage={p.cover_image} />
                <div className="card-body">
                  <div className="card-meta">
                    <span className={`badge badge-${tone}`}>{p.category}</span>
                  </div>
                  <h3 className="card-title">{p.title}</h3>
                  <p className="card-excerpt">{p.excerpt}</p>
                  <div className="card-foot">
                    <span>{timeAgo(p.published_at)}</span>
                    <span className="dot" />
                    <span>{p.reading_time}분 읽기</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ===== Editor's Quote ===== */
function EditorQuote() {
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
                  AI + HUMAN · 2026.05
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
              <p className="sub">최근 30일 클릭·체류·완독 패턴을 분석해, 비슷한 관심사의 독자들이 선택한 글. 매시간 갱신.</p>
            </div>
          </div>
          <Link href="/recommend" className="section-link">
            추천 페이지 <ArrowIcon size={14} />
          </Link>
        </div>
        <div className="grid-3">
          {recs.map((p, i) => {
            const tone = catTone(p.category);
            return (
              <Link key={p.id} href={`/blog/${p.slug}`} className="card card-link" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="ai-tag">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
                    </svg>
                    MATCH {94 - i * 4}%
                  </span>
                  <span className={`badge badge-${tone}`}>{p.category}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: 16.5, lineHeight: 1.35, letterSpacing: '-0.015em' }}>{p.title}</h3>
                <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, lineHeight: 1.55 }}>{p.excerpt}</p>
                <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px dashed var(--line-1)', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.04em' }}>
                  추천 근거 · {p.category} 카테고리 완독 · {620 - i * 80}명이 끝까지 읽음
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
function NewsletterBand() {
  return (
    <section className="section">
      <div className="container">
        <div className="subscribe">
          <div>
            <div className="section-eyebrow" style={{ marginBottom: 14 }}>NEWSLETTER · WEEKLY · 매주 화요일</div>
            <h3>한 주의 IT를, AI가 정리해 보냅니다.</h3>
            <p>가장 의미 있는 변화 5개, 실무에 적용 가능한 도구 3개, 그리고 가장 깊이 있는 시리즈 1편. 4,200명이 구독 중.</p>
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

  return { ticks, feed, bars, topics };
}

/* ===== Page ===== */
export default async function HomePage() {
  const [posts, series] = await Promise.all([getPosts(), getSeries()]);

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

  const { ticks, feed, bars, topics } = buildClientData(posts);

  return (
    <HomeScrollReveal>
      <HeroV2 posts={posts} ticks={ticks} feed={feed} bars={bars} seriesCount={series.length} />
      <DailyBriefing posts={posts} />
      <SignalDashboard />
      <ReadingLanes posts={posts} />
      <MagLatest posts={posts.slice(1, 8)} />
      <TopicCloud topics={topics} />
      <EditorQuote />
      <SeriesShowcase series={series} />
      <AIRecommendBlock posts={posts.slice(5, 8)} />
      <NewsletterBand />
    </HomeScrollReveal>
  );
}
