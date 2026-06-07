import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import { makeFreshClient } from '@/lib/supabase';
import { toneForSeries, SERIES_DESC } from '@/lib/utils';
import JsonLd from '@/components/JsonLd';

export const revalidate = 60;

interface PostRow {
  id: number;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  published_at: string;
  tags: string[];
  episode: number;   // ep:N 태그에서 파싱한 에피소드 번호 (없으면 발행순 기준)
}

function parseEpisode(tags: string[]): number | null {
  const t = (tags ?? []).find(x => /^ep:\d+$/.test(x));
  return t ? parseInt(t.slice(3), 10) : null;
}

async function getSeriesPosts(seriesName: string): Promise<PostRow[]> {
  noStore();
  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,category,excerpt,published_at,tags')
    .eq('status', 'published')
    .contains('tags', [`series:${seriesName}`])
    .order('published_at', { ascending: true });

  const rows = (data ?? []) as Omit<PostRow, 'episode'>[];
  // ep:N 태그 기준 정렬 (엔진이 부여한 번호 존중). 태그 없으면 발행순 fallback.
  const withEp = rows.map((r, i) => ({
    ...r,
    episode: parseEpisode(r.tags) ?? i + 1,
  }));
  withEp.sort((a, b) => a.episode - b.episode || a.published_at.localeCompare(b.published_at));
  return withEp;
}

async function getAllSeriesNames(): Promise<string[]> {
  noStore();
  const { data } = await makeFreshClient()
    .from('posts')
    .select('tags')
    .eq('status', 'published');

  const names = new Set<string>();
  for (const p of (data ?? [])) {
    const tags: string[] = p.tags ?? [];
    const seriesTag = tags.find((t: string) => t.startsWith('series:'));
    if (seriesTag) names.add(seriesTag.replace('series:', ''));
  }
  return Array.from(names);
}

