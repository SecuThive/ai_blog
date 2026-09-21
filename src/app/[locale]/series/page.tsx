import Link from '@/i18n/link';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import { makeFreshClient } from '@/lib/supabase';
import { toneForSeries } from '@/lib/utils';
import JsonLd from '@/components/JsonLd';
import { isLocale } from '@/i18n/config';
import { getDictionary, interpolate } from '@/i18n/messages';
import { seriesDescription, seriesLabel } from '@/i18n/display';
import { siteUrl } from '@/i18n/metadata';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  const desc = locale === 'en'
    ? '14 series and 100+ in-depth episodes. From RAG to enterprise AI, read them in order.'
    : '14개 시리즈, 100편 이상의 심층 연재. RAG부터 엔터프라이즈 AI까지 단계별로 완전 정복.';
  const url = siteUrl('/series', locale);
  return {
    title: dict.pages.seriesTitle,
    description: desc,
    alternates: { canonical: url },
    openGraph: { title: dict.pages.seriesTitle, description: desc, url, type: 'website' },
  };
}

export const revalidate = 60;

interface SeriesInfo {
  name: string;
  label: string;
  count: number;
  latestDate: string;
  firstDate: string;
  tone: string;
  desc: string;
}

async function getSeries(locale: 'ko' | 'en'): Promise<SeriesInfo[]> {
  noStore();
  const { data } = await makeFreshClient()
    .from('posts')
    .select('tags,published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const map = new Map<string, { count: number; latestDate: string; firstDate: string }>();

  for (const p of (data ?? [])) {
    const tags: string[] = p.tags ?? [];
    const seriesTag = tags.find(t => t.startsWith('series:'));
    if (!seriesTag) continue;
    const seriesName = seriesTag.replace('series:', '');
    if (!map.has(seriesName)) {
      map.set(seriesName, { count: 0, latestDate: p.published_at ?? '', firstDate: p.published_at ?? '' });
    }
    const entry = map.get(seriesName)!;
    entry.count++;
    entry.firstDate = p.published_at ?? entry.firstDate;
  }

  return Array.from(map.entries())
    .map(([name, v]) => ({
      name,
      label: seriesLabel(name, locale),
      ...v,
      tone: toneForSeries(name),
      desc: seriesDescription(name, locale),
    }))
    .sort((a, b) => b.count - a.count);
}

export default async function SeriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  const series = await getSeries(locale);

  const featured = series.filter(s => s.count >= 8);
  const standard = series.filter(s => s.count < 8);
  const totalEps = series.reduce((acc, s) => acc + s.count, 0);
  const maxCount = series[0]?.count ?? 1;

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Nodelog ${dict.pages.seriesTitle}`,
    url: siteUrl('/series', locale),
    numberOfItems: series.length,
    itemListElement: series.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.label,
      url: siteUrl(`/series/${encodeURIComponent(s.name)}`, locale),
    })),
  };

  return (
    <div>
      <JsonLd data={itemListSchema} />

      <section
        className="page-hero"
        style={{
          background:
            'radial-gradient(70% 400px at 10% 0%, rgba(120,100,255,0.08), transparent 60%), radial-gradient(50% 300px at 90% 0%, rgba(80,200,180,0.05), transparent 55%)',
        }}
      >
        <div className="container">
          <div className="page-eyebrow">SERIES</div>
          <h1 className="page-title">{dict.pages.seriesTitle}</h1>
          <p className="page-lead">
            {dict.pages.seriesLead}{' '}
            <strong style={{ color: 'var(--text-2)', fontWeight: 600 }}>
              {interpolate(dict.home.postsCount, { count: series.length })} · {totalEps}
            </strong>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {series.length === 0 ? (
            <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '60px 0' }}>
              {dict.home.seriesEmpty}
            </p>
          ) : (
            <>
              {featured.length > 0 && (
                <div style={{ marginBottom: 64 }}>
                  <div className="section-head" style={{ marginBottom: 24 }}>
                    <div>
                      <div className="section-eyebrow">FEATURED SERIES</div>
                      <h2 className="section-title" style={{ fontSize: 22 }}>{dict.home.seriesTitle}</h2>
                    </div>
                    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)' }}>
                      {locale === 'en' ? `${featured.length} series · ${featured.reduce((a, s) => a + s.count, 0)} eps` : `${featured.length}개 · ${featured.reduce((a, s) => a + s.count, 0)}편`}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                    {featured.map(s => (
                      <SeriesCard key={s.name} s={s} featured maxCount={maxCount} locale={locale} seriesWord={dict.blog.series} updatedWord={dict.blog.updated} />
                    ))}
                  </div>
                </div>
              )}

              {standard.length > 0 && (
                <div>
                  <div className="section-head" style={{ marginBottom: 24 }}>
                    <div>
                      <div className="section-eyebrow">SPECIALIZED</div>
                      <h2 className="section-title" style={{ fontSize: 22 }}>{dict.pages.seriesTitle}</h2>
                    </div>
                    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)' }}>
                      {locale === 'en' ? `${standard.length} series · ${standard.reduce((a, s) => a + s.count, 0)} eps` : `${standard.length}개 · ${standard.reduce((a, s) => a + s.count, 0)}편`}
                    </span>
                  </div>
                  <div className="grid-3">
                    {standard.map(s => (
                      <SeriesCard key={s.name} s={s} featured={false} maxCount={maxCount} locale={locale} seriesWord={dict.blog.series} updatedWord={dict.blog.updated} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function SeriesCard({
  s,
  featured,
  maxCount,
  locale,
  seriesWord,
  updatedWord,
}: {
  s: SeriesInfo;
  featured: boolean;
  maxCount: number;
  locale: 'ko' | 'en';
  seriesWord: string;
  updatedWord: string;
}) {
  const progressPct = Math.round((s.count / maxCount) * 100);

  return (
    <Link
      href={`/series/${encodeURIComponent(s.name)}`}
      className="card card-link"
      style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      {/* ── Thumb ── */}
      <div
        className={`card-thumb thumb-${s.tone}`}
        style={{
          borderRadius: 0,
          aspectRatio: featured ? '21/9' : '16/9',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: featured ? '22px 24px' : '14px 16px',
          position: 'relative',
          overflow: 'hidden',
          gap: 0,
        }}
      >
        {/* 상단 accent 선 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, var(--acc-${s.tone}), transparent 70%)`,
          }}
        />

        {/* 도트 그리드 패턴 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, color-mix(in oklch, var(--acc-${s.tone}) 22%, transparent) 1.5px, transparent 1.5px)`,
            backgroundSize: featured ? '22px 22px' : '18px 18px',
            opacity: 0.38,
            pointerEvents: 'none',
          }}
        />

        {/* 워터마크 숫자 */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: featured ? 100 : 68,
            fontWeight: 900,
            opacity: 0.055,
            fontFamily: 'var(--ff-mono)',
            color: `var(--acc-${s.tone})`,
            lineHeight: 1,
            letterSpacing: '-0.05em',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {s.count}
        </span>

        {/* 콘텐츠 */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: featured ? 8 : 6 }}>
            <span
              className={`badge badge-${s.tone}`}
              style={{ fontSize: featured ? 11 : 10, letterSpacing: '0.06em' }}
            >
              {s.count} EPISODES
            </span>
          </div>
          <span
            style={{
              fontSize: featured ? 17 : 12,
              fontWeight: 600,
              color: 'var(--text-1)',
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
              display: 'block',
            }}
          >
            {s.label}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="card-body" style={{ flex: 1 }}>
        <div className="card-meta">
          <span className={`badge badge-${s.tone}`}>{seriesWord}</span>
        </div>
        <h3 className="card-title" style={{ fontSize: featured ? 18 : 17 }}>
          {s.label}
        </h3>
        <p
          className="card-excerpt"
          style={
            {
              WebkitLineClamp: featured ? 3 : 2,
            } as object
          }
        >
          {s.desc}
        </p>
        <div className="card-foot">
          <span>{s.count}</span>
          <span className="dot" />
          <span>
            {updatedWord}{' '}
            {new Date(s.latestDate).toLocaleDateString(locale === 'en' ? 'en-US' : 'ko-KR', {
              year: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
      </div>

      {/* ── 편 수 Progress strip ── */}
      <div style={{ height: 3, background: 'var(--bg-1)', flexShrink: 0 }}>
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            background: `linear-gradient(90deg, var(--acc-${s.tone}), color-mix(in oklch, var(--acc-${s.tone}) 55%, var(--acc-purple)))`,
            opacity: 0.6,
          }}
        />
      </div>
    </Link>
  );
}
