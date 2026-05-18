import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const source = searchParams.get('source') ?? 'all';
  if (q.length < 1) return NextResponse.json([]);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  const client = createClient(url, key);

  const [postsResult, guidesResult] = await Promise.all([
    source === 'guides'
      ? Promise.resolve({ data: [] })
      : client
          .from('posts')
          .select('id,title,slug,excerpt,category,published_at')
          .eq('status', 'published')
          .or(`title.ilike.%${q}%,category.ilike.%${q}%,excerpt.ilike.%${q}%`)
          .order('published_at', { ascending: false })
          .limit(source === 'posts' ? 8 : 5),
    source === 'posts'
      ? Promise.resolve({ data: [] })
      : client
          .from('engineer_guides')
          .select('id,title,slug,summary,category,created_at')
          .eq('status', 'published')
          .or(`title.ilike.%${q}%,category.ilike.%${q}%,summary.ilike.%${q}%`)
          .order('created_at', { ascending: false })
          .limit(source === 'guides' ? 8 : 4),
  ]);

  const posts = (postsResult.data ?? []).map((p: Record<string, unknown>) => ({
    ...p,
    source: 'post',
  }));

  const guides = (guidesResult.data ?? []).map((g: Record<string, unknown>) => ({
    id: g.id,
    title: g.title,
    slug: g.slug,
    excerpt: g.summary,
    category: g.category,
    published_at: g.created_at,
    source: 'guide',
  }));

  return NextResponse.json([...posts, ...guides]);
}
