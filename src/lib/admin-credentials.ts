import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
// The legacy email field accepts a username or an email login identifier.
export type AdminAccount = { email: string; passwordHash: string };
export function accounts(): AdminAccount[] {
  try {
    const entries: unknown = JSON.parse(process.env.ADMIN_USERS_JSON || '[]');
    if (!Array.isArray(entries)) return [];
    return entries.filter((a): a is AdminAccount => typeof a?.email === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._@+\-]{2,253}$/.test(a.email) && typeof a?.passwordHash === 'string' && /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(a.passwordHash));
  } catch { return []; }
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password: string, hash?: string) {
  const [, salt, expected] = (hash || `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
  const actual = await derive(password, salt, 64) as Buffer;
  return timingSafeEqual(actual, Buffer.from(expected, 'hex')) && Boolean(hash);
}
function secret() {
  const key = process.env.ADMIN_SESSION_SECRET;
  if (!key || key.length < 32) throw new Error('Administrator session secret is not configured');
  return key;
}
function fingerprint(account: AdminAccount) { return createHash('sha256').update(account.passwordHash).digest('hex'); }
export function signSession(account: AdminAccount, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ email: account.email.toLowerCase(), exp: Math.floor(now / 1000) + 3600, credential: fingerprint(account), nonce: randomBytes(16).toString('hex') })).toString('base64url');
  return `${payload}.${createHmac('sha256', secret()).update(payload).digest('base64url')}`;
}
export function verifySession(token: string, now = Date.now()): AdminAccount | null {
  try {
    if (token.length > 2048) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    const expected = createHmac('sha256', secret()).update(payload).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!Number.isFinite(data.exp) || data.exp <= now / 1000 || data.exp > now / 1000 + 3600) return null;
    return accounts().find(a => a.email.toLowerCase() === data.email && fingerprint(a) === data.credential) || null;
  } catch { return null; }
}
// Bounded process-local limiter. Also configure an edge rate limit for multi-instance deployments.
const attempts = new Map<string, { count: number; until: number }>();
export function allowLogin(email: string, now = Date.now()): boolean {
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  const key = createHash('sha256').update(email.toLowerCase()).digest('hex');
  for (const [name, max, window] of [['global', 50, 60_000], [key, 5, 15 * 60_000]] as const) {
    const entry = attempts.get(name) || { count: 0, until: now + window };
    entry.count++; attempts.set(name, entry);
    if (entry.count > max) return false;
  }
  return true;
}
