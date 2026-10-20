import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Server-side clients never hold a user session. With supabase-js defaults, auth-js
// starts a 30 s auto-refresh setInterval per client in Node that is never cleared;
// on Node 24+ that timer also captures the request's AsyncLocalStorage context, so
// every per-request client leaked the whole request graph (heap OOM after ~3 days).
const SERVER_AUTH = { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } as const;

function create(url: string, key: string): SupabaseClient {
  return createClient(url, key, { auth: SERVER_AUTH });
}

function makeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  return create(url, key);
}

// Kept for call-site compatibility. Without auth sessions the client is stateless,
// so one shared instance is enough.
export function makeFreshClient() {
  return getSupabase();
}

function makeAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return create(url, key);
}

// Lazy singletons — created on first call, not at module load time
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sb: SupabaseClient | null = null;
export function getSupabase() {
  return (_sb ??= makeClient());
}

let _admin: SupabaseClient | null = null;
export function supabaseAdmin() {
  return (_admin ??= makeAdminClient());
}

// Named export alias for drop-in compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: ReturnType<typeof createClient> = new Proxy({} as any, {
  get(_t, prop) {
    const client = getSupabase();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? (val as (...args: unknown[]) => unknown).bind(client) : val;
  },
});

export function readingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣぀-ヿ一-鿿\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
