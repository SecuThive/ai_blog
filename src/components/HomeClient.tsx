'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import PostThumb from '@/components/PostThumb';
import { catTone } from '@/lib/utils';

/* ===== Types ===== */
export interface TickItem  { tag: string; title: string }
export interface FeedItem  { time: string; tag: string; label: string; slug: string }
export interface BarItem   { name: string; barW: string; tone: string }
export interface TopicItem { tag: string; count: number; size: number }
export interface MagPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  cover_image?: string;
  reading_time: number;
  published_at: string;
  views: number;
}

/* ===== Scroll Reveal Wrapper ===== */
export function HomeScrollReveal({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sections = root.querySelectorAll(':scope > section');
    sections.forEach((sec) => sec.classList.add('reveal'));

    if (sections[0]) {
      requestAnimationFrame(() => sections[0].classList.add('is-visible'));
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
    );

    sections.forEach((sec, idx) => {
      if (idx > 0) io.observe(sec);
    });

    return () => io.disconnect();
  }, []);

  return <div ref={rootRef}>{children}</div>;
}

/* ===== Ticker Bar ===== */
export function TickerBar({ ticks }: { ticks: TickItem[] }) {
  const [idx, setIdx] = useState(0);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      const hhmm = now.toLocaleTimeString('ko-KR', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul',
      });
      const ymd = now.toLocaleDateString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul',
      }).replace(/\. /g, '.').replace(/\.$/, '');
      setTimeStr(`${hhmm} KST · ${ymd}`);
    };
    fmt();
    if (ticks.length > 1) {
      const id = setInterval(() => setIdx((v) => (v + 1) % ticks.length), 3200);
      return () => clearInterval(id);
    }
  }, [ticks.length]);

  const cur = ticks[idx % Math.max(ticks.length, 1)];
  return (
    <div className="heroX-top">
      <span className="live-dot" />
      <span>LIVE INDEX</span>
      <span className="sep">·</span>
      <span className="v">{timeStr}</span>
      <span className="sep">·</span>
      {cur && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span className="feed-tag" style={{ fontSize: 9.5 }}>{cur.tag}</span>
          <span style={{ color: 'var(--text-2)' }}>{cur.title}</span>
        </span>
      )}
      <span style={{ marginLeft: 'auto', color: 'var(--text-4)' }}>SIGNAL · NOMINAL</span>
    </div>
  );
}

