// Execute the real sitemap/metadata modules with only DB and Next cache mocked.
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { runInThisContext } from 'node:vm';
import ts from 'typescript';
const root = process.cwd();
const nativeRequire = createRequire(import.meta.url);
const base = 'https://www.thivelab.com';
process.env.NEXT_PUBLIC_SITE_URL = base;
process.env.NODE_ENV = 'production';
function harness(fail = false) {
  const cache = new Map();
  let cachedData;
  const embedded = `원문\n<!--NodelogEN\n${JSON.stringify({ content: 'Translated guide instructions.' })}\nNodelogEN-->`;
  const post = (slug, extra = {}) => ({ slug, published_at: '2026-01-01', tags: [], category: '개발', content: '원문', ...extra });
  const rows = {
    posts: [post('한글 글'), post('translated', { content_evidence: { en: { content: 'A translated article.' } }, tags: ['series:Single episode'] }), post('title-only', { content_evidence: { en: { title: 'Title only' } } }), post('개인정보-위탁-vs-제3자-제공-차이-동의-널-받아야-할까-2026-가이드')],
    engineer_guides: [{ slug: 'guide-ko', updated_at: '2026-01-01', content: '원문' }, { slug: 'guide-en', updated_at: '2026-01-01', content: embedded }],
  };
  function load(file) {
    file = resolve(file);
    if (!existsSync(file) || statSync(file).isDirectory()) file += '.ts';
    if (file.endsWith('.json')) return JSON.parse(readFileSync(file, 'utf8'));
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} }; cache.set(file, mod);
    const require = (id) => {
      if (id === 'next/cache') return { unstable_cache: fn => async () => { cachedData = await fn(); return cachedData; } };
      if (id === '@/lib/supabase') return { makeFreshClient: () => ({ from: table => ({ select: () => ({ eq: () => ({ abortSignal: async () => ({ data: fail ? null : rows[table], error: fail ? { message: 'fixture outage' } : null }) }) }) }) }) };
      if (id.startsWith('@/')) return load(resolve(root, 'src', id.slice(2)));
      if (id.startsWith('.')) return load(resolve(dirname(file), id));
      return nativeRequire(id);
    };
    const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(require, mod, mod.exports);
    return mod.exports;
  }
  return { load, cached: () => cachedData };
}
function reciprocal(entries) {
  const map = new Map(entries.map(e => [e.url, e]));
  assert.equal(map.size, entries.length, 'no duplicate sitemap URLs');
  for (const entry of entries) for (const url of Object.values(entry.alternates?.languages ?? {})) {
    assert.ok(map.has(url), `missing alternate ${url}`);
    assert.deepEqual(map.get(url).alternates.languages, entry.alternates.languages);
  }
}
const h = harness();
const { siteUrl, languageAlternates } = h.load('src/i18n/metadata.ts');
assert.equal(siteUrl('/blog/한글 글'), `${base}/blog/${encodeURIComponent('한글 글')}`);
assert.equal(siteUrl('/blog/%ED%95%9C%EA%B8%80%20%EA%B8%80'), siteUrl('/blog/한글 글'));
assert.equal(siteUrl('/category/개발', 'en'), `${base}/en/category/development`);
assert.equal(languageAlternates('/blog/title-only', false).en, undefined);
const entries = await h.load('src/app/sitemap.ts').default();
reciprocal(entries);
const urls = new Set(entries.map(e => e.url));
for (const path of ['/blog/translated', '/engineer/guide-en']) assert.ok(urls.has(base + '/en' + path));
for (const path of ['/blog/title-only', '/blog/한글 글', '/engineer/guide-ko']) assert.ok(!urls.has(siteUrl(path, 'en')));
assert.ok(urls.has(siteUrl('/series/Single episode')),'preserve existing single-episode indexing policy');
assert.ok(!urls.has(siteUrl('/blog/개인정보-위탁-vs-제3자-제공-차이-동의-널-받아야-할까-2026-가이드')), 'exclude legacy redirect');
for (const row of [...h.cached().posts, ...h.cached().guides]) {
  assert.ok(!('content' in row) && !('content_evidence' in row), 'cache excludes full article bodies');
}
const fallback = harness(true);
reciprocal(await fallback.load('src/app/sitemap.ts').default());
console.log('PASS: metadata normalization, translation sitemap filtering, reciprocal hreflang, cache size protection, legacy redirect exclusion, preserved series policy and outage fallback');
