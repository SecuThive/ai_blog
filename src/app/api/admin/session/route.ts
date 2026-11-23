import { cookies } from 'next/headers';
import { ADMIN_COOKIE } from '@/lib/admin-policy';
import { adminJson, sameOrigin } from '@/lib/admin-auth';
import { accounts, allowLogin, signSession, verifyPassword } from '@/lib/admin-credentials';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return adminJson({ error: '허용되지 않은 요청입니다.' }, 403);
  const raw = await request.text();
  if (raw.length > 4096) return adminJson({ error: '요청이 너무 큽니다.' }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return adminJson({ error: '입력을 확인해 주세요.' }, 400); }
  if (typeof body?.email !== 'string' || body.email.length > 254 || typeof body?.password !== 'string' || body.password.length > 1024) return adminJson({ error: '아이디와 비밀번호를 확인해 주세요.' }, 400);
  const email = body.email.trim().toLowerCase();
  if (!allowLogin(email)) return adminJson({ error: '로그인 시도가 많습니다. 15분 후 다시 시도해 주세요.' }, 429);
  try {
    const configured = accounts();
    if (!configured.length || (process.env.ADMIN_SESSION_SECRET?.length || 0) < 32) return adminJson({ error: '관리자 계정 설정이 필요합니다. 사이트 운영자에게 문의해 주세요.' }, 503);
    const account = configured.find(a => a.email.toLowerCase() === email);
    if (!await verifyPassword(body.password, account?.passwordHash) || !account) return adminJson({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, 401);
    (await cookies()).set(ADMIN_COOKIE, signSession(account), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 3600 });
    return adminJson({ ok: true });
  } catch { return adminJson({ error: '로그인 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.' }, 503); }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return adminJson({ error: '허용되지 않은 요청입니다.' }, 403);
  (await cookies()).delete(ADMIN_COOKIE);
  return adminJson({ ok: true });
}
