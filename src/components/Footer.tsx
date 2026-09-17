'use client';

import Link from '@/i18n/link';
import { useT } from '@/i18n/provider';

export default function Footer() {
  const { dict } = useT();
  return (
    <footer className="site-footer">
      <div className="container">
        {/* Brand column */}
        <div className="footer-col footer-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 15, letterSpacing: '-0.02em' }}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="9.5" stroke="url(#ff-g)" strokeWidth="1" strokeDasharray="2.5 3" />
              <circle cx="11" cy="11" r="5.5" fill="url(#ff-f)" />
              <defs>
                <linearGradient id="ff-g" x1="0" y1="0" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6E9FFF" /><stop offset="1" stopColor="#A87FFF" />
                </linearGradient>
                <radialGradient id="ff-f" cx="35%" cy="30%" r="65%" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7BB5FF" /><stop offset="1" stopColor="#5535D4" />
                </radialGradient>
              </defs>
            </svg>
            NODELOG
          </div>
          <p>{dict.footer.description}</p>
          <div className="footer-social">
            <a href="https://github.com/SecuThive" target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="GitHub">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </a>
            <a href="/rss" className="icon-btn" aria-label="RSS">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" />
                <circle cx="5" cy="19" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
          </div>
        </div>

        {/* Topic column */}
        <div className="footer-col">
          <h5>{dict.footer.topics}</h5>
          <ul>
            <li><Link href="/category/AI & 자동화">{dict.nav.ai}</Link></li>
            <li><Link href="/category/IT 트렌드">{dict.nav.trends}</Link></li>
            <li><Link href="/category/개발">{dict.nav.dev}</Link></li>
            <li><Link href="/category/툴 리뷰">{dict.nav.review}</Link></li>
          </ul>
        </div>

        {/* Navigation column */}
        <div className="footer-col">
          <h5>{dict.footer.navigation}</h5>
          <ul>
            <li><Link href="/trending">{dict.nav.trending}</Link></li>
            <li><Link href="/series">{dict.nav.series}</Link></li>
            <li><Link href="/engineer">{dict.nav.engineer}</Link></li>
            <li><Link href="/tags">{dict.footer.tagList}</Link></li>
            <li><Link href="/archive">{dict.nav.archive}</Link></li>
          </ul>
        </div>

        {/* About column */}
        <div className="footer-col">
          <h5>{dict.footer.about}</h5>
          <ul>
            <li><Link href="/about">{dict.footer.intro}</Link></li>
            <li><Link href="/author">{dict.footer.editPolicy}</Link></li>
            <li><Link href="/faq">{dict.footer.faq}</Link></li>
            <li><Link href="/contact">{dict.footer.contact}</Link></li>
          </ul>
        </div>

        {/* Legal column */}
        <div className="footer-col">
          <h5>{dict.footer.legal}</h5>
          <ul>
            <li><Link href="/terms">{dict.footer.terms}</Link></li>
            <li><Link href="/privacy">{dict.footer.privacy}</Link></li>
            <li><Link href="/policy">{dict.footer.policy}</Link></li>
            <li><a href="/rss">RSS</a></li>
          </ul>
        </div>

        {/* Full-width bottom row */}
        <div className="footer-bottom" style={{ gridColumn: '1 / -1' }}>
          <div className="footer-status">
            <span className="live-dot" />
            © 2026 NODELOG · EDITORIAL REVIEW
          </div>
          <div>SEOUL · CONTINUOUSLY UPDATED</div>
        </div>
      </div>
    </footer>
  );
}
