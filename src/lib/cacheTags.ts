import { createHash } from 'crypto';

// 본문 데이터 캐시와 편집 웹훅이 공유하는 짧은 ASCII 태그.
// HTML의 ISR 캐시와는 별개다. 상세 HTML은 revalidate=0으로 매 요청 렌더링한다.
function tag(prefix: string, slug: string): string {
  const decoded = (() => {
    try {
      return decodeURIComponent(slug);
    } catch {
      return slug;
    }
  })();
  const hash = createHash('sha1').update(decoded).digest('hex').slice(0, 16);
  return `${prefix}-${hash}`;
}

export function postCacheTag(slug: string): string {
  return tag('post', slug);
}

export function guideCacheTag(slug: string): string {
  return tag('guide', slug);
}
