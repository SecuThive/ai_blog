import type { MetadataRoute } from 'next';

/**
 * GEO-safe robots:
 * - Named AI/search bots keep `allow: ['/*']` so they beat Cloudflare's Disallow: /
 * - Junk Disallow only on `*` + Googlebot/bingbot (crawl-budget / GSC). AI GEO bots
 *   stay Allow-only so their group has zero Disallow noise.
 * - Never Disallow `/` and never drop `Allow: /*` on GEO bots.
 */
const JUNK = [
  '/api/',
  '/admin/',
  '/var',
  '/var/',
  '/etc/',
  '/wp-admin',
  '/wp-login.php',
  '/.env',
  '/blog/opengraph-image',
] as const;

const SEARCH_BOTS = ['Googlebot', 'bingbot', 'Google-Extended'] as const;

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
        disallow: [...JUNK],
      },
      { userAgent: 'Yeti', allow: '/', disallow: [...JUNK] },
      { userAgent: 'NaverBot', allow: '/', disallow: [...JUNK] },
      ...SEARCH_BOTS.map((userAgent) => ({
        userAgent,
        allow: ['/*'] as string[],
        disallow: [...JUNK],
      })),
      ...GEO_BOTS.map((userAgent) => ({
        userAgent,
        allow: ['/*'] as string[],
      })),
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
