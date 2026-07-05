import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/posts/covered-topics — 이미 발행된 글의 제목·태그 목록.
 * 글 생성 파이프라인이 "주제 선정 전에" 호출해 중복 주제를 피하기 위한 용도.
 * (같은 주제를 생성하면 POST /api/posts 가 held_as_draft로 보류하므로,
 *  사전에 이 목록과 대조해 다른 주제를 고르는 것이 발행 슬롯 낭비를 막는다.)
 *
 * 쿼리: ?category=개발 (선택), ?days=90 (선택, 최근 N일만)
 */
export async function GET(req: NextRequest) {
  const key = req.headers.get('x-api-key');
  if (key !== process.env.BLOG_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const days = Number(searchParams.get('days') ?? 0);

  const sb = supabaseAdmin();
  let q = sb
    .from('posts')
    .select('title,category,tags,published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (category) q = q.eq('category', category);
  if (days > 0) {
    const since = new Date(Date.now() - days * 86400_000).toISOString();
    q = q.gte('published_at', since);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const topics = (data ?? []).map(p => ({
    title: p.title,
    category: p.category,
    tags: (p.tags ?? []).filter((t: string) => !/^(series:|ep:)/.test(t)),
  }));

  return NextResponse.json({
    count: topics.length,
    guidance: '아래 제목과 같은 에러/주제는 다시 생성하지 말 것. 제목 토큰 유사도 0.5 이상이면 발행이 자동 보류됨.',
    topics,
  });
}
