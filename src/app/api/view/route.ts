import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/view — increment view count (client-side, sessionStorage-deduped)
export async function POST(req: NextRequest) {
  const { table, id } = await req.json() as { table?: string; id?: number };

  if (!id || typeof id !== 'number') {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const tbl = table === 'engineer_guides' ? 'engineer_guides' : 'posts';
  const sb = supabaseAdmin();

  const { data } = await sb.from(tbl).select('views').eq('id', id).single();
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });

  await sb.from(tbl).update({ views: (data.views ?? 0) + 1 }).eq('id', id);

  return NextResponse.json({ ok: true });
}
