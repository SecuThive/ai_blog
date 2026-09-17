'use client';

import NextLink from 'next/link';
import type { ComponentProps } from 'react';
import { useLocale } from './provider';
import { withLocale } from './path';

type Props = ComponentProps<typeof NextLink>;

export default function Link({ href, ...rest }: Props) {
  const locale = useLocale();
  const nextHref =
    typeof href === 'string' && href.startsWith('/')
      ? withLocale(href, locale)
      : href;
  return <NextLink href={nextHref} {...rest} />;
}
