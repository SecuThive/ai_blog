import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '시리즈 — Nodelog',
  description: '하나의 주제를 끝까지 따라갈 수 있도록 단계별로 구성된 연재.',
};

export const revalidate = 60;

function makeFreshClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

function catTone(cat: string): string {
  if (cat.includes('AI') || cat.includes('자동화')) return 'blue';
  if (cat.includes('트렌드') || cat.includes('IT')) return 'purple';
  if (cat.includes('개발') || cat.includes('인프라')) return 'mint';
  if (cat.includes('툴') || cat.includes('리뷰')) return 'amber';
  if (cat.includes('보안')) return 'rose';
  return 'blue';
}

interface SeriesInfo {
  category: string;
  count: number;
  latestDate: string;
  tone: string;
}

async function getSeries(): Promise<SeriesInfo[]> {
  const { data } = await makeFreshClient()
    .from('posts')
    .select('category,published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const map = new Map<string, { count: number; latestDate: string }>();
  for (const p of (data ?? [])) {
    const cat = p.category as string;
    if (!map.has(cat)) {
      map.set(cat, { count: 0, latestDate: p.published_at ?? '' });
    }
    map.get(cat)!.count++;
  }

  return Array.from(map.entries())
    .map(([category, v]) => ({ category, ...v, tone: catTone(category) }))
    .sort((a, b) => b.count - a.count);
}

export default async function SeriesPage() {
  const series = await getSeries();

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">SERIES · 학습 경로</div>
          <h1 className="page-title">시리즈로 깊게 파보기</h1>
          <p className="page-lead">하나의 주제를 끝까지 따라갈 수 있도록 단계별로 구성된 연재. 입문부터 실무까지, 자연스럽게 이어집니다.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid-3">
            {series.map(s => (
              <Link
                key={s.category}
                href={`/series/${encodeURIComponent(s.category)}`}
                className="card card-link"
                style={{ padding: 0, overflow: 'hidden' }}
              >
                <div className={`card-thumb thumb-${s.tone}`} style={{ borderRadius: 0 }}>
                  {s.category}
                </div>
                <div className="card-body">
                  <div className="card-meta">
                    <span className={`badge badge-${s.tone}`}>{s.category}</span>
                    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)' }}>{s.count}편</span>
                  </div>
                  <h3 className="card-title">{s.category} 시리즈</h3>
                  <p className="card-excerpt">
                    {s.category} 카테고리의 {s.count}편 글을 순서대로 탐색하세요.
                  </p>
                  <div className="card-foot">
                    <span>{s.count}편</span>
                    <span className="dot" />
                    <span>최근 업데이트 {new Date(s.latestDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
