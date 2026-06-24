'use client';

import { useState, useMemo } from 'react';
import { VENDORS, CATEGORIES, CATEGORY_TONE, type SecurityCategory } from './data';

export default function SecurityCatalog() {
  const [active, setActive] = useState<SecurityCategory | null>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    let list = VENDORS;
    if (active) list = list.filter(v => v.categories.includes(active));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.nameEn.toLowerCase().includes(q) ||
        v.desc.toLowerCase().includes(q) ||
        v.products.some(p => p.toLowerCase().includes(q)) ||
        v.categories.some(c => c.toLowerCase().includes(q))
      );
    }
    return list;
  }, [active, query]);

  const countAll = VENDORS.length;
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const v of VENDORS) for (const c of v.categories) m[c] = (m[c] ?? 0) + 1;
    return m;
  }, []);

  return (
    <>
      {/* 검색 + 필터 */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" />
          </svg>
          <input
            type="text"
            placeholder="벤더명, 제품명, 카테고리 검색…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 38px',
              background: 'var(--bg-2)', border: '1px solid var(--line-2)',
              borderRadius: 'var(--r-md)', color: 'var(--text-1)',
              fontSize: 14, outline: 'none', fontFamily: 'var(--ff-sans)',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setActive(null)}
            style={{
              padding: '6px 14px', borderRadius: 999,
              border: `1px solid ${active === null ? 'var(--acc-blue)' : 'var(--line-2)'}`,
              background: active === null ? 'color-mix(in oklch, var(--acc-blue) 12%, transparent)' : 'transparent',
              color: active === null ? 'var(--acc-blue)' : 'var(--text-3)',
              fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--ff-sans)',
              transition: '150ms',
            }}
          >
            전체 <span style={{ fontFamily: 'var(--ff-mono)', opacity: 0.7 }}>{countAll}</span>
          </button>
          {CATEGORIES.map(cat => {
            const tone = CATEGORY_TONE[cat];
            const isActive = active === cat;
            return (
              <button
                key={cat}
                onClick={() => setActive(isActive ? null : cat)}
                style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 12.5,
                  cursor: 'pointer', fontFamily: 'var(--ff-sans)', transition: '150ms',
                  border: `1px solid ${isActive
                    ? `color-mix(in oklch, var(--acc-${tone}) 50%, transparent)`
                    : 'var(--line-2)'}`,
                  background: isActive
                    ? `color-mix(in oklch, var(--acc-${tone}) 12%, transparent)`
                    : 'transparent',
                  color: isActive ? `var(--acc-${tone})` : 'var(--text-3)',
                }}
              >
                {cat} <span style={{ fontFamily: 'var(--ff-mono)', opacity: 0.7 }}>{counts[cat] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 결과 수 */}
      <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11.5, color: 'var(--text-4)', marginBottom: 20, letterSpacing: '0.06em' }}>
        {filtered.length}개 벤더{active ? ` · ${active}` : ''}
        {query ? ` · "${query}"` : ''}
      </div>

      {/* 벤더 카드 */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-4)' }}>
          일치하는 벤더가 없습니다.
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(v => (
            <a
              key={v.id}
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card card-link"
              style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 0 }}
            >
              {/* 헤더 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-1)', lineHeight: 1.2 }}>
                    {v.name}
                  </div>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--text-4)', marginTop: 3, letterSpacing: '0.06em' }}>
                    {v.nameEn} · Est. {v.founded}
                  </div>
                </div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  style={{ color: 'var(--text-4)', flexShrink: 0, marginTop: 4 }}>
                  <path d="M7 17L17 7M7 7h10v10" />
                </svg>
              </div>

              {/* 카테고리 배지 */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                {v.categories.map(c => (
                  <span key={c} className={`badge badge-${CATEGORY_TONE[c]}`} style={{ fontSize: 11 }}>{c}</span>
                ))}
              </div>

              {/* 설명 */}
              <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, flex: 1 }}>
                {v.desc}
              </p>

              {/* 주요 제품 */}
              <div style={{ borderTop: '1px solid var(--line-1)', paddingTop: 12 }}>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--text-4)', letterSpacing: '0.10em', marginBottom: 6 }}>
                  PRODUCTS
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {v.products.map(p => (
                    <span key={p} style={{
                      fontSize: 11.5, padding: '2px 8px',
                      background: 'var(--bg-3)', border: '1px solid var(--line-2)',
                      borderRadius: 5, color: 'var(--text-2)',
                    }}>{p}</span>
                  ))}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
