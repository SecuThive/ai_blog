'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { EngineerGuide } from '@/lib/types';
import { engCatTone, diffLabel } from '@/lib/utils';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return '오늘';
  if (d < 7) return `${d}일 전`;
  if (d < 30) return `${Math.floor(d / 7)}주 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, '');
}

interface Props {
  guides: EngineerGuide[];
  activeCat?: string;
}

export default function EngineerSearch({ guides, activeCat }: Props) {
  const [query, setQuery] = useState('');
  const q = query.trim();

  const filtered = useMemo(() => {
    if (!q) return guides;
    const nq = normalize(q);
    return guides.filter(g =>
      normalize(g.title).includes(nq) ||
      normalize(g.summary).includes(nq) ||
      g.tags.some(t => normalize(t).includes(nq)) ||
      normalize(g.category).includes(nq)
    );
  }, [guides, q]);

  const isSearching = q.length > 0;

  return (
    <>
      {/* Search bar */}
      <div className="eng-search-wrap">
        <div className="eng-search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="eng-search-icon">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            className="eng-search-input"
            placeholder="제목, 태그, 카테고리 검색…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {q && (
            <button className="eng-search-clear" onClick={() => setQuery('')} aria-label="검색 초기화">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* List header */}
      <div className="section-eyebrow" style={{ marginBottom: 4 }}>GUIDES</div>
      <h2 style={{ margin: '0 0 24px', fontSize: 20, letterSpacing: '-0.02em' }}>
        {isSearching
          ? `"${q}" 검색 결과`
          : activeCat
            ? `${activeCat} 가이드`
            : '최근 가이드'}
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 400, color: 'var(--text-4)', marginLeft: 10 }}>
          {filtered.length}
        </span>
      </h2>

      {/* Guide grid */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)' }}>
            &ldquo;{q}&rdquo; 에 해당하는 가이드가 없습니다.
          </div>
        </div>
      ) : (
        <div className="eng-card-grid">
          {filtered.map(g => {
            const tone = engCatTone(g.category);
            return (
              <Link key={g.id} href={`/engineer/${g.slug}`} className={`eng-card eng-card-${tone}`}>
                {/* Top accent */}
                <div className="eng-card-accent" />

                {/* Header */}
                <div className="eng-card-head">
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={`badge badge-${tone}`} style={{ fontSize: 10.5 }}>{g.category}</span>
                    <span className={`eng-diff eng-diff-${g.difficulty}`}>{diffLabel(g.difficulty)}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--text-5)' }}>
                    {timeAgo(g.created_at)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="eng-card-title">{g.title}</h3>

                {/* Summary */}
                <p className="eng-card-summary">{g.summary}</p>

                {/* Footer */}
                <div className="eng-card-foot">
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                    {g.os_compat.slice(0, 3).map(os => (
                      <span key={os} className="eng-os-tag">{os}</span>
                    ))}
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-5)', flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
