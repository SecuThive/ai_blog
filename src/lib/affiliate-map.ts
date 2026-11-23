export type AffiliateProgram = { id: string; name: string; pitch: string; envUrl?: string };

// Only issued tracking URLs activate a recommendation. Generic homepages are not affiliate links.
export const AFFILIATES: Record<string, AffiliateProgram> = {
  inflearn: { id: 'inflearn', name: '인프런', pitch: '관련 실무 강의를 확인하세요.', envUrl: process.env.AFFILIATE_URL_INFLEARN },
  cafe24: { id: 'cafe24', name: '카페24 호스팅', pitch: '국내 호스팅 상품을 비교해 보세요.', envUrl: process.env.AFFILIATE_URL_CAFE24 },
  cloudways: { id: 'cloudways', name: 'Cloudways', pitch: '관리형 클라우드 호스팅을 비교해 보세요.', envUrl: process.env.AFFILIATE_URL_CLOUDWAYS },
  hostinger: { id: 'hostinger', name: 'Hostinger', pitch: '워드프레스 호스팅 상품을 비교해 보세요.', envUrl: process.env.AFFILIATE_URL_HOSTINGER },
  make: { id: 'make', name: 'Make', pitch: '노코드 자동화 시나리오를 구성해 보세요.', envUrl: process.env.AFFILIATE_URL_MAKE },
};

export const CATEGORY_MAP: Record<string, string[]> = {
  'AI & 자동화': ['make'], 'AI 자동화': ['make'],
  '클라우드': ['cloudways', 'cafe24'], '인프라': ['cloudways', 'cafe24'],
  '개발': ['inflearn'], '데이터베이스': ['inflearn', 'cloudways'],
  '툴 리뷰': [], '보안': [], 'IT 트렌드': [],
};

export function affiliatePrograms(category: string, tags: string[]): (AffiliateProgram & { url: string })[] {
  const candidates = [...(CATEGORY_MAP[category] ?? [])];
  if (tags.some(t => /워드프레스|wordpress|쇼핑몰/i.test(t))) candidates.unshift('hostinger');
  return [...new Set(candidates)].flatMap(id => {
    const program = AFFILIATES[id];
    if (!program?.envUrl) return [];
    try {
      const url = new URL(program.envUrl);
      if (url.protocol !== 'https:') return [];
      return [{ ...program, url: url.toString() }];
    } catch { return []; }
  }).slice(0, 2);
}
