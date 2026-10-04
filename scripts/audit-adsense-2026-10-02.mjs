// Read-only inventory. Run: node --env-file=.env.local scripts/audit-adsense-2026-10-02.mjs
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'node:fs';

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const out = 'docs/adsense-audit-2026-10-02';
mkdirSync(out, { recursive: true });
async function all(table, columns) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(columns).eq('status', 'published').range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}
const [posts, guides] = await Promise.all([
  all('posts', 'id,slug,title,content,category,tags,views,published_at,updated_at,reviewed_at,content_evidence,cover_image'),
  all('engineer_guides', 'id,slug,title,content,category,tags,views,created_at,updated_at'),
]);
const base = 'https://www.thivelab.com';
const esc = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const inventory = [];
function add(path, kind, title = '', id = '', flags = []) {
  for (const localePath of [path, `/en${path === '/' ? '' : path}`]) inventory.push({ url: base + localePath, kind, title, id, flags: flags.join('; ') });
}
for (const path of ['/', '/blog', '/engineer', '/series', '/tags', '/search', '/archive', '/about', '/policy', '/contact', '/privacy', '/terms', '/faq', '/author', '/subscribe', '/unsubscribe', '/curated', '/recommend', '/trending', '/bookmarks', '/security']) add(path, 'route');
const cats = [...new Set(posts.map(p => p.category).filter(Boolean))];
const tags = new Set();
const series = new Set();
for (const post of posts) {
  const flags = [];
  const years = [...post.title.matchAll(/20(?:2[0-9])/g)].map(m => Number(m[0]));
  if (years.some(y => post.published_at && y < Number(post.published_at.slice(0, 4)) - 1)) flags.push('old-year-title-review');
  if (/20(?:2[0-9])년 현재|as of 20(?:2[0-9])|현재 기준/.test(post.content)) flags.push('time-sensitive-claim-review');
  if (/가격|요금|\$\d|USD|법령|규정|버전/.test(post.content)) flags.push('price-version-law-review');
  if (!/https?:\/\//.test(post.content) && !(post.content_evidence?.officialSources?.length)) flags.push('no-inline-source-review');
  if (!post.reviewed_at) flags.push('no-recorded-review');
  if (/!\[[^\]]*\]\(https?:\/\//.test(post.content) || /^https?:\/\//.test(post.cover_image ?? '')) flags.push('external-image-rights-review');
  add(`/blog/${encodeURIComponent(post.slug)}`, 'blog', post.title, post.id, flags);
  for (const tag of post.tags ?? []) {
    if (tag.startsWith('series:')) series.add(tag.slice(7));
    else if (!tag.startsWith('i18n.') && !/^ep:\d+$/.test(tag)) tags.add(tag);
  }
}
for (const guide of guides) {
  const flags = [];
  if (!/https?:\/\//.test(guide.content)) flags.push('no-inline-source-review');
  if (/가격|요금|\$\d|USD|법령|규정|버전/.test(guide.content)) flags.push('price-version-law-review');
  add(`/engineer/${encodeURIComponent(guide.slug)}`, 'engineer-guide', guide.title, guide.id, flags);
}
for (const cat of cats) add(`/category/${encodeURIComponent(cat)}`, 'category', cat);
for (const tag of tags) add(`/tag/${encodeURIComponent(tag)}`, 'tag', tag);
for (const name of series) add(`/series/${encodeURIComponent(name)}`, 'series', name);
const header = ['url', 'kind', 'title', 'id', 'flags'];
writeFileSync(`${out}/public-url-inventory.csv`, [header.join(','), ...inventory.map(row => header.map(key => esc(row[key])).join(','))].join('\n') + '\n');
const count = flag => inventory.filter(row => row.flags.includes(flag)).length;
const summary = { recordedAt: new Date().toISOString(), posts: posts.length, guides: guides.length, categories: cats.length, tags: tags.size, series: series.size, inventoryUrls: inventory.length, signalsNotVerdicts: { oldYearTitle: count('old-year-title-review'), timeSensitive: count('time-sensitive-claim-review'), priceVersionLaw: count('price-version-law-review'), noInlineSource: count('no-inline-source-review'), noRecordedReview: count('no-recorded-review'), externalImageRights: count('external-image-rights-review') } };
writeFileSync(`${out}/inventory-summary.json`, JSON.stringify(summary, null, 2) + '\n');
console.log(summary);
