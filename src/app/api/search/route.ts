import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  if (q.length < 1) return NextResponse.json([]);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  const client = createClient(url, key);

  const { data } = await client
    .from('posts')
    .select('id,title,slug,excerpt,category,published_at')
    .eq('status', 'published')
    .or(`title.ilike.%${q}%,category.ilike.%${q}%,excerpt.ilike.%${q}%`)
    .order('published_at', { ascending: false })
    .limit(6);

  return NextResponse.json(data ?? []);
}
