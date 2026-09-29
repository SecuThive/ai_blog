import type { SupabaseClient } from '@supabase/supabase-js';
import type { Locale } from '@/i18n/config';
import { tagValue, I18N_TITLE_PREFIX, I18N_EXCERPT_PREFIX } from '@/i18n/content';

// 목록·관련글 쿼리는 egress 절감을 위해 본문(content)을 가져오지 않는다.
// 영문 제목/요약은 우선순위상 i18n.title/i18n.excerpt 태그 → content_evidence.en →
// 본문 속 <!--NodelogEN--> 블록 순으로 결정되므로, 태그·evidence가 비어 있는
// "예외 행"만 본문 블록이 필요하다. 이 헬퍼는 en 렌더에서 그런 행만 골라
// id로 content를 추가 조회해 채워 넣는다(ko 렌더·정상 행은 추가 조회 0).
// 실패해도 원본 행을 그대로 돌려준다(→ 한국어 제목 폴백, 렌더는 계속).

interface EnFallbackRow {
  id: number;
  tags?: string[] | null;
  content_evidence?: unknown;
  content?: string | null;
}

function evidenceHas(evidence: unknown, key: 'title' | 'excerpt'): boolean {
  if (!evidence || typeof evidence !== 'object') return false;
  const en = (evidence as { en?: unknown }).en;
  if (!en || typeof en !== 'object') return false;
  const v = (en as Record<string, unknown>)[key];
  return typeof v === 'string' && v.trim().length > 0;
}

export async function withEnFallbackContent<T extends EnFallbackRow>(
  client: SupabaseClient,
  table: 'posts' | 'engineer_guides',
  rows: T[],
  locale: Locale,
  needs: { title?: boolean; excerpt?: boolean } = { title: true, excerpt: true },
): Promise<T[]> {
  if (locale !== 'en' || rows.length === 0) return rows;
  const missing = rows.filter((r) => {
    if (typeof r.content === 'string' && r.content.length > 0) return false;
    const needTitle = needs.title !== false
      && !tagValue(r.tags, I18N_TITLE_PREFIX) && !evidenceHas(r.content_evidence, 'title');
    const needExcerpt = needs.excerpt === true
      && !tagValue(r.tags, I18N_EXCERPT_PREFIX) && !evidenceHas(r.content_evidence, 'excerpt');
    return needTitle || needExcerpt;
  });
  if (missing.length === 0) return rows;
  try {
    const { data, error } = await client
      .from(table)
      .select('id,content')
      .in('id', missing.map((r) => r.id));
    if (error || !data) return rows;
    const byId = new Map<number, string | null>(
      (data as { id: number; content: string | null }[]).map((d) => [d.id, d.content]),
    );
    return rows.map((r) => (byId.has(r.id) ? { ...r, content: byId.get(r.id) ?? null } : r));
  } catch (e) {
    console.error('withEnFallbackContent 실패:', e);
    return rows;
  }
}
