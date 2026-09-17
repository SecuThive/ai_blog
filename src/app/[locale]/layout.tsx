import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { JetBrains_Mono, Source_Serif_4, Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import '../globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Analytics } from '@vercel/analytics/next';
import JsonLd from '@/components/JsonLd';
import ThemeProvider from '@/components/ThemeProvider';
import AdSenseScript from '@/components/AdSenseScript';
import { LocaleProvider } from '@/i18n/provider';
import { isLocale, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/messages';
import { languageAlternates, siteUrl } from '@/i18n/metadata';

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0A0D14' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  return {
    title: { default: dict.meta.siteName, template: `%s | Nodelog` },
    description: dict.meta.siteDesc,
    metadataBase: new URL(SITE_URL),
    authors: [{ name: dict.meta.authors, url: siteUrl('/author', locale) }],
    creator: 'Nodelog',
    publisher: 'Nodelog',
    alternates: {
      canonical: siteUrl('/', locale),
      languages: languageAlternates('/'),
    },
    openGraph: {
      siteName: dict.meta.siteName,
      locale: locale === 'en' ? 'en_US' : 'ko_KR',
      alternateLocale: locale === 'en' ? ['ko_KR'] : ['en_US'],
      type: 'website',
      url: siteUrl('/', locale),
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    },
  };
}

const PRETENDARD_CSS_URL =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css';

const GA_ID = 'G-WL5W341ZFQ';

// 네이버 서치어드바이저 소유 확인 메타 태그 — 값 자체는 페이지 소스에 공개되는 정보지만,
// 계정/사이트마다 달라지는 배포별 설정이므로 코드에 고정하지 않고 환경변수로 주입한다.
// 콤마로 여러 개(예: PC·모바일 속성) 지정 가능. 미설정 시 태그를 출력하지 않는다.
// .env.example 및 docs/SEO_ANALYTICS.md 참고.
const NAVER_CODES = (process.env.NAVER_SITE_VERIFICATION ?? '')
  .split(',')
  .map(code => code.trim())
  .filter(Boolean);

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = getDictionary(locale);
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID ?? 'ca-pub-2091277631590195';
  const adsenseApproved = process.env.NEXT_PUBLIC_ADSENSE_APPROVED === 'true';
  const searchUrl = `${siteUrl('/search', locale)}?q={search_term_string}`;
  return (
    <html lang={locale} className={`${jetbrainsMono.variable} ${sourceSerif4.variable} ${inter.variable}`}>
      <head>
        {/* 신청 중에는 소유 확인을 위해 정적 스니펫을 유지한다. 승인 후 Vercel에서
            NEXT_PUBLIC_ADSENSE_APPROVED=true로 전환하면 아래 AdSenseScript가
            고유 콘텐츠가 충분한 경로에서만 광고를 요청한다. */}
        {!adsenseApproved && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
          />
        )}
        {NAVER_CODES.map(code => (
          <meta key={code} name="naver-site-verification" content={code} />
        ))}
        {/* Pretendard 가변 폰트: cdn.jsdelivr.net 3rd-party CSS를 동기 <link rel="stylesheet">로
            불러오면 렌더링 차단 요청이 되어(폰트 자체는 font-display:swap이어도 CSS 파싱 전에는
            첫 페인트가 지연됨) FCP/LCP를 늦춘다. preconnect로 연결을 미리 열고,
            media=print → load 시 all로 전환하는 표준 비차단 로딩 패턴을 적용한다.
            (noscript로 JS 비활성 환경 폴백 유지) */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link
          id="pretendard-font"
          rel="stylesheet"
          media="print"
          href={PRETENDARD_CSS_URL}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=document.getElementById('pretendard-font');if(!l)return;if(l.sheet){l.media='all';}else{l.addEventListener('load',function(){l.media='all';});}})();`,
          }}
        />
        <noscript>
          <link rel="stylesheet" href={PRETENDARD_CSS_URL} />
        </noscript>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Nodelog RSS Feed"
          href={`${SITE_URL}/rss`}
        />
      </head>
      <body>
        <ThemeProvider>
        <JsonLd data={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Nodelog',
            url: SITE_URL,
            inLanguage: locale,
            potentialAction: {
              '@type': 'SearchAction',
              target: { '@type': 'EntryPoint', urlTemplate: searchUrl },
              'query-input': 'required name=search_term_string',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Nodelog',
            url: SITE_URL,
            logo: `${SITE_URL}/opengraph-image`,
            description: dict.meta.siteDesc,
            sameAs: ['https://github.com/SecuThive'],
            contactPoint: { '@type': 'ContactPoint', contactType: 'editorial', email: 'thive8564@gmail.com' },
          },
        ]} />
        <LocaleProvider locale={locale} dict={dict}>
        <Header />
        <main>{children}</main>
        <Footer />
        </LocaleProvider>
        {adsenseApproved && <AdSenseScript adsenseId={adsenseId} />}
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
