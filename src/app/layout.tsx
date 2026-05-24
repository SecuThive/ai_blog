import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { JetBrains_Mono, Source_Serif_4, Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Analytics } from '@vercel/analytics/next';
import JsonLd from '@/components/JsonLd';
import ThemeProvider from '@/components/ThemeProvider';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-source-serif-4',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

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
    // google: '', // ← 구글 서치 콘솔 연동 시 추가
  },
};

const GA_ID = 'G-3WP9Z4DEFH';

const NAVER_CODES = [
  '5bd307f95964d7e0787d21b5763b18401597a1b7',
  '2304805a68feee778fe525cc3932b9437163b03f',
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  return (
    <html lang="ko" className={`${jetbrainsMono.variable} ${sourceSerif4.variable} ${inter.variable}`}>
      <head>
        {NAVER_CODES.map(code => (
          <meta key={code} name="naver-site-verification" content={code} />
        ))}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Nodelog RSS Feed"
          href={`${SITE_URL}/rss`}
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
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
      </body>
    </html>
  );
}
