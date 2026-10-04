import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: '유효하지 않은 이메일입니다.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin()
    .from('subscribers')
    .update({ active: false })
    .eq('email', email);
  if (error) return NextResponse.json({ error: '구독 해지 처리에 실패했습니다.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Older emails may point here with an email parameter. Never echo that value into a page URL.
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/unsubscribe', req.url));
}
