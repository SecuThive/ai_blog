import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      // AI crawlers — allow full indexing for GEO (generative engine optimization)
      { userAgent: 'GPTBot',        allow: '/' },
      { userAgent: 'ChatGPT-User',  allow: '/' },
      { userAgent: 'Claude-Web',    allow: '/' },
      { userAgent: 'Anthropic-ai',  allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Googlebot',     allow: '/' },
      { userAgent: 'bingbot',       allow: '/' },
      { userAgent: 'CCBot',         allow: '/' },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
