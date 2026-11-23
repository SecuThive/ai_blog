'use client';

import { trackEvent } from '@/lib/analytics';

export default function AffiliateLink({ href, program, slug, children }: {
  href: string; program: string; slug: string; children: React.ReactNode;
}) {
  return <a href={href} target="_blank" rel="sponsored nofollow noopener"
    onClick={() => trackEvent({ name: 'affiliate_click', program, post_slug: window.location.pathname || `/blog/${slug}`, link_url: href })}>
    {children}
  </a>;
}
