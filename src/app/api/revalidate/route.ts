import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { postCacheTag, guideCacheTag } from '@/lib/cacheTags';

// 앱 라우트는 app/[locale]/... 이고, ko는 proxy.ts가 접두사 없는 URL을 /ko/...로 rewrite한다.
// 그래서 목록 경로는 접두사 없는 형태(기존 호출 유지)와 /ko·/en 실제 라우트 경로를 모두 무효화한다.
const LOCALE_PREFIXES = ['', '/ko', '/en'] as const;

function revalidateLocalized(path: string) {
  for (const prefix of LOCALE_PREFIXES) {
    revalidatePath(`${prefix}${path}` || '/');
  }
}

function safeDecode(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-api-key') !== process.env.BLOG_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { slug, type = 'post' } = await req.json().catch(() => ({}));
  const cleanSlug = typeof slug === 'string' && slug.trim() ? safeDecode(slug.trim()) : null;

  // 목록·홈·sitemap·RSS (ISR 페이지만 — category/tag/series 상세 목록은 noStore 동적이라 불필요)
  for (const p of ['', '/trending', '/series', '/tags', '/archive', '/recommend']) revalidateLocalized(p);
  revalidatePath('/sitemap.xml');
  revalidatePath('/rss');

  // 예전엔 revalidatePath('/blog/[slug]', 'page')로 발행 1건마다 "모든" 상세 페이지를 무효화해
  // 다음 방문 때 전 글이 재생성(=글마다 본문·관련글 쿼리)되며 egress가 폭증했다. 이제 해당 slug만:
  //  - revalidateTag(ASCII 해시 태그): getPost/getGuide 캐시 태그. 한글 slug에서도 동작하는 주 경로
  //    (revalidatePath('/blog/<한글>')은 프로덕션에서 효과가 없었음 — lib/cacheTags.ts 참고).
  //  - revalidatePath(양 로케일 상세 경로): ASCII slug용 보조 수단(한글 slug에는 효과 없어도 무해).
  // 다른 글의 "관련 글/이전·다음 글"에 신규 글이 반영되는 것은 상세 ISR(1시간) 주기에 맡긴다.
  if (type === 'guide') {
    revalidateLocalized('/engineer');
    // /engineer 목록 데이터는 unstable_cache('engineer-list' 태그)로 캐싱된다(페이지 자체는 동적).
    revalidateTag('engineer-list', 'max');
    if (cleanSlug) {
      revalidateTag(guideCacheTag(cleanSlug), 'max');
      revalidateLocalized(`/engineer/${encodeURIComponent(cleanSlug)}`);
    }
  } else if (cleanSlug) {
    revalidateTag(postCacheTag(cleanSlug), 'max');
    revalidateLocalized(`/blog/${encodeURIComponent(cleanSlug)}`);
  }

  return NextResponse.json({ revalidated: true, type, slug: cleanSlug });
}
