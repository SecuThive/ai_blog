'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useState } from 'react';

const NAV = [
  { href: '/category/AI%20%26%20%EC%9E%90%EB%8F%99%ED%99%94', label: 'AI 도구' },
  { href: '/category/%EA%B0%9C%EB%B0%9C', label: '개발' },
  { href: '/category/%ED%88%B4%20%EB%A6%AC%EB%B7%B0', label: '툴 리뷰' },
  { href: '/category/IT%20%ED%8A%B8%EB%A0%8C%EB%93%9C', label: 'IT 트렌드' },
];

export default function Header() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <Link href="/" className={`nav-link${pathname === '/' ? ' active' : ''}`}>홈</Link>
            {NAV.map(n => (
              <Link key={n.href} href={n.href} className={`nav-link${pathname === n.href ? ' active' : ''}`}>
                {n.label}
              </Link>
            ))}
          </div>

          <Link href="/" className="brand">
            Synapse<span className="brand-dot">.</span>
            <span className="brand-tag">AI · EDITORIAL</span>
          </Link>

          <div className="header-right">
            <button className="icon-btn" aria-label="search" onClick={() => {}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="22" y2="22" />
              </svg>
            </button>
            <button className="icon-btn" aria-label="toggle theme" onClick={toggle}>
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <button className="subscribe-btn desktop-only">구독하기</button>
            <button
              className="icon-btn hamburger-btn"
              aria-label="메뉴 열기"
              onClick={() => setMobileOpen(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="3" y1="7" x2="21" y2="7" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="17" x2="21" y2="17" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="mobile-nav">
          <div className="mobile-nav-head">
            <Link href="/" className="brand" onClick={() => setMobileOpen(false)}>
              Synapse<span className="brand-dot">.</span>
            </Link>
            <button className="icon-btn" aria-label="메뉴 닫기" onClick={() => setMobileOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <nav className="mobile-nav-links">
            <Link href="/" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>홈</Link>
            {NAV.map(n => (
              <Link key={n.href} href={n.href} className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mobile-nav-footer">
            <button className="subscribe-btn" style={{ width: '100%', padding: '14px 20px', fontSize: 14, textAlign: 'center' }}>
              구독하기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
