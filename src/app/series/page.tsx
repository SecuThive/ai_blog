import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import { toneForSeries } from '@/lib/utils';

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

interface SeriesInfo {
  name: string;
  count: number;
  latestDate: string;
  tone: string;
}

async function getSeries(): Promise<SeriesInfo[]> {
  const { data } = await makeFreshClient()
    .from('posts')
    .select('tags,published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const map = new Map<string, { count: number; latestDate: string }>();

  for (const p of (data ?? [])) {
    const tags: string[] = p.tags ?? [];
    const seriesTag = tags.find(t => t.startsWith('series:'));
    if (!seriesTag) continue;
    const seriesName = seriesTag.replace('series:', '');
    if (!map.has(seriesName)) {
      map.set(seriesName, { count: 0, latestDate: p.published_at ?? '' });
    }
    map.get(seriesName)!.count++;
  }

  return Array.from(map.entries())
    .map(([name, v]) => ({ name, ...v, tone: toneForSeries(name) }))
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
          {series.length === 0 ? (
            <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '60px 0' }}>
              준비 중인 시리즈가 곧 공개됩니다.
            </p>
          ) : (
            <div className="grid-3">
              {series.map(s => (
                <Link
                  key={s.name}
                  href={`/series/${encodeURIComponent(s.name)}`}
                  className="card card-link"
                  style={{ padding: 0, overflow: 'hidden' }}
                >
                  <div className={`card-thumb thumb-${s.tone}`} style={{ borderRadius: 0 }}>
                    {s.name}
                  </div>
                  <div className="card-body">
                    <div className="card-meta">
                      <span className={`badge badge-${s.tone}`}>시리즈</span>
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)' }}>{s.count}편</span>
                    </div>
                    <h3 className="card-title">{s.name}</h3>
                    <p className="card-excerpt">
                      {s.count}편으로 구성된 심층 연재. 처음부터 끝까지 따라가며 주제를 완전히 이해하세요.
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
          )}
        </div>
      </section>
    </div>
  );
}
