import { createHash } from 'crypto';

// 한글(비-ASCII) 슬러그를 캐시 태그/키에 그대로 쓰면 Next/Vercel의 암묵적
// pathname 기반 소프트 태그(`_N_T_<pathname>`) 인코딩 경로를 타게 되는데,
// 이 경로가 프로덕션에서 깨져(x-matched-path 등에 인코딩 안 된 원본 바이트가
// 그대로 나감) ISR 백그라운드 재생성·수동 revalidate가 전혀 먹히지 않는
// 문제가 실측 확인됐다(글 상세 대부분이 슬러그가 한글이라 수십 시간째 고정).
// 이를 피하려고 slug 대신 항상 짧은 hex 해시(순수 ASCII)를 명시적
// revalidateTag()/unstable_cache 태그로 쓴다 — 언어와 무관하게 항상 안전.
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
