interface Props {
  slug: string;
  title: string;
  coverImage?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function PostThumb({ slug, title, coverImage, className = 'card-thumb', style }: Props) {
  const src = coverImage ?? `/blog/${encodeURIComponent(slug)}/opengraph-image`;
  return (
    <div className={className} style={{ ...style, position: 'relative' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={title}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        loading="lazy"
      />
    </div>
  );
}
