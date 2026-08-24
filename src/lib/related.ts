import { publicTags } from './utils';

/**
 * "관련 글" 랭킹 — 태그·카테고리 유사도 기반.
 * 서버 컴포넌트에서 이미 조회된 후보 풀(들)을 합쳐 점수순으로 정렬한다.
 * DB 왕복은 호출부(getRelatedPosts 등)에서 발생하며, 이 함수는 순수 계산만 수행한다.
 */

export interface RelatableItem {
  id: number;
  category: string;
  tags: string[];
}

function tagOverlapCount(currentTags: Set<string>, candidateTags: string[]): number {
  let n = 0;
  for (const t of publicTags(candidateTags)) {
    if (currentTags.has(t.toLowerCase())) n++;
  }
  return n;
}

/**
 * 여러 후보 풀(태그 매칭, 카테고리 매칭, 인기/최신 폴백 등)을 합쳐 중복 제거 후
 * 태그 겹침(가중치 2) + 카테고리 일치(가중치 2)로 점수를 매겨 정렬한다.
 * 동점이면 먼저 등장한 풀(더 관련성 높은 풀을 앞에 넣을 것)의 순서를 우선한다.
 */
export function rankRelated<T extends RelatableItem>(current: RelatableItem, pools: T[][]): T[] {
  const currentTags = new Set(publicTags(current.tags).map(t => t.toLowerCase()));
  const ranked = new Map<number, { item: T; score: number; order: number }>();
  let order = 0;
  for (const pool of pools) {
    for (const item of pool) {
      if (item.id === current.id || ranked.has(item.id)) continue;
      const categoryScore = item.category === current.category ? 2 : 0;
      const tagScore = tagOverlapCount(currentTags, item.tags) * 2;
      ranked.set(item.id, { item, score: categoryScore + tagScore, order: order++ });
    }
  }
  return [...ranked.values()]
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map(v => v.item);
}

/** rankRelated 상위 1건이 "확실히 연관 있다"고 볼 만한 점수(태그 2개 이상 겹치거나, 카테고리+태그 1개 겹침)인지 판단.
 *  본문 중간 콘텍스트 링크는 이 기준을 넘을 때만 노출해 기계적 삽입을 피한다. */
export function isStronglyRelated<T extends RelatableItem>(current: RelatableItem, item: T): boolean {
  const currentTags = new Set(publicTags(current.tags).map(t => t.toLowerCase()));
  const tagScore = tagOverlapCount(currentTags, item.tags);
  const sameCategory = item.category === current.category;
  return tagScore >= 2 || (sameCategory && tagScore >= 1);
}
