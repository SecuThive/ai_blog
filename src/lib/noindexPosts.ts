import noindexSlugs from './noindex-slugs.json';
import gscProtectedSlugs from './gsc-protected-slugs.json';

/**
 * 품질 감사(CONTENT_AUDIT)에서 58점 미만으로 분류된 글의 slug 목록.
 * 2026-07 애드센스 '저가치 콘텐츠' 거절 대응 — 색인 코퍼스를 최정예로 압축한다.
 * 색인 제외(noindex, follow) + sitemap 제외. 글 자체는 계속 열람 가능하며,
 * 보강 후 scripts/score-content-quality.mjs 재실행으로 목록에서 자동 복귀한다.
 * (목록 생성: node scripts/score-content-quality.mjs → src/lib/noindex-slugs.json)
 *
 * gsc-protected-slugs: GSC 실적상 실제 검색 노출·클릭이 확인된 글은 프로그래매틱
 * 점수가 낮아도 색인을 강제한다(실수요 > 점수 프록시). scorer가 재생성해도 유지.
 */
const GSC_PROTECTED = new Set<string>(gscProtectedSlugs as string[]);
export const GSC_PROTECTED_SLUGS = GSC_PROTECTED;
export const NOINDEX_POST_SLUGS = new Set<string>(
  (noindexSlugs as string[]).filter((s) => !GSC_PROTECTED.has(s))
);
