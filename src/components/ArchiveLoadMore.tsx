'use client';

import Link from '@/i18n/link';
import { useState } from 'react';
import { catTone } from '@/lib/utils';
import { useT } from '@/i18n/provider';
import { interpolate } from '@/i18n/messages';
import { categoryLabel } from '@/i18n/categories';
import { titleForLocale } from '@/i18n/content';

interface PostRow {
  id: number;
  title: string;
  slug: string;
  category: string;
  published_at: string;
  tags?: string[] | null;
  content_evidence?: unknown;
}

interface MonthGroup { month: string; posts: PostRow[]; }
interface YearGroup { year: string; months: MonthGroup[]; }

const INITIAL_YEARS = 2;

export default function ArchiveLoadMore({ grouped }: { grouped: YearGroup[] }) {
  const { locale, dict } = useT();
  const [visibleYears, setVisibleYears] = useState(INITIAL_YEARS);
  const shown = grouped.slice(0, visibleYears);
  const hasMore = visibleYears < grouped.length;

  return (
    <>
      {shown.map(({ year, months }) => {
        const total = months.reduce((s, m) => s + m.posts.length, 0);
        return (
          <div key={year} style={{ marginBottom: 72 }}>
            {/* Year header */}
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 16,
              marginBottom: 32, paddingBottom: 16,
              borderBottom: '2px solid var(--line-2)',
            }}>
              <h2 style={{ margin: 0, fontSize: 42, letterSpacing: '-0.04em', fontWeight: 700 }}>{year}</h2>
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.1em' }}>
                {total} POSTS
              </span>
            </div>

            {months.map(({ month, posts }) => (
              <div key={month} style={{ marginBottom: 40 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 32, alignItems: 'start' }}>
                  {/* Month label (sticky) */}
                  <div style={{ position: 'sticky', top: 'calc(var(--header-h) + 24px)' }}>
                    <div style={{
                      fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em',
                      fontVariantNumeric: 'tabular-nums', color: 'var(--text-1)',
                    }}>
                      {interpolate(dict.common.monthSuffix, { month })}
                    </div>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--text-5)', letterSpacing: '0.1em', marginTop: 4 }}>
                      {posts.length} POSTS
                    </div>
                  </div>

                  {/* Posts column with left timeline */}
                  <div style={{ position: 'relative', paddingLeft: 20 }}>
                    {/* Timeline line */}
                    <div style={{
                      position: 'absolute', left: 0, top: 8, bottom: 8,
                      width: 1, background: 'var(--line-1)',
                    }} />

                    {posts.map((p, i) => {
                      const d = new Date(p.published_at);
                      const tone = catTone(p.category);
                      return (
                        <Link
                          key={p.id}
                          href={`/blog/${p.slug}`}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '44px 1fr',
                            gap: 16,
                            padding: '14px 0',
                            borderBottom: i < posts.length - 1 ? '1px solid var(--line-1)' : 'none',
                            alignItems: 'start',
                            textDecoration: 'none',
                            color: 'inherit',
                            position: 'relative',
                          }}
                          className="archive-row"
                        >
                          {/* Timeline dot */}
                          <div style={{
                            position: 'absolute', left: -24, top: 20,
                            width: 7, height: 7, borderRadius: '50%',
                            background: `var(--acc-${tone})`,
                            boxShadow: `0 0 0 2px var(--bg-0)`,
                          }} />

                          {/* Date */}
                          <span style={{
                            fontFamily: 'var(--ff-mono)', fontSize: 11.5,
                            color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums',
                            paddingTop: 2,
                          }}>
                            {String(d.getMonth() + 1).padStart(2, '0')}.{String(d.getDate()).padStart(2, '0')}
                          </span>

                          {/* Content */}
                          <div>
                            <div style={{ marginBottom: 6 }}>
                              <span className={`badge badge-${tone}`} style={{ fontSize: 10.5 }}>{categoryLabel(p.category, locale)}</span>
                            </div>
                            <span style={{ fontSize: 14.5, color: 'var(--text-1)', letterSpacing: '-0.015em', lineHeight: 1.4 }}>
                              {titleForLocale(locale, p.title, { tags: p.tags, content_evidence: p.content_evidence })}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {hasMore && (
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setVisibleYears(v => v + 2)}
          >
            {dict.common.loadMore} ({shown.length}/{grouped.length})
          </button>
        </div>
      )}
    </>
  );
}
