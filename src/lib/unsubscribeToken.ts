// 뉴스레터 수신거부 토큰.
//
// - 링크에 이메일을 넣지 않는다(URL은 분석 도구·로그·Referer로 새기 쉽다). 대신 subscribers.id와
//   서버 비밀키로 만든 HMAC 서명을 쓴다: /unsubscribe?t=<id>.<sig>
// - 비밀키: UNSUBSCRIBE_TOKEN_SECRET (32자 이상 무작위 문자열). Vercel 환경변수에 운영자가 직접 설정해야 한다.
//   미설정이면 토큰을 만들지도 검증하지도 않는다(메일에는 이메일 회신 방식의 해지 안내만 들어간다).
// - 링크를 여는 것(GET)만으로는 해지하지 않는다. 메일 보안 스캐너가 링크를 미리 열어도 해지되지 않도록
//   /unsubscribe 화면에서 버튼을 눌러 POST /api/unsubscribe 로 처리한다.
import { createHmac, timingSafeEqual } from 'node:crypto';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';
export const UNSUBSCRIBE_CONTACT = 'thive8564@gmail.com';

function secret(): string | null {
  const s = process.env.UNSUBSCRIBE_TOKEN_SECRET ?? '';
  return s.length >= 32 ? s : null;
}

function sign(id: number, key: string): string {
  return createHmac('sha256', key).update(`nodelog-unsubscribe:v1:${id}`).digest('base64url').slice(0, 32);
}

export function createUnsubscribeToken(id: number): string | null {
  const key = secret();
  if (!key || !Number.isSafeInteger(id) || id <= 0) return null;
  return `${id}.${sign(id, key)}`;
}

/** 유효하면 subscribers.id, 아니면 null. */
export function verifyUnsubscribeToken(token: unknown): number | null {
  const key = secret();
  if (!key || typeof token !== 'string') return null;
  const m = /^(\d{1,15})\.([A-Za-z0-9_-]{32})$/.exec(token);
  if (!m) return null;
  const id = Number(m[1]);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const expected = Buffer.from(sign(id, key));
  const given = Buffer.from(m[2]);
  return expected.length === given.length && timingSafeEqual(expected, given) ? id : null;
}

/** 메일 본문에 넣을 수신거부 링크. 비밀키가 없으면 회신 메일 링크로 대체한다. */
export function unsubscribeHref(id: number): string {
  const token = createUnsubscribeToken(id);
  if (token) return `${SITE_URL}/unsubscribe?t=${encodeURIComponent(token)}`;
  return `mailto:${UNSUBSCRIBE_CONTACT}?subject=${encodeURIComponent('Nodelog 뉴스레터 구독 해지 요청')}`;
}
