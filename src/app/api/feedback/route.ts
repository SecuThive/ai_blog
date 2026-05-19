import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const post_slug = typeof body?.post_slug === 'string' ? body.post_slug.trim() : '';
  const type = body?.type === 'up' ? 'up' : body?.type === 'down' ? 'down' : null;

  if (!post_slug || !type) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }

  const col = type === 'up' ? 'helpful_count' : 'unhelpful_count';

  const { error } = await supabaseAdmin()
    .rpc('increment_feedback', { p_slug: post_slug, p_col: col });

  if (error) {
    // rpc 미존재 시 raw update 시도
    const { data: post } = await supabaseAdmin()
      .from('posts')
      .select('id,helpful_count,unhelpful_count')
      .eq('slug', post_slug)
      .single();

    if (!post) return NextResponse.json({ ok: true }); // 실패해도 클라이언트 UI는 정상 작동

    const updateData = type === 'up'
      ? { helpful_count: ((post.helpful_count as number) ?? 0) + 1 }
      : { unhelpful_count: ((post.unhelpful_count as number) ?? 0) + 1 };

    await supabaseAdmin().from('posts').update(updateData).eq('slug', post_slug);
  }

  return NextResponse.json({ ok: true });
}
