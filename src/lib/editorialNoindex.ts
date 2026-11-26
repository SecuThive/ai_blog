import editorialNoindex from './editorial-noindex.json';

/**
 * 편집 판단으로 검색 색인에서 뺀 글(블로그)·가이드 slug 목록.
 * - own-site 분류(2026-11-26, SNS_BOT 승인): GSC 90일 노출·클릭 0인 저품질·니치 밖 글.
 * - robots 메타(ko/en 모두 index:false, follow:true)와 sitemap 제외에 함께 적용한다.
 * - noindex-slugs.json(홈 추천·광고 범위 전용)과는 별개다.
 */
const data = editorialNoindex as { posts: string[]; guides: string[] };

export const EDITORIAL_NOINDEX_POSTS = new Set<string>(data.posts);
export const EDITORIAL_NOINDEX_GUIDES = new Set<string>(data.guides);
export const EDITORIAL_NOINDEX_ROBOTS = { index: false, follow: true } as const;
