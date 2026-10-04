import Script from 'next/script';
/** Render only after a server page has confirmed that its content exists. */
export default function AdSenseScript() {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  if (process.env.NEXT_PUBLIC_ADSENSE_APPROVED !== 'true' || !/^ca-pub-\d+$/.test(adsenseId ?? '')) return null;
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
