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
};

function catTone(cat: string): string {
  if (cat.includes('AI') || cat.includes('자동화')) return 'blue';
  if (cat.includes('트렌드') || cat.includes('IT')) return 'purple';
  if (cat.includes('개발') || cat.includes('인프라')) return 'mint';
  if (cat.includes('툴') || cat.includes('리뷰')) return 'amber';
  if (cat.includes('보안')) return 'rose';
  return 'blue';
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const { data } = await makeFreshClient()
    .from('posts')
    .select('title,excerpt,category,author,content')
    .eq('slug', decoded)
    .eq('status', 'published')
    .single();

  const title    = data?.title    ?? 'Nodelog';
  const category = data?.category ?? '';
  const author   = data?.author   ?? 'AI Editorial';
  const excerpt  = data?.excerpt  ?? '';
  const mins = Math.max(1, Math.round(((data?.content ?? '').trim().split(/\s+/).length) / 200));

  const tone            = catTone(category);
  const { accent, rgb } = TONES[tone];

  const initials   = author.replace(/[^a-zA-Z가-힣]/g, '').slice(0, 2).toUpperCase() || 'AI';
  const shortTitle   = title.length > 50   ? title.slice(0, 50) + '…'   : title;
  const shortExcerpt = excerpt.length > 115 ? excerpt.slice(0, 115) + '…' : excerpt;

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
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 560, height: 420,
          background: `radial-gradient(ellipse at 100% 0%, rgba(${rgb},0.10), transparent 65%)`,
          pointerEvents: 'none',
        }} />

        {/* header: logo + category badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 'auto' }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${accent}, #5535D4)`,
          }} />
          <span style={{ color: '#E8ECF4', fontSize: 17, fontWeight: 700, letterSpacing: 2 }}>
            NODELOG
          </span>
          {category && (
            <div style={{
              marginLeft: 12, fontSize: 12, fontWeight: 600, letterSpacing: 1,
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
          fontSize: shortTitle.length > 36 ? 46 : 56,
          fontWeight: 700, color: '#E8ECF4',
          lineHeight: 1.18, letterSpacing: -1.5,
          marginBottom: 20, maxWidth: 960,
        }}>
          {shortTitle}
        </div>

        {/* excerpt */}
        {shortExcerpt && (
          <div style={{
            fontSize: 19, color: '#6A7385',
            lineHeight: 1.55, marginBottom: 44,
            maxWidth: 820,
          }}>
            {shortExcerpt}
          </div>
        )}

        {/* accent divider */}
        <div style={{
          width: 48, height: 2, marginBottom: 24, marginTop: 'auto',
          background: `linear-gradient(90deg, ${accent}, transparent)`,
        }} />

        {/* footer: author + reading time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: `rgba(${rgb},0.18)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: accent,
          }}>
            {initials}
          </div>
          <span style={{ fontSize: 14, color: '#565E72' }}>{author}</span>
          <span style={{ fontSize: 14, color: '#2E3548' }}>·</span>
          <span style={{ fontSize: 14, color: '#565E72' }}>{mins}분 읽기</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#2E3548', letterSpacing: 2 }}>
            AI · EDITED BY HUMAN
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
