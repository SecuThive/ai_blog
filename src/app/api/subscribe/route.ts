import { NextRequest, NextResponse } from 'next/server';
import { makeFreshClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: '유효한 이메일을 입력해주세요.' }, { status: 400 });
  }

  const { error } = await makeFreshClient()
    .from('subscribers')
    .insert({ email });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '이미 구독 중인 이메일입니다.' }, { status: 409 });
    }
    return NextResponse.json({ error: '구독 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