/* ===== AI Control Panel ===== */
export function ControlPanel({ feed, bars }: { feed: FeedItem[]; bars: BarItem[] }) {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPulse((v) => v + 1), 1500);
    return () => clearInterval(id);
  }, []);

  const heights = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const v = (Math.sin(pulse * 0.4 + i * 0.7) + 1.4) * 50 + 20;
        return Math.max(20, Math.min(100, v));
      }),
    [pulse]
  );

  return (
    <div className="ctrl-panel">
      <div className="ctrl-head">
        <span className="live-dot" />
        <span>NODELOG · AI CONTROL</span>
        <span className="id">v4.2 · job-0x{(0xa1f0 + (pulse % 256)).toString(16)}</span>
      </div>
      <div className="ctrl-body">
        <div className="ctrl-section">
          <h6>INDEX FEED · LIVE</h6>
          <ul className="feed-list">
            {feed.map((f, i) => (
              <li key={i} className="feed-item">
                <span className="feed-time">{f.time}</span>
                <span>
                  <span className="feed-tag" style={{ marginRight: 8 }}>{f.tag}</span>
                  <Link href={`/blog/${f.slug}`} className="feed-label" style={{ color: 'inherit', textDecoration: 'none' }}>
                    {f.label}
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="ctrl-section">
          <h6>TOPIC ACTIVITY · 게시물 수</h6>
          <div className="topic-bars">
            {bars.map((bar, i) => (
              <div
                key={i}
                className={`topic-bar${bar.tone ? ' ' + bar.tone : ''}`}
                style={{ '--bar-w': bar.barW } as React.CSSProperties}
              >
                <span className="name">{bar.name}</span>
                <div className="track"><div className="fill" /></div>
                <span className="pct">{bar.barW}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ctrl-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h6 style={{ margin: 0 }}>INFERENCE RATE</h6>
            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)' }}>
              4,128 sources · 96.2% nominal
            </span>
          </div>
          <div className="meter-row">
            {heights.map((h, i) => (
              <span
                key={i}
                className={i % 3 === 0 ? 'a' : 'b'}
                style={{ height: h + '%', '--i': i } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Signal Dashboard ===== */
export interface SignalData {
  ticker: string;
  label: string;
  delta: number;
  deltaLabel: string;
  periodLabel: string;
  spark: number[];
  desc: string;
  color: 'blue' | 'mint' | 'purple';
}

const HEATMAP_ROWS = ['AI 자동화', '개발', '인프라', '보안', '생산성'];

function denseVal(i: number, j: number) {
  const seed = (i * 31 + j * 7) % 13;
  if (j > 10) return Math.min(4, (seed % 5) + 1);
  return seed % 5;
}

export function SignalDashboard({ signals, heatmapDates }: { signals: SignalData[]; heatmapDates: string[] }) {
  return (
    <section className="section">
      <div className="container">
        <div className="sec-head2">
          <div className="left">
            <span className="num">02 / SIGNALS</span>
            <div>
              <h2>오늘의 신호 분석</h2>
              <p className="sub">
                AI가 지난 24시간 동안 추적한 4,128개 소스 중에서 의미 있게 움직인 변화들.
                단순한 빈도가 아닌 변화율 기준.
              </p>
            </div>
          </div>
        </div>

        <div className="signal-grid">
          {signals.map((s, idx) => (
            <div key={idx} className="signal-card">
              <div className="signal-head">
                <span className="signal-eye">{s.periodLabel}</span>
                <span className={`signal-delta ${s.delta >= 0 ? 'up' : 'down'}`}>{s.deltaLabel}</span>
              </div>
              <div>
                <div className="signal-num">{s.ticker}</div>
                <div className="label" style={{ marginTop: 6 }}>{s.label}</div>
              </div>
              <p className="desc">{s.desc}</p>
              <div className="spark">
                {s.spark.map((h, i) => (
                  <span key={i} className={s.color} style={{ height: h + '%', '--i': i } as React.CSSProperties} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, padding: 24, border: '1px solid var(--line-2)', borderRadius: 'var(--r-lg)', background: 'var(--bg-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: 15, letterSpacing: '-0.01em' }}>14일 토픽 히트맵</h4>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-3)' }}>각 셀은 해당 일의 토픽 활동 강도. 짙을수록 강한 신호.</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)' }}>
              <span>LESS</span>
              {[0,1,2,3,4].map((v) => (
                <span key={v} className="cell" data-v={v} style={{ width: 14, height: 14, display: 'inline-block', borderRadius: 2 }} />
              ))}
              <span>MORE</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {HEATMAP_ROWS.map((label, i) => (
              <div key={i} className="heat">
                <div className="day-lbl">{label}</div>
                {Array.from({ length: 14 }, (_, j) => (
                  <div key={j} className="cell" data-v={denseVal(i, j)} style={{ '--i': i * 14 + j } as React.CSSProperties} />
                ))}
              </div>
            ))}
            <div className="heat" style={{ marginTop: 6 }}>
              <div className="day-lbl" style={{ color: 'var(--text-5)' }}>—</div>
              {heatmapDates.map((d, i) => (
                <div key={i} style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, color: 'var(--text-5)', textAlign: 'center', letterSpacing: '0.04em' }}>{d}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== Mag Latest (client — with working category filter) ===== */
function magTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return '방금 전';
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

const MAG_FILTERS = [
  { label: '전체', cat: null },
  { label: 'AI',   cat: 'AI & 자동화' },
  { label: '개발',  cat: '개발' },
  { label: 'IT',   cat: 'IT 트렌드' },
];

export function MagLatestSection({ posts }: { posts: MagPost[] }) {
  const [active, setActive] = useState<string | null>(null);

  const filtered = active ? posts.filter(p => p.category === active) : posts;
  const big = filtered[0];
  const rest = filtered.slice(1, 7);

  if (!big) return (
    <section className="section">
      <div className="container">
        <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '40px 0' }}>해당 카테고리의 글이 없습니다.</p>
      </div>
    </section>
  );

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
            {MAG_FILTERS.map(f => (
              <button
                key={f.label}
                className={`filter-tab${active === f.cat ? ' active' : ''}`}
                onClick={() => setActive(f.cat)}
              >
                {f.label}
              </button>
            ))}
            <Link href="/archive" className="section-link" style={{ marginLeft: 4 }}>
              아카이브
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="mag-grid">
          <Link className="card card-link mag-card-1" href={`/blog/${big.slug}`}>
            <PostThumb slug={big.slug} title={big.title} coverImage={big.cover_image} category={big.category} />
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
                <span>{magTimeAgo(big.published_at)}</span>
                <span className="dot" />
                <span>AI · EDITED BY HUMAN</span>
              </div>
            </div>
          </Link>

          {rest.map((p) => {
            const tone = catTone(p.category);
            return (
              <Link key={p.id} href={`/blog/${p.slug}`} className="card card-link">
                <PostThumb slug={p.slug} title={p.title} coverImage={p.cover_image} category={p.category} />
                <div className="card-body">
                  <div className="card-meta">
                    <span className={`badge badge-${tone}`}>{p.category}</span>
                  </div>
                  <h3 className="card-title">{p.title}</h3>
                  <p className="card-excerpt">{p.excerpt}</p>
                  <div className="card-foot">
                    <span>{magTimeAgo(p.published_at)}</span>
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

/* ===== Topic Cloud ===== */
export function TopicCloud({ topics }: { topics: TopicItem[] }) {
  return (
    <section className="section">
      <div className="container">
        <div className="sec-head2">
          <div className="left">
            <span className="num">05 / TOPICS</span>
            <div>
              <h2>지금 가장 많이 다루는 주제</h2>
              <p className="sub">크기는 지난 글 수 기준. 클릭하면 해당 태그 페이지로 이동.</p>
            </div>
          </div>
          <Link href="/tags" className="section-link">
            모든 태그
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="cloud-band">
          <div className="cloud-row">
            {topics.map(({ tag, count, size }, i) => (
              <Link
                key={tag}
                href={`/tag/${encodeURIComponent(tag)}`}
                className={`cloud-chip s-${size}`}
                style={{ '--i': i } as React.CSSProperties}
              >
                {tag}
                <span className="n">{count}</span>
              </Link>
            ))}
            {topics.length === 0 && (
              <span style={{ color: 'var(--text-4)', fontSize: 13 }}>태그를 준비 중입니다.</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
