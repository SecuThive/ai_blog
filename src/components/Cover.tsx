interface CoverProps {
  hue?: number;
  mark?: string;
  kicker?: string;
  label?: string;
  shape?: 'hero' | 'card' | 'article' | 'banner';
}

const CATEGORY_HUES: Record<string, number> = {
  'AI & 자동화': 32,
  '개발': 220,
  '툴 리뷰': 55,
  'IT 트렌드': 148,
  '보안': 345,
  '인프라': 195,
};

export function categoryHue(category: string): number {
  return CATEGORY_HUES[category] ?? 32;
}

export default function Cover({ hue = 32, mark = '·', kicker = 'FEATURE', label = 'SYNAPSE', shape = 'card' }: CoverProps) {
  const cls = `cover ${shape === 'hero' ? 'hero-cover' : shape === 'article' ? 'article-cover' : shape === 'banner' ? 'banner-cover' : 'card-cover'}`;
  return (
    <div className={cls} style={{ '--hue': hue } as React.CSSProperties}>
      {/* SVG grid pattern overlay */}
      <svg className="cover-grid" aria-hidden="true" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`grid-${hue}-${shape}`} width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.18" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${hue}-${shape})`} />
        {/* Diagonal accent line */}
        <line x1="0" y1="100%" x2="100%" y2="0" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
      </svg>

      <div className="cover-rule-top" />
      <div className="cover-rule-bot" />
      <div className="cover-arc" />
      <div className="cover-arc cover-arc-2" />
      <div className="cover-numeral">{mark || '·'}</div>
      <div className="cover-meta-top">
        <span>{kicker}</span>
        <span>SYNAPSE</span>
      </div>
      <div className="cover-meta-bottom">
        <span>{label}</span>
        <span>VOL·IV</span>
      </div>
    </div>
  );
}
