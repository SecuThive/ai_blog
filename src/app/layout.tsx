import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Analytics } from '@vercel/analytics/next';
import JsonLd from '@/components/JsonLd';
import ThemeProvider from '@/components/ThemeProvider';

const SITE_NAME = 'Nodelog — AI 기반 IT 테크 미디어';
const SITE_DESC = 'AI가 취재하고 분석하는 IT·개발·보안·인프라 전문 미디어. 매일 최신 기술 인사이트를 전달합니다.';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0A0D14' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
};

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | Nodelog` },
  description: SITE_DESC,
  metadataBase: new URL(SITE_URL),
  authors: [{ name: 'Nodelog Editorial', url: SITE_URL }],
  creator: 'Nodelog',
  publisher: 'Nodelog',
  openGraph: {
    siteName: SITE_NAME,
    locale: 'ko_KR',
    type: 'website',
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@nodelog',
    creator: '@nodelog',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  verification: {
    // google: 'your-google-site-verification-code', // ← 구글 서치 콘솔 연동 시 추가
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  return (
    <html lang="ko">
      <head>
        {/* eslint-disable @next/next/no-page-custom-font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Inter:wght@400;500;600&display=swap"
        />
        {/* eslint-enable @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Nodelog RSS Feed"
          href={`${SITE_URL}/rss.xml`}
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
        <JsonLd data={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Nodelog',
            url: SITE_URL,
            potentialAction: {
              '@type': 'SearchAction',
              target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
              'query-input': 'required name=search_term_string',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Nodelog',
            url: SITE_URL,
            logo: `${SITE_URL}/opengraph-image`,
            description: SITE_DESC,
            sameAs: ['https://github.com/SecuThive'],
            contactPoint: { '@type': 'ContactPoint', contactType: 'editorial', email: 'thive8564@gmail.com' },
          },
        ]} />
        <Header />
        <main>{children}</main>
        <Footer />
        <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
