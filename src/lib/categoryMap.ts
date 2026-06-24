/** 한국어 카테고리명 → 영어 URL 슬러그 */
export const CAT_TO_SLUG: Record<string, string> = {
  'AI & 자동화': 'ai-automation',
  '개발': 'development',
  '툴 리뷰': 'tool-reviews',
  'IT 트렌드': 'it-trends',
  '보안': 'security',
  '인프라': 'infrastructure',
};

/** 영어 슬러그 → 한국어 카테고리명 */
export const SLUG_TO_CAT: Record<string, string> = Object.fromEntries(
  Object.entries(CAT_TO_SLUG).map(([k, v]) => [v, k])
);

/** 카테고리 URL 파라미터 반환 (locale에 따라 슬러그 또는 한국어) */
export function getCatParam(locale: string, cat: string): string {
  return locale === 'en' ? (CAT_TO_SLUG[cat] ?? cat) : cat;
}

/** URL 파라미터를 한국어 카테고리명으로 변환 */
export function getKoreanCat(locale: string, param: string): string {
  return locale === 'en' ? (SLUG_TO_CAT[param] ?? param) : param;
}
