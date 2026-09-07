import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { postCacheTag, guideCacheTag } from '@/lib/cacheTags';

export async function POST(req: NextRequest) {
  if (req.headers.get('x-api-key') !== process.env.BLOG_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { slug, type = 'post' } = await req.json().catch(() => ({}));

  revalidatePath('/');
  revalidatePath('/trending');
  revalidatePath('/series');
  revalidatePath('/tags');
  revalidatePath('/archive');
  revalidatePath('/sitemap.xml');

  // 개별 글/가이드는 revalidatePath가 아니라 revalidateTag(ASCII 해시)로 무효화한다.
  // revalidatePath('/blog/<한글슬러그>')는 Next의 암묵적 pathname 소프트 태그
  // 인코딩 경로를 타는데, 이 경로가 프로덕션에서 깨져(x-matched-path 미인코딩
  // 유출 확인) 한글 슬러그 글에는 사실상 아무 효과가 없었다(실측: 반복 호출해도
  // 캐시 age가 전혀 리셋 안 됨). getPost/getGuide가 같은 해시 태그로 캐싱되므로
  // revalidateTag만으로 해당 글 전체(본문+댓글+관련글 등)가 재생성된다.
  if (type === 'guide') {
    revalidatePath('/engineer');
    revalidatePath('/engineer/[slug]', 'page');
    if (slug) revalidateTag(guideCacheTag(slug), 'max');
  } else {
    revalidatePath('/blog/[slug]', 'page');
    if (slug) revalidateTag(postCacheTag(slug), 'max');
  }

  return NextResponse.json({ revalidated: true, type, slug });
}
