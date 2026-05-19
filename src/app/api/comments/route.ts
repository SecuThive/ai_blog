import { NextRequest, NextResponse } from 'next/server';
import { makeFreshClient, supabaseAdmin } from '@/lib/supabase';
import { createHash } from 'crypto';

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

  // IP 해시 (프라이버시 보호)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const ipHash = createHash('sha256').update(ip + process.env.BLOG_API_KEY).digest('hex').slice(0, 16);

  // Rate limit: 동일 IP에서 5분 내 3건 초과 시 차단
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin()
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', fiveMinAgo);

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요. (5분에 3개 제한)' }, { status: 429 });
  }

  const name = (typeof body?.name === 'string' ? body.name.trim() : '') || '익명';

  const { error } = await supabaseAdmin()
    .from('comments')
    .insert({ post_slug, name: name.slice(0, 50), content, ip_hash: ipHash });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
