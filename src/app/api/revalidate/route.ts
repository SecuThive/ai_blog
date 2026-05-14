import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  if (req.headers.get('x-api-key') !== process.env.BLOG_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  revalidatePath('/');
  revalidatePath('/blog');
  return NextResponse.json({ revalidated: true });
}
