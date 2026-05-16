import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  if (req.headers.get('x-api-key') !== process.env.BLOG_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { slug } = await req.json().catch(() => ({}));
  revalidatePath('/');
  revalidatePath('/blog/[slug]', 'page');
  if (slug) revalidatePath(`/blog/${slug}`);
  return NextResponse.json({ revalidated: true });
}
