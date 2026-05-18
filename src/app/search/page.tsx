'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface SearchResult {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  published_at: string;
  source?: 'post' | 'guide';
}

function catTone(cat: string) {
  if (cat.includes('AI') || cat.includes('자동화')) return 'blue';
  if (cat.includes('트렌드') || cat.includes('IT')) return 'purple';
  if (cat.includes('개발') || cat.includes('인프라')) return 'mint';
  if (cat.includes('툴') || cat.includes('리뷰')) return 'amber';
  if (cat.includes('보안')) return 'rose';
  return 'blue';
}

function highlight(text: string, q: string) {
  if (!q) return text;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase() ? <mark key={i}>{p}</mark> : p
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const [q, setQ] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      setResults(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (initialQ) doSearch(initialQ);
  }, [initialQ, doSearch]);

  const SUGGESTED = ['MCP', 'GPT-5', 'Cursor', 'React 19', 'Postgres', 'Passkey', '에이전트', 'WASM'];

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">SEARCH</div>
          <h1 className="page-title" style={{ marginBottom: 24 }}>검색</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', border: '1px solid var(--line-2)', borderRadius: 12, background: 'var(--bg-2)', maxWidth: 720 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" />
            </svg>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doSearch(q); }}
              placeholder="궁금한 IT 주제나 AI 도구를 검색해보세요"
              style={{ flex: 1, background: 'transparent', border: 0, color: 'var(--text-1)', fontSize: 16, outline: 'none' }}
              autoFocus
            />
            <span className="kbd">⏎</span>
          </div>
          {searched && (
            <div style={{ marginTop: 18, fontSize: 13.5, color: 'var(--text-3)' }}>
              검색 결과: <strong style={{ color: 'var(--text-1)' }}>&quot;{q}&quot;</strong> — {results.length}개의 글
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 32 }}>
        <div className="container">
          <div className="split">
            <div>
              {loading && (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--ff-mono)', fontSize: 12, letterSpacing: '0.10em' }}>
                  SEARCHING…
                </div>
              )}
              {!loading && searched && results.length === 0 && (
                <div className="card" style={{ padding: 56, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontFamily: 'var(--ff-mono)', color: 'var(--text-4)', marginBottom: 12 }}>NO RESULTS</div>
                  <p style={{ color: 'var(--text-3)' }}>일치하는 결과를 찾지 못했습니다. 다른 키워드로 검색해보세요.</p>
                </div>
              )}
              {!loading && results.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {results.map(p => {
                    const tone = catTone(p.category);
                    const isGuide = p.source === 'guide';
                    const href = isGuide ? `/engineer/${p.slug}` : `/blog/${p.slug}`;
                    return (
                      <Link key={`${p.source}-${p.id}`} href={href} className="card card-link" style={{ padding: 22, display: 'grid', gridTemplateColumns: '160px 1fr', gap: 22 }}>
                        <div className={`card-thumb thumb-${tone}`} style={{ aspectRatio: '16/10', borderRadius: 8 }}>{p.category}</div>
                        <div>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span className={`badge badge-${tone}`}>{p.category}</span>
                            {isGuide && (
                              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--text-4)', background: 'var(--bg-3)', borderRadius: 4, padding: '2px 6px', letterSpacing: '0.06em' }}>
                                GUIDE
                              </span>
                            )}
                            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', display: 'flex', alignItems: 'center' }}>
                              {new Date(p.published_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <h3 style={{ margin: '0 0 6px', fontSize: 17, letterSpacing: '-0.015em', lineHeight: 1.35 }}>
                            {highlight(p.title, q)}
                          </h3>
                          <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13.5, lineHeight: 1.55 }}>
                            {highlight(p.excerpt ?? '', q)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
              {!searched && (
                <div style={{ padding: '40px 0', color: 'var(--text-4)', fontFamily: 'var(--ff-mono)', fontSize: 12, letterSpacing: '0.10em', textAlign: 'center' }}>
                  검색어를 입력하고 Enter를 누르세요
                </div>
              )}
            </div>

            <aside className="aside-rail">
              <div className="widget">
                <h5>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                  추천 검색어
                </h5>
                <div className="pill-row">
                  {SUGGESTED.map(t => (
                    <button key={t} className="tag-chip" onClick={() => { setQ(t); doSearch(t); }}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="widget">
                <h5>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                  카테고리 탐색
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { href: '/category/AI & 자동화', label: 'AI 자동화', tone: 'blue' },
                    { href: '/category/IT 트렌드', label: 'IT 트렌드', tone: 'purple' },
                    { href: '/category/개발', label: '개발', tone: 'mint' },
                    { href: '/category/툴 리뷰', label: '툴 리뷰', tone: 'amber' },
                  ].map(c => (
                    <Link key={c.href} href={c.href} className={`badge badge-${c.tone}`} style={{ padding: '8px 12px', fontSize: 12.5, justifyContent: 'center' }}>
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--ff-mono)', fontSize: 12, letterSpacing: '0.10em' }}>
        LOADING…
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
