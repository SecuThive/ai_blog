import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import { makeFreshClient } from '@/lib/supabase';
import { toneForSeries, SERIES_DESC } from '@/lib/utils';
import JsonLd from '@/components/JsonLd';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export const metadata: Metadata = {
  title: '시리즈',
  description: '14개 시리즈, 100편 이상의 심층 연재. RAG부터 엔터프라이즈 AI까지 단계별로 완전 정복.',
  alternates: { canonical: `${SITE_URL}/series` },
  openGraph: {
    title: '시리즈',
    description: '14개 시리즈, 100편 이상의 심층 연재. RAG부터 엔터프라이즈 AI까지 단계별로 완전 정복.',
    url: `${SITE_URL}/series`,
    type: 'website',
  },
};

export const revalidate = 60;

interface SeriesInfo {
  name: string;
  count: number;
  latestDate: string;
  firstDate: string;
  tone: string;
  desc: string;
}

async function getSeries(): Promise<SeriesInfo[]> {
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
      ...v,
      tone: toneForSeries(name),
      desc: SERIES_DESC[name] ?? `${name} 시리즈의 심층 연재.`,
    }))
    .sort((a, b) => b.count - a.count);
}

export default async function SeriesPage() {
  const series = await getSeries();

  const featured = series.filter(s => s.count >= 8);
  const standard = series.filter(s => s.count < 8);
  const totalEps = series.reduce((acc, s) => acc + s.count, 0);
  const maxCount = series[0]?.count ?? 1;

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Nodelog 시리즈',
    url: `${SITE_URL}/series`,
    numberOfItems: series.length,
    itemListElement: series.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.name,
      url: `${SITE_URL}/series/${encodeURIComponent(s.name)}`,
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
          <div className="page-eyebrow">SERIES · 학습 경로</div>
          <h1 className="page-title">시리즈로 깊게 파보기</h1>
          <p className="page-lead">
            하나의 주제를 끝까지 따라갈 수 있도록 단계별로 구성된 연재.{' '}
            <strong style={{ color: 'var(--text-2)', fontWeight: 600 }}>
              {series.length}개 시리즈 · {totalEps}편
            </strong>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {series.length === 0 ? (
            <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '60px 0' }}>
              준비 중인 시리즈가 곧 공개됩니다.
            </p>
          ) : (
            <>
              {featured.length > 0 && (
                <div style={{ marginBottom: 64 }}>
                  <div className="section-head" style={{ marginBottom: 24 }}>
                    <div>
                      <div className="section-eyebrow">FEATURED SERIES</div>
                      <h2 className="section-title" style={{ fontSize: 22 }}>핵심 시리즈</h2>
                    </div>
                    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)' }}>
                      {featured.length}개 · {featured.reduce((a, s) => a + s.count, 0)}편
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                    {featured.map(s => (
                      <SeriesCard key={s.name} s={s} featured maxCount={maxCount} />
                    ))}
                  </div>
                </div>
              )}

              {standard.length > 0 && (
                <div>
                  <div className="section-head" style={{ marginBottom: 24 }}>
                    <div>
                      <div className="section-eyebrow">SPECIALIZED</div>
                      <h2 className="section-title" style={{ fontSize: 22 }}>심화 · 특화 시리즈</h2>
                    </div>
                    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)' }}>
                      {standard.length}개 · {standard.reduce((a, s) => a + s.count, 0)}편
                    </span>
                  </div>
                  <div className="grid-3">
                    {standard.map(s => (
                      <SeriesCard key={s.name} s={s} featured={false} maxCount={maxCount} />
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
}: {
  s: SeriesInfo;
  featured: boolean;
  maxCount: number;
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
            {s.name}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="card-body" style={{ flex: 1 }}>
        <div className="card-meta">
          <span className={`badge badge-${s.tone}`}>시리즈</span>
        </div>
        <h3 className="card-title" style={{ fontSize: featured ? 18 : 17 }}>
          {s.name}
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
          <span>{s.count}편</span>
          <span className="dot" />
          <span>
            업데이트{' '}
            {new Date(s.latestDate).toLocaleDateString('ko-KR', {
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
