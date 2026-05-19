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

export default function PostThumb({ slug: _slug, title, coverImage, category, className, style }: Props) {
  const tone = catTone(category ?? '');
  const initial = title.trim().charAt(0);

  if (coverImage) {
    return (
      <div className={className ?? `card-thumb thumb-${tone}`} style={{ ...style, position: 'relative' }}>
        <Image
          src={coverImage}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          style={{ objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <div
      className={className ? `${className} thumb-${tone}` : `card-thumb thumb-${tone}`}
      style={style}
    >
      <span style={{
        fontSize: 88,
        fontWeight: 800,
        opacity: 0.09,
        color: 'currentColor',
        lineHeight: 1,
        userSelect: 'none',
        fontFamily: 'var(--ff-serif, Georgia, serif)',
        letterSpacing: -3,
        pointerEvents: 'none',
      }}>
        {initial}
      </span>
    </div>
  );
}
