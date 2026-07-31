import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function auth(req: NextRequest): boolean {
  return req.headers.get('x-api-key') === process.env.BLOG_API_KEY;
}

// PUT /api/posts/[id] — update post
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const sb = supabaseAdmin();

  const update: Record<string, unknown> = { ...body };
  const { data: existing, error: existingError } = await sb
    .from('posts')
    .select('status,published_at')
    .eq('id', id)
    .single();
  if (existingError || !existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (body.status === 'published' && existing.status !== 'published') {
    if (
      body.approval_confirmed !== true
      || typeof body.reviewed_by !== 'string'
      || body.reviewed_by.trim().length === 0
    ) {
      return NextResponse.json({
        error: 'Publishing requires approval_confirmed=true and a real reviewed_by value',
      }, { status: 400 });
    }
    update.published_at = existing.published_at ?? new Date().toISOString();
    update.reviewed_at = new Date().toISOString();
    update.reviewed_by = body.reviewed_by.trim();
  }
  delete update.approval_confirmed;
  delete update.id;

  const { data, error } = await sb.from('posts').update(update).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ post: data });
}

// DELETE /api/posts/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const sb = supabaseAdmin();
  const { error } = await sb.from('posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// GET /api/posts/[id] — single post (by id or slug)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseAdmin();
  const isNum = /^\d+$/.test(id);

  const q = sb.from('posts').select('*');
  const { data, error } = await (isNum ? q.eq('id', id) : q.eq('slug', id)).single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await sb.from('posts').update({ views: (data.views ?? 0) + 1 }).eq('id', data.id);

  return NextResponse.json({ post: data });
}
