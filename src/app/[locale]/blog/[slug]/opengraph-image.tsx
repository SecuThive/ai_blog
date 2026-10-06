import { ImageResponse } from 'next/og';
import { makeFreshClient } from '@/lib/supabase';
import { isLocale } from '@/i18n/config';
import { localizePost } from '@/i18n/content';
import { categoryLabel } from '@/i18n/categories';
import { getDictionary, interpolate } from '@/i18n/messages';
import { fitOgExcerpt, fitOgTitle } from '@/i18n/ogFit';
import { formatDate } from '@/i18n/format';
import { readEditorialRecord, substantiveUpdate } from '@/lib/editorialRecord';

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

export default async function OgImage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug, locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  const decoded = decodeURIComponent(slug);

  const { data } = await makeFreshClient()
    .from('posts')
    .select('title,excerpt,category,content,tags,content_evidence,published_at')
    .eq('slug', decoded)
    .eq('status', 'published')
    .single();

  const localized = data ? localizePost(data, locale) : null;
  const title    = localized?.title    ?? 'Nodelog';
  const category = data?.category ? categoryLabel(data.category, locale) : '';
  // 하단에는 작성자·검토자 표기를 두지 않는다. posts.author에는 생성 파이프라인의 역할명(Content Reviewer 등)이
  // 들어 있고, 사람이 검토했다는 기록(reviewed_at·verifiedAt)이 대부분의 글에 없기 때문이다.
  // 대신 글 페이지와 같은 규칙의 날짜만 쓴다: 실질 변경 기록(contentUpdatedAt+changeSummary)이 있으면 업데이트일, 없으면 발행일.
  const publishedAt = typeof data?.published_at === 'string' ? data.published_at : null;
  const updatedAt = data ? substantiveUpdate(readEditorialRecord(data.content_evidence), publishedAt) : null;
  const dateIso = updatedAt ?? publishedAt;
  const dateLabel = dateIso ? `${updatedAt ? dict.blog.updated : dict.blog.published} ${formatDate(dateIso, locale)}` : '';
  const excerpt  = localized?.excerpt  ?? '';
  const mins = Math.max(1, Math.round(((localized?.content ?? data?.content ?? '').trim().split(/\s+/).length) / 200));

  const tone            = catTone(category);
  const { accent, rgb } = TONES[tone];

  const { text: shortTitle, fontSize: titleSize } = fitOgTitle(title);
  const shortExcerpt = fitOgExcerpt(excerpt, title.length);

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
          fontSize: titleSize,
          fontWeight: 700, color: '#E8ECF4',
          lineHeight: 1.2, letterSpacing: -1.2,
          marginBottom: 16, maxWidth: 1060,
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

        {/* footer: date + reading time (작성자·검토 표기 없음) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {dateLabel && <span style={{ fontSize: 14, color: '#565E72' }}>{dateLabel}</span>}
          {dateLabel && <span style={{ fontSize: 14, color: '#2E3548' }}>·</span>}
          <span style={{ fontSize: 14, color: '#565E72' }}>{interpolate(dict.blog.readingTime, { min: mins })}</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
