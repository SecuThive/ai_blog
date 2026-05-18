import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const TO_EMAIL = 'thive8564@gmail.com';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const name    = typeof body?.name    === 'string' ? body.name.trim()                : '';
  const email   = typeof body?.email   === 'string' ? body.email.trim().toLowerCase() : '';
  const type    = typeof body?.type    === 'string' ? body.type.trim()                : '';
  const company = typeof body?.company === 'string' ? body.company.trim()             : '';
  const message = typeof body?.message === 'string' ? body.message.trim()             : '';

  if (!name || !email || !email.includes('@') || !message) {
    return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 });
  }

  // Supabase 저장
  const { error: dbError } = await supabaseAdmin()
    .from('contact_messages')
    .insert({ name, email, type, company, message });

  if (dbError) {
    console.error('contact insert error:', dbError.message);
    return NextResponse.json({ error: '문의 저장 중 오류가 발생했습니다.' }, { status: 500 });
  }

  // 이메일 발송
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Nodelog 문의 <onboarding@resend.dev>',
      to: TO_EMAIL,
      replyTo: email,
      subject: `[Nodelog 문의] ${type || '일반 문의'} — ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a2e">
          <h2 style="font-size:18px;margin:0 0 24px;border-bottom:1px solid #eee;padding-bottom:12px">
            📬 Nodelog 새 문의가 도착했습니다
          </h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#666;width:100px">이름</td><td style="padding:8px 0"><strong>${name}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#666">이메일</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#5b6cf8">${email}</a></td></tr>
            ${type    ? `<tr><td style="padding:8px 0;color:#666">문의 유형</td><td style="padding:8px 0">${type}</td></tr>` : ''}
            ${company ? `<tr><td style="padding:8px 0;color:#666">회사/소속</td><td style="padding:8px 0">${company}</td></tr>` : ''}
          </table>
          <div style="margin:24px 0;padding:16px;background:#f7f7fb;border-radius:8px;font-size:14px;line-height:1.7;white-space:pre-wrap">${message}</div>
          <p style="font-size:12px;color:#aaa;margin-top:24px">— Nodelog Contact Form · nodelog.kr</p>
        </div>
      `,
    }).catch((err: unknown) => {
      console.error('resend error:', err);
    });
  }

  return NextResponse.json({ ok: true });
}
