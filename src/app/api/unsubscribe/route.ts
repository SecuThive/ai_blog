import { NextRequest, NextResponse } from 'next/server';
import { makeFreshClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.toLowerCase() ?? '';
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: '유효하지 않은 이메일입니다.' }, { status: 400 });
  }

  await makeFreshClient()
    .from('subscribers')
    .update({ active: false })
    .eq('email', email);

  return NextResponse.redirect(
    new URL(`/unsubscribe?done=1&email=${encodeURIComponent(email)}`, req.url)
  );
}
