'use client';

import { useEffect, useRef } from 'react';

type Props = {
  client: string;
  slot?: string;
  format?: 'auto' | 'rectangle';
  minHeight?: number;
  className?: string;
};

export default function AdSlot({ client, slot, format = 'auto', minHeight = 280, className = '' }: Props) {
  const pushed = useRef(false);
  const enabled = /^ca-pub-\d{10,20}$/.test(client) && /^\d{10,}$/.test(slot ?? '');

  useEffect(() => {
    if (!enabled || pushed.current) return;
    const pushIfVisible = () => {
      if (pushed.current) return;
      const element = document.querySelector<HTMLElement>(`[data-ad-slot="${slot}"]`);
      if (!element || element.getClientRects().length === 0) return;
      try {
        const adsWindow = window as typeof window & { adsbygoogle?: Record<string, unknown>[] };
        (adsWindow.adsbygoogle = adsWindow.adsbygoogle || []).push({});
        pushed.current = true;
      } catch {
        // An ad blocker or an account awaiting approval must not interrupt the article.
      }
    };
    pushIfVisible();
    window.addEventListener('resize', pushIfVisible);
    return () => window.removeEventListener('resize', pushIfVisible);
  }, [enabled, slot]);

  if (!enabled) return null;
  return (
    <div className={`ad-slot ${className}`} style={{ minHeight }} aria-label="광고">
      <div className="ad-slot-label">ADVERTISEMENT</div>
      <ins className="adsbygoogle" style={{ display: 'block', width: '100%' }}
        data-ad-client={client} data-ad-slot={slot} data-ad-format={format} data-full-width-responsive="true" />
    </div>
  );
}
