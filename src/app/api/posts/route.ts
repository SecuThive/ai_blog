import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, readingTime, toSlug } from '@/lib/supabase';

function auth(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key');
  return key === process.env.BLOG_API_KEY;
}

// GET /api/posts — list published posts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page     = Number(searchParams.get('page') ?? 1);
  const limit    = Number(searchParams.get('limit') ?? 12);
  const category = searchParams.get('category');

  const sb = supabaseAdmin();
  let q = sb
    .from('posts')
    .select('id,title,slug,excerpt,cover_image,category,tags,author,agent_role,views,published_at,content')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (category) q = q.eq('category', category);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const posts = (data ?? []).map(p => ({
    ...p,
    content: undefined,
    reading_time: readingTime(p.content ?? ''),
  }));

  return NextResponse.json({ posts });
}

// POST /api/posts — AI agent creates a post (requires API key)
export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    title, content, excerpt, category = 'AI & 자동화',
    tags = [], author = 'Content Director', agent_role = 'content_director',
    cover_image, status = 'published',
  } = body;

  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
  }

  const sb = supabaseAdmin();

  // Generate unique slug
  let slug = toSlug(title);
  const { data: existing } = await sb.from('posts').select('slug').like('slug', `${slug}%`);
  if (existing && existing.length > 0) slug = `${slug}-${Date.now()}`;

  const finalExcerpt = excerpt || content.replace(/[#*`\[\]]/g, '').slice(0, 160) + '…';

  const { data, error } = await sb.from('posts').insert({
    title: title.slice(0, 200),
    slug,
    content,
    excerpt: finalExcerpt.slice(0, 300),
    cover_image: cover_image ?? null,
    category,
    tags: Array.isArray(tags) ? tags : [],
    author,
    agent_role,
    status,
    views: 0,
    published_at: status === 'published' ? new Date().toISOString() : null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Revalidate blog pages
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'x-api-key': process.env.BLOG_API_KEY! },
    });
  } catch { /* non-critical */ }

  return NextResponse.json({ post: data }, { status: 201 });
}
