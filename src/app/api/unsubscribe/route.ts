import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyUnsubscribeToken } from '@/lib/unsubscribeToken';

// GET은 상태를 바꾸지 않는다.
// - 예전 메일의 /api/unsubscribe?email=... 링크: 이메일만으로 해지하던 방식은 제3자가 남의 구독을 해지할 수
//   있어 폐기했다. 이메일을 URL에 남기지 않도록 이메일 없는 안내 화면으로만 보낸다.
// - ?t=<token> 링크: 확인 화면으로 보낸다(실제 해지는 POST).
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t');
  const target = new URL('/unsubscribe', req.url);
  if (token) target.searchParams.set('t', token);
  else target.searchParams.set('legacy', '1');
  return NextResponse.redirect(target, 303);
}

// POST { token } — 서명이 맞는 경우에만 해당 구독을 비활성화한다.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = verifyUnsubscribeToken((body as { token?: unknown })?.token);
  if (!id) {
    return NextResponse.json({ error: 'invalid_or_expired_link' }, { status: 400 });
  }
  const { error } = await supabaseAdmin()
    .from('subscribers')
    .update({ active: false })
    .eq('id', id);
  if (error) {
    console.error('unsubscribe failed:', error.code);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
  // 이미 해지됐거나 존재하지 않는 id여도 같은 응답을 준다(구독 여부를 노출하지 않음).
  return NextResponse.json({ ok: true });
}
