import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

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

  if (type === 'guide') {
    revalidatePath('/engineer');
    revalidatePath('/engineer/[slug]', 'page');
    if (slug) revalidatePath(`/engineer/${slug}`);
  } else {
    revalidatePath('/blog/[slug]', 'page');
    if (slug) revalidatePath(`/blog/${slug}`);
  }

  return NextResponse.json({ revalidated: true, type, slug });
}
