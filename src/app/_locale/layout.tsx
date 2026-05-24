import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Analytics } from '@vercel/analytics/next';
import JsonLd from '@/components/JsonLd';
import ThemeProvider from '@/components/ThemeProvider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

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
  title: { default: 'Nodelog', template: `%s | Nodelog` },
  metadataBase: new URL(SITE_URL),
  authors: [{ name: 'Nodelog Editorial', url: SITE_URL }],
  creator: 'Nodelog',
  publisher: 'Nodelog',
  openGraph: {
    siteName: 'Nodelog',
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
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as 'ko' | 'en')) {
    notFound();
  }

  const messages = await getMessages();
  const resolvedLocale = await getLocale();

  const SITE_NAME =
    resolvedLocale === 'en'
      ? 'Nodelog — AI-Powered IT Tech Media'
      : 'Nodelog — AI 기반 IT 테크 미디어';
  const SITE_DESC =
    resolvedLocale === 'en'
      ? 'AI-researched and analyzed IT, development, security, and infrastructure media. Daily tech insights.'
      : 'AI가 취재하고 분석하는 IT·개발·보안·인프라 전문 미디어. 매일 최신 기술 인사이트를 전달합니다.';
  const ogLocale = resolvedLocale === 'en' ? 'en_US' : 'ko_KR';

  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  return (
    <html lang={resolvedLocale}>
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
          href={`${SITE_URL}/rss`}
        />
        {resolvedLocale === 'ko' && (
          <link rel="alternate" hrefLang="en" href={`${SITE_URL}/en`} />
        )}
        {resolvedLocale === 'en' && (
          <link rel="alternate" hrefLang="ko" href={SITE_URL} />
        )}
        {adsenseId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body>
        <NextIntlClientProvider messages={messages} locale={resolvedLocale}>
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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

// Suppress unused variable warnings for SITE_NAME/SITE_DESC/ogLocale used in metadata
void (SITE_URL);
