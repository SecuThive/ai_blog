'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

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
const TICKS = [
  { t: 'AI',  l: 'GPT-5 Turbo 추론 비용 -28% 발표',           src: 'openai.com' },
  { t: 'DEV', l: 'React 19.2 — Compiler 안정화 단계 진입',      src: 'react.dev' },
  { t: 'INF', l: 'Postgres 17.2 — INCREMENTAL BACKUP GA',       src: 'postgresql.org' },
  { t: 'SEC', l: 'Anthropic, MCP 보안 가이드라인 v1.0 발행',    src: 'anthropic.com' },
  { t: 'PRO', l: 'Linear, AI Agent 워크플로우 베타 공개',        src: 'linear.app' },
];

export function TickerBar() {
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
    const id = setInterval(() => setIdx((v) => (v + 1) % TICKS.length), 3200);
    return () => clearInterval(id);
  }, []);

  const cur = TICKS[idx];
  return (
    <div className="heroX-top">
      <span className="live-dot" />
      <span>LIVE INDEX</span>
      <span className="sep">·</span>
      <span className="v">{timeStr}</span>
      <span className="sep">·</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span className="feed-tag" style={{ fontSize: 9.5 }}>{cur.t}</span>
        <span style={{ color: 'var(--text-2)' }}>{cur.l}</span>
        <span style={{ color: 'var(--text-4)' }}>· {cur.src}</span>
      </span>
      <span style={{ marginLeft: 'auto', color: 'var(--text-4)' }}>SIGNAL · NOMINAL</span>
    </div>
  );
}

/* ===== AI Control Panel ===== */
const FEED = [
  { t: '02:14', tag: 'AI',  l: 'gpt-5 추론 비용 감소',       src: 'openai.com' },
  { t: '02:11', tag: 'INF', l: 'postgres 17.2 릴리스',        src: 'postgresql.org' },
  { t: '02:08', tag: 'DEV', l: 'react 19.2 compiler',         src: 'react.dev' },
  { t: '02:04', tag: 'SEC', l: 'mcp 보안 가이드 v1',           src: 'anthropic.com' },
  { t: '02:00', tag: 'PRO', l: 'linear agent beta',            src: 'linear.app' },
];
const TOPIC_BARS = [
  { name: 'AI · MCP',    barW: '92%', pct: '312%', tone: '' },
  { name: '인프라',       barW: '68%', pct: '148%', tone: 't-amber' },
  { name: '개발 · React', barW: '54%', pct: '96%',  tone: 't-mint' },
  { name: '보안',         barW: '34%', pct: '42%',  tone: 't-rose' },
];

