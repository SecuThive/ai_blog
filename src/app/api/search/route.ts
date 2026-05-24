import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function escape(q: string) {
  return q.replace(/[%_\\]/g, c => `\\${c}`);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('q')?.trim() ?? '';
  const source = searchParams.get('source') ?? 'all';
  if (raw.length < 1) return NextResponse.json([]);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  const client = createClient(url, key);

  // 키워드를 공백 기준으로 분리해 각각 OR 검색 → 단일 키워드보다 넓은 매칭
  const terms = raw.split(/\s+/).filter(Boolean).slice(0, 5);
  const q = escape(raw);

  // 제목 완전 매칭 우선 + 각 term별 부분 매칭
  const buildOr = (cols: string[]) => {
    const parts: string[] = [];
    for (const col of cols) {
      parts.push(`${col}.ilike.%${q}%`);
      for (const t of terms) {
        if (t !== raw) parts.push(`${col}.ilike.%${escape(t)}%`);
      }
    }
    return parts.join(',');
  };

  const [postsResult, guidesResult] = await Promise.all([
    source === 'guides'
      ? Promise.resolve({ data: [] as Record<string, unknown>[] })
      : client
          .from('posts')
          .select('id,title,slug,excerpt,category,tags,published_at,views')
          .eq('status', 'published')
          .or(buildOr(['title', 'excerpt', 'category']))
          .order('views', { ascending: false })
          .limit(source === 'posts' ? 10 : 6),
    source === 'posts'
      ? Promise.resolve({ data: [] as Record<string, unknown>[] })
      : client
          .from('engineer_guides')
          .select('id,title,slug,summary,category,tags,created_at,views')
          .eq('status', 'published')
          .or(buildOr(['title', 'summary', 'category']))
          .order('views', { ascending: false })
          .limit(source === 'guides' ? 10 : 5),
  ]);

  // 클라이언트 사이드 관련도 정렬: 제목에 검색어 포함 시 상위
  function scorePost(title: string): number {
    const t = title.toLowerCase();
    const rq = raw.toLowerCase();
    if (t.startsWith(rq)) return 3;
    if (t.includes(rq)) return 2;
    if (terms.some(term => t.includes(term.toLowerCase()))) return 1;
    return 0;
  }

  const posts = (postsResult.data ?? [])
    .map((p) => ({ ...p, source: 'post', _score: scorePost(String(p.title ?? '')) }))
    .sort((a, b) => (b._score as number) - (a._score as number))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ _score, ...p }) => p);

  const guides = (guidesResult.data ?? [])
    .map((g) => ({
      id: g.id,
      title: g.title,
      slug: g.slug,
      excerpt: g.summary,
      category: g.category,
      tags: g.tags,
      published_at: g.created_at,
      views: g.views,
      source: 'guide',
      _score: scorePost(String(g.title ?? '')),
    }))
    .sort((a, b) => b._score - a._score)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ _score, ...g }) => g);

  return NextResponse.json([...posts, ...guides]);
}
