import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const type = typeof body?.type === 'string' ? body.type.trim() : '';
  const company = typeof body?.company === 'string' ? body.company.trim() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';

  if (!name || !email || !email.includes('@') || !message) {
    return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin()
    .from('contact_messages')
    .insert({ name, email, type, company, message });

  if (error) {
    console.error('contact insert error:', error.message);
    return NextResponse.json({ error: '문의 저장 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
