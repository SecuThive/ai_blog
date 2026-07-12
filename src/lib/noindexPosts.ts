import noindexSlugs from './noindex-slugs.json';

/**
 * 품질 감사(CONTENT_AUDIT)에서 58점 미만으로 분류된 글의 slug 목록.
 * 2026-07 애드센스 '저가치 콘텐츠' 거절 대응 — 색인 코퍼스를 최정예로 압축한다.
 * 색인 제외(noindex, follow) + sitemap 제외. 글 자체는 계속 열람 가능하며,
 * 보강 후 scripts/score-content-quality.mjs 재실행으로 목록에서 자동 복귀한다.
 * (목록 생성: node scripts/score-content-quality.mjs → src/lib/noindex-slugs.json)
 */
export const NOINDEX_POST_SLUGS = new Set<string>(noindexSlugs as string[]);
