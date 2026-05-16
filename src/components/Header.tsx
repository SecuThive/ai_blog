'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  { href: '/', label: '홈' },
  { href: '/category/AI & 자동화', label: 'AI 자동화' },
  { href: '/category/IT 트렌드', label: 'IT 트렌드' },
  { href: '/category/개발', label: '개발' },
  { href: '/category/툴 리뷰', label: '리뷰' },
];

function decode(path: string) {
  try { return decodeURIComponent(path); } catch { return path; }
}

function BrandMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
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

export default function Header() {
  const pathname = usePathname();
  const decoded = decode(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return decoded === '/';
    const dHref = decode(href);
    return decoded === dHref || decoded.startsWith(dHref + '/');
  };

  return (
    <>
      <header className="site-header">
        <div className="container">
          <Link href="/" className="brand">
            <span className="brand-mark"><BrandMark /></span>
            NODELOG
            <span className="brand-tag">BETA</span>
          </Link>

          <nav className="nav-primary">
            {NAV.map(n => (
              <Link key={n.href} href={n.href} className={isActive(n.href) ? 'active' : ''}>
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="header-right">
            <button className="search-trigger" aria-label="검색 (⌘K)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="22" y2="22" />
              </svg>
              검색
              <span className="kbd">⌘K</span>
            </button>
            <button className="btn btn-primary btn-sm">구독하기</button>
            <button className="menu-btn" aria-label="메뉴 열기" onClick={() => setMobileOpen(true)}>
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
        <div className="mobile-nav-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Link href="/" className="brand" onClick={() => setMobileOpen(false)}>
              <span className="brand-mark"><BrandMark /></span>
              NODELOG
            </Link>
            <button className="icon-btn" onClick={() => setMobileOpen(false)} aria-label="닫기">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="mobile-nav-divider" />
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`mobile-nav-item${isActive(n.href) ? ' active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {n.label}
            </Link>
          ))}
          <div className="mobile-nav-divider" />
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 46 }}>
            구독하기
          </button>
        </div>
      )}
    </>
  );
}
