import { makeFreshClient } from '@/lib/supabase';

export const revalidate = 3600;

interface PostRow {
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  published_at: string;
  category: string;
}

export async function GET() {
  const { data } = await makeFreshClient()
    .from('posts')
    .select('title,slug,excerpt,author,published_at,category')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  const posts = (data ?? []) as PostRow[];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nodelog.kr';

  const items = posts.map(p => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${siteUrl}/blog/${p.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${p.slug}</guid>
      <description><![CDATA[${p.excerpt ?? ''}]]></description>
      <author>${p.author}</author>
      <category>${p.category}</category>
      <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
    </item>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nodelog — AI 기반 IT 테크 미디어</title>
    <link>${siteUrl}</link>
    <description>AI가 취재하고 분석하는 IT·개발·보안·인프라 전문 미디어.</description>
    <language>ko</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600',
    },
  });
}
