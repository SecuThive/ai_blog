'use client';

import Image from 'next/image';
import { catTone } from '@/lib/utils';
import { useLocale } from '@/i18n/provider';
import { withLocale } from '@/i18n/path';

interface Props {
  slug: string;
  title: string;
  coverImage?: string;
  category?: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
}

export default function PostThumb({ slug, title, coverImage, category, className, style, priority = false }: Props) {
  const locale = useLocale();
  const tone = catTone(category ?? '');
  const imgSrc = coverImage || withLocale(`/blog/${slug}/opengraph-image`, locale);

  return (
    <div className={className ?? `card-thumb thumb-${tone}`} style={{ ...style, position: 'relative' }}>
      <Image
        src={imgSrc}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, 400px"
        style={{ objectFit: 'cover', objectPosition: 'center top' }}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        /* Vercel Image Optimization returns 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED
           on this project (Hobby quota). Serve src directly. */
        unoptimized
      />
    </div>
  );
}
