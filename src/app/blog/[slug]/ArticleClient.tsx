'use client';

import { useEffect, useState } from 'react';

interface Heading { id: string; text: string; index: number; level: number; }

export function ProgressBar() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const progress = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setWidth(Math.min(100, Math.max(0, progress)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return <div className="read-progress" style={{ width: `${width}%` }} />;
}

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const els = headings.map(h => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const observer = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setActiveId(e.target.id); }); },
      { rootMargin: '-20% 0% -70% 0%' }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  return (
    <nav className="toc-rail">
      <div className="toc-title">목차</div>
      <ul className="toc-list">
        {headings.map(h => (
          <li
            key={h.id}
            className={`${h.level === 3 ? 'h3' : ''}${activeId === h.id ? ' active' : ''}`}
            onClick={() => document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' })}
          >
            {h.text}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function ScrollToTopBtn() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      className="scroll-top-btn"
      aria-label="맨 위로"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      ↑
    </button>
  );
}

export function CopyLinkBtn() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button className="action-btn" onClick={copy} aria-label="링크 복사">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      {copied ? '복사됨!' : '링크 복사'}
    </button>
  );
}

export function ShareBtn() {
  const [label, setLabel] = useState('공유하기');

  const share = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: document.title, url: window.location.href }); } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setLabel('URL 복사됨!');
        setTimeout(() => setLabel('공유하기'), 2000);
      });
    }
  };

  return (
    <button type="button" className="action-btn" onClick={share} aria-label="공유하기">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
      {label}
    </button>
  );
}

export function ArticleFeedback({ postSlug }: { postSlug: string }) {
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`feedback_${postSlug}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === 'up' || saved === 'down') setVoted(saved);
  }, [postSlug]);

  const vote = async (type: 'up' | 'down') => {
    const next = voted === type ? null : type;
    setVoted(next);
    if (next) {
      localStorage.setItem(`feedback_${postSlug}`, next);
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_slug: postSlug, type: next }),
      }).catch(() => {});
    } else {
      localStorage.removeItem(`feedback_${postSlug}`);
    }
  };

  return (
    <div className="article-feedback">
      <span className="feedback-label">이 글이 도움이 되었나요?</span>
      <button
        className={`feedback-btn${voted === 'up' ? ' liked' : ''}`}
        onClick={() => vote('up')}
        aria-label="이 글이 도움됨"
        aria-pressed={voted === 'up'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        도움됨
      </button>
      <button
        className={`feedback-btn${voted === 'down' ? ' disliked' : ''}`}
        onClick={() => vote('down')}
        aria-label="이 글이 아쉬움"
        aria-pressed={voted === 'down'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
          <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
        </svg>
        아쉬움
      </button>
    </div>
  );
}

export function MobileActionBar() {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const share = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: document.title, url: window.location.href }); } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      });
    }
  };

  return (
    <div className="mobile-action-bar">
      <button className="action-btn" onClick={copy} aria-label="링크 복사">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        {copied ? '복사됨!' : '링크 복사'}
      </button>
      <button className="action-btn" onClick={share} aria-label="공유하기">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        {shared ? '공유됨!' : '공유하기'}
      </button>
      <button className="action-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="맨 위로 이동">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <polyline points="18 15 12 9 6 15" />
        </svg>
        맨 위로
      </button>
    </div>
  );
}
