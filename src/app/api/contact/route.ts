import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { MAX_BODY_BYTES, clientIp, createRateLimiter, parseContact, sameSiteOrigin } from '@/lib/contactPolicy';

// 수신처·발신자는 환경변수로 바꿀 수 있다. 발신 도메인은 Resend에서 인증된 주소만 쓸 수 있다.
const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'thive8564@gmail.com';
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'Nodelog 문의 <onboarding@resend.dev>';
// IP당 10분에 3건, 같은 이메일로는 1시간에 5건.
const allowIp = createRateLimiter(3, 10 * 60 * 1000);
const allowEmail = createRateLimiter(5, 60 * 60 * 1000);
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export async function POST(req: NextRequest) {
  if (!sameSiteOrigin(req.headers)) {
    return NextResponse.json({ error: '허용되지 않은 요청입니다.' }, { status: 403 });
  }
  if (!(req.headers.get('content-type') || '').includes('application/json')) {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 415 });
  }
  const raw = await req.text().catch(() => '');
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: '요청이 너무 큽니다.' }, { status: 413 });
  }
  let body: unknown = {};
  try { body = JSON.parse(raw); } catch { /* parseContact가 필수 항목 오류로 처리한다 */ }

  const parsed = parseContact(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { name, email, type, company, message } = parsed.value;

  if (!allowIp(clientIp(req.headers)) || !allowEmail(email)) {
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429, headers: { 'Retry-After': '600' } });
  }

  // Supabase 저장
  const safe = { name: escapeHtml(name), email: escapeHtml(email), type: escapeHtml(type), company: escapeHtml(company), message: escapeHtml(message) };
  const { error: dbError } = await supabaseAdmin()
    .from('contact_messages')
    .insert({ name, email, type, company, message });

  if (dbError) {
    console.error('contact insert error:', dbError.message);
    return NextResponse.json({ error: '문의 저장 중 오류가 발생했습니다.' }, { status: 500 });
  }

  // The message is saved even if the email notification fails. Report that
  // separately so the visitor is not told the operator was notified.
  let notificationSent = false;
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email,
      subject: `${type === 'catalog' ? '[카탈로그]' : '[Nodelog 문의]'} ${(type || '일반 문의').replace(/[\r\n]/g, ' ')} — ${name.replace(/[\r\n]/g, ' ')}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a2e">
          <h2 style="font-size:18px;margin:0 0 24px;border-bottom:1px solid #eee;padding-bottom:12px">
            📬 Nodelog 새 문의가 도착했습니다
          </h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#666;width:100px">이름</td><td style="padding:8px 0"><strong>${safe.name}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#666">이메일</td><td style="padding:8px 0"><a href="mailto:${safe.email}" style="color:#5b6cf8">${safe.email}</a></td></tr>
            ${type    ? `<tr><td style="padding:8px 0;color:#666">문의 유형</td><td style="padding:8px 0">${safe.type}</td></tr>` : ''}
            ${company ? `<tr><td style="padding:8px 0;color:#666">회사/소속</td><td style="padding:8px 0">${safe.company}</td></tr>` : ''}
          </table>
          <div style="margin:24px 0;padding:16px;background:#f7f7fb;border-radius:8px;font-size:14px;line-height:1.7;white-space:pre-wrap">${safe.message}</div>
          <p style="font-size:12px;color:#aaa;margin-top:24px">— Nodelog Contact Form · thivelab.com</p>
        </div>
      `,
    }).catch((err: unknown) => ({ error: err instanceof Error ? err : new Error('Unknown notification error') }));
    if (error) {
      console.error('contact notification failed:', error.message);
    } else {
      notificationSent = true;
    }
  } else {
    console.error('contact notification unavailable: RESEND_API_KEY missing');
  }

  return NextResponse.json({ ok: true, notificationSent });
}
