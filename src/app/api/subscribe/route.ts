import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: '유효한 이메일을 입력해주세요.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin()
    .from('subscribers')
    .insert({ email });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '이미 구독 중인 이메일입니다.' }, { status: 409 });
    }
    return NextResponse.json({ error: '구독 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Nodelog <newsletter@thivelab.com>',
      to: email,
      subject: '✅ Nodelog 구독을 환영합니다!',
      html: `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <!-- 헤더 -->
        <tr>
          <td style="background:#0A0D14;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center">
            <div style="display:inline-flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;background:linear-gradient(135deg,#7BB5FF,#5535D4);border-radius:50%;display:inline-block"></div>
              <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px">Nodelog</span>
            </div>
            <p style="color:#8892a4;font-size:13px;margin:8px 0 0">IT·개발·보안 테크 미디어</p>
          </td>
        </tr>
        <!-- 본문 -->
        <tr>
          <td style="background:#fff;padding:40px 40px 32px;border-radius:0 0 16px 16px">
            <h1 style="font-size:24px;font-weight:700;color:#0A0D14;margin:0 0 16px;line-height:1.3">
              구독해 주셔서 감사합니다! 🎉
            </h1>
            <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 24px">
              이제 Nodelog의 최신 IT 인사이트를 가장 먼저 받아보실 수 있습니다.<br>
              매주 엄선된 기술 트렌드, 보안, 인프라, AI 콘텐츠를 전달해 드립니다.
            </p>
            <!-- 무엇을 받나요 -->
            <div style="background:#f7f7fb;border-radius:12px;padding:24px;margin:0 0 28px">
              <p style="font-size:13px;font-weight:600;color:#5535D4;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.5px">매주 받아보실 내용</p>
              <div style="display:flex;flex-direction:column;gap:10px">
                ${['🔐 보안 위협 & 대응 전략', '⚙️ 인프라 & 클라우드 실전 가이드', '🤖 AI & 자동화 최신 트렌드', '🛠️ 개발자 툴 & 기술 분석'].map(item => `
                <div style="display:flex;align-items:center;gap:10px;font-size:14px;color:#333">
                  <span>${item}</span>
                </div>`).join('')}
              </div>
            </div>
            <a href="${SITE_URL}" style="display:block;text-align:center;background:linear-gradient(135deg,#7BB5FF,#5535D4);color:#fff;text-decoration:none;border-radius:10px;padding:14px 32px;font-size:15px;font-weight:600">
              최신 글 바로 보기 →
            </a>
            <p style="font-size:12px;color:#aaa;margin:24px 0 0;text-align:center;line-height:1.6">
              구독 해지를 원하시면 <a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}" style="color:#aaa">여기</a>를 클릭하세요.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }).catch((err: unknown) => {
      console.error('welcome email error:', err);
    });
  }

  return NextResponse.json({ ok: true });
}
