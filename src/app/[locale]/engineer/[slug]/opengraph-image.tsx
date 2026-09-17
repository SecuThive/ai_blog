import { ImageResponse } from 'next/og';
import { makeFreshClient } from '@/lib/supabase';

export const revalidate = 86400;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const TONES: Record<string, { accent: string; rgb: string }> = {
  blue:   { accent: '#6E9FFF', rgb: '110,159,255' },
  purple: { accent: '#A87FFF', rgb: '168,127,255' },
  mint:   { accent: '#50D2C2', rgb: '80,210,194' },
  amber:  { accent: '#FFB547', rgb: '255,181,71' },
  rose:   { accent: '#FF6B8A', rgb: '255,107,138' },
  cyan:   { accent: '#38BDF8', rgb: '56,189,248' },
};

function catTone(cat: string): string {
  if (cat.includes('Linux') || cat.includes('Shell')) return 'amber';
  if (cat.includes('Docker') || cat.includes('컨테이너')) return 'cyan';
  if (cat.includes('Git') || cat.includes('CI')) return 'purple';
  if (cat.includes('네트워킹') || cat.includes('서버')) return 'mint';
  if (cat.includes('보안')) return 'rose';
  if (cat.includes('클라우드')) return 'blue';
  if (cat.includes('데이터베이스')) return 'amber';
  return 'blue';
}

const DIFF_LABEL: Record<string, string> = {
  beginner: 'BEGINNER',
  intermediate: 'INTERMEDIATE',
  advanced: 'ADVANCED',
};

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data } = await makeFreshClient()
    .from('engineer_guides')
    .select('title,summary,category,difficulty,tags')
    .eq('slug', decodeURIComponent(slug))
    .eq('status', 'published')
    .single();

  const title      = data?.title      ?? 'Nodelog Engineer';
  const category   = data?.category   ?? '';
  const difficulty = data?.difficulty ?? 'beginner';
  const summary    = data?.summary    ?? '';

  const tone            = catTone(category);
  const { accent, rgb } = TONES[tone];

  const shortTitle   = title.length > 52   ? title.slice(0, 52) + '…'   : title;
  const shortSummary = summary.length > 110 ? summary.slice(0, 110) + '…' : summary;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          background: '#0A0D14',
          fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
          padding: '52px 68px',
          position: 'relative',
        }}
      >
        {/* ambient glow */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          width: 560, height: 420,
          background: `radial-gradient(ellipse at 0% 100%, rgba(${rgb},0.14), transparent 65%)`,
        }} />
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 560, height: 420,
          background: `radial-gradient(ellipse at 100% 0%, rgba(${rgb},0.10), transparent 65%)`,
        }} />

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 'auto' }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${accent}, #5535D4)`,
          }} />
          <span style={{ color: '#E8ECF4', fontSize: 17, fontWeight: 700, letterSpacing: 2 }}>
            NODELOG
          </span>
          <div style={{
            marginLeft: 8, fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
            color: '#4A5568', background: 'rgba(255,255,255,0.04)',
            padding: '4px 12px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)',
          }}>
            ENGINEER GUIDE
          </div>
          {category && (
            <div style={{
              fontSize: 12, fontWeight: 600, letterSpacing: 1,
              color: accent,
              background: `rgba(${rgb},0.12)`,
              padding: '5px 14px', borderRadius: 5,
              border: `1px solid rgba(${rgb},0.28)`,
            }}>
              {category}
            </div>
          )}
        </div>

        {/* title */}
        <div style={{
          fontSize: shortTitle.length > 38 ? 44 : 54,
          fontWeight: 700, color: '#E8ECF4',
          lineHeight: 1.18, letterSpacing: -1.5,
          marginBottom: 20, maxWidth: 980,
        }}>
          {shortTitle}
        </div>

        {/* summary */}
        {shortSummary && (
          <div style={{
            fontSize: 19, color: '#6A7385',
            lineHeight: 1.55, marginBottom: 44,
            maxWidth: 820,
          }}>
            {shortSummary}
          </div>
        )}

        {/* divider */}
        <div style={{
          width: 48, height: 2, marginBottom: 24, marginTop: 'auto',
          background: `linear-gradient(90deg, ${accent}, transparent)`,
        }} />

        {/* footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
            color: accent, background: `rgba(${rgb},0.12)`,
            padding: '4px 10px', borderRadius: 4,
            border: `1px solid rgba(${rgb},0.3)`,
          }}>
            {DIFF_LABEL[difficulty] ?? 'BEGINNER'}
          </div>
          <span style={{ fontSize: 14, color: '#565E72' }}>Nodelog Engineer</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#2E3548', letterSpacing: 2 }}>
            PRACTICAL · HANDS-ON
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
