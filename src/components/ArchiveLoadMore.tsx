'use client';

import Link from 'next/link';
import { useState } from 'react';
import { catTone } from '@/lib/utils';

interface PostRow {
  id: number;
  title: string;
  slug: string;
  category: string;
  published_at: string;
}

interface MonthGroup { month: string; posts: PostRow[]; }
interface YearGroup { year: string; months: MonthGroup[]; }

const INITIAL_YEARS = 2; // 처음에 최근 2년치만 표시

export default function ArchiveLoadMore({ grouped }: { grouped: YearGroup[] }) {
  const [visibleYears, setVisibleYears] = useState(INITIAL_YEARS);
  const shown = grouped.slice(0, visibleYears);
  const hasMore = visibleYears < grouped.length;

  return (
    <>
      {shown.map(({ year, months }) => {
        const total = months.reduce((s, m) => s + m.posts.length, 0);
        return (
          <div key={year} style={{ marginBottom: 64 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 28, paddingBottom: 16, borderBottom: '1px solid var(--line-1)' }}>
              <h2 style={{ margin: 0, fontSize: 40, letterSpacing: '-0.03em', fontWeight: 600 }}>{year}</h2>
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)', letterSpacing: '0.08em' }}>{total} POSTS</span>
            </div>
            {months.map(({ month, posts }) => (
              <div key={month} style={{ marginBottom: 36 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 32, alignItems: 'start' }}>
                  <div style={{ position: 'sticky', top: 'calc(var(--header-h) + 32px)' }}>
                    <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{month}월</div>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.08em', marginTop: 4 }}>{posts.length} POSTS</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {posts.map((p, i) => {
                      const d = new Date(p.published_at);
                      const tone = catTone(p.category);
                      return (
                        <Link
                          key={p.id}
                          href={`/blog/${p.slug}`}
                          style={{
                            display: 'grid', gridTemplateColumns: '50px 120px 1fr', gap: 20,
                            padding: '16px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line-1)',
                            alignItems: 'center', textDecoration: 'none', color: 'inherit',
                          }}
                        >
                          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums' }}>
                            {String(d.getMonth() + 1).padStart(2, '0')}.{String(d.getDate()).padStart(2, '0')}
                          </span>
                          <span className={`badge badge-${tone}`} style={{ width: 'fit-content' }}>{p.category}</span>
                          <span style={{ fontSize: 14.5, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{p.title}</span>
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
            이전 연도 더 보기 ({shown.length}/{grouped.length}년)
          </button>
        </div>
      )}
    </>
  );
}
