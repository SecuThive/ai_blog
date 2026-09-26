'use client';

import Link from '@/i18n/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { catTone } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';
import { useT } from '@/i18n/provider';
import { stripLocale, withLocale } from '@/i18n/path';
import { toKoreanCategory } from '@/i18n/categories';
import { interpolate } from '@/i18n/messages';
import LanguageSwitcher from '@/components/LanguageSwitcher';

function useNav() {
  const { dict } = useT();
  return [
    { href: '/', label: dict.nav.home },
    { href: '/category/AI & 자동화', label: dict.nav.ai },
    { href: '/category/IT 트렌드', label: dict.nav.trends },
    { href: '/category/개발', label: dict.nav.dev },
    { href: '/category/툴 리뷰', label: dict.nav.review },
    { href: '/series', label: dict.nav.series },
    { href: '/engineer', label: dict.nav.engineer },
    { href: '/security', label: dict.nav.security },
  ];
}

function decode(path: string) {
  try { return decodeURIComponent(path); } catch { return path; }
}

function BrandMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="9.5" stroke="url(#bm-g)" strokeWidth="1" strokeDasharray="2.5 3" />
      <circle cx="11" cy="11" r="5.5" fill="url(#bm-f)" />
      <defs>
        <linearGradient id="bm-g" x1="0" y1="0" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6E9FFF" />
          <stop offset="1" stopColor="#A87FFF" />
        </linearGradient>
        <radialGradient id="bm-f" cx="35%" cy="30%" r="65%" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7BB5FF" />
          <stop offset="1" stopColor="#5535D4" />
        </radialGradient>
      </defs>
    </svg>
  );
}

interface SearchResult {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  published_at: string;
  source?: 'post' | 'guide';
}

