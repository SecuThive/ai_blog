import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createHash } from 'crypto';

// 댓글 좋아요. 로그인 없는 가벼운 상호작용이라 IP 해시로 멱등 처리한다:
//  - comment_likes(comment_id, ip_hash) UNIQUE 제약으로 한 사람당 1회만 반영,
//  - 클라이언트는 localStorage로 버튼 상태를 기억(UX),
//  - 실제 증가는 increment_comment_likes RPC로 원자적 처리.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === 'number' && Number.isInteger(body.id) ? body.id : null;
  if (id === null) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const ipHash = createHash('sha256').update(ip + process.env.BLOG_API_KEY).digest('hex').slice(0, 16);

  const admin = supabaseAdmin();

  // (댓글, IP) 좋아요 기록 시도 — 이미 눌렀으면 UNIQUE 위반(23505)으로 멱등 처리
  const { error: insErr } = await admin
    .from('comment_likes')
    .insert({ comment_id: id, ip_hash: ipHash });

  if (insErr) {
    if (insErr.code === '23505') {
      const { data: c } = await admin.from('comments').select('likes').eq('id', id).single();
      return NextResponse.json({ likes: c?.likes ?? 0, already: true });
    }
    // 부모 FK 위반 등 = 존재하지 않는 댓글
    if (insErr.code === '23503') {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  const { data, error } = await admin.rpc('increment_comment_likes', { cid: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ likes: data ?? 0 });
}
