'use client';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  path: string;
  children: ReactNode;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

/** 외부(공식 문서 등) 링크 클릭을 outbound_link_click으로 기록한다. 도메인만 전송(전체 URL·쿼리 미포함). */
export default function TrackedExternalLink({ href, path, children, onClick, ...rest }: Props) {
  return (
    <a
      {...rest}
      href={href}
      onClick={(e) => {
        trackEvent({ name: 'outbound_link_click', path, domain: extractDomain(href) });
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