export function ControlPanel() {
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
            {FEED.map((f, i) => (
              <li key={i} className="feed-item">
                <span className="feed-time">{f.t}</span>
                <span>
                  <span className="feed-tag" style={{ marginRight: 8 }}>{f.tag}</span>
                  <span className="feed-label">{f.l}</span>
                </span>
                <span className="feed-source">{f.src}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="ctrl-section">
          <h6>TOPIC ACTIVITY · 24H</h6>
          <div className="topic-bars">
            {TOPIC_BARS.map((bar, i) => (
              <div
                key={i}
                className={`topic-bar${bar.tone ? ' ' + bar.tone : ''}`}
                style={{ '--bar-w': bar.barW } as React.CSSProperties}
              >
                <span className="name">{bar.name}</span>
                <div className="track"><div className="fill" /></div>
                <span className="pct">{bar.pct}</span>
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
const HEATMAP_ROWS = [
  'AI 자동화', '개발', '인프라', '보안', '생산성',
];

function denseVal(i: number, j: number) {
  const seed = (i * 31 + j * 7) % 13;
  if (j > 10) return Math.min(4, (seed % 5) + 1);
  return seed % 5;
}

export function SignalDashboard() {
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
          {/* MCP */}
          <div className="signal-card">
            <div className="signal-head">
              <span className="signal-eye">TOP MOVER · 24H</span>
              <span className="signal-delta up">↑ +312%</span>
            </div>
            <div>
              <div className="signal-num">MCP</div>
              <div className="label" style={{ marginTop: 6 }}>Model Context Protocol</div>
            </div>
            <p className="desc">
              Anthropic의 표준이 빠르게 확산 중. 48개 회사가 자체 MCP 어댑터를 공개했고, 이 중 22개는 엔터프라이즈향이다.
            </p>
            <div className="spark">
              {[20,30,25,40,35,50,60,55,70,65,80,90,100,95].map((h, i) => (
                <span key={i} className="blue" style={{ height: h + '%', '--i': i } as React.CSSProperties} />
              ))}
            </div>
          </div>

          {/* PG17 */}
          <div className="signal-card">
            <div className="signal-head">
              <span className="signal-eye">RISING · 24H</span>
              <span className="signal-delta up">↑ +148%</span>
            </div>
            <div>
              <div className="signal-num">PG17</div>
              <div className="label" style={{ marginTop: 6 }}>Postgres 17 · Incremental Backup</div>
            </div>
            <p className="desc">
              대용량 DB의 백업 시간을 평균 1/8로 줄이는 새 기능. 실제 도입 사례가 4개 회사에서 동시에 공개됐다.
            </p>
            <div className="spark">
              {[10,18,22,28,25,35,40,45,55,60,70,75,85,92].map((h, i) => (
                <span key={i} className="mint" style={{ height: h + '%', '--i': i } as React.CSSProperties} />
              ))}
            </div>
          </div>

          {/* CURSOR */}
          <div className="signal-card">
            <div className="signal-head">
              <span className="signal-eye">SLOW BURN · 14D</span>
              <span className="signal-delta up">↑ +96%</span>
            </div>
            <div>
              <div className="signal-num">CURSOR</div>
              <div className="label" style={{ marginTop: 6 }}>AI Code Editors</div>
            </div>
            <p className="desc">
              Cursor·Zed·Helix 3파전. 검색량은 Cursor가 우세하지만, 깊이 있는 글의 완독률은 Zed가 +24%.
            </p>
            <div className="spark">
              {[35,42,38,50,45,55,60,58,65,72,70,80,85,88].map((h, i) => (
                <span key={i} className="purple" style={{ height: h + '%', '--i': i } as React.CSSProperties} />
              ))}
            </div>
          </div>
        </div>

        {/* Heatmap */}
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
              {['05.04','','','05.07','','','05.10','','','05.13','','','','05.17'].map((d, i) => (
                <div key={i} style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, color: 'var(--text-5)', textAlign: 'center', letterSpacing: '0.04em' }}>{d}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== Topic Cloud ===== */
const TOPICS: [string, number][] = [
  ['GPT-5', 5], ['Claude', 4], ['MCP', 5], ['Agent', 4],
  ['React 19', 4], ['Cursor', 3], ['Postgres', 3], ['Edge', 3],
  ['WASM', 2], ['Passkey', 2], ['Notion', 2], ['Linear', 2],
  ['RAG', 2], ['Embeddings', 1], ['Cloudflare', 1], ['AWS', 1],
  ['TypeScript', 3], ['Whisper', 1], ['CI/CD', 1], ['Tauri', 1],
  ['Kubernetes', 2], ['LLM', 4], ['OWASP', 1], ['Auth', 1],
];

export function TopicCloud() {
  return (
    <section className="section">
      <div className="container">
        <div className="sec-head2">
          <div className="left">
            <span className="num">05 / TOPICS</span>
            <div>
              <h2>지금 가장 많이 다루는 주제</h2>
              <p className="sub">크기는 지난 30일 글 수 + 검색 빈도의 가중치. 클릭하면 해당 태그 페이지로 이동.</p>
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
            {TOPICS.map(([label, size], i) => (
              <Link
                key={label}
                href={`/tag/${encodeURIComponent(label)}`}
                className={`cloud-chip s-${size}`}
                style={{ '--i': i } as React.CSSProperties}
              >
                {label}
                <span className="n">{Math.floor(size * 60 + ((i * 17 + 7) % 30))}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
