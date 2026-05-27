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
      // 네이버 크롤러
      { userAgent: 'Yeti',          allow: '/' },
      { userAgent: 'NaverBot',      allow: '/' },
      // AI crawlers — allow full indexing for GEO (generative engine optimization)
      // Allow: /* overrides Cloudflare-managed Disallow: / (longer path wins per RFC 9309)
      { userAgent: 'GPTBot',                  allow: ['/*'] },
      { userAgent: 'OAI-SearchBot',            allow: ['/*'] },
      { userAgent: 'ChatGPT-User',             allow: ['/*'] },
      { userAgent: 'Claude-Web',               allow: ['/*'] },
      { userAgent: 'ClaudeBot',                allow: ['/*'] },
      { userAgent: 'Claude-User',              allow: ['/*'] },
      { userAgent: 'Claude-SearchBot',         allow: ['/*'] },
      { userAgent: 'Anthropic-ai',             allow: ['/*'] },
      { userAgent: 'PerplexityBot',            allow: ['/*'] },
      { userAgent: 'Perplexity-User',          allow: ['/*'] },
      { userAgent: 'Googlebot',                allow: ['/*'] },
      { userAgent: 'Google-Extended',          allow: ['/*'] },
      { userAgent: 'bingbot',                  allow: ['/*'] },
      { userAgent: 'CCBot',                    allow: ['/*'] },
      { userAgent: 'DuckAssistBot',            allow: ['/*'] },
      { userAgent: 'meta-externalagent',       allow: ['/*'] },
      { userAgent: 'FacebookBot',              allow: ['/*'] },
      { userAgent: 'Applebot-Extended',        allow: ['/*'] },
      { userAgent: 'Google-CloudVertexBot',    allow: ['/*'] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
