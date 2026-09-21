import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isLocale } from '@/i18n/config';
import { I18N_TITLE_PREFIX, I18N_EXCERPT_PREFIX, tagValue } from '@/i18n/content';
import { categoryLabel, engineerCatLabel } from '@/i18n/categories';
import { containsHangul } from '@/i18n/display';

function escape(q: string) {
  return q.replace(/[%_\\]/g, c => `\\${c}`);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('q')?.trim() ?? '';
  const source = searchParams.get('source') ?? 'all';
  const localeRaw = searchParams.get('locale');
  const locale = isLocale(localeRaw) ? localeRaw : 'ko';
  if (raw.length < 1) return NextResponse.json([]);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  const client = createClient(url, key);

  // 키워드를 공백 기준으로 분리해 각각 OR 검색 → 단일 키워드보다 넓은 매칭
  const terms = raw.split(/\s+/).filter(Boolean).slice(0, 5);
  const q = escape(raw);

  // 제목 완전 매칭 우선 + 각 term별 부분 매칭
  const buildOr = (cols: string[]) => {
    const parts: string[] = [];
    for (const col of cols) {
      parts.push(`${col}.ilike.%${q}%`);
      for (const t of terms) {
        if (t !== raw) parts.push(`${col}.ilike.%${escape(t)}%`);
      }
    }
    return parts.join(',');
  };

  const [postsResult, guidesResult] = await Promise.all([
    source === 'guides'
      ? Promise.resolve({ data: [] as Record<string, unknown>[] })
      : client
          .from('posts')
          .select('id,title,slug,excerpt,category,tags,published_at,views')
          .eq('status', 'published')
          .or(buildOr(['title', 'excerpt', 'category']))
          .order('views', { ascending: false })
          .limit(source === 'posts' ? 10 : 6),
    source === 'posts'
      ? Promise.resolve({ data: [] as Record<string, unknown>[] })
      : client
          .from('engineer_guides')
          .select('id,title,slug,summary,category,tags,created_at,views')
          .eq('status', 'published')
          .or(buildOr(['title', 'summary', 'category']))
          .order('views', { ascending: false })
          .limit(source === 'guides' ? 10 : 5),
  ]);

  // 클라이언트 사이드 관련도 정렬: 제목에 검색어 포함 시 상위
  function scorePost(title: string): number {
    const t = title.toLowerCase();
    const rq = raw.toLowerCase();
    if (t.startsWith(rq)) return 3;
    if (t.includes(rq)) return 2;
    if (terms.some(term => t.includes(term.toLowerCase()))) return 1;
    return 0;
  }

  const posts = (postsResult.data ?? [])
    .map((p) => {
      const tags = (p.tags as string[] | null) ?? [];
      const title = locale === 'en'
        ? (tagValue(tags, I18N_TITLE_PREFIX) || String(p.title ?? ''))
        : String(p.title ?? '');
      const excerpt = locale === 'en'
        ? (tagValue(tags, I18N_EXCERPT_PREFIX) || String(p.excerpt ?? ''))
        : String(p.excerpt ?? '');
      return {
        ...p,
        title,
        excerpt,
        category: categoryLabel(String(p.category ?? ''), locale),
        source: 'post',
        _score: scorePost(title),
      };
    })
    .filter((p) => locale !== 'en' || !containsHangul(String(p.title)))
    .sort((a, b) => (b._score as number) - (a._score as number))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ _score, ...p }) => p);

  const guides = (guidesResult.data ?? [])
    .map((g) => {
      const tags = (g.tags as string[] | null) ?? [];
      const title = locale === 'en'
        ? (tagValue(tags, I18N_TITLE_PREFIX) || String(g.title ?? ''))
        : String(g.title ?? '');
      const excerpt = locale === 'en'
        ? (tagValue(tags, I18N_EXCERPT_PREFIX) || String(g.summary ?? ''))
        : String(g.summary ?? '');
      return {
        id: g.id,
        title,
        slug: g.slug,
        excerpt,
        category: engineerCatLabel(String(g.category ?? ''), locale),
        tags: g.tags,
        published_at: g.created_at,
        views: g.views,
        source: 'guide',
        _score: scorePost(title),
      };
    })
    .filter((g) => locale !== 'en' || !containsHangul(String(g.title)))
    .sort((a, b) => b._score - a._score)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ _score, ...g }) => g);

  return NextResponse.json([...posts, ...guides]);
}
