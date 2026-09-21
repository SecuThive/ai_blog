import { makeFreshClient } from './supabase';
import { NOINDEX_POST_SLUGS } from './noindexPosts';

// 홈 편집 기준은 색인 정책과 별개다. 좋은 런북의 색인 상태는 유지한다.
const PROMOTIONAL = /완벽|완전\s*가이드|필독|마스터/;

function isPromotionalHomePost(title: string, slug: string): boolean {
  return PROMOTIONAL.test(title) || PROMOTIONAL.test(slug);
}

export async function getHomePostIds(limit: number, category?: string): Promise<number[]> {
  const client = makeFreshClient();
  const ids: number[] = [];
  const pageSize = 100;
  // 제목·slug만 먼저 검사하고 선택된 글의 본문만 호출 측에서 가져온다.
  for (let offset = 0; ids.length < limit; offset += pageSize) {
    let query = client.from('posts')
      .select('id,title,slug')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;
    for (const post of data ?? []) {
      if (!NOINDEX_POST_SLUGS.has(post.slug) && !isPromotionalHomePost(post.title, post.slug)) {
        ids.push(post.id);
        if (ids.length === limit) break;
      }
    }
    if (!data || data.length < pageSize) break;
  }
  return ids;
}
