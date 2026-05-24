import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

// POST /api/newsletter/send
// Headers: x-api-key: <NEWSLETTER_API_KEY>
// Body: { subject?: string, preview?: string }  — optional overrides
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.NEWSLETTER_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const client = supabaseAdmin();

  // 최근 7일간 발행된 글, 조회수 상위 8개
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: posts, error: postsError } = await client
    .from('posts')
    .select('title,slug,excerpt,category,tags,views,published_at')
    .eq('status', 'published')
    .gte('published_at', since)
    .order('views', { ascending: false })
    .limit(8);

  if (postsError) console.error('posts query error:', postsError);

  if (!posts || posts.length === 0) {
    return NextResponse.json({ error: '지난 7일간 발행된 글이 없습니다.' }, { status: 404 });
  }

  // 구독자 목록
  const { data: subscribers } = await client
    .from('subscribers')
    .select('email')
    .eq('active', true)
    .limit(1000);

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ error: '활성 구독자가 없습니다.' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const weekStr = getWeekString();
  const subject = body.subject ?? `Nodelog 주간 브리핑 — ${weekStr}`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  let failed = 0;

  // Resend는 배치 전송 지원 (최대 100개/요청)
  const emailList = subscribers.map((s: { email: string }) => ({
    from: 'Nodelog <newsletter@thivelab.com>',
    to: s.email,
    subject,
    html: buildHtml(posts, s.email, weekStr),
  }));

  // 100개씩 배치 처리
  for (let i = 0; i < emailList.length; i += 100) {
    const batch = emailList.slice(i, i + 100);
    try {
      await resend.batch.send(batch);
      sent += batch.length;
    } catch (err) {
      console.error('batch send error:', err);
      failed += batch.length;
    }
  }

  return NextResponse.json({ ok: true, sent, failed, posts: posts.length, subscribers: subscribers.length });
}

function getWeekString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${year}년 ${week}주차`;
}

interface Post {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  views: number;
  published_at: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  '보안': '🔐',
  '인프라': '⚙️',
  'AI & 자동화': '🤖',
  '개발': '💻',
  'IT 트렌드': '📡',
  '툴 리뷰': '🛠️',
};

function buildHtml(posts: Post[], email: string, weekStr: string): string {
  const topPost = posts[0];
  const restPosts = posts.slice(1);

  const featuredHtml = `
    <tr>
      <td style="padding:0 0 24px">
        <a href="${SITE_URL}/blog/${topPost.slug}" style="text-decoration:none;display:block;background:#f7f7fb;border-radius:12px;padding:24px;border-left:4px solid #5535D4">
          <span style="font-size:11px;font-weight:600;color:#5535D4;text-transform:uppercase;letter-spacing:0.5px">${CATEGORY_EMOJI[topPost.category] ?? '📄'} ${topPost.category} · 이번 주 TOP</span>
          <h2 style="font-size:18px;font-weight:700;color:#0A0D14;margin:8px 0 10px;line-height:1.4">${topPost.title}</h2>
          <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 12px">${topPost.excerpt?.slice(0, 120)}...</p>
          <span style="font-size:12px;color:#888">조회 ${topPost.views}</span>
        </a>
      </td>
    </tr>`;

  const listHtml = restPosts.map(p => `
    <tr>
      <td style="padding:0 0 16px;border-bottom:1px solid #f0f0f0">
        <a href="${SITE_URL}/blog/${p.slug}" style="text-decoration:none">
          <span style="font-size:11px;color:#888;font-weight:500">${CATEGORY_EMOJI[p.category] ?? '📄'} ${p.category}</span>
          <div style="font-size:15px;font-weight:600;color:#0A0D14;margin:4px 0 4px;line-height:1.4">${p.title}</div>
          <span style="font-size:12px;color:#aaa">읽기 ${p.reading_time ?? 3}분</span>
        </a>
      </td>
    </tr>`).join('');

  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <!-- 헤더 -->
        <tr>
          <td style="background:#0A0D14;border-radius:16px 16px 0 0;padding:28px 40px">
            <table width="100%"><tr>
              <td>
                <div style="display:inline-flex;align-items:center;gap:8px">
                  <div style="width:32px;height:32px;background:linear-gradient(135deg,#7BB5FF,#5535D4);border-radius:50%;display:inline-block"></div>
                  <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px">Nodelog</span>
                </div>
                <p style="color:#8892a4;font-size:12px;margin:4px 0 0">주간 브리핑 · ${weekStr}</p>
              </td>
              <td align="right">
                <a href="${SITE_URL}" style="font-size:12px;color:#7BB5FF;text-decoration:none">사이트 방문 →</a>
              </td>
            </tr></table>
          </td>
        </tr>
        <!-- 본문 -->
        <tr>
          <td style="background:#fff;padding:32px 40px;border-radius:0 0 16px 16px">
            <p style="font-size:14px;color:#666;margin:0 0 24px;line-height:1.6">
              안녕하세요! 이번 주 Nodelog에서 주목받은 글 <strong>${posts.length}편</strong>을 모았습니다.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${featuredHtml}
              ${restPosts.length > 0 ? `<tr><td style="padding:0 0 16px"><p style="font-size:13px;font-weight:600;color:#333;margin:0">이번 주 다른 글</p></td></tr>` : ''}
              ${listHtml}
            </table>
            <div style="margin:28px 0 0;padding:20px;background:#f7f7fb;border-radius:12px;text-align:center">
              <a href="${SITE_URL}" style="display:inline-block;background:linear-gradient(135deg,#7BB5FF,#5535D4);color:#fff;text-decoration:none;border-radius:8px;padding:12px 28px;font-size:14px;font-weight:600">
                Nodelog 전체 글 보기 →
              </a>
            </div>
            <p style="font-size:11px;color:#bbb;margin:24px 0 0;text-align:center;line-height:1.7">
              본 메일은 Nodelog 뉴스레터를 구독하신 분께 발송됩니다.<br>
              <a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}" style="color:#bbb">구독 해지</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
