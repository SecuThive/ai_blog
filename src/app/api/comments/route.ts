import { NextRequest, NextResponse } from 'next/server';
import { makeFreshClient, supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('post_slug');
  if (!slug) return NextResponse.json({ error: 'post_slug required' }, { status: 400 });

  const { data, error } = await makeFreshClient()
    .from('comments')
    .select('id,name,content,created_at')
    .eq('post_slug', slug)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const content = typeof body?.content === 'string' ? body.content.trim().slice(0, 1000) : '';
  const post_slug = typeof body?.post_slug === 'string' ? body.post_slug.trim() : '';

  if (!content || !post_slug) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }

  const name = (typeof body?.name === 'string' ? body.name.trim() : '') || '익명';

  const { error } = await supabaseAdmin()
    .from('comments')
    .insert({ post_slug, name: name.slice(0, 50), content });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
