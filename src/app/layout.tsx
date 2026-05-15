import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ThemeProvider from '@/components/ThemeProvider';

const SITE_NAME = 'Synapse. — AI 에디토리얼 매거진';
const SITE_DESC = 'AI가 큐레이션하고 사람이 검수하는 프리미엄 AI 기술 매거진. 매일 아침 발행.';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://synapse.kr';

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | Synapse.` },
  description: SITE_DESC,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: SITE_NAME,
    locale: 'ko_KR',
    type: 'website',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

const MARKET = [
  { l: 'S&P 5,820', v: '+0.4%', c: 'up' },
  { l: 'NVDA', v: '+3.4%', c: 'up' },
  { l: 'AAPL', v: '+1.2%', c: 'up' },
  { l: 'META', v: '−0.8%', c: 'dn' },
  { l: 'SYNAPSE INDEX', v: '+0.8%', c: 'up' },
];

function EditionStrip() {
  return (
    <div className="edition">
      <div className="edition-inner">
        <div className="edition-left">
          <span>SYNAPSE EDITORIAL</span>
          <span className="dim">·</span>
          <span>EST. 2024</span>
        </div>
        <div className="edition-mid">서울 · 매일 06:00 발행</div>
        <div className="edition-right">
          <span>구독 12,400+</span>
          <span className="dim">·</span>
          <span>FIRST WITH AI</span>
        </div>
      </div>
    </div>
  );
}

function TopStrip() {
  return (
    <div className="topstrip">
      <div className="topstrip-inner">
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.06em', whiteSpace: 'nowrap' }}>
          2026.05 · SEOUL 22°
        </div>
        <div className="topstrip-marquee">
          <div className="topstrip-marquee-track">
            {[...MARKET, ...MARKET].map((t, i) => (
              <span key={i}>
                {t.l}{' '}
                <em className={t.c} style={{ fontStyle: 'normal' }}>{t.v}</em>
              </span>
            ))}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', whiteSpace: 'nowrap' }}>
          EDITION 042 / VOL IV
        </div>
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  return (
    <html lang="ko">
      <head>
        {/* Prevent dark mode flash before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t)}catch(e){}` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        {adsenseId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body>
        <ThemeProvider>
          <EditionStrip />
          <TopStrip />
          <Header />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
