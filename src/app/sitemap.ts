import { supabase } from '@/lib/supabase';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nodelog.kr';

  const { data } = await supabase
    .from('posts')
    .select('slug,published_at')
    .eq('status', 'published');

  const posts = ((data ?? []) as { slug: string; published_at: string }[]).map(p => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.published_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    ...posts,
  ];
}
