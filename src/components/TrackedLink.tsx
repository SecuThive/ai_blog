'use client';

import Link, { type LinkProps } from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { trackEvent, type AnalyticsEvent } from '@/lib/analytics';

type Props = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    event: AnalyticsEvent;
    children: ReactNode;
  };

/**
 * next/link + 클릭 분석 이벤트. `event`는 문자열/숫자만 담는 순수 데이터라
 * 서버 컴포넌트에서도 그대로 넘겨줄 수 있다(함수 prop이 아니므로 서버→클라이언트
 * 경계를 넘는 데 문제가 없다). analytics가 막혀 있어도 Link 자체는 정상 동작한다.
 */
export default function TrackedLink({ event, children, onClick, ...rest }: Props) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        trackEvent(event);
        onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
}
