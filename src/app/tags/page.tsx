import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '태그 — Nodelog',
  description: '키워드 단위로 콘텐츠를 탐색하세요.',
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

interface TagInfo { tag: string; count: number }

async function getTags(): Promise<{ popular: TagInfo[]; byCategory: { cat: string; tone: string; tags: TagInfo[] }[] }> {
  noStore();
  const { data } = await makeFreshClient()
    .from('posts')
    .select('tags,category')
    .eq('status', 'published');

  const tagCount = new Map<string, number>();
  const catTags = new Map<string, Map<string, number>>();

  for (const p of (data ?? [])) {
    const tags = (p.tags ?? []) as string[];
    const cat = p.category as string;
    if (!catTags.has(cat)) catTags.set(cat, new Map());
    for (const t of tags) {
      tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
      const ctMap = catTags.get(cat)!;
      ctMap.set(t, (ctMap.get(t) ?? 0) + 1);
    }
  }

  const popular = Array.from(tagCount.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 40);

  const byCategory = Array.from(catTags.entries()).map(([cat, tMap]) => ({
    cat,
    tone: catTone(cat),
    tags: Array.from(tMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  }));

  return { popular, byCategory };
}

export default async function TagsPage() {
  const { popular, byCategory } = await getTags();

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">TAGS</div>
          <h1 className="page-title">태그</h1>
          <p className="page-lead">키워드 단위로 콘텐츠를 탐색하세요. 도구·기술·개념별로 정돈된 진입점입니다.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ marginBottom: 28, fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em' }}>
            POPULAR · 인기 태그
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 56 }}>
            {popular.map(({ tag, count }) => (
              <Link
                key={tag}
                href={`/tag/${encodeURIComponent(tag)}`}
                className="tag-chip"
                style={{ fontSize: 13.5, padding: '8px 14px' }}
              >
                #{tag} <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', marginLeft: 4 }}>{count}</span>
              </Link>
            ))}
            {popular.length === 0 && (
              <div style={{ color: 'var(--text-4)', fontSize: 14 }}>태그가 없습니다.</div>
            )}
          </div>

          {byCategory.length > 0 && (
            <>
              <div style={{ marginBottom: 28, fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em' }}>
                BY CATEGORY · 카테고리별
              </div>
              <div className="grid-2">
                {byCategory.map(c => (
                  <div key={c.cat} className="card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h4 style={{ margin: 0, fontSize: 15, letterSpacing: '-0.01em' }}>{c.cat}</h4>
                      <span className={`badge badge-${c.tone}`}>{c.cat}</span>
                    </div>
                    <div className="pill-row">
                      {c.tags.map(({ tag, count }) => (
                        <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`} className="tag-chip">
                          {tag} <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', marginLeft: 2 }}>{count}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
