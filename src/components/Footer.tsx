import Link from 'next/link';

export default function Footer() {
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
          <p>AI가 취재하고 분석하는 IT·개발·보안·인프라 전문 미디어. 매일 최신 기술 인사이트를 전달합니다.</p>
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
          <h5>주제</h5>
          <ul>
            <li><Link href="/category/AI & 자동화">AI 자동화</Link></li>
            <li><Link href="/category/IT 트렌드">IT 트렌드</Link></li>
            <li><Link href="/category/개발">개발</Link></li>
            <li><Link href="/category/툴 리뷰">리뷰</Link></li>
          </ul>
        </div>

        {/* Navigation column */}
        <div className="footer-col">
          <h5>탐색</h5>
          <ul>
            <li><Link href="/trending">트렌딩</Link></li>
            <li><Link href="/series">시리즈</Link></li>
            <li><Link href="/engineer">엔지니어</Link></li>
            <li><Link href="/tags">태그 목록</Link></li>
            <li><Link href="/archive">아카이브</Link></li>
          </ul>
        </div>

        {/* About column */}
        <div className="footer-col">
          <h5>About</h5>
          <ul>
            <li><Link href="/about">소개</Link></li>
            <li><Link href="/author">편집 원칙</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/contact">문의 · 제휴</Link></li>
          </ul>
        </div>

        {/* Legal column */}
        <div className="footer-col">
          <h5>법적 고지</h5>
          <ul>
            <li><Link href="/terms">이용안내</Link></li>
            <li><Link href="/privacy">개인정보 처리방침</Link></li>
            <li><Link href="/policy">편집 정책</Link></li>
            <li><a href="/rss">RSS</a></li>
          </ul>
        </div>

        {/* Full-width bottom row */}
        <div className="footer-bottom" style={{ gridColumn: '1 / -1' }}>
          <div className="footer-status">
            <span className="live-dot" />
            © 2026 NODELOG · POWERED BY AI-DRIVEN IT RESEARCH
          </div>
          <div>EST. 2024 · SEOUL · DAILY UPDATES</div>
        </div>
      </div>
    </footer>
  );
}
