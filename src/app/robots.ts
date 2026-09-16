import type { MetadataRoute } from 'next';

/** Paths that burn crawl budget / show up as junk in GSC. Applied to * and named bots
 *  that use `allow: ['/*']` (those groups replace `*`, they do not inherit Disallow). */
const DISALLOW = [
  '/api/',
  '/admin/',
  '/var',
  '/var/',
  '/etc/',
  '/wp-admin',
  '/wp-login.php',
  '/.env',
  // slug-less OG route is not a real page (per-post OG lives under /blog/[slug]/opengraph-image)
  '/blog/opengraph-image',
] as const;

const GEO_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-Web',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'Anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Googlebot',
  'Google-Extended',
  'bingbot',
  'CCBot',
  'DuckAssistBot',
  'meta-externalagent',
  'FacebookBot',
  'Applebot-Extended',
  'Google-CloudVertexBot',
] as const;

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...DISALLOW],
      },
      { userAgent: 'Yeti', allow: '/', disallow: [...DISALLOW] },
      { userAgent: 'NaverBot', allow: '/', disallow: [...DISALLOW] },
      ...GEO_BOTS.map((userAgent) => ({
        userAgent,
        allow: ['/*'] as string[],
        disallow: [...DISALLOW],
      })),
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
