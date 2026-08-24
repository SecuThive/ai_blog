import Image from 'next/image';
import { catTone } from '@/lib/utils';

interface Props {
  slug: string;
  title: string;
  coverImage?: string;
  category?: string;
  className?: string;
  style?: React.CSSProperties;
  /** LCP 후보로 쓰이는 최상단 썸네일(예: 홈 헤드라인)에만 true로 전달 —
   *  next/image의 lazy loading을 끄고 fetchpriority=high로 우선 로드한다. */
  priority?: boolean;
}

export default function PostThumb({ slug, title, coverImage, category, className, style, priority = false }: Props) {
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
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        /* OG 이미지 경로도 same-origin 정적 라우트이므로 next/image 최적화(AVIF/WebP 리사이즈)를
           그대로 태워 보낸다 — 1200x630 원본 PNG를 카드 썸네일에 그대로 내려보내던
           과전송(enormous payload)을 없앤다. */
      />
    </div>
  );
}
