import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { postCacheTag, guideCacheTag } from '@/lib/cacheTags';

export async function POST(req: NextRequest) {
  if (req.headers.get('x-api-key') !== process.env.BLOG_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'JSON object required' }, { status: 400 });
  }
  const { slug, type = 'post' } = body;
  if ((slug !== undefined && (typeof slug !== 'string' || !slug.trim()))
    || (type !== 'post' && type !== 'guide')) {
    return NextResponse.json({ error: 'Invalid slug or type' }, { status: 400 });
  }

  revalidatePath('/');
  revalidatePath('/trending');
  revalidatePath('/series');
  revalidatePath('/tags');
  revalidatePath('/archive');
  revalidatePath('/sitemap.xml');
  revalidatePath('/category/[cat]', 'page');
  revalidatePath('/tag/[tag]', 'page');
  revalidatePath('/series/[id]', 'page');

  // 편집 웹훅은 즉시 만료시켜 다음 요청부터 새 본문을 읽는다.
  // 'max'는 첫 요청에 예전 본문을 반환하므로 발행 직후 검증에 맞지 않는다.
  // 상세 HTML은 동적 렌더링하며, 이 태그는 본문 데이터 캐시에 적용된다.
  if (type === 'guide') {
    revalidatePath('/engineer');
    revalidatePath('/engineer/[slug]', 'page');
    if (slug) revalidateTag(guideCacheTag(slug), { expire: 0 });
  } else {
    revalidatePath('/blog/[slug]', 'page');
    if (slug) revalidateTag(postCacheTag(slug), { expire: 0 });
  }

  return NextResponse.json({ revalidated: true, type, slug });
}
