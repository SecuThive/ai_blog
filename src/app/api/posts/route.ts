import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, readingTime, toSlug } from '@/lib/supabase';

function auth(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key');
  return key === process.env.BLOG_API_KEY;
}

// ── 중복(카니벌라이제이션) 가드 ────────────────────────────────────────────
// 하루 2편 자동 발행 시 이미 다룬 주제를 재생성하는 걸 막는다. 제목 토큰
// Jaccard 유사도가 임계 이상인 기존 발행글이 있으면, 발행하지 않고 draft로
// 보류한다(콘텐츠는 보존, 자동 중복 발행만 차단 — 사람이 검토 후 처리).
const DUP_STOP = new Set(['가이드','완벽','실전','전략','구축','방법','위한','이해','활용','시대','넘어','정리','핵심','필독','기반','대한','만드는','당신','우리','모든','그리고','에러','해결','해결법','진단','원인','런북','가지','완전','정복','및','the','a','to','of','for','vs','and']);
function dupTokens(t: string): Set<string> {
  return new Set(
    (t || '').toLowerCase().replace(/[^a-z0-9가-힣\s]/g, ' ').split(/\s+/)
      .filter(w => w.length > 1 && !DUP_STOP.has(w))
  );
}
function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
}
const DUP_TITLE_THRESHOLD = 0.5; // 제목 토큰 겹침 50% 이상이면 중복으로 간주

async function findNearDuplicate(
  sb: ReturnType<typeof supabaseAdmin>,
  title: string,
): Promise<{ id: number; title: string; slug: string; sim: number } | null> {
  const incoming = dupTokens(title);
  if (incoming.size === 0) return null;
  const { data } = await sb.from('posts').select('id,title,slug').eq('status', 'published');
  let best: { id: number; title: string; slug: string; sim: number } | null = null;
  for (const p of (data ?? []) as { id: number; title: string; slug: string }[]) {
    const sim = jaccard(incoming, dupTokens(p.title));
    if (sim >= DUP_TITLE_THRESHOLD && (!best || sim > best.sim)) {
      best = { id: p.id, title: p.title, slug: p.slug, sim };
    }
  }
  return best;
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

  // 중복 가드: 발행 요청인데 기존 발행글과 제목이 매우 유사하면 draft로 강제 보류.
  // (명시적으로 status='draft'로 들어온 요청은 이미 검토 대상이므로 검사 생략)
  let effectiveStatus = status;
  let heldDuplicate: { id: number; title: string; slug: string; sim: number } | null = null;
  if (status === 'published') {
    heldDuplicate = await findNearDuplicate(sb, title);
    if (heldDuplicate) effectiveStatus = 'draft';
  }

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
    status: effectiveStatus,
    views: 0,
    published_at: effectiveStatus === 'published' ? new Date().toISOString() : null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 중복으로 보류된 경우: 발행하지 않고 draft로 저장했음을 알린다(파이프라인 로그용).
  if (heldDuplicate) {
    return NextResponse.json({
      post: data,
      held_as_draft: true,
      reason: 'near-duplicate of an existing published post',
      duplicate_of: heldDuplicate,
    }, { status: 200 });
  }

  // Revalidate blog pages
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'x-api-key': process.env.BLOG_API_KEY! },
    });
  } catch { /* non-critical */ }

  return NextResponse.json({ post: data }, { status: 201 });
}