function SearchModal({ onClose }: { onClose: () => void }) {
  const { dict, locale } = useT();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('searchRecent') ?? '[]');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecent(Array.isArray(stored) ? stored.slice(0, 5) : []);
    } catch { setRecent([]); }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&locale=${locale}`);
        setResults(await res.json());
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q, locale]);

  const saveRecent = (term: string) => {
    if (!term.trim()) return;
    setRecent(prev => {
      const next = [term.trim(), ...prev.filter(t => t !== term.trim())].slice(0, 5);
      localStorage.setItem('searchRecent', JSON.stringify(next));
      return next;
    });
  };

  const goSearch = () => {
    if (q.trim()) saveRecent(q);
    onClose();
    router.push(withLocale(`/search?q=${encodeURIComponent(q)}`, locale));
  };

  const CATS = [
    { href: '/category/AI & 자동화', label: dict.nav.ai, tone: 'blue' },
    { href: '/category/개발', label: dict.nav.dev, tone: 'mint' },
    { href: '/category/IT 트렌드', label: dict.nav.trends, tone: 'purple' },
    { href: '/category/툴 리뷰', label: dict.nav.review, tone: 'amber' },
  ];

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-input-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={dict.search.placeholder}
            onKeyDown={e => { if (e.key === 'Enter' && q) goSearch(); }}
            style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', color: 'var(--text-1)', fontSize: 16 }}
          />
          <span className="kbd">ESC</span>
        </div>

        {!q && (
          <>
            <div className="search-section-title">{dict.search.recentSearches}</div>
            {recent.length > 0 ? recent.map(t => (
              <div key={t} className="search-result" onClick={() => setQ(t)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-4)', flexShrink: 0, marginTop: 2 }}>
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span style={{ fontSize: 14, color: 'var(--text-2)' }}>{t}</span>
              </div>
            )) : (
              <div style={{ padding: '10px 18px', color: 'var(--text-4)', fontSize: 13 }}>{dict.search.noHistory}</div>
            )}
            <div className="search-section-title">{dict.search.popularCats}</div>
            {CATS.map(c => (
              <Link key={c.href} href={c.href} className="search-result" onClick={onClose}>
                <span className={`badge badge-${c.tone}`} style={{ flexShrink: 0 }}>{c.label}</span>
                <span style={{ fontSize: 14, color: 'var(--text-1)', flex: 1 }}>{c.label}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-4)' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </>
        )}

        {q && (
          <>
            <div className="search-section-title">
              {loading ? dict.search.searching : interpolate(dict.search.results, { count: results.length })}
            </div>
            {results.map(p => {
              const href = p.source === 'guide' ? `/engineer/${p.slug}` : `/blog/${p.slug}`;
              return (
                <Link key={`${p.source}-${p.id}`} href={href} className="search-result" onClick={() => { saveRecent(q); onClose(); }}>
                  <span className={`badge badge-${catTone(p.category)}`} style={{ flexShrink: 0 }}>{p.category}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.4 }}>{p.title}</div>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', marginTop: 3 }}>
                      {p.source === 'guide' ? 'ENGINEER GUIDE' : p.category}
                    </div>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-4)', flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              );
            })}
            {results.length === 0 && !loading && (
              <div style={{ padding: '20px 18px', color: 'var(--text-3)', fontSize: 14 }}>
                {interpolate(dict.search.noResults, { q })}
              </div>
            )}
            <div className="search-result" onClick={goSearch} style={{ borderTop: '1px solid var(--line-1)', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--acc-blue)', flexShrink: 0 }}>
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
              <span style={{ flex: 1, color: 'var(--acc-blue)', fontSize: 14 }}>
                {interpolate(dict.search.viewAll, { q })}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Header() {
  const { dict } = useT();
  const NAV = useNav();
  const pathname = usePathname();
  const decoded = decode(stripLocale(pathname ?? '/'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, toggle } = useTheme();

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSearch]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const normalize = (path: string) => {
    const m = path.match(/^\/category\/(.+)$/);
    if (!m) return path;
    return `/category/${toKoreanCategory(m[1])}`;
  };

  const isActive = (href: string) => {
    const current = normalize(decoded);
    const target = normalize(decode(href));
    if (target === '/') return current === '/';
    return current === target || current.startsWith(target + '/');
  };

  return (
    <>
      <header className="site-header">
        <div className="global-nav-row">
          <nav className="container global-nav" aria-label="THIVELAB products">
            <Link href="/" className="global-nav-parent">THIVELAB</Link>
            <Link href="/" className="global-nav-current" aria-current="page">NODELOG</Link>
            <a href="https://game.thivelab.com/" target="_blank" rel="noopener noreferrer">CIPHER <span aria-hidden="true">↗</span></a>
            <span className="global-nav-pending" title="Coming soon">LABS <small>SOON</small></span>
            <span className="global-nav-pending" title="Coming soon">ENTERPRISE <small>SOON</small></span>
          </nav>
        </div>
        <div className="container">
          <Link href="/" className="brand" aria-label="NODELOG by THIVELAB home">
            <span className="brand-mark"><BrandMark /></span>
            <span>NODELOG <span className="brand-by">by THIVELAB</span></span>
          </Link>

          <nav className="nav-primary" aria-label="NODELOG topics">
            {NAV.map(n => (
              <Link key={n.href} href={n.href} className={isActive(n.href) ? 'active' : ''}>
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="header-right">
            <button className="search-trigger" aria-label={dict.search.shortcut} onClick={openSearch}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" />
              </svg>
              {dict.nav.search}
              <span className="kbd">⌘K</span>
            </button>
            <LanguageSwitcher />
            <button
              className="theme-toggle"
              onClick={toggle}
              aria-label={theme === 'dark' ? dict.theme.toLightMode : dict.theme.toDarkMode}
              title={theme === 'dark' ? dict.theme.lightMode : dict.theme.darkMode}
            >
              {theme === 'dark' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <Link href="/subscribe" className="btn btn-primary btn-sm">{dict.nav.subscribe}</Link>
            <button className="menu-btn" aria-label={dict.nav.openMenu} onClick={() => setMobileOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {searchOpen && <SearchModal onClose={closeSearch} />}

      {mobileOpen && (
        <div className="mobile-nav-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Link href="/" className="brand" onClick={() => setMobileOpen(false)}>
              <span className="brand-mark"><BrandMark /></span>
              <span>NODELOG <span className="brand-by">by THIVELAB</span></span>
            </Link>
            <button className="icon-btn" onClick={() => setMobileOpen(false)} aria-label={dict.nav.close}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <button className="search-trigger" style={{ width: '100%', minWidth: 'unset', marginBottom: 8 }} onClick={() => { setMobileOpen(false); openSearch(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" />
            </svg>
            {dict.nav.search}
          </button>
          <div className="mobile-lang-row">
            <span>{dict.lang.label}</span>
            <LanguageSwitcher />
          </div>
          <div className="mobile-nav-divider" />
          <div className="mobile-nav-heading">THIVELAB</div>
          <a href="https://game.thivelab.com/" className="mobile-nav-item" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}>CIPHER ↗</a>
          <div className="mobile-nav-item mobile-nav-pending">LABS <span>SOON</span></div>
          <div className="mobile-nav-item mobile-nav-pending">ENTERPRISE <span>SOON</span></div>
          <div className="mobile-nav-divider" />
          <div className="mobile-nav-heading">NODELOG</div>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className={`mobile-nav-item${isActive(n.href) ? ' active' : ''}`} onClick={() => setMobileOpen(false)}>
              {n.label}
            </Link>
          ))}
          <Link href="/tags" className="mobile-nav-item" onClick={() => setMobileOpen(false)}>{dict.nav.tags}</Link>
          <Link href="/archive" className="mobile-nav-item" onClick={() => setMobileOpen(false)}>{dict.nav.archive}</Link>
          <Link href="/trending" className="mobile-nav-item" onClick={() => setMobileOpen(false)}>{dict.nav.trending}</Link>
          <Link href="/bookmarks" className="mobile-nav-item" onClick={() => setMobileOpen(false)}>{dict.nav.bookmarks}</Link>
          <Link href="/about" className="mobile-nav-item" onClick={() => setMobileOpen(false)}>{dict.nav.about}</Link>
          <div className="mobile-nav-divider" />
          <Link href="/subscribe" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 46 }} onClick={() => setMobileOpen(false)}>
            {dict.nav.subscribe}
          </Link>
        </div>
      )}
    </>
  );
}
