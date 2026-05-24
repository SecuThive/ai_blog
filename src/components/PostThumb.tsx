import Image from 'next/image';
import { catTone } from '@/lib/utils';

interface Props {
  slug: string;
  title: string;
  coverImage?: string;
  category?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function PostThumb({ slug, title, coverImage, category, className, style }: Props) {
  const tone = catTone(category ?? '');
  // Always use an image: explicit cover → auto-generated OG image as cover
  const imgSrc = coverImage || `/blog/${slug}/opengraph-image`;

  return (
    <div className={className ?? `card-thumb thumb-${tone}`} style={{ ...style, position: 'relative' }}>
      <Image
        src={imgSrc}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, 400px"
        style={{ objectFit: 'cover', objectPosition: 'center top' }}
        unoptimized={!coverImage} /* OG image route is already optimized */
      />
    </div>
  );
}
