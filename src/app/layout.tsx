import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Analytics } from '@vercel/analytics/next';

const SITE_NAME = 'Nodelog — AI 기반 IT 테크 미디어';
const SITE_DESC = 'AI가 취재하고 분석하는 IT·개발·보안·인프라 전문 미디어. 매일 최신 기술 인사이트를 전달합니다.';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nodelog.kr';

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | Nodelog` },
  description: SITE_DESC,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: SITE_NAME,
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Inter:wght@400;500;600&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
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
        <Header />
        <main>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
