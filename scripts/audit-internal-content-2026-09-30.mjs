// Read-only audit against the local Nodelog PostgREST instance.
// Usage: node scripts/audit-internal-content-2026-09-30.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const lines = readFileSync('/Users/mainthive/.secrets/nodelog_keys.env', 'utf8').split('\n');
const env = Object.fromEntries(lines.filter((line) => line.includes('=')).map((line) => {
  const at = line.indexOf('=');
  return [line.slice(0, at), line.slice(at + 1).trim().replace(/^['"]|['"]$/g, '')];
}));
const key = process.env.NODELOG_SERVICE_ROLE_KEY || env.NODELOG_SERVICE_ROLE_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}` };
const posts = [];
for (let offset = 0; ; offset += 1000) {
  const url = new URL('http://127.0.0.1:3300/posts');
  url.searchParams.set('select', 'id,slug,title,excerpt,content,tags,category,status,published_at,updated_at,reviewed_at,content_evidence');
  url.searchParams.set('status', 'eq.published');
  url.searchParams.set('order', 'id.asc');
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('limit', '1000');
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`PostgREST ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const batch = await response.json();
  posts.push(...batch);
  if (batch.length < 1000) break;
}
const series = new Map();
for (const post of posts) {
  for (const tag of post.tags || []) {
    if (tag.startsWith('series:')) {
      const name = tag.slice(7);
      series.set(name, [...(series.get(name) || []), { id: post.id, title: post.title, tags: post.tags }]);
    }
  }
}
const thin = posts.filter((p) => (p.content || '').replace(/\s/g, '').length < 3000);
const withoutSources = posts.filter((p) => !/https?:\/\//.test(p.content || ''));
const code = posts.filter((p) => /```/.test(p.content || ''));
const titleBait = posts.filter((p) => /완벽|완전 정복|1위|100%|2배|필독|총정리|끝판왕|마스터|30초|5분/.test(p.title || ''));
const result = { auditedAt: new Date().toISOString(), posts, series: Object.fromEntries(series), stats: {
  published: posts.length, codePosts: code.length, withoutSources: withoutSources.length,
  thinUnder3000: thin.length, baitTitles: titleBait.length,
  series: series.size, singletonSeries: [...series.values()].filter((items) => items.length === 1).length,
}};
writeFileSync('/tmp/nodelog-content-audit-2026-09-30.json', JSON.stringify(result));
console.log(result.stats);
console.log('Singleton series:', [...series].filter(([, items]) => items.length === 1).map(([name, items]) => `${name}: #${items[0].id}`).join(' | '));
console.log('Bait titles:', titleBait.slice(0, 25).map((p) => `#${p.id} ${p.title}`).join(' | '));
