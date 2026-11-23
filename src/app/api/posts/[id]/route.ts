import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiKeyValid } from '@/lib/apiKey';
import { parsePostUpdate } from '@/lib/postUpdate';

function auth(req: NextRequest): boolean {
  return apiKeyValid(req.headers);
}

// PUT /api/posts/[id] — update post
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = parsePostUpdate(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const sb = supabaseAdmin();

  // 허용 목록에 있는 컬럼만 저장한다. 날짜·검토·지표 컬럼과 slug는 API로 직접 쓰지 못한다
  // (발행일/검토 기록을 임의로 찍거나 과거 글의 updated_at을 일괄 갱신하는 경로를 막기 위함.
  // 검토 기록은 아래 발행 승인 흐름에서만 생성된다).
  const update = parsed.update;
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

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: '수정할 항목이 없습니다.' }, { status: 400 });
  }
  const { data, error } = await sb.from('posts').update(update).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ post: data });
}

// DELETE /api/posts/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'id는 숫자여야 합니다.' }, { status: 400 });
  const sb = supabaseAdmin();
  const { error } = await sb.from('posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// GET /api/posts/[id] — single post (by id or slug)
// 공개 API(README 문서화)라 외부 호출자가 어떤 컬럼에 의존하는지 알 수 없고, 선택적 컬럼
// (key_points, title_en 등)의 존재 여부도 코드에서 보장할 수 없어 응답 형태 보존을 위해 '*' 유지.
// 북마크 페이지는 더 이상 이 엔드포인트를 쓰지 않는다(POST /api/bookmarks, 조회수 증가 없음).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseAdmin();
  const isNum = /^\d+$/.test(id);

  const q = sb.from('posts').select('*').eq('status', 'published');
  const { data, error } = await (isNum ? q.eq('id', id) : q.eq('slug', id)).single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await sb.from('posts').update({ views: (data.views ?? 0) + 1 }).eq('id', data.id);

  return NextResponse.json({ post: data });
}
