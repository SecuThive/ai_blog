import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Public client (read-only for blog pages)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client (for API routes that write data)
export const supabaseAdmin = () =>
  createClient(supabaseUrl, supabaseServiceKey);

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
