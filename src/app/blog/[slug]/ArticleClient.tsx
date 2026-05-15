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

  return <div className="progress" style={{ width: `${width}%` }} />;
}

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const els = headings.map(h => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveId(e.target.id); });
      },
      { rootMargin: '-20% 0% -70% 0%' }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  return (
    <nav className="article-toc">
      <div className="toc-h">목차</div>
      {headings.map(h => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className={`toc-item${h.level === 3 ? ' level-3' : ''}${activeId === h.id ? ' active' : ''}`}
          onClick={e => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' }); }}
        >
          <span className="toc-item-n">{String(h.index + 1).padStart(2, '0')}</span>
          <span style={{ lineHeight: 1.3 }}>{h.text}</span>
        </a>
      ))}
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
    <button className="action-btn" onClick={copy}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
      try {
        await navigator.share({ title: document.title, url: window.location.href });
      } catch {
        // user cancelled — no-op
      }
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setLabel('URL 복사됨!');
        setTimeout(() => setLabel('공유하기'), 2000);
      });
    }
  };

  return (
    <button type="button" className="action-btn" onClick={share}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
      {label}
    </button>
  );
}
