interface CoverProps {
  hue?: number;
  mark?: string;
  kicker?: string;
  label?: string;
  shape?: 'hero' | 'card' | 'article';
}

const CATEGORY_HUES: Record<string, number> = {
  'AI & 자동화': 32,
  '개발': 220,
  '툴 리뷰': 55,
  'IT 트렌드': 148,
};

export function categoryHue(category: string): number {
  return CATEGORY_HUES[category] ?? 32;
}

export default function Cover({ hue = 32, mark = '·', kicker = 'FEATURE', label = 'SYNAPSE', shape = 'card' }: CoverProps) {
  const cls = `cover ${shape === 'hero' ? 'hero-cover' : shape === 'article' ? 'article-cover' : 'card-cover'}`;
  return (
    <div className={cls} style={{ '--hue': hue } as React.CSSProperties}>
      <div className="cover-rule-top" />
      <div className="cover-rule-bot" />
      <div className="cover-arc" />
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