export async function generateStaticParams() {
  const names = await getAllSeriesNames();
  return names.map(n => ({ id: n }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const seriesName = decodeURIComponent(id);
  const url = `${SITE_URL}/series/${id}`;
  const desc =
    SERIES_DESC[seriesName] ??
    `${seriesName} 시리즈의 모든 에피소드를 순서대로 탐색하세요.`;
  return {
    title: `${seriesName} — Nodelog 시리즈`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: `${seriesName} — Nodelog 시리즈`,
      description: desc,
      url,
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seriesName = decodeURIComponent(id);
  const posts = await getSeriesPosts(seriesName);
  const tone = toneForSeries(seriesName);
  const desc = SERIES_DESC[seriesName] ?? `${seriesName} 시리즈의 심층 연재.`;
  const readingMinutes = posts.length * 5;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: '시리즈', item: `${SITE_URL}/series` },
      {
        '@type': 'ListItem',
        position: 3,
        name: seriesName,
        item: `${SITE_URL}/series/${id}`,
      },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: seriesName,
    description: desc,
    url: `${SITE_URL}/series/${id}`,
    numberOfItems: posts.length,
    itemListElement: posts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
    })),
  };

  return (
    <div>
      <JsonLd data={[breadcrumbSchema, itemListSchema]} />

      {/* ── Hero ── */}
      <div
        className="article-hero"
        style={{
          background: `radial-gradient(80% 320px at 75% 0%, color-mix(in oklch, var(--acc-${tone}) 12%, transparent), transparent 65%), radial-gradient(50% 200px at 10% 0%, color-mix(in oklch, var(--acc-${tone}) 6%, transparent), transparent 60%)`,
        }}
      >
        <div className="container">
          <div className="crumbs">
            <Link href="/">홈</Link>
            <span className="sep">/</span>
            <Link href="/series">시리즈</Link>
            <span className="sep">/</span>
            <span style={{ color: 'var(--text-1)' }}>{seriesName}</span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, marginBottom: 14 }}>
            <span className={`badge badge-${tone}`}>시리즈</span>
            <span className="badge">{posts.length}편</span>
            <span
              className="badge"
              style={{ fontFamily: 'var(--ff-mono)', fontSize: 11 }}
            >
              약 {readingMinutes}분
            </span>
          </div>

          <h1 className="article-title">{seriesName}</h1>
          <p className="article-deck">{desc}</p>

          {/* 편 수 진행 도트 */}
          {posts.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 4,
                flexWrap: 'wrap',
                marginBottom: 28,
                maxWidth: 400,
              }}
              aria-hidden
            >
              {posts.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: `color-mix(in oklch, var(--acc-${tone}) ${25 + Math.floor((i / posts.length) * 55)}%, var(--bg-4))`,
                    border: `1px solid color-mix(in oklch, var(--acc-${tone}) 30%, transparent)`,
                  }}
                />
              ))}
            </div>
          )}

          {posts.length > 0 && (
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href={`/blog/${posts[0].slug}`} className="btn btn-primary btn-lg">
                처음부터 읽기
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </Link>
              <Link href={`/blog/${posts[posts.length - 1].slug}`} className="btn btn-lg">
                최신 편 보기
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <section className="section">
        <div className="container">
          <div className="split">
            {/* ── 에피소드 목록 ── */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 24,
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 20, letterSpacing: '-0.02em' }}>
                    학습 경로
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13.5 }}>
                    순서대로 따라가면 더 큰 그림이 보입니다
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--ff-mono)',
                    fontSize: 12,
                    color: 'var(--text-4)',
                    background: 'var(--bg-3)',
                    border: '1px solid var(--line-1)',
                    borderRadius: 6,
                    padding: '4px 10px',
                  }}
                >
                  {posts.length}편
                </span>
              </div>

              <ol
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                {posts.map((ep, i) => {
                  const isFirst = i === 0;
                  const isLast = i === posts.length - 1;
                  return (
                    <li
                      key={ep.id}
                      className="card card-link"
                      style={{
                        borderRadius: isFirst ? '10px 10px 0 0' : isLast ? '0 0 10px 10px' : 0,
                        marginTop: isFirst ? 0 : -1,
                        borderTop: isFirst
                          ? `2px solid color-mix(in oklch, var(--acc-${tone}) 50%, transparent)`
                          : undefined,
                      }}
                    >
                      <Link
                        href={`/blog/${ep.slug}`}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr auto',
                          gap: 16,
                          padding: '18px 22px',
                          alignItems: 'start',
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                      >
                        {/* 번호 배지 */}
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isFirst
                              ? `var(--acc-${tone})`
                              : `color-mix(in oklch, var(--acc-${tone}) 16%, var(--bg-3))`,
                            color: isFirst
                              ? 'white'
                              : `var(--acc-${tone})`,
                            border: isFirst
                              ? 'none'
                              : '1px solid var(--line-2)',
                            fontFamily: 'var(--ff-mono)',
                            fontSize: 12,
                            fontWeight: 700,
                            flexShrink: 0,
                            marginTop: 2,
                            boxShadow: isFirst
                              ? `0 4px 12px color-mix(in oklch, var(--acc-${tone}) 35%, transparent)`
                              : undefined,
                          }}
                        >
                          {String(ep.episode).padStart(2, '0')}
                        </div>

                        {/* 본문 */}
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              marginBottom: 5,
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--ff-mono)',
                                fontSize: 11,
                                color: isFirst ? `var(--acc-${tone})` : 'var(--text-4)',
                                letterSpacing: '0.06em',
                                fontWeight: isFirst ? 700 : 400,
                              }}
                            >
                              EP · {String(ep.episode).padStart(2, '0')}
                              {isFirst && ' · START'}
                            </span>
                            <span
                              style={{
                                fontFamily: 'var(--ff-mono)',
                                fontSize: 11,
                                color: 'var(--text-5)',
                              }}
                            >
                              {new Date(ep.published_at).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 500,
                              color: 'var(--text-1)',
                              letterSpacing: '-0.01em',
                              lineHeight: 1.4,
                            }}
                          >
                            {ep.title}
                          </div>
                          {ep.excerpt && (
                            <div
                              style={{
                                fontSize: 13,
                                color: 'var(--text-3)',
                                marginTop: 5,
                                lineHeight: 1.55,
                              }}
                            >
                              {ep.excerpt.slice(0, 100)}…
                            </div>
                          )}
                        </div>

                        {/* 화살표 */}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          style={{ color: 'var(--text-4)', flexShrink: 0, marginTop: 6 }}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* ── Aside ── */}
            <aside className="aside-rail">
              {/* 시리즈 정보 */}
              <div className="widget">
                <h5>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  시리즈 정보
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 13.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-3)' }}>총 편 수</span>
                    <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{posts.length}편</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-3)' }}>예상 읽기 시간</span>
                    <strong>약 {readingMinutes}분</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-3)' }}>형식</span>
                    <span className={`badge badge-${tone}`}>연재 시리즈</span>
                  </div>
                  {posts.length > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-3)' }}>시작일</span>
                        <strong style={{ fontSize: 12 }}>
                          {new Date(posts[0].published_at).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'short',
                          })}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-3)' }}>최근 업데이트</span>
                        <strong style={{ fontSize: 12 }}>
                          {new Date(posts[posts.length - 1].published_at).toLocaleDateString(
                            'ko-KR',
                            { year: 'numeric', month: 'short' },
                          )}
                        </strong>
                      </div>
                    </>
                  )}
                </div>

                {/* 편 수 시각화 도트 그리드 */}
                {posts.length > 0 && (
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 14,
                      borderTop: '1px dashed var(--line-1)',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--ff-mono)',
                        fontSize: 10,
                        color: 'var(--text-4)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: 8,
                      }}
                    >
                      에피소드 맵
                    </div>
                    <div
                      style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}
                      aria-hidden
                    >
                      {posts.map((_, i) => (
                        <div
                          key={i}
                          title={`EP ${String(i + 1).padStart(2, '0')}`}
                          style={{
                            width: 11,
                            height: 11,
                            borderRadius: 3,
                            background:
                              i === 0
                                ? `var(--acc-${tone})`
                                : `color-mix(in oklch, var(--acc-${tone}) ${18 + Math.floor((i / posts.length) * 45)}%, var(--bg-4))`,
                            border: `1px solid color-mix(in oklch, var(--acc-${tone}) 28%, transparent)`,
                            boxShadow:
                              i === 0
                                ? `0 0 6px color-mix(in oklch, var(--acc-${tone}) 40%, transparent)`
                                : undefined,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 빠른 이동 */}
              {posts.length > 0 && (
                <div className="widget">
                  <h5>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    빠른 이동
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Link
                      href={`/blog/${posts[0].slug}`}
                      className="btn btn-sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      1편부터 시작
                    </Link>
                    <Link
                      href={`/blog/${posts[posts.length - 1].slug}`}
                      className="btn btn-sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      최신 편 ({posts.length}편)
                    </Link>
                  </div>
                </div>
              )}

              {/* 다른 시리즈 */}
              <div className="widget">
                <h5>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  다른 시리즈
                </h5>
                <Link
                  href="/series"
                  className="btn btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  전체 시리즈 보기
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
