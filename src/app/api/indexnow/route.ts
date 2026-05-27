import { NextRequest, NextResponse } from 'next/server';

const INDEXNOW_KEY = 'b7e3f1a2c4d5e6f7a8b9c0d1e2f3a4b5';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';
const HOST = new URL(SITE_URL).hostname;

// Internal secret to prevent unauthorized submissions
const INTERNAL_SECRET = process.env.INDEXNOW_SECRET;

export async function POST(req: NextRequest) {
  // Optional: protect with a secret header
  if (INTERNAL_SECRET) {
    const secret = req.headers.get('x-indexnow-secret');
    if (secret !== INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let urls: string[] = [];
  try {
    const body = await req.json();
    urls = Array.isArray(body.urls) ? body.urls : [body.url].filter(Boolean);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (urls.length === 0) {
    return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
  }

  // Validate all URLs belong to this host
  const validUrls = urls.filter(u => {
    try { return new URL(u).hostname === HOST; } catch { return false; }
  });

  if (validUrls.length === 0) {
    return NextResponse.json({ error: 'URLs must be on this host' }, { status: 400 });
  }

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: validUrls,
  };

  // Submit to Bing (IndexNow) — also covers Yandex, DuckDuckGo via protocol
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  return NextResponse.json(
    { submitted: validUrls.length, status: res.status },
    { status: res.ok ? 200 : 502 }
  );
}

// GET: submit the full sitemap's recent URLs (last 50 posts + guides)
export async function GET(req: NextRequest) {
  if (INTERNAL_SECRET) {
    const secret = req.headers.get('x-indexnow-secret') ?? req.nextUrl.searchParams.get('secret');
    if (secret !== INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Dynamically import to avoid bundling supabase in edge
  const { makeFreshClient } = await import('@/lib/supabase');
  const client = makeFreshClient();

  const [posts, guides] = await Promise.all([
    client.from('posts').select('slug').eq('status', 'published').order('published_at', { ascending: false }).limit(50),
    client.from('engineer_guides').select('slug').eq('status', 'published').order('created_at', { ascending: false }).limit(50),
  ]);

  const urls = [
    ...(posts.data ?? []).map((p: { slug: string }) => `${SITE_URL}/blog/${p.slug}`),
    ...(guides.data ?? []).map((g: { slug: string }) => `${SITE_URL}/engineer/${g.slug}`),
  ];

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  return NextResponse.json({ submitted: urls.length, status: res.status }, { status: res.ok ? 200 : 502 });
}
