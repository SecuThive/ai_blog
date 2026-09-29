import { NextRequest, NextResponse } from 'next/server';
import { makeFreshClient } from '@/lib/supabase';
import { withEnFallbackContent } from '@/lib/enFallback';
import { titleForLocale, excerptForLocale } from '@/i18n/content';
import type { Locale } from '@/i18n/config';

// POST /api/bookmarks — 북마크 페이지용 배치 조회.
// 예전엔 북마크 페이지가 저장된 글마다 GET /api/posts/[slug]를 따로 호출해
// (1) 글마다 select('*')로 전체 본문을 가져오고 (2) 호출마다 조회수를 +1 했다.
// 이 엔드포인트는 한 번의 요청으로 카드에 필요한 컬럼만 조회하고 조회수는 건드리지 않는다.
// slug는 한글이 많아 GET 쿼리스트링이 길어지므로 POST JSON 본문으로 받는다.

const MAX_SLUGS = 100;
// PostgREST in() 필터는 GET URL에 실리므로(한글 slug는 퍼센트 인코딩 시 3배) 청크로 나눈다.
const CHUNK = 25;
const CARD_SELECT = 'id,title,slug,excerpt,category,published_at,tags,content_evidence';

interface Row {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  published_at: string;
  tags: string[] | null;
  content_evidence?: unknown;
  content?: string | null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { slugs?: unknown; locale?: unknown } | null;
  const locale: Locale = body?.locale === 'en' ? 'en' : 'ko';
  const slugs = Array.isArray(body?.slugs)
    ? [...new Set(body.slugs.filter((s): s is string => typeof s === 'string' && s.length > 0 && s.length <= 300))]
    : [];
  if (slugs.length === 0) return NextResponse.json({ posts: [] });
  if (slugs.length > MAX_SLUGS) {
    return NextResponse.json({ error: `too many slugs (max ${MAX_SLUGS})` }, { status: 400 });
  }

  const client = makeFreshClient();
  const rows: Row[] = [];
  for (let i = 0; i < slugs.length; i += CHUNK) {
    const { data, error } = await client
      .from('posts')
      .select(CARD_SELECT)
      .eq('status', 'published')
      .in('slug', slugs.slice(i, i + CHUNK));
    if (error) return NextResponse.json({ error: 'fetch failed' }, { status: 502 });
    rows.push(...((data ?? []) as Row[]));
  }

  // 영문 제목/요약 태그가 없는 예외 행만 content 보충(en 요청일 때만).
  const withEn = await withEnFallbackContent(client, 'posts', rows, locale);
  const posts = withEn.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: titleForLocale(locale, p.title, { tags: p.tags, content_evidence: p.content_evidence, content: p.content }),
    excerpt: excerptForLocale(locale, p.excerpt, { tags: p.tags, content_evidence: p.content_evidence, content: p.content }),
    category: p.category,
    published_at: p.published_at,
  }));

  return NextResponse.json({ posts }, { headers: { 'Cache-Control': 'no-store' } });
}
