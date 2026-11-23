export const CONTACT_LIMITS = { name: 100, email: 254, type: 50, company: 100, message: 5000 } as const;
export const MAX_BODY_BYTES = 16 * 1024;

const EMAIL_RE = /^[^\s@<>"',;:\\]+@[^\s@<>"',;:\\]+\.[^\s@<>"',;:\\]{2,}$/;
const CONTROL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

export type ContactInput = { name: string; email: string; type: string; company: string; message: string };

export function parseContact(body: unknown): { ok: true; value: ContactInput } | { ok: false; error: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const read = (key: keyof typeof CONTACT_LIMITS) => {
    const v = b[key];
    return typeof v === 'string' ? v.replace(CONTROL_RE, '').trim() : '';
  };
  const value: ContactInput = {
    name: read('name'),
    email: read('email').toLowerCase(),
    type: read('type'),
    company: read('company'),
    message: read('message'),
  };
  if (!value.name || !value.email || !value.message || b.privacy_consent !== true) {
    return { ok: false, error: '필수 항목을 모두 입력해주세요.' };
  }
  for (const key of Object.keys(CONTACT_LIMITS) as (keyof typeof CONTACT_LIMITS)[]) {
    if (value[key].length > CONTACT_LIMITS[key]) {
      return { ok: false, error: `${key === 'message' ? '문의 내용' : '입력값'}이 너무 깁니다. (최대 ${CONTACT_LIMITS[key].toLocaleString()}자)` };
    }
  }
  if (!EMAIL_RE.test(value.email)) return { ok: false, error: '이메일 형식을 확인해주세요.' };
  return { ok: true, value };
}

// 자체 호스팅은 단일 Node 프로세스라 메모리 제한으로 충분하다. 재시작하면 초기화된다.
export function createRateLimiter(limit: number, windowMs: number, maxKeys = 5000) {
  const hits = new Map<string, number[]>();
  return function allow(key: string, now = Date.now()): boolean {
    const recent = (hits.get(key) ?? []).filter(t => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.delete(key);
    hits.set(key, recent);
    if (hits.size > maxKeys) {
      for (const k of hits.keys()) {
        hits.delete(k);
        if (hits.size <= maxKeys) break;
      }
    }
    return true;
  };
}

export function clientIp(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

// 터널·프록시 뒤에서는 서버가 http로 요청을 받으므로 프로토콜은 비교하지 않고 호스트만 비교한다.
export function sameSiteOrigin(headers: Headers): boolean {
  const origin = headers.get('origin');
  if (!origin) return false;
  try {
    const host = (headers.get('x-forwarded-host') || headers.get('host') || '').split(',')[0].trim().toLowerCase();
    return !!host && new URL(origin).host.toLowerCase() === host;
  } catch {
    return false;
  }
}
