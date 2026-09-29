import { makeFreshClient } from '@/lib/supabase';

export const revalidate = 3600;

// RSS는 요약(excerpt)만 싣는다 — 본문(content)은 조회하지 않는다.
// 예전엔 최신 50편의 전체 본문을 매 재생성마다 가져와 <content:encoded>에 그대로 넣었는데,
// 본문 끝에 붙은 <!--NodelogEN {영문 JSON}--> 블록까지 날것으로 노출됐고(피드 리더에 JSON이 보임)
// 그 블록 때문에 글당 페이로드가 사실상 두 배라 Supabase egress 비용이 컸다.
// 본문을 정제해 20편으로 줄이는 안도 있지만, 정제는 가져온 뒤에야 가능해 egress는 그대로 든다.
// 피드 항목은 사이트 글로 연결되므로 요약 + 링크로 충분하다고 판단해 content:encoded를 뺐다.
// (i18n.* 태그는 원래 피드에 싣지 않는다 — tags 컬럼 자체를 조회하지 않음.)
const RSS_ITEM_LIMIT = 50;

interface PostRow {
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string;
  category: string;
}

/** CDATA 안에 "]]>"가 들어가면 XML이 깨지므로 분할한다. */
function cdata(value: string | null | undefined): string {
  return `<![CDATA[${String(value ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

export async function GET() {
  const { data, error } = await makeFreshClient()
    .from('posts')
    .select('title,slug,excerpt,published_at,category')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(RSS_ITEM_LIMIT);
  // 조회 실패 시 throw → 빈 피드가 1시간 캐시되지 않고 직전 정상본이 유지된다.
  if (error) throw new Error(`rss fetch failed: ${error.code ?? ''} ${error.message}`);

  const posts = (data ?? []) as PostRow[];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

  const items = posts.map(p => `
    <item>
      <title>${cdata(p.title)}</title>
      <link>${siteUrl}/blog/${p.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${p.slug}</guid>
      <description>${cdata(p.excerpt)}</description>
      <author><![CDATA[Nodelog 기술 편집팀]]></author>
      <category>${cdata(p.category)}</category>
      <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
    </item>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nodelog — IT·개발·보안 테크 미디어</title>
    <link>${siteUrl}</link>
    <description>공식 문서와 기술 자료를 확인하고 지속적으로 업데이트하는 IT 실무 미디어.</description>
    <language>ko</language>
    <atom:link href="${siteUrl}/rss" rel="self" type="application/rss+xml" />
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
