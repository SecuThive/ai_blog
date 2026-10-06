'use client';

import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import type { BeforeSendEvent } from '@vercel/analytics/react';
import { usePathname } from 'next/navigation';

const GA_ID = 'G-WL5W341ZFQ';

function filterAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const url = new URL(event.url, window.location.origin);
    if (/^\/(?:ko\/|en\/)?unsubscribe\/?$/.test(url.pathname)) return null;
    url.search = '';
    url.hash = '';
    return { ...event, url: url.toString() };
  } catch {
    return null;
  }
}

export default function SiteAnalytics() {
  const pathname = usePathname() ?? '/';
  // Legacy unsubscribe links contain an email in the query string. Avoid any analytics on this route.
  if (/^\/(?:ko\/|en\/)?unsubscribe\/?$/.test(pathname)) return null;
  return <>
    <Analytics beforeSend={filterAnalyticsEvent} />
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
    <Script id="ga4-init" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}', { page_location: window.location.origin + window.location.pathname });
    `}</Script>
  </>;
}
