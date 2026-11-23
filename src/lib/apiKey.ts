import { createHash, timingSafeEqual } from 'node:crypto';

const MIN_KEY_LENGTH = 16;

// 키가 비어 있거나 너무 짧으면 어떤 요청도 통과시키지 않는다(미설정 환경에서 빈 헤더로 통과하는 사고 방지).
// 해시 후 timingSafeEqual로 비교해 길이·내용에 따른 응답 시간 차이를 없앤다.
export function apiKeyValid(headers: Headers, expected: string | undefined = process.env.BLOG_API_KEY): boolean {
  if (!expected || expected.length < MIN_KEY_LENGTH) return false;
  const given = headers.get('x-api-key');
  if (!given) return false;
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}
