import { cookies } from 'next/headers';
import { ADMIN_COOKIE, validOrigin } from './admin-policy';
import { verifySession } from './admin-credentials';

export async function adminUser() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const account = verifySession(token);
  return account ? { email: account.email, id: account.email } : null;
}
export function sameOrigin(request: Request) {
  return validOrigin(request, process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_SITE_URL : undefined);
}
export function adminJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
}
